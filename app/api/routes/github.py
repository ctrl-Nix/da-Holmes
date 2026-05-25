import os
import httpx
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

# Keywords suggesting internal tooling or dev infrastructure
INTERNAL_KEYWORDS = {
    "tool", "internal", "admin", "dashboard", "devops", "infra", "automate", 
    "cli", "sdk", "deploy", "setup", "helper", "utility", "script", "config",
    "builder", "generator", "manager", "agent", "scanner", "ops", "monitor"
}

class GitHubRepoInfo(BaseModel):
    name: str
    description: Optional[str] = None
    primary_language: Optional[str] = None
    is_fork: bool
    is_internal_tool: bool

class GitHubOrgIntelligenceResponse(BaseModel):
    status: str
    organization: str
    total_repos: int
    internal_tools_count: int
    repositories: List[GitHubRepoInfo]

def evaluate_is_internal_tool(name: str, description: Optional[str]) -> bool:
    name_lower = name.lower()
    desc_lower = (description or "").lower()
    for keyword in INTERNAL_KEYWORDS:
        # Match word boundaries or simple substrings for heuristics
        if keyword in name_lower or keyword in desc_lower:
            return True
    return False

@router.get(
    "/org",
    response_model=GitHubOrgIntelligenceResponse,
    status_code=status.HTTP_200_OK,
    summary="Gather repository intelligence on a GitHub organization"
)
async def get_github_org_repos(
    org: str = Query(..., description="GitHub organization name.", examples=["zeptonow"])
):
    """
    **GET** `/api/github/org?org=<org_name>`
    
    Queries the public GitHub REST API for an organization's public repositories, 
    filtering and identifying potential internal tooling. Uses Authorization PAT if present in .env.
    """
    org_name = org.strip()
    if not org_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Organization name query parameter cannot be empty."
        )

    # Load GitHub PAT token from environment to bypass 60 req/hour limit
    github_token = os.getenv("GITHUB_PAT") or os.getenv("GITHUB_TOKEN")
    
    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "Holmes-OSINT-Platform/3.0"
    }
    if github_token:
        headers["Authorization"] = f"Bearer {github_token}"

    repositories = []
    page = 1

    try:
        async with httpx.AsyncClient() as client:
            while page <= 5:  # Cap at 5 pages (500 repos max) to keep response times within bounds
                url = f"https://api.github.com/orgs/{org_name}/repos?per_page=100&page={page}"
                response = await client.get(url, headers=headers, timeout=15.0)

                if response.status_code == 404:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"GitHub organization '{org_name}' not found."
                    )
                elif response.status_code == 403:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Access forbidden. GitHub rate limit exceeded or token invalid."
                    )
                elif response.status_code != 200:
                    raise HTTPException(
                        status_code=response.status_code,
                        detail=f"GitHub API returned error code {response.status_code}: {response.text}"
                    )

                page_repos = response.json()
                if not page_repos:
                    break

                for repo in page_repos:
                    name = repo.get("name", "")
                    description = repo.get("description")
                    is_fork = repo.get("fork", False)
                    is_internal = evaluate_is_internal_tool(name, description)

                    repositories.append(GitHubRepoInfo(
                        name=name,
                        description=description,
                        primary_language=repo.get("language"),
                        is_fork=is_fork,
                        is_internal_tool=is_internal
                    ))

                if len(page_repos) < 100:
                    break
                page += 1

    except httpx.HTTPError as err:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Outbound request to GitHub API failed: {str(err)}"
        )

    internal_count = sum(1 for r in repositories if r.is_internal_tool)

    return GitHubOrgIntelligenceResponse(
        status="success",
        organization=org_name,
        total_repos=len(repositories),
        internal_tools_count=internal_count,
        repositories=repositories
    )
