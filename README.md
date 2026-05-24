# Holmes OSINT Platform 🕵️‍♂️🕸️

An advanced, full-stack Open Source Intelligence (OSINT) gathering and relationship correlation platform built for educational and research purposes. Holmes provides a comprehensive "God Mode" scanning engine capable of mapping domains, IP addresses, emails, and usernames to their digital footprints.

## ✨ Features

- **God Mode Full Scan**: A unified engine that orchestrates multiple modules simultaneously (DNS, BGP, Whois, SSL, Breaches, Subdomains, etc.) based on the target type.
- **Domain Intelligence**: Automated subdomain enumeration (via crt.sh, HackerTarget, and brute-force), takeover vulnerability checks, and DNS history mapping.
- **Mobile Application Intel**: Automatically scrapes iTunes and Google Play to discover mobile applications associated with a target company and extracts their tech stack footprints.
- **GitHub Intelligence**: Maps a company's open-source footprint, identifying risky repositories, exposed secrets, and key developers.
- **Email & Breach Checks**: Guesses corporate email formats using Hunter.io patterns, validates SMTP, and cross-references addresses against known Dark Web data breaches and Pastebin leaks.
- **Username Sherlock**: Streams live results tracking username presence across hundreds of social media platforms.
- **Interactive Intel Graph**: A dynamic, force-directed React graph component (`IntelGraph.jsx`) that visualizes the complex relationships between domains, IPs, breached emails, GitHub repos, and infrastructure vulnerabilities.

## 🛠️ Technology Stack

- **Backend**: Python 3, FastAPI, Uvicorn, APScheduler, SQLite, HTTPX, BeautifulSoup4, DNSResolver.
- **Frontend**: React.js, Vite, SVG-based Custom Force Graphs.
- **Database**: SQLite (`holmes.db`) for persistent workspaces, scan histories, and findings.

## 🚀 Installation & Setup

### Prerequisites
- Python 3.9+
- Node.js (v16+)
- Git

### 1. Backend Setup

Open a terminal in the root directory:

```bash
# Install required Python dependencies
pip install -r requirements.txt

# Start the FastAPI server
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
*The backend API and Swagger documentation will be available at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).*

### 2. Frontend Setup

Open a separate terminal and navigate to the `client` directory:

```bash
cd client

# Install Node dependencies
npm install

# Start the Vite development server
npm run dev
```
*The frontend application will be available at [http://localhost:5173/](http://localhost:5173/).*

## 📖 Usage Guide

1. **Access the Dashboard**: Navigate to `http://localhost:5173/` in your browser.
2. **Create a Workspace**: Organize your investigations into persistent workspaces.
3. **Launch a Scan**: Use the central search bar to enter a Target (e.g., `example.com`, `admin@example.com`, `8.8.8.8`, or a username). The engine will automatically detect the target type and fire the appropriate modules.
4. **View Live Results**: Results stream in via Server-Sent Events (SSE) so you don't have to wait for the entire scan to finish.
5. **Explore the Graph**: Click the **"Show Intelligence Graph"** button on the results page to visually explore the relationships between your target and the discovered assets (Subdomains, IPs, Leaks, Repositories). Click on individual nodes to see detailed descriptions and remediation recommendations.

## ⚠️ Disclaimer

**This tool is strictly for educational purposes and authorized security research.** 
The developers assume no liability and are not responsible for any misuse or damage caused by this program. Always ensure you have explicit permission before scanning targets that do not belong to you.
