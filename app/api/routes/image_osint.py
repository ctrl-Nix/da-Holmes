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
    
    return {
        "source_url": url,
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
