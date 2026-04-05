# Finance Data Processing and Access Control Backend

A well-structured Node.js + Express backend for managing financial records with role-based access control, analytics, and dashboard APIs.

## Overview

This backend system supports finance dashboard functionality with the following capabilities:
- User and role management (Viewer, Analyst, Admin)
- Financial record management (CRUD operations)
- Dashboard summary APIs with aggregated analytics
- Role-based access control (RBAC)
- **JWT-based authentication** (register, login, token-protected routes)
- Input validation and error handling
- PostgreSQL persistence

## Project Structure

```
finance-dashboard-backend/
├── src/
│   ├── controllers/          # Route handlers
│   │   ├── authController.js  # JWT login / register / me
│   │   ├── userController.js
│   │   ├── recordController.js
│   │   └── analyticsController.js
│   ├── models/              # Data access layer
│   │   ├── User.js
│   │   ├── FinancialRecord.js
│   │   └── Analytics.js
│   ├── routes/              # API routes
│   │   ├── auth.js           # Public: /api/auth/*
│   │   ├── users.js
│   │   ├── records.js
│   │   └── analytics.js
│   ├── middleware/          # Express middleware
│   │   ├── auth.js          # JWT verification & authorization
│   │   └── validation.js    # Request validation
│   ├── validators/          # Validation schemas
│   │   └── schemas.js
│   ├── db/                  # Database setup
│   │   ├── connection.js
│   │   └── migrations.js
│   └── index.js             # Main application file
├── .env                     # Environment configuration
├── package.json
└── README.md
```

## Quick Start

### Prerequisites
- Node.js (v14+)
- PostgreSQL (v12+)
- npm or yarn

### Installation

1. **Clone or extract the project:**
```bash
cd finance-dashboard-backend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
   - Create/update `.env` file with your database credentials:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=finance_db
DB_USER=postgres
DB_PASSWORD=postgres
PORT=3000
NODE_ENV=development
JWT_SECRET=zorvyn-finance-jwt-secret-2024-change-in-production
JWT_EXPIRES_IN=24h
```

4. **Create PostgreSQL database:**
```bash
psql -U postgres
CREATE DATABASE finance_db;
\q
```

5. **Run migrations:**
```bash
npm run migrate
```

6. **Start the server:**
```bash
npm start
# For development with auto-reload:
npm run dev
```

Server will run on `http://localhost:3000`

## API Reference

### Authentication

All protected endpoints require a JWT token obtained from login or register:
```
Authorization: Bearer <token>
```

**Step 1 — Register / Login:**
```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@example.com","password":"Admin123!","role":"admin"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123!"}'
```

**Step 2 — Use the returned token:**
```bash
curl -H "Authorization: Bearer <your-token>" http://localhost:3000/api/users
```

### Auth Endpoints (Public)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user, returns JWT |
| POST | /api/auth/login | Login, returns JWT |
| GET | /api/auth/me | Get own profile (token required) |


### Role Definitions

- **Viewer**: Can view dashboard data and summaries
- **Analyst**: Can view/create/update/delete records, access detailed analytics
- **Admin**: Full access - manage users, records, and system

### User Management

#### Create User (Admin only)
```
POST /api/users
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "role": "analyst"
}
```

Response:
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "analyst",
    "status": "active",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

#### Get User Profile
```
GET /api/users/profile/:userId
```

#### List All Users (Admin only)
```
GET /api/users?limit=50&offset=0
```

#### Update User (Admin only)
```
PUT /api/users/:userId
Content-Type: application/json

{
  "role": "analyst",
  "status": "active"
}
```

#### Delete User (Admin only)
```
DELETE /api/users/:userId
```

### Financial Records

#### Create Record (Analyst/Admin)
```
POST /api/records
Content-Type: application/json

{
  "amount": 1500.00,
  "type": "income",
  "category": "Salary",
  "description": "Monthly salary",
  "transaction_date": "2024-01-15"
}
```

