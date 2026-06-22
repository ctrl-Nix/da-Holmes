from fastapi import APIRouter, HTTPException, Query, status
from urllib.parse import quote_plus

router = APIRouter()

@router.get("/generate", summary="Reverse Image Search Links")
async def generate_image_links(
    url: str = Query(..., description="Public image URL to reverse search")
):
    url = url.strip()
    if not url.startswith("http"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Valid image URL starting with http/https is required."
        )

    encoded_url = quote_plus(url)
    
    try:
        from app.modules.browser_engine import browser_engine
        lens_url = f"https://lens.google.com/uploadbyurl?url={encoded_url}"
        html = await browser_engine.get_page_content(lens_url)
        import re
        titles = re.findall(r'<div class="([^"]*)">([^<]+)</div>', html)
        best_match = titles[0][1] if titles else "Could not auto-scrape Lens results."
    except Exception as e:
        best_match = f"Auto-scrape failed: {str(e)}"

    return {
        "source_url": url,
        "auto_scrape_result": best_match,
        "search_links": [
            {
                "engine": "Yandex",
                "url": f"https://yandex.com/images/search?url={encoded_url}&rpt=imageview",
                "description": "Best for facial recognition and Eastern European sites."
            },
            {
                "engine": "Google Images",
                "url": f"https://lens.google.com/uploadbyurl?url={encoded_url}",
                "description": "Best for general objects, landmarks, and global sites."
            },
            {
                "engine": "Bing Visual Search",
                "url": f"https://www.bing.com/images/search?view=detailv2&iss=sbi&FORM=SBIHMP&sbisrc=UrlP&q=imgurl:{encoded_url}",
                "description": "Good alternative general search index."
            },
            {
                "engine": "TinEye",
                "url": f"https://tineye.com/search?url={encoded_url}",
                "description": "Best for exact image matching and finding original sources."
            }
        ]
    }
