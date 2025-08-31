#!/usr/bin/env node

/**
 * RouteMaster Backend - Verification Summary
 * 
 * This script provides a quick summary of all verification checks.
 */

const fs = require('fs');
const path = require('path');

function checkFileExists(filePath) {
  return fs.existsSync(path.join(__dirname, '..', filePath));
}

function checkDirectoryExists(dirPath) {
  return fs.existsSync(path.join(__dirname, '..', dirPath));
}

function getFileSize(filePath) {
  try {
    const stats = fs.statSync(path.join(__dirname, '..', filePath));
    return stats.size;
  } catch {
    return 0;
  }
}

function generateVerificationSummary() {
  console.log('🔍 RouteMaster Backend - Verification Summary');
  console.log('=' * 60);
  
  const checks = {
    'Core Files': [
      { name: 'package.json', path: 'package.json' },
      { name: 'tsconfig.json', path: 'tsconfig.json' },
      { name: '.env.example', path: '.env.example' },
      { name: 'src/index.ts', path: 'src/index.ts' }
    ],
    'Documentation': [
      { name: 'README.md', path: 'README.md' },
      { name: 'VERIFICATION.md', path: 'VERIFICATION.md' },
      { name: 'SCALING.md', path: 'SCALING.md' },
      { name: 'TEST.md', path: 'TEST.md' },
      { name: 'React Native Docs', path: 'docs/rn-client-snippets.md' }
    ],
    'Source Code': [
      { name: 'Models', path: 'src/models' },
      { name: 'Routes', path: 'src/routes' },
      { name: 'Controllers', path: 'src/controllers' },
      { name: 'Middleware', path: 'src/middleware' },
      { name: 'Sockets', path: 'src/sockets' },
      { name: 'Workers', path: 'src/workers' },
      { name: 'Services', path: 'src/services' },
      { name: 'Utils', path: 'src/utils' }
    ],
    'Scripts': [
      { name: 'Seed Script', path: 'src/scripts/seed.ts' },
      { name: 'Verification Script', path: 'scripts/verify.js' },
      { name: 'Test Scripts', path: 'test-integration.js' },
      { name: 'Setup Script', path: 'setup-test.js' }
    ],
    'Examples': [
      { name: 'Scaling Example', path: 'examples/scaling-example.js' },
      { name: 'Scaling Test Client', path: 'examples/scaling-test-client.js' }
    ]
  };
  
  let totalChecks = 0;
  let passedChecks = 0;
  
  Object.entries(checks).forEach(([category, items]) => {
    console.log(`\n📁 ${category}:`);
    
    items.forEach(item => {
      totalChecks++;
      const exists = checkFileExists(item.path) || checkDirectoryExists(item.path);
      const status = exists ? '✅' : '❌';
      const size = exists && !item.path.includes('/') ? ` (${getFileSize(item.path)} bytes)` : '';
      
      console.log(`  ${status} ${item.name}${size}`);
      
      if (exists) passedChecks++;
    });
  });
  
  // Check package.json scripts
  console.log('\n📦 Package.json Scripts:');
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
    const requiredScripts = [
      'dev', 'build', 'start', 'start:prod', 'lint', 'format', 'seed', 'test', 'verify'
    ];
    
    requiredScripts.forEach(script => {
      totalChecks++;
      const exists = packageJson.scripts && packageJson.scripts[script];
      const status = exists ? '✅' : '❌';
      console.log(`  ${status} npm run ${script}`);
      if (exists) passedChecks++;
    });
  } catch (error) {
    console.log('  ❌ Could not read package.json');
  }
  
  // Check dependencies
  console.log('\n📚 Dependencies:');
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
    const requiredDeps = [
      'express', 'mongoose', 'socket.io', 'jsonwebtoken', 'bcrypt', 'zod', 'node-cron'
    ];
    
    requiredDeps.forEach(dep => {
      totalChecks++;
      const exists = packageJson.dependencies && packageJson.dependencies[dep];
      const status = exists ? '✅' : '❌';
      console.log(`  ${status} ${dep}`);
      if (exists) passedChecks++;
    });
  } catch (error) {
    console.log('  ❌ Could not read package.json dependencies');
  }
  
  // Summary
  console.log('\n' + '=' * 60);
  console.log(`📊 SUMMARY: ${passedChecks}/${totalChecks} checks passed`);
  
  const percentage = Math.round((passedChecks / totalChecks) * 100);
  console.log(`📈 Completion: ${percentage}%`);
  
  if (passedChecks === totalChecks) {
    console.log('🎉 ALL VERIFICATIONS PASSED!');
    console.log('✅ RouteMaster Backend is ready for testing!');
  } else {
    console.log('⚠️ Some verifications failed. Please check the missing items above.');
  }
  
  console.log('\n💡 Next steps:');
  console.log('1. Run: npm run seed (to populate database)');
  console.log('2. Run: npm run dev (to start server)');
  console.log('3. Run: npm run verify (to test all functionality)');
  console.log('4. Check: VERIFICATION.md (for detailed testing guide)');
}

generateVerificationSummary();
