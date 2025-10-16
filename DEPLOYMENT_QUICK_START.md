# ⚡ Quick Start Deployment (5 Minutes)

## 🎯 Fastest Path to Live POC

### 1️⃣ Backend (Render.com) - 2 minutes
```bash
# 1. Push to GitHub (if not done)
git push origin main

# 2. Go to render.com → New Blueprint → Select your repo
# 3. It auto-detects backend/render.yaml
# 4. Click "Apply"
# 5. Set JWT_SECRET in environment:
openssl rand -base64 64  # Copy this output
```

### 2️⃣ Frontend (Netlify) - 2 minutes
```bash
# 1. Go to netlify.com → New Site → Import from Git
# 2. Configure:
#    Base: frontend
#    Build: npm run build  
#    Publish: frontend/dist
# 3. Add env var:
#    VITE_API_URL = https://your-backend.onrender.com/api/v1
# 4. Deploy!
```

### 3️⃣ Final Step - 1 minute
```bash
# Update backend CORS:
# Render → Your service → Environment → Add:
FRONTEND_URL = https://your-site.netlify.app
```

## ✅ Done!
- Frontend: `https://your-site.netlify.app`
- Backend: `https://your-backend.onrender.com`
- Cost: **$0/month**

## 🎮 Test It
1. Open frontend URL
2. Sign up / Login
3. Create a group
4. Invite friends!

---

**Need help?** See full guide: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
