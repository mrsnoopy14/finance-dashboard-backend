# API Testing Guide

This file contains practical examples for testing the Finance Dashboard Backend API.

## Setup

Before testing, ensure:
1. Server is running: `npm start`
2. Database is migrated: `npm run migrate`
3. You have curl or Postman installed

---

## Authentication Flow

All protected routes require a JWT token in the `Authorization: Bearer <token>` header.

### Step 1 — Register an Admin User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "System Admin",
    "email": "admin@example.com",
    "password": "AdminPass123!",
    "role": "admin"
  }'
# Response contains: { "token": "<JWT>" }
```

### Step 2 — Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "AdminPass123!"
  }'
# Response contains: { "token": "<JWT>" }
```

### Step 3 — Save Your Token
```bash
# Linux/macOS
ADMIN_TOKEN="<paste-token-here>"

# Use it in all subsequent requests:
# -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Check Your Profile (GET /api/auth/me)
```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## Test Scenarios

### 1. User Management (Admin only)

#### Register an Analyst User via Auth Endpoint
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Analyst",
    "email": "jane@example.com",
    "password": "AnalystPass123!",
    "role": "analyst"
  }'
# Save returned token as ANALYST_TOKEN
```

#### Register a Viewer User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bob Viewer",
    "email": "bob@example.com",
    "password": "ViewerPass123!",
    "role": "viewer"
  }'
```

#### List All Users (Admin only)
```bash
curl "http://localhost:3000/api/users?limit=10&offset=0" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

#### Get User Profile
```bash
USER_ID="<user-id-from-response>"

curl http://localhost:3000/api/users/profile/$USER_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

#### Update User Role (Admin only)
```bash
curl -X PUT http://localhost:3000/api/users/$USER_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"role": "analyst"}'
```

#### Deactivate a User (Admin only)
```bash
curl -X PUT http://localhost:3000/api/users/$USER_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"status": "inactive"}'
```

#### Delete a User (Admin only)
```bash
curl -X DELETE http://localhost:3000/api/users/$USER_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

### 2. Financial Records (Analyst / Admin)

#### Create an Income Record
```bash
curl -X POST http://localhost:3000/api/records \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ANALYST_TOKEN" \
  -d '{
    "amount": 5000.00,
    "type": "income",
    "category": "Salary",
    "description": "Monthly salary",
    "transaction_date": "2024-01-15"
  }'
# Save RECORD_ID from response
```

#### Create an Expense Record
```bash
curl -X POST http://localhost:3000/api/records \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ANALYST_TOKEN" \
  -d '{
    "amount": 1200.00,
    "type": "expense",
    "category": "Rent",
    "description": "Monthly rent payment",
    "transaction_date": "2024-01-10"
  }'
```

#### Get All Records (with pagination)
```bash
curl "http://localhost:3000/api/records?limit=50&offset=0" \
  -H "Authorization: Bearer $ANALYST_TOKEN"
```

#### Filter by Date Range
```bash
curl "http://localhost:3000/api/records?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer $ANALYST_TOKEN"
```

#### Filter by Category and Type
```bash
curl "http://localhost:3000/api/records?category=Salary&type=income" \
  -H "Authorization: Bearer $ANALYST_TOKEN"
```

#### Get a Specific Record
```bash
RECORD_ID="<record-id-from-response>"

curl http://localhost:3000/api/records/$RECORD_ID \
  -H "Authorization: Bearer $ANALYST_TOKEN"
```

#### Update a Record
```bash
curl -X PUT http://localhost:3000/api/records/$RECORD_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ANALYST_TOKEN" \
  -d '{
    "amount": 5500.00,
    "category": "Salary Bonus"
  }'
```

#### Delete a Record
```bash
curl -X DELETE http://localhost:3000/api/records/$RECORD_ID \
  -H "Authorization: Bearer $ANALYST_TOKEN"
