# Backend Deployment Options

## Important: WebSocket Limitations

The DublinDash backend uses **Socket.IO for real-time multiplayer**, which requires:
- Persistent WebSocket connections
- Stateful server processes
- Long-running connections

**Vercel's serverless functions do NOT support WebSockets!**

## Recommended Hosting Options

### Option 1: Railway.app (Recommended)
- Full Node.js support with WebSockets
- Easy GitHub integration
- Free tier available
- Steps:
  1. Sign up at railway.app
  2. Connect GitHub repo
  3. Set root directory to `apps/backend`
  4. Set start command to `npm start`
  5. Deploy!

### Option 2: Render.com
- WebSocket support
- Free tier with spin-down
- Automatic deploys from GitHub
- Similar setup to Railway

### Option 3: Fly.io
- Excellent WebSocket support
- Global edge deployment
- Requires Docker setup
- More complex but very scalable

### Option 4: DigitalOcean App Platform
- Full Node.js and WebSocket support
- $5/month minimum
- Good for production

### Option 5: Keep Frontend on Vercel, Backend Elsewhere
This is the best approach:
1. **Frontend on Vercel** - Perfect for static Vue app
2. **Backend on Railway/Render** - Full WebSocket support

## Environment Variables for Backend
Wherever you deploy, set these:
- `NODE_ENV=production`
- `PORT=3010` (or use provided PORT)

## Update Frontend
After deploying backend, update the frontend's environment variable:
- `VITE_SERVER_URL=https://your-backend-url.railway.app`

## For Development
You can still use Vercel for the frontend and run the backend locally or on a different service.