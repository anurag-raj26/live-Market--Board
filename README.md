# 📈 Live Market Board

An advanced real-time cryptocurrency dashboard built with **HTML, CSS, and Vanilla JavaScript**.

It uses the free [CoinGecko API](https://www.coingecko.com/en/api) (no API key required) and draws every chart manually using the HTML `<canvas>` element.

**No frameworks. No libraries. No build step.**

## ✨ Features

- Select any of the top 10 cryptocurrencies for the main price chart.
- **Time ranges:** 1D, 7D, 30D, and 90D.
- **Currencies:** USD, INR, and EUR.
- Interactive hover/touch crosshair with exact price and time tooltips.
- Market statistics:
  - Total market capitalization.
  - Total 24-hour trading volume.
  - Top 24-hour gainer among the top 10 coins.
- Animated volume bars and market-share donut chart (top 5 coins).
- Watchlist table displaying:
  - Current price.
  - 24-hour price change.
  - Market capitalization.
  - 7-day sparklines.
- Search the watchlist and click any coin to view its chart.
- **Persistent settings:** Coin, time range, currency, refresh interval, theme, favorites, sort order, SMA, and alerts are saved in `localStorage`.
- Automatic refresh every 20, 30, or 60 seconds.
- Pause and resume automatic updates.
- Error handling with an offline retry mechanism that preserves the last available data.
- Dark and light themes.
- Responsive layout and high-DPI canvas rendering.
- Keyboard-friendly controls and reduced-motion support.

## 🚀 Advanced Features

| Feature | How It Works |
|---|---|
| **Price Alerts** | Set a target price and receive a toast notification when the price crosses it. Browser notifications are also supported with permission. Alerts are saved per coin and currency. |
| **SMA 20 Overlay** | Toggle a 20-point Simple Moving Average (SMA) on the main chart. |
| **High and Low Markers** | Automatically mark the highest and lowest prices within the selected time range. |
| **Sortable Watchlist** | Sort by coin number (#), price, 24-hour change, or market capitalization. Click again to reverse the order. |
| **Favorites** | Star your favorite coins and use the ★ Favorites filter to display only selected coins. |
| **Export CSV** | Download the price history of the currently selected cryptocurrency as a CSV file. |
| **Rate-Limit Backoff** | If CoinGecko returns HTTP 429, the refresh interval doubles, up to 8 times slower, and returns to normal after a successful request. |
| **Offline Cache** | The last successful API response is saved so the dashboard can display previously fetched data without an internet connection. |
| **Keyboard Shortcuts** | Press `Space` to pause or resume updates and `T` to switch themes. Shortcuts are ignored while typing or using dropdowns. |

## 📁 Project Structure

```text
live-market-board/
│
├── index.html   
├── style.css   
├── script.js    
└── README.md    
```

## 🚀 How to Run

1. Download or clone this repository.
2. Keep all three project files in the same folder.
3. Open `index.html` in your web browser.
4. Make sure you have an active internet connection to fetch live cryptocurrency data.

### Running with VS Code

If you see the error:

```
```

Open the entire project folder using:

**File → Open Folder**

Trust the folder if VS Code prompts you, or open `index.html` directly in your browser.

## 🔌 API Integration

This project uses the free CoinGecko API to retrieve cryptocurrency market information.

| API Endpoint | Purpose |
|---|---|
| `/coins/markets?vs_currency=…&per_page=10&sparkline=true` | Retrieves the top 10 coins, including price, market capitalization, trading volume, 24-hour change, and 7-day sparkline data. |
| `/coins/{id}/market_chart?vs_currency=…&days=…` | Retrieves historical price data for the main cryptocurrency chart. |

Both endpoints are called during initial loading and automatic refreshes. They are also called when the selected coin, time range, or currency changes.

## ⚙️ How It Works

- **`init()`** – Loads initial data and starts the automatic refresh timer. If the first request fails, it retries every 15 seconds.
- **`refresh()`** – Fetches data from both API endpoints and updates the labels, watchlist, and charts.
- **`drawMain()`** – Renders the main price chart and handles interactive crosshair movement.
- **`animate()`** – Smoothly animates volume bars and the market-share donut chart.
- **`save()`** – Saves user preferences to `localStorage` and restores them during the next visit.

## 🎨 Customization

| What to Change | Where to Change It |
|---|---|
| Number of coins | Change `per_page=10` in `refresh()`. The bar and donut charts use the first 5 coins. |
| Time ranges | Update the `<option>` values in the `#range` select element and the `RANGE` object. |
| Supported currencies | Update the `<option>` values in the `#cur` select element. Use currencies supported by CoinGecko. |
| Refresh intervals | Update the `<option>` values in the `#speed` select element (milliseconds). |
| Colors and themes | Modify the CSS variables at the top of `style.css`. |

## ⚠️ Important Notes

- CoinGecko's free API has rate limits.
- Each refresh makes two API requests.
- Keep the refresh interval at 20 seconds or more to reduce the risk of rate limiting.
- This is a demonstration and educational project, not financial advice.

## 🧰 Troubleshooting

| Problem | Solution |
|---|---|
| **"Offline, retrying"** | Check your internet connection or wait a minute if the API rate limit has been reached. |
| **No styling or charts** | Make sure `index.html`, `style.css`, and `script.js` are in the same folder and correctly linked. |
| **Settings, favorites, or alerts are not saved** | Some browsers restrict `localStorage` for local files. The dashboard will still work, but preferences may not persist. |
| **Price alert never fires** | Alerts only work for the top 10 coins, in the currency in which they were configured, while the page remains open. |

## 📄 License and Credits

- **Market Data:** [CoinGecko API](https://www.coingecko.com/en/api).
- **Frontend:** HTML5, CSS3, and Vanilla JavaScript.
- **Charts:** Custom HTML Canvas rendering.

---

**Built with ❤️ using HTML, CSS, and JavaScript.**
