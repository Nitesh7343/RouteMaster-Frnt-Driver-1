#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 RouteMaster Backend - Test Setup Helper\n');

// Check if .env exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env file from template...');
  fs.copyFileSync(path.join(__dirname, '.env.example'), envPath);
  console.log('✅ .env file created');
  console.log('⚠️  Please edit .env and set your MONGODB_URI and JWT_SECRET');
} else {
  console.log('✅ .env file already exists');
}

// Check if node_modules exists
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.log('📦 Installing dependencies...');
  const { execSync } = require('child_process');
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dependencies installed');
  } catch (error) {
    console.error('❌ Failed to install dependencies:', error.message);
    process.exit(1);
  }
} else {
  console.log('✅ Dependencies already installed');
}

// Check if database is seeded
console.log('\n🌱 Checking database...');
const { execSync } = require('child_process');
try {
  execSync('npm run seed', { stdio: 'inherit' });
  console.log('✅ Database seeded successfully');
} catch (error) {
  console.error('❌ Database seeding failed. Make sure:');
  console.error('   1. MongoDB Atlas is accessible');
  console.error('   2. MONGODB_URI is set correctly in .env');
  console.error('   3. Your IP is whitelisted in MongoDB Atlas');
  process.exit(1);
}

console.log('\n🎉 Setup complete! You can now:');
console.log('   1. Start the server: npm run dev');
console.log('   2. Run integration tests: npm test');
console.log('   3. Test driver socket: npm run test:driver');
console.log('   4. Test user socket: npm run test:user');
console.log('   5. Quick health check: npm run test:quick');
console.log('\n📚 See TEST.md for detailed testing instructions');
