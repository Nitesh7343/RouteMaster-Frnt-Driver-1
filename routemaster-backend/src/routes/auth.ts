import { Router } from 'express';
import {
  signup,
  login,
  getProfile,
  updateProfile,
  logout,
} from '../controllers/authController';
import { authenticateToken, requireDriver } from '../middleware/auth';
import {
  signupSchema,
  loginSchema,
  updateUserSchema,
} from '../utils/validation';

const router = Router();

// Validation middleware using Zod
const validateRequest = (schema: any) => {
  return (req: any, res: any, next: any) => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error: any) {
      if (error.errors) {
        const validationErrors = error.errors.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        res.status(400).json({
          success: false,
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: validationErrors,
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Invalid request data',
          code: 'INVALID_DATA',
        });
      }
    }
  };
};

// Public routes (no authentication required)
router.post('/signup', validateRequest(signupSchema), signup);
router.post('/login', validateRequest(loginSchema), login);

// Protected routes (authentication required)
router.get('/profile', authenticateToken, getProfile);
router.put(
  '/profile',
  authenticateToken,
  validateRequest(updateUserSchema),
  updateProfile
);
router.post('/logout', authenticateToken, logout);

// Health check for auth routes
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Auth routes are working',
    timestamp: new Date().toISOString(),
  });
});

export default router;
