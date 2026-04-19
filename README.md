# 🎓 Academic Performance Review & Strategic Monitoring System

An enterprise-grade, full-stack operational review solution designed for higher education institutions. This platform facilitates data-driven academic management through performance metric tracking, automated status assessments, and scalable task-based corrective actions.

---

## 📌 Table of Contents

- [Core Objectives](#core-objectives)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Advanced Functionality](#advanced-functionality)
- [Getting Started](#getting-started)
- [System Configuration](#system-configuration)
- [Data Model](#data-model)
- [API Documentation](#api-documentation)
- [Governance & Roles](#governance--roles)

---

## Core Objectives

Educational institutions often struggle with fragmented academic performance data. This system centralizes institutional oversight by:
- **Standardizing Metrics**: Defining clear Key Performance Indicators (KPIs) with institutional targets.
- **Automated Monitoring**: Utilizing real-time status calculation (🟢/🟡/🔴) based on predefined thresholds.
- **Enhanced Accountability**: Providing immutable audit trails for every administrative and academic action.
- **Strategic Intervention**: Enabling rapid, scalable task distribution to address performance gaps.

---

## Key Features

- 🔐 **Institutional Security**: JWT-based authentication with university-level data isolation.
- 📂 **Bulk User Provisioning**: Automated student and faculty onboarding via Excel (XLSX/CSV) processing.
- 🚀 **Scalable Task Assignment**: High-performance distribution of corrective actions using optimized database batch operations.
- 📊 **Dynamic Analytics**: Visualized KPIs via interactive charts and departmental performance summaries.
- 🔒 **Integrity Controls**: Structural session locking upon submission to ensure historical data consistency.
- 📋 **Comprehensive Auditing**: Granular event logging including IP tracking, user context, and record-level changes.

---

## Advanced Functionality

### 📡 High-Scale Task Distribution
The platform leverages optimized SQL `INSERT ... SELECT` architecture to facilitate institutional-grade scalability. Admins can target thousands of recipients simultaneously based on:
- **Multi-Role Filtering**: Combinations of HODs, Faculty, and Students.
- **Multi-Department Scoping**: Cross-departmental task distribution.
- **Student-Specific Ranges**: Targeting by Roll Number identifiers for precise academic intervention.

### 📥 Automated Member Onboarding
The system integrates an Excel parsing engine that allows for rapid provisioning of academic staff and students. 
- Supported formats: `.xlsx`, `.xls`, `.csv`
- Validation logic ensures data integrity for required fields (Name, Email, Role, Department).

---

## System Architecture

| Component | Technology |
|-------|-----------|
| **Frontend** | React.js (Single Page Application) |
| **State Management** | Zustand |
| **Backend** | Node.js (Express Framework) |
| **Database** | PostgreSQL (Relational) |
| **Authentication** | JSON Web Tokens (JWT) |
| **Data Processing** | XLSX Library, Multer |

---

## Getting Started

### Prerequisites
- Node.js (v18.0.0 or higher)
- PostgreSQL (v14.0 or higher)
- npm or yarn package manager

### Installation

1. **Repository Setup**
   ```bash
   git clone https://github.com/your-username/college-review-system.git
   cd college-review-system
   ```

2. **Database Initialization**
   ```bash
   # Create database environment
   psql -U postgres -c "CREATE DATABASE college_review;"

   # Deploy schema
   psql -U postgres -d college_review -f backend/db/schema.sql
   ```

3. **Environment Configuration**
   Configure `.env` files in both `/backend` and `/frontend` directories. Refer to `Environment Variables` section for specific keys.

4. **Bootstrapping**
   **Backend:**
   ```bash
   cd backend && npm install && npm run dev
   ```
   **Frontend:**
   ```bash
   cd frontend && npm install && npm start
   ```

---

## System Configuration

### Backend Environment Variables (`backend/.env`)
| Variable | Description |
|----------|-------------|
| `DB_PASSWORD` | PostgreSQL user password |
| `JWT_SECRET` | Primary security key for token signing |
| `PORT` | Local server port (Default: 5000) |
| `FRONTEND_URL` | Trusted origin for CORS policy |

---

## Governance & Roles

| Role | Operational Scope |
|------|-------------------|
| **System Administrator** | College configuration, institutional settings, and global metrics management. |
| **HOD (Head of Dept)** | Departmental review session oversight, bulk task creation, and performance analysis. |
| **Faculty Member** | Data entry for assigned metrics and localized corrective task management. |
| **Student** | Read-only access to relevant dashboards and assigned academic intervention tasks. |

---

## API Documentation

### Core Endpoints

| Resource | Methods | Primary Usage |
|----------|---------|---------------|
| **/api/auth** | `POST` | User authentication and institutional registration. |
| **/api/members** | `GET, POST, PUT` | User management and **Bulk Upload** operations. |
| **/api/sessions** | `GET, POST, PUT` | Performance review cycle management and status locking. |
| **/api/tasks** | `GET, POST, PUT` | **Scalable distribution** of corrective actions. |
| **/api/analytics** | `GET` | Aggregated reporting and **Audit Trail** access. |

---

## License
Distributed under the MIT License. See `LICENSE` for more information.

---
*Developed with a commitment to academic excellence and institutional transparency.*
