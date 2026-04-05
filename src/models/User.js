const pool = require('../db/connection');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Create a new user
const createUser = async (name, email, password, role = 'viewer') => {
  const id = uuidv4();
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const result = await pool.query(
      `INSERT INTO users (id, name, email, password_hash, role, status)
       VALUES ($1, $2, $3, $4, $5, 'active')
       RETURNING id, name, email, role, status, created_at`,
      [id, name, email, hashedPassword, role]
    );
    return result.rows[0];
  } catch (error) {
    if (error.code === '23505') {
      throw new Error('Email already exists');
    }
    throw error;
  }
};

// Get user by ID (no password hash)
const getUserById = async (userId) => {
  const result = await pool.query(
    `SELECT id, name, email, role, status, created_at, updated_at FROM users WHERE id = $1`,
    [userId]
  );
  return result.rows[0];
};

// Get user by email including password hash (for login)
const getUserByEmail = async (email) => {
  const result = await pool.query(
    `SELECT id, name, email, role, status, password_hash FROM users WHERE email = $1`,
    [email]
  );
  return result.rows[0];
};

// Get all users (admin only)
const getAllUsers = async (limit = 50, offset = 0) => {
  const result = await pool.query(
    `SELECT id, name, email, role, status, created_at, updated_at 
     FROM users 
     ORDER BY created_at DESC 
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return result.rows;
};

// Update user
const updateUser = async (userId, updates) => {
  const allowedFields = ['name', 'email', 'role', 'status'];
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

  values.push(userId);
  updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

  const result = await pool.query(
    `UPDATE users 
     SET ${updateFields.join(', ')} 
     WHERE id = $${paramIndex}
     RETURNING id, name, email, role, status, created_at, updated_at`,
    values
  );

  if (result.rows.length === 0) {
    throw new Error('User not found');
  }

  return result.rows[0];
};

// Delete user
const deleteUser = async (userId) => {
  const result = await pool.query(
    `DELETE FROM users WHERE id = $1 RETURNING id`,
    [userId]
  );

  if (result.rows.length === 0) {
    throw new Error('User not found');
  }

  return { success: true, message: 'User deleted successfully' };
};

// Get user count
const getUserCount = async () => {
  const result = await pool.query('SELECT COUNT(*) as count FROM users');
  return parseInt(result.rows[0].count);
};

module.exports = {
  createUser,
  getUserById,
  getUserByEmail,
  getAllUsers,
  updateUser,
  deleteUser,
  getUserCount,
};
