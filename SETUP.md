# Setup & Installation Guide

Complete step-by-step guide to set up and run the Finance Dashboard Backend.

## Prerequisites

Ensure you have the following installed on your system:

### Required
- **Node.js** (v14.0.0 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **PostgreSQL** (v12 or higher) - [Download](https://www.postgresql.org/download/)

### Verify Installation
```bash
node --version    # Should be v14+
npm --version     # Should be v6+
psql --version    # Should be v12+
```

## Step-by-Step Setup

### Step 1: Navigate to Project Directory

```bash
cd c:\Users\shekh\Desktop\zorvyn
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages listed in `package.json`:
- `express` - Web framework
- `pg` - PostgreSQL driver
- `dotenv` - Environment variable management
- `joi` - Request validation
- `bcryptjs` - Password hashing
- `cors` - Cross-origin support
- `uuid` - Unique ID generation
- `nodemon` - Auto-reload (development)

### Step 3: Set Up PostgreSQL Database

#### Option A: Using PostgreSQL GUI (pgAdmin)
1. Open pgAdmin (usually at `http://localhost:5050`)
2. Right-click "Databases" → Create → Database
3. Enter name: `finance_db`
4. Click Save

#### Option B: Using Command Line
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE finance_db;

# Verify
\l

# Exit
\q
```

### Step 4: Verify Database Connection

Edit `.env` file to match your PostgreSQL credentials:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=finance_db
DB_USER=postgres
DB_PASSWORD=postgres
PORT=3000
NODE_ENV=development
JWT_SECRET=your-secret-key-change-in-production
```

### Step 5: Run Database Migrations

```bash
npm run migrate
```

Expected output:
```
Running database migrations...
✓ Database schema created successfully
```

This will create:
- `users` table
- `financial_records` table
- Necessary indexes

### Step 6: Start the Server

#### Development Mode (with auto-reload)
```bash
npm run dev
```

#### Production Mode
```bash
npm start
```

Expected output:
```
✓ Server running on port 3000
✓ Environment: development
```

### Step 7: Verify Server is Running

In a new terminal, test the health endpoint:

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Configuration

### Environment Variables

All configuration is managed via `.env` file:

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` | localhost | PostgreSQL server address |
| `DB_PORT` | 5432 | PostgreSQL port |
| `DB_NAME` | finance_db | Database name |
| `DB_USER` | postgres | Database user |
| `DB_PASSWORD` | postgres | Database password |
| `PORT` | 3000 | Server port |
| `NODE_ENV` | development | Environment mode |
| `JWT_SECRET` | your-secret-key | Secret for JWT tokens |

### Development vs Production

**Development:**
- Error details shown in responses
- Console logging enabled
- Auto-reload with nodemon
- CORS enabled for all origins

**Production:**
- Error details hidden from responses
- Structured logging recommended
- HTTPS required
- Strict CORS configuration recommended

## Testing the API

### Quick Test

Create test users and records:

```bash
# Create admin user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "user-id: admin-test" \
  -H "user-role: admin" \
  -d '{
    "name": "Admin User",
    "email": "admin@example.com",
    "password": "AdminPass123!",
    "role": "admin"
  }'

# Create analyst user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "user-id: admin-test" \
  -H "user-role: admin" \
  -d '{
    "name": "Test Analyst",
    "email": "analyst@example.com",
    "password": "AnalystPass123!",
    "role": "analyst"
  }'
```

### Comprehensive Testing

See [API-TESTING.md](./API-TESTING.md) for detailed test scenarios and examples.

## Troubleshooting

### Issue: "Cannot connect to database"

**Solution:**
1. Verify PostgreSQL is running:
   ```bash
   pg_isready
   ```
2. Check database credentials in `.env`
3. Verify database exists:
   ```bash
   psql -U postgres -l | grep finance_db
   ```

### Issue: "Port 3000 already in use"

**Solution:**
Change port in `.env`:
```env
PORT=3001
```

Or kill the process using port 3000:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :3000
kill -9 <PID>
```

### Issue: "npm install fails"

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Reinstall
rm -rf node_modules
npm install
```

### Issue: "Migration script fails"

**Solution:**
1. Verify database is created and empty
2. Check database connection in `.env`
3. Manually create tables (see migrations.js)

### Issue: "Permission denied" on database operations

**Solution:**
Recreate the database with proper permissions:
```bash
# Connect as superuser
psql -U postgres

# Drop and recreate
DROP DATABASE IF EXISTS finance_db;
CREATE DATABASE finance_db;
\q
```

## Docker Setup (Optional)

For containerized deployment:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t finance-backend .
docker run -p 3000:3000 --env-file .env finance-backend
```

