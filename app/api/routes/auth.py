from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.core.security import create_access_token, verify_token
import os

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

class LoginRequest(BaseModel):
    username: str
    password: str

@router.post("/login")
async def login(req: LoginRequest):
    # In a full enterprise rollout, this would check against a Postgres Users table
    # For now, it accepts a master admin password from env if auth is enabled
    MASTER_PASSWORD = os.getenv("ADMIN_PASSWORD", "holmesadmin")
    
    if req.username == "admin" and req.password == MASTER_PASSWORD:
        token = create_access_token({"sub": "admin", "role": "admin"})
        return {"access_token": token, "token_type": "bearer"}
    
    raise HTTPException(status_code=401, detail="Invalid credentials")

@router.get("/me")
async def get_current_user(user: dict = Depends(verify_token)):
    return {"user": user["sub"], "role": user.get("role", "user")}
