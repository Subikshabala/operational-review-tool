# 🎓 College Academic Review System

A full-stack web application for colleges to track, review, and manage academic performance metrics across departments — with role-based access, automated status calculation, and audit logging.

---

## 📌 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [API Reference](#api-reference)
- [User Roles](#user-roles)
- [How It Works](#how-it-works)
- [Screenshots](#screenshots)

---

## Overview

Colleges traditionally track academic performance manually using spreadsheets — data gets scattered, comparisons are hard, and accountability is low. This system solves that by providing a **centralized digital platform** where:

- Admins configure performance targets
- Faculty enter actual values each review period
- The system auto-flags performance as 🟢 Green / 🟡 Yellow / 🔴 Red
- HODs review results and assign corrective tasks
- Dashboards show trends and analytics over time

---

## Features

- 🔐 **JWT Authentication** with secure login/logout
- 👥 **4 Role Levels** — Admin, HOD, Faculty, Student
- 📊 **Performance Metrics** with configurable targets and thresholds
- 🗓️ **Review Sessions** — monthly/quarterly/semesterly cycles
- 🚦 **Auto Status Calculation** — Green / Yellow / Red based on actual vs target
- ✅ **Task Management** — assign and track corrective actions
- 📈 **Analytics Dashboard** — charts and KPI summaries
- 🔒 **Session Locking** — submitted sessions cannot be edited
- 🏫 **College Isolation** — multi-college support, data never crosses
- 📋 **Audit Log** — every action is logged with user, timestamp, and IP

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js, Zustand, Recharts, Axios |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| Auth | JWT (JSON Web Tokens) |
| Styling | Custom CSS (Dark Theme) |
| Security | Helmet, CORS, Rate Limiting, bcrypt |

---

## Project Structure

```
college-review/
├── backend/
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── membersController.js
│   │   ├── reviewItemsController.js
│   │   ├── sessionsController.js
│   │   ├── actionItemsController.js
│   │   └── analyticsController.js
│   ├── db/
│   │   ├── pool.js
│   │   └── schema.sql
│   ├── middleware/
│   │   ├── auth.js
│   │   └── errorHandler.js
│   ├── routes/
│   │   └── index.js
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   └── Layout.jsx
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   ├── RegisterPage.jsx
    │   │   ├── DashboardPage.jsx
    │   │   ├── MetricsPage.jsx
    │   │   ├── SessionsPage.jsx
    │   │   ├── SessionDetailPage.jsx
    │   │   ├── MembersPage.jsx
    │   │   ├── TasksPage.jsx
    │   │   └── AuditLogPage.jsx
    │   ├── services/
    │   │   └── api.js
    │   ├── store/
    │   │   └── authStore.js
    │   ├── App.jsx
    │   ├── index.js
    │   └── index.css
    ├── .env
    ├── .env.example
    └── package.json
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- PostgreSQL v14+
- npm or yarn

### 1. Clone the repository

```bash
git clone https://github.com/your-username/college-review-system.git
cd college-review-system
```

### 2. Set up the database

```bash
# Create the database
psql -U postgres -c "CREATE DATABASE college_review;"

# Load the schema
psql -U postgres -d college_review -f backend/db/schema.sql

# Fix: add missing updated_at column to review_entries
psql -U postgres -d college_review -c \
  "ALTER TABLE review_entries ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();"
```

> **Linux users:** If you get a peer authentication error, use:
> `sudo -u postgres psql -d college_review -f backend/db/schema.sql`

### 3. Configure environment variables

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env and set your DB_PASSWORD and JWT_SECRET

# Frontend
cp frontend/.env.example frontend/.env
# Verify REACT_APP_API_URL=http://localhost:5000/api
```

### 4. Install dependencies and run

**Terminal 1 — Backend:**
```bash
cd backend
npm install
npm run dev
# ✅ Server running on http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm install
npm start
# ✅ App opens at http://localhost:3000
```

### 5. Register your college

Go to `http://localhost:3000/register` and create your college + admin account.

> ⚠️ The Register page is **one-time only**. It creates a new college + admin user. To add more users, use the **Members** page inside the app after logging in.

---

## Environment Variables

### Backend (`backend/.env`)

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=college_review
DB_USER=postgres
DB_PASSWORD=your_postgres_password

PORT=5000
FRONTEND_URL=http://localhost:3000

JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=24h
```

### Frontend (`frontend/.env`)

```env
REACT_APP_API_URL=http://localhost:5000/api
```

---

## Database Setup

The system uses **7 PostgreSQL tables**:

| Table | Description |
|-------|-------------|
| `colleges` | College records (name, code) |
| `users` | All users with role and college linkage |
| `review_items` | Performance metrics with targets and thresholds |
| `review_sessions` | Review periods (monthly, quarterly, etc.) |
| `review_entries` | Actual values entered per metric per session |
| `action_items` | Tasks assigned to fix underperforming areas |
| `audit_logs` | Immutable log of all system actions |

---

## API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create college + admin |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get current user profile |

### Members
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/members` | List all college members |
| POST | `/api/members` | Add new member |
| PUT | `/api/members/:id` | Update member |
| DELETE | `/api/members/:id` | Remove member |

### Metrics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/metrics` | List all performance metrics |
| POST | `/api/metrics` | Create new metric |
| PUT | `/api/metrics/:id` | Update metric |
| DELETE | `/api/metrics/:id` | Delete metric |

### Sessions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sessions` | List all review sessions |
| POST | `/api/sessions` | Create new session |
| GET | `/api/sessions/:id` | Get session detail with entries |
| PUT | `/api/sessions/:id/entries` | Save/update a metric entry |
| POST | `/api/sessions/:id/submit` | Submit and lock session |
| DELETE | `/api/sessions/:id` | Delete draft session |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | List all tasks |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/dashboard` | Dashboard KPIs and charts |
| GET | `/api/analytics/audit-log` | Full audit history |

---

## User Roles

| Role | Access |
|------|--------|
| **Admin** | Full access — manage college, users, metrics, sessions, tasks |
| **HOD** | Manage metrics, create/submit sessions, assign tasks |
| **Faculty** | Enter review data, create tasks |
| **Student** | View-only — dashboards and reports |

### Adding Users

1. Log in as **Admin**
2. Go to **Faculty & Staff** → click **+ Add Member**
3. Set their name, email, password, role, and department
4. They log in at `/login` with their email and password

> Do **not** use the `/register` page to add more users — that creates an entirely new college.

---

## How It Works

### Status Auto-Calculation

When a faculty member enters an actual value for a metric, the system automatically calculates a performance status:

**For `higher_better` metrics** (e.g. pass rate, placement %):
```
percentage = (actual / target) × 100
```

**For `lower_better` metrics** (e.g. dropout rate, complaints):
```
percentage = ((2 × target − actual) / target) × 100
```

**Status thresholds** (configurable per metric):
```
percentage ≥ warning_threshold (default 80%)  → 🟢 Green
percentage ≥ critical_threshold (default 60%) → 🟡 Yellow
percentage <  critical_threshold              → 🔴 Red
```

### Review Workflow

```
1. Admin creates Performance Metrics with targets
        ↓
2. HOD/Faculty creates a Review Session (monthly/quarterly)
        ↓
3. Faculty enters actual values for each metric
        ↓
4. System auto-calculates Green/Yellow/Red status
        ↓
5. HOD reviews and assigns Tasks for Red/Yellow items
        ↓
6. HOD submits the session (locks it permanently)
        ↓
7. Dashboard shows trends and analytics over time
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `Peer authentication failed` | Use `sudo -u postgres psql` or set a password with `-h localhost` |
| `Data not saving` | Check `backend/.env` has the correct `DB_PASSWORD` |
| `CORS error` | Make sure `FRONTEND_URL=http://localhost:3000` in backend `.env` |
| `Token expired` | Log out and log back in |
| `Tables don't exist` | Run `schema.sql` against the database |
| `updated_at column missing` | Run the `ALTER TABLE` fix in Getting Started step 2 |

---

## License

MIT License — free to use, modify, and distribute.

---

> Built with ❤️ for academic institutions to make performance reviews transparent, data-driven, and accountable.