Response:
```json
{
  "success": true,
  "message": "Record created successfully",
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "amount": 1500.00,
    "type": "income",
    "category": "Salary",
    "description": "Monthly salary",
    "transaction_date": "2024-01-15",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

#### Get Records (Analyst/Admin)
```
GET /api/records?startDate=2024-01-01&endDate=2024-01-31&category=Salary&type=income&limit=50&offset=0
```

Query Parameters:
- `startDate`: Filter by start date (YYYY-MM-DD)
- `endDate`: Filter by end date (YYYY-MM-DD)
- `category`: Filter by category name
- `type`: Filter by type (income|expense)
- `limit`: Number of records (max 100, default 50)
- `offset`: Pagination offset (default 0)

#### Get Specific Record (Analyst/Admin)
```
GET /api/records/:recordId
```

#### Update Record (Analyst/Admin)
```
PUT /api/records/:recordId
Content-Type: application/json

{
  "amount": 1600.00,
  "category": "Bonus"
}
```

#### Delete Record (Analyst/Admin)
```
DELETE /api/records/:recordId
```

### Dashboard & Analytics

#### Get Complete Dashboard
```
GET /api/analytics/dashboard/:userId?startDate=2024-01-01&endDate=2024-01-31
```

Response includes:
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_income": 5000.00,
      "total_expenses": 2000.00,
      "net_balance": 3000.00,
      "total_records": 15
    },
    "categoryBreakdown": [
      {
        "category": "Salary",
        "type": "income",
        "count": 2,
        "total_amount": 3000.00
      }
    ],
    "typeBreakdown": [
      {
        "type": "income",
        "count": 5,
        "total_amount": 5000.00,
        "average_amount": 1000.00
      }
    ],
    "recentTransactions": [...],
    "monthlyTrends": [...]
  }
}
```

#### Get Summary (Viewer/Analyst/Admin)
```
GET /api/analytics/summary/:userId?startDate=2024-01-01&endDate=2024-01-31
```

Returns: total_income, total_expenses, net_balance, total_records

#### Get Category Breakdown (Analyst/Admin)
```
GET /api/analytics/breakdown/category/:userId?startDate=2024-01-01&endDate=2024-01-31
```

#### Get Type Breakdown (Analyst/Admin)
```
GET /api/analytics/breakdown/type/:userId?startDate=2024-01-01&endDate=2024-01-31
```

#### Get Recent Transactions (Viewer/Analyst/Admin)
```
GET /api/analytics/transactions/recent/:userId?limit=10
```

#### Get Monthly Trends (Analyst/Admin)
```
GET /api/analytics/trends/monthly/:userId?months=12
```

## Data Modeling

### Users Table
```sql
- id (UUID, Primary Key)
- name (VARCHAR 255)
- email (VARCHAR 255, UNIQUE)
- password_hash (VARCHAR 255)
- role (VARCHAR 50) - viewer, analyst, admin
- status (VARCHAR 20) - active, inactive
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Financial Records Table
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key)
- amount (DECIMAL 15,2)
- type (VARCHAR 50) - income, expense
- category (VARCHAR 100)
- description (TEXT)
- transaction_date (DATE)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

## Access Control Rules

| Action | Viewer | Analyst | Admin |
|--------|--------|---------|-------|
| View own dashboard | ✓ | ✓ | ✓ |
| Create records | ✗ | ✓ | ✓ |
| View own records | ✗ | ✓ | ✓ |
| Update own records | ✗ | ✓ | ✓ |
| Delete own records | ✗ | ✓ | ✓ |
| Manage users | ✗ | ✗ | ✓ |
| View others' records | ✗ | ✗ | ✓ |
| View analytics breakdowns | ✗ | ✓ | ✓ |

## Error Handling

All errors follow a consistent format:
```json
{
  "success": false,
  "message": "Human-readable error message",
  "error": "Technical error details (in dev mode)"
}
```

### Common Status Codes
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (missing authentication)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `409`: Conflict (duplicate email)
- `500`: Internal Server Error

### Validation Errors
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "\"email\" must be a valid email"
    }
  ]
}
```

## Key Design Decisions

