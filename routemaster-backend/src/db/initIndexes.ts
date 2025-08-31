import mongoose from 'mongoose';
import { Driver } from '../models/Driver';
import { Vehicle } from '../models/Vehicle';
import { Route } from '../models/Route';
import { Assignment } from '../models/Assignment';
import { Bus } from '../models/Bus';

export const initializeIndexes = async (): Promise<void> => {
  try {
    console.log('🔍 Initializing database indexes...');

    // Driver indexes
    await Driver.createIndexes();
    console.log('✅ Driver indexes created');

    // Vehicle indexes
    await Vehicle.createIndexes();
    console.log('✅ Vehicle indexes created');

    // Route indexes (including 2dsphere for stops)
    await Route.createIndexes();
    console.log('✅ Route indexes created (including 2dsphere for stops)');

    // Assignment indexes
    await Assignment.createIndexes();
    console.log('✅ Assignment indexes created');

    // Bus indexes (including 2dsphere for location)
    await Bus.createIndexes();
    console.log('✅ Bus indexes created (including 2dsphere for location)');

    // Verify 2dsphere indexes exist
    const busIndexes = await Bus.collection.indexes();
    const routeIndexes = await Route.collection.indexes();

    const hasBusLocationIndex = busIndexes.some(
      index => index.key && index.key.location === '2dsphere'
    );

    const hasRouteStopsIndex = routeIndexes.some(
      index => index.key && index.key['stops.location'] === '2dsphere'
    );

    if (hasBusLocationIndex) {
      console.log('✅ Bus location 2dsphere index verified');
    } else {
      console.log('⚠️ Bus location 2dsphere index not found, creating...');
      await Bus.collection.createIndex({ location: '2dsphere' });
      console.log('✅ Bus location 2dsphere index created');
    }

    if (hasRouteStopsIndex) {
      console.log('✅ Route stops 2dsphere index verified');
    } else {
      console.log('⚠️ Route stops 2dsphere index not found, creating...');
      await Route.collection.createIndex({ 'stops.location': '2dsphere' });
      console.log('✅ Route stops 2dsphere index created');
    }

    console.log('🎯 All database indexes initialized successfully!');
  } catch (error) {
    console.error('❌ Failed to initialize database indexes:', error);
    throw error;
  }
};

export const createSampleData = async (): Promise<void> => {
  try {
    console.log('🌱 Creating sample data...');

    // Check if data already exists
    const driverCount = await Driver.countDocuments();
    if (driverCount > 0) {
      console.log('ℹ️ Sample data already exists, skipping...');
      return;
    }

    // Create sample driver
    const sampleDriver = new Driver({
      phone: '+1234567890',
      name: 'John Doe',
      password: 'password123', // Will be hashed automatically
      role: 'driver',
    });
    await sampleDriver.save();
    console.log('✅ Sample driver created');

    // Create sample vehicle
    const sampleVehicle = new Vehicle({
      busId: 'BUS001',
      plate: 'ABC123',
      capacity: 50,
      type: 'bus',
      manufacturer: 'Mercedes',
      vehicleModel: 'Sprinter',
      year: 2020,
    });
    await sampleVehicle.save();
    console.log('✅ Sample vehicle created');

    // Create sample route
    const sampleRoute = new Route({
      routeId: 'RT001',
      name: 'Downtown Express',
      polyline: [
        [-122.4194, 37.7749], // San Francisco coordinates
        [-122.4089, 37.7897],
        [-122.3984, 37.8044],
      ],
      stops: [
        {
          stopId: 'STOP001',
          name: 'Downtown Station',
          location: {
            type: 'Point',
            coordinates: [-122.4194, 37.7749],
          },
        },
        {
          stopId: 'STOP002',
          name: 'Midtown Hub',
          location: {
            type: 'Point',
            coordinates: [-122.4089, 37.7897],
          },
        },
      ],
      description: 'Express route from downtown to uptown',
      estimatedDuration: 25,
      distance: 3.2,
    });
    await sampleRoute.save();
    console.log('✅ Sample route created');

    // Create sample assignment
    const sampleAssignment = new Assignment({
      driverId: sampleDriver._id,
      busId: 'BUS001',
      routeId: 'RT001',
      shiftStart: new Date('2024-01-01T08:00:00Z'),
      shiftEnd: new Date('2024-01-01T16:00:00Z'),
      active: true,
      status: 'scheduled',
    });
    await sampleAssignment.save();
    console.log('✅ Sample assignment created');

    // Create sample bus
    const sampleBus = new Bus({
      busId: 'BUS001',
      routeId: 'RT001',
      driverId: sampleDriver._id,
      online: false,
      speed: 0,
      heading: 0,
      location: {
        type: 'Point',
        coordinates: [-122.4194, 37.7749],
      },
      status: 'idle',
      passengers: 0,
      maxCapacity: 50,
    });
    await sampleBus.save();
    console.log('✅ Sample bus created');

    console.log('🌱 Sample data created successfully!');
  } catch (error) {
    console.error('❌ Failed to create sample data:', error);
    throw error;
  }
};

export default {
  initializeIndexes,
  createSampleData,
};
