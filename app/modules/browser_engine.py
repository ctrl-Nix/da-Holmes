import asyncio
import logging

logger = logging.getLogger("holmes.browser")

class BrowserEngine:
    def __init__(self):
        self.playwright = None
        self.browser = None
        self.enabled = False

    async def init_browser(self):
        try:
            from playwright.async_api import async_playwright
            self.playwright = await async_playwright().start()
            self.browser = await self.playwright.chromium.launch(
                headless=True,
                args=["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
            )
            self.enabled = True
            logger.info("Playwright headless browser initialized successfully.")
        except ImportError:
            logger.warning("Playwright not installed. Dynamic JS rendering is disabled. (Run: pip install playwright && playwright install chromium)")
        except Exception as e:
            logger.error(f"Failed to initialize Playwright: {e}")

    async def get_page_content(self, url: str, wait_for_selector: str = None) -> str:
        if not self.enabled or not self.browser:
            return ""
            
        context = None
        page = None
        try:
            # Use anti-detect techniques if needed
            context = await self.browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                viewport={"width": 1920, "height": 1080}
            )
            page = await context.new_page()
            
            # Evade webdriver detection slightly
            await page.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
            
            await page.goto(url, wait_until="networkidle")
            
            if wait_for_selector:
                await page.wait_for_selector(wait_for_selector, timeout=10000)
                
            content = await page.content()
            return content
        except Exception as e:
            logger.error(f"Browser Engine failed to fetch {url}: {e}")
            return ""
        finally:
            if page:
                await page.close()
            if context:
                await context.close()

    async def close(self):
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()

browser_engine = BrowserEngine()
