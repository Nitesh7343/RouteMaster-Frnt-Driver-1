# RouteMaster Backend API

A real-time transportation management system built with Node.js, Express, TypeScript, MongoDB, and Socket.IO.

## 🚀 Features

- **Real-time Bus Tracking** with Socket.IO
- **JWT Authentication** for drivers and admins
- **Geospatial Queries** for nearby bus searches
- **Background Workers** for ETA calculations and liveness monitoring
- **MongoDB Change Streams** for real-time data synchronization
- **Comprehensive Security** with Helmet, rate limiting, and input sanitization
- **RESTful API** with full CRUD operations
- **TypeScript** for type safety and better development experience

## 📋 Prerequisites

- Node.js (v18 or higher)
- MongoDB Atlas account
- npm or yarn package manager

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd routemaster-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and fill in your actual values:
   ```env
   # Server Configuration
   PORT=5001
   NODE_ENV=development
   
   # MongoDB Atlas Connection
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/routemaster?retryWrites=true&w=majority
   
   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
   JWT_EXPIRES_IN=7d
   ```

4. **Set up MongoDB Atlas**
   - Create a MongoDB Atlas cluster
   - Add your IP address to the IP whitelist
   - Create a database user with read/write permissions
   - Get your connection string and update `MONGODB_URI` in `.env`

5. **Seed the database with sample data**
   ```bash
   npm run seed
   ```

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm run start:prod
```

## 📚 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build TypeScript to JavaScript |
| `npm run start` | Start production server |
| `npm run start:prod` | Start production server with NODE_ENV=production |
| `npm run lint` | Run ESLint to check code quality |
| `npm run lint:fix` | Fix ESLint errors automatically |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check if code is properly formatted |
| `npm run seed` | Seed database with sample data |
| `npm run setup` | Automated setup and testing helper |
| `npm test` | Run full integration tests |
| `npm run test:driver` | Test driver Socket.IO connection |
| `npm run test:user` | Test user Socket.IO connection |
| `npm run test:quick` | Quick health check |

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register a new driver
- `POST /api/auth/login` - Login driver
- `GET /api/auth/profile` - Get driver profile
- `PUT /api/auth/profile` - Update driver profile

### Routes
- `GET /api/routes` - Get all routes
- `GET /api/routes/:routeId` - Get specific route
- `GET /api/routes/:routeId/stops` - Get route stops
- `POST /api/routes` - Create new route (admin only)
- `PUT /api/routes/:routeId` - Update route (admin only)
- `DELETE /api/routes/:routeId` - Delete route (admin only)

### Vehicles
- `GET /api/vehicles` - Get all vehicles
- `GET /api/vehicles/:busId` - Get specific vehicle
- `POST /api/vehicles` - Create new vehicle (admin only)
- `PUT /api/vehicles/:busId` - Update vehicle (admin only)
- `DELETE /api/vehicles/:busId` - Delete vehicle (admin only)

### Assignments
- `GET /api/assignments` - Get all assignments
- `GET /api/assignments/active` - Get active assignments
- `POST /api/assignments` - Create new assignment (admin only)
- `PUT /api/assignments/:assignmentId` - Update assignment (admin only)

### Driver Endpoints
- `GET /api/driver/me/assignment` - Get current driver's assignment
- `GET /api/driver/me/upcoming` - Get upcoming assignments
- `GET /api/driver/me/history` - Get assignment history

### Buses (Public)
- `GET /api/buses` - Get all buses with filters
- `GET /api/buses/near` - Find nearby buses
- `GET /api/buses/:busId` - Get specific bus details
- `GET /api/buses/stream/status` - Get change stream status
- `GET /api/buses/workers/status` - Get workers status

### System
- `GET /health` - Health check
- `GET /security/status` - Security features status

## 🔌 Socket.IO Events

### Driver Namespace (`/driver`)
- `driver:toggle` - Toggle bus online/offline status
- `driver:move` - Update bus location and movement data

### User Namespace (`/user`)
- `subscribe:bus` - Subscribe to bus updates
- `subscribe:route` - Subscribe to route updates
- `unsubscribe:bus` - Unsubscribe from bus updates
- `unsubscribe:route` - Unsubscribe from route updates

### Real-time Events
- `bus:status` - Bus status changes
- `bus:update` - Bus location/movement updates
- `eta:update` - ETA updates for buses

## 🔑 Test Credentials

After running `npm run seed`, you can use these test accounts:

| Role | Phone | Password |
|------|-------|----------|
| Driver 1 | +12345678901 | Driver123! |
| Driver 2 | +12345678902 | Driver123! |
| Driver 3 | +12345678903 | Driver123! |
| Admin | +12345678904 | Admin123! |

## 🏗️ Project Structure

```
src/
├── controllers/     # Request handlers
├── db/             # Database connection and initialization
├── middleware/     # Express middleware
├── models/         # Mongoose models
├── routes/         # API route definitions
├── scripts/        # Database seeding and utilities
├── services/       # Business logic services
├── sockets/        # Socket.IO event handlers
├── utils/          # Utility functions
├── workers/        # Background workers
└── index.ts        # Application entry point
```

## 🔒 Security Features

- **Helmet** - Security headers
- **Rate Limiting** - API abuse prevention
- **Input Sanitization** - XSS and injection protection
- **JWT Authentication** - Secure token-based auth
- **CORS Protection** - Cross-origin request control
- **Request Logging** - Security monitoring

## 🚌 Background Workers

- **Stale Monitor** - Automatically marks inactive buses as offline
- **ETA Worker** - Calculates real-time arrival times for online buses

## 🧪 Verification & Testing

### Quick Verification

```bash
# Run comprehensive verification
npm run verify

