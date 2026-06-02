import asyncio
import os
import sys

sys.path.append(os.getcwd())

from main import generate_pdf_report

async def test():
    try:
        res = await generate_pdf_report(query="test", payload={"target": "test", "risk_score": 50})
        print("Success! length:", len(res.body))
    except Exception as e:
        print("Error:", e)

asyncio.run(test())
