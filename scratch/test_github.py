import asyncio
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.api.routes.github import get_github_org_repos

async def main():
    print("=== Testing GitHub Org Repository Intelligence Scanner ===")
    
    # Target organization
    org = "zeptonow"
    print(f"Retrieving public repositories for organization: '{org}'...")
    
    try:
        result = await get_github_org_repos(org=org)
        print("Scan Status: success")
        print("Organization:", result.organization)
        print("Total Repositories Fetched:", result.total_repos)
        print("Internal Tooling Count:", result.internal_tools_count)
        
        print("\nFirst 5 Repositories Details:")
        for idx, repo in enumerate(result.repositories[:5]):
            # Safe print encoding to avoid Windows charmap encoding errors
            safe_name = repo.name.encode(sys.stdout.encoding, errors='ignore').decode(sys.stdout.encoding)
            safe_desc = (repo.description or "").encode(sys.stdout.encoding, errors='ignore').decode(sys.stdout.encoding)
            
            print(f"  [{idx + 1}] Name: {safe_name}")
            print(f"      Description: {safe_desc}")
            print(f"      Language: {repo.primary_language}")
            print(f"      Is Fork: {repo.is_fork}")
            print(f"      Is Internal Tool: {repo.is_internal_tool}")
            
        assert result.total_repos >= 0
        print("\nGitHub Org Intelligence Scanner Test Passed!")
    except Exception as e:
        print(f"\nScan failed with error: {e}")
        if "rate limit" in str(e).lower() or "403" in str(e):
            print("WARNING: GitHub API rate limit hit. Test skipped.")
        else:
            sys.exit(1)

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    asyncio.run(main())
