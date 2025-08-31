import { Router } from 'express';
import {
  getAllRoutes,
  getRouteById,
  getRouteStops,
  createRoute,
  updateRoute,
  deleteRoute,
} from '../controllers/routesController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// Public routes (no authentication required)
router.get('/', getAllRoutes);
router.get('/:routeId', getRouteById);
router.get('/:routeId/stops', getRouteStops);

// Protected routes (admin only)
router.post('/', authenticateToken, requireAdmin, createRoute);
router.put('/:routeId', authenticateToken, requireAdmin, updateRoute);
router.delete('/:routeId', authenticateToken, requireAdmin, deleteRoute);

// Health check for routes
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Routes API is working',
    timestamp: new Date().toISOString(),
  });
});

export default router;
