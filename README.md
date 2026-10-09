# NexLink 🔗 - Full-Stack URL Shortener & Analytics Platform

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Deployed-black?logo=vercel)](https://katomaran-url-shortener-nexlink.vercel.app)
[![Node.js](https://img.shields.io/badge/Node.js-v18+-green?logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-green?logo=mongodb)](https://www.mongodb.com/)

> NexLink is a full-stack URL shortening and analytics platform built with React, TypeScript, Express, and MongoDB. Users can create custom short links, track real-time click analytics, generate customizable QR codes, import/export CSV data, and manage links through a responsive, modern dashboard.

---

## 🌐 Live Demo & Links

- **Live Application:** [https://katomaran-url-shortener-nexlink.vercel.app](https://katomaran-url-shortener-nexlink.vercel.app)
- **Demo Video:** [Google Drive Demo](https://drive.google.com/file/d/19TKngF2EoZhTSSs583diyCoGwqqHamcH/view?usp=sharing)
- **Hackathon Host:** Developed as part of a hackathon run by [Katomaran](https://katomaran.com)

---

## 📌 Project Overview

NexLink provides an end-to-end URL management platform with enterprise-level features. The backend is a JWT-authenticated REST API with role/user isolation; the frontend is a file-routed React SPA. Every redirect is handled server-side with sequential security checks (expiry verification → click limit checks → password protection gate) before issuing a `302` redirect and recording detailed visit metrics.

### Key Highlights
- **Smart Redirects:** Fast server-side redirects with security enforcement.
- **Real-Time Analytics:** Visual tracking for traffic volume, device breakdown, browser share, and geographic distribution.
- **Dynamic QR Codes:** Instant PNG and SVG QR code generation with download and share capabilities.
- **Bulk Operations:** CSV import for batch link generation and CSV export for analytics.
- **Security & Access Control:** Password-protected links, expiration timestamps, and click throttling.

---

## ✨ Features

### Core Capabilities
- **User Authentication:** JWT session management, secure signup/login with bcrypt hashing, and password recovery.
- **URL Shortening & Custom Aliases:** Generate compact 6-character alphanumeric aliases (`nanoid`) or define customized slugs.
- **Link Protection:** Set password gates, custom expiration dates, and maximum allowed clicks.
- **Interactive Analytics Dashboard:** Real-time metrics with Recharts (Area, Bar, and Pie charts), device breakdown, browser breakdown, and UTM parameter capture.
- **QR Code Studio:** High-resolution QR code rendering with canvas/SVG export options.
- **Data Management:** Bulk CSV import, link inventory export, and detailed per-link analytics export.
- **Search & Filters:** Search by tag, shortcode, or destination with status filtering (Active, Expired, Favorites, Archived).
- **Email Verification & Password Reset:** 6-digit verification codes via Nodemailer SMTP with console fallback for local testing.

### Bonus Features
- **UTM Parameter Tracking:** Captures `utm_source`, `utm_medium`, `utm_campaign` on every redirect.
- **Global Search Palette (`Cmd+K` / `Ctrl+K`):** Quick command bar for rapid navigation and link lookups.
- **Live Auto-Refresh:** Optional 10-second polling interval for dashboard live updates.
- **Rate-Limited Endpoints:** In-memory request throttling for sensitive routes (e.g. forgot password).

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend Framework** | React 18, TypeScript, Vite | Modern, high-performance SPA client |
| **Routing & State** | TanStack Router, TanStack Query | Type-safe file routing and server-state caching |
| **UI Components** | Radix UI, Tailwind CSS, Framer Motion | Accessible UI primitives and fluid animations |
| **Data Visualization** | Recharts | Charts for traffic, devices, and browser metrics |
| **QR Engine** | `qrcode` | Vector (SVG) and raster (PNG) QR rendering |
| **Backend Framework** | Node.js, Express.js 4 | RESTful API server and redirect controller |
| **Database & ORM** | MongoDB, Mongoose ODM | Flexible document storage and schemas |
| **Authentication** | JWT (`jsonwebtoken`), bcryptjs | Stateless auth tokens and password hashing |
| **Email Service** | Nodemailer | SMTP dispatch with dev console fallback |
| **Utilities** | `nanoid`, `validator` | Unique slug generation and input validation |

---

## 📐 Architecture

```text
┌────────────────────────────────────────────────────────┐
│             React SPA (Vite / Port 5173)               │
│   TanStack Router  •  TanStack Query  •  shadcn/ui     │
│   Recharts         •  qrcode          •  Tailwind CSS  │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP REST (Bearer JWT)
                            ▼
┌────────────────────────────────────────────────────────┐
│             Express Server (Port 5000)                 │
│   CORS  •  JSON Parser  •  Auth Middleware             │
│   /api/auth  •  /api/urls  •  /api/analytics           │
│   /r/:shortCode (302 Redirect + Analytics Tracker)     │
└───────────────────────────┬────────────────────────────┘
                            │ Mongoose ODM
                            ▼
┌────────────────────────────────────────────────────────┐
│                     MongoDB                            │
│           users  •  urls  •  visits                    │
└────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Models

- **User:** Stores authentication credentials, email verification status, password reset tokens, and workspace preferences.
- **URL:** Stores the destination URL, short code, custom alias, expiry timestamp, click limit, optional password hash, tags, and favorite/archive flags.
- **Visit:** Records per-redirect telemetry including timestamp, IP address, browser, operating system, approximate location, referrer, and UTM parameters.

---

## 📂 Project Structure

```text
katomaran-url-shortener-Nexlink/
├── backend/
│   ├── config/          # MongoDB connection and setup
│   ├── controllers/     # Auth, URL, and Analytics controllers
│   ├── middleware/      # JWT auth guard and error handling
│   ├── models/          # User, URL, and Visit Mongoose schemas
│   ├── routes/          # Express route definitions
│   ├── utils/           # Helper functions (code generation, email, etc.)
│   └── server.js        # Backend server entry point
├── frontend/
│   ├── src/
│   │   ├── components/  # UI components, modals, and charts
│   │   ├── hooks/       # Custom hooks (auth, query hooks)
│   │   ├── lib/         # API client and helper functions
│   │   └── routes/      # TanStack file-based routes
│   ├── index.html       # Vite entry HTML
│   └── vite.config.ts   # Vite configuration
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js:** v18.0.0 or higher
- **MongoDB:** Local instance on `mongodb://127.0.0.1:27017` or a remote MongoDB Atlas URI

### 1. Clone the Repository
```bash
git clone https://github.com/gowsicMS45/katomaran-url-shortener-Nexlink.git
cd katomaran-url-shortener-Nexlink
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env   # Configure environment variables
npm run dev            # Starts backend on http://localhost:5000
```

> **Note on Email in Development:** If SMTP credentials are not configured, verification and password reset codes are printed to the backend console (search for `[VERIFICATION CODE LOG]` and `[PASSWORD RESET LOG]`).

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev            # Starts frontend on http://localhost:5173
```

---

## 🔐 Environment Variables

Refer to `backend/.env.example` for all configurable environment variables. Do not commit actual `.env` files.

Key environment variables:
- `PORT`: Server port (default: `5000`)
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for signing JWT tokens
- `FRONTEND_URL`: URL of the frontend application (for CORS)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`: Optional email server configuration

---

## ☁️ Deployment Guide

### Backend (Railway / Render)
1. Link your repository and set the **Root Directory** to `backend`.
2. Configure all environment variables from `backend/.env.example` (set `NODE_ENV=production` and `MONGODB_URI` to MongoDB Atlas).
3. Deploy the service to get a public HTTPS endpoint.

### Frontend (Vercel)
1. Import the repository and set the **Root Directory** to `frontend` with the **Vite** preset.
2. Set the `API_BASE_URL` in `frontend/src/lib/api.ts` (or environment variable) to the deployed backend URL.
3. Configure `vercel.json` for SPA rewrites:
   ```json
   {
     "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
   }
   ```
4. Deploy.

---

## 🤖 AI Planning & Engineering Workflow

AI assistance was utilized during:
- Initial architectural design and modular decoupling.
- Component scaffolding and TypeScript interface modeling.
- Error-handling logic and test scenario validation.
All generated code was thoroughly reviewed, refined, and tested for production readiness.

---

## 👤 Author

**Gowsic M S**  
- GitHub: [@gowsicMS45](https://github.com/gowsicMS45)
- Portfolio: [https://gowsic-s-digital-canvas-main.vercel.app](https://gowsic-s-digital-canvas-main.vercel.app)
