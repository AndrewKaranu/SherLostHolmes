"""
Items Routes - Lost/Found Item Reports
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Literal
from datetime import datetime, timedelta
from bson import ObjectId

from database import get_items_collection, get_users_collection
from ai import generate_item_ai_data
from embeddings import generate_item_embeddings

router = APIRouter(prefix="/api/items", tags=["items"])


# ============== AI Data Models ==============
class VectorContext(BaseModel):
    rich_description: Optional[str] = None


class BlindLineupDisplay(BaseModel):
    public_teaser: Optional[str] = None
    blur_reason: Optional[str] = None


class PersonaEngine(BaseModel):
    archetype: Optional[str] = None
    character_name: Optional[str] = None
    secret_knowledge: Optional[str] = None
    system_instruction: Optional[str] = None
    opening_line: Optional[str] = None


class ItemAIData(BaseModel):
    vector_context: Optional[VectorContext] = None
    blind_lineup_display: Optional[BlindLineupDisplay] = None
    persona_engine: Optional[PersonaEngine] = None
    ai_generated: bool = False
    ai_error: Optional[str] = None


# ============== Embedding Data Models ==============
class ItemEmbeddings(BaseModel):
    text_embedding: Optional[List[float]] = None  # 1536-dim from text-embedding-3-small via OpenRouter
    multimodal_embedding: Optional[List[float]] = None  # 1536-dim from vision model + embedding via OpenRouter
    unified_description: Optional[str] = None  # Vision model's unified description of text + images
    text_embedding_model: Optional[str] = None
    multimodal_embedding_model: Optional[str] = None
    embedding_error: Optional[str] = None


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
    # AI-generated data
    ai_data: Optional[ItemAIData] = None
    # Embedding data for vector search
    embeddings: Optional[ItemEmbeddings] = None


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

    After creation, an LLM generates AI data for matching and persona.
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
            "updated_at": datetime.utcnow(),
            "ai_data": None
        }

        # Insert into MongoDB
        result = items.insert_one(item_doc)
        item_id = str(result.inserted_id)

        # Generate AI data using LLM
        ai_data = None
        try:
            ai_result = generate_item_ai_data(
                item_name=item.item_name,
                description=item.description,
                category=item.category,
                location_name=item.location_name,
                location_description=item.location_description,
                notes=item.notes,
                image_urls=item.image_urls
            )

            ai_data = {
                "vector_context": ai_result.get("vector_context"),
                "blind_lineup_display": ai_result.get("blind_lineup_display"),
                "persona_engine": ai_result.get("persona_engine"),
                "ai_generated": True,
                "ai_error": None
            }

            # Update the document with AI data
            items.update_one(
                {"_id": ObjectId(item_id)},
                {"$set": {"ai_data": ai_data, "updated_at": datetime.utcnow()}}
            )
        except Exception as ai_error:
            # Store the error but don't fail the request
            ai_data = {
                "vector_context": None,
                "blind_lineup_display": None,
                "persona_engine": None,
                "ai_generated": False,
                "ai_error": str(ai_error)
            }
            items.update_one(
                {"_id": ObjectId(item_id)},
                {"$set": {"ai_data": ai_data, "updated_at": datetime.utcnow()}}
            )

        # Generate embeddings for vector search
        embeddings_data = None
        try:
            # Get the rich description from AI data if available
            rich_description = None
            if ai_data and ai_data.get("vector_context"):
                rich_description = ai_data["vector_context"].get("rich_description")

            # Generate embeddings using text and images
            embeddings_result = generate_item_embeddings(
                rich_description=rich_description,
                image_urls=item.image_urls,
                use_multimodal=True
            )

            embeddings_data = {
                "text_embedding": embeddings_result.get("text_embedding"),
                "multimodal_embedding": embeddings_result.get("multimodal_embedding"),
                "unified_description": embeddings_result.get("unified_description"),
                "text_embedding_model": embeddings_result.get("text_embedding_model"),
                "multimodal_embedding_model": embeddings_result.get("multimodal_embedding_model"),
                "embedding_error": embeddings_result.get("embedding_error")
            }

            # Update the document with embeddings
            items.update_one(
                {"_id": ObjectId(item_id)},
                {"$set": {"embeddings": embeddings_data, "updated_at": datetime.utcnow()}}
            )
        except Exception as emb_error:
            # Store the error but don't fail the request
            embeddings_data = {
                "text_embedding": None,
                "multimodal_embedding": None,
                "unified_description": None,
                "text_embedding_model": None,
                "multimodal_embedding_model": None,
                "embedding_error": str(emb_error)
            }
            items.update_one(
                {"_id": ObjectId(item_id)},
                {"$set": {"embeddings": embeddings_data, "updated_at": datetime.utcnow()}}
            )

        # Award 5 spins to the user for submitting a found item
        spins_awarded = 0
        if item.user_id:
            try:
                users = get_users_collection()
                result = users.update_one(
                    {"clerk_id": item.user_id},
                    {"$inc": {"spins": 5}}
                )
                if result.matched_count > 0:
                    spins_awarded = 5
            except Exception:
                pass  # Don't fail item creation if spin award fails

        # Return the created item
        return ItemResponse(
            id=item_id,
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
            created_at=item_doc["created_at"],
            ai_data=ItemAIData(**ai_data) if ai_data else None,
            embeddings=ItemEmbeddings(**embeddings_data) if embeddings_data else None
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
            # Build AI data if present
            ai_data = None
            if doc.get("ai_data"):
                ai_data = ItemAIData(
                    vector_context=VectorContext(**doc["ai_data"]["vector_context"]) if doc["ai_data"].get("vector_context") else None,
                    blind_lineup_display=BlindLineupDisplay(**doc["ai_data"]["blind_lineup_display"]) if doc["ai_data"].get("blind_lineup_display") else None,
                    persona_engine=PersonaEngine(**doc["ai_data"]["persona_engine"]) if doc["ai_data"].get("persona_engine") else None,
                    ai_generated=doc["ai_data"].get("ai_generated", False),
                    ai_error=doc["ai_data"].get("ai_error")
                )

            # Build embeddings data if present
            embeddings_data = None
            if doc.get("embeddings"):
                embeddings_data = ItemEmbeddings(
                    text_embedding=doc["embeddings"].get("text_embedding"),
                    multimodal_embedding=doc["embeddings"].get("multimodal_embedding"),
                    unified_description=doc["embeddings"].get("unified_description"),
                    text_embedding_model=doc["embeddings"].get("text_embedding_model"),
                    multimodal_embedding_model=doc["embeddings"].get("multimodal_embedding_model"),
                    embedding_error=doc["embeddings"].get("embedding_error")
                )

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
                created_at=doc.get("created_at", datetime.utcnow()),
                ai_data=ai_data,
                embeddings=embeddings_data
            ))

        return results

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch items: {str(e)}")


# ============== Archived Items (6+ months old) ==============
class ArchivedItemResponse(BaseModel):
    """Schema for archived item response (simplified for slot machine)"""
    id: str
    item_name: str
    description: Optional[str] = None
    category: str
    location_name: Optional[str] = None
    date_found: Optional[datetime] = None


@router.get("/archived", response_model=List[ArchivedItemResponse])
async def get_archived_items():
    """
    Get items that have been unclaimed for 6+ months.
    These items are eligible for the Lucky Find slot machine prize.
    """
    try:
        items = get_items_collection()
        
        # Calculate the cutoff date (6 months ago)
        six_months_ago = datetime.utcnow() - timedelta(days=180)
        
        # Query for unclaimed items older than 6 months
        query = {
            "status": "unclaimed",
            "date_found": {"$lte": six_months_ago}
        }
        
        cursor = items.find(query).sort("date_found", 1).limit(100)
        
        results = []
        for doc in cursor:
            results.append(ArchivedItemResponse(
                id=str(doc["_id"]),
                item_name=doc.get("item_name", "Unknown Item"),
                description=doc.get("description"),
                category=doc.get("category", "other"),
                location_name=doc.get("location_name"),
                date_found=doc.get("date_found")
            ))
        
        return results
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch archived items: {str(e)}")


@router.post("/archived/{item_id}/claim")
async def claim_archived_item(item_id: str, user_id: Optional[str] = None):
    """
    Claim an archived item from the slot machine win.
    Marks the item as 'returned' and records the winner.
    """
    try:
        items = get_items_collection()
        
        # Verify the item exists and is archived (6+ months old, unclaimed)
        six_months_ago = datetime.utcnow() - timedelta(days=180)
        
        doc = items.find_one({
            "_id": ObjectId(item_id),
            "status": "unclaimed",
            "date_found": {"$lte": six_months_ago}
        })
        
        if not doc:
            raise HTTPException(
                status_code=404, 
                detail="Item not found or not eligible for claiming"
            )
        
        # Update the item status to 'returned' and record claim info
        result = items.update_one(
            {"_id": ObjectId(item_id)},
            {
                "$set": {
                    "status": "returned",
                    "claimed_via": "lucky_find_slot_machine",
                    "claimed_by": user_id,
                    "claimed_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=500, detail="Failed to claim item")
        
        return {
            "status": "success",
            "message": "Item claimed successfully!",
            "item_id": item_id,
            "item_name": doc.get("item_name", "Unknown Item")
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to claim item: {str(e)}")


@router.get("/{item_id}", response_model=ItemResponse)
async def get_item(item_id: str):
    """Get a specific item by ID"""
    try:
        items = get_items_collection()

        doc = items.find_one({"_id": ObjectId(item_id)})

        if not doc:
            raise HTTPException(status_code=404, detail="Item not found")

        # Build AI data if present
        ai_data = None
        if doc.get("ai_data"):
            ai_data = ItemAIData(
                vector_context=VectorContext(**doc["ai_data"]["vector_context"]) if doc["ai_data"].get("vector_context") else None,
                blind_lineup_display=BlindLineupDisplay(**doc["ai_data"]["blind_lineup_display"]) if doc["ai_data"].get("blind_lineup_display") else None,
                persona_engine=PersonaEngine(**doc["ai_data"]["persona_engine"]) if doc["ai_data"].get("persona_engine") else None,
                ai_generated=doc["ai_data"].get("ai_generated", False),
                ai_error=doc["ai_data"].get("ai_error")
            )

        # Build embeddings data if present
        embeddings_data = None
        if doc.get("embeddings"):
            embeddings_data = ItemEmbeddings(
                text_embedding=doc["embeddings"].get("text_embedding"),
                multimodal_embedding=doc["embeddings"].get("multimodal_embedding"),
                text_embedding_model=doc["embeddings"].get("text_embedding_model"),
                multimodal_embedding_model=doc["embeddings"].get("multimodal_embedding_model"),
                embedding_error=doc["embeddings"].get("embedding_error")
            )

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
            created_at=doc.get("created_at", datetime.utcnow()),
            ai_data=ai_data,
            embeddings=embeddings_data
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

        # Build AI data if present
        ai_data = None
        if result.get("ai_data"):
            ai_data = ItemAIData(
                vector_context=VectorContext(**result["ai_data"]["vector_context"]) if result["ai_data"].get("vector_context") else None,
                blind_lineup_display=BlindLineupDisplay(**result["ai_data"]["blind_lineup_display"]) if result["ai_data"].get("blind_lineup_display") else None,
                persona_engine=PersonaEngine(**result["ai_data"]["persona_engine"]) if result["ai_data"].get("persona_engine") else None,
                ai_generated=result["ai_data"].get("ai_generated", False),
                ai_error=result["ai_data"].get("ai_error")
            )

        # Build embeddings data if present
        embeddings_data = None
        if result.get("embeddings"):
            embeddings_data = ItemEmbeddings(
                text_embedding=result["embeddings"].get("text_embedding"),
                multimodal_embedding=result["embeddings"].get("multimodal_embedding"),
                unified_description=result["embeddings"].get("unified_description"),
                text_embedding_model=result["embeddings"].get("text_embedding_model"),
                multimodal_embedding_model=result["embeddings"].get("multimodal_embedding_model"),
                embedding_error=result["embeddings"].get("embedding_error")
            )

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
            created_at=result.get("created_at", datetime.utcnow()),
            ai_data=ai_data,
            embeddings=embeddings_data
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
