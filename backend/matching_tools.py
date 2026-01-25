"""
Matching Tools for SherLostHolmes
Individual tool functions used by the matching orchestrator agent.
"""
import os
import math
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any, Tuple
from bson import ObjectId

from database import get_items_collection, get_inquiries_collection, get_matches_collection
from embeddings import get_text_embedding, get_multimodal_embedding, cosine_similarity


# ============== INTAKE QUESTIONS ==============
INTAKE_QUESTIONS = [
    {
        "id": "category",
        "question": "What type of item did you lose?",
        "type": "select",
        "options": ["electronics", "clothing", "jewelry", "bags", "keys", "books", "sports", "food", "other"],
        "required": True,
        "follow_up": "Got it! That helps narrow things down."
    },
    {
        "id": "date_lost",
        "question": "When did you lose it? Please provide the date and approximate time.",
        "type": "datetime",
        "required": True,
        "follow_up": "Thanks! I'll look for items found after that time."
    },
    {
        "id": "location_name",
        "question": "Where did you lose it? (e.g., 'Hall Building', 'Library', 'MB Building')",
        "type": "text",
        "required": True,
        "follow_up": "I know that area. Let me check what's been found nearby."
    },
    {
        "id": "description",
        "question": "Describe your item in detail. What does it look like?",
        "type": "text",
        "required": True,
        "follow_up": "Good details! This will help me find matches."
    },
    {
        "id": "color",
        "question": "What color is it?",
        "type": "text",
        "required": False,
        "follow_up": "Color noted."
    },
    {
        "id": "brand",
        "question": "What brand is it? (if applicable)",
        "type": "text",
        "required": False,
        "follow_up": "Brand information helps a lot with matching!"
    },
    {
        "id": "unique_features",
        "question": "Any unique marks, stickers, scratches, or features that would help identify it?",
        "type": "text",
        "required": True,
        "follow_up": "Perfect! Those unique details are crucial for verification."
    },
    {
        "id": "image_upload",
        "question": "Do you have a photo of the item (or a similar one)? Upload it now if you can.",
        "type": "image",
        "required": False,
        "follow_up": "Image received! This will really help with visual matching."
    }
]


def get_next_question(current_index: int, intake_data: dict) -> Optional[dict]:
    """Get the next question based on current progress."""
    if current_index >= len(INTAKE_QUESTIONS):
        return None
    return INTAKE_QUESTIONS[current_index]


def validate_intake_answer(question_id: str, answer: Any) -> Tuple[bool, str]:
    """Validate an answer for a specific question."""
    question = next((q for q in INTAKE_QUESTIONS if q["id"] == question_id), None)
    if not question:
        return False, "Unknown question"
    
    if question["required"] and not answer:
        return False, f"This field is required. {question['question']}"
    
    if question["type"] == "select" and answer:
        if answer.lower() not in [opt.lower() for opt in question.get("options", [])]:
            return False, f"Please choose from: {', '.join(question['options'])}"
    
    if question["type"] == "datetime" and answer:
        # Try to parse the datetime
        try:
            if isinstance(answer, str):
                # Accept various formats
                for fmt in ["%Y-%m-%d %H:%M", "%Y-%m-%d", "%m/%d/%Y", "%d/%m/%Y"]:
                    try:
                        datetime.strptime(answer, fmt)
                        return True, "Valid date"
                    except ValueError:
                        continue
                return False, "Please provide a valid date (e.g., 2025-01-25 or 01/25/2025)"
        except Exception:
            return False, "Invalid date format"
    
    return True, "Valid"


def is_intake_complete(intake_data: dict) -> bool:
    """Check if all required intake questions have been answered."""
    required_fields = [q["id"] for q in INTAKE_QUESTIONS if q["required"]]
    for field in required_fields:
        if field == "image_upload":
            continue  # Image is optional
        if not intake_data.get(field):
            return False
    return True


# ============== HARD FILTERS ==============
def haversine_distance(coord1: List[float], coord2: List[float]) -> float:
    """
    Calculate the Haversine distance between two points in kilometers.
    coord format: [longitude, latitude]
    """
    if not coord1 or not coord2 or len(coord1) < 2 or len(coord2) < 2:
        return float('inf')
    
    R = 6371  # Earth's radius in kilometers
    
    lon1, lat1 = math.radians(coord1[0]), math.radians(coord1[1])
    lon2, lat2 = math.radians(coord2[0]), math.radians(coord2[1])
    
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    
    return R * c


