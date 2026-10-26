# Paisa AI: AI-Powered Personal Finance Assistant

A full-stack personal finance app that categorises expenses automatically, forecasts next month's spending,
flags unusual spending, scores your financial health, and reads receipts with OCR.

**Stack:** React · Tailwind CSS · Chart.js | Flask · MongoDB | Pandas · NumPy · scikit-learn | OpenCV · Tesseract

## Features

| Area | What it does |
|---|---|
| Accounts | Register, log in, log out (server-side token revocation), edit profile, change password |
| Expenses | Add, edit, delete, paginated history, search, filters (category, dates, amount), sorting |
| Income and savings | Income CRUD, monthly income vs expense vs savings report, savings growth chart |
| Dashboard | Totals, this-month strip, recent transactions, monthly summary, 4 charts |
| **ML: auto-categorise** | Type `Dominos Pizza ₹450` and get **Food**. TF-IDF (word + character n-grams) + Logistic Regression, saved with pickle |
| **ML: forecast** | Random Forest predicts next month's spend with a likely range, trend and per-category split |
| **ML: anomalies** | Isolation Forest flags unusual spending days, plus a real-time alert when you add an expense |
| **ML: health score** | 0-100 from savings ratio, consistency, budget discipline and spending patterns, with suggestions |
| **AI insights** | "Shopping increased by 41%", "Potential savings this month: ₹1,500" |
| Goals | Target amount → months needed, monthly savings required, on-track / behind status |
| OCR | Upload a receipt → merchant, amount, date, suggested category (OpenCV + Tesseract) |
| Budgets | Recommended monthly budgets for Food, Travel, Shopping, Entertainment |

## Quick start

```bash
# 1. Backend environment (MongoDB running; Tesseract installed for OCR)
cd backend && python -m venv venv && source venv/bin/activate
pip install -r requirements.txt && cp .env.example .env

# 2. Data and model: run from the project root with the SAME venv active,
#    so the pickled model matches the scikit-learn version the API uses
cd .. && python dataset/generate_dataset.py     # 5,000+ synthetic expenses
python models/train_categorizer.py              # creates models/categorizer.pkl

# 3. Start the API
cd backend && python scripts/seed_demo.py       # demo@finance.app / Demo@12345
python run.py                                   # http://localhost:5000

# 4. Frontend (new terminal)
cd frontend && npm install && npm run dev       # http://localhost:5173
```

Full steps (Windows, Tesseract, Docker) are in [docs/INSTALLATION.md](docs/INSTALLATION.md).

## Project structure

```
frontend/   React + Vite + Tailwind + Chart.js (pages, components, API client)
backend/    Flask app: routes/ (HTTP), services/ (ML + analytics), tests/, scripts/
models/     Training + evaluation scripts, saved categoriser
dataset/    Synthetic data generator, expenses.csv (5,240 rows), income.csv
docs/       Architecture, schema, API, ML workflow, deployment, installation
```

## Measured results (on the included synthetic data)

| Model | Result | Read this as |
|---|---|---|
| Categoriser | 99.9% accuracy on a random hold-out | Optimistic: synthetic descriptions repeat merchants |
| Categoriser | ~69% accuracy when whole merchants are held out | The realistic number for merchants it has never seen; retrain on real data to improve |
| Forecast | ~2-18% error predicting the last known month (varies with the random seed) | One backtest month, so treat it as a sanity check, not a benchmark |
| Anomalies | 60% of injected spikes caught, 95% of flagged days were true spikes | Tuned to avoid false alarms; raise `contamination` to catch more |

Regenerate the numbers: `python models/train_categorizer.py`, `python models/evaluate_anomaly.py`.

## Testing

```bash
cd backend && pytest -q
```
`tests/test_services.py` covers the ML and parsing logic. `tests/test_api.py` runs the API against an in-memory MongoDB.

## Documentation

[Installation](docs/INSTALLATION.md) · [Architecture](docs/ARCHITECTURE.md) · [Database schema](docs/DATABASE_SCHEMA.md) ·
[API reference](docs/API.md) · [ML workflow](docs/ML_WORKFLOW.md) · [Deployment](docs/DEPLOYMENT.md)

## Ideas to extend it

Recurring-expense detection, bank statement CSV import, email/WhatsApp alerts, multi-currency, refresh tokens,
per-user retraining of the categoriser from corrected labels.
