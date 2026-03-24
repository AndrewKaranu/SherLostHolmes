"""
Matching Routes for SherLostHolmes
API endpoints for the matching flow: intake, filtering, lineup, interrogation, verification.
"""
import uuid
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Literal
from datetime import datetime
from bson import ObjectId

from database import get_matches_collection, get_items_collection, get_users_collection, get_lockers_collection
from matching_agent import get_session_manager, MatchingSessionManager
from interrogation_agent import get_interrogation_manager, InterrogationManager
from email_service import send_approval_email, send_denial_email

router = APIRouter(prefix="/api/matching", tags=["matching"])


# ============== Helper Functions ==============
def sanitize_lineup_for_frontend(lineup: List[dict]) -> List[dict]:
    """
    Remove sensitive fields from lineup before sending to frontend.
    This prevents fraud detection mechanisms from being exposed.
    """
    if not lineup:
        return []
    
    sanitized = []
    for suspect in lineup:
        safe_suspect = {
            "suspect_id": suspect.get("suspect_id"),
            "suspect_letter": suspect.get("suspect_letter"),
            "blurred_image": suspect.get("blurred_image"),
            "teaser": suspect.get("teaser"),
            "blur_reason": suspect.get("blur_reason"),
            "character_name": suspect.get("character_name"),
        }
        sanitized.append(safe_suspect)
    
    return sanitized


# ============== Request/Response Models ==============
class StartSessionRequest(BaseModel):
    """Request to start a new matching session."""
    user_id: Optional[str] = None
    inquiry_id: Optional[str] = None
    initial_category: Optional[str] = None


class StartSessionResponse(BaseModel):
    """Response when starting a session."""
    session_id: str
    stage: str
    message: str
    intake_progress: dict


class MessageRequest(BaseModel):
    """Request to send a message to the matching agent."""
    message: str
    image_urls: Optional[List[str]] = None


class MessageResponse(BaseModel):
    """Response from the matching agent."""
    session_id: str
    stage: str
    messages: List[dict]
    awaiting_input: bool
    intake_progress: Optional[dict] = None
    lineup: Optional[List[dict]] = None
    selected_suspect: Optional[dict] = None
    match_result: Optional[dict] = None


class SelectSuspectRequest(BaseModel):
    """Request to select a suspect from the lineup."""
    suspect_letter: str  # A, B, C, D, or E


class StartInterrogationResponse(BaseModel):
    """Response when starting an interrogation."""
    session_id: str
    interrogation_id: str
    item_id: str
    character_name: str
    message: str
    trust_score: float


class InterrogationMessageRequest(BaseModel):
    """Request to send a message in interrogation."""
    message: str


class InterrogationMessageResponse(BaseModel):
    """Response from the interrogation agent."""
    message: str
    trust_score: float
    wrong_attempts: Optional[int] = None
    secret_verified: Optional[bool] = None
    status: str
    can_continue: bool
    verification_requested: Optional[bool] = None
    match_score: Optional[float] = None
    match_status: Optional[str] = None


class VerificationPhotoRequest(BaseModel):
    """Request to submit a verification photo."""
    photo_url: str


class SessionStatusResponse(BaseModel):
    """Full status of a matching session."""
    session_id: str
    stage: str
    intake_complete: bool
    intake_data: Optional[dict] = None
    filter_stats: Optional[dict] = None
    lineup: Optional[List[dict]] = None
    selected_suspect_id: Optional[str] = None
    trust_score: float
    match_score: float
    match_status: str
    created_at: Optional[str] = None


# ============== Session Management Endpoints ==============

@router.post("/start", response_model=StartSessionResponse)
async def start_matching_session(request: StartSessionRequest):
    """
    Start a new matching session.
    
    This initializes the intake questionnaire process.
    Returns the session ID and the first question.
    """
    # Generate unique session ID
    session_id = f"match_{uuid.uuid4().hex[:12]}"
    
    # Get session manager
    manager = get_session_manager()
    
    # Create session
    state = manager.create_session(
        session_id=session_id,
        user_id=request.user_id
    )
    
    # Pre-fill category if provided
    if request.initial_category:
        state.intake_data["category"] = request.initial_category
        state.current_question_index = 1  # Skip category question
    
    # Start intake process
    result = manager.start_intake(session_id)
    
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    
    # Get first message
    first_message = ""
    if result.get("messages"):
        first_message = result["messages"][0].get("content", "")
    
    return StartSessionResponse(
        session_id=session_id,
        stage=result.get("stage", "intake"),
        message=first_message,
        intake_progress=result.get("intake_progress", {})
    )


