import { Router } from 'express';
import {
  getAllVehicles,
  getVehicleById,
  getVehiclesByType,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} from '../controllers/vehiclesController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// Public routes (no authentication required)
router.get('/', getAllVehicles);
router.get('/type/:type', getVehiclesByType);
router.get('/:busId', getVehicleById);

// Protected routes (admin only)
router.post('/', authenticateToken, requireAdmin, createVehicle);
router.put('/:busId', authenticateToken, requireAdmin, updateVehicle);
router.delete('/:busId', authenticateToken, requireAdmin, deleteVehicle);

// Health check for vehicles
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Vehicles API is working',
    timestamp: new Date().toISOString(),
  });
});

export default router;
