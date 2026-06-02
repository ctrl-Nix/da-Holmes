import asyncio
import aiodns
async def main():
    resolver = aiodns.DNSResolver()
    res = await resolver.query('google.com', 'A')
    print(res)

asyncio.run(main())
