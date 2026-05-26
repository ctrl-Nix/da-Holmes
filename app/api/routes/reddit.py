from fastapi import APIRouter, HTTPException, Path, status
import httpx
from collections import Counter
from datetime import datetime

router = APIRouter()

@router.get("/analyze/{username}", summary="Reddit User Analyzer")
async def analyze_reddit(
    username: str = Path(..., description="Reddit username to analyze")
):
    username = username.strip().replace("u/", "")
    if not username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username is required."
        )

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 OSINT-Tool/1.0"
    }

    try:
        async with httpx.AsyncClient(timeout=15.0, headers=headers) as client:
            # Fetch user profile
            about_url = f"https://www.reddit.com/user/{username}/about.json"
            about_res = await client.get(about_url)
            
            if about_res.status_code == 404:
                raise HTTPException(status_code=404, detail="Reddit user not found or shadowbanned.")
            elif about_res.status_code != 200:
                raise HTTPException(status_code=about_res.status_code, detail="Failed to fetch Reddit data.")
                
            about_data = about_res.json().get("data", {})
            
            # Fetch recent comments
            comments_url = f"https://www.reddit.com/user/{username}/comments.json?limit=100"
            comments_res = await client.get(comments_url)
            
            comments_data = []
            if comments_res.status_code == 200:
                comments_data = comments_res.json().get("data", {}).get("children", [])
                
            # Analyze subreddits
            subreddits = []
            activity_hours = []
            
            for comment in comments_data:
                c_data = comment.get("data", {})
                sub = c_data.get("subreddit")
                if sub:
                    subreddits.append(sub)
                
                utc_time = c_data.get("created_utc")
                if utc_time:
                    dt = datetime.utcfromtimestamp(utc_time)
                    activity_hours.append(dt.hour)
                    
            # Top subreddits
            top_subs = Counter(subreddits).most_common(5)
            
            # Most active hour (UTC)
            most_active_hour = Counter(activity_hours).most_common(1)[0][0] if activity_hours else None
            
            return {
                "username": about_data.get("name", username),
                "created_utc": about_data.get("created_utc"),
                "link_karma": about_data.get("link_karma", 0),
                "comment_karma": about_data.get("comment_karma", 0),
                "is_employee": about_data.get("is_employee", False),
                "is_mod": about_data.get("is_mod", False),
                "verified": about_data.get("verified", False),
                "icon_img": about_data.get("icon_img", "").split("?")[0],
                "top_subreddits": [{"name": sub, "count": count} for sub, count in top_subs],
                "most_active_hour_utc": most_active_hour,
                "analyzed_comments": len(comments_data)
            }
            
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Network error while contacting Reddit: {str(e)}"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}"
        )
