from fastapi import APIRouter, HTTPException, Request
import httpx

router = APIRouter()

@router.get("/")
async def check_spoofing(request: Request, domain: str):
    """
    Advanced Email Spoofing & Phishing Vulnerability Analysis.
    Analyzes SPF and DMARC records with granular risk assessment.
    """
    domain = domain.replace("https://", "").replace("http://", "").strip().split("/")[0]
    
    try:
        async with httpx.AsyncClient() as client:
            txt_url = f"https://dns.google/resolve?name={domain}&type=TXT"
            dmarc_url = f"https://dns.google/resolve?name=_dmarc.{domain}&type=TXT"
            
            txt_res = await client.get(txt_url, timeout=10.0)
            dmarc_res = await client.get(dmarc_url, timeout=10.0)
            
        spf_record = None
        dmarc_record = None
        
        if txt_res.status_code == 200:
            answers = txt_res.json().get("Answer", [])
            for ans in answers:
                data = ans.get("data", "").strip('"')
                if "v=spf1" in data:
                    spf_record = data
                    
        if dmarc_res.status_code == 200:
            answers = dmarc_res.json().get("Answer", [])
            for ans in answers:
                data = ans.get("data", "").strip('"')
                if "v=DMARC1" in data:
                    dmarc_record = data
        
        # --- Analysis Logic ---
        score = 0
        risks = []
        recommendations = []
        strengths = []
        
        # SPF Analysis
        if not spf_record:
            risks.append("Missing SPF record. Any server can send emails on behalf of this domain.")
            recommendations.append("Implement an SPF record to authorize specific mail servers.")
        else:
            score += 30
            strengths.append("SPF record present.")
            if "-all" in spf_record:
                score += 20
                strengths.append("SPF 'Fail' policy (-all) is strictly enforced.")
            elif "~all" in spf_record:
                score += 10
                risks.append("SPF 'SoftFail' policy (~all) is less restrictive than 'Fail'.")
                recommendations.append("Upgrade SPF policy from '~all' to '-all' for better enforcement.")
            elif "+all" in spf_record:
                score -= 20
                risks.append("SPF record uses '+all', which effectively allows any sender.")
                recommendations.append("Remove '+all' from SPF record immediately.")
            
            if "include:" in spf_record:
                strengths.append(f"Authorized third-party senders found in SPF.")

        # DMARC Analysis
        if not dmarc_record:
            risks.append("Missing DMARC record. No policy for handling failed SPF/DKIM checks.")
            recommendations.append("Create a DMARC record to monitor and eventually reject spoofed emails.")
        else:
            score += 20
            strengths.append("DMARC record present.")
            
            # Policy check
            if "p=reject" in dmarc_record:
                score += 30
                strengths.append("DMARC policy 'reject' is the highest level of protection.")
            elif "p=quarantine" in dmarc_record:
                score += 20
                strengths.append("DMARC policy 'quarantine' moves suspicious emails to spam.")
                recommendations.append("Consider moving DMARC policy from 'quarantine' to 'reject' once stable.")
            elif "p=none" in dmarc_record:
                score += 5
                risks.append("DMARC policy 'none' provides no protection (monitoring only).")
                recommendations.append("Transition DMARC policy from 'p=none' to 'p=quarantine' or 'p=reject'.")
            
            if "rua=" in dmarc_record:
                strengths.append("DMARC reporting (RUA) is enabled for visibility into authentication failures.")
            else:
                risks.append("DMARC reporting (RUA) is not configured.")
                recommendations.append("Add 'rua' tag to DMARC record to receive aggregate reports.")

        # Cap score
        score = max(0, min(100, score))
        
        vulnerable = score < 70
        rating = "CRITICAL" if score < 30 else ("VULNERABLE" if score < 70 else "SECURE")
        
        return {
            "status": "success",
            "domain": domain,
            "vulnerable": vulnerable,
            "score": score,
            "rating": rating,
            "analysis": {
                "spf": {
                    "record": spf_record,
                    "status": "Found" if spf_record else "Not Found",
                    "details": "SPF record defines which mail servers are authorized to send email for your domain."
                },
                "dmarc": {
                    "record": dmarc_record,
                    "status": "Found" if dmarc_record else "Not Found",
                    "details": "DMARC leverages SPF and DKIM to provide instructions to receiving mail servers."
                }
            },
            "risk_factors": risks,
            "strengths": strengths,
            "recommendations": recommendations,
            "summary": f"Security Score: {score}/100. " + ("This domain is well-protected against spoofing." if score >= 70 else "This domain is highly susceptible to email phishing and impersonation attacks.")
        }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
