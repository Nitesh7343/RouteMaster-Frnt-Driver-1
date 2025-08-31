import { Server as SocketIOServer } from 'socket.io';
import { Bus } from '../models/Bus';

export interface ChangeStreamBus {
  busId: string;
  routeId: string;
  driverId: string;
  online: boolean;
  location?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  speed?: number;
  heading?: number;
  lastOnlineAt?: Date;
  lastUpdateAt?: Date;
  status?: string;
  passengers?: number;
  maxCapacity?: number;
}

export class ChangeStreamWatcher {
  private io: SocketIOServer;
  private changeStream: any;
  private isWatching: boolean = false;

  constructor(io: SocketIOServer) {
    this.io = io;
  }

  async startWatching(): Promise<void> {
    try {
      if (this.isWatching) {
        console.log('⚠️ Change stream already watching, skipping...');
        return;
      }

      console.log(
        '🔍 Starting MongoDB change stream watcher for buses collection...'
      );

      // Watch the buses collection for changes
      this.changeStream = Bus.watch([], {
        fullDocument: 'updateLookup',
        fullDocumentBeforeChange: 'off',
      });

      this.changeStream.on('change', (changeEvent: any) => {
        this.handleChange(changeEvent);
      });

      this.changeStream.on('error', (error: any) => {
        console.error('❌ Change stream error:', error);
        this.reconnect();
      });

      this.changeStream.on('close', () => {
        console.log('⚠️ Change stream closed, attempting to reconnect...');
        this.reconnect();
      });

      this.isWatching = true;
      console.log('✅ MongoDB change stream watcher started successfully');
    } catch (error) {
      console.error('❌ Failed to start change stream watcher:', error);
      throw error;
    }
  }

  private handleChange(changeEvent: any): void {
    try {
      const { operationType, fullDocument, documentKey } = changeEvent;

      // Only process update, replace, and insert operations
      if (!['update', 'replace', 'insert'].includes(operationType)) {
        return;
      }

      // Skip if no full document (shouldn't happen with updateLookup)
      if (!fullDocument) {
        console.warn('⚠️ Change event missing full document:', operationType);
        return;
      }

      const busData = fullDocument as ChangeStreamBus;

      // Validate required fields
      if (!busData.busId || !busData.routeId) {
        console.warn('⚠️ Change event missing required fields:', {
          busId: busData.busId,
          routeId: busData.routeId,
        });
        return;
      }

      console.log(
        `🔄 Broadcasting bus change: ${operationType} for bus ${busData.busId}`
      );

      // Create safe payload for broadcasting
      const safePayload = {
        busId: busData.busId,
        routeId: busData.routeId,
        driverId: busData.driverId,
        online: busData.online,
        location: busData.location,
        speed: busData.speed,
        heading: busData.heading,
        lastOnlineAt: busData.lastOnlineAt,
        lastUpdateAt: busData.lastUpdateAt,
        status: busData.status,
        passengers: busData.passengers,
        maxCapacity: busData.maxCapacity,
        changeType: operationType,
        timestamp: new Date().toISOString(),
      };

      // Broadcast to bus-specific room
      this.io
        .of('/user')
        .to(`bus:${busData.busId}`)
        .emit('bus:update', safePayload);

      // Broadcast to route-specific room
      this.io
        .of('/user')
        .to(`route:${busData.routeId}`)
        .emit('bus:update', safePayload);

      // Also emit to driver namespace if driver is connected
      this.io
        .of('/driver')
        .to(`driver:${busData.driverId}`)
        .emit('bus:update', safePayload);

      // Log the broadcast
      console.log(
        `📡 Broadcasted update for bus ${busData.busId} to rooms: bus:${busData.busId}, route:${busData.routeId}`
      );
    } catch (error) {
      console.error('❌ Error handling change event:', error);
    }
  }

  private async reconnect(): Promise<void> {
    try {
      console.log('🔄 Attempting to reconnect change stream...');

      if (this.changeStream) {
        this.changeStream.close();
      }

      this.isWatching = false;

      // Wait a bit before reconnecting
      setTimeout(async () => {
        try {
          await this.startWatching();
        } catch (error) {
          console.error('❌ Failed to reconnect change stream:', error);
          // Try again in 30 seconds
          setTimeout(() => this.reconnect(), 30000);
        }
      }, 5000);
    } catch (error) {
      console.error('❌ Error during reconnection:', error);
    }
  }

  stopWatching(): void {
    try {
      if (this.changeStream) {
        this.changeStream.close();
        this.changeStream = null;
      }
      this.isWatching = false;
      console.log('🛑 Change stream watcher stopped');
    } catch (error) {
      console.error('❌ Error stopping change stream:', error);
    }
  }

  isActive(): boolean {
    return this.isWatching && this.changeStream && !this.changeStream.closed;
  }

  getStatus(): { isWatching: boolean; isActive: boolean } {
    return {
      isWatching: this.isWatching,
      isActive: this.isActive(),
    };
  }
}

export default ChangeStreamWatcher;
