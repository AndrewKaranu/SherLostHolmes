# API Examples for SherLostHolmes

## `/api/deduction` Endpoint

### Example Request

**Endpoint:** `POST http://localhost:8000/api/deduction`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "lost_item_description": "A red backpack with a laptop inside, has a Concordia logo sticker",
  "candidate_matches": [
    {
      "id": "item_123",
      "description": "Red backpack found near library entrance, contains a MacBook",
      "location": "Library entrance",
      "found_date": "2026-01-24"
    },
    {
      "id": "item_456",
      "description": "Blue backpack with books and notebooks",
      "location": "Cafeteria",
      "found_date": "2026-01-23"
    },
    {
      "id": "item_789",
      "description": "Red backpack with Concordia sticker, found in hallway",
      "location": "Hall Building, 2nd floor",
      "found_date": "2026-01-24"
    }
  ]
}
```

### Example Response (Success)

**Status Code:** `200 OK`

**Response Body:**
```json
{
  "deduction": "OBSERVATIONS:\nThe lost item is described as a red backpack containing a laptop, with a distinctive Concordia logo sticker.\n\nANALYSIS:\n- Candidate #1: Red backpack with MacBook, found at library entrance. Matches color and laptop presence, but no mention of sticker.\n- Candidate #2: Blue backpack - color mismatch, eliminated.\n- Candidate #3: Red backpack with Concordia sticker, found in hallway. Matches color and the distinctive sticker feature.\n\nDEDUCTION:\nCandidate #3 (item_789) is the most likely match. The presence of the Concordia logo sticker is a distinctive feature that strongly supports this identification.\n\nREASONING:\nWhile Candidate #1 matches the color and laptop, Candidate #3 has the specific Concordia sticker mentioned in the lost item description. This unique identifier makes it the most probable match.",
  "matched_item_id": "item_789",
  "confidence": "high"
}
```

### Example Response (Error - Missing API Key)

**Status Code:** `500 Internal Server Error`

**Response Body:**
```json
{
  "detail": "AI service error: OPENROUTER_API_KEY environment variable is not set. Please check your .env file."
}
```

### Example Response (Error - Empty Description)

**Status Code:** `400 Bad Request`

**Response Body:**
```json
{
  "detail": "lost_item_description cannot be empty"
}
```

### Example Response (Error - No Candidates)

**Status Code:** `400 Bad Request`

**Response Body:**
```json
{
  "detail": "candidate_matches cannot be empty. At least one candidate is required."
}
```

## Testing with cURL

```bash
curl -X POST "http://localhost:8000/api/deduction" \
  -H "Content-Type: application/json" \
  -d '{
    "lost_item_description": "A red backpack with a laptop inside",
    "candidate_matches": [
      {
        "id": "item_123",
        "description": "Red backpack found near library",
        "location": "Library entrance",
        "found_date": "2026-01-24"
      }
    ]
  }'
```

## Testing with Python

```python
import requests

url = "http://localhost:8000/api/deduction"
data = {
    "lost_item_description": "A red backpack with a laptop inside",
    "candidate_matches": [
        {
            "id": "item_123",
            "description": "Red backpack found near library",
            "location": "Library entrance",
            "found_date": "2026-01-24"
        }
    ]
}

response = requests.post(url, json=data)
print(response.json())
```
