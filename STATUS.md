# 🎰 Slot Machine Status

## ✅ Servers Started

**Backend PID:** 28176  
**Frontend PID:** 30814

Both servers should be running now!

---

## 🌐 Access URLs

- **Backend API:** http://127.0.0.1:8000
- **Frontend:** http://localhost:3000
- **Slot Machine:** http://localhost:3000/lucky-find

---

## 🧪 Test the Slot Machine

1. **Open your browser**
2. **Go to:** http://localhost:3000/lucky-find
3. **Click "INVESTIGATE"** button
4. **Watch the reels spin!**

---

## 📊 Check Server Status

**Backend:**
```bash
curl http://127.0.0.1:8000/api/data
```

**Frontend:**
```bash
curl http://localhost:3000
```

**Archived Items (for slot machine rewards):**
```bash
curl http://127.0.0.1:8000/api/items/archived
```

---

## 🛑 Stop Servers

```bash
kill 28176 30814
```

Or use the script:
```bash
./start.sh  # (will kill old processes first)
```

---

## 📝 View Logs

**Backend logs:**
```bash
tail -f /tmp/sherlost_backend.log
```

**Frontend logs:**
```bash
tail -f /tmp/sherlost_frontend.log
```

---

## ⚠️ Note About MongoDB

The seed script had an SSL connection issue with MongoDB, but that's okay:
- The database might already have test data
- The slot machine will work even without seeded data (it just won't show rewards on win)
- You can manually seed later if needed

---

## 🎯 What to Expect

1. **Click "INVESTIGATE"** → Reels show `???` and spin
2. **Reels reveal** one by one (left → right)
3. **If you WIN** (3 matching symbols):
   - Modal: "🎉 You won!"
   - Shows reward item (if available)
4. **If you LOSE**:
   - Message: "No match — try again!"

**Win rate:** 25% (1 in 4 spins)

---

## 🚀 Quick Restart

If something isn't working, just run:
```bash
./start.sh
```

This will kill old processes and start fresh!
