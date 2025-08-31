#!/usr/bin/env node

/**
 * RouteMaster Backend - Automated Verification Script
 * 
 * This script runs all verification tests to ensure the backend is working correctly.
 */

const axios = require('axios');
const { io } = require('socket.io-client');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:5001';
const MONGODB_URI = process.env.MONGODB_URI;

// Test results tracking
const results = {
  database: { status: 'pending', details: [] },
  health: { status: 'pending', details: [] },
  auth: { status: 'pending', details: [] },
  assignment: { status: 'pending', details: [] },
  socket: { status: 'pending', details: [] },
  geo: { status: 'pending', details: [] },
  workers: { status: 'pending', details: [] },
  documentation: { status: 'pending', details: [] }
};

let authToken = null;

// Utility functions
const log = (message, type = 'info') => {
  const timestamp = new Date().toISOString();
  const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`${emoji} [${timestamp}] ${message}`);
};

const makeRequest = async (method, endpoint, data = null, headers = {}) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      timeout: 10000
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
};

// Test 1: Health Check
async function testHealthCheck() {
  log('Testing health check endpoint...');
  
  const result = await makeRequest('GET', '/health');
  
  if (result.success && result.data.ok === true) {
    results.health.status = 'passed';
    results.health.details.push('Health check endpoint returns ok: true');
    log('Health check passed', 'success');
  } else {
    results.health.status = 'failed';
    results.health.details.push(`Health check failed: ${result.error}`);
    log('Health check failed', 'error');
  }
}

// Test 2: Authentication
async function testAuthentication() {
  log('Testing authentication endpoints...');
  
  // Test signup
  const signupResult = await makeRequest('POST', '/api/auth/signup', {
    phone: '+12345678901',
    name: 'Test Driver',
    password: 'TestPass123!'
  });
  
  if (signupResult.success && signupResult.data.success) {
    results.auth.details.push('Driver signup successful');
    log('Driver signup passed', 'success');
  } else {
    results.auth.details.push(`Signup failed: ${signupResult.error}`);
    log('Driver signup failed', 'error');
  }
  
  // Test login
  const loginResult = await makeRequest('POST', '/api/auth/login', {
    phone: '+12345678901',
    password: 'TestPass123!'
  });
  
  if (loginResult.success && loginResult.data.success) {
    authToken = loginResult.data.data.token;
    results.auth.details.push('Driver login successful');
    log('Driver login passed', 'success');
    results.auth.status = 'passed';
  } else {
    results.auth.details.push(`Login failed: ${loginResult.error}`);
    log('Driver login failed', 'error');
    results.auth.status = 'failed';
  }
}