# Location name to approximate coordinates mapping (Concordia Campus)
LOCATION_COORDINATES = {
    "hall building": [-73.5789, 45.4972],
    "hall": [-73.5789, 45.4972],
    "ev building": [-73.5785, 45.4955],
    "ev": [-73.5785, 45.4955],
    "library": [-73.5782, 45.4970],
    "webster library": [-73.5782, 45.4970],
    "mb building": [-73.5792, 45.4952],
    "mb": [-73.5792, 45.4952],
    "jmsb": [-73.5792, 45.4952],
    "gm building": [-73.5780, 45.4965],
    "gm": [-73.5780, 45.4965],
    "faubourg": [-73.5760, 45.4945],
    "lb building": [-73.5778, 45.4968],
    "lb": [-73.5778, 45.4968],
    "h building": [-73.5789, 45.4972],
    "cca": [-73.5740, 45.4580],
    "loyola": [-73.6400, 45.4580],
    "sp building": [-73.6400, 45.4585],
    "vanier library": [-73.6395, 45.4590],
    "default": [-73.5780, 45.4960]  # Concordia SGW center
}


def get_location_coordinates(location_name: str) -> List[float]:
    """Convert location name to approximate coordinates."""
    if not location_name:
        return LOCATION_COORDINATES["default"]
    
    location_lower = location_name.lower().strip()
    
    for key, coords in LOCATION_COORDINATES.items():
        if key in location_lower:
            return coords
    
    return LOCATION_COORDINATES["default"]


def apply_time_filter(items: List[dict], date_lost: datetime, buffer_hours: int = 6) -> List[dict]:
    """
    Filter items to only those found AFTER the lost date (with buffer).
    Logic: Item must be found after the user lost it (minus small buffer for timezone issues).
    """
    if not date_lost:
        return items
    
    cutoff_time = date_lost - timedelta(hours=buffer_hours)
    
    filtered = []
    for item in items:
        item_date = item.get("date_found") or item.get("created_at")
        if item_date:
            if isinstance(item_date, str):
                try:
                    item_date = datetime.fromisoformat(item_date.replace('Z', '+00:00'))
                except:
                    continue
            if item_date >= cutoff_time:
                filtered.append(item)
    
    return filtered


def apply_category_filter(items: List[dict], category: str) -> List[dict]:
    """Filter items by category (exact match)."""
    if not category:
        return items
    
    category_lower = category.lower().strip()
    return [item for item in items if item.get("category", "").lower() == category_lower]


def apply_location_filter(items: List[dict], location_coords: List[float], radius_km: float = 2.0) -> List[dict]:
    """Filter items within a certain radius of the lost location."""
    if not location_coords:
        return items
    
    filtered = []
    for item in items:
        item_location = item.get("location")
        if item_location and item_location.get("coordinates"):
            distance = haversine_distance(location_coords, item_location["coordinates"])
            if distance <= radius_km:
                filtered.append(item)
        else:
            # If item has no location, include it (don't exclude)
            # But with lower priority later
            filtered.append(item)
    
    return filtered


def apply_hard_filters(intake_data: dict) -> Tuple[List[dict], dict]:
    """
    Apply all hard filters and return filtered items with stats.
    
    Returns:
        Tuple of (filtered_items, filter_stats)
    """
    items_collection = get_items_collection()
    
    # Get all unclaimed items
    all_items = list(items_collection.find({"status": {"$in": ["unclaimed", "matched"]}}))
    
    stats = {
        "total_items": len(all_items),
        "after_time_filter": 0,
        "after_category_filter": 0,
        "after_location_filter": 0
    }
    
    # Convert ObjectId to string for each item
    for item in all_items:
        item["_id"] = str(item["_id"])
    
    # Apply time filter
    date_lost = intake_data.get("date_lost")
    if isinstance(date_lost, str):
        try:
            for fmt in ["%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M", "%Y-%m-%d"]:
                try:
                    date_lost = datetime.strptime(date_lost, fmt)
                    break
                except ValueError:
                    continue
        except:
            date_lost = None
    
    filtered = apply_time_filter(all_items, date_lost)
    stats["after_time_filter"] = len(filtered)
    
    # Apply category filter
    category = intake_data.get("category")
    filtered = apply_category_filter(filtered, category)
    stats["after_category_filter"] = len(filtered)
    
    # Apply location filter
    location_name = intake_data.get("location_name")
    location_coords = intake_data.get("location_coordinates") or get_location_coordinates(location_name)
    filtered = apply_location_filter(filtered, location_coords, radius_km=2.0)
    stats["after_location_filter"] = len(filtered)
    
    return filtered, stats


