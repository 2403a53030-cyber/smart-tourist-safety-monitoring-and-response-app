# 🚀 Deployment Guide: Go Live!

This guide will help you put your website online so anyone can access it.

## Phase 1: Deploy Backend (Render)
This runs your `server.js` in the cloud.

1.  **Push to GitHub**: Make sure your latest code is on GitHub (you just did this!).
2.  **Sign Up**: Go to [render.com](https://render.com) and sign up with GitHub.
3.  **Create Web Service**:
    *   Click **New +** -> **Web Service**.
    *   Select **Build and deploy from a Git repository**.
    *   Connect your `tourist-safety-portal` repository.
4.  **Configure**:
    *   **Name**: `tourist-backend` (or similar).
    *   **Region**: Singapore (nearest to India).
    *   **Branch**: `main`.
    *   **Runtime**: `Node`.
    *   **Build Command**: `npm install` (default is fine).
    *   **Start Command**: `node server.js` (IMPORTANT: Change this if it says `npm start`).
5.  **Environment Variables** (Crucial!):
    *   Scroll down to **Environment Variables**.
    *   Click **Add Environment Variable**.
    *   **Key**: `MONGO_URI`
    *   **Value**: (Paste the connection string from your `.env` file).
6.  **Deploy**: Click **Create Web Service**.
    *   Wait for it to say "Live".
    *   **Copy the URL** (e.g., `https://tourist-backend.onrender.com`).

---

## Phase 2: Connect Frontend
Now we tell your website to talk to the live backend instead of your laptop.

1.  **Update Code**:
    *   Open `app.js` in VS Code.
    *   Find line 4: `const API_BASE_URL = "http://localhost:5000";`
    *   Replace it with your Render URL:
        ```javascript
        const API_BASE_URL = "https://tourist-backend.onrender.com"; // Your actual Render URL
        ```
2.  **Push Changes**:
    ```bash
    git add .
    git commit -m "Update API URL for production"
    git push
    ```

---

## Phase 3: Deploy Frontend (GitHub Pages)
This hosts your `index.html`.

1.  Go to your **GitHub Repository**.
2.  Click **Settings** (top tab).
3.  Click **Pages** (left sidebar).
4.  **Build and deployment**:
    *   Source: **Deploy from a branch**.
    *   Branch: **main** / **(root)**.
    *   Click **Save**.
5.  Wait about 1-2 minutes. Refresh the page.
6.  You will see your live link at the top (e.g., `https://2403a53030-cyber.github.io/tourist-safety-portal/`).

**🎉 DONE! Send this link to your friends!**
