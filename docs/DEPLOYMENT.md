# DublinDash Deployment Guide

## Vercel Deployment Setup

### Prerequisites
1. Create two Vercel projects:
   - One for the frontend (Vue app)
   - One for the backend (Node.js API)

2. Get the following values from Vercel:
   - Organization ID
   - Project ID for frontend
   - Project ID for backend
   - Vercel Token

### GitHub Secrets Required
Add these secrets to your GitHub repository:
- `VERCEL_ORG_ID` - Your Vercel organization ID
- `VERCEL_PROJECT_ID_FRONTEND` - Frontend project ID
- `VERCEL_PROJECT_ID_BACKEND` - Backend project ID
- `VERCEL_TOKEN` - Your Vercel access token

### Environment Variables
The backend will need these environment variables in Vercel:
- `PORT` - Set to 3010
- `NODE_ENV` - Set to production
- `VITE_SERVER_URL` - The deployed backend URL (update after first deploy)

The frontend will need:
- `VITE_SERVER_URL` - The deployed backend URL

### Deployment Process
1. Push to main branch
2. GitHub Actions will automatically:
   - Build both frontend and backend
   - Deploy to Vercel
   - Handle all configuration

### Notes
- The backend uses WebSockets, ensure Vercel Functions support is configured
- Frontend is a static Vue app with SPA routing
- Update CORS settings in backend for production domains

## Future: Supabase Integration
When ready to add database:
1. Authentication via Supabase Auth
2. Game stats and leaderboards
3. Player profiles and preferences
4. Level data storage