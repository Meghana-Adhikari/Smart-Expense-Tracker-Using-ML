# Database Schema (MongoDB, database `finance_assistant`)

```mermaid
erDiagram
  users ||--o{ expenses : owns
  users ||--o{ income : owns
  users ||--o{ goals : owns
  users { ObjectId _id string name string email string password_hash string currency number monthly_income_target object budgets date created_at }
  expenses { ObjectId _id string user_id string description number amount date date string category bool auto_categorized string payment_method string notes string source date created_at }
  income { ObjectId _id string user_id number amount date date string source string description date created_at }
  goals { ObjectId _id string user_id string name number target_amount number saved_amount date deadline date created_at }
```

| Collection | Notes | Indexes |
|---|---|---|
| `users` | `email` unique and lower-cased. `budgets` looks like `{"Food": 6000, "Travel": 3000}`. Passwords are stored as salted hashes (Werkzeug). | `email` (unique) |
| `expenses` | `category` is one of the 9 categories. `auto_categorized` is true when the ML model chose it. `source` is `manual`, `ocr` or `seed`. | `(user_id, date desc)`, `(user_id, category)` |
| `income` | `source` is Salary, Freelance, Allowance, Investment, Gift or Other. | `(user_id, date desc)` |
| `goals` | `deadline` is optional. Progress and plan are computed at read time, not stored. | `user_id` |
| `token_blocklist` | Revoked JWT ids from logout. Documents expire automatically after 13 hours. | `created_at` (TTL) |

`user_id` is stored as the string form of the user's `_id`.