@router.post("/{session_id}/message", response_model=MessageResponse)
async def send_message(session_id: str, request: MessageRequest):
    """
    Send a message to the matching agent.
    
    This handles user responses during the intake and other conversational stages.
    """
    manager = get_session_manager()
    
    result = manager.process_message(
        session_id=session_id,
        message=request.message,
        image_urls=request.image_urls
    )
    
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    
    return MessageResponse(
        session_id=session_id,
        stage=result.get("stage", "unknown"),
        messages=result.get("messages", []),
        awaiting_input=result.get("awaiting_input", True),
        intake_progress=result.get("intake_progress"),
        lineup=result.get("lineup"),
        selected_suspect=result.get("selected_suspect"),
        match_result=result.get("match_result")
    )


@router.post("/{session_id}/upload-image")
async def upload_image_to_session(session_id: str, image_urls: List[str]):
    """
    Add images to the current session's intake data.
    
    Called when user uploads images during intake.
    """
    manager = get_session_manager()
    state = manager.get_session(session_id)
    
    if not state:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Add images to intake data
    if not state.intake_data.get("image_urls"):
        state.intake_data["image_urls"] = []
    state.intake_data["image_urls"].extend(image_urls)
    
    return {
        "session_id": session_id,
        "images_added": len(image_urls),
        "total_images": len(state.intake_data["image_urls"])
    }


class BulkIntakeRequest(BaseModel):
    """Request to submit all intake data at once."""
    intake_data: dict
    image_url: Optional[str] = None


@router.post("/{session_id}/submit-intake")
async def submit_bulk_intake(session_id: str, request: BulkIntakeRequest):
    """
    Submit all intake data at once (for visual evidence board UI).
    
    This bypasses the step-by-step chat flow and directly processes all intake data,
    then runs filtering, searching, and generates the lineup.
    """
    manager = get_session_manager()
    state = manager.get_session(session_id)
    
    if not state:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Set all intake data at once
    state.intake_data = request.intake_data
    if request.image_url:
        state.intake_data["image_urls"] = [request.image_url]
    
    state.intake_complete = True
    state.stage = "filtering"
    state.awaiting_user_input = False
    
    # Import the processing functions
    from matching_agent import filtering_node, searching_node, lineup_node
    from langchain_core.messages import AIMessage
    
    all_messages = []
    
    try:
        # Run filtering
        filter_result = filtering_node(state)
        for key, value in filter_result.items():
            if key == "messages":
                state.messages.extend(value)
                all_messages.extend(value)
            else:
                setattr(state, key, value)
        
        # Check if we have any candidates
        if len(state.filtered_items) == 0:
            # Award 2 consolation spins to user
            if state.user_id:
                try:
                    from database import get_users_collection
                    users = get_users_collection()
                    users.update_one(
                        {"clerk_id": state.user_id},
                        {"$inc": {"spins": 2}}
                    )
                except Exception:
                    pass  # Don't fail if spin award fails
            
            return {
                "session_id": session_id,
                "stage": "complete",
                "messages": [{"role": "assistant", "content": m.content} for m in all_messages if isinstance(m, AIMessage)],
                "lineup": [],
                "match_result": {
                    "score": 0,
                    "status": "rejected",
                    "trust_score": 0,
                    "spins_awarded": 2
                }
            }
        
        # Run semantic search
        search_result = searching_node(state)
        for key, value in search_result.items():
            if key == "messages":
                state.messages.extend(value)
                all_messages.extend(value)
            else:
                setattr(state, key, value)
        
        # Run lineup generation
        lineup_result = lineup_node(state)
        for key, value in lineup_result.items():
            if key == "messages":
                state.messages.extend(value)
                all_messages.extend(value)
            else:
                setattr(state, key, value)
        
        return {
            "session_id": session_id,
            "stage": state.stage,
            "messages": [{"role": "assistant", "content": m.content} for m in all_messages if isinstance(m, AIMessage)],
            "lineup": sanitize_lineup_for_frontend(state.lineup),
            "filter_stats": state.filter_stats,
            "match_result": None
        }
        
    except Exception as e:
        return {
            "session_id": session_id,
            "stage": "complete",
            "messages": [{"role": "assistant", "content": f"Error processing evidence: {str(e)}"}],
            "lineup": [],
            "match_result": {
                "score": 0,
                "status": "rejected", 
                "trust_score": 0
            },
            "error": str(e)
        }


