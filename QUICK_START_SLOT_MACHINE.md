# 🎰 Slot Machine - Quick Start Guide

## Step 1: Start Backend Server

Open **Terminal 1**:
```bash
cd /Users/hamid/Desktop/CONUHACKS/SherLostHolmes/SherLostHolmes/backend
python3 -m uvicorn main:app --reload --port 8000
```

Wait until you see: `Uvicorn running on http://127.0.0.1:8000`

---

## Step 2: Start Frontend Server

Open **Terminal 2**:
```bash
cd /Users/hamid/Desktop/CONUHACKS/SherLostHolmes/SherLostHolmes/frontend
npm run dev
```

Wait until you see: `Ready on http://localhost:3000`

---

## Step 3: Seed Test Data (Important!)

Open **Terminal 3**:
```bash
cd /Users/hamid/Desktop/CONUHACKS/SherLostHolmes/SherLostHolmes/backend
python3 seed_archived_item.py
```

You should see: `Inserted archived test item: id=...`

**Why?** The slot machine needs items that are 6+ months old to give as rewards when you win. This script creates one.

---

## Step 4: Verify Backend API

Test that the archived items endpoint works:
```bash
curl http://127.0.0.1:8000/api/items/archived
```

You should get a JSON array with at least one item.

---

## Step 5: Open Slot Machine in Browser

1. Open your browser
2. Go to: **http://localhost:3000/lucky-find**
   
   OR
   
   Go to: **http://localhost:3000** → Click **"Try Your Luck"**

---

## Step 6: Test the Slot Machine

1. Click the **"INVESTIGATE"** button
2. Watch the reels:
   - They show `???` while spinning
   - Reveal one by one (left → right)
   - Takes ~2.4 seconds total
3. **If you WIN** (3 matching symbols):
   - Modal pops up: "🎉 You won!"
   - Shows the reward item (from your seeded data)
4. **If you LOSE** (different symbols):
   - Message appears: "No match — try again!"
   - Click INVESTIGATE again to spin

---

## 🎯 Quick Test Tips

**Win Rate:** Currently 25% (1 in 4 spins)

**To test wins faster**, temporarily change in `frontend/app/lucky-find/page.tsx`:
```typescript
const WIN_CHANCE = 1; // Change from 0.25 to 1 (100% wins)
```

**Remember to change it back to `0.25` when done testing!**

---

## ✅ Checklist

- [ ] Backend running on port 8000
- [ ] Frontend running on port 3000  
- [ ] Ran `seed_archived_item.py` successfully
- [ ] `curl /api/items/archived` returns items
- [ ] Opened `/lucky-find` in browser
- [ ] Clicked INVESTIGATE and saw spin animation
- [ ] Got a win and saw reward modal

---

## 🐛 Troubleshooting

**"No archived items available"**  
→ Run `python3 seed_archived_item.py` again

**Button doesn't work / keeps spinning**  
→ Check browser console for errors (F12)

**Backend not connecting**  
→ Make sure backend is running on port 8000  
→ Check `NEXT_PUBLIC_API_URL` in `frontend/.env.local`

**Frontend won't start**  
→ Run `npm install` in the frontend directory

---

## 🎮 What You Should See

- **Slot machine UI** with 3 reels
- **"INVESTIGATE" button** (disabled while spinning)
- **Reels showing ???** then revealing symbols
- **Win modal** with reward item details
- **Lose message** when symbols don't match

Enjoy testing! 🎰
