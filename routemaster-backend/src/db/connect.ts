import mongoose from 'mongoose';
import { initializeIndexes, createSampleData } from './initIndexes';

interface ConnectOptions {
  uri: string;
}

export const connectDB = async ({ uri }: ConnectOptions): Promise<void> => {
  try {
    const conn = await mongoose.connect(uri, {
      // MongoDB connection options
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4, // Use IPv4, skip trying IPv6
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(
      `🔗 Connection URL: ${conn.connection.host}:${conn.connection.port}`
    );

    // Initialize database indexes
    await initializeIndexes();

    // Create sample data for development
    if (process.env.NODE_ENV === 'development') {
      await createSampleData();
    }

    // Handle connection events
    mongoose.connection.on('error', err => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🛑 MongoDB connection closed through app termination');
      process.exit(0);
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown connection error';
    console.error('❌ Failed to connect to MongoDB:', errorMessage);
    throw error; // Re-throw the error to be handled by the caller
  }
};

export default connectDB;