@router.post("/{session_id}/select-suspect")
async def select_suspect(session_id: str, request: SelectSuspectRequest):
    """
    Select a suspect from the blind lineup.
    
    After viewing the lineup, the user picks one suspect to interrogate.
    """
    manager = get_session_manager()
    
    result = manager.process_message(
        session_id=session_id,
        message=request.suspect_letter
    )
    
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    
    return result


@router.get("/{session_id}/status", response_model=SessionStatusResponse)
async def get_session_status(session_id: str):
    """
    Get the current status of a matching session.
    
    Returns full session state including progress, scores, and results.
    """
    manager = get_session_manager()
    state = manager.get_session(session_id)
    
    if not state:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return SessionStatusResponse(
        session_id=session_id,
        stage=state.stage,
        intake_complete=state.intake_complete,
        intake_data=state.intake_data,
        filter_stats=state.filter_stats,
        lineup=sanitize_lineup_for_frontend(state.lineup) if state.stage in ["lineup", "interrogation"] else None,
        selected_suspect_id=state.selected_suspect_id,
        trust_score=state.trust_score,
        match_score=state.match_score,
        match_status=state.match_status,
        created_at=None  # Would need to add to state
    )


@router.get("/{session_id}/lineup")
async def get_lineup(session_id: str):
    """
    Get the blind lineup for a session.
    
    Returns the list of suspects with their teasers (no identifying info).
    """
    manager = get_session_manager()
    state = manager.get_session(session_id)
    
    if not state:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if state.stage not in ["lineup", "interrogation", "verification", "complete"]:
        raise HTTPException(
            status_code=400, 
            detail=f"Lineup not available at stage: {state.stage}"
        )
    
    return {
        "session_id": session_id,
        "lineup": sanitize_lineup_for_frontend(state.lineup),
        "selected_suspect": {
            "id": state.selected_suspect_id,
            "letter": state.selected_suspect_letter
        } if state.selected_suspect_id else None
    }


# ============== Interrogation Endpoints ==============

