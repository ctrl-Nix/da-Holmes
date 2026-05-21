from fastapi import APIRouter, Query, HTTPException, status, Request
from app.services.social_scraper import SocialScraper

router = APIRouter()
_scraper = SocialScraper()

@router.get(
    "/friendship/graph",
    status_code=status.HTTP_200_OK,
    summary="Generate a friendship graph between two targets"
)
async def get_friendship_graph(
    request: Request,
    target1: str = Query(..., description="First target username"),
    target2: str = Query(..., description="Second target username"),
    platform: str = Query("github", description="Platform to check (github, twitter, instagram)")
):
    """
    Fetches followers for both targets on the specified platform and finds common connections.
    """
    p = platform.lower()
    
    if p == "github":
        f1 = await _scraper.get_github_followers(target1)
        f2 = await _scraper.get_github_followers(target2)
    elif p == "twitter":
        f1 = await _scraper.get_twitter_followers(target1)
        f2 = await _scraper.get_twitter_followers(target2)
    elif p == "instagram":
        f1 = await _scraper.get_instagram_followers(target1)
        f2 = await _scraper.get_instagram_followers(target2)
    else:
        # Generic fallback
        f1 = await _scraper.get_github_followers(target1)
        f2 = await _scraper.get_github_followers(target2)
    
    # Don't raise 404, just return empty results to keep UI stable
    if not f1 and not f2:
        return {
            "nodes": [
                {"id": target1, "label": target1, "type": "target1", "platform": p},
                {"id": target2, "label": target2, "type": "target2", "platform": p}
            ],
            "links": [],
            "common_count": 0,
            "target1_count": 0,
            "target2_count": 0,
            "platform": p,
            "message": f"No followers found for {platform} or failed to fetch data."
        }
        
    set1 = set(f1)
    set2 = set(f2)
    common = set1.intersection(set2)
    
    nodes = [
        {"id": target1, "label": target1, "type": "target1", "platform": p},
        {"id": target2, "label": target2, "type": "target2", "platform": p}
    ]
    links = []
    
    for user in set1:
        if user in common:
            nodes.append({"id": user, "label": user, "type": "mutual", "platform": p})
            links.append({"source": target1, "target": user})
            links.append({"source": target2, "target": user})
        else:
            nodes.append({"id": user, "label": user, "type": "target1_follower", "platform": p})
            links.append({"source": target1, "target": user})

    for user in set2:
        if user not in common:
            nodes.append({"id": user, "label": user, "type": "target2_follower", "platform": p})
            links.append({"source": target2, "target": user})
        
    return {
        "nodes": nodes,
        "links": links,
        "common_count": len(common),
        "target1_count": len(f1),
        "target2_count": len(f2),
        "platform": p
    }
