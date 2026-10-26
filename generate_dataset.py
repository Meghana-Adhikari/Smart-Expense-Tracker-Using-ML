"""
Synthetic dataset generator for the AI-Powered Personal Finance Assistant.

Creates realistic Indian-context spending data:
  * dataset/expenses.csv  (5,000+ rows: date, description, amount, category, is_anomaly)
  * dataset/income.csv    (monthly salary + occasional freelance income)

Realism features: recurring monthly bills, weekend uplift for food/entertainment,
festive-season shopping, seasonal travel, slow inflation trend, typo/case noise
in descriptions, and a small number of injected spending spikes (labelled).

Usage:  python dataset/generate_dataset.py --seed 42
"""
import argparse
import random
from pathlib import Path

import numpy as np
import pandas as pd

OUT_DIR = Path(__file__).resolve().parent

# category -> (merchants/descriptions, lognormal median, sigma, base weight)
CATALOG = {
    "Food": (["Dominos Pizza", "Swiggy order", "Zomato order", "McDonalds", "KFC", "Starbucks coffee",
              "Chai Point", "Campus canteen", "Biryani Blues", "BigBasket groceries", "Blinkit groceries",
              "Zepto order", "Haldirams snacks", "Subway sandwich", "Cafe Coffee Day", "Pizza Hut",
              "Burger King", "Local tiffin center", "Vegetable market", "Milk and curd", "Ice cream parlour",
              "Tea stall", "Barbeque Nation", "Behrouz Biryani"], 190, 0.65, 0.31),
    "Transport": (["Uber ride", "Ola cab", "Rapido bike taxi", "Metro card recharge", "HP petrol pump",
                   "Indian Oil fuel", "Auto rickshaw", "City bus pass", "FASTag recharge", "Bike service centre",
                   "Parking fee", "Shell petrol", "Namma Yatri auto"], 110, 0.7, 0.16),
    "Shopping": (["Amazon order", "Flipkart order", "Myntra clothes", "Ajio fashion", "Decathlon sports",
                  "Zara", "H&M", "Nykaa beauty", "Reliance Trends", "Croma electronics", "Lifestyle store",
                  "Meesho order", "Shoes at Bata", "Westside", "Pantaloons", "Apple accessories store"], 650, 0.8, 0.11),
    "Education": (["Udemy course", "Coursera subscription", "GeeksforGeeks premium", "LeetCode premium",
                   "Classmate notebooks", "Stationery shop", "Xerox and printing", "NPTEL exam fee",
                   "Unacademy plus", "Semester exam fee", "Lab manual book", "Coding Ninjas workshop",
                   "Engineering textbook", "Library fine", "Pen drive and cables"], 320, 0.9, 0.05),
    "Entertainment": (["Netflix subscription", "Spotify premium", "PVR Cinemas", "BookMyShow tickets",
                       "Steam game purchase", "Hotstar subscription", "YouTube Premium", "Bowling alley",
                       "Gaming zone", "Concert ticket", "Prime Video", "Escape room", "INOX movie", "Comedy show"],
                      280, 0.7, 0.08),
    "Bills": (["Jio recharge", "Airtel postpaid bill", "Electricity bill", "Water bill", "ACT Fibernet wifi",
               "Gas cylinder refill", "Tata Play DTH recharge", "Insurance premium", "Credit card bill",
               "Mobile data pack", "Society maintenance"], 450, 0.6, 0.08),
    "Healthcare": (["Apollo Pharmacy", "MedPlus medicines", "Doctor consultation", "Thyrocare lab test",
                    "Dental clinic", "Cult.fit membership", "Eye checkup", "1mg medicines", "Physiotherapy session",
                    "Hospital pharmacy", "Vitamin supplements"], 350, 0.8, 0.04),
    "Travel": (["IRCTC train ticket", "MakeMyTrip booking", "RedBus ticket", "IndiGo flight", "OYO hotel",
                "Goibibo hotel", "Airbnb stay", "Yatra flight", "Goa trip hotel", "Ola outstation cab",
                "Air India ticket", "Vande Bharat ticket", "Resort booking"], 1500, 0.75, 0.03),
    "Others": (["Gift for friend", "Temple donation", "Salon haircut", "Laundry service", "Courier charges",
                "ATM withdrawal", "Miscellaneous", "Phone repair", "Charity contribution", "Birthday party share",
                "Tailor stitching", "Passport photo", "Key duplicate"], 180, 0.85, 0.09),
}

# (month number -> multiplier) seasonal effects per category
SEASON = {
    "Shopping": {10: 1.5, 11: 1.6, 12: 1.3, 1: 1.1, 3: 1.15},
    "Travel": {5: 2.2, 6: 1.6, 12: 2.4, 10: 1.6, 4: 1.3},
    "Education": {1: 2.0, 7: 2.4, 8: 2.0},
    "Entertainment": {12: 1.3, 6: 1.2},
}
WEEKEND_BOOST = {"Food": 1.35, "Entertainment": 1.7, "Shopping": 1.3, "Travel": 1.2}

