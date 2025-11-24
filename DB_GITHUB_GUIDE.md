# MongoDB Atlas & GitHub Setup Guide

This guide will help you set up an online database (MongoDB Atlas) and host your code on GitHub.

## Part 1: MongoDB Atlas Setup (Online Database)

1.  **Create an Account**: Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and sign up for a free account.
2.  **Create a Cluster**:
    *   Select the **Shared (Free)** option.
    *   Choose a provider (AWS) and region (e.g., Mumbai `ap-south-1`).
    *   Click **Create Cluster**.
3.  **Create a Database User**:
    *   Go to **Database Access** (sidebar).
    *   Click **Add New Database User**.
    *   Enter a **Username** and **Password** (Remember these!).
    *   Select role: **Read and write to any database**.
    *   Click **Add User**.
4.  **Allow Network Access**:
    *   Go to **Network Access** (sidebar).
    *   Click **Add IP Address**.
    *   Select **Allow Access from Anywhere** (`0.0.0.0/0`).
    *   Click **Confirm**.
5.  **Get Connection String**:
    *   Go to **Database** (sidebar).
    *   Click **Connect** on your cluster.
    *   Select **Drivers** (Node.js).
    *   Copy the **Connection String** (it looks like `mongodb+srv://<username>:<password>@...`).

### Update Your Project
1.  Open the `.env` file in your project folder.
2.  Paste your connection string.
3.  Replace `<password>` with your actual password.
    *   Example: `MONGO_URI=mongodb+srv://admin:MySecurePass123@cluster0.mongodb.net/touristID?retryWrites=true&w=majority`
4.  Save the file.

---

## Part 2: GitHub Setup (Hosting Code)

1.  **Create a Repository**:
    *   Go to [GitHub](https://github.com/new).
    *   Name your repository (e.g., `tourist-safety-portal`).
    *   Keep it **Public** or **Private**.
    *   **Do NOT** initialize with README, .gitignore, or License (we already have them).
    *   Click **Create repository**.

2.  **Push Your Code**:
    Open your terminal (VS Code) and run these commands one by one:

    ```bash
    git init
    git add .
    git commit -m "Initial commit - Tourist Safety Portal"
    git branch -M main
    git remote add origin https://github.com/<YOUR_USERNAME>/tourist-safety-portal.git
    git push -u origin main
    ```
    *(Replace `<YOUR_USERNAME>` with your actual GitHub username)*

## Troubleshooting: Wrong GitHub Account?
If this computer is already logged in as someone else (or you see "Permission denied"):

1.  **Set your identity for THIS project only**:
    Run these commands in the terminal:
    ```bash
    git config user.name "Your Actual Name"
    git config user.email "your-email@example.com"
    ```

2.  **Clear old credentials**:
    If it tries to push as the other user and fails:
# MongoDB Atlas & GitHub Setup Guide

This guide will help you set up an online database (MongoDB Atlas) and host your code on GitHub.

## Part 1: MongoDB Atlas Setup (Online Database)

1.  **Create an Account**: Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and sign up for a free account.
2.  **Create a Cluster**:
    *   Select the **Shared (Free)** option.
    *   Choose a provider (AWS) and region (e.g., Mumbai `ap-south-1`).
    *   Click **Create Cluster**.
3.  **Create a Database User**:
    *   Go to **Database Access** (sidebar).
    *   Click **Add New Database User**.
    *   Enter a **Username** and **Password** (Remember these!).
    *   Select role: **Read and write to any database**.
    *   Click **Add User**.
4.  **Allow Network Access**:
    *   Go to **Network Access** (sidebar).
    *   Click **Add IP Address**.
    *   Select **Allow Access from Anywhere** (`0.0.0.0/0`).
    *   Click **Confirm**.
5.  **Get Connection String**:
    *   Go to **Database** (sidebar).
    *   Click **Connect** on your cluster.
    *   Select **Drivers** (Node.js).
    *   Copy the **Connection String** (it looks like `mongodb+srv://<username>:<password>@...`).

### Update Your Project
1.  Open the `.env` file in your project folder.
2.  Paste your connection string.
3.  Replace `<password>` with your actual password.
    *   Example: `MONGO_URI=mongodb+srv://admin:MySecurePass123@cluster0.mongodb.net/touristID?retryWrites=true&w=majority`
4.  Save the file.

---

## Part 2: GitHub Setup (Hosting Code)

1.  **Create a Repository**:
    *   Go to [GitHub](https://github.com/new).
    *   Name your repository (e.g., `tourist-safety-portal`).
    *   Keep it **Public** or **Private**.
    *   **Do NOT** initialize with README, .gitignore, or License (we already have them).
    *   Click **Create repository**.

2.  **Push Your Code**:
    Open your terminal (VS Code) and run these commands one by one:

    ```bash
    git init
    git add .
    git commit -m "Initial commit - Tourist Safety Portal"
    git branch -M main
    git remote add origin https://github.com/<YOUR_USERNAME>/tourist-safety-portal.git
    git push -u origin main
    ```
    *(Replace `<YOUR_USERNAME>` with your actual GitHub username)*

## Troubleshooting: Wrong GitHub Account?
If this computer is already logged in as someone else (or you see "Permission denied"):

1.  **Set your identity for THIS project only**:
    Run these commands in the terminal:
    ```bash
    git config user.name "2403a53030-cyber"
    git config user.email "2403a53030@sru.edu.in"
    ```

2.  **Clear old credentials**:
    If it tries to push as the other user and fails:
    *   Open **Start Menu** -> Search **"Credential Manager"**.
    *   Click **Windows Credentials**.
    *   Look for `git:https://github.com`.
    *   **Remove** it.
    *   Try `git push -u origin main` again -> It will ask you to sign in.

## Part 3: Verify
1.  Run `npm start` in your terminal.
2.  You should see: `✅ MongoDB Connected`.
3.  Your code is now safe on GitHub and connected to a real online database!
