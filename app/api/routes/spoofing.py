from fastapi import APIRouter, HTTPException, Request
import httpx
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/validate")
async def get_spf_dmarc_records(request: Request = None, domain: str = ""):
    domain = domain.replace("https://", "").replace("http://", "").strip().split("/")[0].lower()
    if not domain:
        raise HTTPException(status_code=400, detail="Domain query cannot be empty")

    spf_record = None
    dmarc_record = None
    recommendations = []

    try:
        async with httpx.AsyncClient() as client:
            txt_url = f"https://dns.google/resolve?name={domain}&type=TXT"
            dmarc_url = f"https://dns.google/resolve?name=_dmarc.{domain}&type=TXT"
            
            txt_res = await client.get(txt_url, timeout=5.0)
            dmarc_res = await client.get(dmarc_url, timeout=5.0)
            
            if txt_res.status_code == 200:
                answers = txt_res.json().get("Answer", [])
                for ans in answers:
                    data = ans.get("data", "").strip('"')
                    if "v=spf1" in data:
                        spf_record = data
                        break
                        
            if dmarc_res.status_code == 200:
                answers = dmarc_res.json().get("Answer", [])
                for ans in answers:
                    data = ans.get("data", "").strip('"')
                    if "v=DMARC1" in data:
                        dmarc_record = data
                        break
    except Exception as e:
        logger.error(f"DNS API query failed: {e}")

    # 1. Parse SPF
    if not spf_record:
        spf_score = "FAIL"
        recommendations.append("Missing SPF record! Anyone can spoof emails claiming to originate from your domain.")
    else:
        if "-all" in spf_record:
            spf_score = "PASS"
        elif "~all" in spf_record:
            spf_score = "WARN"
            recommendations.append("SPF record uses softfail (~all). We recommend changing it to hardfail (-all) to reject unauthorized mail strictly.")
        elif "+all" in spf_record:
            spf_score = "FAIL"
            recommendations.append("SPF record explicitly allows any sender (+all). This completely neutralizes domain security!")
        else:
            spf_score = "WARN"
            recommendations.append("SPF record is present, but could not detect strict hardfail (-all) enforcement.")

    # 2. Parse DMARC
    if not dmarc_record:
        dmarc_score = "CRITICAL"
        recommendations.append("Missing DMARC record! Active receivers cannot verify or report SPF/DKIM verification failures.")
    else:
        if "p=reject" in dmarc_record:
            dmarc_score = "PASS"
        elif "p=quarantine" in dmarc_record:
            dmarc_score = "WARN"
            recommendations.append("DMARC uses quarantine (p=quarantine). Once mail flows are trusted, upgrade the policy to strict reject (p=reject).")
        elif "p=none" in dmarc_record:
            dmarc_score = "FAIL"
            recommendations.append("DMARC is set to monitoring only (p=none). Transition to quarantine or reject policies to actively block spoofed messages.")
        else:
            dmarc_score = "WARN"
            recommendations.append("DMARC record found, but policy parameters are loose or misconfigured.")

    # 3. Determine Risk Level
    if dmarc_score == "CRITICAL" or spf_score == "FAIL" or dmarc_score == "FAIL":
        risk_level = "CRITICAL"
    elif spf_score == "PASS" and dmarc_score == "PASS":
        risk_level = "SECURE"
    else:
        risk_level = "VULNERABLE"

    return {
        "domain": domain,
        "spf_record": spf_record,
        "dmarc_record": dmarc_record,
        "spf_score": spf_score,
        "dmarc_score": dmarc_score,
        "risk_level": risk_level,
        "recommendations": recommendations
    }

# Ensure the root route is also mapped in case the frontend relies on /api/spoofing/ instead of /api/spoofing/validate
@router.get("/")
async def get_spf_dmarc_records_root(request: Request = None, domain: str = ""):
    return await get_spf_dmarc_records(request, domain)