AMOUNT_SCALE = 0.36   # keeps monthly spend at a realistic ~75% of salary

# Fixed monthly obligations: (description, category, day-of-month, amount)
RECURRING = [
    ("Hostel rent", "Bills", 2, 6500), ("ACT Fibernet wifi", "Bills", 5, 799),
    ("Jio recharge", "Bills", 8, 349), ("Netflix subscription", "Entertainment", 12, 199),
    ("Spotify premium", "Entertainment", 14, 119), ("Electricity bill", "Bills", 20, 640),
]


def noisy(text, rng):
    """Add realistic noise: casing, suffix words, occasional typos."""
    r = rng.random()
    if r < 0.12:
        text = text.lower()
    elif r < 0.18:
        text = text.upper()
    if rng.random() < 0.10:
        text += rng.choice([" payment", " UPI", " bill", " - card", " txn"])
    if rng.random() < 0.05 and len(text) > 5:
        i = rng.randrange(1, len(text) - 1)
        text = text[:i] + text[i + 1:]          # dropped character typo
    return text


def generate(start="2024-10-01", end="2026-09-28", seed=42, per_month=215):
    rng = random.Random(seed)
    np_rng = np.random.default_rng(seed)
    days = pd.date_range(start, end, freq="D")
    cats = list(CATALOG)
    weights = np.array([CATALOG[c][3] for c in cats]); weights /= weights.sum()
    rows = []

    for (year, month), month_days in pd.Series(days).groupby([days.year, days.month]):
        month_days = list(month_days)
        n = max(150, int(np_rng.normal(per_month, 15)))
        t = (year - 2024) * 12 + month
        inflation = 1 + 0.006 * (t - 10)                     # ~0.6 %/month drift
        for d in np_rng.choice(month_days, size=n):
            d = pd.Timestamp(d)
            wk = d.dayofweek >= 5
            w = weights.copy()
            for i, c in enumerate(cats):
                w[i] *= WEEKEND_BOOST.get(c, 1.0) if wk else 1.0
                w[i] *= SEASON.get(c, {}).get(month, 1.0)
            w /= w.sum()
            cat = cats[np_rng.choice(len(cats), p=w)]
            names, med, sigma, _ = CATALOG[cat]
            amt = np_rng.lognormal(np.log(med), sigma) * inflation * AMOUNT_SCALE
            amt = round(max(20, amt) / 5) * 5   # min ₹20, rounded to ₹5
            rows.append([d, noisy(rng.choice(names), rng), float(amt), cat, 0])
        for desc, cat, dom, amt in RECURRING:                # recurring bills
            day = pd.Timestamp(year=year, month=month, day=min(dom, month_days[-1].day))
            if month_days[0] <= day <= month_days[-1]:
                rows.append([day, desc, float(amt), cat, 0])

    df = pd.DataFrame(rows, columns=["date", "description", "amount", "category", "is_anomaly"])

    # inject 30 large one-off spikes (Rs 7k-15k, ~4-9x a normal day) with ground-truth labels
    # so anomaly detection can be evaluated (see models/evaluate_anomaly.py)
    for idx in np_rng.choice(len(df), size=30, replace=False):
        df.loc[idx, "amount"] = round(np_rng.uniform(7000, 15000) / 50) * 50
        df.loc[idx, "is_anomaly"] = 1

    df = df.sort_values("date").reset_index(drop=True)
    df["date"] = df["date"].dt.strftime("%Y-%m-%d")
    return df


def generate_income(start="2024-10-01", end="2026-09-28", seed=42, salary=72000):
    rng = np.random.default_rng(seed + 1)
    rows = []
    for m in pd.date_range(start, end, freq="MS"):
        base = salary + (4000 if m >= pd.Timestamp("2025-07-01") else 0)   # mid-period raise
        rows.append([(m + pd.Timedelta(days=0)).strftime("%Y-%m-%d"), "Monthly salary", float(base), "Salary"])
        if rng.random() < 0.35:
            rows.append([(m + pd.Timedelta(days=int(rng.integers(8, 25)))).strftime("%Y-%m-%d"),
                         "Freelance project", float(round(rng.uniform(3000, 12000), -2)), "Freelance"])
    return pd.DataFrame(rows, columns=["date", "description", "amount", "source"])


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--seed", type=int, default=42)
    args = ap.parse_args()
    exp, inc = generate(seed=args.seed), generate_income(seed=args.seed)
    exp.to_csv(OUT_DIR / "expenses.csv", index=False)
    inc.to_csv(OUT_DIR / "income.csv", index=False)
    print(f"expenses.csv: {len(exp)} rows | income.csv: {len(inc)} rows")
    print(exp.category.value_counts().to_string())
    m = exp.assign(m=exp.date.str[:7]).groupby("m").amount.sum()
    print(f"avg monthly spend: {m.mean():,.0f}  (min {m.min():,.0f}, max {m.max():,.0f})")
