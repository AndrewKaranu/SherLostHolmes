from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Literal
from datetime import datetime
from bson import ObjectId

# Custom ObjectId type for Pydantic
class PyObjectId(str):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v, info):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return str(v)


# ============== GeoJSON ==============
class GeoJSONPoint(BaseModel):
    type: Literal["Point"] = "Point"
    coordinates: List[float]  # [longitude, latitude]


# ============== ITEM SCHEMA ==============
class Persona(BaseModel):
    archetype: Optional[str] = None  # e.g., "The Grumpy Veteran"
    teaser: Optional[str] = None  # Public hint
    system_prompt: Optional[str] = None  # Full instruction set for chat AI
    opening_line: Optional[str] = None  # First message the item sends


class ItemBase(BaseModel):
    status: Literal["unclaimed", "matched", "resolved", "returned"] = "unclaimed"
    # Hard Filters
    category: Literal["electronics", "clothing", "wallet_id", "keys", "other"]
    date_found: datetime = Field(default_factory=datetime.utcnow)
    location: Optional[GeoJSONPoint] = None
    location_name: Optional[str] = None  # e.g., "Main Hall"
    # Visual Evidence
    image_url_clear: Optional[str] = None  # PRIVATE - Cloudinary URL
    image_url_blurred: Optional[str] = None  # PUBLIC - Blurred Cloudinary URL
    # AI Data
    vector_embedding: Optional[List[float]] = None  # 768-dim or 1536-dim vector
    tags_ai: Optional[List[str]] = None  # e.g., ["iphone", "cracked", "black"]
    # The Persona (Soul)
    persona: Optional[Persona] = None
    hidden_facts: Optional[List[str]] = None  # Secrets only owner knows


class ItemCreate(ItemBase):
    pass


class ItemInDB(ItemBase):
    id: Optional[str] = Field(alias="_id")

    class Config:
        populate_by_name = True


# ============== INQUIRY SCHEMA ==============
class InquiryBase(BaseModel):
    user_id: Optional[str] = None
    status: Literal["active", "closed", "found"] = "active"
    # Search Criteria
    description_text: Optional[str] = None  # User's raw input
    description_vector: Optional[List[float]] = None  # Vector from description
    category: Literal["electronics", "clothing", "wallet_id", "keys", "other"]
    date_lost: Optional[datetime] = None
    location_lost: Optional[GeoJSONPoint] = None
    # Contact Info
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None


class InquiryCreate(InquiryBase):
    pass


class InquiryInDB(InquiryBase):
    id: Optional[str] = Field(alias="_id")

    class Config:
        populate_by_name = True


# ============== MATCH SCHEMA ==============
class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    text: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class MatchBase(BaseModel):
    inquiry_id: str
    item_id: str
    # Game State
    match_percentage: Optional[float] = None  # Initial Vector Similarity Score
    trust_score: float = 0.0  # Dynamic score (0-100)
    status: Literal["pending", "chat_active", "approved", "rejected"] = "pending"
    attempts: int = 0  # Count of wrong answers
    is_locked: bool = False  # True if user failed too many times
    # The Transcript
    chat_history: List[ChatMessage] = []


class MatchCreate(MatchBase):
    pass


class MatchInDB(MatchBase):
    id: Optional[str] = Field(alias="_id")

    class Config:
        populate_by_name = True


# ============== USER SCHEMA ==============
class UserBase(BaseModel):
    clerk_id: str  # Clerk user ID (e.g., "user_2abc123...")
    student_id: Optional[str] = None  # University ID, e.g., "40012345"
    email: EmailStr
    role: Literal["user", "assistant"] = "user"
    trust_rating: float = 5.0  # Score 0-5


class UserCreate(UserBase):
    pass  # No password needed - Clerk handles auth


class UserInDB(UserBase):
    id: Optional[str] = Field(alias="_id")

    class Config:
        populate_by_name = True


# ============== MATCHING SESSION SCHEMA ==============
class IntakeData(BaseModel):
    """Data collected during the intake questionnaire"""
    category: Optional[str] = None
    date_lost: Optional[datetime] = None
    location_name: Optional[str] = None
    location_coordinates: Optional[List[float]] = None  # [longitude, latitude]
    description: Optional[str] = None
    unique_features: Optional[str] = None
    color: Optional[str] = None
    brand: Optional[str] = None
    image_urls: Optional[List[str]] = None
    additional_info: Optional[dict] = None


class LineupCandidate(BaseModel):
    """A suspect in the blind lineup"""
    suspect_id: str
    suspect_letter: str  # A, B, C, D, E
    blurred_image: Optional[str] = None
    teaser: Optional[str] = None
    blur_reason: Optional[str] = None
    character_name: Optional[str] = None
    semantic_score: Optional[float] = None  # Hidden from user


class VerificationResult(BaseModel):
    """Result of photo verification"""
    match_confidence: float = 0.0
    matching_features: List[str] = []
    discrepancies: List[str] = []
    verification_method: str = "photo_comparison"


class MatchSessionBase(BaseModel):
    """Match session tracking the entire matching flow"""
    user_id: Optional[str] = None
    inquiry_id: Optional[str] = None
    
    # Current stage of the matching process
    stage: Literal[
        "intake",           # Asking questions
        "filtering",        # Applying hard filters
        "searching",        # Semantic search
        "lineup",           # Blind lineup presentation
        "interrogation",    # 1-on-1 persona chat
        "verification",     # Final proof stage
        "complete"          # Session finished
    ] = "intake"
    
    # Intake phase data
    intake_data: Optional[IntakeData] = None
    intake_complete: bool = False
    current_question_index: int = 0
    
    # Filter results
    filtered_item_ids: List[str] = []
    filter_stats: Optional[dict] = None  # e.g., {"total": 100, "after_time": 50, "after_category": 20, "after_location": 8}
    
    # Semantic search results
    semantic_candidates: List[LineupCandidate] = []
    user_embedding: Optional[List[float]] = None
    
    # Lineup selection
    selected_suspect_id: Optional[str] = None
    selected_suspect_letter: Optional[str] = None
    
    # Interrogation tracking
    interrogation_messages: List[ChatMessage] = []
    trust_score: float = 0.0  # 0-100
    secret_verified: bool = False
    wrong_attempts: int = 0
    max_attempts: int = 3
    
    # Verification
    verification_photo_url: Optional[str] = None
    verification_result: Optional[VerificationResult] = None
    
    # Final scoring
    match_score: float = 0.0  # 0-100 combined score
    match_status: Literal[
        "in_progress",
        "probable_match",
        "confirmed_match",
        "rejected",
        "needs_review"
    ] = "in_progress"
    
    # Conversation history with orchestrator
    orchestrator_messages: List[ChatMessage] = []
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class MatchSessionCreate(BaseModel):
    """Schema for starting a new match session"""
    user_id: Optional[str] = None
    inquiry_id: Optional[str] = None
    initial_category: Optional[str] = None


class MatchSessionInDB(MatchSessionBase):
    id: Optional[str] = Field(alias="_id")

    class Config:
        populate_by_name = True
