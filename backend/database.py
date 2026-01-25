import os
from pymongo import MongoClient, GEOSPHERE, ASCENDING
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
DATABASE_NAME = os.getenv("DATABASE_NAME", "SherLostHolmes")

# Lazy connection - only connect when needed
_client = None
_db = None


def get_client():
    global _client
    if _client is None:
        _client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
    return _client


def get_database():
    global _db
    if _db is None:
        _db = get_client()[DATABASE_NAME]
    return _db


# ============== COLLECTIONS (lazy) ==============
def get_items_collection():
    return get_database()["items"]

def get_inquiries_collection():
    return get_database()["inquiries"]

def get_matches_collection():
    return get_database()["matches"]

def get_users_collection():
    return get_database()["users"]

def get_lockers_collection():
    return get_database()["lockers"]


def get_collections():
    return {
        "items": get_items_collection(),
        "inquiries": get_inquiries_collection(),
        "matches": get_matches_collection(),
        "users": get_users_collection(),
        "lockers": get_lockers_collection()
    }


def setup_indexes():
    """Create indexes for optimal query performance."""
    try:
        items = get_items_collection()
        inquiries = get_inquiries_collection()
        matches = get_matches_collection()
        users = get_users_collection()
        
        # Drop old conflicting indexes if they exist
        try:
            users.drop_index("student_id_1")
        except:
            pass
        
        # Items indexes
        items.create_index([("location", GEOSPHERE)])
        items.create_index([("category", ASCENDING)])
        items.create_index([("status", ASCENDING)])
        items.create_index([("date_found", ASCENDING)])
        
        # Inquiries indexes
        inquiries.create_index([("user_id", ASCENDING)])
        inquiries.create_index([("category", ASCENDING)])
        inquiries.create_index([("status", ASCENDING)])
        inquiries.create_index([("location_lost", GEOSPHERE)])
        
        # Matches indexes
        matches.create_index([("inquiry_id", ASCENDING)])
        matches.create_index([("item_id", ASCENDING)])
        matches.create_index([("status", ASCENDING)])
        
        # Users indexes
        users.create_index([("email", ASCENDING)], unique=True)
        users.create_index([("clerk_id", ASCENDING)], unique=True)
        users.create_index([("student_id", ASCENDING)], sparse=True, name="student_id_sparse")

        # Lockers indexes
        lockers = get_lockers_collection()
        lockers.create_index([("locker_number", ASCENDING)], unique=True)
        lockers.create_index([("status", ASCENDING)])
        lockers.create_index([("item_id", ASCENDING)], sparse=True)
        lockers.create_index([("match_id", ASCENDING)], sparse=True)

        return {"status": "success", "message": "Indexes created successfully!"}
    except Exception as e:
        return {"status": "warning", "message": f"Indexes may already exist: {str(e)}"}


def test_connection():
    try:
        get_client().admin.command('ping')
        return {"status": "success", "message": "Connected to MongoDB!"}
    except Exception as e:
        return {"status": "error", "message": str(e)}
