# Matching System API Examples

## Overview

The matching system is an agentic workflow that helps users find their lost items through:
1. **Intake** - Guided questionnaire
2. **Hard Filters** - Time, category, location filtering
3. **Semantic Search** - AI-powered similarity matching
4. **Blind Lineup** - Anonymous item presentation
5. **Interrogation** - Persona-based ownership verification
6. **Verification** - Optional photo proof

---

## API Endpoints

### 1. Start a Matching Session

```bash
POST /api/matching/start
Content-Type: application/json

{
    "user_id": "user_123",
    "inquiry_id": "inq_abc",
    "initial_category": "electronics"  # Optional - skips category question
}
```

**Response:**
```json
{
    "session_id": "match_a1b2c3d4e5f6",
    "stage": "intake",
    "message": "**Question 1/8:**\nWhat type of item did you lose?\n\nOptions: electronics, clothing, jewelry, bags, keys, books, sports, food, other",
    "intake_progress": {
        "current": 0,
        "total": 8,
        "complete": false
    }
}
```

---

### 2. Send Message (Answer Questions)

```bash
POST /api/matching/{session_id}/message
Content-Type: application/json

{
    "message": "electronics",
    "image_urls": []  # Optional - for image upload
}
```

**Response:**
```json
{
    "session_id": "match_a1b2c3d4e5f6",
    "stage": "intake",
    "messages": [
        {"role": "assistant", "content": "Got it! That helps narrow things down."},
        {"role": "assistant", "content": "**Question 2/8:**\nWhen did you lose it?..."}
    ],
    "awaiting_input": true,
    "intake_progress": {"current": 1, "total": 8, "complete": false}
}
```

---

### 3. Get Session Status

```bash
GET /api/matching/{session_id}/status
```

**Response:**
```json
{
    "session_id": "match_a1b2c3d4e5f6",
    "stage": "lineup",
    "intake_complete": true,
    "intake_data": {
        "category": "electronics",
        "date_lost": "2025-01-20T14:00:00",
        "location_name": "Hall Building",
        "description": "Black iPhone 14 with cracked screen"
    },
    "filter_stats": {
        "total_items": 150,
        "after_time_filter": 75,
        "after_category_filter": 30,
        "after_location_filter": 12
    },
    "lineup": [...],
    "trust_score": 0,
    "match_score": 0,
    "match_status": "in_progress"
}
```

---

### 4. Get Blind Lineup

```bash
GET /api/matching/{session_id}/lineup
```

**Response:**
```json
{
    "session_id": "match_a1b2c3d4e5f6",
    "lineup": [
        {
            "suspect_id": "6789abcd...",
            "suspect_letter": "A",
            "blurred_image": "https://cloudinary.com/blurred/...",
            "teaser": "A damaged smartphone with a playful decoration.",
            "blur_reason": "Bio-metric lock engaged",
            "character_name": "Shattered Steve"
        },
        {
            "suspect_id": "1234efgh...",
            "suspect_letter": "B",
            "blurred_image": "https://cloudinary.com/blurred/...",
            "teaser": "A beat-up gadget waiting for its hero.",
            "blur_reason": "Identity protection protocol active",
            "character_name": "Captain Cracked"
        }
        // ... up to 5 suspects
    ],
    "selected_suspect": null
}
```

---

### 5. Select a Suspect

```bash
POST /api/matching/{session_id}/select-suspect
Content-Type: application/json

{
    "suspect_letter": "B"
}
```

**Response:**
```json
{
    "session_id": "match_a1b2c3d4e5f6",
    "stage": "interrogation",
    "messages": [
        {"role": "assistant", "content": "🚪 Opening the interrogation room for **Captain Cracked**..."}
    ],
    "selected_suspect": {
        "id": "1234efgh...",
        "letter": "B"
    }
}
```

---

### 6. Start Interrogation

```bash
POST /api/matching/{session_id}/interrogation/start
```

**Response:**
```json
{
    "session_id": "match_a1b2c3d4e5f6",
    "interrogation_id": "interr_abc123",
    "item_id": "1234efgh...",
    "character_name": "Captain Cracked",
    "message": "My screen hurts... do you know why? Tell me about my battle scars.",
    "trust_score": 20.0
}
```

