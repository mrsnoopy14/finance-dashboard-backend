# Finance Data Processing and Access Control Backend

A backend REST API for managing financial records with role-based access control, built with Node.js, Express, and PostgreSQL.

## What this does

- Users have roles (viewer, analyst, admin) with different permissions
- Analysts and admins can create, edit, and delete financial records
- Records can be filtered by date, category, and type
- Analytics endpoints return summaries, trends, and breakdowns
- All routes except register/login require a JWT token
- Deleted records and users are soft-deleted (marked, not erased) for audit purposes
- Rate limiting on all routes (stricter on auth endpoints)

## Project Structure

```
src/
├── controllers/     # route handlers (auth, users, records, analytics)
├── models/          # SQL queries (User.js, FinancialRecord.js, Analytics.js)
├── routes/          # endpoint definitions
├── middleware/      # JWT auth, role checks, Joi validation
├── validators/      # Joi schemas
└── db/              # connection.js + migrations.js
tests/
├── unit/            # middleware and validation schema tests
└── integration/     # auth route tests (DB mocked)
```

## Setup

**Requirements:** Node.js v14+, PostgreSQL v12+

```bash
# 1. Install dependencies
npm install

# 2. Create a PostgreSQL database
psql -U postgres -c "CREATE DATABASE finance_db;"

# 3. Update .env with your DB credentials (see .env.example or below)

# 4. Run migrations to create tables
npm run migrate

# 5. Start the server
npm run dev
```

**.env file:**
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=finance_db
DB_USER=postgres
DB_PASSWORD=your_password
PORT=3000
NODE_ENV=development
JWT_SECRET=change-this-in-production
JWT_EXPIRES_IN=24h
```

Server runs at `http://localhost:3000`

## Authentication

Register or login to get a JWT token, then include it in all requests:

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Shashi","email":"shashi@example.com","password":"Admin123!","role":"admin"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"shashi@example.com","password":"Admin123!"}'

# Use the token
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/users
```

## API Endpoints

### Auth (public, no token needed)

| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/auth/register | Create account, returns JWT |
| POST | /api/auth/login | Login, returns JWT |
| GET | /api/auth/me | Get own user info (token required) |

### Users (admin only)

| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/users | List all users |
| GET | /api/users/profile/:userId | Get user profile |
| POST | /api/users | Create a user |
| PUT | /api/users/:userId | Update role/status |
| DELETE | /api/users/:userId | Soft delete user |

### Financial Records (analyst + admin)

| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/records | List records (with filters) |
| GET | /api/records/:recordId | Get single record |
| POST | /api/records | Create record |
| PUT | /api/records/:recordId | Update record |
| DELETE | /api/records/:recordId | Soft delete record |

**Filters for GET /api/records:**
```
?startDate=2024-01-01&endDate=2024-12-31&category=Salary&type=income&limit=50&offset=0
```

### Analytics (viewer can access summary + recent, analyst/admin get everything)

| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/analytics/dashboard/:userId | All analytics in one request |
| GET | /api/analytics/summary/:userId | Income, expenses, net balance |
| GET | /api/analytics/breakdown/category/:userId | Spending by category |
| GET | /api/analytics/breakdown/type/:userId | Income vs expense breakdown |
| GET | /api/analytics/transactions/recent/:userId | Last N transactions |
| GET | /api/analytics/trends/monthly/:userId | Month-by-month totals |

### Health check

```
GET /health
```

## Roles and Permissions

| Action | Viewer | Analyst | Admin |
|--------|--------|---------|-------|
| View dashboard & summary | ✓ | ✓ | ✓ |
| View recent transactions | ✓ | ✓ | ✓ |
| Create/edit/delete records | ✗ | ✓ | ✓ |
| View analytics breakdowns | ✗ | ✓ | ✓ |
| Manage users | ✗ | ✗ | ✓ |
| View other users' records | ✗ | ✗ | ✓ |

Analysts can only access their own records. Admins can access anyone's.

## Database Schema

```sql
users
  id UUID, name, email (unique), password_hash,
  role (viewer/analyst/admin), status (active/inactive),
  created_at, updated_at, deleted_at

financial_records
  id UUID, user_id (FK), amount DECIMAL(15,2),
  type (income/expense), category, description,
  transaction_date DATE, created_at, updated_at, deleted_at
```

Indexes on: user_id, transaction_date, category, email.

`deleted_at` is used for soft deletes — nothing is physically removed.

## Error Responses

All errors return the same shape:

```json
{
  "success": false,
  "message": "What went wrong",
  "errors": [{ "field": "email", "message": "must be a valid email" }]
}
```

Status codes: `400` validation, `401` not authenticated, `403` not authorized, `404` not found, `409` duplicate email, `429` rate limit exceeded, `500` server error.

## Rate Limiting

- Global: 100 requests per 15 minutes per IP
- Auth routes (/api/auth/*): 10 requests per 15 minutes — to limit brute-force attempts

## Tests

38 tests, no database needed (DB is mocked).

```bash
npm test                  # all tests
npm run test:unit         # just middleware + schema tests
npm run test:integration  # just auth route tests
```

| File | Tests |
|------|-------|
| auth.middleware.test.js | 8 — JWT verify, expired tokens, role checks |
| validation.schemas.test.js | 18 — user/record/login/query schemas |
| auth.routes.test.js | 12 — register, login, error cases, protected routes |

## Design Notes

**Why PostgreSQL over SQLite?** The analytics queries use `DATE_TRUNC`, `COALESCE`, and aggregations that are cleaner in Postgres. Also wanted proper foreign key constraints and indexing.

**Why soft delete?** Financial records shouldn't disappear permanently. Even for an internship project, it's a habit worth building — you can always tell what was deleted and when.

**JWT over sessions?** Stateless auth fits a REST API better. No session store to maintain. Token payload carries `id`, `email`, and `role` so I don't need a DB lookup on every request.

**Validation with Joi** covers both body and query params. Errors include exactly which field failed and why.

---

Submitted by: Shashi Shekhar (shekharshashi127@gmail.com) — April 2026
