# Instagram Sharing - Quick Start Guide

## What Was Fixed

Instagram was showing generic "Day Hikes from London" preview instead of event-specific information when sharing event links.

## Solution

Implemented Netlify Edge Function that serves dynamic Open Graph tags to Instagram's crawler.

## Deploy Now

```bash
cd organiser-platform/frontend
git add netlify/edge-functions/og-tags.js netlify.toml
git commit -m "Fix Instagram sharing with dynamic OG tags"
git push origin main
```

Netlify will automatically deploy the edge function.

## Test After Deployment

### 1. Facebook Debugger (Instagram uses this)
```
https://developers.facebook.com/tools/debug/
```
- Paste: `https://www.outmeets.com/events/8`
- Click "Debug"
- Should show event title, description, and image
- Click "Scrape Again" to force refresh

### 2. Test on Instagram
1. Open Instagram app
2. Create a story or DM
3. Paste event URL
4. Wait for preview to load
5. Should show event-specific preview

## How It Works

**For Crawlers (Instagram, Facebook, Twitter):**
1. Edge function detects crawler
2. Fetches event data from Render backend API
3. Injects dynamic meta tags
4. Returns HTML with event-specific tags

**For Regular Users:**
- Normal React SPA (no overhead)

## Cache Refresh

Instagram caches previews for ~7 days. To force refresh:
1. Use Facebook Debugger
2. Click "Scrape Again"
3. Wait 1-2 minutes
4. Test on Instagram

## Files Changed

1. ✅ `netlify/edge-functions/og-tags.js` - Edge function (NEW)
2. ✅ `netlify.toml` - Edge function config (MODIFIED)
3. ✅ `public/og-image.jpg` - Default fallback image (EXISTING)

## Verify Deployment

1. Go to Netlify dashboard
2. Navigate to Functions → Edge Functions
3. Should see "og-tags" function deployed
4. Check recent deploys for success

## Troubleshooting

**Preview not updating:**
- Clear Facebook cache (Scrape Again button)
- Wait 5-10 minutes
- Try different event URL

**Edge function not working:**
```bash
# Test with curl (simulates crawler)
curl -A "facebookexternalhit/1.1" https://www.outmeets.com/events/8
```

Should return HTML with event-specific meta tags.

## Cost

- **Free** - Netlify includes 3M edge function requests/month
- **Usage** - Only ~1K-5K/month (crawlers only)

## Next Steps

1. ✅ Deploy to Netlify
2. ✅ Test with Facebook Debugger
3. ✅ Test on Instagram
4. Consider adding for group pages
5. Consider dynamic OG image generation

## Support

Full documentation: `docs/INSTAGRAM_SHARING_FIX.md`
