# Holmes OSINT Platform — Remaining Fixes & Recommendations

> Generated from codebase audit on **2026-06-30**.  
> Critical bugs (🔴) and major issues (🟠) were already patched. This file covers the remaining **🟡 warnings** that require attention before production deployment.

---

## Fix 1 — CORS Placeholder URL in `main.py`

**Severity:** 🟠 Will block all API calls from the deployed frontend  
**File:** `main.py` (line ~233)

### Problem
The CORS allowed-origins list contains a hardcoded placeholder:
```python
"https://your-project.vercel.app"  # ← Not your real URL
```
If `FRONTEND_URL` env var is not set, the real Vercel frontend gets blocked by CORS.

### Fix
Set `FRONTEND_URL` in your `.env` file (and on Render/Railway):
```env
# .env (root)
FRONTEND_URL=https://your-actual-project.vercel.app
```

Or for multiple origins (comma-separated):
```env
FRONTEND_URL=https://holmes-osint.vercel.app,https://staging.holmes-osint.vercel.app
```

The existing code already reads this variable — you just need to set it:
```python
# main.py (already handles this correctly)
frontend_url = os.getenv("FRONTEND_URL", "")
if frontend_url:
    if "," in frontend_url:
        origins.extend([o.strip() for o in frontend_url.split(",") if o.strip()])
    elif frontend_url not in origins:
        origins.append(frontend_url)
```

**Action required:** Add `FRONTEND_URL` to your deployment environment variables. Remove the placeholder string from the `origins` list in `main.py`.

---

## Fix 2 — HaveIBeenPwned API v2 is Deprecated (Requires API Key)

**Severity:** 🟡 Silent failure — breach checks always return `"unknown"`  
**File:** `backend/api/routes.py` (line ~297)

### Problem
```python
# HIBP v2 free unauthenticated API was disabled in 2019
resp = await client.get(
    f"https://haveibeenpwned.com/api/v2/breachedaccount/{email}",
    headers={"User-Agent": "Holmes-OSINT-Platform"}
)
```
This always returns a `401 Unauthorized`, so breach status is always `"unknown"`.

### Fix — Option A (Recommended): Add HIBP API Key from Vault
Update `backend/api/routes.py` `security_check_email` function:
```python
@router.get("/security/check")
async def security_check_email(email: str, db: Session = Depends(get_db)):
    email = email.strip().lower()

    # Retrieve HIBP API key from vault
    vault_item = db.query(ApiVault).filter(ApiVault.service_name == "hibp_api_key").first()
    hibp_key = vault_item.api_key if vault_item else None

    if not hibp_key:
        return {
            "email": email,
            "status": "api_key_required",
            "breach_count": 0,
            "details": [],
            "note": "Add your HIBP API key in Settings -> API Keys (service: hibp_api_key)."
        }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"https://haveibeenpwned.com/api/v3/breachedaccount/{email}?truncateResponse=false",
                headers={
                    "hibp-api-key": hibp_key,
                    "User-Agent": "Holmes-OSINT-Platform"
                }
            )
            if resp.status_code == 200:
                breaches = resp.json()
                details = [
                    {"name": b.get("Name"), "date": b.get("BreachDate"), "domain": b.get("Domain")}
                    for b in breaches
                ]
                result = {"email": email, "status": "compromised", "breach_count": len(details), "details": details}
            elif resp.status_code == 404:
                result = {"email": email, "status": "safe", "breach_count": 0, "details": []}
            elif resp.status_code == 401:
                result = {"email": email, "status": "api_key_invalid", "breach_count": 0, "details": [],
                          "note": "The HIBP API key stored in your vault is invalid."}
            else:
                result = {"email": email, "status": "unknown", "breach_count": 0, "details": [],
                          "note": f"HIBP returned status {resp.status_code}."}
    except Exception as e:
        result = {"email": email, "status": "error", "breach_count": 0, "details": [], "note": str(e)}

    log_investigation(email, "security_check", result, db)
    return result
```

**API Key cost:** HIBP API keys are available at https://haveibeenpwned.com/API/Key for ~$3.50/month.

---

## Fix 3 — Missing `g4f` Dependency for AI Summaries in Reports

**Severity:** 🟡 Silent failure — AI executive summaries in PDF reports never generate  
**File:** `app/api/routes/report.py` (lines 38–44, 87–93)

### Problem
```python
import g4f  # Not installed -> ImportError caught silently
```
`g4f` (GPT4Free) is not in `requirements.txt`, so AI summaries are silently skipped.

### Fix — Option A: Add to requirements.txt
```txt
g4f>=0.3.0
```
> Note: `g4f` is a large package (~500MB) with browser dependencies. Not ideal for serverless/Docker deployments.

### Fix — Option B (Recommended): Replace with Groq (free tier, fast)
```txt
# Add to requirements.txt
groq>=0.9.0
```

