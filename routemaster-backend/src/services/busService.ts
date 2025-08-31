import { Bus } from '../models/Bus';
import { Assignment } from '../models/Assignment';
import { Server as SocketIOServer } from 'socket.io';

export interface BusUpdateData {
  busId: string;
  routeId: string;
  driverId: string;
  online: boolean;
  location?: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  speed?: number;
  heading?: number;
  lastUpdateAt?: Date;
  lastOnlineAt?: Date;
}

export class BusService {
  private io: SocketIOServer;

  constructor(io: SocketIOServer) {
    this.io = io;
  }

  async toggleBusStatus(
    driverId: string,
    busId: string,
    online: boolean
  ): Promise<{ success: boolean; bus?: any; error?: string }> {
    try {
      // Validate that driver has an active assignment for this bus
      const assignment = await Assignment.findOne({
        driverId,
        busId,
        active: true,
        $and: [
          { shiftStart: { $lte: new Date() } },
          { shiftEnd: { $gte: new Date() } },
        ],
      });

      if (!assignment) {
        return {
          success: false,
          error: 'No active assignment found for this bus',
        };
      }

      // Upsert bus document
      const busData: BusUpdateData = {
        busId,
        routeId: assignment.routeId,
        driverId,
        online,
        lastUpdateAt: new Date(),
      };

      if (online) {
        busData.lastOnlineAt = new Date();
      }

      const bus = await Bus.findOneAndUpdate({ busId }, busData, {
        new: true,
        upsert: true,
        runValidators: true,
      });

      // Emit bus status update to relevant rooms
      const safePayload = {
        busId: bus.busId,
        routeId: bus.routeId,
        online: bus.online,
        lastOnlineAt: bus.lastOnlineAt,
        lastUpdateAt: bus.lastUpdateAt,
        timestamp: new Date().toISOString(),
      };

      // Emit to bus room
      this.io.to(`bus:${busId}`).emit('bus:status', safePayload);

      // Emit to route room
      this.io.to(`route:${bus.routeId}`).emit('bus:status', safePayload);

      return {
        success: true,
        bus,
      };
    } catch (error) {
      console.error('Toggle bus status error:', error);
      return {
        success: false,
        error: 'Failed to toggle bus status',
      };
    }
  }

  async updateBusLocation(
    driverId: string,
    busId: string,
    lng: number,
    lat: number,
    speed: number,
    heading: number,
    timestamp: number
  ): Promise<{ success: boolean; bus?: any; error?: string }> {
    try {
      // Validate coordinate ranges
      if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
        return {
          success: false,
          error: 'Invalid coordinates',
        };
      }

      // Validate speed and heading
      if (speed < 0 || speed > 200) {
        return {
          success: false,
          error: 'Invalid speed value',
        };
      }

      if (heading < 0 || heading > 360) {
        return {
          success: false,
          error: 'Invalid heading value',
        };
      }

      // Validate that driver has an active assignment for this bus
      const assignment = await Assignment.findOne({
        driverId,
        busId,
        active: true,
        $and: [
          { shiftStart: { $lte: new Date() } },
          { shiftEnd: { $gte: new Date() } },
        ],
      });

      if (!assignment) {
        return {
          success: false,
          error: 'No active assignment found for this bus',
        };
      }

      // Update bus document
      const busData: BusUpdateData = {
        busId,
        routeId: assignment.routeId,
        driverId,
        online: true,
        location: {
          type: 'Point',
          coordinates: [lng, lat],
        },
        speed,
        heading,
        lastUpdateAt: new Date(),
        lastOnlineAt: new Date(),
      };

      const bus = await Bus.findOneAndUpdate({ busId }, busData, {
        new: true,
        upsert: true,
        runValidators: true,
      });

      // Emit bus update to relevant rooms
      const safePayload = {
        busId: bus.busId,
        routeId: bus.routeId,
        location: bus.location,
        speed: bus.speed,
        heading: bus.heading,
        lastUpdateAt: bus.lastUpdateAt,
        timestamp: new Date().toISOString(),
      };

      // Emit to bus room
      this.io.to(`bus:${busId}`).emit('bus:update', safePayload);

      // Emit to route room
      this.io.to(`route:${bus.routeId}`).emit('bus:update', safePayload);

      return {
        success: true,
        bus,
      };
    } catch (error) {
      console.error('Update bus location error:', error);
      return {
        success: false,
        error: 'Failed to update bus location',
      };
    }
  }

  async getBusStatus(busId: string): Promise<any> {
    try {
      const bus = await Bus.findOne({ busId })
        .select(
          'busId routeId driverId online location speed heading lastOnlineAt lastUpdateAt'
        )
        .populate('driverId', 'name phone');

      return bus;
    } catch (error) {
      console.error('Get bus status error:', error);
      return null;
    }
  }

  async getBusesOnRoute(routeId: string): Promise<any[]> {
    try {
      const buses = await Bus.find({
        routeId,
        online: true,
      })
        .select('busId driverId location speed heading lastUpdateAt')
        .populate('driverId', 'name phone');

      return buses;
    } catch (error) {
      console.error('Get buses on route error:', error);
      return [];
    }
  }
}
