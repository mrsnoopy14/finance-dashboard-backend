const pool = require('../db/connection');

// Get financial summary for a user
const getSummary = async (userId, filters = {}) => {
  let query = `
    SELECT 
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expenses,
      COALESCE(COUNT(*), 0) as total_records
    FROM financial_records 
    WHERE user_id = $1
  `;
  const values = [userId];
  let paramIndex = 2;

  if (filters.startDate) {
    query += ` AND transaction_date >= $${paramIndex}`;
    values.push(filters.startDate);
    paramIndex++;
  }

  if (filters.endDate) {
    query += ` AND transaction_date <= $${paramIndex}`;
    values.push(filters.endDate);
  }

  const result = await pool.query(query, values);
  const row = result.rows[0];

  return {
    total_income: parseFloat(row.total_income),
    total_expenses: parseFloat(row.total_expenses),
    net_balance: parseFloat(row.total_income) - parseFloat(row.total_expenses),
    total_records: parseInt(row.total_records),
  };
};

// Get category-wise breakdown
const getCategoryBreakdown = async (userId, filters = {}) => {
  let query = `
    SELECT 
      category,
      type,
      COUNT(*) as count,
      SUM(amount) as total_amount
    FROM financial_records 
    WHERE user_id = $1
  `;
  const values = [userId];
  let paramIndex = 2;

  if (filters.startDate) {
    query += ` AND transaction_date >= $${paramIndex}`;
    values.push(filters.startDate);
    paramIndex++;
  }

  if (filters.endDate) {
    query += ` AND transaction_date <= $${paramIndex}`;
    values.push(filters.endDate);
  }

  query += ` GROUP BY category, type ORDER BY total_amount DESC`;

  const result = await pool.query(query, values);
  return result.rows.map(row => ({
    category: row.category,
    type: row.type,
    count: parseInt(row.count),
    total_amount: parseFloat(row.total_amount),
  }));
};

// Get recent transactions
const getRecentTransactions = async (userId, limit = 10) => {
  const result = await pool.query(
    `SELECT id, amount, type, category, description, transaction_date, created_at 
     FROM financial_records 
     WHERE user_id = $1 
     ORDER BY transaction_date DESC, created_at DESC 
     LIMIT $2`,
    [userId, limit]
  );
  return result.rows;
};

// Get monthly trends
const getMonthlyTrends = async (userId, months = 12) => {
  const result = await pool.query(
    `SELECT 
      DATE_TRUNC('month', transaction_date) as month,
      SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
      SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expenses,
      COUNT(*) as transaction_count
    FROM financial_records
    WHERE user_id = $1 
      AND transaction_date >= CURRENT_DATE - make_interval(months => $2)
    GROUP BY DATE_TRUNC('month', transaction_date)
    ORDER BY month DESC`,
    [userId, parseInt(months)]
  );

  return result.rows.map(row => ({
    month: row.month,
    income: parseFloat(row.income || 0),
    expenses: parseFloat(row.expenses || 0),
    net: parseFloat((row.income || 0) - (row.expenses || 0)),
    transaction_count: parseInt(row.transaction_count),
  }));
};

// Get type-wise breakdown (income vs expense)
const getTypeBreakdown = async (userId, filters = {}) => {
  let query = `
    SELECT 
      type,
      COUNT(*) as count,
      SUM(amount) as total_amount,
      AVG(amount) as average_amount
    FROM financial_records 
    WHERE user_id = $1
  `;
  const values = [userId];
  let paramIndex = 2;

  if (filters.startDate) {
    query += ` AND transaction_date >= $${paramIndex}`;
    values.push(filters.startDate);
    paramIndex++;
  }

  if (filters.endDate) {
    query += ` AND transaction_date <= $${paramIndex}`;
    values.push(filters.endDate);
  }

  query += ` GROUP BY type`;

  const result = await pool.query(query, values);
  return result.rows.map(row => ({
    type: row.type,
    count: parseInt(row.count),
    total_amount: parseFloat(row.total_amount),
    average_amount: parseFloat(row.average_amount),
  }));
};

module.exports = {
  getSummary,
  getCategoryBreakdown,
  getRecentTransactions,
  getMonthlyTrends,
  getTypeBreakdown,
};
