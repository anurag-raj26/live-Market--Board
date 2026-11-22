#📈 Live Market Board 


-An advanced real-time crypto dashboard built with HTML, CSS and vanilla JavaScript. It uses the free CoinGecko API (no key needed) and draws every chart by hand on <canvas>. No frameworks, no libraries, no build step.

##✨ Features
*Pick any top-10 coin for the main price chart
Time ranges: 1D, 7D, 30D and 90D
Currencies: USD, INR and EUR
Hover / touch crosshair with an exact price and time tooltip
Stat cards: total market cap, total 24h volume and the top 24h gainer (top 10 coins)
Volume bars and a market-share donut (top 5), with smooth animation
Watchlist table with price, 24h change, market cap and 7-day sparklines
Search the watchlist, and click a coin to chart it
Saved settings: coin, range, currency, refresh interval, theme, favorites, sort order, SMA and alerts are remembered in localStorage
Auto-refresh every 20, 30 or 60 seconds, plus Pause and Resume
Error handling: if the internet drops or the rate limit is hit, the board shows "Offline, retrying" and keeps the last data
Dark and light mode, responsive layout, high-DPI sharp canvases, keyboard-friendly controls, reduced-motion support
🚀 Advanced features
Feature	How it works
Price alerts	Type a target price and click Set alert. When the price crosses it, a toast appears (and a browser notification if you allowed them). Alerts are saved per coin and currency, and checked on every refresh
SMA 20 overlay	Toggle a 20-point simple moving average on the main chart
High and low markers	The highest and lowest prices in the selected range are marked on the chart
Sortable watchlist	Click #, Price, 24h or Market cap to sort, click again to reverse
Favorites	Star any coin, then use ★ Favorites to show only those
Export CSV	Downloads the price history of the chart you are looking at
Rate-limit backoff	If CoinGecko answers 429, the refresh interval doubles (up to 8 times slower) and returns to normal after the next success
Offline cache	The last good response is saved, so the board still shows data if you open it without internet
Keyboard shortcuts	Space pauses or resumes, T switches theme (ignored while you type or use a dropdown)
📁 Files
live-market-board/
├── index.html   Layout, controls, stat cards, charts and watchlist
├── style.css    Styling, themes and responsive grid
├── script.js    API calls, charts, tooltip, table, saved settings
└── README.md
🚀 Run it
Keep the three files in the same folder.
Open index.html in your browser. An internet connection is required.

VS Code user? If the preview says "Forbidden. File does not reside within a trusted folder", open the whole folder with File → Open Folder and trust it, or open index.html directly in your browser.

🔌 API calls
Endpoint	Used for
/coins/markets?vs_currency=…&per_page=10&sparkline=true	Top 10 coins: price, market cap, volume, 24h change and 7-day sparkline
/coins/{id}/market_chart?vs_currency=…&days=…	Price history for the main chart

Both are called on load and on every refresh, and again whenever you change the coin, range or currency.

⚙️ How it works
init() loads the data and starts the timer. If the first load fails, it retries every 15 seconds.
refresh() fetches both endpoints together, then updates the labels, table and charts.
drawMain() draws the price chart, and the pointer handlers redraw it with a crosshair as you move over it.
animate() eases the bars and donut toward new values.
Your choices are written to localStorage by save() and read back on the next visit.
🎨 Customize
Change	Where
Number of coins	per_page=10 in refresh() (bar and donut use the first 5)
Time ranges	<option> values in the #range select and the RANGE object
Currencies	<option> values in the #cur select (any currency CoinGecko supports)
Refresh options	<option> values in the #speed select (milliseconds)
Colors and themes	CSS variables at the top of style.css
⚠️ Notes
CoinGecko's free API has rate limits. Each refresh makes 2 calls, so keep the interval at 20 seconds or more.
This is a demo project and not financial advice.
🧰 Troubleshooting
Problem	Fix
"Offline, retrying"	Check your internet, or wait a minute if you hit the rate limit
No styling or charts	Make sure all three files are in the same folder
Settings, favorites or alerts not saved	Some browsers block localStorage for local files; the board still works, it just forgets your choices
Alert never fires	Alerts only work for the top 10 coins, in the currency they were set in, while the page is open
📄 License and author
Market data by CoinGecko.
