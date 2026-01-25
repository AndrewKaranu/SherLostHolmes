"""
Locker Routes - Pickup Locker Management & ESP32 Integration

Handles:
- Locker assignment when match is approved
- ESP32 authentication endpoints
- Item collection tracking
- Locker status management
"""
import random
import string
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Literal
from datetime import datetime
from bson import ObjectId

from database import get_lockers_collection, get_items_collection, get_matches_collection, get_users_collection

router = APIRouter(prefix="/api/lockers", tags=["lockers"])


# ============== Constants ==============
LOCKER_LOCATIONS = {
    1: "Hall Building - H1 Lobby",
    2: "Hall Building - H1 Lobby",
    3: "Library Building - LB 1st Floor",
    4: "Library Building - LB 1st Floor",
    5: "EV Building - Main Entrance",
    6: "EV Building - Main Entrance",
    7: "JMSB Building - MB Lobby",
    8: "JMSB Building - MB Lobby",
    9: "Grey Nuns - GN Main Hall",
    10: "Grey Nuns - GN Main Hall",
}

TOTAL_LOCKERS = 10  # Number of physical lockers


# ============== Pydantic Models ==============
class LockerResponse(BaseModel):
    id: str
    locker_number: int
    location: str
    status: str
    item_id: Optional[str] = None
    match_id: Optional[str] = None
    user_id: Optional[str] = None
    user_email: Optional[str] = None
    password: Optional[str] = None
    item_name: Optional[str] = None
    assigned_at: Optional[datetime] = None
    unlocked_at: Optional[datetime] = None
    collected_at: Optional[datetime] = None


class LockerAssignRequest(BaseModel):
    match_id: str
    item_id: str
    user_id: str
    user_email: str


class ESP32LockerResponse(BaseModel):
    """Response for ESP32 authentication"""
    locker_number: int
    item_id: str
    password: str
    status: str


class ESP32UnlockRequest(BaseModel):
    """Request from ESP32 when locker is unlocked"""
    password: str


class ESP32CollectedRequest(BaseModel):
    """Request from ESP32 when item is removed"""
    password: str


class LockerStatsResponse(BaseModel):
    total_lockers: int
    available: int
    assigned: int
    unlocked: int
    collected: int


# ============== Helper Functions ==============
def generate_locker_password() -> str:
    """Generate a 4-digit numeric password."""
    return ''.join(random.choices(string.digits, k=4))


def find_available_locker() -> Optional[int]:
    """Find the first available locker number."""
    lockers = get_lockers_collection()

    # Get all occupied locker numbers
    occupied = set()
    for locker in lockers.find({"status": {"$in": ["assigned", "unlocked"]}}):
        occupied.add(locker["locker_number"])

    # Find first available
    for i in range(1, TOTAL_LOCKERS + 1):
        if i not in occupied:
            return i

    return None


def initialize_lockers():
    """Initialize locker records if they don't exist."""
    lockers = get_lockers_collection()

    for i in range(1, TOTAL_LOCKERS + 1):
        existing = lockers.find_one({"locker_number": i})
        if not existing:
            lockers.insert_one({
                "locker_number": i,
                "location": LOCKER_LOCATIONS.get(i, f"Location {i}"),
                "status": "available",
                "item_id": None,
                "match_id": None,
                "user_id": None,
                "user_email": None,
                "password": None,
                "item_name": None,
                "assigned_at": None,
                "unlocked_at": None,
                "collected_at": None,
                "created_at": datetime.utcnow()
            })


# ============== Admin Endpoints ==============

@router.get("/", response_model=List[LockerResponse])
async def get_all_lockers():
    """Get all lockers with their current status."""
    lockers = get_lockers_collection()
    items = get_items_collection()

    # Initialize if needed
    if lockers.count_documents({}) == 0:
        initialize_lockers()

    result = []
    for locker in lockers.find().sort("locker_number", 1):
        # Get item name if assigned
        item_name = None
        if locker.get("item_id"):
            item = items.find_one({"_id": ObjectId(locker["item_id"])})
            if item:
                item_name = item.get("item_name", "Unknown Item")

        result.append(LockerResponse(
            id=str(locker["_id"]),
            locker_number=locker["locker_number"],
            location=locker.get("location", LOCKER_LOCATIONS.get(locker["locker_number"], "Unknown")),
            status=locker.get("status", "available"),
            item_id=locker.get("item_id"),
            match_id=locker.get("match_id"),
            user_id=locker.get("user_id"),
            user_email=locker.get("user_email"),
            password=locker.get("password"),
            item_name=item_name,
            assigned_at=locker.get("assigned_at"),
            unlocked_at=locker.get("unlocked_at"),
            collected_at=locker.get("collected_at")
        ))

    return result


@router.get("/stats", response_model=LockerStatsResponse)
async def get_locker_stats():
    """Get locker statistics for dashboard."""
    lockers = get_lockers_collection()

    # Initialize if needed
    if lockers.count_documents({}) == 0:
        initialize_lockers()

    stats = {
        "total_lockers": TOTAL_LOCKERS,
        "available": lockers.count_documents({"status": "available"}),
        "assigned": lockers.count_documents({"status": "assigned"}),
        "unlocked": lockers.count_documents({"status": "unlocked"}),
        "collected": lockers.count_documents({"status": "collected"})
    }

    return LockerStatsResponse(**stats)


