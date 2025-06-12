# Vercel Project Setup Instructions

Follow these steps to create and configure your Vercel projects for DublinDash.

## Architecture Overview
**Simplified Deployment Strategy:**
- **GitHub Actions**: Handles all building (installs dependencies, builds frontend/backend)
- **Vercel**: Just serves pre-built files (no building, no dependency installation)

This approach is faster, more reliable, and easier to debug than having Vercel build everything.

## Step 1: Create Vercel Account (if needed)
1. Go to https://vercel.com
2. Sign up with your GitHub account
3. Authorize Vercel to access your repositories

## Step 2: Create Frontend Project

1. **From Vercel Dashboard:**
   - Click "Add New..." → "Project"
   - Import your GitHub repository (dguiley/dublindash)
   - **Framework Preset:** Other (since GitHub Actions handles building)
   - **Root Directory:** `apps/frontend` (click "Edit" and change it)
   - **Build Settings:**
     - Build Command: (leave empty - GitHub Actions handles this)
     - Output Directory: `dist`
     - Install Command: (leave empty - no building needed)
   - **Environment Variables:** (Add these)
     - `VITE_SERVER_URL` = (leave empty for now, update after backend deploy)
   - Click "Deploy"

2. **Note your Frontend Project Details:**
   - Go to Project Settings → General
   - Copy the **Project ID** (you'll need this for GitHub secrets)

## Step 3: Create Backend Project

1. **From Vercel Dashboard:**
   - Click "Add New..." → "Project"
   - Import the same repository again (dguiley/dublindash)
   - **Framework Preset:** Other
   - **Root Directory:** `apps/backend` (click "Edit" and change it)
   - **Build Settings:**
     - Build Command: (leave empty - GitHub Actions handles this)
     - Output Directory: `dist`
     - Install Command: (leave empty - no building needed)
   - **Environment Variables:** (Add these)
     - `NODE_ENV` = `production`
     - `PORT` = `3010`
   - Click "Deploy"

2. **Configure for Node.js API:**
   - After initial deploy, go to Project Settings → Functions
   - Ensure Node.js 18.x runtime is selected
   - Max duration: 30 seconds (for WebSocket connections)

3. **Note your Backend Project Details:**
   - Go to Project Settings → General
   - Copy the **Project ID**
   - Copy the **Production Domain** URL

## Step 4: Update Environment Variables

1. **Update Frontend Project:**
   - Go to your Frontend project → Settings → Environment Variables
   - Update `VITE_SERVER_URL` with your backend's production URL
   - Example: `https://dublindash-backend.vercel.app`

2. **Update Backend CORS:**
   - The backend will automatically use the production URLs for CORS

## Step 5: Get Organization ID

1. Go to your Vercel Dashboard
2. Click on your avatar → Settings
3. Under "General", find your **Team ID** or **Personal Account ID**
4. This is your `VERCEL_ORG_ID`

## Step 6: Create Vercel Token

1. Go to https://vercel.com/account/tokens
2. Click "Create"
3. Name it "DublinDash Deploy"
4. Select appropriate scope (Full Access recommended)
5. Copy the token immediately (you won't see it again)

## Step 7: Add GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these repository secrets:
- `VERCEL_ORG_ID` = Your organization/team ID from Step 5
- `VERCEL_PROJECT_ID_FRONTEND` = Frontend project ID from Step 2
- `VERCEL_PROJECT_ID_BACKEND` = Backend project ID from Step 3
- `VERCEL_TOKEN` = Token from Step 6

## Step 8: Trigger Deployment

1. Push any change to the `main` branch
2. GitHub Actions will:
   - Build both frontend and backend using pnpm workspaces
   - Deploy the built artifacts to Vercel
3. Check Actions tab in GitHub to see build and deployment progress
4. Vercel just hosts the pre-built files (no building on Vercel)

## Troubleshooting

### If WebSocket connections fail:
- Ensure backend is using Vercel Functions (not Edge Functions)
- Check CORS settings include your frontend domain
- Verify environment variables are set correctly

### If builds fail:
- Check GitHub Actions logs (not Vercel logs - Vercel doesn't build)
- Ensure pnpm workspace configuration is correct
- Verify all dependencies are in package.json files
- Check that build commands work locally with `pnpm --filter` syntax

### Domain Setup (Optional):
- You can add custom domains in Vercel project settings
- Example: `game.yourdomain.com` for frontend
- Example: `api.yourdomain.com` for backend

## Success Indicators
✅ GitHub Actions build and deploy successfully (green checkmarks)
✅ Frontend loads at your Vercel URL
✅ Backend health check responds at `/health`
✅ WebSocket connections work (test with multiple browser tabs)
✅ Vercel projects show "Deployed" status (but no build logs)

## Next Steps
After successful deployment:
1. Test multiplayer functionality
2. Monitor performance in Vercel Analytics
3. Set up error tracking (optional)
4. Configure custom domains (optional)