# ============== SEMANTIC SEARCH ==============
def generate_user_search_embedding(intake_data: dict) -> dict:
    """
    Generate embeddings for the user's lost item description.
    Combines text description with uploaded images.
    """
    # Build comprehensive text description
    text_parts = []
    
    if intake_data.get("category"):
        text_parts.append(f"Category: {intake_data['category']}")
    
    if intake_data.get("description"):
        text_parts.append(f"Description: {intake_data['description']}")
    
    if intake_data.get("color"):
        text_parts.append(f"Color: {intake_data['color']}")
    
    if intake_data.get("brand"):
        text_parts.append(f"Brand: {intake_data['brand']}")
    
    if intake_data.get("unique_features"):
        text_parts.append(f"Unique features: {intake_data['unique_features']}")
    
    full_text = ". ".join(text_parts)
    image_urls = intake_data.get("image_urls", [])
    
    try:
        if image_urls:
            # Use multimodal embedding for text + images
            result = get_multimodal_embedding(text=full_text, image_urls=image_urls[:4])
            return {
                "embedding": result["embedding"],
                "unified_description": result.get("unified_description"),
                "type": "multimodal",
                "error": None
            }
        else:
            # Text-only embedding
            embedding = get_text_embedding(full_text)
            return {
                "embedding": embedding,
                "unified_description": full_text,
                "type": "text",
                "error": None
            }
    except Exception as e:
        return {
            "embedding": None,
            "unified_description": None,
            "type": "error",
            "error": str(e)
        }


def calculate_semantic_scores(
    user_embedding: List[float],
    filtered_items: List[dict]
) -> List[dict]:
    """
    Calculate semantic similarity scores between user's description and items.
    Uses both text and multimodal embeddings when available.
    """
    scored_items = []
    
    for item in filtered_items:
        embeddings = item.get("embeddings", {})
        ai_data = item.get("ai_data", {})
        
        # Get item embeddings
        text_emb = embeddings.get("text_embedding")
        multimodal_emb = embeddings.get("multimodal_embedding")
        
        text_score = 0.0
        multimodal_score = 0.0
        
        # Calculate text similarity
        if text_emb and user_embedding:
            try:
                text_score = cosine_similarity(user_embedding, text_emb)
            except:
                pass
        
        # Calculate multimodal similarity
        if multimodal_emb and user_embedding:
            try:
                multimodal_score = cosine_similarity(user_embedding, multimodal_emb)
            except:
                pass
        
        # Combined score (weight multimodal higher if available)
        if multimodal_score > 0:
            combined_score = (text_score * 0.3) + (multimodal_score * 0.7)
        else:
            combined_score = text_score
        
        scored_items.append({
            "item": item,
            "text_score": text_score,
            "multimodal_score": multimodal_score,
            "combined_score": combined_score
        })
    
    # Sort by combined score descending
    scored_items.sort(key=lambda x: x["combined_score"], reverse=True)
    
    return scored_items


def get_top_candidates(scored_items: List[dict], top_k: int = 5) -> List[dict]:
    """Get the top K candidates for the blind lineup."""
    return scored_items[:top_k]


# ============== BLIND LINEUP ==============
def generate_blind_lineup(candidates: List[dict]) -> List[dict]:
    """
    Generate the blind lineup presentation for top candidates.
    Each candidate gets a letter (A-E) and shows only blurred info.
    """
    lineup = []
    
    for i, candidate in enumerate(candidates):
        item = candidate["item"]
        ai_data = item.get("ai_data", {})
        blind_display = ai_data.get("blind_lineup_display", {})
        persona = ai_data.get("persona_engine", {})
        
        lineup.append({
            "suspect_id": item.get("_id") or str(item.get("id")),
            "suspect_letter": chr(65 + i),  # A, B, C, D, E
            "blurred_image": item.get("image_url_blurred"),
            "teaser": blind_display.get("public_teaser", f"A mysterious {item.get('category', 'item')} awaits..."),
            "blur_reason": blind_display.get("blur_reason", "Identity protection protocol active"),
            "character_name": persona.get("character_name", f"Suspect {chr(65 + i)}"),
            "semantic_score": candidate.get("combined_score", 0.0)  # Hidden from user
        })
    
    return lineup


# ============== INTERROGATION HELPERS ==============
def get_item_for_interrogation(item_id: str) -> Optional[dict]:
    """Fetch full item details for interrogation."""
    items_collection = get_items_collection()
    
    try:
        item = items_collection.find_one({"_id": ObjectId(item_id)})
        if item:
            item["_id"] = str(item["_id"])
        return item
    except:
        return None


def check_secret_knowledge(user_answer: str, secret_knowledge: str) -> Tuple[bool, float]:
    """
    Check if user's answer matches the secret knowledge.
    Returns (is_match, confidence_score).
    
    Uses fuzzy matching to allow for slight variations.
    """
    if not user_answer or not secret_knowledge:
        return False, 0.0
    
    user_lower = user_answer.lower().strip()
    secret_lower = secret_knowledge.lower().strip()
    
    # Exact match
    if secret_lower in user_lower or user_lower in secret_lower:
        return True, 1.0
    
    # Check for key words (e.g., "spiderman sticker" matches "spider man sticker")
    user_words = set(user_lower.replace("-", " ").split())
    secret_words = set(secret_lower.replace("-", " ").split())
    
    # Remove common words
    stop_words = {"a", "an", "the", "on", "in", "at", "is", "it", "my", "has", "have", "with"}
    user_words = user_words - stop_words
    secret_words = secret_words - stop_words
    
    if not secret_words:
        return False, 0.0
    
    # Calculate word overlap
    overlap = len(user_words & secret_words)
    overlap_ratio = overlap / len(secret_words)
    
    if overlap_ratio >= 0.6:
        return True, overlap_ratio
    
    return False, overlap_ratio


