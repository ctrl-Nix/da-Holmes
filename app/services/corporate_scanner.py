import socket
import httpx

async def get_domain_info(domain: str) -> dict:
    """
    Resolves the main IP address and fetches subdomains from crt.sh.
    """
    # 1. Resolve primary IP address using socket
    try:
        main_ip = socket.gethostbyname(domain)
    except socket.gaierror:
        main_ip = None

    # 2. Fetch subdomains from crt.sh
    subdomains = set()
    url = f"https://crt.sh/?q=%.{domain}&output=json"
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)
            if response.status_code == 200:
                data = response.json()
                for entry in data:
                    name_value = entry.get("name_value", "")
                    for name in name_value.split("\n"):
                        clean_name = name.strip().lower()
                        if clean_name.endswith(domain) and "*" not in clean_name:
                            subdomains.add(clean_name)
    except Exception as e:
        print(f"Error fetching from crt.sh: {e}")

    # Fallback to HackerTarget if crt.sh failed or returned no subdomains
    if not subdomains:
        print("crt.sh failed or empty. Trying HackerTarget fallback...")
        try:
            fallback_url = f"https://api.hackertarget.com/hostsearch/?q={domain}"
            async with httpx.AsyncClient(timeout=10.0) as client:
                fb_response = await client.get(fallback_url)
                if fb_response.status_code == 200:
                    lines = fb_response.text.strip().split("\n")
                    for line in lines:
                        if "," in line:
                            parts = line.split(",")
                            clean_name = parts[0].strip().lower()
                            if clean_name.endswith(domain):
                                subdomains.add(clean_name)
        except Exception as e:
            print(f"Error fetching from HackerTarget fallback: {e}")

    # Return clean dictionary
    return {
        "domain": domain,
        "main_ip": main_ip,
        "subdomains": sorted(list(subdomains))
    }