Update `app/api/routes/report.py`:
```python
try:
    from groq import Groq
    groq_key = os.getenv("GROQ_API_KEY")
    if groq_key:
        groq_client = Groq(api_key=groq_key)
        prompt = f"Write a 2-paragraph executive OSINT summary for target {query}: {str(json_data)[:800]}"
        chat = groq_client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama3-8b-8192"
        )
        ai_summary = chat.choices[0].message.content
        if ai_summary:
            summary_text = f"AI EXECUTIVE SUMMARY:\n\n{ai_summary}\n\n" + summary_text
except Exception as ai_err:
    print(f"AI Summary failed: {ai_err}")
```

Set `GROQ_API_KEY` in your `.env` — free API keys available at https://console.groq.com.

---

## Fix 4 — Missing Document Metadata Dependencies

**Severity:** 🟡 `POST /api/metadata/extract` fails for all file types without these packages  
**File:** `app/api/routes/metadata.py`, `requirements.txt`

### Problem
The metadata extractor uses three packages that are not in `requirements.txt`:
```python
import fitz      # PyMuPDF — for PDF metadata
import docx      # python-docx — for Word documents
import openpyxl  # openpyxl — for Excel spreadsheets
```

### Fix
Add the following to `requirements.txt`:
```txt
PyMuPDF==1.24.1
python-docx==1.1.2
openpyxl==3.1.2
```

> **Note on Docker image size:** PyMuPDF adds ~20MB. If minimizing image size matters, wrap each import with a user-friendly 501 error:
```python
elif filename.endswith(".pdf"):
    try:
        import fitz
    except ImportError:
        raise HTTPException(
            status_code=501,
            detail="PDF metadata extraction requires PyMuPDF. Install with: pip install PyMuPDF"
        )
```

---

## Fix 5 — Investigation History Dual-Source (localStorage vs SQLite)

**Severity:** 🟡 History is siloed per-browser — no cross-device persistence  
**File:** `client/src/App.jsx` (~lines 470–520), `app/api/routes/history.py`

### Problem
- **Frontend** saves scan history to `localStorage` (`holmes-history` key)
- **Backend** has a full `InvestigationHistory` SQLite table (via SQLAlchemy)
- These two are **never synced** — clearing localStorage or using a different browser loses all history

### Fix — Add background sync helper in `App.jsx`

Add this helper function near the top of the App component (after the `API_BASE` constant):
```js
// Helper: silently sync a completed scan to the backend investigations table
const saveToBackendHistory = async (target, type, results) => {
  try {
    await fetch(`${API_BASE}/api/investigations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `${type.toUpperCase()} scan — ${target}`,
        targets: [target],
        notes: JSON.stringify(results).slice(0, 2000)
      })
    });
  } catch (err) {
    // Non-critical — localStorage is the primary local fallback
    console.warn('Backend history sync failed (non-critical):', err);
  }
};
```

Call it after each `localStorage.setItem('holmes-history', ...)` in all scan handlers:
```js
localStorage.setItem('holmes-history', JSON.stringify(updated));
window.dispatchEvent(new CustomEvent('holmes-history-updated'));
// Add this line:
saveToBackendHistory(cleanQuery, targetType, data);
```

Add a mount-time seed effect to pre-populate localStorage from the backend if empty:
```js
useEffect(() => {
  const seedFromBackend = async () => {
    if (localStorage.getItem('holmes-history')) return; // Already has local data
    try {
      const res = await fetch(`${API_BASE}/api/investigations?limit=50`);
      if (!res.ok) return;
      const investigations = await res.json();
      const mapped = investigations.map(inv => ({
        query: (inv.targets || [])[0] || inv.name || 'Unknown',
        type: 'unknown',
        timestamp: new Date(inv.created_at || Date.now()).getTime(),
        riskScore: 100
      }));
      if (mapped.length > 0) {
        localStorage.setItem('holmes-history', JSON.stringify(mapped));
        loadHistory();
        updateReportsFromHistory();
      }
    } catch (err) { /* silently ignore — backend may be offline */ }
  };
  seedFromBackend();
}, []);
```

---

## Quick Reference — What Still Needs Doing

| Priority | Fix | Effort | Impact |
|---|---|---|---|
| 🟠 High | Set `FRONTEND_URL` env var in deployment | 2 min | Unblocks prod frontend CORS |
| 🟡 Medium | Upgrade HIBP to v3 with API key (service: `hibp_api_key`) | 15 min | Makes breach checks functional |
| 🟡 Medium | Add `PyMuPDF`, `python-docx`, `openpyxl` to `requirements.txt` | 5 min | Fixes `/api/metadata/extract` |
| 🟡 Medium | Sync history writes to backend API | 30 min | Cross-device scan history |
| 🟡 Low | Add `groq` for AI report summaries (set `GROQ_API_KEY`) | 15 min (free) | AI-generated PDF summaries |

---

*All 🔴 critical bugs and 🟠 major issues were fixed in the previous audit commit.*  
*Refer to `bug-log.md` for the full historical record of resolved issues.*
