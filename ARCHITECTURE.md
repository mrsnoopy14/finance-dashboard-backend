# Architecture & Design Document

## System Architecture

This document outlines the architecture and design decisions for the Finance Dashboard Backend.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Application                      │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP Requests
                         ▼
┌─────────────────────────────────────────────────────────────┐
│               Express.js API Server                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Middleware Layer                                    │   │
│  │ ├─ Authentication (user-id, user-role headers)    │   │
│  │ ├─ CORS & JSON parsing                            │   │
│  │ └─ Request validation (Joi schemas)               │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Route Layer                                         │   │
│  │ ├─ /api/users       (User management)             │   │
│  │ ├─ /api/records     (Financial records)           │   │
│  │ └─ /api/analytics   (Dashboard & summaries)       │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Controller Layer                                    │   │
│  │ ├─ userController                                  │   │
│  │ ├─ recordController                                │   │
│  │ └─ analyticsController                             │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Model/Service Layer                                │   │
│  │ ├─ User model (create, read, update, delete)      │   │
│  │ ├─ FinancialRecord model (CRUD operations)        │   │
│  │ └─ Analytics models (aggregations & insights)     │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Database Connection Pool                            │   │
│  └─────────────────────────────────────────────────────┘   │
└──────────────────────────┬────────────────────────────────────┘
                           │
                           ▼
                    PostgreSQL Database
```

## Design Patterns Used

### 1. MVC (Model-View-Controller)
- **Models**: Handle data access and business logic
- **Controllers**: Process requests and coordinate with models
- **Routes**: Define API endpoints

### 2. Middleware Pattern
- Request validation middleware
- Authentication & authorization middleware
- Error handling middleware

### 3. Repository Pattern (Models)
Each model encapsulates database operations, making it easy to swap implementations or add caching.

### 4. Service Layer Approach
Analytics model acts as a service layer, providing complex query aggregations.

### 5. Separation of Concerns
- Validation logic separated into schemas
- Auth logic separated into middleware
- Business logic separated from route handlers

## Data Flow

### Create Record Flow
```
Client Request
    ↓
Authentication Middleware (validate user-id, user-role)
    ↓
Route Handler (/api/records POST)
    ↓
Validation Middleware (validate request body with Joi schema)
    ↓
Authorization Middleware (check if analyst or admin)
    ↓
Controller Handler (recordController.createRecord)
    ↓
Model Layer (FinancialRecord.createRecord)
    ↓
Database Query (INSERT into financial_records)
    ↓
Response to Client
```

### Dashboard Summary Flow
```
Client Request
    ↓
Authentication & Authorization
    ↓
Analytics Controller (analyticsController.getSummary)
    ↓
Analytics Model Functions (run in parallel):
    - getSummary
    - getCategoryBreakdown
    - getTypeBreakdown
    - getRecentTransactions
    - getMonthlyTrends
    ↓
Database Queries (SELECT with aggregations)
    ↓
Format & Aggregate Results
    ↓
Response with Complete Dashboard Data
```

## Database Schema Design

### Users Table
- **Purpose**: Store user accounts and role information
- **Indexes**: email (unique), id (primary)
- **Constraints**: Email uniqueness, role validation at application level

### Financial Records Table
- **Purpose**: Store all financial transactions
- **Indexes**: user_id (foreign key), transaction_date, category
- **Constraints**: Amount > 0, type IN ('income', 'expense')
- **Relationships**: user_id references users.id (cascade delete)

### Design Rationale
- Normalized schema avoids data duplication
- Proper foreign keys maintain referential integrity
- Indexes optimize query performance
- UUID primary keys ensure global uniqueness

## Authentication & Authorization

### Authentication Strategy
- **Current**: Header-based (user-id, user-role)
- **Production**: Should use JWT tokens with proper signature verification
- **Session Management**: Currently stateless

### Authorization Strategy (RBAC)
```
┌──────────────┬──────┬────────┬───────┐
│   Action     │Viewer│Analyst│ Admin │
├──────────────┼──────┼────────┼───────┤
│View own data │  ✓   │   ✓    │   ✓   │
│Create record │  ✗   │   ✓    │   ✓   │
│Update record │  ✗   │   ✓    │   ✓   │
│Delete record │  ✗   │   ✓    │   ✓   │
│Manage users  │  ✗   │   ✗    │   ✓   │
│View reports  │  ✓   │   ✓    │   ✓   │
└──────────────┴──────┴────────┴───────┘
```

### Enforcement Points
1. **Route Level**: Using `authorizeRoles` middleware
2. **Record Level**: Ownership checks in controllers
3. **Data Access**: User_id filtering in queries

## Error Handling Strategy

### Error Classification
1. **Validation Errors (400)**: Invalid input data
2. **Authentication Errors (401)**: Missing/invalid credentials
3. **Authorization Errors (403)**: Insufficient permissions
4. **Not Found (404)**: Resource doesn't exist
5. **Conflict (409)**: Duplicate data, constraint violation
6. **Server Errors (500)**: Unexpected failures

### Error Response Format
```json
{
  "success": false,
  "message": "Human-readable message",
  "error": "Technical details (dev mode only)"
}
```

### Error Handling Flow
```
Request → Route Handler
    ↓ (throws error)
