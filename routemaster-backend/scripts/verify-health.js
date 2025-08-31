#!/usr/bin/env node

/**
 * RouteMaster Backend - Health Check Verification
 */

const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5001';

async function verifyHealthCheck() {
  console.log('🏥 Verifying health check endpoint...');
  
  try {
    const response = await axios.get(`${BASE_URL}/health`, {
      timeout: 5000
    });
    
    const data = response.data;
    
    console.log('📊 Health check response:');
    console.log(JSON.stringify(data, null, 2));
    
    // Verify required fields
    const checks = [
      { field: 'ok', expected: true, actual: data.ok },
      { field: 'status', expected: 'healthy', actual: data.status },
      { field: 'uptime', expected: 'number', actual: typeof data.uptime },
      { field: 'timestamp', expected: 'string', actual: typeof data.timestamp },
      { field: 'database', expected: 'connected', actual: data.database }
    ];
    
    let allPassed = true;
    
    checks.forEach(check => {
      const passed = check.expected === check.actual || 
                    (check.expected === 'number' && typeof check.actual === 'number') ||
                    (check.expected === 'string' && typeof check.actual === 'string');
      
      const status = passed ? '✅' : '❌';
      console.log(`${status} ${check.field}: ${check.actual} (expected: ${check.expected})`);
      
      if (!passed) allPassed = false;
    });
    
    if (allPassed) {
      console.log('\n🎉 Health check verification PASSED!');
      process.exit(0);
    } else {
      console.log('\n❌ Health check verification FAILED!');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    process.exit(1);
  }
}

verifyHealthCheck();
