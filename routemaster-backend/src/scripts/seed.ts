import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { Driver } from '../models/Driver';
import { Vehicle } from '../models/Vehicle';
import { Route } from '../models/Route';
import { Assignment } from '../models/Assignment';
import { Bus } from '../models/Bus';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is required in environment variables');
  process.exit(1);
}

// Sample data
const sampleDrivers = [
  {
    phone: '+12345678901',
    name: 'John Smith',
    password: 'Driver123!',
    role: 'driver' as const,
  },
  {
    phone: '+12345678902',
    name: 'Sarah Johnson',
    password: 'Driver123!',
    role: 'driver' as const,
  },
  {
    phone: '+12345678903',
    name: 'Mike Wilson',
    password: 'Driver123!',
    role: 'driver' as const,
  },
  {
    phone: '+12345678904',
    name: 'Admin User',
    password: 'Admin123!',
    role: 'admin' as const,
  },
];

const sampleVehicles = [
  {
    busId: 'BUS001',
    plate: 'ABC-123',
    capacity: 50,
    type: 'bus' as const,
    manufacturer: 'Mercedes-Benz',
    vehicleModel: 'Sprinter',
    year: 2022,
  },
  {
    busId: 'BUS002',
    plate: 'DEF-456',
    capacity: 35,
    type: 'minibus' as const,
    manufacturer: 'Ford',
    vehicleModel: 'Transit',
    year: 2021,
  },
  {
    busId: 'BUS003',
    plate: 'GHI-789',
    capacity: 25,
    type: 'shuttle' as const,
    manufacturer: 'Toyota',
    vehicleModel: 'Hiace',
    year: 2023,
  },
];

const sampleRoutes = [
  {
    routeId: 'ROUTE001',
    name: 'Downtown Express',
    polyline: [
      [-122.4194, 37.7749], // San Francisco
      [-122.4089, 37.7879],
      [-122.3954, 37.7849],
      [-122.3894, 37.7749],
    ],
    stops: [
      {
        stopId: 'STOP001',
        name: 'Downtown Station',
        location: {
          type: 'Point' as const,
          coordinates: [-122.4194, 37.7749],
        },
      },
      {
        stopId: 'STOP002',
        name: 'Financial District',
        location: {
          type: 'Point' as const,
          coordinates: [-122.4089, 37.7879],
        },
      },
      {
        stopId: 'STOP003',
        name: 'Union Square',
        location: {
          type: 'Point' as const,
          coordinates: [-122.3954, 37.7849],
        },
      },
      {
        stopId: 'STOP004',
        name: 'Civic Center',
        location: {
          type: 'Point' as const,
          coordinates: [-122.3894, 37.7749],
        },
      },
    ],
  },
  {
    routeId: 'ROUTE002',
    name: 'Airport Shuttle',
    polyline: [
      [-122.4194, 37.7749], // San Francisco
      [-122.3744, 37.6213], // SFO Airport
    ],
    stops: [
      {
        stopId: 'STOP005',
        name: 'Downtown Station',
        location: {
          type: 'Point' as const,
          coordinates: [-122.4194, 37.7749],
        },
      },
      {
        stopId: 'STOP006',
        name: 'SFO Airport',
        location: {
          type: 'Point' as const,
          coordinates: [-122.3744, 37.6213],
        },
      },
    ],
  },
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI!);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      Driver.deleteMany({}),
      Vehicle.deleteMany({}),
      Route.deleteMany({}),
      Assignment.deleteMany({}),
      Bus.deleteMany({}),
    ]);
    console.log('🧹 Cleared existing data');

    // Create drivers
    const createdDrivers = [];
    for (const driverData of sampleDrivers) {
      const passwordHash = await bcrypt.hash(driverData.password, 12);
      const driver = new Driver({
        ...driverData,
        passwordHash,
      });
      const savedDriver = await driver.save();
      createdDrivers.push(savedDriver);
      console.log(`👨‍💼 Created driver: ${driverData.name}`);
    }

    // Create vehicles
    const createdVehicles = [];
    for (const vehicleData of sampleVehicles) {
      const vehicle = new Vehicle(vehicleData);
      const savedVehicle = await vehicle.save();
      createdVehicles.push(savedVehicle);
      console.log(`🚌 Created vehicle: ${vehicleData.busId}`);
    }

    // Create routes
    const createdRoutes = [];
    for (const routeData of sampleRoutes) {
      const route = new Route(routeData);
      const savedRoute = await route.save();
      createdRoutes.push(savedRoute);
      console.log(`🛣️ Created route: ${routeData.name}`);
    }

    // Create assignments
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const dayAfterTomorrow = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    const assignments = [
      {
        driverId: createdDrivers[0]._id,
        busId: 'BUS001',
        routeId: 'ROUTE001',
        shiftStart: tomorrow,
        shiftEnd: new Date(tomorrow.getTime() + 8 * 60 * 60 * 1000),
        active: true,
        status: 'scheduled' as const,
      },
      {
        driverId: createdDrivers[1]._id,
        busId: 'BUS002',
        routeId: 'ROUTE002',
        shiftStart: dayAfterTomorrow,
        shiftEnd: new Date(dayAfterTomorrow.getTime() + 6 * 60 * 60 * 1000),
        active: false,
        status: 'scheduled' as const,
      },
    ];

    for (const assignmentData of assignments) {
      const assignment = new Assignment(assignmentData);
      await assignment.save();
      console.log(
        `📋 Created assignment for driver: ${assignmentData.driverId}`
      );
    }

    // Create sample buses (offline initially)
    const sampleBuses = [
      {
        busId: 'BUS001',
        routeId: 'ROUTE001',
        driverId: createdDrivers[0]._id,
        online: false,
        lastOnlineAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        lastUpdateAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        speed: 0,
        heading: 0,
        location: {
          type: 'Point' as const,
          coordinates: [-122.4194, 37.7749],
        },
        status: 'idle' as const,
        passengers: 0,
        maxCapacity: 50,
      },
      {
        busId: 'BUS002',
        routeId: 'ROUTE002',
        driverId: createdDrivers[1]._id,
        online: false,
        lastOnlineAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        lastUpdateAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
        speed: 0,
        heading: 0,
        location: {
          type: 'Point' as const,
          coordinates: [-122.3744, 37.6213],
        },
        status: 'idle' as const,
        passengers: 0,
        maxCapacity: 35,
      },
    ];

    for (const busData of sampleBuses) {
      const bus = new Bus(busData);
      await bus.save();
      console.log(`🚌 Created bus: ${busData.busId}`);
    }

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   👨‍💼 Drivers: ${createdDrivers.length}`);
    console.log(`   🚌 Vehicles: ${createdVehicles.length}`);
    console.log(`   🛣️ Routes: ${createdRoutes.length}`);
    console.log(`   📋 Assignments: ${assignments.length}`);
    console.log(`   🚌 Buses: ${sampleBuses.length}`);

    console.log('\n🔑 Test Credentials:');
    console.log('   Driver 1: +12345678901 / Driver123!');
    console.log('   Driver 2: +12345678902 / Driver123!');
    console.log('   Driver 3: +12345678903 / Driver123!');
    console.log('   Admin: +12345678904 / Admin123!');

    console.log('\n🌐 API Endpoints:');
    console.log('   Health: http://localhost:5001/health');
    console.log('   Auth: http://localhost:5001/api/auth');
    console.log('   Routes: http://localhost:5001/api/routes');
    console.log('   Buses: http://localhost:5001/api/buses');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the seed function
seedDatabase();
