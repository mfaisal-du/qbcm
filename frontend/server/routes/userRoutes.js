import express from 'express';
import { 
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  createUserByAdmin,
  approveUserAccount
} from '../controllers/userController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Authorized roles for user management
const userAdminRoles = ['administrator', 'super_admin'];

// Create user - Administrator only
router.post('/', authenticate, authorize(userAdminRoles), createUserByAdmin);

// Get all users - Administrator only
router.get('/', authenticate, authorize(userAdminRoles), getAllUsers);

// Get user by ID - Administrator only
router.get('/:userId', authenticate, authorize(userAdminRoles), getUserById);

// Update user - Administrator only
router.put('/:userId', authenticate, authorize(userAdminRoles), updateUser);

// Approve pending student/faculty account - Administrator only
router.put('/:userId/approve', authenticate, authorize(userAdminRoles), approveUserAccount);

// Delete user - Administrator only
router.delete('/:userId', authenticate, authorize(userAdminRoles), deleteUser);

export default router;
