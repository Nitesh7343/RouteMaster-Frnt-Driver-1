# RouteMaster Backend - Verification Checklist

This document provides a comprehensive verification checklist to ensure all components of the RouteMaster backend are working correctly.

## 🎯 Verification Overview

This checklist verifies:
- Database setup and indexing
- API endpoints functionality
- Authentication and authorization
- Real-time Socket.IO communication
- Background workers
- Geospatial queries
- Documentation completeness

## 📋 Pre-Verification Setup

### 1. Environment Setup
```bash
# Ensure all dependencies are installed
npm install

# Copy environment file
cp .env.example .env

# Set required environment variables
MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/routemaster
JWT_SECRET=your-super-secret-jwt-key-here
PORT=5001
```

### 2. Database Seeding
```bash
# Seed the database with test data
npm run seed
```

### 3. Start the Server
```bash
# Start in development mode
npm run dev
```

## ✅ Verification Checklist

### 1. Database & Indexing Verification

#### 1.1 2dsphere Index Verification
**Objective**: Verify that the 2dsphere index exists on the buses collection for geospatial queries.

**Test Command**:
```bash
# Connect to MongoDB Atlas and verify index
mongosh "your-mongodb-uri" --eval "
  db.buses.getIndexes().forEach(function(index) {
    if (index.key && index.key.location) {
      print('✅ 2dsphere index found on buses.location');
      print('Index details:', JSON.stringify(index, null, 2));
    }
  });
"
```

**Expected Result**:
```
✅ 2dsphere index found on buses.location
Index details: {
  "v": 2,
  "key": {
    "location": "2dsphere"
  },
  "name": "location_2dsphere",
  "2dsphereIndexVersion": 3
}
```

**Manual Verification**:
```javascript
// In MongoDB Atlas console
db.buses.getIndexes()
// Should show location: "2dsphere" index
```

**Status**: ⬜ Pending | ✅ Passed | ❌ Failed

---

### 2. Health Check Verification

#### 2.1 /health Endpoint
**Objective**: Verify the health check endpoint returns correct status.

**Test Command**:
```bash
curl -s http://localhost:5001/health | jq .
```

**Expected Result**:
```json
{
  "ok": true,
  "status": "healthy",
  "uptime": 123.456,
  "timestamp": "2024-01-01T12:00:00.000Z",
  "database": "connected"
}
```

**Verification Points**:
- [ ] `ok` field is `true`
- [ ] `status` is `"healthy"`
- [ ] `uptime` is a positive number
- [ ] `timestamp` is a valid ISO date
- [ ] `database` is `"connected"`

**Status**: ⬜ Pending | ✅ Passed | ❌ Failed

---

### 3. Authentication Verification

#### 3.1 Driver Signup
**Objective**: Verify driver signup creates a new driver with hashed password.

**Test Command**:
```bash
curl -X POST http://localhost:5001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+12345678901",
    "name": "Test Driver",
    "password": "TestPass123!"
  }' | jq .
```

**Expected Result**:
```json
{
  "success": true,
  "message": "Driver registered successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "driver": {
      "phone": "+12345678901",
      "name": "Test Driver",
      "role": "driver"
    }
  }
}
```

**Verification Points**:
- [ ] Returns success status
- [ ] JWT token is present and valid format
- [ ] Driver data is returned without password
- [ ] Password is hashed in database

**Status**: ⬜ Pending | ✅ Passed | ❌ Failed

#### 3.2 Driver Login
**Objective**: Verify driver login with correct credentials returns JWT token.

**Test Command**:
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+12345678901",
    "password": "TestPass123!"
  }' | jq .
```

**Expected Result**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "driver": {
      "phone": "+12345678901",
      "name": "Test Driver",
      "role": "driver"
    }
  }
}
```

**Verification Points**:
- [ ] Returns success status
- [ ] JWT token is present and valid format
- [ ] Driver data is returned
- [ ] Token can be decoded and verified

**Status**: ⬜ Pending | ✅ Passed | ❌ Failed

---

### 4. Assignment Verification

#### 4.1 /me/assignment Endpoint
**Objective**: Verify that authenticated drivers can retrieve their current assignment.

**Test Command**:
```bash
# First, get a JWT token from login
TOKEN=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone": "+12345678901", "password": "TestPass123!"}' | jq -r '.data.token')

# Then get assignment
curl -X GET http://localhost:5001/api/driver/me/assignment \
  -H "Authorization: Bearer $TOKEN" | jq .
```

**Expected Result**:
```json
{
  "success": true,
  "data": {
    "busId": "BUS001",
    "routeId": "ROUTE001",
    "shift": {
      "start": "08:00",
      "end": "16:00",
      "active": true
    }
  }
}
```

**Verification Points**:
- [ ] Returns success status
- [ ] Assignment data is present
- [ ] Bus ID and Route ID are correct
- [ ] Shift information is accurate
- [ ] Only returns active assignments

