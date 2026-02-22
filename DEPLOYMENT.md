# Chitram - Two-Service Render Deployment Guide

## Architecture

- **Frontend**: Static Site (Vite/React)
- **Backend**: Web Service (Node.js/Express)
- **Database**: MongoDB Atlas

---

## Prerequisites

1. GitHub/GitLab repo with latest code pushed
2. MongoDB Atlas connection string ready
3. Render account created

---

## Step 1: Deploy Backend First

### 1.1 Create Web Service

1. Login to Render Dashboard
2. Click **New +** → **Web Service**
3. Connect your GitHub/GitLab repository
4. Select branch (e.g., `main`)

### 1.2 Configure Backend Service

- **Name**: `chitram-backend`
- **Runtime**: `Node`
- **Root Directory**: `backend`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### 1.3 Add Environment Variables

Click **Advanced** → **Add Environment Variable**:

| KEY            | VALUE                                | NOTES                                |
| -------------- | ------------------------------------ | ------------------------------------ |
| `MONGODB_URI`  | `mongodb+srv://...`                  | Your MongoDB Atlas connection string |
| `JWT_SECRET`   | `your-random-secret-key`             | Generate strong random string        |
| `FRONTEND_URL` | `https://your-frontend.onrender.com` | Will update after frontend deploy    |
| `NODE_ENV`     | `production`                         |                                      |

### 1.4 Deploy Backend

- Click **Create Web Service**
- Wait for deployment to complete
- **Copy the backend URL** (e.g., `https://chitram-backend.onrender.com`)

---

## Step 2: Deploy Frontend

### 2.1 Update Frontend Environment

**BEFORE deploying frontend**, update this file locally:

File: `frontend/.env.production`

```env
VITE_API_BASE_URL=https://chitram-backend.onrender.com/api
```

Replace `https://chitram-backend.onrender.com` with your actual backend URL from Step 1.4.

Commit and push:

```bash
git add frontend/.env.production
git commit -m "update backend url for production"
git push
```

### 2.2 Create Static Site

1. In Render Dashboard: **New +** → **Static Site**
2. Connect same repository
3. Select branch (e.g., `main`)

### 2.3 Configure Frontend Service

- **Name**: `chitram-frontend`
- **Root Directory**: `frontend`
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`

### 2.4 Add Rewrite Rule

Scroll to **Redirects/Rewrites** section:

- **Source**: `/*`
- **Destination**: `/index.html`
- **Action**: `Rewrite`

This enables React Router to work on refresh.

### 2.5 Deploy Frontend

- Click **Create Static Site**
- Wait for deployment
- **Copy the frontend URL** (e.g., `https://chitram-frontend.onrender.com`)

---

## Step 3: Update Backend CORS

### 3.1 Update Backend Environment

Go back to **Backend Service** → **Environment**:

- Update `FRONTEND_URL` to your actual frontend URL from Step 2.5
- Example: `https://chitram-frontend.onrender.com`

### 3.2 Trigger Backend Redeploy

- Click **Manual Deploy** → **Deploy latest commit**
- This updates CORS to allow frontend requests

---

## Step 4: Test Deployment

### 4.1 Open Frontend

Visit your frontend URL (e.g., `https://chitram-frontend.onrender.com`)

### 4.2 Verify Features

1. **Health Check**: Backend should wake up automatically on page load
2. **Register**: Create new account
3. **Login**: Sign in with credentials
4. **Search**: Test movie search
5. **Favorites**: Add/remove favorites
6. **Lists**: Create and manage lists

---

## Troubleshooting

### Frontend shows "Network Error"

- **Cause**: `VITE_API_BASE_URL` not set correctly in `frontend/.env.production`
- **Fix**: Update the file, commit, push, and redeploy frontend

### CORS Error in Browser Console

- **Cause**: `FRONTEND_URL` in backend doesn't match actual frontend URL
- **Fix**: Update backend environment variable and redeploy

### Backend returns 500 on /health

- **Cause**: MongoDB connection failed
- **Fix**: Check `MONGODB_URI` in backend environment variables

### Backend is slow on first request

- **Normal**: Render free tier spins down after inactivity
- **Solution**: Health check in frontend wakes it up automatically
- **Upgrade**: Use Render paid tier for always-on instances

---

## Important Notes

1. **Free Tier Limitations**:
   - Backend spins down after 15 minutes of inactivity
   - First request may take 30-60 seconds to wake up
   - Auto health check helps reduce this delay

2. **Environment Variables**:
   - Backend env vars are runtime (change anytime, redeploy)
   - Frontend env vars are build-time (need rebuild after change)

3. **Security**:
   - Never commit `.env` files
   - Use strong `JWT_SECRET`
   - Whitelist only your frontend URL in backend CORS

---

## Production Checklist

- [ ] Backend deployed and health check returns 200
- [ ] Frontend `.env.production` has correct backend URL
- [ ] Frontend deployed successfully
- [ ] Backend `FRONTEND_URL` matches actual frontend URL
- [ ] Test registration and login
- [ ] Test search functionality
- [ ] Test favorites and lists
- [ ] Verify health check wakes backend

---

## Commands Reference

### Test Backend Health (after deploy)

```bash
curl https://your-backend.onrender.com/health
```

Expected response:

```json
{ "status": "ok", "message": "Chitram backend is running" }
```

### Check Frontend Build Logs

Look for this line in Render build logs:

```
dist/assets/index-XXXXXXXX.js
```

Hash should change with each code update.

---

## Support

If deployment fails:

1. Check Render logs for error messages
2. Verify all environment variables are set
3. Ensure MongoDB Atlas allows connections from anywhere (0.0.0.0/0)
4. Test backend `/health` endpoint directly in browser