```

---

### 3. Dashboard Analytics

#### Full Dashboard
```bash
curl http://localhost:3000/api/analytics/dashboard \
  -H "Authorization: Bearer $ANALYST_TOKEN"
```

#### Financial Summary
```bash
curl http://localhost:3000/api/analytics/summary \
  -H "Authorization: Bearer $VIEWER_TOKEN"
```

#### Category Breakdown (Analyst/Admin)
```bash
curl http://localhost:3000/api/analytics/breakdown/category \
  -H "Authorization: Bearer $ANALYST_TOKEN"
```

#### Type Breakdown
```bash
curl http://localhost:3000/api/analytics/breakdown/type \
  -H "Authorization: Bearer $ANALYST_TOKEN"
```

#### Recent Transactions
```bash
curl "http://localhost:3000/api/analytics/transactions/recent?limit=5" \
  -H "Authorization: Bearer $VIEWER_TOKEN"
```

#### Monthly Trends
```bash
curl "http://localhost:3000/api/analytics/trends/monthly?months=6" \
  -H "Authorization: Bearer $ANALYST_TOKEN"
```

---

### 4. Access Control Testing

#### Viewer Cannot Create Records (expect 403)
```bash
curl -X POST http://localhost:3000/api/records \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $VIEWER_TOKEN" \
  -d '{
    "amount": 1000,
    "type": "income",
    "category": "Test",
    "transaction_date": "2024-01-15"
  }'
# Expected: 403 Forbidden
```

#### Analyst Cannot Manage Users (expect 403)
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ANALYST_TOKEN" \
  -d '{
    "name": "New User",
    "email": "new@example.com",
    "password": "Password123!",
    "role": "viewer"
  }'
# Expected: 403 Forbidden
```

#### Request Without Token (expect 401)
```bash
curl http://localhost:3000/api/records
# Expected: 401 Unauthorized
```

#### Expired / Tampered Token (expect 401)
```bash
curl http://localhost:3000/api/records \
  -H "Authorization: Bearer invalid.token.here"
# Expected: 401 Invalid token
```

---

### 5. Validation Testing

#### Invalid Email Format (expect 400)
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "not-an-email",
    "password": "Password123!",
    "role": "analyst"
  }'
# Expected: 400 Bad Request
```

#### Negative Amount (expect 400)
```bash
curl -X POST http://localhost:3000/api/records \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ANALYST_TOKEN" \
  -d '{
    "amount": -100,
    "type": "income",
    "category": "Test",
    "transaction_date": "2024-01-15"
  }'
# Expected: 400 Bad Request (amount must be positive)
```

#### Duplicate Email (expect 409)
```bash
# Register same email twice
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "User A",
    "email": "dup@example.com",
    "password": "Password123!",
    "role": "viewer"
  }'

curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "User B",
    "email": "dup@example.com",
    "password": "Password123!",
    "role": "viewer"
  }'
# Expected: 409 Conflict
```

#### Wrong Password Login (expect 401)
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "wrongpassword"
  }'
# Expected: 401 Unauthorized
```

---

### 6. Health Check

```bash
curl http://localhost:3000/health
# Expected: 200 OK — no auth required
```

---

## Quick End-to-End Script

```bash
#!/bin/bash
BASE="http://localhost:3000"

echo "=== Health Check ==="
curl -s $BASE/health | python3 -m json.tool

echo ""
echo "=== Register Admin ==="
REGISTER=$(curl -s -X POST $BASE/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@test.com","password":"Admin123!","role":"admin"}')
echo $REGISTER | python3 -m json.tool
TOKEN=$(echo $REGISTER | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])" 2>/dev/null)

echo ""
echo "=== Using token: $TOKEN ==="

echo ""
echo "=== Create Income Record ==="
curl -s -X POST $BASE/api/records \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"amount":5000,"type":"income","category":"Salary","transaction_date":"2024-01-15"}' \
  | python3 -m json.tool

echo ""
echo "=== Dashboard Summary ==="
curl -s $BASE/api/analytics/summary \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

---

Happy Testing!
