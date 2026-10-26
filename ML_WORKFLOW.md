# Machine Learning Workflow

## 1. Auto-categorisation (supervised, text classification)
- **Data**: `description → category` pairs from `dataset/expenses.csv` (5,240 rows, 9 classes).
- **Features**: `FeatureUnion` of word TF-IDF (1-2 grams) and character TF-IDF (2-4 grams). Character n-grams make "dominoes piza" still look like "Dominos Pizza".
- **Model**: Logistic Regression (`C=8`, balanced class weights), which gives calibrated-ish probabilities for the confidence shown in the UI.
- **Evaluation**: stratified 80/20 hold-out (99.9% accuracy) **and** a group split where entire merchants are unseen (~69%). The second number is the honest one; synthetic data repeats merchants.
- **Serving**: `pickle` file loaded once per worker. The amount is parsed separately with a regex (`₹450`, `Rs. 1,250`, `450`).
- **Improve it**: retrain on users' corrected categories (`auto_categorized: false` after an edit marks trusted labels).

## 2. Expense forecasting (regression, time series)
- **Series**: total spending per **complete** calendar month.
- **Target**: growth ratio `y_t / mean(y_{t-3..t-1})`. Trees cannot extrapolate beyond values seen in training, so predicting a ratio keeps the model useful when spending drifts upward.
- **Features**: last two months as ratios, month-of-year as sine/cosine (seasonality).
- **Model**: Random Forest Regressor (300 trees). The likely range is the 10th-90th percentile of the individual trees.
- **Backtest**: retrain without the last month, predict it, report percent error.
- **Fallback**: fewer than 8 months → weighted moving average; fewer than 3 → "not enough data".

## 3. Anomaly detection (unsupervised)
- **Unit**: one calendar day, with features total, log(total), transaction count, largest transaction.
- **Model**: Isolation Forest (`contamination=0.03`).
- **Rule on top**: a day is reported only if it is also above 1.5× the median spending day, so unusually quiet days never alert.
- **Real time**: after each new expense the same model scores the day's running total.
- **Evaluation**: `python models/evaluate_anomaly.py` against 30 injected spikes (recall 0.60, precision 0.95 on the sample data).

## 4. Financial health score (transparent rules, not a black box)
| Component | Points | Rule |
|---|---|---|
| Savings ratio | 30 | Full marks at 30%+ of income saved (last 3 months) |
| Consistency | 20 | Coefficient of variation of monthly spending; 0 at 40%+ |
| Budget discipline | 30 | Share of budget categories within limit last month (your budgets, else recommended) |
| Patterns | 20 | 10 for discretionary share (≤25% full), 10 for few anomaly days in 90 days |

Grades: 80+ Excellent, 65+ Good, 50+ Fair, below that Needs attention.

## 5. Insights, budgets and goals
- **Insights**: month-over-month category changes, potential savings (spend above target budget), savings rate, top category, weekend vs weekday, recent anomalies.
- **Budgets**: recency-weighted average of the last 6 months × a target factor (Food 0.95, others 0.85), rounded to ₹100, capped at 45% of income.
- **Goals**: monthly savings = average of recent actual savings and (average income − forecast expense); months needed = remaining ÷ monthly savings.

## Limitations
The dataset is synthetic. Real spending is noisier, so expect lower accuracy until you retrain on real data. Forecasts need several months of history, and OCR quality depends on photo quality.
