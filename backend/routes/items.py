"""
Items Routes - Lost/Found Item Reports
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Literal
from datetime import datetime
from bson import ObjectId

from database import get_items_collection

router = APIRouter(prefix="/api/items", tags=["items"])


# ============== Pydantic Models ==============
class ItemCreate(BaseModel):
    """Schema for creating a new item (lost item report from form)"""
    item_name: str
    description: Optional[str] = None
    category: Literal["electronics", "clothing", "jewelry", "bags", "keys", "books", "sports", "food", "other"]
    date_found: Optional[datetime] = None
    location_name: Optional[str] = None
    location_description: Optional[str] = None  # Detailed description of where item was lost
    notes: Optional[str] = None
    # Image URLs from Cloudinary
    image_url_clear: Optional[str] = None
    image_url_blurred: Optional[str] = None
    image_urls: Optional[List[str]] = None  # Multiple images
    image_public_ids: Optional[List[str]] = None
    # User info
    user_id: Optional[str] = None
    contact_email: Optional[EmailStr] = None


class ItemResponse(BaseModel):
    """Schema for item response"""
    id: str
    item_name: str
    description: Optional[str] = None
    category: str
    status: str
    date_found: Optional[datetime] = None
    location_name: Optional[str] = None
    location_description: Optional[str] = None
    notes: Optional[str] = None
    image_url_clear: Optional[str] = None
    image_url_blurred: Optional[str] = None
    image_urls: Optional[List[str]] = None
    user_id: Optional[str] = None
    contact_email: Optional[str] = None
    created_at: datetime


class ItemUpdate(BaseModel):
    """Schema for updating an item"""
    item_name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    status: Optional[Literal["unclaimed", "matched", "resolved", "returned"]] = None
    date_found: Optional[datetime] = None
    location_name: Optional[str] = None
    location_description: Optional[str] = None
    notes: Optional[str] = None


# ============== Endpoints ==============

@router.post("/", response_model=ItemResponse)
async def create_item(item: ItemCreate):
    """
    Create a new lost item report

    This endpoint receives the form data from the frontend including:
    - Item details (name, category, description)
    - Location and date information
    - Image URLs (already uploaded to Cloudinary)
    - User information
    """
    try:
        items = get_items_collection()

        # Build the document
        item_doc = {
            "item_name": item.item_name,
            "description": item.description,
            "category": item.category,
            "status": "unclaimed",
            "date_found": item.date_found or datetime.utcnow(),
            "location_name": item.location_name,
            "location_description": item.location_description,
            "notes": item.notes,
            "image_url_clear": item.image_url_clear or (item.image_urls[0] if item.image_urls else None),
            "image_url_blurred": item.image_url_blurred,
            "image_urls": item.image_urls or [],
            "image_public_ids": item.image_public_ids or [],
            "user_id": item.user_id,
            "contact_email": item.contact_email,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }

        # Insert into MongoDB
        result = items.insert_one(item_doc)

        # Return the created item
        return ItemResponse(
            id=str(result.inserted_id),
            item_name=item.item_name,
            description=item.description,
            category=item.category,
            status="unclaimed",
            date_found=item_doc["date_found"],
            location_name=item.location_name,
            location_description=item.location_description,
            notes=item.notes,
            image_url_clear=item_doc["image_url_clear"],
            image_url_blurred=item.image_url_blurred,
            image_urls=item.image_urls,
            user_id=item.user_id,
            contact_email=item.contact_email,
            created_at=item_doc["created_at"]
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create item: {str(e)}")


@router.get("/", response_model=List[ItemResponse])
async def get_all_items(
    status: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = 50,
    skip: int = 0
):
    """Get all items with optional filters"""
    try:
        items = get_items_collection()

        # Build query
        query = {}
        if status:
            query["status"] = status
        if category:
            query["category"] = category

        # Execute query
        cursor = items.find(query).sort("created_at", -1).skip(skip).limit(limit)

        results = []
        for doc in cursor:
            results.append(ItemResponse(
                id=str(doc["_id"]),
                item_name=doc.get("item_name", ""),
                description=doc.get("description"),
                category=doc.get("category", "other"),
                status=doc.get("status", "unclaimed"),
                date_found=doc.get("date_found"),
                location_name=doc.get("location_name"),
                location_description=doc.get("location_description"),
                notes=doc.get("notes"),
                image_url_clear=doc.get("image_url_clear"),
                image_url_blurred=doc.get("image_url_blurred"),
                image_urls=doc.get("image_urls"),
                user_id=doc.get("user_id"),
                contact_email=doc.get("contact_email"),
                created_at=doc.get("created_at", datetime.utcnow())
            ))

        return results

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch items: {str(e)}")


@router.get("/{item_id}", response_model=ItemResponse)
async def get_item(item_id: str):
    """Get a specific item by ID"""
    try:
        items = get_items_collection()

        doc = items.find_one({"_id": ObjectId(item_id)})

        if not doc:
            raise HTTPException(status_code=404, detail="Item not found")

        return ItemResponse(
            id=str(doc["_id"]),
            item_name=doc.get("item_name", ""),
            description=doc.get("description"),
            category=doc.get("category", "other"),
            status=doc.get("status", "unclaimed"),
            date_found=doc.get("date_found"),
            location_name=doc.get("location_name"),
            location_description=doc.get("location_description"),
            notes=doc.get("notes"),
            image_url_clear=doc.get("image_url_clear"),
            image_url_blurred=doc.get("image_url_blurred"),
            image_urls=doc.get("image_urls"),
            user_id=doc.get("user_id"),
            contact_email=doc.get("contact_email"),
            created_at=doc.get("created_at", datetime.utcnow())
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch item: {str(e)}")


@router.patch("/{item_id}", response_model=ItemResponse)
async def update_item(item_id: str, update: ItemUpdate):
    """Update an existing item"""
    try:
        items = get_items_collection()

        # Build update document (only include non-None fields)
        update_doc = {"updated_at": datetime.utcnow()}
        for field, value in update.model_dump(exclude_unset=True).items():
            if value is not None:
                update_doc[field] = value

        # Update in MongoDB
        result = items.find_one_and_update(
            {"_id": ObjectId(item_id)},
            {"$set": update_doc},
            return_document=True
        )

        if not result:
            raise HTTPException(status_code=404, detail="Item not found")

        return ItemResponse(
            id=str(result["_id"]),
            item_name=result.get("item_name", ""),
            description=result.get("description"),
            category=result.get("category", "other"),
            status=result.get("status", "unclaimed"),
            date_found=result.get("date_found"),
            location_name=result.get("location_name"),
            location_description=result.get("location_description"),
            notes=result.get("notes"),
            image_url_clear=result.get("image_url_clear"),
            image_url_blurred=result.get("image_url_blurred"),
            image_urls=result.get("image_urls"),
            user_id=result.get("user_id"),
            contact_email=result.get("contact_email"),
            created_at=result.get("created_at", datetime.utcnow())
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update item: {str(e)}")


@router.delete("/{item_id}")
async def delete_item(item_id: str):
    """Delete an item"""
    try:
        items = get_items_collection()

        result = items.delete_one({"_id": ObjectId(item_id)})

        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Item not found")

        return {"status": "success", "message": "Item deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete item: {str(e)}")
