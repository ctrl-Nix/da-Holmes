import asyncio
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.api.routes.forensics import check_email_spoofing

async def main():
    print("=== Testing Zero-Cost Email Forensics Spoofing DNS Queries ===")
    
    # Test a well-secured domain (Google.com should have strict SPF and DMARC)
    print("Analyzing google.com...")
    res_google = await check_email_spoofing("google.com")
    print(f"Domain: {res_google.domain}")
    print(f"SPF: {res_google.spf_record}")
    print(f"DMARC: {res_google.dmarc_record}")
    print(f"Is Vulnerable: {res_google.is_vulnerable_to_spoofing}")
    # Google should have strict records
    assert res_google.is_vulnerable_to_spoofing is False, "Google should not be vulnerable to spoofing"

    # Test a dummy non-existent domain
    bad_domain = "nonexistent-domain-test-1234567890.xyz"
    print(f"\nAnalyzing {bad_domain}...")
    res_bad = await check_email_spoofing(bad_domain)
    print(f"Domain: {res_bad.domain}")
    print(f"SPF: {res_bad.spf_record}")
    print(f"DMARC: {res_bad.dmarc_record}")
    print(f"Is Vulnerable: {res_bad.is_vulnerable_to_spoofing}")
    assert res_bad.spf_record is None
    assert res_bad.dmarc_record is None
    assert res_bad.is_vulnerable_to_spoofing is True, "Non-existent domain should be vulnerable (no records)"

    print("\nAll DNS email forensics checks passed successfully!")

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    asyncio.run(main())
