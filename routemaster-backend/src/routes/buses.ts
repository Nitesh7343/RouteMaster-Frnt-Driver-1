import { Router } from 'express';
import {
  getBusById,
  getNearbyBuses,
  getAllBuses,
} from '../controllers/busesController';
import ChangeStreamWatcher from '../sockets/stream';

const router = Router();
let changeStreamWatcher: ChangeStreamWatcher | null = null;

// Set the change stream watcher instance
export const setChangeStreamWatcher = (watcher: ChangeStreamWatcher) => {
  changeStreamWatcher = watcher;
};

// Get all buses with optional filtering
router.get('/', getAllBuses);

// Get nearby buses using geospatial query
router.get('/near', getNearbyBuses);

// Get specific bus by ID
router.get('/:busId', getBusById);

// Health check for buses routes
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Buses API is working',
    timestamp: new Date().toISOString(),
  });
});

// Change stream status endpoint
router.get('/stream/status', (req, res) => {
  if (!changeStreamWatcher) {
    res.status(503).json({
      success: false,
      message: 'Change stream watcher not initialized',
      code: 'STREAM_NOT_INITIALIZED',
    });
    return;
  }

  const status = changeStreamWatcher.getStatus();
  res.json({
    success: true,
    message: 'Change stream status retrieved',
    data: {
      status,
      timestamp: new Date().toISOString(),
    },
  });
});

// Workers status endpoint
router.get('/workers/status', (req, res) => {
  res.json({
    success: true,
    message: 'Workers status retrieved',
    data: {
      message: 'Workers are managed by the Socket.IO system',
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;
