import { Server as SocketIOServer } from 'socket.io';
import {
  authenticateSocket,
  AuthenticatedSocketData,
} from '../utils/socketAuth';
import { locationThrottler } from '../utils/locationThrottle';
import { BusService } from '../services/busService';
import ChangeStreamWatcher from './stream';
import WorkersManager from '../workers';

interface SocketData {
  userId?: string;
  userType?: 'driver' | 'user';
  location?: {
    latitude: number;
    longitude: number;
    timestamp: Date;
  };
}

export const initializeSockets = (io: SocketIOServer) => {
  // Initialize bus service
  const busService = new BusService(io);

  // Initialize change stream watcher
  const changeStreamWatcher = new ChangeStreamWatcher(io);

  // Start watching for database changes
  changeStreamWatcher.startWatching().catch(error => {
    console.error('❌ Failed to start change stream watcher:', error);
  });

  // Initialize and start background workers
  const workersManager = new WorkersManager(io);
  workersManager.start();

  // Driver namespace with JWT authentication
  const driverNamespace = io.of('/driver');

  driverNamespace.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const authData = await authenticateSocket(token);
      socket.data = { ...socket.data, ...authData };
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  driverNamespace.on('connection', socket => {
    const driverData = socket.data as AuthenticatedSocketData;
    console.log(`🚗 Driver connected: ${socket.id} (${driverData.phone})`);

    // Join driver's personal room
    socket.join(`driver:${driverData.driverId}`);

    socket.on(
      'driver:toggle',
      async (data: { busId: string; online: boolean }) => {
        try {
          console.log(
            `🔄 Driver ${driverData.phone} toggling bus ${data.busId} to ${data.online ? 'online' : 'offline'}`
          );

          const result = await busService.toggleBusStatus(
            driverData.driverId,
            data.busId,
            data.online
          );

          if (result.success) {
            // Join bus and route rooms
            socket.join(`bus:${data.busId}`);
            if (result.bus?.routeId) {
              socket.join(`route:${result.bus.routeId}`);
              driverData.busId = data.busId;
              driverData.routeId = result.bus.routeId;
            }

            socket.emit('driver:toggle:success', {
              busId: data.busId,
              online: data.online,
              timestamp: new Date().toISOString(),
            });
          } else {
            socket.emit('driver:toggle:error', {
              error: result.error,
              timestamp: new Date().toISOString(),
            });
          }
        } catch (error) {
          console.error('Driver toggle error:', error);
          socket.emit('driver:toggle:error', {
            error: 'Internal server error',
            timestamp: new Date().toISOString(),
          });
        }
      }
    );

    socket.on(
      'driver:move',
      async (data: {
        busId: string;
        lng: number;
        lat: number;
        speed: number;
        heading: number;
        ts: number;
      }) => {
        try {
          // Check throttling
          if (
            !locationThrottler.shouldUpdate(
              driverData.driverId,
              data.lng,
              data.lat,
              data.ts
            )
          ) {
            return; // Skip update if throttled
          }

          console.log(
            `📍 Driver ${driverData.phone} moving bus ${data.busId}: ${data.lat}, ${data.lng}`
          );

          const result = await busService.updateBusLocation(
            driverData.driverId,
            data.busId,
            data.lng,
            data.lat,
            data.speed,
            data.heading,
            data.ts
          );

          if (result.success) {
            // Join bus and route rooms if not already joined
            socket.join(`bus:${data.busId}`);
            if (result.bus?.routeId) {
              socket.join(`route:${result.bus.routeId}`);
              driverData.busId = data.busId;
              driverData.routeId = result.bus.routeId;
            }

            socket.emit('driver:move:success', {
              busId: data.busId,
              timestamp: new Date().toISOString(),
            });
          } else {
            socket.emit('driver:move:error', {
              error: result.error,
              timestamp: new Date().toISOString(),
            });
          }
        } catch (error) {
          console.error('Driver move error:', error);
          socket.emit('driver:move:error', {
            error: 'Internal server error',
            timestamp: new Date().toISOString(),
          });
        }
      }
    );

    socket.on('disconnect', () => {
      console.log(`🚗 Driver disconnected: ${socket.id} (${driverData.phone})`);

      // Clean up throttler data
      locationThrottler.clearDriver(driverData.driverId);

      // If driver was online, set them offline
      if (driverData.busId) {
        busService
          .toggleBusStatus(driverData.driverId, driverData.busId, false)
          .catch(error =>
            console.error('Failed to set driver offline:', error)
          );
      }
    });
  });

  // User namespace for subscribing to bus updates
  const userNamespace = io.of('/user');

  userNamespace.on('connection', socket => {
    console.log(`👤 User connected: ${socket.id}`);

    socket.on('subscribe:bus', (data: { busId: string }) => {
      console.log(`🔔 User ${socket.id} subscribing to bus ${data.busId}`);
      socket.join(`bus:${data.busId}`);

      // Send current bus status
      busService.getBusStatus(data.busId).then(bus => {
        if (bus) {
          socket.emit('bus:status', {
            busId: bus.busId,
            routeId: bus.routeId,
            online: bus.online,
            lastOnlineAt: bus.lastOnlineAt,
            lastUpdateAt: bus.lastUpdateAt,
            timestamp: new Date().toISOString(),
          });
        }
      });
    });

    socket.on('subscribe:route', (data: { routeId: string }) => {
      console.log(`🔔 User ${socket.id} subscribing to route ${data.routeId}`);
      socket.join(`route:${data.routeId}`);

      // Send current buses on route
      busService.getBusesOnRoute(data.routeId).then(buses => {
        socket.emit('route:buses', {
          routeId: data.routeId,
          buses: buses.map(bus => ({
            busId: bus.busId,
            location: bus.location,
            speed: bus.speed,
            heading: bus.heading,
            lastUpdateAt: bus.lastUpdateAt,
            driver: bus.driverId,
          })),
          timestamp: new Date().toISOString(),
        });
      });
    });

    socket.on('unsubscribe:bus', (data: { busId: string }) => {
      console.log(`🔕 User ${socket.id} unsubscribing from bus ${data.busId}`);
      socket.leave(`bus:${data.busId}`);
    });

    socket.on('unsubscribe:route', (data: { routeId: string }) => {
      console.log(
        `🔕 User ${socket.id} unsubscribing from route ${data.routeId}`
      );
      socket.leave(`route:${data.routeId}`);
    });

    socket.on('disconnect', () => {
      console.log(`👤 User disconnected: ${socket.id}`);
    });
  });

  // Global namespace for general connections
  io.on('connection', socket => {
    console.log(`🔌 New socket connection: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  console.log(
    '✅ Socket.IO namespaces initialized: /driver (authenticated), /user'
  );

  // Return the change stream watcher for external access
  return changeStreamWatcher;
};
