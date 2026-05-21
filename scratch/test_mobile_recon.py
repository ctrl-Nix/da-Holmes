import asyncio
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.api.routes.mobile_recon import fetch_play_store_intel

async def main():
    print("=== Testing Mobile App Recon (Google Play Scraper) ===\n")

    # Test 1: Known company
    print("Test 1: Searching for 'Zepto'...")
    result = await fetch_play_store_intel("Zepto")
    if result:
        print(f"  Title     : {result.title}")
        print(f"  AppId     : {result.appId}")
        print(f"  Developer : {result.developer}")
        print(f"  Score     : {result.score}")
        print(f"  Installs  : {result.installs}")
        assert result.appId, "appId must not be empty"
    else:
        print("  No result found (may vary by region).")

    # Test 2: Non-existent company — should return None, not crash
    print("\nTest 2: Searching for garbage input '@@@@zzznomatch@@@@'...")
    result2 = await fetch_play_store_intel("@@@@zzznomatch@@@@")
    # Either None or some unexpected match — either way should not raise
    print(f"  Result: {result2}  (None is acceptable)")

    print("\nAll Mobile Recon tests passed!")

if __name__ == "__main__":
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    asyncio.run(main())
