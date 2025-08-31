#!/usr/bin/env node

/**
 * RouteMaster Backend - Scaling Test Client
 * 
 * This client connects to multiple instances and tests real-time communication.
 */

const { io } = require('socket.io-client');

// Configuration
const INSTANCES = [
  'http://localhost:5001',
  'http://localhost:5002',
  'http://localhost:5003'
];

const clients = [];

// Create connections to all instances
INSTANCES.forEach((url, index) => {
  const client = io(url);
  
  client.on('connect', () => {
    console.log(`✅ Connected to instance ${index + 1}: ${url}`);
  });

  client.on('welcome', (data) => {
    console.log(`📨 Welcome from ${data.message}`);
  });

  client.on('broadcast-message', (data) => {
    console.log(`📡 Broadcast from ${data.from}: ${data.message}`);
  });

  client.on('disconnect', () => {
    console.log(`❌ Disconnected from instance ${index + 1}`);
  });

  client.on('error', (error) => {
    console.error(`❌ Error from instance ${index + 1}:`, error);
  });

  clients.push(client);
});

// Test function
function sendTestMessage() {
  const message = `Hello from client at ${new Date().toISOString()}`;
  console.log(`\n🚀 Sending test message: ${message}`);
  
  // Send message to first instance
  if (clients[0]) {
    clients[0].emit('test-message', { message });
  }
}

// Send test message every 5 seconds
setInterval(sendTestMessage, 5000);

// Send initial test message after 2 seconds
setTimeout(sendTestMessage, 2000);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Disconnecting clients...');
  clients.forEach(client => client.disconnect());
  process.exit(0);
});

console.log('🔌 Scaling test client started');
console.log('📡 Connecting to instances:', INSTANCES.join(', '));
console.log('⏰ Sending test messages every 5 seconds...');
console.log('🛑 Press Ctrl+C to stop');
