import asyncio
import sys
import os
from unittest.mock import MagicMock

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.api.routes.techstack import analyze_tech_stack

async def main():
    print("=== Testing Wappalyzer Technology Stack Scanner ===")
    
    mock_request = MagicMock()
    target = "https://wordpress.org"
    print(f"Scanning target: {target}...")
    
    try:
        result = await analyze_tech_stack(request=mock_request, domain=target)
        print("Scan Status:", result.status)
        print("Scanned Domain:", result.domain)
        print("Detected Categories:")
        for category, technologies in result.categories.items():
            print(f"  - {category}: {technologies}")
        
        # Verify that we got some typical web technologies (like WordPress, PHP, MySQL, Nginx, etc.)
        assert len(result.categories) > 0, "Should detect at least one technology category"
        print("Wappalyzer Technology Stack Scan Test Passed!")
    except Exception as e:
        print(f"Scan failed with error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    asyncio.run(main())
