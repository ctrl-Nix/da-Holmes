import httpx

# EVERY plugin must define a 'run' function
async def run(target: str, **kwargs) -> list:
    """
    Custom plugin to check if a domain has a robots.txt file.
    Returns a list of findings (dicts).
    """
    findings = []
    
    # We only care if the target looks like a domain
    if "." not in target or "@" in target:
        return findings
        
    url = f"https://{target}/robots.txt"
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(url)
            if resp.status_code == 200:
                findings.append({
                    "key": "CustomPlugin_RobotsTXT",
                    "value": f"Found robots.txt (Length: {len(resp.text)} bytes)"
                })
    except Exception as e:
        pass
        
    return findings
