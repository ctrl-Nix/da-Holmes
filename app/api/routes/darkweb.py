from fastapi import APIRouter, HTTPException, Query, status
import httpx
from bs4 import BeautifulSoup
import asyncio

router = APIRouter()

@router.get("/scan", summary="Dark Web & Tor Network Search")
async def scan_darkweb(
    query: str = Query(..., description="Email, username, or domain to search on the dark web")
):
    query = query.strip()
    if not query:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Search query is required."
        )

    results = []
    try:
        # Ahmia is a public search engine for Tor Hidden Services
        # It searches .onion sites without needing to be on Tor
        url = "https://ahmia.fi/search/"
        
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url, params={"q": query})
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, "html.parser")
                # Parse search results
                for li in soup.find_all("li", class_="searchResultsItem"):
                    title_elem = li.find("h4")
                    link_elem = li.find("cite")
                    desc_elem = li.find("p")
                    
                    if title_elem and link_elem:
                        results.append({
                            "title": title_elem.text.strip(),
                            "onion_url": link_elem.text.strip(),
                            "snippet": desc_elem.text.strip() if desc_elem else "No description available",
                            "source": "Ahmia Tor Search"
                        })
            
            # If no results found, or if Ahmia is returning empty
            return {
                "query": query,
                "findings": results,
                "count": len(results),
                "message": f"Found {len(results)} potential matches on Tor hidden services."
            }

    except httpx.RequestError as e:
        return {
            "query": query,
            "findings": [],
            "count": 0,
            "message": "Warning: Ahmia Tor Gateway timed out or dropped the connection. Try again later."
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}"
        )
