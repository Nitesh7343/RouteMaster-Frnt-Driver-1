import { Router } from 'express';
import authRoutes from './auth';
import routesRoutes from './routes';
import vehiclesRoutes from './vehicles';
import assignmentsRoutes from './assignments';
import driverRoutes from './driver';
import busesRoutes, { setChangeStreamWatcher } from './buses';
import ChangeStreamWatcher from '../sockets/stream';

const router = Router();

// Mount auth routes at /auth
router.use('/auth', authRoutes);

// Mount catalog routes at /routes
router.use('/routes', routesRoutes);

// Mount vehicle routes at /vehicles
router.use('/vehicles', vehiclesRoutes);

// Mount assignment routes at /assignments
router.use('/assignments', assignmentsRoutes);

// Mount driver routes at /driver
router.use('/driver', driverRoutes);

// Mount buses routes at /buses
router.use('/buses', busesRoutes);

// Function to set the change stream watcher
export const initializeChangeStreamWatcher = (watcher: ChangeStreamWatcher) => {
  setChangeStreamWatcher(watcher);
};

// Root route
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'RouteMaster API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/auth',
      routes: '/routes',
      vehicles: '/vehicles',
      assignments: '/assignments',
      driver: '/driver',
      buses: '/buses',
      health: '/health',
    },
  });
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;