**Status**: ⬜ Pending | ✅ Passed | ❌ Failed

---

### 5. Real-time Communication Verification

#### 5.1 Driver Socket Connection
**Objective**: Verify driver can connect to Socket.IO with JWT authentication.

**Test Script**:
```javascript
// test-driver-connection.js
const { io } = require('socket.io-client');

const token = 'YOUR_JWT_TOKEN_HERE'; // Get from login
const socket = io('http://localhost:5001/driver', {
  auth: { token }
});

socket.on('connect', () => {
  console.log('✅ Driver connected to Socket.IO');
});

socket.on('error', (error) => {
  console.log('❌ Driver connection error:', error);
});

setTimeout(() => {
  socket.disconnect();
  console.log('🔌 Driver disconnected');
}, 5000);
```

**Expected Result**:
```
✅ Driver connected to Socket.IO
🔌 Driver disconnected
```

**Status**: ⬜ Pending | ✅ Passed | ❌ Failed

#### 5.2 Driver Movement Updates
**Objective**: Verify driver can emit movement updates.

**Test Script**:
```javascript
// test-driver-movement.js
const { io } = require('socket.io-client');

const token = 'YOUR_JWT_TOKEN_HERE';
const socket = io('http://localhost:5001/driver', {
  auth: { token }
});

socket.on('connect', () => {
  console.log('✅ Driver connected');
  
  // Emit movement update
  socket.emit('driver:move', {
    lng: -122.4194,
    lat: 37.7749,
    speed: 25.5,
    heading: 90,
    ts: Date.now()
  });
  
  console.log('📡 Movement update sent');
});

socket.on('bus:update', (data) => {
  console.log('📡 Received bus update:', data);
});

setTimeout(() => {
  socket.disconnect();
}, 3000);
```

**Expected Result**:
```
✅ Driver connected
📡 Movement update sent
📡 Received bus update: { busId: 'BUS001', location: {...}, ... }
```

**Status**: ⬜ Pending | ✅ Passed | ❌ Failed

#### 5.3 User Receives Real-time Updates
**Objective**: Verify users receive real-time bus updates.

**Test Script**:
```javascript
// test-user-updates.js
const { io } = require('socket.io-client');

const userSocket = io('http://localhost:5001/user');

userSocket.on('connect', () => {
  console.log('✅ User connected to Socket.IO');
  
  // Subscribe to bus updates
  userSocket.emit('subscribe:bus', { busId: 'BUS001' });
  console.log('📡 Subscribed to bus BUS001');
});

userSocket.on('bus:update', (data) => {
  console.log('📡 User received bus update:', data);
});

userSocket.on('bus:status', (data) => {
  console.log('📡 User received bus status:', data);
});

setTimeout(() => {
  userSocket.disconnect();
  console.log('🔌 User disconnected');
}, 10000);
```

**Expected Result**:
```
✅ User connected to Socket.IO
📡 Subscribed to bus BUS001
📡 User received bus update: { busId: 'BUS001', location: {...}, ... }
📡 User received bus status: { busId: 'BUS001', online: true, ... }
```

**Status**: ⬜ Pending | ✅ Passed | ❌ Failed

---

### 6. Geospatial Query Verification

#### 6.1 $near Endpoint Returns Ordered Results
**Objective**: Verify the /buses/near endpoint returns buses ordered by distance.

**Test Command**:
```bash
curl -s "http://localhost:5001/api/buses/near?lng=-122.4194&lat=37.7749&r=2000" | jq .
```

**Expected Result**:
```json
{
  "success": true,
  "data": [
    {
      "busId": "BUS001",
      "location": {
        "type": "Point",
        "coordinates": [-122.4194, 37.7749]
      },
      "distance": 0,
      "lastOnlineAt": "2024-01-01T12:00:00.000Z",
      "lastUpdateAt": "2024-01-01T12:00:00.000Z"
    },
    {
      "busId": "BUS002",
      "location": {
        "type": "Point",
        "coordinates": [-122.4200, 37.7750]
      },
      "distance": 15.2,
      "lastOnlineAt": "2024-01-01T12:00:00.000Z",
      "lastUpdateAt": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```

**Verification Points**:
- [ ] Returns success status
- [ ] Buses are ordered by distance (closest first)
- [ ] Distance field is present and accurate
- [ ] Location coordinates are in correct format
- [ ] Last seen timestamps are present

**Status**: ⬜ Pending | ✅ Passed | ❌ Failed

---

### 7. Background Workers Verification

#### 7.1 Stale Monitor Worker
**Objective**: Verify stale monitor flips online status to false for idle buses.

