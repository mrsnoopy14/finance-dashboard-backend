const pool = require('../db/connection');
const { v4: uuidv4 } = require('uuid');

// Create a new financial record
const createRecord = async (userId, amount, type, category, description, transactionDate) => {
  const id = uuidv4();

  try {
    const result = await pool.query(
      `INSERT INTO financial_records 
       (id, user_id, amount, type, category, description, transaction_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, user_id, amount, type, category, description, transaction_date, created_at, updated_at`,
      [id, userId, amount, type, category, description || null, transactionDate]
    );
    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

// Get record by ID — excludes soft-deleted
const getRecordById = async (recordId) => {
  const result = await pool.query(
    `SELECT id, user_id, amount, type, category, description, transaction_date, created_at, updated_at 
     FROM financial_records WHERE id = $1 AND deleted_at IS NULL`,
    [recordId]
  );
  return result.rows[0];
};

// Get user's records with filters — excludes soft-deleted
const getUserRecords = async (userId, filters = {}) => {
  let query = `SELECT id, user_id, amount, type, category, description, transaction_date, created_at, updated_at 
               FROM financial_records WHERE user_id = $1 AND deleted_at IS NULL`;
  const values = [userId];
  let paramIndex = 2;

  // Add optional filters
  if (filters.startDate) {
    query += ` AND transaction_date >= $${paramIndex}`;
    values.push(filters.startDate);
    paramIndex++;
  }

  if (filters.endDate) {
    query += ` AND transaction_date <= $${paramIndex}`;
    values.push(filters.endDate);
    paramIndex++;
  }

  if (filters.category) {
    query += ` AND category = $${paramIndex}`;
    values.push(filters.category);
    paramIndex++;
  }

  if (filters.type) {
    query += ` AND type = $${paramIndex}`;
    values.push(filters.type);
    paramIndex++;
  }

  query += ` ORDER BY transaction_date DESC`;

  if (filters.limit) {
    query += ` LIMIT $${paramIndex}`;
    values.push(filters.limit);
    paramIndex++;
  }

  if (filters.offset) {
    query += ` OFFSET $${paramIndex}`;
    values.push(filters.offset);
  }

  const result = await pool.query(query, values);
  return result.rows;
};

// Update a record
const updateRecord = async (recordId, userId, updates) => {
  const allowedFields = ['amount', 'type', 'category', 'description', 'transaction_date'];
  const updateFields = [];
  const values = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key) && value !== undefined) {
      updateFields.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }

  if (updateFields.length === 0) {
    throw new Error('No valid fields to update');
  }

  values.push(recordId);
  values.push(userId);
  updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

  const result = await pool.query(
    `UPDATE financial_records 
     SET ${updateFields.join(', ')} 
     WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
     RETURNING id, user_id, amount, type, category, description, transaction_date, created_at, updated_at`,
    values
  );

  if (result.rows.length === 0) {
    throw new Error('Record not found or unauthorized');
  }

  return result.rows[0];
};

// Soft delete a record — sets deleted_at instead of removing the row
const deleteRecord = async (recordId, userId) => {
  const result = await pool.query(
    `UPDATE financial_records 
     SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
     WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
     RETURNING id`,
    [recordId, userId]
  );

  if (result.rows.length === 0) {
    throw new Error('Record not found or unauthorized');
  }

  return { success: true, message: 'Record deleted successfully' };
};

// Get total count of non-deleted records for a user
const getRecordCount = async (userId) => {
  const result = await pool.query(
    'SELECT COUNT(*) as count FROM financial_records WHERE user_id = $1 AND deleted_at IS NULL',
    [userId]
  );
  return parseInt(result.rows[0].count);
};

module.exports = {
  createRecord,
  getRecordById,
  getUserRecords,
  updateRecord,
  deleteRecord,
  getRecordCount,
};
