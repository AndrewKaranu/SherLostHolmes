# Slot Machine (Lucky-Find) – How to Test

## 1. Start backend and frontend

**Terminal 1 – Backend**
```bash
cd backend
pip install -r requirements.txt   # if needed
python -m uvicorn main:app --reload --port 8000
```

**Terminal 2 – Frontend**
```bash
cd frontend
npm install   # if needed
npm run dev
```

**MongoDB** must be running and `MONGODB_URI` set in `backend/.env`.

---

## 2. Seed an archived test item (6+ months old)

So that a **win** actually returns a reward:

```bash
cd backend
python seed_archived_item.py
```

You should see: `Inserted archived test item: id=...`

---

## 3. Check the archived API

```bash
curl http://127.0.0.1:8000/api/items/archived
```

You should get a JSON array with at least one item (the one you seeded).

---

## 4. Open the slot machine in the browser

1. Go to **http://localhost:3000**
2. Click **Try Your Luck** (or open **http://localhost:3000/lucky-find** directly)
3. Click **INVESTIGATE**

---

## 5. What to check

| Test | What to do | Expected |
|------|------------|----------|
| **Spin** | Click INVESTIGATE | Reels show ???, then reveal one by one (~0.6s, 1.2s, 1.8s) |
| **Lose** | Spin until you get 3 different symbols | Message: **No match — try again!** |
| **Win** | Spin until all 3 symbols match (VIOLIN/VIOLIN/VIOLIN, etc.) | Modal: **You won!** and your reward = the seeded item (name, category, location) |
| **Button disabled** | Click INVESTIGATE and click again during spin | Button stays disabled until spin ends |

---

## 6. Force a win (optional, for quick testing)

Temporarily set win chance to **100%** in `frontend/app/lucky-find/page.tsx`:

```ts
const WIN_CHANCE = 1; // was 0.25
```

Then every spin wins and shows the reward modal. Change it back to `0.25` when done testing.

---

## Quick checklist

- [ ] Backend running on port 8000  
- [ ] Frontend running on port 3000  
- [ ] MongoDB running, `MONGODB_URI` in `.env`  
- [ ] `python seed_archived_item.py` run  
- [ ] `curl http://127.0.0.1:8000/api/items/archived` returns at least one item  
- [ ] Open `/lucky-find`, click INVESTIGATE, see spin + win/lose + reward modal on win  
