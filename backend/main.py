from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from database import test_connection, setup_indexes
from routes.users import router as users_router

app = FastAPI(title="SherLostHolmes API", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # Next.js default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(users_router)

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

@app.post("/api/setup-indexes")
def run_setup_indexes():
    return setup_indexes()

