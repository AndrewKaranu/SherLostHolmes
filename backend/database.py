import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
DATABASE_NAME = os.getenv("DATABASE_NAME", "SherLostHolmes")

client = MongoClient(MONGODB_URI)
db = client[DATABASE_NAME]

def get_database():
    return db

def test_connection():
    try:
        client.admin.command('ping')
        return {"status": "success", "message": "Connected to MongoDB!"}
    except Exception as e:
        return {"status": "error", "message": str(e)}