@router.post("/assign")
async def assign_locker(request: LockerAssignRequest):
    """
    Assign an item to an available locker.
    Called when admin approves a match.
    Returns locker details including password for email.
    """
    lockers = get_lockers_collection()
    items = get_items_collection()

    # Initialize if needed
    if lockers.count_documents({}) == 0:
        initialize_lockers()

    # Find available locker
    locker_number = find_available_locker()
    if locker_number is None:
        raise HTTPException(
            status_code=503,
            detail="No lockers available. Please try again later."
        )

    # Get item details
    item = items.find_one({"_id": ObjectId(request.item_id)})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    # Generate password
    password = generate_locker_password()
    location = LOCKER_LOCATIONS.get(locker_number, f"Locker Station {locker_number}")

    # Update or create locker record
    now = datetime.utcnow()
    locker_data = {
        "locker_number": locker_number,
        "location": location,
        "status": "assigned",
        "item_id": request.item_id,
        "match_id": request.match_id,
        "user_id": request.user_id,
        "user_email": request.user_email,
        "password": password,
        "item_name": item.get("item_name", "Unknown Item"),
        "assigned_at": now,
        "unlocked_at": None,
        "collected_at": None,
        "updated_at": now
    }

    lockers.update_one(
        {"locker_number": locker_number},
        {"$set": locker_data},
        upsert=True
    )

    return {
        "status": "success",
        "locker_number": locker_number,
        "location": location,
        "password": password,
        "item_name": item.get("item_name", "Unknown Item"),
        "message": f"Item assigned to Locker #{locker_number} at {location}"
    }


