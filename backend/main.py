from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import get_database, test_connection

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

