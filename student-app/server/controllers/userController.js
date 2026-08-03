import * as User from '../models/User.js';
import bcrypt from 'bcryptjs';

const normalizeRole = (role) => (role === 'admin' ? 'administrator' : role);

const isPrivilegedRole = (role) => {
  const normalized = normalizeRole(role);
  return normalized === 'super_admin' || normalized === 'administrator';
};

export const createUserByAdmin = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, department, assignedYear, assignedSemester, assignedSubject } = req.body;
    if (!firstName || !lastName || !email || !password || !role)
      return res.status(400).json({ message: 'All fields are required' });

    const actorRole = normalizeRole(req.user.role);
    const requestedRole = normalizeRole(role);

    if (requestedRole === 'faculty' && !assignedSubject) {
      return res.status(400).json({ message: 'Assigned subject is required for faculty users' });
    }

    const rolesAllowedByActor = actorRole === 'super_admin'
      ? ['student', 'faculty', 'reviewer', 'administrator', 'super_admin']
      : ['student', 'faculty', 'reviewer', 'administrator'];

    if (!rolesAllowedByActor.includes(requestedRole)) {
      return res.status(403).json({ message: 'Access denied: You cannot create this role' });
    }

    const existing = await User.getUserByEmail(email);
    if (existing)
      return res.status(400).json({ message: 'Email already exists' });

    const result = await User.createUser({
      firstName,
      lastName,
      email,
      password,
      role: requestedRole,
      isApproved: true,
      approvedBy: req.user.userId,
      department: requestedRole === 'faculty' ? department : null,
      assignedYear: requestedRole === 'faculty' ? assignedYear : null,
      assignedSemester: requestedRole === 'faculty' ? assignedSemester : null,
      assignedSubject: requestedRole === 'faculty' ? assignedSubject : null
    });
    res.status(201).json({ message: 'User created successfully', userId: result.insertId });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const requesterRole = normalizeRole(req.user.role);
    const users = await User.getAllUsers(role, requesterRole);

    res.json({
      message: 'Users retrieved successfully',
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.getUserById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User retrieved successfully',
      user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { firstName, lastName, role, password, department, assignedYear, assignedSemester, assignedSubject } = req.body;
    const actorRole = normalizeRole(req.user.role);

    const targetUser = await User.getUserById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (isPrivilegedRole(targetUser.role) && actorRole !== 'super_admin') {
      return res.status(403).json({ message: 'Access denied: Cannot modify privileged users' });
    }

    const updatePayload = { firstName, lastName };
    let passwordResetResult = null;

    if (role !== undefined) {
      if (actorRole !== 'super_admin') {
        return res.status(403).json({ message: 'Access denied: Only super admin can change roles' });
      }
      const requestedRole = normalizeRole(role);
      if (requestedRole === 'faculty' && !assignedSubject) {
        return res.status(400).json({ message: 'Assigned subject is required for faculty users' });
      }
      const allowedRoleTargets = ['student', 'faculty', 'reviewer', 'administrator', 'super_admin'];
      if (!allowedRoleTargets.includes(requestedRole)) {
        return res.status(400).json({ message: 'Invalid role provided' });
      }
      updatePayload.role = requestedRole;
      updatePayload.department = department;
      updatePayload.assignedYear = assignedYear || null;
      updatePayload.assignedSemester = assignedSemester || null;
      updatePayload.assignedSubject = assignedSubject || null;
    } else if (targetUser.role === 'faculty') {
      if (assignedSubject !== undefined && !assignedSubject) {
        return res.status(400).json({ message: 'Assigned subject is required for faculty users' });
      }
      updatePayload.department = department;
      updatePayload.assignedYear = assignedYear || null;
      updatePayload.assignedSemester = assignedSemester || null;
      if (assignedSubject !== undefined) updatePayload.assignedSubject = assignedSubject || null;
    }

    if (password !== undefined && password !== '') {
      if (actorRole !== 'super_admin') {
        return res.status(403).json({ message: 'Access denied: Only super admin can reset passwords' });
      }
      if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
      }
      passwordResetResult = await User.updateUserPasswordById(userId, password, true);
    }

    const result = await User.updateUser(userId, updatePayload);

    if (result.affectedRows === 0 && !(passwordResetResult && passwordResetResult.affectedRows > 0)) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const actorRole = normalizeRole(req.user.role);

    const targetUser = await User.getUserById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (targetUser.id === req.user.userId) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    if (isPrivilegedRole(targetUser.role) && actorRole !== 'super_admin') {
      return res.status(403).json({ message: 'Access denied: Cannot delete privileged users' });
    }

    const result = await User.deleteUser(userId);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const approveUserAccount = async (req, res) => {
  try {
    const { userId } = req.params;

    const targetUser = await User.getUserById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!['student', 'faculty'].includes(normalizeRole(targetUser.role))) {
      return res.status(400).json({ message: 'Only student/faculty accounts require approval' });
    }

    if (targetUser.isApproved) {
      return res.status(400).json({ message: 'User is already approved' });
    }

    await User.approveUser(userId, req.user.userId);
    return res.json({ message: 'User approved successfully' });
  } catch (error) {
    console.error('Approve user error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