### 1. Authentication Approach
- **JWT-based authentication** using `jsonwebtoken`
- Tokens are signed with `JWT_SECRET` and expire in 24 hours (configurable)
- Public routes: `/api/auth/register`, `/api/auth/login`, `/health`
- All other routes require a valid `Authorization: Bearer <token>` header
- Token payload carries `id`, `email`, and `role` — no DB lookup needed per request

### 2. Data Validation
- Used Joi for comprehensive request validation
- Validates both body and query parameters
- Clear error messages for failed validations

### 3. Database Strategy
- PostgreSQL for reliability and ACID compliance
- Normalized schema with proper foreign keys
- Indexes on frequently queried columns
- UUID primary keys for better scalability

### 4. Separation of Concerns
- Models: Data access logic
- Controllers: Business logic and request handling
- Routes: Endpoint definitions
- Middleware: Cross-cutting concerns (auth, validation)

### 5. Access Control
- Role-based middleware for authorization
- Middleware composition for flexible permission checks
- User ownership validation for record operations

## Assumptions & Simplifications

1. **Authentication**: JWT token-based via `Authorization: Bearer <token>` header.
2. **Password Storage**: Passwords are hashed with bcryptjs (10 salt rounds).
3. **Timestamps**: Uses PostgreSQL CURRENT_TIMESTAMP for server-side consistency.
4. **Soft Deletes**: Not implemented — using hard deletes. Soft deletes can be added if audit trail needed.
5. **Rate Limiting**: Not implemented but can be added with express-rate-limit middleware.
6. **Logging**: Basic console logging. Production should use structured logging (Winston, Bunyan).

## Testing

Basic curl examples for testing the API:

```bash
# Create a test user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "user-role: admin" \
  -H "user-id: admin-123" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "role": "analyst"
  }'

# Create a financial record
curl -X POST http://localhost:3000/api/records \
  -H "Content-Type: application/json" \
  -H "user-role: analyst" \
  -H "user-id: user-123" \
  -d '{
    "amount": 1000,
    "type": "income",
    "category": "Salary",
    "transaction_date": "2024-01-15"
  }'

# Get dashboard
curl http://localhost:3000/api/analytics/dashboard/user-123 \
  -H "user-role: analyst" \
  -H "user-id: user-123"
```

## Environment Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| DB_HOST | localhost | PostgreSQL host |
| DB_PORT | 5432 | PostgreSQL port |
| DB_NAME | finance_db | Database name |
| DB_USER | postgres | Database user |
| DB_PASSWORD | postgres | Database password |
| PORT | 3000 | Server port |
| NODE_ENV | development | Environment (development/production) |
| JWT_SECRET | — | Secret key for signing JWTs |
| JWT_EXPIRES_IN | 24h | Token expiry duration |

## Potential Enhancements

1. **Pagination**: Add cursor-based pagination for large datasets
2. **Search**: Full-text search on description and category fields
3. **Soft Deletes**: Track deleted records with is_deleted flag
4. **Audit Trail**: Log all changes to records with user tracking
5. **File Export**: Export records to CSV/PDF
6. **Budget Tracking**: Set and track budget limits
7. **Recurring Records**: Support for recurring transactions
8. **Transactions**: Multi-step operations with rollback support
9. **API Documentation**: Swagger/OpenAPI documentation
10. **Rate Limiting**: express-rate-limit for DDoS protection

## Known Limitations

1. No file upload support
2. No transaction support for multi-step operations
3. No caching layer (Redis would improve performance)
4. No API rate limiting
5. No request logging middleware
6. No HTTPS enforcement (should be enabled in production)

## Deployment Notes

For production deployment:
1. Use environment variables from secure vault (not .env file)
2. Enable HTTPS/SSL
3. Use connection pooling with appropriate sizes
4. Implement proper JWT authentication
5. Add comprehensive logging and monitoring
6. Use database backups and replication
7. Implement rate limiting and DDoS protection
8. Add API versioning for backwards compatibility

## Support & Questions

For questions about this assignment implementation, refer to the code comments and inline documentation.

---

**Assignment Submission:** Finance Data Processing and Access Control Backend  
**Submitted By:** Shashi Shekhar  
**Email:** shekharshashi127@gmail.com  
**Date:** April 2024