@router.post("/release/{locker_number}")
async def release_locker(locker_number: int):
    """
    Manually release a locker (admin action).
    Use when item needs to be removed without pickup.
    """
    lockers = get_lockers_collection()

    result = lockers.update_one(
        {"locker_number": locker_number},
        {
            "$set": {
                "status": "available",
                "item_id": None,
                "match_id": None,
                "user_id": None,
                "user_email": None,
                "password": None,
                "item_name": None,
                "assigned_at": None,
                "unlocked_at": None,
                "collected_at": None,
                "updated_at": datetime.utcnow()
            }
        }
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Locker not found")

    return {"status": "success", "message": f"Locker #{locker_number} released"}


# ============== ESP32 Endpoints ==============

@router.get("/esp32/{locker_number}", response_model=ESP32LockerResponse)
async def esp32_get_locker_info(locker_number: int):
    """
    ESP32 calls this to get current locker assignment.
    Returns item_id and expected password for verification.
    """
    lockers = get_lockers_collection()

    locker = lockers.find_one({"locker_number": locker_number})
    if not locker:
        raise HTTPException(status_code=404, detail="Locker not found")

    if locker.get("status") == "available":
        raise HTTPException(status_code=404, detail="Locker is not assigned")

    return ESP32LockerResponse(
        locker_number=locker_number,
        item_id=locker.get("item_id", ""),
        password=locker.get("password", ""),
        status=locker.get("status", "unknown")
    )


@router.post("/esp32/{locker_number}/verify")
async def esp32_verify_password(locker_number: int, request: ESP32UnlockRequest):
    """
    ESP32 calls this to verify the password entered by user.
    Returns success/failure without changing state.
    """
    lockers = get_lockers_collection()

    locker = lockers.find_one({"locker_number": locker_number})
    if not locker:
        raise HTTPException(status_code=404, detail="Locker not found")

    if locker.get("status") not in ["assigned", "unlocked"]:
        raise HTTPException(status_code=400, detail="Locker is not available for unlock")

    if locker.get("password") == request.password:
        return {"status": "success", "valid": True, "message": "Password correct"}
    else:
        return {"status": "success", "valid": False, "message": "Invalid password"}


@router.post("/esp32/{locker_number}/unlock")
async def esp32_unlock_locker(locker_number: int, request: ESP32UnlockRequest):
    """
    ESP32 calls this when locker is unlocked with correct password.
    Records the unlock event.
    """
    lockers = get_lockers_collection()

    locker = lockers.find_one({"locker_number": locker_number})
    if not locker:
        raise HTTPException(status_code=404, detail="Locker not found")

    if locker.get("password") != request.password:
        raise HTTPException(status_code=401, detail="Invalid password")

    now = datetime.utcnow()
    lockers.update_one(
        {"locker_number": locker_number},
        {
            "$set": {
                "status": "unlocked",
                "unlocked_at": now,
                "updated_at": now
            }
        }
    )

    return {
        "status": "success",
        "locker_number": locker_number,
        "item_id": locker.get("item_id"),
        "message": "Locker unlocked successfully"
    }


@router.post("/esp32/{locker_number}/collected")
async def esp32_item_collected(locker_number: int, request: ESP32CollectedRequest):
    """
    ESP32 calls this when item is removed from locker.
    Updates item status to 'returned' and frees the locker.
    """
    lockers = get_lockers_collection()
    items = get_items_collection()
    matches = get_matches_collection()

    locker = lockers.find_one({"locker_number": locker_number})
    if not locker:
        raise HTTPException(status_code=404, detail="Locker not found")

    if locker.get("password") != request.password:
        raise HTTPException(status_code=401, detail="Invalid password")

    now = datetime.utcnow()
    item_id = locker.get("item_id")
    match_id = locker.get("match_id")

    # Update item status to returned
    if item_id:
        items.update_one(
            {"_id": ObjectId(item_id)},
            {
                "$set": {
                    "status": "returned",
                    "returned_at": now,
                    "updated_at": now
                }
            }
        )

    # Update match status
    if match_id:
        matches.update_one(
            {"_id": ObjectId(match_id)},
            {
                "$set": {
                    "collected_at": now,
                    "updated_at": now
                }
            }
        )

    # Mark locker as collected (keep record for tracking, then reset)
    lockers.update_one(
        {"locker_number": locker_number},
        {
            "$set": {
                "status": "collected",
                "collected_at": now,
                "updated_at": now
            }
        }
    )

    return {
        "status": "success",
        "locker_number": locker_number,
        "item_id": item_id,
        "message": "Item marked as collected"
    }


@router.post("/esp32/{locker_number}/reset")
async def esp32_reset_locker(locker_number: int):
    """
    ESP32 calls this to reset locker to available state.
    Called after item has been collected and locker is empty.
    """
    lockers = get_lockers_collection()

    locker = lockers.find_one({"locker_number": locker_number})
    if not locker:
        raise HTTPException(status_code=404, detail="Locker not found")

    now = datetime.utcnow()
    lockers.update_one(
        {"locker_number": locker_number},
        {
            "$set": {
                "status": "available",
                "item_id": None,
                "match_id": None,
                "user_id": None,
                "user_email": None,
                "password": None,
                "item_name": None,
                "assigned_at": None,
                "unlocked_at": None,
                "collected_at": None,
                "updated_at": now
            }
        }
    )

    return {
        "status": "success",
        "locker_number": locker_number,
        "message": "Locker reset to available"
    }


# ============== Tracking Endpoints ==============

@router.get("/tracking")
async def get_locker_tracking():
    """
    Get detailed tracking information for all lockers.
    For admin monitoring page.
    """
    lockers = get_lockers_collection()
    items = get_items_collection()
    users = get_users_collection()

    # Initialize if needed
    if lockers.count_documents({}) == 0:
        initialize_lockers()

    tracking_data = []

    for locker in lockers.find().sort("locker_number", 1):
        entry = {
            "locker_number": locker["locker_number"],
            "location": locker.get("location", "Unknown"),
            "status": locker.get("status", "available"),
            "password": locker.get("password"),
            "assigned_at": locker.get("assigned_at"),
            "unlocked_at": locker.get("unlocked_at"),
            "collected_at": locker.get("collected_at"),
            "item": None,
            "claimant": None
        }

        # Get item details
        if locker.get("item_id"):
            item = items.find_one({"_id": ObjectId(locker["item_id"])})
            if item:
                entry["item"] = {
                    "id": str(item["_id"]),
                    "name": item.get("item_name", "Unknown"),
                    "category": item.get("category", "other"),
                    "image_url": item.get("image_url_clear")
                }

        # Get claimant details
        if locker.get("user_id"):
            user = users.find_one({"clerk_id": locker["user_id"]})
            if user:
                entry["claimant"] = {
                    "id": locker["user_id"],
                    "email": locker.get("user_email") or user.get("email"),
                    "student_id": user.get("student_id")
                }

        tracking_data.append(entry)

    return {
        "lockers": tracking_data,
        "stats": {
            "total": TOTAL_LOCKERS,
            "available": sum(1 for l in tracking_data if l["status"] == "available"),
            "assigned": sum(1 for l in tracking_data if l["status"] == "assigned"),
            "unlocked": sum(1 for l in tracking_data if l["status"] == "unlocked"),
            "collected": sum(1 for l in tracking_data if l["status"] == "collected")
        }
    }


@router.get("/history")
async def get_locker_history(limit: int = 50):
    """
    Get recent locker activity history.
    Shows recently collected items.
    """
    lockers = get_lockers_collection()

    # Find lockers that have been used (have collected_at timestamp)
    history = list(lockers.find(
        {"collected_at": {"$ne": None}}
    ).sort("collected_at", -1).limit(limit))

    result = []
    for locker in history:
        result.append({
            "locker_number": locker["locker_number"],
            "location": locker.get("location"),
            "item_name": locker.get("item_name"),
            "user_email": locker.get("user_email"),
            "assigned_at": locker.get("assigned_at"),
            "unlocked_at": locker.get("unlocked_at"),
            "collected_at": locker.get("collected_at")
        })

    return {"history": result, "count": len(result)}
