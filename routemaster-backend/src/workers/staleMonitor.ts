import * as cron from 'node-cron';
import { Bus } from '../models/Bus';
import { Server as SocketIOServer } from 'socket.io';

export class StaleMonitorWorker {
  private io: SocketIOServer;
  private cronJob: cron.ScheduledTask | null = null;
  private isRunning: boolean = false;

  constructor(io: SocketIOServer) {
    this.io = io;
  }

  start(): void {
    if (this.isRunning) {
      console.log('⚠️ Stale monitor worker already running');
      return;
    }

    console.log('🔄 Starting stale monitor worker (runs every minute)...');

    // Run every minute
    this.cronJob = cron.schedule('* * * * *', async () => {
      await this.checkStaleBuses();
    });

    this.isRunning = true;
    console.log('✅ Stale monitor worker started successfully');
  }

  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
    }
    this.isRunning = false;
    console.log('🛑 Stale monitor worker stopped');
  }

  private async checkStaleBuses(): Promise<void> {
    try {
      const now = new Date();
      const staleThreshold = new Date(now.getTime() - 60 * 1000); // 60 seconds ago

      // Find buses that are online but haven't updated in 60+ seconds
      const staleBuses = await Bus.find({
        online: true,
        lastUpdateAt: { $lt: staleThreshold },
      }).select('busId routeId driverId lastUpdateAt');

      if (staleBuses.length === 0) {
        return; // No stale buses
      }

      console.log(
        `🔄 Found ${staleBuses.length} stale buses, marking offline...`
      );

      // Update each stale bus
      for (const bus of staleBuses) {
        try {
          // Mark bus as offline and set lastOnlineAt to lastUpdateAt
          const updatedBus = await Bus.findOneAndUpdate(
            { _id: bus._id },
            {
              online: false,
              lastOnlineAt: bus.lastUpdateAt,
              status: 'inactive',
            },
            { new: true }
          );

          if (updatedBus) {
            // Emit bus:status event to relevant rooms
            const statusPayload = {
              busId: updatedBus.busId,
              routeId: updatedBus.routeId,
              online: false,
              lastOnlineAt: updatedBus.lastOnlineAt,
              lastUpdateAt: updatedBus.lastUpdateAt,
              status: 'inactive',
              reason: 'stale_timeout',
              timestamp: new Date().toISOString(),
            };

            // Broadcast to bus room
            this.io
              .of('/user')
              .to(`bus:${updatedBus.busId}`)
              .emit('bus:status', statusPayload);

            // Broadcast to route room
            this.io
              .of('/user')
              .to(`route:${updatedBus.routeId}`)
              .emit('bus:status', statusPayload);

            // Notify driver if connected
            this.io
              .of('/driver')
              .to(`driver:${updatedBus.driverId}`)
              .emit('bus:status', statusPayload);

            console.log(
              `🚌 Marked bus ${updatedBus.busId} offline due to inactivity`
            );
          }
        } catch (error) {
          console.error(`❌ Error updating stale bus ${bus.busId}:`, error);
        }
      }

      console.log(`✅ Processed ${staleBuses.length} stale buses`);
    } catch (error) {
      console.error('❌ Error in stale monitor worker:', error);
    }
  }

  getStatus(): { isRunning: boolean; lastRun?: Date } {
    return {
      isRunning: this.isRunning,
    };
  }
}

export default StaleMonitorWorker;
