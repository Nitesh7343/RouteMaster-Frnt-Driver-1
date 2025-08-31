import * as cron from 'node-cron';
import { Bus } from '../models/Bus';
import { Route } from '../models/Route';
import { Server as SocketIOServer } from 'socket.io';

interface ETAUpdate {
  busId: string;
  routeId: string;
  nextStop: {
    stopId: string;
    name: string;
    distance: number; // meters
    eta: number; // minutes
  };
  routeProgress: number; // percentage
  estimatedArrival: Date;
  timestamp: Date;
}

export class ETAWorker {
  private io: SocketIOServer;
  private cronJob: cron.ScheduledTask | null = null;
  private isRunning: boolean = false;
  private smoothedSpeeds: Map<string, number> = new Map(); // busId -> smoothed speed

  constructor(io: SocketIOServer) {
    this.io = io;
  }

  start(): void {
    if (this.isRunning) {
      console.log('⚠️ ETA worker already running');
      return;
    }

    console.log('🔄 Starting ETA worker (runs every 10 seconds)...');

    // Run every 10 seconds
    this.cronJob = cron.schedule('*/10 * * * * *', async () => {
      await this.calculateETAs();
    });

    this.isRunning = true;
    console.log('✅ ETA worker started successfully');
  }

  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
    }
    this.isRunning = false;
    console.log('🛑 ETA worker stopped');
  }

  private async calculateETAs(): Promise<void> {
    try {
      // Get all online buses
      const onlineBuses = await Bus.find({ online: true })
        .select('busId routeId location speed heading')
        .populate('routeId', 'stops polyline');

      if (onlineBuses.length === 0) {
        return; // No online buses
      }

      console.log(
        `🔄 Calculating ETA for ${onlineBuses.length} online buses...`
      );

      for (const bus of onlineBuses) {
        try {
          if (!bus.location || !bus.routeId) {
            continue; // Skip buses without location or route
          }

          const etaUpdate = await this.calculateBusETA(bus);
          if (etaUpdate) {
            // Emit ETA update to bus room
            this.io
              .of('/user')
              .to(`bus:${bus.busId}`)
              .emit('eta:update', etaUpdate);

            // Also emit to route room - use the routeId string directly
            this.io
              .of('/user')
              .to(`route:${bus.routeId}`)
              .emit('eta:update', etaUpdate);

            console.log(
              `⏰ ETA for bus ${bus.busId}: ${etaUpdate.nextStop.eta} min to ${etaUpdate.nextStop.name}`
            );
          }
        } catch (error) {
          console.error(
            `❌ Error calculating ETA for bus ${bus.busId}:`,
            error
          );
        }
      }
    } catch (error) {
      console.error('❌ Error in ETA worker:', error);
    }
  }

  private async calculateBusETA(bus: any): Promise<ETAUpdate | null> {
    try {
      const route = bus.routeId;
      if (!route.stops || route.stops.length === 0) {
        return null;
      }

      const busLocation = bus.location.coordinates; // [lng, lat]

      // Find the closest stop and calculate ETA
      let closestStop = null;
      let minDistance = Infinity;
      let routeProgress = 0;

      for (let i = 0; i < route.stops.length; i++) {
        const stop = route.stops[i];
        const stopLocation = stop.location.coordinates; // [lng, lat]

        const distance = this.calculateDistance(
          busLocation[1], // bus lat
          busLocation[0], // bus lng
          stopLocation[1], // stop lat
          stopLocation[0] // stop lng
        );

        if (distance < minDistance) {
          minDistance = distance;
          closestStop = { ...stop, index: i };
        }
      }

      if (!closestStop) {
        return null;
      }

      // Calculate route progress (percentage)
      routeProgress = Math.round(
        (closestStop.index / (route.stops.length - 1)) * 100
      );

      // Get smoothed speed for this bus
      const smoothedSpeed = this.getSmoothedSpeed(bus.busId, bus.speed || 0);

      // Calculate ETA (time = distance / speed)
      const etaMinutes = Math.round(minDistance / 1000 / (smoothedSpeed / 60)); // Convert to minutes

      // Calculate estimated arrival time
      const estimatedArrival = new Date(Date.now() + etaMinutes * 60 * 1000);

      return {
        busId: bus.busId,
        routeId: route.routeId,
        nextStop: {
          stopId: closestStop.stopId,
          name: closestStop.name,
          distance: Math.round(minDistance),
          eta: Math.max(1, etaMinutes), // Minimum 1 minute
        },
        routeProgress,
        estimatedArrival,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Error calculating bus ETA:', error);
      return null;
    }
  }

  private getSmoothedSpeed(busId: string, currentSpeed: number): number {
    const smoothingFactor = 0.3; // Adjust this for more/less smoothing
    const currentSmoothed = this.smoothedSpeeds.get(busId) || currentSpeed;

    // Apply exponential smoothing
    const newSmoothed =
      smoothingFactor * currentSpeed + (1 - smoothingFactor) * currentSmoothed;

    // Update stored value
    this.smoothedSpeeds.set(busId, newSmoothed);

    return Math.max(1, newSmoothed); // Minimum 1 km/h
  }

  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  // Simple polyline snapping placeholder (to be refined later)
  private snapToPolyline(
    busLocation: [number, number],
    polyline: [number, number][]
  ): [number, number] {
    if (!polyline || polyline.length === 0) {
      return busLocation;
    }

    // For now, just return the closest polyline point
    // This is a placeholder - can be refined with proper polyline snapping algorithms
    let closestPoint = polyline[0];
    let minDistance = Infinity;

    for (const point of polyline) {
      const distance = this.calculateDistance(
        busLocation[1],
        busLocation[0],
        point[1],
        point[0]
      );

      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = point;
      }
    }

    return closestPoint;
  }

  getStatus(): { isRunning: boolean; activeBuses: number } {
    return {
      isRunning: this.isRunning,
      activeBuses: this.smoothedSpeeds.size,
    };
  }

  clearBusData(busId: string): void {
    this.smoothedSpeeds.delete(busId);
  }
}

export default ETAWorker;
