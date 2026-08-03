import { createUser, getUserByEmail, verifyPassword, getUserById, updateUserPasswordById } from '../models/User.js';
import { generateToken } from '../utils/jwt.js';
import { sendPasswordResetEmail } from '../utils/email.js';

const generateTemporaryPassword = (length = 10) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let i = 0; i < length; i += 1) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  return password;
};

export const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, confirmPassword, role } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !password || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    if (!['student', 'faculty'].includes(role)) {
      return res.status(400).json({ message: 'Only student and faculty can self-register' });
    }

    // Check if user exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Create user
    const result = await createUser({
      firstName,
      lastName,
      email,
      password,
      role,
      isApproved: false,
      approvedBy: null
    });

    res.status(201).json({
      message: 'Account created successfully and pending approval by administrator/super admin',
      userId: result.insertId
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Get user
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if ((user.role === 'student' || user.role === 'faculty') && !user.isApproved) {
      return res.status(403).json({
        message: 'Your account is pending approval by administrator/super admin'
      });
    }

    // Generate token
    const token = generateToken(user.id, user.role, user.assignedSubject);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        department: user.department,
        assignedYear: user.assignedYear,
        assignedSemester: user.assignedSemester,
        assignedSubject: user.assignedSubject,
        mustChangePassword: !!user.mustChangePassword
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await getUserById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Profile retrieved successfully',
      user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email, firstName, lastName } = req.body;

    if (!email || !firstName || !lastName) {
      return res.status(400).json({ message: 'Email, first name, and last name are required' });
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: 'Account not found with the provided email' });
    }

    const nameMatches =
      (user.firstName || '').trim().toLowerCase() === firstName.trim().toLowerCase() &&
      (user.lastName || '').trim().toLowerCase() === lastName.trim().toLowerCase();

    if (!nameMatches) {
      return res.status(403).json({ message: 'Verification failed. Provided details do not match our records' });
    }

    const temporaryPassword = generateTemporaryPassword();
    await updateUserPasswordById(user.id, temporaryPassword, true);
    await sendPasswordResetEmail({
      to: user.email,
      fullName: `${user.firstName} ${user.lastName}`,
      temporaryPassword
    });

    return res.json({
      message: 'Verification successful. A temporary password has been sent to your email'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ message: 'Unable to process forgot password request', error: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'All password fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'New password and confirm password do not match' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const dbUser = await getUserByEmail(user.email);
    const isCurrentPasswordValid = await verifyPassword(currentPassword, dbUser.password);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    await updateUserPasswordById(req.user.userId, newPassword, false);
    return res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ message: 'Unable to change password', error: error.message });
  }
};
