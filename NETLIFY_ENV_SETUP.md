# Netlify Environment Variable Setup

## 🎯 Quick Fix: Set the Correct Backend URL

Your backend is deployed at:
```
https://hikehub-backend-3u30.onrender.com
```

But your frontend is calling the wrong URL:
```
https://hikehub-backend.onrender.com  ❌ (doesn't exist)
```

---

## ✅ How to Fix

### Step 1: Add Environment Variable in Netlify

1. **Go to Netlify Dashboard:**
   - Visit: https://app.netlify.com
   - Click on your **hikehub-poc** site

2. **Navigate to Environment Variables:**
   - Click **Site configuration** in the left sidebar
   - Click **Environment variables**
   - Click **Add a variable** (or **Add environment variable**)

3. **Add the Variable:**
   - **Key:** `VITE_API_URL`
   - **Value:** `https://hikehub-backend-3u30.onrender.com/api/v1`
   - **Scopes:** Select "All scopes" or just "Production"
   - Click **Create variable**

---

### Step 2: Trigger a New Deploy

After adding the environment variable:

1. **Go to Deploys tab** (in your Netlify site dashboard)
2. Click **Trigger deploy** button (top right)
3. Select **Deploy site**
4. Wait 1-2 minutes for the build to complete

---

### Step 3: Clear Browser Cache & Test

1. **Hard refresh your browser:**
   - **Chrome/Edge:** `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
   - **Firefox:** `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
   - **Safari:** `Cmd+Option+R`

2. **Or use Incognito/Private mode:**
   - Open a new incognito/private window
   - Visit: https://hikehub-poc.netlify.app

3. **Verify in DevTools:**
   - Press F12
   - Go to **Console** tab
   - Type: `console.log(import.meta.env.VITE_API_URL)`
   - Should show: `https://hikehub-backend-3u30.onrender.com/api/v1` ✅

---

## 🔍 Troubleshooting

### Issue: Environment Variable Not Working

If the variable still doesn't work after deploying:

1. **Check the build logs:**
   - In Netlify, click on the latest deploy
   - Check the build logs for any errors
   - Look for a line that shows environment variables being loaded

2. **Verify the variable name:**
   - Must be exactly: `VITE_API_URL` (case-sensitive)
   - Must start with `VITE_` (Vite requirement)

3. **Check Vite configuration:**
   - Vite only exposes env variables that start with `VITE_`
   - Other env variables won't be available in the browser

---

## 📋 Screenshot Guide

### Where to Find Environment Variables:

```
Netlify Dashboard
└── Your Site (hikehub-poc)
    └── Site configuration (left sidebar)
        └── Environment variables
            └── Add a variable button
```

### What to Enter:

| Field | Value |
|-------|-------|
| **Key** | `VITE_API_URL` |
| **Value** | `https://hikehub-backend-3u30.onrender.com/api/v1` |
| **Scopes** | All scopes ✓ |

---

## ✅ Expected Result

After following these steps:

1. ✅ Environment variable is set in Netlify
2. ✅ Frontend redeployed with new variable
3. ✅ Frontend calls: `https://hikehub-backend-3u30.onrender.com/api/v1/*`
4. ✅ Backend responds with CORS headers
5. ✅ No more CORS errors!
6. ✅ API calls work! 🎉

---

## 🎯 Quick Verification

After deploying, test these URLs in your browser:

### Backend Health (Direct):
```
https://hikehub-backend-3u30.onrender.com/actuator/health
```
**Expected:** `{"status":"UP"}`

### Backend API (Direct):
```
https://hikehub-backend-3u30.onrender.com/api/v1/events/public?page=0&size=10
```
**Expected:** JSON list of events

### Frontend (After Fix):
```
https://hikehub-poc.netlify.app
```
**Expected:** No CORS errors in console, events load correctly

---

## 🚨 Common Mistakes

1. ❌ Forgetting to redeploy after adding env variable
2. ❌ Typo in variable name (must be `VITE_API_URL`)
3. ❌ Missing `/api/v1` at the end of the URL
4. ❌ Using old browser cache (need hard refresh)
5. ❌ Adding variable but selecting wrong scope

---

## 📞 Still Not Working?

If you still see the old URL after:
- ✅ Adding the environment variable
- ✅ Redeploying
- ✅ Hard refreshing browser

Then check:

1. **Netlify Deploy Log:**
   - Look for "Environment variables" section
   - Verify `VITE_API_URL` is listed

2. **Browser Network Tab:**
   - Open DevTools → Network tab
   - Clear and reload
   - Click on a failed request
   - Check the **Request URL** - what is it calling?

3. **Try Incognito Mode:**
   - Completely bypasses cache
   - If it works there, it's a cache issue

---

## 🎉 Success Checklist

- [ ] Added `VITE_API_URL` environment variable in Netlify
- [ ] Value is: `https://hikehub-backend-3u30.onrender.com/api/v1`
- [ ] Triggered new deploy on Netlify
- [ ] Deploy completed successfully (green checkmark)
- [ ] Hard refreshed browser (Cmd/Ctrl+Shift+R)
- [ ] No CORS errors in console
- [ ] Events are loading on frontend
- [ ] Can login/request magic link

Once all checked, your deployment is complete! 🚀