@router.post("/{session_id}/interrogation/start", response_model=StartInterrogationResponse)
async def start_interrogation(session_id: str):
    """
    Start the interrogation phase with the selected suspect.
    
    Creates an interrogation session and returns the persona's opening line.
    """
    # Get matching session
    match_manager = get_session_manager()
    match_state = match_manager.get_session(session_id)
    
    if not match_state:
        raise HTTPException(status_code=404, detail="Matching session not found")
    
    if not match_state.selected_suspect_id:
        raise HTTPException(status_code=400, detail="No suspect selected yet")
    
    # Find the semantic score for the selected suspect
    semantic_score = 0.0
    for candidate in match_state.lineup:
        if candidate.get("suspect_id") == match_state.selected_suspect_id:
            semantic_score = candidate.get("semantic_score", 0.0)
            break
    
    # Create interrogation session
    interrogation_id = f"interr_{uuid.uuid4().hex[:8]}"
    interr_manager = get_interrogation_manager()
    
    try:
        interr_manager.create_session(
            session_id=interrogation_id,
            item_id=match_state.selected_suspect_id,
            semantic_score=semantic_score
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    
    # Start interrogation
    result = interr_manager.start_interrogation(interrogation_id)
    
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    
    # Update matching session stage
    match_state.stage = "interrogation"
    
    return StartInterrogationResponse(
        session_id=session_id,
        interrogation_id=interrogation_id,
        item_id=match_state.selected_suspect_id,
        character_name=result.get("character_name", "Unknown"),
        message=result.get("message", ""),
        trust_score=result.get("trust_score", 0.0)
    )


@router.post("/{session_id}/interrogation/{interrogation_id}/message", response_model=InterrogationMessageResponse)
async def send_interrogation_message(
    session_id: str, 
    interrogation_id: str, 
    request: InterrogationMessageRequest
):
    """
    Send a message in the interrogation chat.
    
    The user tries to prove ownership by answering the persona's questions.
    """
    interr_manager = get_interrogation_manager()
    
    result = interr_manager.send_message(
        session_id=interrogation_id,
        message=request.message
    )
    
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    
    # If interrogation is complete, update matching session
    if result.get("status") == "complete":
        match_manager = get_session_manager()
        match_state = match_manager.get_session(session_id)
        if match_state:
            match_state.trust_score = result.get("trust_score", 0.0)
            match_state.match_score = result.get("match_score", 0.0)
            match_state.match_status = result.get("match_status", "needs_review")
            match_state.stage = "complete"
    
    return InterrogationMessageResponse(
        message=result.get("message", ""),
        trust_score=result.get("trust_score", 0.0),
        wrong_attempts=result.get("wrong_attempts"),
        secret_verified=result.get("secret_verified"),
        status=result.get("status", "unknown"),
        can_continue=result.get("can_continue", False),
        verification_requested=result.get("verification_requested"),
        match_score=result.get("match_score"),
        match_status=result.get("match_status")
    )


@router.post("/{session_id}/interrogation/{interrogation_id}/verify")
async def submit_verification_photo(
    session_id: str,
    interrogation_id: str,
    request: VerificationPhotoRequest
):
    """
    Submit a verification photo during interrogation.
    
    The photo is compared with the item's clear photo using vision AI.
    """
    interr_manager = get_interrogation_manager()
    
    result = interr_manager.submit_photo(
        session_id=interrogation_id,
        photo_url=request.photo_url
    )
    
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    
    # Update matching session with final results
    match_manager = get_session_manager()
    match_state = match_manager.get_session(session_id)
    if match_state:
        match_state.trust_score = result.get("trust_score", 0.0)
        match_state.match_score = result.get("match_score", 0.0)
        match_state.match_status = result.get("match_status", "needs_review")
        match_state.stage = "complete"
        
        # Save to database
        await save_match_result(match_state, result)
    
    return result


@router.post("/{session_id}/interrogation/{interrogation_id}/skip-verification")
async def skip_verification(session_id: str, interrogation_id: str):
    """
    Skip photo verification (user doesn't have a photo).
    
    The match will be flagged for assistant review.
    """
    interr_manager = get_interrogation_manager()
    session = interr_manager.get_session(interrogation_id)
    
    if not session:
        raise HTTPException(status_code=404, detail="Interrogation session not found")
    
    result = session.skip_verification()
    
    # Update matching session with final results
    match_manager = get_session_manager()
    match_state = match_manager.get_session(session_id)
    if match_state:
        match_state.trust_score = result.get("trust_score", 0.0)
        match_state.match_score = result.get("match_score", 0.0)
        match_state.match_status = result.get("match_status", "needs_review")
        match_state.stage = "complete"
        
        # Save to database
        await save_match_result(match_state, result)
    
    return result


@router.get("/{session_id}/interrogation/{interrogation_id}/transcript")
async def get_interrogation_transcript(session_id: str, interrogation_id: str):
    """
    Get the full transcript of an interrogation session.
    """
    interr_manager = get_interrogation_manager()
    
    result = interr_manager.get_transcript(interrogation_id)
    
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    
    return result


# ============== Result Management ==============

async def save_match_result(match_state, interrogation_result: dict):
    """Save the final match result to the database."""
    try:
        matches_collection = get_matches_collection()
        items_collection = get_items_collection()
        
        match_doc = {
            "session_id": match_state.session_id,
            "user_id": match_state.user_id,
            "item_id": match_state.selected_suspect_id,
            "intake_data": match_state.intake_data,
            "filter_stats": match_state.filter_stats,
            "semantic_score": next(
                (c.get("semantic_score", 0) for c in match_state.lineup 
                 if c.get("suspect_id") == match_state.selected_suspect_id), 
                0
            ),
            "trust_score": match_state.trust_score,
            "match_score": match_state.match_score,
            "match_status": match_state.match_status,
            "verification_result": interrogation_result.get("verification_result"),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        matches_collection.insert_one(match_doc)
        
        # Update item status if confirmed
        if match_state.match_status in ["confirmed_match", "probable_match"]:
            items_collection.update_one(
                {"_id": ObjectId(match_state.selected_suspect_id)},
                {"$set": {"status": "matched", "updated_at": datetime.utcnow()}}
            )
    
    except Exception as e:
        print(f"Error saving match result: {e}")


@router.get("/results/{match_id}")
async def get_match_result(match_id: str):
    """
    Get a saved match result by ID.
    """
    matches_collection = get_matches_collection()
    
    try:
        match = matches_collection.find_one({"_id": ObjectId(match_id)})
        if not match:
            # Try by session_id
            match = matches_collection.find_one({"session_id": match_id})
        
        if not match:
            raise HTTPException(status_code=404, detail="Match not found")
        
        match["_id"] = str(match["_id"])
        return match
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/user/{user_id}/history")
async def get_user_match_history(user_id: str):
    """
    Get all match attempts for a user.
    """
    matches_collection = get_matches_collection()
    
    matches = list(matches_collection.find(
        {"user_id": user_id}
    ).sort("created_at", -1).limit(50))
    
    for match in matches:
        match["_id"] = str(match["_id"])
    
    return {"user_id": user_id, "matches": matches}


@router.post("/{session_id}/forward-to-admin")
async def forward_to_admin(session_id: str):
    """
    Forward the current session's match to admin for manual review.
    Saves the match to DB with needs_review status and forwarded_to_admin flag.
    """
    match_manager = get_session_manager()
    interr_manager = get_interrogation_manager()
    match_state = match_manager.get_session(session_id)

    matches_collection = get_matches_collection()
    items_collection = get_items_collection()

    # Check if already saved for this session
    existing = matches_collection.find_one({"session_id": session_id})
    if existing:
        matches_collection.update_one(
            {"session_id": session_id},
            {"$set": {"forwarded_to_admin": True, "match_status": "needs_review", "updated_at": datetime.utcnow()}}
        )
        existing["_id"] = str(existing["_id"])
        existing["forwarded_to_admin"] = True
        return {"status": "forwarded", "match": existing}

    # Build doc from in-memory session state
    item_id = match_state.selected_suspect_id if match_state else None
    match_doc = {
        "session_id": session_id,
        "user_id": match_state.user_id if match_state else None,
        "item_id": item_id,
        "intake_data": match_state.intake_data if match_state else {},
        "trust_score": match_state.trust_score if match_state else 0,
        "match_score": match_state.match_score if match_state else 0,
        "match_status": "needs_review",
        "forwarded_to_admin": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    matches_collection.insert_one(match_doc)

    if item_id:
        items_collection.update_one(
            {"_id": ObjectId(item_id)},
            {"$set": {"status": "matched", "updated_at": datetime.utcnow()}}
        )

    return {"status": "forwarded"}


@router.get("/pending-review")
async def get_pending_reviews():
    """
    Get all matches pending assistant review with full details.

    Includes:
    - Match data with scores
    - Item details (name, images, location)
    - Claimant details
    - Multiple claims detection
    """
    matches_collection = get_matches_collection()
    items_collection = get_items_collection()
    users_collection = get_users_collection()

    pending = list(matches_collection.find(
        {"match_status": {"$in": ["probable_match", "needs_review"]}}
    ).sort("created_at", -1))

    # Group matches by item_id to detect multiple claims
    item_claims = {}
    for match in pending:
        item_id = match.get("item_id")
        if item_id:
            if item_id not in item_claims:
                item_claims[item_id] = []
            item_claims[item_id].append(str(match["_id"]))

    enriched_matches = []
    for match in pending:
        match["_id"] = str(match["_id"])

        # Get item details
        item_id = match.get("item_id")
        item_data = None
        if item_id:
            item = items_collection.find_one({"_id": ObjectId(item_id)})
            if item:
                item_data = {
                    "id": str(item["_id"]),
                    "name": item.get("item_name", "Unknown Item"),
                    "description": item.get("description"),
                    "category": item.get("category"),
                    "location_name": item.get("location_name"),
                    "date_found": item.get("date_found"),
                    "image_url_clear": item.get("image_url_clear"),
                    "image_url_blurred": item.get("image_url_blurred"),
                    "image_urls": item.get("image_urls", [])
                }

        # Get claimant details
        user_id = match.get("user_id")
        claimant_data = None
        if user_id:
            user = users_collection.find_one({"clerk_id": user_id})
            if user:
                claimant_data = {
                    "id": user_id,
                    "email": user.get("email"),
                    "student_id": user.get("student_id"),
                    "trust_rating": user.get("trust_rating", 5.0)
                }

        # Check for multiple claims on this item
        competing_claims = item_claims.get(item_id, [])
        has_multiple_claims = len(competing_claims) > 1

        # Get intake data images
        intake_data = match.get("intake_data", {})
        claimant_images = intake_data.get("image_urls", [])

        enriched_matches.append({
            **match,
            "item": item_data,
            "claimant": claimant_data,
            "claimant_images": claimant_images,
            "has_multiple_claims": has_multiple_claims,
            "competing_claim_ids": competing_claims if has_multiple_claims else [],
            "claim_count": len(competing_claims)
        })

    return {
        "pending_count": len(enriched_matches),
        "matches": enriched_matches,
        "items_with_multiple_claims": sum(1 for m in enriched_matches if m["has_multiple_claims"])
    }


class ReviewMatchRequest(BaseModel):
    """Request body for reviewing a match."""
    decision: Literal["approve", "reject"]
    notes: Optional[str] = None


@router.post("/review/{match_id}")
async def review_match(match_id: str, request: ReviewMatchRequest):
    """
    Assistant reviews and finalizes a match.

    On approval:
    - Assigns a locker for pickup
    - Sends approval email with locker code and location

    On rejection:
    - Sends denial email with reason
    - Returns item to unclaimed status
    """
    matches_collection = get_matches_collection()
    items_collection = get_items_collection()
    users_collection = get_users_collection()

    try:
        match = matches_collection.find_one({"_id": ObjectId(match_id)})
        if not match:
            raise HTTPException(status_code=404, detail="Match not found")

        # Get item details
        item = items_collection.find_one({"_id": ObjectId(match["item_id"])})
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")

        item_name = item.get("item_name", "Unknown Item")

        # Get user details
        user_id = match.get("user_id")
        user_email = None
        user_name = None

        if user_id:
            user = users_collection.find_one({"clerk_id": user_id})
            if user:
                user_email = user.get("email")
                user_name = user.get("student_id") or "Detective"

        # Also check intake data for contact email
        intake_data = match.get("intake_data", {})
        if not user_email and intake_data.get("contact_email"):
            user_email = intake_data.get("contact_email")

        new_status = "confirmed_match" if request.decision == "approve" else "rejected"
        now = datetime.utcnow()

        locker_info = None
        email_result = None

        if request.decision == "approve":
            # Assign a locker
            from routes.lockers import find_available_locker, generate_locker_password, LOCKER_LOCATIONS, initialize_lockers
            lockers_collection = get_lockers_collection()

            # Initialize lockers if needed
            if lockers_collection.count_documents({}) == 0:
                initialize_lockers()

            locker_number = find_available_locker()
            if locker_number is None:
                raise HTTPException(
                    status_code=503,
                    detail="No lockers available. Please try again later."
                )

            password = generate_locker_password()
            location = LOCKER_LOCATIONS.get(locker_number, f"Locker Station {locker_number}")

            # Update locker
            locker_data = {
                "locker_number": locker_number,
                "location": location,
                "status": "assigned",
                "item_id": str(match["item_id"]),
                "match_id": match_id,
                "user_id": user_id,
                "user_email": user_email,
                "password": password,
                "item_name": item_name,
                "assigned_at": now,
                "unlocked_at": None,
                "collected_at": None,
                "updated_at": now
            }

            lockers_collection.update_one(
                {"locker_number": locker_number},
                {"$set": locker_data},
                upsert=True
            )

            locker_info = {
                "locker_number": locker_number,
                "location": location,
                "password": password
            }

            # Update match with locker info
            matches_collection.update_one(
                {"_id": ObjectId(match_id)},
                {
                    "$set": {
                        "match_status": new_status,
                        "reviewed_at": now,
                        "review_notes": request.notes,
                        "locker_number": locker_number,
                        "locker_location": location,
                        "locker_password": password
                    }
                }
            )

            # Update item status
            items_collection.update_one(
                {"_id": ObjectId(match["item_id"])},
                {"$set": {"status": "matched", "updated_at": now}}
            )

            # Send approval email
            if user_email:
                email_result = send_approval_email(
                    to_email=user_email,
                    item_name=item_name,
                    locker_number=locker_number,
                    locker_location=location,
                    password=password,
                    claimant_name=user_name
                )

        else:
            # Rejection
            matches_collection.update_one(
                {"_id": ObjectId(match_id)},
                {
                    "$set": {
                        "match_status": new_status,
                        "reviewed_at": now,
                        "review_notes": request.notes
                    }
                }
            )

            # Return item to unclaimed
            items_collection.update_one(
                {"_id": ObjectId(match["item_id"])},
                {"$set": {"status": "unclaimed", "updated_at": now}}
            )

            # Send denial email
            if user_email:
                email_result = send_denial_email(
                    to_email=user_email,
                    item_name=item_name,
                    reason=request.notes,
                    claimant_name=user_name
                )

        return {
            "match_id": match_id,
            "decision": request.decision,
            "new_status": new_status,
            "locker": locker_info,
            "email_sent": email_result
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
