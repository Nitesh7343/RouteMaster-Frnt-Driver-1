import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import mongoose from 'mongoose';
import { Server as SocketIOServer } from 'socket.io';
import { connectDB } from './db/connect';
import { initializeSockets } from './sockets';
import routes from './routes';
import { initializeChangeStreamWatcher } from './routes';
import { createSocketIOAdapter } from './sockets/adapter';
import {
  helmetConfig,
  corsConfig,
  createRateLimiters,
  createSpeedLimiters,
  sanitizeInput,
  sanitizeOutput,
  securityHeaders,
  securityLogging,
  requestSizeLimit
} from './middleware/security';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 5001;

// Initialize Socket.IO with adapter for multi-instance scaling
const initializeSocketIO = async (server: any) => {
  try {
    const adapter = await createSocketIOAdapter({
      type: (process.env.SOCKET_ADAPTER_TYPE as 'mongo' | 'redis') || 'mongo',
      mongoUri: process.env.MONGODB_URI,
      redisUrl: process.env.REDIS_URL,
      dbName: process.env.DB_NAME || 'routemaster',
      collectionName: process.env.SOCKET_ADAPTER_COLLECTION || 'socket.io-adapter-events'
    });

    const io = new SocketIOServer(server, {
      cors: corsConfig,
      adapter: adapter
    });

    return io;
  } catch (error) {
    console.error('❌ Failed to initialize Socket.IO with adapter:', error);
    // Fallback to default Socket.IO without adapter
    return new SocketIOServer(server, {
      cors: corsConfig
    });
  }
};

// Security middleware
app.use(helmetConfig);
app.use(securityHeaders);
app.use(securityLogging);

// Rate limiting and speed limiting
const rateLimiters = createRateLimiters();
const speedLimiters = createSpeedLimiters();

// Apply rate limiters to specific routes
app.use('/api/auth', rateLimiters.auth);
app.use('/api/buses/near', rateLimiters.geo);
app.use('/api', rateLimiters.general);

// Apply speed limiters
app.use('/api', speedLimiters.general);

// Input/Output sanitization
app.use(sanitizeInput);
app.use(sanitizeOutput);

// Request size limiting
app.use(express.json(requestSizeLimit));
app.use(express.urlencoded(requestSizeLimit));

// Mount API routes
app.use('/api', routes);

// Basic route
app.get('/', (req, res) => {
  res.json({
    message: 'RouteMaster Backend API',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    ok: true,
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Security status endpoint
app.get('/security/status', (req, res) => {
  res.json({
    success: true,
    message: 'Security features status',
    data: {
      helmet: 'enabled',
      rateLimiting: 'enabled',
      speedLimiting: 'enabled',
      inputSanitization: 'enabled',
      outputSanitization: 'enabled',
      securityHeaders: 'enabled',
      requestLogging: 'enabled',
      cors: process.env.NODE_ENV === 'production' ? 'restricted' : 'development',
      timestamp: new Date().toISOString()
    }
  });
});

// Initialize server
const startServer = async () => {
  try {
    // Connect to MongoDB (optional for development)
    if (process.env.MONGODB_URI) {
      try {
        await connectDB({ uri: process.env.MONGODB_URI });
        console.log('✅ MongoDB connection successful');
      } catch (dbError) {
        const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown database error';
        console.warn('⚠️ MongoDB connection failed, continuing without database:', errorMessage);
        console.log('💡 To fix: Add your IP address to MongoDB Atlas IP whitelist');
        console.log('🌐 Your current IP:', await getCurrentIP());
      }
    } else {
      console.warn('⚠️ MONGODB_URI not found in environment variables');
    }

    // Initialize Socket.IO with adapter
    const io = await initializeSocketIO(server);
    
    // Initialize Socket.IO namespaces and handlers
    const changeStreamWatcher = initializeSockets(io);
    console.log('🔌 Socket.IO initialized with namespaces: /driver, /user');
    console.log('📡 MongoDB change stream watcher initialized');
    console.log('⚙️ Background workers (ETA + liveness) initialized');

    // Initialize change stream watcher in routes
    initializeChangeStreamWatcher(changeStreamWatcher);

    // Start HTTP server
    server.listen(PORT, () => {
      console.log(`🚀 RouteMaster Backend server running on port ${PORT}`);
      console.log(`📊 Health check available at http://localhost:${PORT}/health`);
      console.log(`🔒 Security status available at http://localhost:${PORT}/security/status`);
      console.log(`🔌 Socket.IO available at http://localhost:${PORT}`);
      console.log(`🔐 Auth API available at http://localhost:${PORT}/api/auth`);
      console.log(`🛣️ Routes API available at http://localhost:${PORT}/api/routes`);
      console.log(`🚌 Vehicles API available at http://localhost:${PORT}/api/vehicles`);
      console.log(`📋 Assignments API available at http://localhost:${PORT}/api/assignments`);
      console.log(`👨‍💼 Driver API available at http://localhost:${PORT}/api/driver`);
      console.log(`🚌 Buses API available at http://localhost:${PORT}/api/buses`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🛡️ Security features: Helmet, Rate Limiting, Input/Output Sanitization, Security Headers`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Helper function to get current IP
const getCurrentIP = async (): Promise<string> => {
  try {
    const response = await fetch('https://ifconfig.me');
    return await response.text();
  } catch {
    return 'Unable to determine IP';
  }
};

// Start the server
startServer();

export { app, server };
