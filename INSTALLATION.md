# Installation Guide

## Prerequisites
- Python 3.10+ (3.11 recommended), Node.js 18+, MongoDB 6+ (local or Atlas)
- Tesseract OCR (only for the receipt scanner)
  - Ubuntu/Debian: `sudo apt install tesseract-ocr`
  - macOS: `brew install tesseract`
  - Windows: install from the UB Mannheim build, then set `TESSERACT_CMD` in `backend/.env`

## 1. Backend environment
```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env              # then edit SECRET_KEY and JWT_SECRET_KEY
```

## 2. Dataset, model and API
Run these with the same virtual environment active, so the pickled model matches the installed scikit-learn.
```bash
cd ..                                       # project root
python dataset/generate_dataset.py          # dataset/expenses.csv, dataset/income.csv
python models/train_categorizer.py          # models/categorizer.pkl
cd backend
python scripts/seed_demo.py                 # optional: loads the dataset for demo@finance.app
python run.py
```
Check `http://localhost:5000/api/health` returns `{"status":"ok"}`.
If the pickle is missing or was made with another scikit-learn version, the API logs a warning and uses a small keyword fallback until you retrain.

## 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173`. In development Vite proxies `/api` to Flask, so no CORS setup is needed.

## 4. Docker (API + MongoDB)
```bash
docker compose up --build
docker compose exec api python scripts/seed_demo.py
```

## Troubleshooting
| Symptom | Fix |
|---|---|
| `ServerSelectionTimeoutError` | MongoDB is not running or `MONGO_URI` is wrong |
| OCR returns 503 | Tesseract is not installed or not on PATH; set `TESSERACT_CMD` |
| "Add at least 3 months" in forecast | Seed the demo data or add more history |
| `ModuleNotFoundError: app` | Run commands from the `backend/` folder |
