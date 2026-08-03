import { verifyToken } from '../utils/jwt.js';

export const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Authentication failed' });
  }
};

export const authorize = (allowedRoles) => {
  return (req, res, next) => {
    const effectiveRole = req.user.role === 'admin' ? 'administrator' : req.user.role;

    if (effectiveRole === 'super_admin') {
      return next();
    }

    if (!allowedRoles.includes(effectiveRole)) {
      return res.status(403).json({ message: 'Access denied: Insufficient permissions' });
    }
    next();
  };
};

export const filterByUserSubject = (req, res, next) => {
  try {
    const effectiveRole = req.user.role === 'admin' ? 'administrator' : req.user.role;

    if (effectiveRole === 'super_admin' || effectiveRole === 'administrator' || effectiveRole === 'reviewer') {
      return next();
    }

    if (effectiveRole === 'faculty') {
      req.subjectFilter = req.user.assignedSubject ? [req.user.assignedSubject] : null;
    } else if (effectiveRole === 'student') {
      if (req.user.subject) {
        req.subjectFilter = [req.user.subject];
      }
      if (req.user.assignedYear) {
        req.yearFilter = req.user.assignedYear;
      }
      if (req.user.assignedSemester) {
        req.semesterFilter = req.user.assignedSemester;
      }
    }
    next();
  } catch (error) {
    next();
  }
};
