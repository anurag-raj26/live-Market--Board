(function(){
  "use strict";
  var API="https://api.coingecko.com/api/v3", RANGE={1:"1D",7:"7D",30:"30D",90:"90D"};
  var $=id=>document.getElementById(id);
  var css=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  var esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  var cols=()=>[css("--c1"),css("--c3"),css("--c2"),css("--c4"),css("--mute")];
  var S={cur:"usd",coin:"bitcoin",days:7,ms:30000,theme:"",fav:[],sma:false,alerts:{},sort:"rank",dir:1,favOnly:false};
  try{Object.assign(S,JSON.parse(localStorage.getItem("lmb-pro")||"{}"))}catch(e){}
  var save=()=>{try{localStorage.setItem("lmb-pro",JSON.stringify(S))}catch(e){}};
  if(S.theme)document.documentElement.dataset.theme=S.theme;

  var state={paused:false,timer:null}, ready=false, raf=null, hover=-1, query="", rid=0;
  var coins=[], hist=[], disp={bar:[],donut:[]};
  var top5=()=>coins.slice(0,5);
  var sum=(k,a)=>(a||coins).reduce((t,c)=>t+c[k],0);

  function money(v,compact){
    try{return new Intl.NumberFormat("en",{style:"currency",currency:S.cur.toUpperCase(),notation:compact?"compact":"standard",maximumFractionDigits:compact?2:(v<1?4:v<100?2:0)}).format(v)}catch(e){return String(v)}
  }
  var tfmt=t=>{var d=new Date(t);return S.days<=1?d.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}):d.toLocaleDateString([],{day:"numeric",month:"short"})};

  var getJSON=u=>fetch(u).then(r=>{if(!r.ok)throw new Error("HTTP "+r.status);return r.json()});
  function apply(m){
    coins=m.map(x=>({id:x.id,rank:x.market_cap_rank,sym:x.symbol.toUpperCase(),name:x.name,price:x.current_price,cap:x.market_cap,vol:x.total_volume,chg:x.price_change_percentage_24h||0,spark:(x.sparkline_in_7d&&x.sparkline_in_7d.price)||[]}));
    if(disp.bar.length!==5){disp.bar=top5().map(c=>c.vol);disp.donut=top5().map(c=>c.cap)}
  }
  function refresh(){
    var id=++rid;
    return Promise.all([
      getJSON(API+"/coins/markets?vs_currency="+S.cur+"&order=market_cap_desc&per_page=10&page=1&sparkline=true"),
      getJSON(API+"/coins/"+encodeURIComponent(S.coin)+"/market_chart?vs_currency="+S.cur+"&days="+S.days)
    ]).then(r=>{if(id!==rid)return;apply(r[0]);hist=r[1].prices;ready=true;cacheSave(r);fillCoins();labels();table();checkAlerts();animate();ok()});
  }
  function setLive(t,off){$("status").textContent=t;$("live").classList.toggle("paused",!!off||state.paused)}
  var mult=1; 
  var ok=()=>{setLive("Live");$("updated").textContent="Prices from CoinGecko, updated "+new Date().toLocaleTimeString();if(mult>1){mult=1;if(!state.paused)start()}};
  var fail=e=>{
    var limited=e&&/429/.test(e.message);
    if(limited&&mult<8){mult*=2;if(!state.paused)start()}
    setLive(limited?"Rate limited":"Offline, retrying",true);
    $("updated").textContent=(limited?"CoinGecko rate limit reached, slowing down. ":"Could not reach CoinGecko. ")+(ready?"Showing the last saved data. ":"")+"Trying again soon.";
  };
  var cacheSave=r=>{try{localStorage.setItem("lmb-cache",JSON.stringify({k:S.cur+S.coin+S.days,m:r[0],h:r[1].prices}))}catch(e){}};
  function loadCache(){
    try{var c=JSON.parse(localStorage.getItem("lmb-cache")||"null");
      if(c&&c.k===S.cur+S.coin+S.days&&!ready){apply(c.m);hist=c.h;ready=true;fillCoins();labels();table();drawAll()}}catch(e){}
  }
  var change=()=>{setLive("Loading",true);refresh().catch(fail)};
  var poll=()=>{if(ready)refresh().catch(fail)};
  function init(){refresh().then(start).catch(e=>{loadCache();fail(e);setTimeout(init,15000)})}
  function setup(c){
    var dpr=window.devicePixelRatio||1,r=c.getBoundingClientRect();
    if(c.width!==Math.round(r.width*dpr)||c.height!==Math.round(r.height*dpr)){c.width=Math.round(r.width*dpr);c.height=Math.round(r.height*dpr)}
    var x=c.getContext("2d");x.setTransform(dpr,0,0,dpr,0,0);x.clearRect(0,0,r.width,r.height);
    return {x:x,w:r.width,h:r.height};
  }
  function range(a){var lo=Math.min(...a),hi=Math.max(...a),p=(hi-lo)*.15||hi*.002;return [lo-p,hi+p]}
  function grid(g,min,max,pad,fmt){
    g.x.strokeStyle=css("--line");g.x.fillStyle=css("--mute");g.x.font="11px sans-serif";g.x.lineWidth=1;g.x.textAlign="right";g.x.textBaseline="middle";
    for(var i=0;i<=4;i++){
      var y=pad.t+(g.h-pad.t-pad.b)*i/4;
      g.x.beginPath();g.x.moveTo(pad.l,y);g.x.lineTo(g.w-pad.r,y);g.x.stroke();
      g.x.fillText(fmt(max-(max-min)*i/4),pad.l-6,y);
    }
  }
  var path=(g,d,min,max,pad)=>d.map((v,i)=>[pad.l+(g.w-pad.l-pad.r)*i/(d.length-1),pad.t+(g.h-pad.t-pad.b)*(1-(v-min)/(max-min))]);
  var MP={l:72,r:12,t:10,b:24};
  function drawMain(){
    var g=setup($("line")),v=hist.map(p=>p[1]),r=range(v),pad=MP;
    grid(g,r[0],r[1],pad,money);
    var color=css(v[v.length-1]>=v[0]?"--c1":"--c2"),p=path(g,v,r[0],r[1],pad);
    g.x.beginPath();p.forEach((q,i)=>i?g.x.lineTo(q[0],q[1]):g.x.moveTo(q[0],q[1]));
    g.x.strokeStyle=color;g.x.lineWidth=2.2;g.x.lineJoin="round";g.x.stroke();
    g.x.lineTo(p[p.length-1][0],g.h-pad.b);g.x.lineTo(p[0][0],g.h-pad.b);g.x.closePath();
    g.x.globalAlpha=.15;g.x.fillStyle=color;g.x.fill();g.x.globalAlpha=1;
    if(S.sma&&v.length>20){
      var m=v.map((_,i)=>{var w=v.slice(Math.max(0,i-19),i+1);return w.reduce((a,b)=>a+b,0)/w.length});
      g.x.beginPath();path(g,m,r[0],r[1],pad).forEach((q,i)=>i?g.x.lineTo(q[0],q[1]):g.x.moveTo(q[0],q[1]));
      g.x.strokeStyle=css("--c3");g.x.lineWidth=1.5;g.x.stroke();
    }
    var hi=v.indexOf(Math.max(...v)),lo=v.indexOf(Math.min(...v));
    g.x.font="11px sans-serif";g.x.textBaseline="middle";
    [[hi,-9],[lo,10]].forEach(a=>{var q=p[a[0]];g.x.fillStyle=css("--ink");g.x.beginPath();g.x.arc(q[0],q[1],3,0,7);g.x.fill();g.x.fillStyle=css("--mute");g.x.textAlign=q[0]>g.w/2?"right":"left";g.x.fillText(money(v[a[0]]),q[0],q[1]+a[1])});
    g.x.fillStyle=css("--mute");g.x.textBaseline="top";
    [0,.5,1].forEach((f,k)=>{g.x.textAlign=["left","center","right"][k];g.x.fillText(tfmt(hist[Math.round(f*(hist.length-1))][0]),pad.l+(g.w-pad.l-pad.r)*f,g.h-pad.b+7)});
    if(hover>=0&&hover<v.length){
      var q=p[hover],tx=money(v[hover])+"  "+new Date(hist[hover][0]).toLocaleString([],{dateStyle:"medium",timeStyle:"short"});
      g.x.strokeStyle=css("--mute");g.x.setLineDash([4,3]);g.x.beginPath();g.x.moveTo(q[0],pad.t);g.x.lineTo(q[0],g.h-pad.b);g.x.stroke();g.x.setLineDash([]);
      g.x.fillStyle=color;g.x.beginPath();g.x.arc(q[0],q[1],4.5,0,7);g.x.fill();
      g.x.font="600 12px sans-serif";var w=g.x.measureText(tx).width+16,bx=Math.min(Math.max(q[0]-w/2,pad.l),g.w-pad.r-w);
      g.x.fillStyle=css("--ink");g.x.fillRect(bx,pad.t,w,22);g.x.fillStyle=css("--panel");g.x.textAlign="left";g.x.textBaseline="middle";g.x.fillText(tx,bx+8,pad.t+11);
    }
  }
  function drawBar(){
    var g=setup($("bar")),pad={l:62,r:6,t:8,b:22},c=cols(),k=top5(),bw=(g.w-pad.l-pad.r)/k.length,max=Math.max(...k.map(x=>x.vol))*1.15;
    grid(g,0,max,pad,v=>money(v,1));
    g.x.textAlign="center";g.x.textBaseline="top";
    k.forEach((x,i)=>{
      var h=(g.h-pad.t-pad.b)*disp.bar[i]/max,bx=pad.l+bw*i+bw*.18,w=bw*.64,y=g.h-pad.b-h;
      g.x.fillStyle=c[i];g.x.beginPath();
      if(g.x.roundRect)g.x.roundRect(bx,y,w,h,[4,4,0,0]);else g.x.rect(bx,y,w,h);g.x.fill();
      g.x.fillStyle=css("--mute");g.x.fillText(x.sym,bx+w/2,g.h-pad.b+5);
    });
  }
  function drawDonut(){
    var g=setup($("donut")),cx=g.w/2,cy=g.h/2,R=Math.min(g.w,g.h)/2-8,c=cols(),k=top5();
    var tot=disp.donut.reduce((a,b)=>a+b,0),a0=-Math.PI/2;
    disp.donut.forEach((d,i)=>{
      var a1=a0+d/tot*Math.PI*2;
      g.x.beginPath();g.x.arc(cx,cy,R,a0,a1);g.x.arc(cx,cy,R*.62,a1,a0,true);g.x.closePath();
      g.x.fillStyle=c[i];g.x.fill();g.x.strokeStyle=css("--panel");g.x.lineWidth=2;g.x.stroke();a0=a1;
    });
    var t=disp.donut.indexOf(Math.max(...disp.donut));
    g.x.fillStyle=css("--ink");g.x.font="600 20px sans-serif";g.x.textAlign="center";g.x.textBaseline="middle";
    g.x.fillText(Math.round(disp.donut[t]/tot*100)+"%",cx,cy-6);
    g.x.fillStyle=css("--mute");g.x.font="12px sans-serif";g.x.fillText(k[t].sym,cx,cy+14);
    $("donut-legend").innerHTML=k.map((x,i)=>`<span><i style="background:${c[i]}"></i>${esc(x.name)} ${Math.round(disp.donut[i]/tot*100)}%</span>`).join("");
  }
  var vis=id=>$(id).getBoundingClientRect().width>40;
  function drawAll(){
    if(!ready||hist.length<2)return;
    if(vis("line"))drawMain();if(vis("bar"))drawBar();if(vis("donut"))drawDonut();
  }
  function labels(){
    var v=hist.map(p=>p[1]),a=v[0],b=v[v.length-1],ch=(b-a)/a*100,c=coins.find(x=>x.id===S.coin);
    $("t-line").textContent=(c?c.name:S.coin)+" price ("+S.cur.toUpperCase()+")";
    $("v-line").innerHTML=money(b)+`<small class="${ch>=0?"up":"down"}">${ch>=0?"▲":"▼"} ${Math.abs(ch).toFixed(2)}% ${RANGE[S.days]}</small>`;
    $("s-cap").textContent=money(sum("cap"),1);$("s-vol").textContent=money(sum("vol"),1);
    var g=coins.slice().sort((x,y)=>y.chg-x.chg)[0];
    $("s-gain").innerHTML=esc(g.sym)+`<small class="${g.chg>=0?"up":"down"}">${g.chg>=0?"▲":"▼"} ${Math.abs(g.chg).toFixed(2)}%</small>`;
  }
  function spark(a,up){
    if(a.length<2)return "";
    var lo=Math.min(...a),hi=Math.max(...a),pts=a.filter((_,i)=>i%3===0).map((v,i,b)=>(i/(b.length-1)*90).toFixed(1)+","+(24-(v-lo)/(hi-lo||1)*22).toFixed(1)).join(" ");
    return `<svg width="90" height="26" viewBox="0 0 90 26" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="${up?"var(--c1)":"var(--c2)"}" stroke-width="1.6"/></svg>`;
  }
  function table(){
    var q=query.trim().toLowerCase(),f=S.fav;
    var rows=coins.filter(c=>(!q||c.name.toLowerCase().includes(q)||c.sym.toLowerCase().includes(q))&&(!S.favOnly||f.includes(c.id)));
    rows.sort((a,b)=>(a[S.sort]-b[S.sort])*S.dir);
    document.querySelectorAll("th").forEach(th=>{var b=th.querySelector("[data-sort]");if(b&&b.dataset.sort===S.sort)th.setAttribute("aria-sort",S.dir>0?"ascending":"descending");else th.removeAttribute("aria-sort")});
    $("rows").innerHTML=rows.length?rows.map(c=>{
      var up=c.chg>=0,w=c.spark.length>1&&c.spark[c.spark.length-1]>=c.spark[0],fv=f.includes(c.id);
      return `<tr${c.id===S.coin?' class="sel"':""}><td>${c.rank}</td><td><button class="star" data-fav="${esc(c.id)}" aria-pressed="${fv}" aria-label="Favorite ${esc(c.name)}">${fv?"★":"☆"}</button><button class="link" data-id="${esc(c.id)}">${esc(c.name)}</button><span class="sym">${esc(c.sym)}</span></td><td class="r">${money(c.price)}</td><td class="r ${up?"up":"down"}">${up?"▲":"▼"} ${Math.abs(c.chg).toFixed(2)}%</td><td class="r hide">${money(c.cap,1)}</td><td>${spark(c.spark,w)}</td></tr>`;
    }).join(""):`<tr><td colspan="6">${S.favOnly&&!q?"No favorites yet. Click the star next to a coin.":"No coin matches your search."}</td></tr>`;
  }
  function fillCoins(){
    var ids=coins.map(c=>c.id);if(ids.indexOf(S.coin)<0)ids.push(S.coin);
    var h=ids.map(id=>{var c=coins.find(k=>k.id===id);return `<option value="${esc(id)}">${esc(c?c.name:id)}</option>`}).join("");
    if($("coin").dataset.h!==h){$("coin").innerHTML=h;$("coin").dataset.h=h}
    $("coin").value=S.coin;
  }
  function animate(){
    cancelAnimationFrame(raf);
    var reduce=matchMedia("(prefers-reduced-motion:reduce)").matches;
    (function step(){
      var moving=false;
      [["bar","vol"],["donut","cap"]].forEach(m=>top5().forEach((k,i)=>{
        var t=k[m[1]],d=t-disp[m[0]][i];
        if(Math.abs(d)>t*.002){disp[m[0]][i]+=reduce?d:d*.2;moving=true}else disp[m[0]][i]=t;
      }));
      drawAll();
      if(moving)raf=requestAnimationFrame(step);
    })();
  }
  var tt;
  function toast(m){var t=$("toast");t.textContent=m;t.classList.add("show");clearTimeout(tt);tt=setTimeout(()=>t.classList.remove("show"),6000)}
  function alertInfo(){var a=S.alerts[S.coin];$("alertInfo").textContent=a&&a.cur===S.cur?"Alert: "+(a.above?"rises to ":"falls to ")+money(a.p):"No alert set"}
  function setAlert(){
    var p=parseFloat($("alertPrice").value),c=coins.find(x=>x.id===S.coin);
    if(!(p>0)||!c){toast("Enter a price above 0 first.");return}
    S.alerts[S.coin]={p:p,above:p>c.price,cur:S.cur};save();alertInfo();$("alertPrice").value="";
    try{if("Notification" in window&&Notification.permission==="default")Notification.requestPermission()}catch(e){}
    toast("Alert set for "+c.name+" at "+money(p));
  }
  function checkAlerts(){
    Object.keys(S.alerts).forEach(id=>{
      var a=S.alerts[id],c=coins.find(x=>x.id===id);
      if(!c||a.cur!==S.cur)return;
      if(a.above?c.price>=a.p:c.price<=a.p){
        var m=c.name+" is now "+money(c.price)+" ("+(a.above?"above ":"below ")+money(a.p)+")";
        delete S.alerts[id];save();toast(m);
        try{if("Notification" in window&&Notification.permission==="granted")new Notification("Price alert",{body:m})}catch(e){}
      }
    });
    alertInfo();
  }
  function exportCSV(){
    if(!hist.length){toast("Nothing to export yet.");return}
    var rows=["timestamp,price_"+S.cur].concat(hist.map(p=>new Date(p[0]).toISOString()+","+p[1]));
    var a=document.createElement("a");a.href=URL.createObjectURL(new Blob([rows.join("\n")],{type:"text/csv"}));
    a.download=S.coin+"-"+S.cur+"-"+S.days+"d.csv";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  }
  function start(){clearInterval(state.timer);state.timer=setInterval(poll,S.ms*mult)}
  $("cur").value=S.cur;$("range").value=S.days;$("speed").value=S.ms;
  $("favOnly").setAttribute("aria-pressed",S.favOnly);$("sma").setAttribute("aria-pressed",S.sma);
  $("cur").onchange=e=>{S.cur=e.target.value;save();disp={bar:[],donut:[]};change()};
  $("coin").onchange=e=>{S.coin=e.target.value;save();change()};
  $("range").onchange=e=>{S.days=+e.target.value;save();change()};
  $("speed").onchange=e=>{S.ms=+e.target.value;save();if(!state.paused&&ready)start()};
  $("q").oninput=e=>{query=e.target.value;table()};
  $("rows").onclick=e=>{
    var f=e.target.closest("[data-fav]");
    if(f){var id=f.dataset.fav,i=S.fav.indexOf(id);if(i<0)S.fav.push(id);else S.fav.splice(i,1);save();table();return}
    var b=e.target.closest("[data-id]");
    if(b){S.coin=b.dataset.id;save();change();scrollTo({top:0,behavior:"smooth"})}
  };
  document.querySelector("thead").onclick=e=>{
    var b=e.target.closest("[data-sort]");if(!b)return;
    var k=b.dataset.sort;if(S.sort===k)S.dir*=-1;else{S.sort=k;S.dir=k==="rank"?1:-1}
    save();table();
  };
  $("favOnly").onclick=function(){S.favOnly=!S.favOnly;this.setAttribute("aria-pressed",S.favOnly);save();table()};
  $("sma").onclick=function(){S.sma=!S.sma;this.setAttribute("aria-pressed",S.sma);save();drawAll()};
  $("csv").onclick=exportCSV;
  $("alertBtn").onclick=setAlert;
  $("toggle").onclick=function(){
    state.paused=!state.paused;this.textContent=state.paused?"Resume":"Pause";
    if(state.paused){clearInterval(state.timer);setLive("Paused",true)}else{setLive("Live");poll();start()}
  };
  $("theme").onclick=()=>{
    var r=document.documentElement,dark=r.dataset.theme?r.dataset.theme==="dark":matchMedia("(prefers-color-scheme:dark)").matches;
    S.theme=r.dataset.theme=dark?"light":"dark";save();drawAll();
  };
  var cv=$("line");
  function move(e){
    if(!ready||hist.length<2)return;
    var r=cv.getBoundingClientRect(),x=(e.touches?e.touches[0].clientX:e.clientX)-r.left,w=r.width-MP.l-MP.r;
    hover=Math.max(0,Math.min(hist.length-1,Math.round((x-MP.l)/w*(hist.length-1))));if(vis("line"))drawMain();
  }
  cv.addEventListener("pointermove",move);
  cv.addEventListener("pointerdown",move);
  cv.addEventListener("pointerleave",()=>{hover=-1;if(ready&&vis("line"))drawMain()});
  document.addEventListener("keydown",e=>{
    if(e.ctrlKey||e.metaKey||e.altKey||/^(INPUT|SELECT|TEXTAREA|BUTTON)$/.test(e.target.tagName))return;
    if(e.key===" "){e.preventDefault();$("toggle").click()}
    else if(e.key==="t"||e.key==="T")$("theme").click();
  });
  addEventListener("resize",drawAll);
  matchMedia("(prefers-color-scheme:dark)").addEventListener("change",drawAll);
  init();
})();
