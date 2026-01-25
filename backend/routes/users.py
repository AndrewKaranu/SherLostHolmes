from fastapi import APIRouter, HTTPException
from database import get_users_collection
from models import UserCreate, UserInDB
from typing import Optional

router = APIRouter(prefix="/api/users", tags=["users"])


@router.post("/sync")
async def sync_user(clerk_id: str, email: str, student_id: Optional[str] = None):
    """
    Sync a Clerk user with MongoDB.
    Called from the frontend after successful Clerk authentication.
    """
    users = get_users_collection()
    
    # Check if user already exists
    existing_user = users.find_one({"clerk_id": clerk_id})
    
    if existing_user:
        # Update existing user
        users.update_one(
            {"clerk_id": clerk_id},
            {"$set": {"email": email, "student_id": student_id}}
        )
        return {"status": "updated", "clerk_id": clerk_id}
    
    # Create new user
    new_user = {
        "clerk_id": clerk_id,
        "email": email,
        "student_id": student_id,
        "role": "user",
        "trust_rating": 5.0,
        "spins": 3  # New users start with 3 free spins
    }
    
    result = users.insert_one(new_user)
    return {"status": "created", "clerk_id": clerk_id, "id": str(result.inserted_id)}


@router.get("/{clerk_id}")
async def get_user(clerk_id: str):
    """Get a user by their Clerk ID."""
    users = get_users_collection()
    user = users.find_one({"clerk_id": clerk_id})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user["_id"] = str(user["_id"])
    return user


@router.patch("/{clerk_id}/student-id")
async def update_student_id(clerk_id: str, student_id: str):
    """Update a user's student ID (for university verification)."""
    users = get_users_collection()
    result = users.update_one(
        {"clerk_id": clerk_id},
        {"$set": {"student_id": student_id}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"status": "updated", "student_id": student_id}


@router.patch("/{clerk_id}/role")
async def update_role(clerk_id: str, role: str):
    """Update a user's role (user or assistant)."""
    if role not in ["user", "assistant"]:
        raise HTTPException(status_code=400, detail="Role must be 'user' or 'assistant'")
    
    users = get_users_collection()
    result = users.update_one(
        {"clerk_id": clerk_id},
        {"$set": {"role": role}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"status": "updated", "role": role}


# ============== Spins Management ==============

@router.get("/{clerk_id}/spins")
async def get_user_spins(clerk_id: str):
    """Get a user's current spin count."""
    users = get_users_collection()
    user = users.find_one({"clerk_id": clerk_id})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"clerk_id": clerk_id, "spins": user.get("spins", 0)}


@router.post("/{clerk_id}/spins/use")
async def use_spin(clerk_id: str):
    """
    Use one spin. Returns the new spin count.
    Fails if user has no spins left.
    """
    users = get_users_collection()
    user = users.find_one({"clerk_id": clerk_id})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    current_spins = user.get("spins", 0)
    
    if current_spins <= 0:
        raise HTTPException(status_code=400, detail="No spins remaining")
    
    result = users.update_one(
        {"clerk_id": clerk_id},
        {"$inc": {"spins": -1}}
    )
    
    return {
        "clerk_id": clerk_id,
        "spins": current_spins - 1,
        "message": "Spin used successfully"
    }


@router.post("/{clerk_id}/spins/add")
async def add_spins(clerk_id: str, amount: int):
    """
    Add spins to a user's account.
    Used when submitting items (5 spins) or when matching fails (2 spins).
    """
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    
    users = get_users_collection()
    
    result = users.update_one(
        {"clerk_id": clerk_id},
        {"$inc": {"spins": amount}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get updated count
    user = users.find_one({"clerk_id": clerk_id})
    
    return {
        "clerk_id": clerk_id,
        "spins_added": amount,
        "spins": user.get("spins", 0),
        "message": f"Added {amount} spins"
    }
