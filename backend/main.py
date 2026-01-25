from typing import List, Dict, Optional
from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Database imports (Combined)
from database import get_database, test_connection, setup_indexes
from routes.users import router as users_router
from routes.images import router as images_router
from routes.inquiries import router as inquiries_router
from routes.items import router as items_router
from routes.matching import router as matching_router

# AI imports (From main)
from ai import get_sherlock_deduction, test_openrouter_connection
from embeddings import test_embedding_connection

app = FastAPI(title="SherLostHolmes API", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(users_router)
app.include_router(images_router)
app.include_router(inquiries_router)
app.include_router(items_router)
app.include_router(matching_router)

# Don't block startup with database operations
# Indexes will be created on first db-test call

@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI!"}

@app.get("/api/data")
def get_data():
    return {"data": "This is data from the backend"}

@app.get("/api/db-test")
def db_test():
    return test_connection()

# --- Endpoints from AndrewsMagic ---
@app.post("/api/setup-indexes")
def run_setup_indexes():
    return setup_indexes()

# --- Endpoints and Models from main ---
@app.get("/api/github")
def get_github():
    return {
        "repository": "AndrewKaranu/SherLostHolmes",
        "url": "https://github.com/AndrewKaranu/SherLostHolmes",
        "description": "Lost an item in Concordia? Come to us!"
    }

@app.get("/api/test-ai")
def test_ai():
    # Test OpenRouter API connection
    return test_openrouter_connection()


@app.get("/api/test-embeddings")
def test_embeddings():
    """Test OpenRouter embedding APIs (text and multimodal)"""
    return test_embedding_connection()

class DeductionRequest(BaseModel):
    lost_item_description: str
    candidate_matches: List[Dict]

@app.post("/api/deduction")
def get_deduction(request: DeductionRequest):
    # Validate input
    if not request.lost_item_description or not request.lost_item_description.strip():
        raise HTTPException(status_code=400, detail="lost_item_description cannot be empty")
    
    if not request.candidate_matches or len(request.candidate_matches) == 0:
        raise HTTPException(status_code=400, detail="candidate_matches cannot be empty. At least one candidate is required.")
    
    try:
        result = get_sherlock_deduction(
            lost_item_description=request.lost_item_description,
            candidate_matches=request.candidate_matches
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")