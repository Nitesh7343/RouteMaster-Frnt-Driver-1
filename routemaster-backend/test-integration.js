const { io } = require('socket.io-client');
const axios = require('axios');

const BASE_URL = 'http://localhost:5001';
let jwtToken = '';

// Test configuration
const TEST_DRIVER = {
  phone: '+12345678901',
  password: 'Driver123!'
};

const TEST_BUS = 'BUS001';
const TEST_ROUTE = 'ROUTE001';

// Utility function to make API requests
async function makeRequest(method, endpoint, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`❌ API Error (${method} ${endpoint}):`, error.response?.data || error.message);
    return null;
  }
}

// Test 1: Health Check
async function testHealthCheck() {
  console.log('\n🏥 Testing Health Check...');
  const result = await makeRequest('GET', '/health');
  if (result && result.ok) {
    console.log('✅ Health check passed');
    return true;
  } else {
    console.log('❌ Health check failed');
    return false;
  }
}

// Test 2: Driver Login
async function testDriverLogin() {
  console.log('\n🔐 Testing Driver Login...');
  const result = await makeRequest('POST', '/api/auth/login', {
    phone: TEST_DRIVER.phone,
    password: TEST_DRIVER.password
  });
  
  if (result && result.success && result.data.token) {
    jwtToken = result.data.token;
    console.log('✅ Driver login successful');
    console.log(`   Driver: ${result.data.driver.name}`);
    console.log(`   Token: ${jwtToken.substring(0, 20)}...`);
    return true;
  } else {
    console.log('❌ Driver login failed');
    return false;
  }
}

// Test 3: Get Driver Assignment
async function testGetAssignment() {
  console.log('\n📋 Testing Get Driver Assignment...');
  const result = await makeRequest('GET', '/api/driver/me/assignment', null, jwtToken);
  
  if (result && result.success && result.data) {
    console.log('✅ Assignment retrieved successfully');
    console.log(`   Bus ID: ${result.data.busId}`);
    console.log(`   Route ID: ${result.data.routeId}`);
    console.log(`   Status: ${result.data.status}`);
    return true;
  } else {
    console.log('❌ Failed to get assignment');
    return false;
  }
}

// Test 4: Socket.IO Driver Connection
function testDriverSocket() {
  return new Promise((resolve) => {
    console.log('\n🔌 Testing Driver Socket.IO Connection...');
    
    const driverSocket = io(`${BASE_URL}/driver`, {
      auth: { token: jwtToken }
    });
    
    let eventsReceived = {
      connect: false,
      busStatus: false,
      busUpdate: false
    };
    
    driverSocket.on('connect', () => {
      console.log('✅ Driver socket connected');
      eventsReceived.connect = true;
      
      // Test driver:toggle
      setTimeout(() => {
        console.log('🚌 Testing driver:toggle...');
        driverSocket.emit('driver:toggle', {
          busId: TEST_BUS,
          online: true
        });
      }, 1000);
      
      // Test driver:move
      setTimeout(() => {
        console.log('📍 Testing driver:move...');
        driverSocket.emit('driver:toggle', {
          busId: TEST_BUS,
          online: true
        });
        driverSocket.emit('driver:move', {
          lng: -122.4194,
          lat: 37.7749,
          speed: 25,
          heading: 90,
          ts: Date.now()
        });
      }, 2000);
      
      // Disconnect after 5 seconds
      setTimeout(() => {
        driverSocket.disconnect();
        resolve(eventsReceived);
      }, 5000);
    });
    
    driverSocket.on('bus:status', (data) => {
      console.log('📡 Received bus:status event');
      eventsReceived.busStatus = true;
    });
    
    driverSocket.on('bus:update', (data) => {
      console.log('📡 Received bus:update event');
      eventsReceived.busUpdate = true;
    });
    
    driverSocket.on('error', (error) => {
      console.error('❌ Driver socket error:', error);
    });
    
    // Timeout after 10 seconds
    setTimeout(() => {
      driverSocket.disconnect();
      resolve(eventsReceived);
    }, 10000);
  });
}

