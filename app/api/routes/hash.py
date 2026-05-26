from fastapi import APIRouter, HTTPException, Query, status
import re

router = APIRouter()

def identify_hash(h: str) -> list:
    h = h.strip()
    length = len(h)
    possible = []
    
    # Bcrypt
    if re.match(r"^\$2[aby]\$[0-9]{2}\$[./A-Za-z0-9]{53}$", h):
        possible.append({"name": "Bcrypt", "description": "Often used for UNIX passwords and web apps."})
    
    # Argon2
    elif h.startswith("$argon2"):
        possible.append({"name": "Argon2", "description": "Modern memory-hard password hashing."})
        
    # Hex hashes
    elif re.match(r"^[a-fA-F0-9]+$", h):
        if length == 32:
            possible.append({"name": "MD5", "description": "Legacy hash used in old CMS and files."})
            possible.append({"name": "NTLM", "description": "Windows password hash."})
        elif length == 40:
            possible.append({"name": "SHA-1", "description": "Git commits, older certificates."})
        elif length == 64:
            possible.append({"name": "SHA-256", "description": "Standard modern hashing algorithm."})
        elif length == 128:
            possible.append({"name": "SHA-512", "description": "High security hashing algorithm."})
            
    # Base64-like lengths for specific web frameworks can be added here
            
    if not possible:
        possible.append({"name": "Unknown", "description": "Format not recognized as a standard cryptographic hash."})
        
    return possible

@router.get("/analyze", summary="Cryptographic Hash Analyzer")
async def analyze_hash(
    hash_value: str = Query(..., description="The cryptographic hash string to analyze")
):
    hash_value = hash_value.strip()
    if not hash_value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Hash value is required."
        )

    algorithms = identify_hash(hash_value)
    
    # Pivot links
    crackstation_url = "https://crackstation.net/"
    hashes_org_url = f"https://hashes.com/en/decrypt/hash"

    return {
        "hash": hash_value,
        "length": len(hash_value),
        "possible_algorithms": algorithms,
        "search_links": [
            {
                "platform": "CrackStation",
                "url": crackstation_url,
                "description": "Massive pre-computed lookup table for MD5, SHA1, and NTLM hashes."
            },
            {
                "platform": "Hashes.com",
                "url": hashes_org_url,
                "description": "Online hash decryption and lookup service."
            }
        ]
    }
