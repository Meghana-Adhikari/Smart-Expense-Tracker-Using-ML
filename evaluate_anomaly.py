"""
Evaluate the Isolation Forest against the labelled spikes injected into the synthetic dataset.
A "hit" = the injected day is among the flagged days.   Usage: python models/evaluate_anomaly.py
"""
import sys
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "backend"))
from app.services.anomaly import detect_anomalies  # noqa: E402

df = pd.read_csv(ROOT / "dataset" / "expenses.csv", parse_dates=["date"])
df["month"] = df["date"].dt.strftime("%Y-%m")
truth = set(df.loc[df.is_anomaly == 1, "date"].dt.strftime("%Y-%m-%d"))
flagged = {a["date"] for a in detect_anomalies(df, limit=10_000)["anomalies"]}
tp = len(truth & flagged)
print(f"injected spike days: {len(truth)} | flagged days: {len(flagged)} | caught: {tp}")
print(f"recall    = {tp / len(truth):.2f}")
print(f"precision = {tp / max(len(flagged), 1):.2f}  (other flagged days are naturally large spending days)")
