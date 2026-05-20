# YART: Yet Another Ransomware Tracker 🛡️

**YART** is an automated, headless, serverless threat intelligence dashboard for tracking ransomware groups, their victims, and related cyber intelligence. 

Powered entirely by GitHub Pages and GitHub Actions, YART provides a real-time, single-pane-of-glass overview of ransomware activity using the [Ransomware.live PRO API](https://api-pro.ransomware.live/docs). It operates automatically with zero local hosting or traditional backend servers required.

## ✨ Features

- **Dashboard Overview**: View global statistics, top targeted countries, and victims by sector in interactive charts.
- **Intelligence Feeds**: Scrollable feeds for SEC 8-K disclosures and recent press reports (including infostealer compromised credential data).
- **Dedicated List Pages**: Search and filter through the complete database of historical victims and tracked ransomware groups.
- **Deep Group Intelligence**: Detailed actor profiles that include:
  - Known leak site locations (and online/offline status)
  - Used tools and exploited CVEs
  - Extracted IOCs (Indicators of Compromise)
  - Full **YARA Rules** with syntax highlighting
  - Downloaded **Ransom Notes**
  - **Negotiation Chat Logs** with initial and negotiated ransom amounts
- **Serverless Architecture**: All data is fetched on a schedule via GitHub Actions and rendered client-side on GitHub Pages. No database required.

---

## 🚀 How It Works

This project is specifically designed to run on GitHub infrastructure without needing a dedicated server.

1. **GitHub Actions (`.github/workflows`)**: 
   - **Hourly Incremental Sync (`update_data.yml`)**: Fetches lightweight datasets (recent victims, active groups, statistics, sector data, 8-K filings, and press releases) every hour.
   - **Full Historical Sync (`full_sync.yml`)**: A heavy workflow that loops through every tracked group to pull deep intelligence (Negotiations, YARA rules, and Ransom Notes) while respecting API rate limits.
2. **Data Storage**: The API responses are saved directly as static `.json` files inside the `/data/` directory and version-controlled automatically by the bot.
3. **Frontend Presentation**: The vanilla HTML/JS/CSS frontend (hosted natively on GitHub Pages) fetches the static JSON files from the repository and renders the dashboard beautifully.

---

## 📁 Project Structure

```
├── .github/workflows/
│   ├── full_sync.yml      # Sync for deep group data (Negotiations, YARA)
│   └── update_data.yml    # Hourly sync for recent victims and stats
├── css/
│   └── style.css          # Premium Dark Mode styles
├── js/
│   ├── app.js             # Dashboard logic
│   ├── group.js           # Single group profile logic (YARA/Chats)
│   ├── groups.js          # Active groups list logic
│   └── victims.js         # Historical victims list logic
├── data/                  # Auto-generated JSON files from Actions
├── index.html             # Main Dashboard
├── victims.html           # Full Victims Search
├── groups.html            # Full Groups Search
└── group.html             # Detailed Group View
```

## 📜 Disclaimer
This project is for threat intelligence and educational purposes. Ensure you comply with the [Ransomware.live API Terms of Service](https://api-pro.ransomware.live/) regarding data usage and rate limits.
