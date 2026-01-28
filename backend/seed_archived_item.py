"""
Seed a test item that's 6+ months old (for slot machine / lucky-find testing).
Run from backend/: python seed_archived_item.py
"""
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()
uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
db_name = os.getenv("DATABASE_NAME", "SherLostHolmes")

client = MongoClient(uri)
db = client[db_name]
items = db["items"]

# 7 months ago
old_date = datetime.utcnow() - timedelta(days=210)

doc = {
    "item_name": "Test Lost Item (Slot Machine Reward)",
    "description": "Seeded for testing the lucky-find slot. Claim via Lost & Found.",
    "category": "other",
    "status": "unclaimed",
    "date_found": old_date,
    "location_name": "Hall Building, 2nd floor",
    "notes": "Created by seed_archived_item.py",
    "image_url_clear": None,
    "image_url_blurred": None,
    "image_urls": [],
    "image_public_ids": [],
    "user_id": None,
    "contact_email": None,
    "created_at": old_date,
    "updated_at": datetime.utcnow(),
}

r = items.insert_one(doc)
print(f"Inserted archived test item: id={r.inserted_id}")
print("You can now spin the slot machine; wins will use this item as a reward.")
