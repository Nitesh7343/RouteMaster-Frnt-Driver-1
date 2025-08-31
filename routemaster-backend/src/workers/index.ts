import { Server as SocketIOServer } from 'socket.io';
import StaleMonitorWorker from './staleMonitor';
import ETAWorker from './etaWorker';

export class WorkersManager {
  private io: SocketIOServer;
  private staleMonitor: StaleMonitorWorker;
  private etaWorker: ETAWorker;
  private isRunning: boolean = false;

  constructor(io: SocketIOServer) {
    this.io = io;
    this.staleMonitor = new StaleMonitorWorker(io);
    this.etaWorker = new ETAWorker(io);
  }

  start(): void {
    if (this.isRunning) {
      console.log('⚠️ Workers manager already running');
      return;
    }

    console.log('🚀 Starting background workers...');

    try {
      // Start stale monitor worker
      this.staleMonitor.start();

      // Start ETA worker
      this.etaWorker.start();

      this.isRunning = true;
      console.log('✅ All background workers started successfully');
    } catch (error) {
      console.error('❌ Error starting workers:', error);
      this.stop();
      throw error;
    }
  }

  stop(): void {
    if (!this.isRunning) {
      return;
    }

    console.log('🛑 Stopping background workers...');

    try {
      this.staleMonitor.stop();
      this.etaWorker.stop();

      this.isRunning = false;
      console.log('✅ All background workers stopped successfully');
    } catch (error) {
      console.error('❌ Error stopping workers:', error);
    }
  }

  getStatus(): {
    isRunning: boolean;
    staleMonitor: any;
    etaWorker: any;
  } {
    return {
      isRunning: this.isRunning,
      staleMonitor: this.staleMonitor.getStatus(),
      etaWorker: this.etaWorker.getStatus(),
    };
  }

  // Method to clear worker data for a specific bus (e.g., when bus goes offline)
  clearBusData(busId: string): void {
    this.etaWorker.clearBusData(busId);
  }
}

export default WorkersManager;
