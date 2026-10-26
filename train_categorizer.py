"""
Train the expense auto-categoriser (TF-IDF + Logistic Regression) and save it with pickle.

Pipeline
  text -> FeatureUnion[ word TF-IDF (1-2 grams), char_wb TF-IDF (2-4 grams) ] -> LogisticRegression

Character n-grams make the model robust to typos and unseen merchant spellings
("dominoes piza" still maps to Food).

Usage:  python models/train_categorizer.py [--data dataset/expenses.csv]
Outputs: models/categorizer.pkl, models/categorizer_metrics.json
"""
import argparse
import json
import pickle
from pathlib import Path

import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, f1_score
from sklearn.model_selection import GroupShuffleSplit, train_test_split
from sklearn.pipeline import FeatureUnion, Pipeline

ROOT = Path(__file__).resolve().parent.parent


def build_pipeline() -> Pipeline:
    features = FeatureUnion([
        ("word", TfidfVectorizer(lowercase=True, ngram_range=(1, 2), sublinear_tf=True, min_df=1)),
        ("char", TfidfVectorizer(lowercase=True, analyzer="char_wb", ngram_range=(2, 4), sublinear_tf=True)),
    ])
    clf = LogisticRegression(max_iter=2000, C=8.0, class_weight="balanced")
    return Pipeline([("tfidf", features), ("clf", clf)])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", default=str(ROOT / "dataset" / "expenses.csv"))
    ap.add_argument("--out", default=str(ROOT / "models" / "categorizer.pkl"))
    args = ap.parse_args()

    df = pd.read_csv(args.data).dropna(subset=["description", "category"])
    X, y = df["description"].astype(str), df["category"]

    # 1) Standard stratified hold-out
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)
    model = build_pipeline().fit(Xtr, ytr)
    pred = model.predict(Xte)
    metrics = {"holdout_accuracy": round(accuracy_score(yte, pred), 4),
               "holdout_macro_f1": round(f1_score(yte, pred, average="macro"), 4)}

    # 2) Harder check: whole description "groups" never seen in training (unseen-merchant test)
    groups = X.str.lower().str.replace(r"[^a-z ]", "", regex=True).str.split().str[0]
    gss = GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=7)
    tr, te = next(gss.split(X, y, groups))
    unseen = build_pipeline().fit(X.iloc[tr], y.iloc[tr])
    metrics["unseen_merchant_accuracy"] = round(accuracy_score(y.iloc[te], unseen.predict(X.iloc[te])), 4)

    print(classification_report(yte, pred, digits=3))
    print(json.dumps(metrics, indent=2))

    # Final model trained on all data
    final = build_pipeline().fit(X, y)
    with open(args.out, "wb") as f:
        pickle.dump(final, f)
    (Path(args.out).parent / "categorizer_metrics.json").write_text(json.dumps(metrics, indent=2))
    print(f"saved -> {args.out}")


if __name__ == "__main__":
    main()