# Check project structure and files
npm run verify:summary

# Test specific components
npm run verify:health
npm run verify:auth
npm run verify:socket
npm run verify:geo
npm run verify:workers
```

### Manual Verification

For detailed manual verification steps, see [VERIFICATION.md](./VERIFICATION.md) which includes:

- **Database & Indexing** - 2dsphere index verification
- **Health Check** - `/health` endpoint testing
- **Authentication** - JWT signup/login verification
- **Assignment** - `/me/assignment` endpoint testing
- **Real-time Communication** - Socket.IO driver/user testing
- **Geospatial Queries** - `$near` endpoint distance ordering
- **Background Workers** - Stale monitor and ETA worker testing
- **Documentation** - README and setup instructions verification

### Manual Testing
1. **Setup**: Follow the detailed instructions in [TEST.md](./TEST.md)
2. **API Testing**: Use Postman or curl to test REST endpoints
3. **Socket Testing**: Use the provided test scripts for real-time features
4. **Integration Testing**: Run the comprehensive test suite

### Test Scripts
- `npm test` - Full integration test suite
- `npm run test:driver` - Driver Socket.IO testing
- `npm run test:user` - User Socket.IO testing
- `npm run test:quick` - Quick health check

### Test Credentials
After running `npm run seed`, use these test accounts:
- Driver 1: `+12345678901` / `Driver123!`
- Driver 2: `+12345678902` / `Driver123!`
- Driver 3: `+12345678903` / `Driver123!`
- Admin: `+12345678904` / `Admin123!`

## 📊 Monitoring

- Health check: `GET /health`
- Security status: `GET /security/status`
- Change stream status: `GET /api/buses/stream/status`
- Workers status: `GET /api/buses/workers/status`

## 📱 React Native Integration

For React Native client integration examples, see [docs/rn-client-snippets.md](./docs/rn-client-snippets.md) for:

- **Driver App** - Socket.IO connection with JWT authentication, location tracking with Expo Location, and real-time movement updates
- **User App** - Socket.IO connection to user namespace, bus/route subscription, and live map updates
- **Location Throttling** - Smart location update logic (>20m distance or time-based intervals)
- **Last Seen Handling** - Automatic API calls for stale bus data
- **Performance Optimization** - Location throttling and network state monitoring

### Quick RN Setup

```bash
# Install dependencies
npm install socket.io-client expo-location react-native-maps

# Configure environment
API_BASE_URL=http://your-backend-url:5001
SOCKET_URL=http://your-backend-url:5001

# Import and use the provided services
import DriverSocketService from './services/driverSocket';
import UserSocketService from './services/userSocket';
```

## 🚀 Production Scaling

For production deployment across multiple instances, see [SCALING.md](./SCALING.md) for comprehensive guidance on:

- **Socket.IO Adapters** - MongoDB and Redis adapters for multi-instance support
- **Load Balancer Configuration** - Nginx and AWS ALB setup
- **Environment Configuration** - Production environment variables
- **Monitoring and Health Checks** - Production monitoring setup
- **Performance Optimization** - Node.js and MongoDB optimization
- **Deployment Strategies** - Blue-green and Kubernetes deployment

### Quick Scaling Setup

```bash
# Install scaling dependencies
npm install @socket.io/mongo-adapter @socket.io/redis-adapter redis

# Configure environment variables
SOCKET_ADAPTER_TYPE=mongo  # or redis
MONGODB_URI=your-mongodb-atlas-uri
REDIS_URL=your-redis-url  # if using Redis adapter

# Start with adapter support
npm run start:prod
```

### Scaling Examples

```bash
# Start multiple instances (in different terminals)
INSTANCE_ID=instance1 PORT=5001 npm run scaling:example
INSTANCE_ID=instance2 PORT=5002 npm run scaling:example
INSTANCE_ID=instance3 PORT=5003 npm run scaling:example

# Test multi-instance communication
npm run scaling:test
```

## 🚀 Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Set production environment variables:
   ```env
   NODE_ENV=production
   CORS_ORIGIN=https://yourdomain.com
   ```

3. Start the production server:
   ```bash
   npm run start:prod
   ```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run linting and formatting:
   ```bash
   npm run lint
   npm run format
   ```
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For support and questions, please open an issue in the repository.