## Docker Compose (Optional)

For development with PostgreSQL in Docker:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: finance_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      DB_HOST: postgres
      DB_NAME: finance_db
      DB_USER: postgres
      DB_PASSWORD: postgres
    depends_on:
      - postgres

volumes:
  postgres_data:
```

Run with:
```bash
docker-compose up
```

## Project Structure

```
finance-dashboard-backend/
├── src/
│   ├── controllers/           # API request handlers
│   │   ├── userController.js
│   │   ├── recordController.js
│   │   └── analyticsController.js
│   ├── models/               # Data access layer
│   │   ├── User.js
│   │   ├── FinancialRecord.js
│   │   └── Analytics.js
│   ├── routes/               # API endpoints
│   │   ├── users.js
│   │   ├── records.js
│   │   └── analytics.js
│   ├── middleware/           # Express middleware
│   │   ├── auth.js          # Auth & authorization
│   │   └── validation.js    # Request validation
│   ├── validators/           # Validation schemas
│   │   └── schemas.js
│   ├── db/                   # Database config
│   │   ├── connection.js
│   │   └── migrations.js
│   └── index.js              # Main app entry
├── .env                      # Environment config
├── .gitignore               # Git ignore rules
├── package.json             # Dependencies
├── README.md                # API documentation
├── ARCHITECTURE.md          # System design
├── API-TESTING.md          # Test examples
└── SETUP.md                # This file
```

## Common Commands

```bash
# Start development server
npm run dev

# Start production server
npm start

# Run database migrations
npm run migrate

# Run tests (when implemented)
npm test

# Install dependencies
npm install

# Update dependencies
npm update

# Check for security vulnerabilities
npm audit
```

## Performance Optimization

### Database Optimization
- Indexes created on frequently queried columns
- Connection pooling enabled
- Query optimization with selective projections

### API Optimization
- Pagination implemented (limit/offset)
- Efficient filtering at database level
- JSON responses optimized

### Caching (Future)
- Redis for session caching
- Response caching for analytics
- Database query result caching

## Security Checklist

- [ ] Change default PostgreSQL password
- [ ] Update JWT_SECRET in .env
- [ ] Enable HTTPS in production
- [ ] Configure CORS for specific origins
- [ ] Implement rate limiting
- [ ] Add logging and monitoring
- [ ] Regular security audits
- [ ] Keep dependencies updated

## Production Deployment

### Pre-deployment Checklist

1. **Environment Configuration**
   - Set NODE_ENV=production
   - Use strong, random JWT_SECRET
   - Secure database credentials

2. **Database**
   - Backup existing data
   - Verify backup restores correctly
   - Set up database replication

3. **Application**
   - Run npm audit to check for vulnerabilities
   - Test all endpoints
   - Verify error handling

4. **Security**
   - Enable HTTPS/SSL
   - Configure firewall rules
   - Set up monitoring and alerts

### Deployment Options

**AWS**
- Deploy to EC2 or ECS
- Use RDS for PostgreSQL
- CloudFront for CDN

**Heroku**
```bash
heroku create your-app-name
git push heroku main
heroku config:set DB_HOST=...
```

**DigitalOcean**
- Deploy to Droplet
- Use Managed PostgreSQL
- Configure SSL with Let's Encrypt

**Azure**
- Deploy to App Service
- Use Azure Database for PostgreSQL
- Application Insights for monitoring

## Monitoring & Logging

### Recommended Tools
- **Logging**: Winston, Bunyan
- **Monitoring**: New Relic, DataDog, Prometheus
- **Error Tracking**: Sentry
- **APM**: New Relic APM, Elastic APM

### Basic Health Checks
```bash
# Check API health
curl http://localhost:3000/health

# Monitor logs
tail -f npm-debug.log
```

## Next Steps

1. **Complete API Testing**: See [API-TESTING.md](./API-TESTING.md)
2. **Review Architecture**: See [ARCHITECTURE.md](./ARCHITECTURE.md)
3. **Implement Enhancements**: Consider JWT authentication, rate limiting
4. **Setup Monitoring**: Configure logging and error tracking
5. **Plan Deployment**: Choose hosting platform and setup CI/CD

## Support

For issues or questions:
1. Check the README.md for API documentation
2. Review ARCHITECTURE.md for design details
3. Check API-TESTING.md for test examples
4. Review logs for error details

---

**Happy Building!** 🚀

For the Finance Dashboard Backend Internship Assignment
