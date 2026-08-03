import pool from '../config/database.js';
import bcrypt from 'bcryptjs';

export const createUser = async (userData) => {
  const {
    firstName,
    lastName,
    email,
    password,
    role,
    isApproved = null,
    approvedBy = null,
    mustChangePassword = false,
    department = null,
    assignedYear = null,
    assignedSemester = null,
    assignedSubject = null
  } = userData;
  const hashedPassword = await bcrypt.hash(password, 10);

  const isApprovalFlag = role === 'student' || role === 'faculty'
    ? (isApproved === true ? 1 : 0)
    : 1;
  const approvedAt = isApprovalFlag === 1 ? 'NOW()' : 'NULL';
  const approverId = approvedBy || null;

  const query = `
    INSERT INTO users (firstName, lastName, email, password, role, isApproved, approvedBy, approvedAt, mustChangePassword, department, assignedYear, assignedSemester, assignedSubject, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ${approvedAt}, ?, ?, ?, ?, ?, NOW())
  `;
  const [result] = await pool.execute(query, [firstName, lastName, email, hashedPassword, role, isApprovalFlag, approverId, mustChangePassword ? 1 : 0, department, assignedYear, assignedSemester, assignedSubject]);
  
  return result;
};

export const getUserByEmail = async (email) => {
  const query = 'SELECT * FROM users WHERE email = ?';
  const [rows] = await pool.execute(query, [email]);
  
  return rows[0];
};

export const getUserById = async (userId) => {
  const query = 'SELECT id, firstName, lastName, email, role, isApproved, approvedBy, approvedAt, mustChangePassword, department, assignedYear, assignedSemester, assignedSubject, createdAt FROM users WHERE id = ?';
  const [rows] = await pool.execute(query, [userId]);

  return rows[0];
};

export const getAllUsers = async (role = null, requesterRole = null) => {
  let query = 'SELECT id, firstName, lastName, email, role, isApproved, approvedBy, approvedAt, mustChangePassword, department, assignedYear, assignedSemester, assignedSubject, createdAt FROM users';
  const params = [];
  const conditions = [];
  
  if (role) {
    conditions.push('role = ?');
    params.push(role);
  }

  if (requesterRole === 'administrator') {
    conditions.push("role <> 'super_admin'");
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }
  
  const [rows] = await pool.execute(query, params);
  return rows;
};

export const updateUser = async (userId, updateData) => {
  const allowedFields = ['firstName', 'lastName', 'role', 'password', 'department', 'assignedYear', 'assignedSemester', 'assignedSubject'];
  const updates = [];
  const params = [];
  
  for (const [key, value] of Object.entries(updateData)) {
    if (allowedFields.includes(key)) {
      if (key === 'password') {
        const hashedPassword = await bcrypt.hash(value, 10);
        updates.push('password = ?');
        params.push(hashedPassword);
      } else {
        updates.push(`${key} = ?`);
        params.push(value);
      }
    }
  }
  
  if (updates.length === 0) return { affectedRows: 0 };
  
  params.push(userId);
  const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
  const [result] = await pool.execute(query, params);
  
  return result;
};

export const deleteUser = async (userId) => {
  const query = 'DELETE FROM users WHERE id = ?';
  const [result] = await pool.execute(query, [userId]);
  
  return result;
};

export const verifyPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

export const approveUser = async (userId, approverId) => {
  const query = 'UPDATE users SET isApproved = 1, approvedBy = ?, approvedAt = NOW() WHERE id = ?';
  const [result] = await pool.execute(query, [approverId, userId]);
  return result;
};

export const updateUserPasswordById = async (userId, plainPassword, mustChangePassword = false) => {
  const hashedPassword = await bcrypt.hash(plainPassword, 10);
  const query = 'UPDATE users SET password = ?, mustChangePassword = ? WHERE id = ?';
  const [result] = await pool.execute(query, [hashedPassword, mustChangePassword ? 1 : 0, userId]);
  return result;
};
