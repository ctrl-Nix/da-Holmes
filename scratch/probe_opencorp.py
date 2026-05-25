import httpx, asyncio, sys

async def probe():
    async with httpx.AsyncClient(timeout=10.0) as client:
        r = await client.get("https://api.opencorporates.com/v0.4/companies/search", params={"q": "Apple Inc", "per_page": 1})
        print("Status:", r.status_code)
        print(r.text[:600])

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
asyncio.run(probe())
