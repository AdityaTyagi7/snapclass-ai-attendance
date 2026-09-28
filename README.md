# SnapClass — AI-Powered Smart Attendance Platform 🎓📸🎙️

SnapClass is a modern, enterprise-grade classroom attendance management platform featuring multi-modal AI detection (facial recognition + voice print identification), real-time class verification, QR-based enrollment, and comprehensive attendance tracking.

---

## 🌟 Key Features

- **Dual-Modal AI Attendance**:
  - **Facial Recognition**: Multi-face detection using `dlib` 68-point facial landmarks and SVM embedding matching.
  - **Voice Print Recognition**: Speaker identification using PyTorch-powered `Resemblyzer` d-vector voice embeddings.
- **Role-Based Portals**:
  - **Teacher Portal**: Create subjects, generate join codes & QR codes, run 3-step AI attendance wizard, review verification tables, and inspect historical logs.
  - **Student Portal**: One-click Face ID authentication, view enrolled courses, monitor attendance percentages with interactive progress indicators, and browse full attendance logs.
- **Modern Architecture**:
  - **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React icons, QR Code generation.
  - **Backend API**: FastAPI bridge server exposing 14 RESTful endpoints.
  - **Database**: Supabase PostgreSQL with vector embedding storage.
  - **Custom Color Palette**: Modern dark aesthetic (`#212121`, `#323232`, `#0D7377`, `#14FFEC`).

---

## 🏗️ Project Architecture

```
ai-attendance-project-app-main/
├── frontend/                     # Modern React + TypeScript + Vite web app
│   ├── src/
│   │   ├── api/                  # Axios REST API client & endpoints
│   │   ├── components/
│   │   │   ├── layout/           # AppShell, Header, Sidebar
│   │   │   ├── ui/               # Button, Badge, Card, Dialog, Input, Skeleton, Toast
│   │   │   └── widgets/          # CameraModal, AudioRecorder, TakeAttendanceWizard, Modals
│   │   ├── context/              # AuthContext (Role & session management)
│   │   ├── pages/                # AuthPage, TeacherDashboard, StudentDashboard
│   │   └── types/                # TypeScript interfaces
│   └── package.json
├── src/                          # Core AI/ML & Database modules
│   ├── db.py                     # Supabase database access layer
│   ├── face_pipeline.py          # Face detection & feature extraction
│   └── voice_pipeline.py         # Voice recording & speaker recognition
├── server.py                     # FastAPI REST backend bridge
├── app.py                        # Legacy Streamlit entry point
├── schema.sql                    # Supabase database schema
└── requirements.txt              # Python ML & web backend dependencies
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Python 3.10+** (with virtual environment recommended)
- **Node.js 18+** & `npm`
- **Supabase Account** (PostgreSQL)

---

### 2. Supabase Database Setup
1. Create a new Supabase project.
2. Open the **SQL Editor** in your Supabase dashboard.
3. Paste and execute the contents of [`schema.sql`](./schema.sql).
4. Create `.streamlit/secrets.toml` with your credentials:
   ```toml
   SUPABASE_URL = "https://your-project.supabase.co"
   SUPABASE_KEY = "your-supabase-anon-key"
   ```

---

### 3. Backend Setup (FastAPI)
```bash
# Create and activate Python virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
python -m uvicorn server:app --port 8000 --reload
```
API Documentation will be available at [http://localhost:8000/docs](http://localhost:8000/docs).

---

### 4. Frontend Setup (React + Vite)
```bash
cd frontend

# Install npm packages
npm install

# Start development server
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🛡️ License

This project is licensed under the MIT License.