---

### 7. Chat in Interrogation

```bash
POST /api/matching/{session_id}/interrogation/{interrogation_id}/message
Content-Type: application/json

{
    "message": "You have a Spiderman sticker on the back!"
}
```

**Response (Correct Guess):**
```json
{
    "message": "*eyes widen* Wait... Spidey? Is that really you, owner? You know about my secret decoration!",
    "trust_score": 75.0,
    "wrong_attempts": 0,
    "secret_verified": true,
    "status": "verified",
    "can_continue": true,
    "verification_requested": true
}
```

**Response (Wrong Guess):**
```json
{
    "message": "*narrows eyes* A Batman sticker? I don't know any Batman. You have 2 more chances.",
    "trust_score": 10.0,
    "wrong_attempts": 1,
    "secret_verified": false,
    "status": "questioning",
    "can_continue": true
}
```

---

### 8. Submit Verification Photo

```bash
POST /api/matching/{session_id}/interrogation/{interrogation_id}/verify
Content-Type: application/json

{
    "photo_url": "https://cloudinary.com/user_proof/selfie_with_phone.jpg"
}
```

**Response:**
```json
{
    "message": "🎉 **VERIFICATION SUCCESSFUL!**\n\n*Captain Cracked lights up with joy!*\n\n\"It's really you!\"",
    "trust_score": 85.0,
    "verification_result": {
        "match_confidence": 92,
        "matching_features": ["Spiderman sticker", "Cracked screen pattern", "Red bumper case"],
        "discrepancies": []
    },
    "match_score": 87.5,
    "match_status": "confirmed_match",
    "status": "complete",
    "can_continue": false
}
```

---

### 9. Skip Verification

```bash
POST /api/matching/{session_id}/interrogation/{interrogation_id}/skip-verification
```

---

### 10. Get Pending Reviews (Admin)

```bash
GET /api/matching/pending-review
```

---

### 11. Review a Match (Admin)

```bash
POST /api/matching/review/{match_id}?decision=approve&notes=Verified%20by%20staff
```

---

## Flow Diagram

```
┌──────────────┐
│  /start      │
└──────┬───────┘
       ▼
┌──────────────┐    User answers
│  INTAKE      │◄──────────────────┐
│  Questions   │                   │
└──────┬───────┘    /message       │
       │            ──────────────►│
       ▼ (auto)
┌──────────────┐
│  FILTERING   │
│  Hard Filters│
└──────┬───────┘
       ▼ (auto)
┌──────────────┐
│  SEARCHING   │
│  Semantic    │
└──────┬───────┘
       ▼ (auto)
┌──────────────┐    User picks
│  LINEUP      │◄──────────────────┐
│  Blind Cards │                   │
└──────┬───────┘   /select-suspect │
       │           ───────────────►│
       ▼
┌──────────────┐    /interrogation/start
│INTERROGATION │◄──────────────────────
│  Persona Chat│
└──────┬───────┘    User chats
       │◄───────────────────────────┐
       │   /interrogation/.../msg   │
       │   ────────────────────────►│
       ▼
┌──────────────┐   /verify or /skip
│ VERIFICATION │◄───────────────────
│  Photo Proof │
└──────┬───────┘
       ▼
┌──────────────┐
│  COMPLETE    │
│  Match Result│
└──────────────┘
```

---

## Match Score Calculation

The final match score (0-100) is calculated from:

| Component | Max Points | Description |
|-----------|-----------|-------------|
| Semantic Similarity | 40 | How similar the descriptions/images are |
| Trust Score | 35 | Built during interrogation |
| Secret Verified | 15 | Correctly identified unique feature |
| Photo Verification | 10 | Visual confirmation bonus |
| Wrong Attempts | -3 each | Penalty for incorrect guesses |

**Match Status:**
- `confirmed_match`: Score ≥85 + Photo verification ≥70%
- `probable_match`: Score ≥60
- `needs_review`: Score ≥40
- `rejected`: Score <40
