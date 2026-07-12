# TransitOps — Smart Transport Operations Platform

A production-ready Fleet ERP system built for hackathons and real-world transport operations.

---

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** — [Download](https://nodejs.org)
- Internet connection (for Neon PostgreSQL cloud DB)

### One-Click Setup
```bat
# Windows: Double-click setup.bat OR run in terminal:
setup.bat
```

This will:
1. Install server dependencies  
2. Generate Prisma client  
3. Push schema to Neon cloud DB  
4. Seed the database with demo data  
5. Install client dependencies  

### Start the Application
```bat
# Windows: Double-click start.bat OR:
start.bat
```
- **Server** runs on: http://localhost:5000
- **Client** runs on: http://localhost:5173

---

## 🔐 Login Credentials

All accounts use password: **`password123`**

| Email | Role | Access |
|-------|------|--------|
| admin@transitops.com | Admin | Full CRUD everything |
| fleet@transitops.com | Fleet Manager | Fleet, Maintenance, Analytics |
| dispatch@transitops.com | Dispatcher | Trips, Drivers (view), Fleet (view) |
| safety@transitops.com | Safety Officer | Drivers, Dashboard |
| finance@transitops.com | Financial Analyst | Fuel, Expenses, Analytics, Finance |

---

## 📁 Project Structure

```
TransitOps/
├── client/          # React 19 + Vite + Tailwind v4 frontend
│   ├── src/
│   │   ├── pages/        # 8 full-featured pages
│   │   ├── components/   # DataTable, StatusBadge, KpiCard, etc.
│   │   ├── services/     # API layer (axios)
│   │   ├── hooks/        # useAuth, usePermission, useDebounce, etc.
│   │   ├── context/      # AuthContext, ThemeContext
│   │   └── constants/    # RBAC_MAP, ROLES, VEHICLE_TYPES, etc.
│   └── requirements.txt  # Client dependency list
│
├── server/          # Express 5 + Prisma + PostgreSQL backend
│   ├── src/
│   │   ├── routes/       # 9 route files
│   │   ├── controllers/  # Thin controllers
│   │   ├── services/     # Business logic
│   │   ├── middleware/   # auth, validate, authorize, errorHandler
│   │   └── validators/   # Zod schemas for all routes
│   ├── prisma/
│   │   ├── schema.prisma # Full database schema
│   │   └── seed.js       # Demo data seeder
│   └── requirements.txt  # Server dependency list
│
├── setup.bat        # One-click setup script
└── start.bat        # One-click start script
```

---

## 🗄️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Tailwind CSS v4 |
| UI Components | shadcn/ui + Radix UI |
| State | TanStack Query v5 |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Animation | Framer Motion |
| Notifications | Sonner |
| Backend | Express 5 (CommonJS) |
| ORM | Prisma 5 |
| Database | PostgreSQL (Neon cloud) |
| Auth | JWT (access + refresh token rotation) |
| Validation | Zod (server-side) |
| AI Copilot | Google Gemini API |

---

## 🔌 API Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| POST | `/api/v1/auth/login` | Login |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/logout` | Logout |
| GET | `/api/v1/auth/me` | Get current user |
| GET/POST | `/api/v1/vehicles` | List/Create vehicles |
| GET/PUT | `/api/v1/vehicles/:id` | Get/Update vehicle |
| PATCH | `/api/v1/vehicles/:id/retire` | Retire vehicle |
| GET/POST | `/api/v1/drivers` | List/Create drivers |
| PATCH | `/api/v1/drivers/:id/status` | Update driver status |
| GET/POST | `/api/v1/trips` | List/Create trips |
| PATCH | `/api/v1/trips/:id/dispatch` | Dispatch trip |
| PATCH | `/api/v1/trips/:id/complete` | Complete trip |
| PATCH | `/api/v1/trips/:id/cancel` | Cancel trip |
| GET/POST | `/api/v1/maintenance` | List/Create maintenance |
| PATCH | `/api/v1/maintenance/:id/close` | Close maintenance |
| GET/POST | `/api/v1/fuel-logs` | List/Create fuel logs |
| GET/POST | `/api/v1/expenses` | List/Create expenses |
| GET | `/api/v1/expenses/totals` | Operational cost totals |
| GET | `/api/v1/dashboard` | Dashboard KPIs |
| GET | `/api/v1/analytics` | Full analytics data |
| GET | `/api/v1/analytics/export.csv` | Export CSV |
| POST | `/api/v1/copilot/query` | AI Fleet Copilot |

---

## 🛡️ RBAC (Role-Based Access Control)

| Module | Admin | Fleet Mgr | Dispatcher | Safety Off. | Financial |
|--------|-------|-----------|------------|-------------|-----------|
| Dashboard | ✓ Full | ✓ Full | ✓ Full | View | View |
| Fleet | ✓ Full | ✓ Full | View | — | View |
| Drivers | ✓ Full | — | View | ✓ Full | — |
| Trips | ✓ Full | — | ✓ Full | — | View |
| Maintenance | ✓ Full | ✓ Full | — | — | View |
| Fuel & Expenses | ✓ Full | — | — | — | ✓ Full |
| Analytics | ✓ Full | ✓ Full | — | — | ✓ Full |
| Settings | ✓ Full | — | — | — | — |

---

## 🔧 Manual Setup (if setup.bat fails)

```bash
# Server
cd server
npm install
npx prisma generate
npx prisma db push
node prisma/seed.js
npm run dev

# Client (separate terminal)
cd client
npm install
npm run dev
```
