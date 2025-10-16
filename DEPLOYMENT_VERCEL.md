# 🚀 Deploy Frontend on Vercel (Free Alternative to Netlify)

## Why Vercel?
- ✅ **100% FREE** for personal projects
- ✅ **Supports private repositories** (no Organization restriction)
- ✅ Excellent React/Vite support
- ✅ Global CDN
- ✅ Auto-deploy from GitHub
- ✅ Free SSL/HTTPS

---

## 📋 Quick Deployment Steps

### Step 1: Create Vercel Account
1. Go to https://vercel.com
2. Click **"Sign Up"**
3. Choose **"Continue with GitHub"**
4. Authorize Vercel to access your repositories

### Step 2: Import Project
1. Click **"Add New..."** → **"Project"**
2. Find your repository: `organiser-platform`
3. Click **"Import"**

### Step 3: Configure Build Settings
1. **Framework Preset**: Select **"Vite"**
2. **Root Directory**: Click "Edit" → Enter `frontend`
3. **Build Command**: `npm run build` (auto-detected)
4. **Output Directory**: `dist` (auto-detected)

### Step 4: Add Environment Variables
Click **"Environment Variables"** and add:
- **Name**: `VITE_API_URL`
- **Value**: `https://your-backend-url.onrender.com/api/v1` (use your actual Render backend URL)
- **Environment**: Select all (Production, Preview, Development)

### Step 5: Deploy!
1. Click **"Deploy"**
2. Wait 2-3 minutes for build
3. You'll get a URL like: `https://organiser-platform-xyz.vercel.app`

---

## 🔄 Update Backend CORS

After deployment, update your backend to allow requests from Vercel:

1. Go to **Render.com** → Your backend service
2. Go to **Environment** tab
3. Update `FRONTEND_URL` to your Vercel URL:
   ```
   https://organiser-platform-xyz.vercel.app
   ```
4. Save (backend will auto-redeploy)

---

## 🎨 Custom Domain (Optional)

Vercel allows custom domains on free tier:
1. Go to your project → **Settings** → **Domains**
2. Add your domain
3. Update DNS records as instructed

---

## 📊 Vercel vs Netlify Comparison

| Feature | Netlify Free | Vercel Free |
|---------|--------------|-------------|
| **Private repos (Organization)** | ❌ Need Pro | ✅ Yes |
| **Bandwidth** | 100GB/month | 100GB/month |
| **Build minutes** | 300/month | 6000/month ⚡ |
| **Custom domains** | ✅ Yes | ✅ Yes |
| **Auto-deploy** | ✅ Yes | ✅ Yes |
| **Edge Functions** | 125k/month | Unlimited* |

*Within fair use policy

**Winner for your use case**: Vercel ✅

---

## 🆘 Troubleshooting

### Build fails
- Check build logs
- Verify `frontend/` directory structure
- Ensure all dependencies in package.json

### API connection fails
- Verify `VITE_API_URL` environment variable
- Check backend CORS configuration
- Test backend health endpoint first

### Environment variable not working
- Rebuild/redeploy after adding env vars
- Check variable name starts with `VITE_`
- Verify it's set for Production environment

---

## ✅ Success Checklist

- [ ] Vercel account created
- [ ] Repository imported
- [ ] Root directory set to `frontend`
- [ ] Environment variable `VITE_API_URL` added
- [ ] Deployment successful
- [ ] Frontend URL received
- [ ] Backend CORS updated with frontend URL
- [ ] Tested in browser

---

## 🎉 Done!

Your frontend is now live on Vercel!

**Total Cost**: $0/month
**Setup Time**: 5-10 minutes
**Works with**: Private repositories ✅

---

**Next Steps**:
1. Test your frontend at the Vercel URL
2. Share with testers
3. Gather feedback!
