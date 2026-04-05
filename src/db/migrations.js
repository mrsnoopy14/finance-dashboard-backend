const pool = require('./connection');

const schema = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'viewer',
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Financial records table
CREATE TABLE IF NOT EXISTS financial_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(15, 2) NOT NULL,
  type VARCHAR(50) NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT,
  transaction_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_type CHECK (type IN ('income', 'expense'))
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_financial_records_user_id ON financial_records(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_records_date ON financial_records(transaction_date);
CREATE INDEX IF NOT EXISTS idx_financial_records_category ON financial_records(category);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
`;

async function runMigrations() {
  try {
    console.log('Running database migrations...');
    await pool.query(schema);
    console.log('✓ Database schema created successfully');
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    throw error;
  }
}

// Allow running directly: node src/db/migrations.js  /  npm run migrate
if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { runMigrations };
