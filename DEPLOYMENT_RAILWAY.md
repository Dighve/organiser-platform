# 🚂 Alternative: Deploy Everything on Railway

## Why Railway?
- ✅ **Simpler**: Everything in one place (frontend, backend, database)
- ✅ **$5 free credit/month** (enough for light POC)
- ✅ **No cold starts** (unlike Render free tier)
- ✅ **Better developer experience**
- ⚠️ **Cost**: May need to pay after $5 credit (typically $5-10/month for POC)

---

## 🚀 One-Click Deployment

### Step 1: Create Railway Project
```bash
# 1. Go to https://railway.app
# 2. Sign up with GitHub
# 3. Click "New Project" → "Deploy from GitHub repo"
# 4. Select your repository
```

### Step 2: Add PostgreSQL Database
```bash
# In Railway dashboard:
# 1. Click "+ New"
# 2. Select "Database" → "PostgreSQL"
# 3. It auto-creates DATABASE_URL variable
```

### Step 3: Deploy Backend
```bash
# Railway auto-detects Spring Boot!
# 1. Click "+ New" → "GitHub Repo" → "backend"
# 2. Railway auto-configures build
# 3. Add environment variables:
#    - JWT_SECRET: <random-64-char-string>
#    - SPRING_PROFILES_ACTIVE: prod
# 4. Set root directory to "backend"
# 5. Deploy!
```

### Step 4: Deploy Frontend
```bash
# 1. Click "+ New" → "GitHub Repo" → "frontend"  
# 2. Railway auto-detects Vite
# 3. Set root directory to "frontend"
# 4. Add environment variable:
#    - VITE_API_URL: <your-backend-railway-url>/api/v1
# 5. Deploy!
```

### Step 5: Configure CORS
```bash
# Go to backend service → Variables → Add:
FRONTEND_URL = <your-frontend-railway-url>
```

---

## 📊 Cost Breakdown

### Free Credit Usage (Per Month)
- Backend: ~$3-4
- Frontend: ~$1-2  
- Database: ~$1-2
- **Total: ~$5-8/month**

### With Free $5 Credit:
- **First month**: $0-3 out of pocket
- **Ongoing**: $5-8/month

---

## 🆚 Render vs Railway Comparison

| Feature | Render (Free) | Railway ($5 credit) |
|---------|---------------|---------------------|
| **Cost** | $0 | $0-8/month |
| **Cold starts** | Yes (30s) | No ⚡ |
| **Setup complexity** | Medium | Easy |
| **Database size** | 1GB | Unlimited* |
| **Build minutes** | 100/month | Unlimited* |
| **Uptime** | Limited | Better |
| **Best for** | Zero budget | Smooth UX |

*Within $5-10 budget

---

## 🎯 Recommendation

### Choose **Render** if:
- You want 100% free
- You're okay with cold starts
- Testing with <10 users
- Short-term POC (< 3 months)

### Choose **Railway** if:
- You can spend $5-10/month
- You want instant response times
- Testing with 10-50 users
- Need professional experience
- Planning longer-term POC

---

## 🚂 Railway Configuration Files

If you prefer infrastructure-as-code:

### `railway.json` (Backend)
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "./gradlew clean build -x test"
  },
  "deploy": {
    "startCommand": "java -jar build/libs/platform-1.0.0.jar",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### `railway.json` (Frontend)
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run build"
  },
  "deploy": {
    "startCommand": "npm run preview -- --host 0.0.0.0 --port $PORT"
  }
}
```

---

## 💡 Pro Tips

1. **Monitor usage**: Railway dashboard shows real-time cost
2. **Set budget alerts**: Get notified before charges
3. **Scale down when not testing**: Pause services to save money
4. **Use sleep mode**: Railway can auto-sleep inactive services

---

**Setup Time**: 15-20 minutes

For detailed Railway setup, visit: https://docs.railway.app