def calculate_trust_score_update(
    current_score: float,
    is_correct: bool,
    confidence: float,
    wrong_attempts: int
) -> float:
    """Calculate new trust score based on user's answer."""
    if is_correct:
        # Correct answer boosts trust significantly
        boost = 30 * confidence
        new_score = min(current_score + boost, 100.0)
    else:
        # Wrong answer reduces trust
        penalty = 10 + (wrong_attempts * 5)
        new_score = max(current_score - penalty, 0.0)
    
    return new_score


# ============== VERIFICATION ==============
def verify_with_photo(
    user_photo_url: str,
    item_clear_photo_url: str
) -> dict:
    """
    Use vision model to compare user's verification photo with item photo.
    Returns verification result with confidence score.
    """
    import requests
    
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        return {
            "match_confidence": 0.0,
            "matching_features": [],
            "discrepancies": ["Unable to verify - API not configured"],
            "verification_method": "failed"
        }
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com/AndrewKaranu/SherLostHolmes",
    }
    
    user_content = [
        {
            "type": "text",
            "text": """Compare these two images to verify if they show the same item.

IMAGE 1: The user's verification photo (their claimed item or a selfie with it)
IMAGE 2: The found item's clear photo from our database

Analyze carefully and return a JSON response:
{
    "match_confidence": <0-100 score>,
    "matching_features": ["feature1", "feature2", ...],
    "discrepancies": ["issue1", "issue2", ...],
    "analysis": "Brief explanation of your conclusion"
}

Be strict but fair. Look for:
- Same brand/model
- Same color and material
- Matching damage, stickers, marks
- Similar wear patterns
- Consistent size and shape

Return ONLY the JSON, no other text."""
        },
        {
            "type": "image_url",
            "image_url": {"url": user_photo_url}
        },
        {
            "type": "image_url",
            "image_url": {"url": item_clear_photo_url}
        }
    ]
    
    payload = {
        "model": "openai/gpt-4o",
        "messages": [
            {
                "role": "system",
                "content": "You are an expert at visual verification and item matching. Be precise and objective."
            },
            {
                "role": "user",
                "content": user_content
            }
        ],
        "temperature": 0.2,
        "max_tokens": 500
    }
    
    try:
        import json
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            json=payload,
            headers=headers,
            timeout=60
        )
        response.raise_for_status()
        
        data = response.json()
        if "choices" in data and len(data["choices"]) > 0:
            ai_message = data["choices"][0]["message"]["content"].strip()
            
            # Clean and parse JSON
            if ai_message.startswith("```"):
                ai_message = ai_message.split("```")[1]
                if ai_message.startswith("json"):
                    ai_message = ai_message[4:]
            
            result = json.loads(ai_message)
            result["verification_method"] = "photo_comparison"
            return result
        
    except Exception as e:
        return {
            "match_confidence": 0.0,
            "matching_features": [],
            "discrepancies": [f"Verification error: {str(e)}"],
            "verification_method": "failed"
        }


# ============== FINAL SCORING ==============
def calculate_final_match_score(
    semantic_score: float,
    trust_score: float,
    secret_verified: bool,
    verification_result: Optional[dict],
    wrong_attempts: int
) -> Tuple[float, str]:
    """
    Calculate the final match score and determine match status.
    
    Returns:
        Tuple of (score, status)
    """
    score = 0.0
    
    # Base semantic similarity (max 40 points)
    score += semantic_score * 40
    
    # Interrogation trust score (max 35 points)
    score += (trust_score / 100) * 35
    
    # Correct secret knowledge (15 points)
    if secret_verified:
        score += 15
    
    # Photo verification bonus (up to 10 points)
    if verification_result and verification_result.get("match_confidence"):
        score += verification_result["match_confidence"] * 0.1
    
    # Penalties for wrong attempts
    score -= wrong_attempts * 3
    
    # Clamp to 0-100
    score = max(min(score, 100.0), 0.0)
    
    # Determine status
    if score >= 85:
        if verification_result and verification_result.get("match_confidence", 0) >= 70:
            status = "confirmed_match"
        else:
            status = "probable_match"
    elif score >= 60:
        status = "probable_match"
    elif score >= 40:
        status = "needs_review"
    else:
        status = "rejected"
    
    return score, status
