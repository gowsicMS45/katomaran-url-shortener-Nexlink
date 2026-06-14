# NexLink 🚀

> NexLink is a full-stack URL shortening and analytics platform built with React, TypeScript, Express, and MongoDB. Users can create short links, track click analytics, generate QR codes, import/export CSV data, and manage links through a responsive dashboard.

---

## 📖 Project Overview

NexLink is a full-stack URL shortening and analytics platform built with React, TypeScript, Express, and MongoDB. Users can create short links, track click analytics, generate QR codes, import/export CSV data, and manage links through a responsive dashboard. The backend is a JWT-authenticated REST API; the frontend is a file-routed React SPA. Every redirect is handled server-side with sequential security checks (expiry → click limit → password gate) before issuing a `302` and recording a visit.

---

## 🎯 Demo Highlights

- Create and manage shortened URLs
- Track click analytics in real-time
- Generate and download QR codes
- Import and export URLs using CSV
- Secure links with passwords, expiry dates, and click limits
- View browser, device, and traffic analytics

---

## 📋 AI Planning Document

### Requirement Analysis
Core requirements were identified: URL shortening with analytics, QR code generation, CSV import/export, and JWT-based authentication with email verification and password reset.

### Architecture Planning
A decoupled client-server architecture was chosen. The React SPA communicates with the Express API over JWT-authenticated HTTP. TanStack Router handles file-based, JWT-guarded routing; TanStack Query manages all API state.

### Database Design
Three MongoDB collections were designed: `users` for authentication and preferences, `urls` for link metadata, and `visits` for per-redirect analytics records.

### Development Workflow
Backend controllers were built first (auth → URLs → analytics), then frontend pages were wired up. Email flows were added last with a console fallback so the app works without SMTP configured.

---

## ✨ Features

### Core Features
- User Authentication (signup, login, JWT session)
- URL Shortening with Custom Alias
- Password Protected Links
- Expiry Dates & Click Limits
- Analytics Dashboard (traffic, devices, browsers, geography, heatmap)
- QR Code Generation (PNG & SVG download, print, share)
- CSV Import & Export (bulk link import, link list export, per-link analytics export)
- Search & Filters (by tag, shortcode, destination; filter active / expired / favorites / archived)
- Email Verification & Password Reset (6-digit codes via SMTP or console fallback)
- Favorites / Bookmarks & Archive

### Bonus Features
- UTM Parameter Capture on every redirect
- Global Search Palette (⌘K)
- Auto-Refresh Dashboard (10 s interval)
- Marketing Landing Page with pricing, FAQ, and feature sections
- Rate-limited forgot-password endpoint (5 requests / IP / hour)

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, TanStack Router, TanStack Query |
| UI | shadcn/ui (Radix primitives), Tailwind CSS, Framer Motion |
| Charts | Recharts (AreaChart, BarChart, PieChart) |
| QR | `qrcode` npm package (canvas + SVG) |
| Backend | Node.js, Express 4 |
| Database | MongoDB, Mongoose |
| Auth | JWT (`jsonwebtoken`), bcrypt (`bcryptjs`) |
| Email | Nodemailer (SMTP or console fallback) |
| Short codes | `nanoid` — 6-character alphanumeric |
| Validation | `validator` npm package |

---

## 📐 Architecture Diagram

```
┌────────────────────────────────────┐
│    React SPA  (Vite / port 5173)   │
│  TanStack Router · TanStack Query  │
│  shadcn/ui · Recharts · qrcode     │
└─────────────────┬──────────────────┘
                  │  HTTP REST  (Bearer JWT)
                  ▼
┌────────────────────────────────────┐
│   Express Server  (port 5000)      │
│  cors → json → protect → routes   │
│  /api/auth  /api/urls  /api/analytics │
│  /r/:shortCode  (redirect)        │
└─────────────────┬──────────────────┘
                  │  Mongoose ODM
                  ▼
┌────────────────────────────────────┐
│   MongoDB  (users · urls · visits) │
└────────────────────────────────────┘
```

---

## 🗄️ Database Overview

**User** — Stores authentication credentials, email verification state, password reset tokens, and workspace preferences.

**URL** — Stores the original destination, generated short code or custom alias, expiry date, click limit, optional password hash, tags, and favorite/archive flags.

**Visit** — Stores a per-redirect record of IP address, browser, device, country, referrer, and UTM parameters for analytics.

---

## 📡 API Overview

### Authentication
- Signup
- Login
- Email Verification
- Password Reset

### URL Management
- Create URL
- Edit URL
- Delete URL
- Search URL
- Export CSV

### Analytics
- Dashboard Analytics
- Link Analytics
- Analytics Export

---

## 🤖 AI Tools Used

AI assistance was used during planning, architecture design, component generation, debugging, and documentation. All generated code was reviewed, tested, and modified before integration into the final application.

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js v18+
- MongoDB running locally on `127.0.0.1:27017` (or a remote Atlas URI)

### Clone the Repository
```bash
git clone https://github.com/gowsicMS45/katomaran-url-shortener-Nexlink.git
cd katomaran-url-shortener-Nexlink
```

### Backend
```bash
cd backend
npm install
cp .env.example .env   # fill in values
npm run dev            # starts on http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install
npm run dev            # starts on http://localhost:5173
```

> **Email codes in development**: Without SMTP configured, verification and reset codes are printed to the backend console — search for `[VERIFICATION CODE LOG]` and `[PASSWORD RESET LOG]`.

---

## 🚀 Deployment

### Backend — Railway
1. Connect the GitHub repo → set **Root Directory** to `backend`.
2. Add all `backend/.env` variables; set `NODE_ENV=production` and point `MONGODB_URI` to Atlas.
3. Deploy — Railway exposes a public HTTPS URL.

### Frontend — Vercel
1. Import the repo → set **Framework** to `Vite`, **Root Directory** to `frontend`.
2. Update `API_BASE_URL` in `frontend/src/lib/api.ts` to the Railway backend URL.
3. Add a `vercel.json` for SPA routing:
   ```json
   { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
   ```
4. Deploy.

---

## 📝 Assumptions Made

1. **API URL is hardcoded** — `http://localhost:5000/api` in `frontend/src/lib/api.ts` must be updated before production deployment.
2. **Country data is approximate** — country is derived from the IP's last octet modulo 6, not a real GeoIP database.
3. **Email is optional** — if SMTP vars are absent, codes are printed to the server console; all features still work.
4. **Rate limiter is in-memory** — resets on server restart; not suitable for multi-instance deployments without Redis.
5. **No credential required for local MongoDB** — update the URI for any auth-protected or Atlas instance.

---

## ⚠️ Known Limitations

1. No pagination for large datasets.
2. Country analytics currently use approximate location mapping.
3. Email verification is not enforced before login.

---

## 🔮 Future Improvements

1. Replace hardcoded API URL with a Vite environment variable (`VITE_API_URL`).
2. Add server-side pagination to the link list endpoint.
3. Integrate a real GeoIP database (e.g. `geoip-lite` or MaxMind).
4. Replace the in-memory rate limiter with a Redis-backed store for horizontal scaling.
5. Enforce email verification before allowing link creation.
   ------
   DEMO VIDEO LINK
   https://drive.google.com/file/d/19TKngF2EoZhTSSs583diyCoGwqqHamcH/view?usp=sharing
   ----
DEPLOYED LINK 
https://nexlink-frontend.vercel.app/

This project is a part of a hackathon run by https://katomaran.com
