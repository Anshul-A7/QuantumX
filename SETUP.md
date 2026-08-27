# QuantumX Setup Guide

This guide details the setup instructions for the QuantumX project, tailored for each team member's role and the tech stack outlined in our project documentation.

## Prerequisites for All Roles

Before starting, ensure you have the following installed:
- Git
- VS Code (or your preferred IDE)
- A GitHub account with access to the QuantumX repository

Clone the repository:
```bash
git clone <repository_url>
cd QuantumX
```

---

## Role-Specific Setup Instructions

### 🖥️ R1-FRONTEND (Frontend Developer)

**Tech Stack:** Next.js 16 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Recharts, Framer Motion, Axios.

**Setup Instructions:**
1. Navigate to the Frontend directory:
   ```bash
   cd Frontend
   ```
2. Install Node.js (v18 or higher recommended).
3. Install dependencies:
   ```bash
   npm install
   ```
4. Set up environment variables:
   Copy `.env.example` to `.env.local` and configure the backend API URL.
5. Start the development server:
   ```bash
   npm run dev
   ```

---

### ⚙️ R2-BACKEND (Backend Developer)

**Tech Stack:** Python 3.12+, FastAPI, SQLAlchemy, Alembic, PostgreSQL, Pydantic, bcrypt, python-jose.

**Setup Instructions:**
1. Install Python 3.12+.
2. Install PostgreSQL and create a database named `quantumx`.
3. Navigate to the Backend directory:
   ```bash
   cd Backend
   ```
4. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
5. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
6. Set up environment variables:
   Copy `.env.example` to `.env` and configure your database credentials and JWT secret.
7. Run database migrations:
   ```bash
   alembic upgrade head
   ```
8. Start the FastAPI server:
   ```bash
   uvicorn app.main:app --reload
   ```

---

### 📈 R3-ML (Machine Learning Engineer)

**Tech Stack:** Python 3.12+, scikit-learn, XGBoost, PyTorch, pandas, NumPy, SHAP, SciPy.

**Setup Instructions:**
1. Install Python 3.12+.
2. Navigate to the Backend directory (as ML runs within the backend environment):
   ```bash
   cd Backend
   ```
3. Create and activate a virtual environment (if you haven't already):
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
4. Install ML specific dependencies:
   Ensure `requirements.txt` includes all necessary ML packages or install them directly:
   ```bash
   pip install -r requirements.txt
   ```
5. Set up datasets:
   Download the WDBC, Cleveland Heart Disease, and CKD datasets and place them in the designated `Backend/data/` folder (or as defined by the data pipeline).

---

### 🔄 R4-INTEGRATION (Integration & QA Tester)

**Setup Instructions:**
1. Follow both Frontend and Backend setup instructions to run the full stack locally.
2. Set up testing frameworks (e.g., pytest for backend, Jest/Cypress for frontend).
3. Ensure you can successfully start both servers and communicate between them.

---

### 📋 R5-DOCS (Documentation, Research & Presentation Lead)

**Setup Instructions:**
1. No technical environment setup is strictly required, but having a Markdown editor (like Typora or VS Code) is recommended.
2. Access the `Plan/` and `Team Data/` folders for project tracking and documentation updates.

---

## Troubleshooting

- If you encounter package conflicts in Python, ensure you are using a clean virtual environment.
- For database connection issues, verify your PostgreSQL service is running and the `.env` credentials match.
- Frontend build errors? Try deleting `node_modules` and running `npm install` again.