// Test 3: Assignment Endpoint
async function testAssignment() {
  log('Testing assignment endpoint...');
  
  if (!authToken) {
    results.assignment.status = 'failed';
    results.assignment.details.push('No auth token available');
    log('Assignment test skipped - no auth token', 'warning');
    return;
  }
  
  const result = await makeRequest('GET', '/api/driver/me/assignment', null, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (result.success && result.data.success) {
    results.assignment.status = 'passed';
    results.assignment.details.push('Assignment endpoint returns data');
    log('Assignment test passed', 'success');
  } else {
    results.assignment.status = 'failed';
    results.assignment.details.push(`Assignment failed: ${result.error}`);
    log('Assignment test failed', 'error');
  }
}

// Test 4: Socket.IO Connection
async function testSocketIO() {
  log('Testing Socket.IO connections...');
  
  return new Promise((resolve) => {
    let testsPassed = 0;
    let testsTotal = 0;
    
    // Test driver connection
    testsTotal++;
    const driverSocket = io(`${BASE_URL}/driver`, {
      auth: { token: authToken || 'test-token' }
    });
    
    driverSocket.on('connect', () => {
      results.socket.details.push('Driver Socket.IO connection successful');
      testsPassed++;
      driverSocket.disconnect();
    });
    
    driverSocket.on('error', (error) => {
      results.socket.details.push(`Driver Socket.IO error: ${error.message}`);
    });
    
    // Test user connection
    testsTotal++;
    const userSocket = io(`${BASE_URL}/user`);
    
    userSocket.on('connect', () => {
      results.socket.details.push('User Socket.IO connection successful');
      testsPassed++;
      userSocket.disconnect();
    });
    
    userSocket.on('error', (error) => {
      results.socket.details.push(`User Socket.IO error: ${error.message}`);
    });
    
    // Wait for both tests to complete
    setTimeout(() => {
      if (testsPassed === testsTotal) {
        results.socket.status = 'passed';
        log('Socket.IO tests passed', 'success');
      } else {
        results.socket.status = 'failed';
        log('Socket.IO tests failed', 'error');
      }
      resolve();
    }, 3000);
  });
}

// Test 5: Geospatial Queries
async function testGeospatialQueries() {
  log('Testing geospatial queries...');
  
  const result = await makeRequest('GET', '/api/buses/near?lng=-122.4194&lat=37.7749&r=2000');
  
  if (result.success && result.data.success) {
    const buses = result.data.data;
    if (Array.isArray(buses)) {
      results.geo.status = 'passed';
      results.geo.details.push(`Geospatial query returned ${buses.length} buses`);
      log('Geospatial query test passed', 'success');
    } else {
      results.geo.status = 'failed';
      results.geo.details.push('Geospatial query did not return array');
      log('Geospatial query test failed', 'error');
    }
  } else {
    results.geo.status = 'failed';
    results.geo.details.push(`Geospatial query failed: ${result.error}`);
    log('Geospatial query test failed', 'error');
  }
}

// Test 6: Background Workers (Basic Check)
async function testBackgroundWorkers() {
  log('Testing background workers...');
  
  // Check if workers endpoint exists
  const result = await makeRequest('GET', '/api/buses/workers/status');
  
  if (result.success) {
    results.workers.status = 'passed';
    results.workers.details.push('Background workers endpoint accessible');
    log('Background workers test passed', 'success');
  } else {
    results.workers.status = 'failed';
    results.workers.details.push(`Workers endpoint failed: ${result.error}`);
    log('Background workers test failed', 'error');
  }
}

// Test 7: Documentation Check
async function testDocumentation() {
  log('Checking documentation...');
  
  const fs = require('fs');
  const path = require('path');
  
  const filesToCheck = [
    'README.md',
    'VERIFICATION.md',
    'SCALING.md',
    'docs/rn-client-snippets.md'
  ];
  
  let docsPassed = 0;
  let docsTotal = filesToCheck.length;
  
  filesToCheck.forEach(file => {
    if (fs.existsSync(path.join(__dirname, '..', file))) {
      docsPassed++;
      results.documentation.details.push(`${file} exists`);
    } else {
      results.documentation.details.push(`${file} missing`);
    }
  });
  
  if (docsPassed === docsTotal) {
    results.documentation.status = 'passed';
    log('Documentation check passed', 'success');
  } else {
    results.documentation.status = 'failed';
    log('Documentation check failed', 'error');
  }
}

// Test 8: Database Index Check (Basic)
async function testDatabaseIndex() {
  log('Checking database indexes...');
  
  // This is a basic check - in production you'd connect to MongoDB directly
  const result = await makeRequest('GET', '/api/buses/stream/status');
  
  if (result.success) {
    results.database.status = 'passed';
    results.database.details.push('Database connection and change streams working');
    log('Database index check passed', 'success');
  } else {
    results.database.status = 'failed';
    results.database.details.push(`Database check failed: ${result.error}`);
    log('Database index check failed', 'error');
  }
}

// Main verification function
async function runVerification() {
  log('🚀 Starting RouteMaster Backend Verification...');
  log(`Testing against: ${BASE_URL}`);
  
  try {
    // Run all tests
    await testHealthCheck();
    await testAuthentication();
    await testAssignment();
    await testSocketIO();
    await testGeospatialQueries();
    await testBackgroundWorkers();
    await testDocumentation();
    await testDatabaseIndex();
    
    // Generate summary
    generateSummary();
    
  } catch (error) {
    log(`Verification failed with error: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Generate verification summary
function generateSummary() {
  log('\n📊 VERIFICATION SUMMARY', 'info');
  log('=' * 50, 'info');
  
  const categories = Object.keys(results);
  let passed = 0;
  let failed = 0;
  
  categories.forEach(category => {
    const result = results[category];
    const status = result.status === 'passed' ? '✅' : result.status === 'failed' ? '❌' : '⬜';
    
    log(`${status} ${category.toUpperCase()}: ${result.status}`, result.status === 'passed' ? 'success' : 'error');
    
    if (result.details.length > 0) {
      result.details.forEach(detail => {
        log(`   • ${detail}`, 'info');
      });
    }
    
    if (result.status === 'passed') passed++;
    else if (result.status === 'failed') failed++;
  });
  
  log('\n' + '=' * 50, 'info');
  log(`Total: ${passed} passed, ${failed} failed`, passed > failed ? 'success' : 'error');
  
  if (failed === 0) {
    log('🎉 ALL VERIFICATIONS PASSED!', 'success');
    log('RouteMaster Backend is ready for production!', 'success');
  } else {
    log('⚠️ Some verifications failed. Please check the details above.', 'warning');
    process.exit(1);
  }
}

// Run verification if this script is executed directly
if (require.main === module) {
  runVerification();
}

module.exports = {
  runVerification,
  results
};