**Test Setup**:
```bash
# 1. Create a bus that's online but hasn't updated recently
curl -X POST http://localhost:5001/api/buses \
  -H "Content-Type: application/json" \
  -d '{
    "busId": "TEST_BUS",
    "routeId": "ROUTE001",
    "driverId": "driver123",
    "online": true,
    "lastUpdateAt": "2024-01-01T11:00:00.000Z"
  }'

# 2. Wait for stale monitor to run (every minute)
sleep 65

# 3. Check if bus is now offline
curl -s http://localhost:5001/api/buses/TEST_BUS | jq .
```

**Expected Result**:
```json
{
  "success": true,
  "data": {
    "busId": "TEST_BUS",
    "online": false,
    "lastOnlineAt": "2024-01-01T11:00:00.000Z"
  }
}
```

**Verification Points**:
- [ ] Bus status changed from `online: true` to `online: false`
- [ ] `lastOnlineAt` timestamp is updated
- [ ] Change happens within 60 seconds of last update

**Status**: ⬜ Pending | ✅ Passed | ❌ Failed

#### 7.2 ETA Worker
**Objective**: Verify ETA worker emits ETA calculations for online buses.

**Test Script**:
```javascript
// test-eta-worker.js
const { io } = require('socket.io-client');

const userSocket = io('http://localhost:5001/user');

userSocket.on('connect', () => {
  console.log('✅ User connected');
  
  // Subscribe to bus for ETA updates
  userSocket.emit('subscribe:bus', { busId: 'BUS001' });
  console.log('📡 Subscribed to bus BUS001 for ETA updates');
});

userSocket.on('eta:update', (data) => {
  console.log('⏰ ETA update received:', data);
});

setTimeout(() => {
  userSocket.disconnect();
  console.log('🔌 User disconnected');
}, 15000); // Wait 15 seconds for ETA updates
```

**Expected Result**:
```
✅ User connected
📡 Subscribed to bus BUS001 for ETA updates
⏰ ETA update received: { busId: 'BUS001', eta: 300, nextStop: 'Stop A', ... }
⏰ ETA update received: { busId: 'BUS001', eta: 280, nextStop: 'Stop A', ... }
```

**Verification Points**:
- [ ] ETA updates are received every 10 seconds
- [ ] ETA values are reasonable (positive numbers)
- [ ] Next stop information is present
- [ ] Updates only come for online buses

**Status**: ⬜ Pending | ✅ Passed | ❌ Failed

---

### 8. Documentation Verification

#### 8.1 README Atlas Connection Instructions
**Objective**: Verify README contains clear MongoDB Atlas connection instructions.

**Check Points**:
- [ ] README mentions MongoDB Atlas setup
- [ ] Connection string format is provided
- [ ] IP whitelisting instructions are included
- [ ] Environment variable setup is documented
- [ ] Troubleshooting tips are provided

**Status**: ⬜ Pending | ✅ Passed | ❌ Failed

#### 8.2 Seed Script Documentation
**Objective**: Verify README documents the seed script usage.

**Check Points**:
- [ ] `npm run seed` command is documented
- [ ] Seed script purpose is explained
- [ ] Test credentials are provided
- [ ] Sample data description is included

**Status**: ⬜ Pending | ✅ Passed | ❌ Failed

---

## 🧪 Automated Verification Script

### Run Complete Verification

```bash
# Run the automated verification script
npm run verify
```

### Individual Test Scripts

```bash
# Test specific components
npm run test:health
npm run test:auth
npm run test:socket
npm run test:geo
npm run test:workers
```

---

## 📊 Verification Summary

### Overall Status
- **Database & Indexing**: ⬜ Pending | ✅ Passed | ❌ Failed
- **Health Check**: ⬜ Pending | ✅ Passed | ❌ Failed
- **Authentication**: ⬜ Pending | ✅ Passed | ❌ Failed
- **Assignment**: ⬜ Pending | ✅ Passed | ❌ Failed
- **Real-time Communication**: ⬜ Pending | ✅ Passed | ❌ Failed
- **Geospatial Queries**: ⬜ Pending | ✅ Passed | ❌ Failed
- **Background Workers**: ⬜ Pending | ✅ Passed | ❌ Failed
- **Documentation**: ⬜ Pending | ✅ Passed | ❌ Failed

### Final Result
**Overall Status**: ⬜ Pending | ✅ All Tests Passed | ❌ Some Tests Failed

---

## 🔧 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Check IP whitelist in MongoDB Atlas
   - Verify connection string format
   - Ensure network connectivity

2. **Socket.IO Connection Failed**
   - Check CORS configuration
   - Verify JWT token validity
   - Check server is running

3. **Authentication Failed**
   - Verify JWT_SECRET is set
   - Check password hashing
   - Ensure driver exists in database

4. **Geospatial Queries Not Working**
   - Verify 2dsphere index exists
   - Check coordinate format (longitude, latitude)
   - Ensure location data is in GeoJSON format

### Support

If verification fails, check:
1. Server logs for error messages
2. MongoDB Atlas connection status
3. Environment variable configuration
4. Network connectivity and firewall settings

For additional support, refer to the main README.md file or open an issue in the repository.
