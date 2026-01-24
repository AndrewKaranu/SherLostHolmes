from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
from database import get_database, test_connection
from ai import get_sherlock_deduction, test_openrouter_connection

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # Next.js default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI!"}

@app.get("/api/data")
def get_data():
    return {"data": "This is data from the backend"}

@app.get("/api/db-test")
def db_test():
    return test_connection()

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

