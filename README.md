<div align="center">
  
# 🚀 AI LinkedIn Profile Reviewer

**A comprehensive, production-ready AI application that analyzes, scores, and optimizes LinkedIn profiles in real-time.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Active-brightgreen?style=for-the-badge&logo=vercel&logoColor=white)](https://ai-linked-in-profile-reviewer.vercel.app/)

[![Frontend](https://img.shields.io/badge/Frontend-React%20%7C%20Vite%20%7C%20Tailwind-blue?logo=react&logoColor=white)](#-frontend-setup-vite--react)
[![Backend](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Python-green?logo=fastapi&logoColor=white)](#-backend-setup-fastapi)
[![Auth](https://img.shields.io/badge/Auth-Firebase-orange?logo=firebase&logoColor=white)](#-step-1-firebase-project-setup)

</div>

---

## 🌐 Live Demo

- **Web Application:** [https://ai-linked-in-profile-reviewer.vercel.app/](https://ai-linked-in-profile-reviewer.vercel.app/)

---

## 🌟 Overview

The **AI LinkedIn Profile Reviewer** is a full-stack platform where users can paste their LinkedIn profile details (Headline, About section, Work Experience, and Skills) or upload their resume to receive:
- 📈 **SEO Graded Search Rankings & Dashboards**
- ✍️ **Professional Optimization Reviews**
- 💡 **Copy-and-Paste Headline Improvements**
- 🔍 **In-depth Skills Gap Analysis**
- 📄 **Resume ATS Parsing & Career Roadmaps**

---

## 🏗️ Folder Structure

```text
/
├── frontend/               # Vite + React (TypeScript/JavaScript) + Tailwind CSS + Framer Motion
│   ├── src/
│   │   ├── components/     # UI Components (Navbar, SeoGauge, etc.)
│   │   ├── hooks/          # Custom hooks (e.g., useAuth for Firebase)
│   │   ├── lib/            # API wrappers and Firebase client configuration
│   │   └── pages/          # Landing, Auth, Dashboard, History views
│   ├── .env.example        # Client environment template
│   └── package.json
│
├── backend/                # Python 3.13 + FastAPI + Groq SDK + Firebase Admin
│   ├── app/
│   │   ├── core/           # Auth logic, config settings, rate limiting
│   │   ├── models/         # Pydantic validation schemas
│   │   ├── routers/        # API Endpoints (analyze, headline, skills, seo)
│   │   ├── services/       # Groq client proxy, prompt builders, SEO algorithms
│   │   └── main.py         # FastAPI application entry point
│   ├── .env.example        # Backend environment template
│   └── requirements.txt
│
└── README.md               # You are here!
```

---

## 🚀 Getting Started

Follow these instructions to set up the project locally.

### 🛠️ Step 1: Firebase Project Setup

To run this application securely, you must configure a Firebase project for authentication and database services.

1. Go to the [Firebase Console](https://console.firebase.google.com/) and click **Add Project**. Name it `ai-linkedin-profile-reviewer`.
2. **Enable Authentication:**
   - Navigate to **Build > Authentication** and click **Get Started**.
   - Under **Sign-in Method**, enable **Email/Password**.
   - Click **Add new provider**, enable **Google**, configure your support email, and save.
3. **Enable Firestore Database:**
   - Navigate to **Build > Firestore Database** and click **Create Database**.
   - Choose your location, select **Start in production mode** (or test mode), and click **Create**.
4. **Get Client App Configuration (Frontend):**
   - Go to **Project Settings** (gear icon next to Project Overview).
   - In the **General** tab, scroll down to *Your Apps* and register a new **Web App** (`</>`).
   - Copy the configuration JSON (`firebaseConfig`) to place in `frontend/.env`.
5. **Get Service Account Key (Backend):**
   - In **Project Settings**, go to the **Service Accounts** tab.
   - Click **Generate New Private Key**.
   - Save the downloaded JSON file as `firebase-service-account.json` inside the `/backend` folder.

---

### 🐍 Step 2: Backend Setup (FastAPI)

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```
2. **Create and activate a virtual environment:**
   ```bash
   python -m venv venv
   # On Windows (PowerShell):
   .\venv\Scripts\Activate.ps1
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
4. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and fill in:
   - `GROQ_API_KEY`: Your Groq API key from [Groq Console](https://console.groq.com).
   - `FIREBASE_SERVICE_ACCOUNT_PATH`: E.g., `firebase-service-account.json`.
   - `GEMINI_API_KEY`: *(Optional fallback)* Gemini key from Google AI Studio.
5. **Run the development server:**
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   > 💡 *Interactive API documentation is available at [http://localhost:8000/docs](http://localhost:8000/docs)*

---

### 💻 Step 3: Frontend Setup (Vite + React)

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   Populate `.env` with your Firebase config keys and the backend URL:
   ```env
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   VITE_FIREBASE_MEASUREMENT_ID=...
   
   VITE_API_BASE_URL=http://localhost:8000
   ```
4. **Start the frontend application:**
   ```bash
   npm run dev
   ```
   > 💡 *The app will be running at [http://localhost:5173](http://localhost:5173)*

---

## ☁️ Deployment Guide

### Backend (Render / Railway / Heroku)
1. Create a Web Service pointing to your backend folder.
2. Set the Environment variables corresponding to `.env`.
3. Configure the **Build Command**:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure the **Start Command**:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```

### Frontend (Vercel / Netlify)
1. Connect your GitHub repository to Vercel.
2. Define the production environment variables (your `VITE_` keys) in the platform settings. Ensure `VITE_API_BASE_URL` points to your deployed backend URL.
3. *Vercel Specific*: To support React Router path handling, create a `vercel.json` in the `/frontend` directory:
   ```json
   {
     "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
   }
   ```
