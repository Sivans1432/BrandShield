import logging
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr, Field
from app.config import settings
from app.database import get_db

logger = logging.getLogger("brandshield.user")
router = APIRouter(prefix="/user", tags=["User Profile"])

# In-memory fallback if MongoDB is not accessible
DEFAULT_USER = {
    "_id": "usr_default_01",
    "id": "usr_default_01",
    "username": "secops_analyst",
    "email": "analyst@brandshield.ai",
    "full_name": "Security Operations Analyst",
    "role": "Tier 2 SOC Lead",
    "organization": "Global SOC Ops",
    "phone": "+1 (555) 019-2834",
    "department": "Cyber Digital Risk Protection",
    "created_at": datetime.now(timezone.utc).isoformat(),
    "last_login": datetime.now(timezone.utc).isoformat(),
    "is_active": True
}

class UserProfileUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    organization: Optional[str] = None

class CreateAccountRequest(BaseModel):
    username: str = Field(..., min_length=3)
    email: str = Field(...)
    password: str = Field(..., min_length=8)
    full_name: Optional[str] = None
    role: Optional[str] = "SOC Analyst"
    organization: Optional[str] = "Global SOC Ops"

from app.services.auth_service import get_current_user
from app.routes.auth import serialize_user

@router.get("/profile")
async def get_profile(
    current_user: Optional[dict] = Depends(get_current_user),
    db = Depends(get_db)
):
    """Fetch an authenticated user profile or the local development fallback."""
    if current_user:
        return serialize_user(current_user)
    if settings.ENVIRONMENT.lower() == "production":
        raise HTTPException(status_code=401, detail="Authentication required.")
        
    try:
        if db is not None:
            user = await db.users.find_one({"is_active": True})
            if user:
                return serialize_user(user)
    except Exception as e:
        logger.warning(f"DB read failed in get_profile: {e}. Using fallback.")
    
    return serialize_user(DEFAULT_USER)

@router.put("/profile")
async def update_profile(
    payload: UserProfileUpdate,
    current_user: Optional[dict] = Depends(get_current_user),
    db = Depends(get_db)
):
    """Update user profile details for authenticated user."""
    if settings.ENVIRONMENT.lower() == "production" and not current_user:
        raise HTTPException(status_code=401, detail="Authentication required.")
    updates = {k: v for k, v in payload.dict().items() if v is not None}
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    password = updates.pop("password", None)
    if password:
        from app.services.auth_service import hash_password
        updates["password_hash"] = hash_password(password)
        updates["password_changed_at"] = updates["updated_at"]
    
    try:
        if db is not None:
            if current_user:
                from bson import ObjectId
                uid = current_user["id"]
                q = {"_id": ObjectId(uid)} if ObjectId.is_valid(uid) else {"_id": uid}
                res = await db.users.find_one_and_update(
                    q,
                    {"$set": updates},
                    return_document=True
                )
            else:
                res = await db.users.find_one_and_update(
                    {"is_active": True},
                    {"$set": updates},
                    return_document=True
                )
            if res:
                return serialize_user(res)
    except Exception as e:
        logger.warning(f"DB update failed in update_profile: {e}")
        
    # Update in-memory fallback
    DEFAULT_USER.update(updates)
    return serialize_user(DEFAULT_USER)

@router.post("/create-account")
async def create_account(payload: CreateAccountRequest, db = Depends(get_db)):
    """Create a new user account and set it as the active profile."""
    if settings.ENVIRONMENT.lower() == "production":
        raise HTTPException(status_code=410, detail="Use the secure /api/auth/register endpoint.")

    from app.services.auth_service import hash_password

    now = datetime.now(timezone.utc).isoformat()
    new_user = {
        "username": payload.username.strip(),
        "email": payload.email.strip().lower(),
        "password_hash": hash_password(payload.password),
        "full_name": payload.full_name or payload.username,
        "role": payload.role or "SOC Analyst",
        "organization": payload.organization or "Global SOC Ops",
        "phone": "+1 (555) 012-3456",
        "department": "Digital Risk Protection",
        "created_at": now,
        "last_login": now,
        "is_active": True
    }
    
    try:
        if db is not None:
            # Set other users to inactive
            await db.users.update_many({}, {"$set": {"is_active": False}})
            res = await db.users.insert_one(new_user)
            new_user["id"] = str(res.inserted_id)
            new_user.pop("_id", None)
            return {
                "success": True,
                "message": f"Account '{new_user['username']}' successfully created and activated.",
                "user": serialize_user(new_user)
            }
    except Exception as e:
        logger.warning(f"DB insert failed in create_account: {e}")

    # Fallback
    DEFAULT_USER.clear()
    DEFAULT_USER.update(new_user)
    DEFAULT_USER["id"] = f"usr_{int(datetime.now().timestamp())}"
    return {
        "success": True,
        "message": f"Account '{new_user['username']}' successfully created.",
        "user": serialize_user(DEFAULT_USER)
    }

@router.post("/forgot-password")
async def forgot_password():
    """Direct callers to the token-based password reset flow."""
    raise HTTPException(
        status_code=410,
        detail="This legacy reset endpoint is disabled. Use /api/auth/forgot-password.",
    )