Try-Catch Block → Determine error type
    ↓
Map to appropriate HTTP status code
    ↓
Format response
    ↓
Send to client
```

## Performance Considerations

### Query Optimization
- **Indexes**: Created on frequently searched columns
- **Projection**: SELECT only needed columns
- **Filtering**: Apply WHERE clauses in database, not application
- **Pagination**: LIMIT/OFFSET for large datasets

### Example: Efficient Query Design
```sql
-- Good: Database does filtering and aggregation
SELECT 
  category,
  SUM(amount) as total
FROM financial_records
WHERE user_id = $1 AND transaction_date >= $2
GROUP BY category

-- Bad: Application filters and aggregates
SELECT * FROM financial_records WHERE user_id = $1
-- (process all rows in app)
```

### Connection Management
- PostgreSQL connection pool prevents connection exhaustion
- Pool size optimized for concurrent requests
- Connections reused across requests

## Scalability Considerations

### Current Limitations
1. Single database instance
2. No caching layer
3. No query result caching
4. No background job processing

### Scaling Strategies
1. **Database Scaling**:
   - Read replicas for analytics queries
   - Database partitioning by user_id
   - Archive old records to separate storage

2. **Application Scaling**:
   - Horizontal scaling with load balancer
   - Stateless design enables scaling
   - Cache frequently accessed data (Redis)

3. **API Optimization**:
   - Implement pagination
   - Add request caching
   - Use GraphQL for flexible queries

## Security Considerations

### Current Implementation
- Password hashing with bcryptjs
- No SQL injection (using parameterized queries)
- CORS enabled (configurable)
- Input validation on all endpoints

### Production Hardening Needed
1. HTTPS/TLS enforcement
2. Rate limiting per IP/user
3. Request size limits
4. CSRF protection
5. Security headers (HSTS, X-Frame-Options, etc.)
6. Input sanitization for injection attacks
7. Audit logging for sensitive operations

## Monitoring & Observability

### Current Logging
- Console logging for key events
- Error messages in responses

### Recommended Enhancements
1. **Structured Logging**: Winston/Bunyan
2. **Metrics**: Prometheus for performance metrics
3. **Tracing**: Distributed tracing for request flow
4. **Monitoring**: Alert on error rates, latency
5. **Health Checks**: Database connectivity verification

## Deployment Architecture

### Development
```
npm install → npm run migrate → npm run dev
```

### Production
```
Docker Container
    ↓
Kubernetes Pod (optional)
    ↓
Load Balancer
    ↓
PostgreSQL (managed service)
```

## API Versioning Strategy

### Current
- Single version at `/api/v1` (implicit)

### Future
- Support multiple versions simultaneously
- Deprecation path for old versions
- Version in URL: `/api/v1/`, `/api/v2/`

## Testing Strategy

### Unit Tests
- Models: Database operations
- Controllers: Business logic
- Utilities: Helper functions

### Integration Tests
- Full request flows
- Authentication/authorization
- Database transactions

### E2E Tests
- Complete API scenarios
- User workflows
- Error cases

## Documentation Strategy

### API Documentation
- OpenAPI/Swagger for automated documentation
- README with setup instructions
- API-TESTING.md with examples
- Architecture document (this file)

### Code Documentation
- JSDoc comments for functions
- Inline comments for complex logic
- Type hints (can use TypeScript for production)

## Assumptions Made

### 1. Authentication
- Simplified for assignment: headers-based
- User-id and user-role sent by trusted client

### 2. Data Ownership
- Only admins can access other users' data
- Non-admin users can only access their own records

### 3. Timestamps
- All timestamps in UTC
- Created_at never changes
- Updated_at changes with each update

### 4. Deletions
- Hard deletes (permanent deletion)
- Cascade delete from users to records

### 5. Concurrency
- No optimistic locking implemented
- Last-write-wins for concurrent updates

## Future Improvements

### Phase 1 (MVP Extensions)
- JWT authentication
- Email verification
- Password reset flow

### Phase 2 (Features)
- Recurring transactions
- Budget tracking
- Receipt upload

### Phase 3 (Advanced)
- Machine learning for spending predictions
- Multi-currency support
- Export to PDF/Excel
- Mobile API optimization

### Phase 4 (Enterprise)
- Role-based access control (fine-grained)
- Audit trail for compliance
- Multi-tenant support
- Advanced reporting

---

For questions about specific design decisions, refer to code comments and this document.