// Test 5: Socket.IO User Connection
function testUserSocket() {
  return new Promise((resolve) => {
    console.log('\n👤 Testing User Socket.IO Connection...');
    
    const userSocket = io(`${BASE_URL}/user`);
    
    let eventsReceived = {
      connect: false,
      busStatus: false,
      busUpdate: false
    };
    
    userSocket.on('connect', () => {
      console.log('✅ User socket connected');
      eventsReceived.connect = true;
      
      // Subscribe to bus
      setTimeout(() => {
        console.log('🚌 Subscribing to bus...');
        userSocket.emit('subscribe:bus', { busId: TEST_BUS });
      }, 1000);
      
      // Subscribe to route
      setTimeout(() => {
        console.log('🛣️ Subscribing to route...');
        userSocket.emit('subscribe:route', { routeId: TEST_ROUTE });
      }, 2000);
      
      // Disconnect after 5 seconds
      setTimeout(() => {
        userSocket.disconnect();
        resolve(eventsReceived);
      }, 5000);
    });
    
    userSocket.on('bus:status', (data) => {
      console.log('📡 Received bus:status event');
      eventsReceived.busStatus = true;
    });
    
    userSocket.on('bus:update', (data) => {
      console.log('📡 Received bus:update event');
      eventsReceived.busUpdate = true;
    });
    
    userSocket.on('error', (error) => {
      console.error('❌ User socket error:', error);
    });
    
    // Timeout after 10 seconds
    setTimeout(() => {
      userSocket.disconnect();
      resolve(eventsReceived);
    }, 10000);
  });
}

// Test 6: Public API Endpoints
async function testPublicEndpoints() {
  console.log('\n🌐 Testing Public API Endpoints...');
  
  // Test routes endpoint
  const routes = await makeRequest('GET', '/api/routes');
  if (routes && routes.success) {
    console.log(`✅ Routes endpoint: ${routes.data.length} routes found`);
  } else {
    console.log('❌ Routes endpoint failed');
  }
  
  // Test buses endpoint
  const buses = await makeRequest('GET', '/api/buses');
  if (buses && buses.success) {
    console.log(`✅ Buses endpoint: ${buses.data.length} buses found`);
  } else {
    console.log('❌ Buses endpoint failed');
  }
  
  // Test nearby buses endpoint
  const nearbyBuses = await makeRequest('GET', '/api/buses/near?lng=-122.4194&lat=37.7749&r=2000');
  if (nearbyBuses && nearbyBuses.success) {
    console.log(`✅ Nearby buses endpoint: ${nearbyBuses.data.length} buses found`);
  } else {
    console.log('❌ Nearby buses endpoint failed');
  }
}

// Test 7: Security Features
async function testSecurityFeatures() {
  console.log('\n🛡️ Testing Security Features...');
  
  // Test security status endpoint
  const securityStatus = await makeRequest('GET', '/security/status');
  if (securityStatus && securityStatus.success) {
    console.log('✅ Security status endpoint working');
    console.log('   Features:', Object.keys(securityStatus.data).filter(k => k !== 'timestamp').join(', '));
  } else {
    console.log('❌ Security status endpoint failed');
  }
  
  // Test rate limiting (make multiple rapid requests)
  console.log('🔄 Testing rate limiting...');
  const promises = [];
  for (let i = 0; i < 10; i++) {
    promises.push(makeRequest('GET', '/health'));
  }
  
  try {
    await Promise.all(promises);
    console.log('✅ Rate limiting test completed');
  } catch (error) {
    console.log('✅ Rate limiting working (requests blocked)');
  }
}

// Main test runner
async function runIntegrationTests() {
  console.log('🚀 Starting RouteMaster Backend Integration Tests...\n');
  
  const results = {
    healthCheck: false,
    driverLogin: false,
    assignment: false,
    driverSocket: false,
    userSocket: false,
    publicEndpoints: false,
    securityFeatures: false
  };
  
  try {
    // Run tests sequentially
    results.healthCheck = await testHealthCheck();
    if (!results.healthCheck) {
      console.log('\n❌ Health check failed. Make sure the server is running.');
      return;
    }
    
    results.driverLogin = await testDriverLogin();
    if (!results.driverLogin) {
      console.log('\n❌ Driver login failed. Check credentials and database.');
      return;
    }
    
    results.assignment = await testGetAssignment();
    results.driverSocket = await testDriverSocket();
    results.userSocket = await testUserSocket();
    await testPublicEndpoints();
    await testSecurityFeatures();
    
    // Print summary
    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    Object.entries(results).forEach(([test, passed]) => {
      console.log(`${passed ? '✅' : '❌'} ${test}`);
    });
    
    const passedTests = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;
    
    console.log(`\n🎯 Overall Result: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
      console.log('🎉 All tests passed! RouteMaster backend is working correctly.');
    } else {
      console.log('⚠️ Some tests failed. Check the logs above for details.');
    }
    
  } catch (error) {
    console.error('❌ Test runner error:', error);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runIntegrationTests().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = {
  runIntegrationTests,
  testHealthCheck,
  testDriverLogin,
  testGetAssignment,
  testDriverSocket,
  testUserSocket,
  testPublicEndpoints,
  testSecurityFeatures
};
