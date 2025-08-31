import { Router } from 'express';
import {
  getAllAssignments,
  getAssignmentById,
  getActiveAssignments,
  createAssignment,
  updateAssignment,
  deactivateAssignment,
} from '../controllers/assignmentsController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// Public routes (no authentication required)
router.get('/', getAllAssignments);
router.get('/active', getActiveAssignments);
router.get('/:assignmentId', getAssignmentById);

// Protected routes (admin only)
router.post('/', authenticateToken, requireAdmin, createAssignment);
router.put('/:assignmentId', authenticateToken, requireAdmin, updateAssignment);
router.delete(
  '/:assignmentId',
  authenticateToken,
  requireAdmin,
  deactivateAssignment
);

// Health check for assignments
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Assignments API is working',
    timestamp: new Date().toISOString(),
  });
});

export default router;
