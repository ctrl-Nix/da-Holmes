# Holmes OSINT Platform 🕵️‍♂️

> **Advanced Open Source Intelligence gathering, correlation, and investigation platform — built for ethical security research and digital forensics.**

### [Live Demo → da-holmes.vercel.app](https://da-holmes.vercel.app) &nbsp;|&nbsp; [API Docs → /docs](https://da-holmes-api.onrender.com/docs)

---

### Entity Link Graph — Visualize Every Connection

Holmes's most powerful feature: an interactive, **Maltego-style force-directed graph** that maps relationships between every entity discovered across a scan — domains, IPs, emails, GitHub repos, subdomains, breached accounts, and social profiles — all in real time.

> **[→ See it in action](#)** *(replace with your GIF/screenshot after deploy)*

---

## Feature Overview

### 🔍 Unified Scanner (God Mode)
A smart orchestration engine that auto-detects the target type (domain, IP, email, username, phone number, hash, or MAC address) and fires all relevant modules in parallel, streaming results live via Server-Sent Events (SSE).

### Domain & Network Intelligence
- **DNS History** — Historical DNS record tracking and change detection
- **Subdomain Enumeration** — Passive discovery via crt.sh & HackerTarget + active brute-force
- **Subdomain Takeover Detection** — Checks dangling CNAMEs against known vulnerable services
- **Whois Intelligence** — Full registrant data, registrar history, and expiration tracking
- **Reverse IP Lookup** — Discovers all domains hosted on the same IP
- **BGP & ASN Mapping** — Autonomous system and routing intelligence
- **Wayback Machine Intel** — Historical snapshots and page change diffing
- **Tech Stack Fingerprinting** — Identifies CMS, frameworks, CDN, and analytics providers
- **Web Scraper** — Structured content extraction and link harvesting
- **Traceroute & Network Path** — Hop-by-hop routing visualization

### SSL / Certificate Intelligence
- Full TLS certificate chain inspection
- Certificate transparency log monitoring
- SANs (Subject Alternative Names) extraction for asset discovery
- Cipher suite and protocol weakness detection
- Certificate expiry and revocation status

### Email & Breach Intelligence
- **Email Format Guesser** — Hunter.io-style corporate email pattern inference
- **SMTP Validation** — Live mailbox verification without sending emails
- **Breach Cross-Reference** — Checks emails against known dark web breach databases
- **Email Header Analyzer** — Forensic parsing of raw email headers (SPF, DKIM, DMARC, routing hops)
- **Pastebin Leak Monitor** — Surface leaked credentials and PII from paste sites
- **Spoofing Vulnerability Check** — Tests SPF/DKIM/DMARC configurations for spoofability

### Social & Username Intelligence
- **Username Sherlock** — Live streaming search across 300+ social platforms
- **Social Profile Aggregator** — Unified view of discovered social accounts
- **Reddit Analyzer** — Post history analysis, karma, subreddit activity, and behavioral profiling
- **Social Connection Mapper** — Relationship graph between discovered social entities

### Corporate Intelligence
- **GitHub Organization Scanner** — Maps repos, detects exposed secrets, identifies key contributors
- **Mobile App Recon** — Scrapes iOS App Store & Google Play for app metadata and tech stack
- **Corporate Structure Mapper** — Employee discovery, subsidiary mapping, and org chart inference

### Security & Vulnerability Analysis
- **IoT Device Scanner** — Shodan-powered device enumeration and CVE correlation
- **Security Header Analyzer** — HSTS, CSP, X-Frame-Options, and 10+ header checks
- **Canary Token Checker** — Detects honeypot and canary token presence
- **Dark Web Intel** — Tor-indexed leak and marketplace mention detection
- **Threat Intelligence** — Cross-references targets against known threat actor IOC lists

### Forensics & Cryptography
- **Hash Analyzer** — Identifies hash types and cross-references against breach databases
- **MAC Address Decoder** — OUI lookup and device manufacturer identification
- **Image OSINT** — EXIF metadata extraction and reverse image search
- **File Metadata Extractor** — Deep metadata extraction from uploaded documents
- **Crypto Address Intelligence** — Blockchain address analysis and transaction tracing
- **Aviation OSINT** — Aircraft registration lookup and flight history

### Geospatial Intelligence (GEOINT)
- IP and domain geolocation with interactive map rendering
- Cell tower triangulation data aggregation
- Satellite imagery metadata correlation

### Miscellaneous Recon
- **Vehicle Recon** — License plate and VIN-based vehicle intelligence
- **Phone Number Intel** — Carrier lookup, region data, and OSINT cross-reference
- **Google Dork Builder** — Visual dorking query generator with category-based templates

### Investigation & Reporting
- **Workspace Management** — Persistent, named investigation workspaces with full cross-device backend history synchronization
- **Analyst Notes Panel** — Markdown-enabled note-taking embedded within investigations
- **Timeline View** — Chronological event reconstruction across scan findings
- **Entity Link Graph** — Force-directed, interactive relationship graph (Maltego-style) for visualizing connections between domains, IPs, emails, repos, and breached entities
- **Continuous Monitor** — Scheduled re-scanning with alerting on changes
- **PDF Report Generator** — Professional, branded PDF export of all intelligence findings
- **Investigation Vault** — Encrypted storage for sensitive findings
- **Telegram Bot Integration** — Push findings and alerts directly to a Telegram channel
- **Webhook Dispatcher** — Send scan results to any external endpoint

---

## Architecture

```
holmes/
├── app/                        # Core application package
│   ├── api/routes/             # 40+ FastAPI route modules
│   │   ├── unified.py          # Unified scanner orchestration endpoint
│   │   ├── certificates.py     # SSL/TLS intelligence
│   │   ├── github.py           # GitHub OSINT
│   │   ├── forensics.py        # Hash, MAC, image forensics
│   │   ├── geoint.py           # Geospatial intelligence
│   │   └── ...                 # (40+ total route files)
│   ├── services/               # Reusable service layer
│   │   ├── unified_scanner.py  # Multi-target orchestration engine
│   │   ├── social_scraper.py   # Social platform scraping
│   │   ├── security_scanner.py # Vulnerability correlation
│   │   ├── pdf_generator.py    # Report generation service
│   │   ├── email_scanner.py    # Email validation & breach lookup
│   │   ├── network_intel.py    # BGP/ASN/routing intelligence
│   │   └── ...
│   ├── modules/                # Heavy-lift intelligence modules
│   │   ├── osint_analyst.py    # AI-assisted OSINT analysis
│   │   ├── social_scanner.py   # Deep social media scanning
│   │   ├── corporate_scanner.py
│   │   ├── browser_engine.py   # Headless browser automation
│   │   ├── webhook_dispatcher.py
│   │   └── telegram_bot.py
│   ├── plugins/                # Extensible plugin system
│   ├── models/                 # SQLAlchemy ORM models
│   ├── crud.py                 # Database CRUD operations
│   └── database.py             # SQLite connection & session management
├── backend/                    # Standalone backend entry point
│   ├── main.py                 # FastAPI app factory
│   ├── report_gen.py           # PDF report generation
│   └── api/                    # Additional API routes
├── client/                     # React frontend (Vite)
│   └── src/
│       ├── App.jsx             # Main app with routing & state
│       ├── components/         # 30+ intelligence module UI components
│       │   ├── UnifiedScanner.jsx      # God Mode scan interface
│       │   ├── SslIntel.jsx            # SSL/certificate viewer
│       │   ├── MaltegoGraph.jsx        # Interactive entity graph
│       │   ├── WorkspaceDashboard.jsx  # Investigation workspaces
│       │   ├── OnboardingModal.jsx     # First-run guided setup
│       │   ├── GodModeScanner.jsx      # Advanced scan orchestrator
│       │   ├── SocialScanner.jsx       # Social media intel UI
│       │   └── ...                     # (65 total components)
│       └── utils/
├── Dockerfile
├── docker-compose.yml
└── requirements.txt
```

---

## Technology Stack

| Layer | Technologies |
|---|---|
| **Backend** | Python 3.10+, FastAPI, Uvicorn, APScheduler, SQLAlchemy |
| **Data Layer** | SQLite (`holmes.db`), HTTPX (async HTTP), BeautifulSoup4 |
| **DNS / Network** | dnspython, python-whois, Shodan API |
| **Frontend** | React 18, Vite, CSS Modules, SVG Force Graphs |
| **Visualization** | Custom SVG-based Maltego-style entity graph |
| **Export** | ReportLab / WeasyPrint (PDF generation) |
| **Streaming** | Server-Sent Events (SSE) for real-time scan results |
| **Containerization** | Docker & Docker Compose |

---

## Installation & Setup

### Option 1: Docker Compose *(Recommended)*

```bash
# Clone the repository
git clone https://github.com/ctrl-Nix/Osint-website.git
cd Osint-website

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your API keys (see API Keys section below)

# Build and start all services
docker-compose up --build -d
```

- **Frontend**: [http://localhost](http://localhost)
- **API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### Option 2: Local Development Setup

#### Prerequisites
- Python 3.10+
- Node.js 18+
- Git

#### System Dependencies *(Linux/Ubuntu)*
```bash
sudo apt-get update && sudo apt-get install -y nmap whois dnsutils traceroute
```

#### 1. Backend Setup
```bash
# Install Python dependencies
pip install -r requirements.txt

# Copy environment config
cp .env.example .env

# Start the FastAPI backend
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```
API available at: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

#### 2. Frontend Setup
```bash
cd client

# Install Node dependencies
npm install

# Start the Vite dev server (proxies API to port 8000 automatically)
npm run dev
```
Frontend available at: [http://localhost:5173](http://localhost:5173)

---

## API Keys

Holmes integrates with several external data providers. Configure these in your `.env` file:

| Key | Purpose | Required |
|---|---|---|
| `HUNTER_API_KEY` | Email format inference & validation | Optional |
| `SHODAN_API_KEY` | IoT device and port scanning | Optional |
| `GITHUB_TOKEN` | GitHub organization & repo scanning | Optional |
| `HAVEIBEENPWNED_KEY` | Breach database lookups | Optional |
| `VIRUSTOTAL_KEY` | Malware & threat intelligence | Optional |
| `TELEGRAM_BOT_TOKEN` | Push notifications via Telegram | Optional |
| `TELEGRAM_CHAT_ID` | Target chat for Telegram alerts | Optional |

> All keys are optional. Holmes degrades gracefully — modules that require missing keys will be skipped.

---

## Usage Guide

1. **First Launch** — The onboarding modal will guide you through initial configuration and API key setup.
2. **Create a Workspace** — Organize investigations into named, persistent workspaces.
3. **Run a Scan** — Enter any target in the Unified Scanner:
   - `example.com` → Domain intelligence suite
   - `8.8.8.8` → IP/network intelligence
   - `admin@example.com` → Email & breach analysis
   - `johndoe` → Username enumeration across 300+ platforms
   - `+1-555-0100` → Phone number OSINT
   - `d41d8cd98f00b204e9800998ecf8427e` → Hash analysis & breach lookup
4. **Stream Results** — Results appear in real time via SSE — no waiting for full completion.
5. **Explore the Graph** — Open the **Entity Link Graph** to visually map relationships between discovered assets.
6. **Take Notes** — Use the Analyst Notes Panel to annotate findings inline.
7. **Export** — Generate a professional PDF report of all findings for documentation.

---

## Extending Holmes

Holmes has a plugin system under `app/plugins/`. Add a new `.py` file following the `example_robots_plugin.py` template to register custom recon modules that automatically integrate with the scan pipeline.

---

## Sample Report

Want to see what Holmes produces without running it yourself?

**[→ Download sample report PDF](docs/sample_report.pdf)** — a full intelligence report generated by Holmes against `github.com` (a publicly-facing domain, no private data).

The report includes: DNS records, SSL chain, subdomain enumeration, tech stack fingerprint, security headers, certificate transparency logs, and a risk correlation summary — all generated in under 30 seconds.

> To generate your own: run a scan → click **Export PDF** in the results panel.

---

## Responsible Use

**This tool is strictly for educational purposes and authorized security research.**

Only scan targets you own or have explicit written permission to test. The developers assume no liability for misuse. Unauthorized scanning of third-party systems may violate computer fraud laws in your jurisdiction.

**App-level guardrails built in:**
- **Consent checkbox** — every scan requires the user to confirm they have authorization to scan the target before results are returned.
- **Rate limiting** — the API enforces a hard limit of **100 requests/minute** per IP (via SlowAPI) to prevent abuse and protect third-party data providers.
- **No credential brute-force** — Holmes performs passive OSINT only; it does not attempt logins, exploit vulnerabilities, or send unsolicited traffic beyond standard HTTP probes.

---

## License

MIT License — see [LICENSE](LICENSE) for details.
