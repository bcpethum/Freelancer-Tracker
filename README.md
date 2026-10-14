# 💼 FreelanceTrack — Freelancer Project & Income Tracker

A full-stack web application for freelancers to manage clients, projects, payments, and income analytics — built with **React (Vite)**, **Node.js/Express**, and **MongoDB**.

---

## ✨ Features

### Core Features
- 🔐 **JWT Authentication** — Secure register/login with bcrypt password hashing
- 📊 **Dashboard** — Overview of active projects, total income, pending payments & charts
- 📁 **Projects** — Add, edit, delete projects with status, priority, fee tracking & progress bars
- 👥 **Clients** — Manage clients with contact details, earned stats & project counts
- 💰 **Payments** — Track income & payments with status (pending/received/overdue)
- 🔍 **Search & Filter** — Filter by status, client, project across all pages
- 📈 **Charts** — Bar, Area, Pie, and horizontal bar charts using Recharts
- ✅ **Form Validation** — Client-side + server-side validation with error messages
- 📱 **Responsive UI** — Mobile-friendly dark-mode design

### Optional Features (All Included)
- 📄 **Pagination** — All list pages support pagination
- 📥 **Export to CSV** — Download income reports as CSV
- 📥 **Export to PDF** — Download income reports & project invoices as PDF
- 🎨 **Premium UI** — Glassmorphism, gradient animations, micro-interactions

---

## 🛠️ Tech Stack

| Layer       | Technology                                   |
|------------|----------------------------------------------|
| Frontend   | React 19 + Vite, React Router v6, Recharts  |
| Styling    | Vanilla CSS (custom design system)           |
| HTTP       | Axios with JWT interceptors                  |
| Backend    | Node.js + Express.js                         |
| Database   | MongoDB + Mongoose                           |
| Auth       | JWT + bcryptjs                               |
| PDF Gen    | PDFKit                                       |
| Validation | express-validator                            |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+ 
- **MongoDB** (local instance or MongoDB Atlas)
- **Git**

### Installation

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd freelancer-tracker

# 2. Install all dependencies (root + backend + frontend)
npm run install:all

# 3. Configure environment
# Edit backend/.env with your MongoDB URI and JWT secret
```

### Environment Variables (`backend/.env`)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/freelancer_tracker
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

### Run the Application

```bash
# Run both frontend & backend simultaneously
npm run dev

# Or run individually:
npm run dev:backend   # Backend on http://localhost:5000
npm run dev:frontend  # Frontend on http://localhost:5173
```

---

## 📁 Project Structure

```
freelancer-tracker/
├── backend/
│   ├── middleware/
│   │   └── auth.js          # JWT protection middleware
│   ├── models/
│   │   ├── User.js          # User schema + bcrypt
│   │   ├── Client.js        # Client schema
│   │   ├── Project.js       # Project schema + virtuals
│   │   └── Payment.js       # Payment schema
│   ├── routes/
│   │   ├── auth.js          # Register, Login, Profile, Password
│   │   ├── clients.js       # CRUD + search/filter
│   │   ├── projects.js      # CRUD + search/filter
│   │   ├── payments.js      # CRUD + status sync
│   │   ├── dashboard.js     # Aggregated stats & charts
│   │   └── reports.js       # CSV, PDF, Invoice exports
│   ├── server.js
│   └── .env
│
└── frontend/
    └── src/
        ├── api/
        │   └── axios.js     # Axios instance + interceptors
        ├── context/
        │   └── AuthContext.jsx
        ├── components/
        │   └── layout/
        │       ├── AppLayout.jsx
        │       ├── Sidebar.jsx
        │       └── Topbar.jsx
        └── pages/
            ├── auth/
            │   ├── Login.jsx
            │   └── Register.jsx
            ├── Dashboard.jsx
            ├── Projects.jsx
            ├── Clients.jsx
            ├── Payments.jsx
            ├── Reports.jsx
            └── Profile.jsx
```

---

## 🔗 API Endpoints

| Method | Endpoint                        | Description           |
|--------|--------------------------------|-----------------------|
| POST   | `/api/auth/register`           | Register new user     |
| POST   | `/api/auth/login`              | Login                 |
| GET    | `/api/auth/me`                 | Get current user      |
| PUT    | `/api/auth/profile`            | Update profile        |
| PUT    | `/api/auth/change-password`    | Change password       |
| GET    | `/api/clients`                 | List clients          |
| POST   | `/api/clients`                 | Create client         |
| PUT    | `/api/clients/:id`             | Update client         |
| DELETE | `/api/clients/:id`             | Delete client         |
| GET    | `/api/projects`                | List projects         |
| POST   | `/api/projects`                | Create project        |
| PUT    | `/api/projects/:id`            | Update project        |
| DELETE | `/api/projects/:id`            | Delete project        |
| GET    | `/api/payments`                | List payments         |
| POST   | `/api/payments`                | Create payment        |
| PUT    | `/api/payments/:id`            | Update payment        |
| DELETE | `/api/payments/:id`            | Delete payment        |
| GET    | `/api/dashboard`               | Dashboard stats       |
| GET    | `/api/reports/export-csv`      | Export CSV            |
| GET    | `/api/reports/export-pdf`      | Export PDF            |
| GET    | `/api/reports/invoice/:id`     | Project invoice PDF   |

---

## 👤 Author

Built as an individual assignment for Software Engineering Team - 405.
# Freelancer-Tracker
