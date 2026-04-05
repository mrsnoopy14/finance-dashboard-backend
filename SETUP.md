# Setup Guide

## Prerequisites

- Node.js v14 or later
- PostgreSQL v12 or later
- npm

Check you have them:
```bash
node -v
psql --version
```

---

## Steps

### 1. Install dependencies

```bash
npm install
```

### 2. Create the database

```bash
psql -U postgres
```
```sql
CREATE DATABASE finance_db;
\q
```

Or use pgAdmin if you prefer a UI — just create a database called `finance_db`.

### 3. Configure environment variables

Edit the `.env` file in the project root:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=finance_db
DB_USER=postgres
DB_PASSWORD=your_password_here
PORT=3000
NODE_ENV=development
JWT_SECRET=change-this-to-something-random
JWT_EXPIRES_IN=24h
```

Make sure `DB_PASSWORD` matches what you set for your PostgreSQL user.

### 4. Run migrations

```bash
npm run migrate
```

This creates the `users` and `financial_records` tables plus indexes. You should see:
```
Running database migrations...
✓ Database schema created successfully
```

If it fails, double-check your `.env` credentials and that the `finance_db` database exists.

### 5. Start the server

```bash
npm run dev       # with auto-reload (recommended during development)
npm start         # without auto-reload
```

```
✓ Server running on port 3000
✓ Environment: development
✓ Auth: JWT (Bearer token)
```

### 6. Verify it's running

```bash
curl http://localhost:3000/health
```

Response:
```json
{ "success": true, "message": "Server is running", "timestamp": "..." }
```

---

## Quick test walkthrough

### Register and get a token

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Shashi","email":"shashi@test.com","password":"Admin123!","role":"admin"}'
```

Copy the `token` from the response.

### Create a record

```bash
curl -X POST http://localhost:3000/api/records \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{"amount":5000,"type":"income","category":"Salary","transaction_date":"2026-04-01"}'
```

### Get your dashboard

```bash
curl -H "Authorization: Bearer <your-token>" \
  http://localhost:3000/api/analytics/dashboard/<your-user-id>
```

For more examples, see [API-TESTING.md](./API-TESTING.md).

---

## Running tests

Tests don't need a database connection — the DB is mocked.

```bash
npm test
```

Expected output: 38 tests passing across 3 test files.

---

## Common issues

**"Cannot connect to database"**
- Check PostgreSQL is actually running (`pg_isready`)
- Compare your `.env` credentials against what's set in Postgres
- Make sure `finance_db` exists (`psql -U postgres -l`)

**"Port 3000 already in use"**
- Change `PORT=3001` in `.env`, or find and kill the process:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**Migration fails with permission error**
```bash
psql -U postgres
DROP DATABASE finance_db;
CREATE DATABASE finance_db;
\q
```
Then re-run `npm run migrate`.

**"npm install fails" or missing packages**
```bash
npm cache clean --force
rm -rf node_modules
npm install
```

---

## Available npm commands

```bash
npm run dev       # start with nodemon (auto-reload)
npm start         # start normally
npm run migrate   # run DB migrations
npm test          # run all 38 tests
npm run test:unit        # unit tests only
npm run test:integration # integration tests only
npm audit         # check for known vulnerabilities
```
