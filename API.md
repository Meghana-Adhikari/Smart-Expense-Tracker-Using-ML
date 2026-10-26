# API Reference

Base URL `http://localhost:5000/api`. All endpoints except register, login and health need `Authorization: Bearer <token>`.
Errors return `{"error": "message"}` with status 400 (validation), 401 (auth), 404, 409 or 503.

## Auth
| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `/auth/register` | `name, email, password (8+)` | `201 {token, user}` |
| POST | `/auth/login` | `email, password` | `{token, user}` |
| POST | `/auth/logout` | none | revokes the token |
| GET | `/auth/me` | none | `{user}` |
| PUT | `/auth/profile` | `name?, monthly_income_target?, budgets?` | `{user}` |
| POST | `/auth/change-password` | `current_password, new_password` | message |

## Expenses
| Method | Path | Notes |
|---|---|---|
| GET | `/expenses` | Query: `q` (search), `category` (comma list), `start`, `end`, `min_amount`, `max_amount`, `sort` (date/amount), `order` (asc/desc), `page`, `per_page` (max 100). Returns `{items, total, pages, total_amount}` |
| POST | `/expenses` | `{description, amount, date, category?, payment_method?, notes?}`. Missing category is predicted. Returns `{expense, alert}` |
| GET / PUT / DELETE | `/expenses/<id>` | Single expense |

```bash
curl -X POST localhost:5000/api/expenses -H "Authorization: Bearer $T" -H "Content-Type: application/json" \
  -d '{"description":"Dominos Pizza","amount":450,"date":"2026-09-28"}'
# -> {"expense":{"category":"Food","auto_categorized":true,...},"alert":null}
```

## Income
| Method | Path | Notes |
|---|---|---|
| GET / POST | `/income` | `{amount, date, source, description?}` |
| PUT / DELETE | `/income/<id>` | |
| GET | `/income/report?year=2026` | Monthly income, expenses, savings, savings rate, cumulative savings |

## Dashboard
`GET /dashboard/summary` returns totals, this/last month, recent transactions, monthly summary, and chart data
(`category_pie`, `monthly_line`, `category_compare`, `savings_growth`).

## Machine learning
| Method | Path | Returns |
|---|---|---|
| POST | `/ml/categorize` | Body `{"text":"Dominos Pizza ₹450"}` → `{category, confidence, amount, description, alternatives}` |
| GET | `/ml/forecast` | `{predicted_expense, range_low, range_high, trend, backtest_error_pct, history, by_category}` |
| GET | `/ml/anomalies` | `{anomalies:[{date,total,times_normal,severity,message}], recent_alerts}` |
| GET | `/ml/health-score` | `{score, grade, components, suggestions}` |
| GET | `/ml/insights` | `{insights:[{message,severity}], potential_savings}` |
| GET | `/ml/budgets/recommend` | Recommended budgets for Food, Travel, Shopping, Entertainment |

Sections that need more history return `{"available": false, "message": "..."}` instead of an error.

## Goals
| Method | Path | Notes |
|---|---|---|
| GET / POST | `/goals` | `{name, target_amount, saved_amount?, deadline?}`; each goal includes a computed `plan` |
| PUT / DELETE | `/goals/<id>` | |
| POST | `/goals/plan` | What-if without saving: `{target_amount, saved_amount?, deadline_months?}` |

## OCR
`POST /ocr/scan` with `multipart/form-data` field `file` (png, jpg, jpeg, webp, bmp; max 8 MB) returns
`{merchant, amount, date, suggested_category, category_confidence, needs_review, raw_text}`.
