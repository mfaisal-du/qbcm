import { getUserByEmail, createUser, verifyPassword, getUserById, updateUserPasswordById } from '../models/User.js';
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

export const registerStudent = async (req, res) => {
  try {
    const { firstName, lastName, email, password, confirmPassword } = req.body;

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const result = await createUser({
      firstName,
      lastName,
      email,
      password,
      role: 'student',
      isApproved: false,
      approvedBy: null
    });

    return res.status(201).json({
      message: 'Student account created and pending approval by administrator/super admin',
      userId: result.insertId
    });
  } catch (error) {
    console.error('Student register error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const loginStudent = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.role !== 'student') {
      return res.status(403).json({ message: 'Access denied. This portal is for students only' });
    }

    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.isApproved) {
      return res.status(403).json({ message: 'Your account is pending approval by administrator/super admin' });
    }

    const token = generateToken(user.id, user.role);

    return res.json({
      message: 'Student login successful',
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        mustChangePassword: !!user.mustChangePassword
      }
    });
  } catch (error) {
    console.error('Student login error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const forgotStudentPassword = async (req, res) => {
  try {
    const { email, firstName, lastName } = req.body;

    if (!email || !firstName || !lastName) {
      return res.status(400).json({ message: 'Email, first name, and last name are required' });
    }

    const user = await getUserByEmail(email);
    if (!user || user.role !== 'student') {
      return res.status(404).json({ message: 'Student account not found with the provided email' });
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
    console.error('Student forgot password error:', error);
    return res.status(500).json({ message: 'Unable to process forgot password request', error: error.message });
  }
};

export const getStudentProfile = async (req, res) => {
  try {
    const user = await getUserById(req.user.userId);

    if (!user || user.role !== 'student') {
      return res.status(404).json({ message: 'Student user not found' });
    }

    return res.json({
      message: 'Profile retrieved successfully',
      user
    });
  } catch (error) {
    console.error('Get student profile error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const changeStudentPassword = async (req, res) => {
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
    if (!user || user.role !== 'student') {
      return res.status(404).json({ message: 'Student user not found' });
    }

    const dbUser = await getUserByEmail(user.email);
    const isCurrentPasswordValid = await verifyPassword(currentPassword, dbUser.password);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    await updateUserPasswordById(req.user.userId, newPassword, false);
    return res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change student password error:', error);
    return res.status(500).json({ message: 'Unable to change password', error: error.message });
  }
};
