from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, List
import json
from app.core.database import db
from app.core.vault import encrypt_secret, decrypt_secret

router = APIRouter(prefix="/api/vault", tags=["Secrets Vault"])

class SecretStoreRequest(BaseModel):
    service: str
    api_key: str

@router.post("/store")
async def store_secret(req: SecretStoreRequest):
    # Fallback owner for single-tenant / local mode
    owner_id = "default_user"
    
    if not req.service or not req.api_key:
        raise HTTPException(status_code=400, detail="Service and API key are required")
        
    encrypted = encrypt_secret(req.api_key)
    db.save_secret(owner_id, req.service, encrypted)
    
    return {"status": "success", "message": f"{req.service} key encrypted and securely stored in vault."}

@router.get("/list")
async def list_secrets():
    owner_id = "default_user"
    services = db.list_secrets(owner_id)
    return {"services_configured": services}

@router.delete("/{service}")
async def delete_secret(service: str):
    owner_id = "default_user"
    db.delete_secret(owner_id, service)
    return {"status": "success", "message": f"{service} key deleted from vault."}

# Helper function to inject vault secrets into any OSINT module request
def get_decrypted_secrets(owner_id: str = "default_user") -> Dict[str, str]:
    services = db.list_secrets(owner_id)
    secrets = {}
    for s in services:
        enc = db.get_secret(owner_id, s)
        if enc:
            dec = decrypt_secret(enc)
            if dec:
                secrets[s] = dec
    return secrets
