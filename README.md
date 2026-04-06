# Karunya Research Portal

A professional full-stack application designed for **Karunya Institute of Technology and Sciences** to aggregate, analyze, and display institutional research publications and theses.

---

## 🏗️ Project Structure

```text
research-portal/
├── backend/                # FastAPI Application
│   ├── app/                # Core Logic (Models, Routers, Services)
│   ├── data/               # SQLite Database & Uploads
│   ├── scripts/            # Management & Seeding Scripts
│   └── alembic/            # Database Migrations
├── frontend/               # React (Vite) Application
│   ├── src/
│   │   ├── api/            # API Client (Axios/Fetch)
│   │   ├── components/     # Reusable UI Components
│   │   ├── pages/          # Full Page Views
│   │   └── context/        # State Management (Auth/Toast)
│   └── public/             # Static Assets
└── README.md               # Project Documentation
```

---

## 🚀 Quick Start (Development)

### 1. Prerequisites
- **Python 3.9+**
- **Node.js 18+**
- **Vite** (Global or local)

### 2. Backend Setup
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate  # Windows
pip install -r requirements.txt

# Create .env based on .env.example
# Run initial seeding
python scripts/seed_db.py

# Start Server
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup
```bash
cd frontend
npm install

# Create .env based on .env.example (Set VITE_API_URL=http://localhost:8000)
npm run dev
```

---

## 🔒 Environment Variables (Backend)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | SQLite path (e.g., `sqlite+aiosqlite:///data/research.db`) |
| `SCOPUS_API_KEY` | Your Elsevier Developer API Key |
| `SCOPUS_AFFILIATION_ID` | Karunya ID: `60025709` |
| `SECRET_KEY` | JWT signing key |

---

## 📊 Administrative Features
- **User Management**: Add/Remove faculty accounts.
- **Bulk Import**: Upload Scopus CSV exports to bypass API limits.
- **Thesis Archive**: Upload and organize student theses (PDF).
- **Analytics**: Visualization of research impact and publication trends.

---

## 🛠️ Tech Stack
- **Backend**: FastAPI, SQLAlchemy (Async), SQLite, Alembic.
- **Frontend**: React (Vite), Lucide Icons, Recharts, Tailwind CSS.
- **API**: Elsevier Scopus API Integration.