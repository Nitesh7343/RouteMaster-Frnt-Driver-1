const { io } = require('socket.io-client');

// Driver socket test
const driverSocket = io('http://localhost:5001/driver', {
  auth: {
    token: 'YOUR_JWT_TOKEN_HERE' // Replace with actual token from login
  }
});

driverSocket.on('connect', () => {
  console.log('🔌 Driver connected to Socket.IO');
  
  // Test driver:toggle event
  setTimeout(() => {
    console.log('🚌 Testing driver:toggle event...');
    driverSocket.emit('driver:toggle', {
      busId: 'BUS001',
      online: true
    });
  }, 1000);
  
  // Test driver:move event
  setTimeout(() => {
    console.log('📍 Testing driver:move event...');
    driverSocket.emit('driver:move', {
      lng: -122.4194,
      lat: 37.7749,
      speed: 25,
      heading: 90,
      ts: Date.now()
    });
  }, 3000);
  
  // Send more location updates
  setTimeout(() => {
    console.log('📍 Sending location update 2...');
    driverSocket.emit('driver:move', {
      lng: -122.4184,
      lat: 37.7759,
      speed: 30,
      heading: 95,
      ts: Date.now()
    });
  }, 5000);
  
  // Go offline after 10 seconds
  setTimeout(() => {
    console.log('🚌 Going offline...');
    driverSocket.emit('driver:toggle', {
      busId: 'BUS001',
      online: false
    });
  }, 10000);
});

driverSocket.on('bus:status', (data) => {
  console.log('📡 Received bus:status event:', data);
});

driverSocket.on('bus:update', (data) => {
  console.log('📡 Received bus:update event:', data);
});

driverSocket.on('eta:update', (data) => {
  console.log('⏰ Received eta:update event:', data);
});

driverSocket.on('disconnect', () => {
  console.log('❌ Driver disconnected from Socket.IO');
});

driverSocket.on('error', (error) => {
  console.error('❌ Driver socket error:', error);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down driver socket test...');
  driverSocket.disconnect();
  process.exit(0);
});
