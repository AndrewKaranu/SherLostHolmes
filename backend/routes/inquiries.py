"""
Inquiries Routes - Lost Item Reports
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Literal
from datetime import datetime
from bson import ObjectId

from database import get_inquiries_collection

router = APIRouter(prefix="/api/inquiries", tags=["inquiries"])


# ============== Pydantic Models ==============
class GeoJSONPoint(BaseModel):
    type: Literal["Point"] = "Point"
    coordinates: List[float]  # [longitude, latitude]


class InquiryCreate(BaseModel):
    """Schema for creating a new inquiry (lost item report)"""
    item_name: str
    description_text: Optional[str] = None
    category: Literal["electronics", "clothing", "jewelry", "bags", "keys", "books", "sports", "food", "other"]
    date_lost: Optional[datetime] = None
    location_lost: Optional[GeoJSONPoint] = None
    location_name: Optional[str] = None
    notes: Optional[str] = None
    # Image URLs from Cloudinary
    image_urls: Optional[List[str]] = None
    image_public_ids: Optional[List[str]] = None
    # Contact info (optional - can be filled from user profile)
    contact_email: Optional[EmailStr] = None
    user_id: Optional[str] = None


class InquiryResponse(BaseModel):
    """Schema for inquiry response"""
    id: str
    item_name: str
    description_text: Optional[str] = None
    category: str
    status: str
    date_lost: Optional[datetime] = None
    location_name: Optional[str] = None
    notes: Optional[str] = None
    image_urls: Optional[List[str]] = None
    created_at: datetime


class InquiryUpdate(BaseModel):
    """Schema for updating an inquiry"""
    item_name: Optional[str] = None
    description_text: Optional[str] = None
    category: Optional[str] = None
    status: Optional[Literal["active", "closed", "found"]] = None
    date_lost: Optional[datetime] = None
    location_name: Optional[str] = None
    notes: Optional[str] = None


# ============== Endpoints ==============

@router.post("/", response_model=InquiryResponse)
async def create_inquiry(inquiry: InquiryCreate):
    """
    Create a new lost item inquiry (report)

    This endpoint receives the form data from the frontend including:
    - Item details (name, category, description)
    - Location and date information
    - Image URLs (already uploaded to Cloudinary)
    """
    try:
        inquiries = get_inquiries_collection()

        # Build the document
        inquiry_doc = {
            "item_name": inquiry.item_name,
            "description_text": inquiry.description_text,
            "category": inquiry.category,
            "status": "active",
            "date_lost": inquiry.date_lost,
            "location_lost": inquiry.location_lost.model_dump() if inquiry.location_lost else None,
            "location_name": inquiry.location_name,
            "notes": inquiry.notes,
            "image_urls": inquiry.image_urls or [],
            "image_public_ids": inquiry.image_public_ids or [],
            "contact_email": inquiry.contact_email,
            "user_id": inquiry.user_id,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }

        # Insert into MongoDB
        result = inquiries.insert_one(inquiry_doc)

        # Return the created inquiry
        return InquiryResponse(
            id=str(result.inserted_id),
            item_name=inquiry.item_name,
            description_text=inquiry.description_text,
            category=inquiry.category,
            status="active",
            date_lost=inquiry.date_lost,
            location_name=inquiry.location_name,
            notes=inquiry.notes,
            image_urls=inquiry.image_urls,
            created_at=inquiry_doc["created_at"]
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create inquiry: {str(e)}")


@router.get("/", response_model=List[InquiryResponse])
async def get_all_inquiries(
    status: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = 50,
    skip: int = 0
):
    """Get all inquiries with optional filters"""
    try:
        inquiries = get_inquiries_collection()

        # Build query
        query = {}
        if status:
            query["status"] = status
        if category:
            query["category"] = category

        # Execute query
        cursor = inquiries.find(query).sort("created_at", -1).skip(skip).limit(limit)

        results = []
        for doc in cursor:
            results.append(InquiryResponse(
                id=str(doc["_id"]),
                item_name=doc.get("item_name", ""),
                description_text=doc.get("description_text"),
                category=doc.get("category", "other"),
                status=doc.get("status", "active"),
                date_lost=doc.get("date_lost"),
                location_name=doc.get("location_name"),
                notes=doc.get("notes"),
                image_urls=doc.get("image_urls"),
                created_at=doc.get("created_at", datetime.utcnow())
            ))

        return results

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch inquiries: {str(e)}")


@router.get("/{inquiry_id}", response_model=InquiryResponse)
async def get_inquiry(inquiry_id: str):
    """Get a specific inquiry by ID"""
    try:
        inquiries = get_inquiries_collection()

        doc = inquiries.find_one({"_id": ObjectId(inquiry_id)})

        if not doc:
            raise HTTPException(status_code=404, detail="Inquiry not found")

        return InquiryResponse(
            id=str(doc["_id"]),
            item_name=doc.get("item_name", ""),
            description_text=doc.get("description_text"),
            category=doc.get("category", "other"),
            status=doc.get("status", "active"),
            date_lost=doc.get("date_lost"),
            location_name=doc.get("location_name"),
            notes=doc.get("notes"),
            image_urls=doc.get("image_urls"),
            created_at=doc.get("created_at", datetime.utcnow())
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch inquiry: {str(e)}")


@router.patch("/{inquiry_id}", response_model=InquiryResponse)
async def update_inquiry(inquiry_id: str, update: InquiryUpdate):
    """Update an existing inquiry"""
    try:
        inquiries = get_inquiries_collection()

        # Build update document (only include non-None fields)
        update_doc = {"updated_at": datetime.utcnow()}
        for field, value in update.model_dump(exclude_unset=True).items():
            if value is not None:
                update_doc[field] = value

        # Update in MongoDB
        result = inquiries.find_one_and_update(
            {"_id": ObjectId(inquiry_id)},
            {"$set": update_doc},
            return_document=True
        )

        if not result:
            raise HTTPException(status_code=404, detail="Inquiry not found")

        return InquiryResponse(
            id=str(result["_id"]),
            item_name=result.get("item_name", ""),
            description_text=result.get("description_text"),
            category=result.get("category", "other"),
            status=result.get("status", "active"),
            date_lost=result.get("date_lost"),
            location_name=result.get("location_name"),
            notes=result.get("notes"),
            image_urls=result.get("image_urls"),
            created_at=result.get("created_at", datetime.utcnow())
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update inquiry: {str(e)}")


@router.delete("/{inquiry_id}")
async def delete_inquiry(inquiry_id: str):
    """Delete an inquiry"""
    try:
        inquiries = get_inquiries_collection()

        result = inquiries.delete_one({"_id": ObjectId(inquiry_id)})

        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Inquiry not found")

        return {"status": "success", "message": "Inquiry deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete inquiry: {str(e)}")
