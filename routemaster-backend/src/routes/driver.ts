import { Router } from 'express';
import {
  getMyAssignment,
  getMyUpcomingAssignments,
  getMyAssignmentHistory,
} from '../controllers/driverController';
import { authenticateToken, requireDriver } from '../middleware/auth';

const router = Router();

// All driver routes require authentication and driver role
router.use(authenticateToken);
router.use(requireDriver);

// Get current active assignment
router.get('/me/assignment', getMyAssignment);

// Get upcoming assignments
router.get('/me/upcoming', getMyUpcomingAssignments);

// Get assignment history with pagination
router.get('/me/history', getMyAssignmentHistory);

// Health check for driver routes
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Driver API is working',
    timestamp: new Date().toISOString(),
    driver: {
      id: req.user._id,
      name: req.user.name,
      phone: req.user.phone,
    },
  });
});

export default router;
