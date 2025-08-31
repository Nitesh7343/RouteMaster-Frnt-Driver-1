import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IBus {
  busId: string;
  routeId: string;
  driverId: Types.ObjectId;
  online: boolean;
  lastOnlineAt: Date;
  lastUpdateAt: Date;
  speed: number; // km/h
  heading: number; // degrees 0-360
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  status: 'idle' | 'moving' | 'stopped' | 'maintenance';
  passengers: number;
  maxCapacity: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBusDocument extends mongoose.Document, IBus {}

const BusSchema = new Schema<IBusDocument>(
  {
    busId: {
      type: String,
      required: [true, 'Bus ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
      match: [
        /^[A-Z0-9]{6,10}$/,
        'Bus ID must be 6-10 alphanumeric characters',
      ],
    },
    routeId: {
      type: String,
      required: [true, 'Route ID is required'],
      trim: true,
      uppercase: true,
    },
    driverId: {
      type: Schema.Types.ObjectId,
      ref: 'Driver',
      required: [true, 'Driver ID is required'],
    },
    online: {
      type: Boolean,
      default: false,
    },
    lastOnlineAt: {
      type: Date,
      default: Date.now,
    },
    lastUpdateAt: {
      type: Date,
      default: Date.now,
    },
    speed: {
      type: Number,
      default: 0,
      min: [0, 'Speed cannot be negative'],
      max: [200, 'Speed cannot exceed 200 km/h'],
    },
    heading: {
      type: Number,
      default: 0,
      min: [0, 'Heading must be between 0 and 360 degrees'],
      max: [360, 'Heading must be between 0 and 360 degrees'],
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: function (coords: number[]) {
            return (
              coords.length === 2 &&
              coords[0] >= -180 &&
              coords[0] <= 180 && // longitude
              coords[1] >= -90 &&
              coords[1] <= 90
            ); // latitude
          },
          message:
            'Coordinates must be [longitude, latitude] with valid ranges',
        },
      },
    },
    status: {
      type: String,
      enum: ['idle', 'moving', 'stopped', 'maintenance'],
      default: 'idle',
    },
    passengers: {
      type: Number,
      default: 0,
      min: [0, 'Passenger count cannot be negative'],
      validate: {
        validator: function (this: IBusDocument, passengers: number) {
          return passengers <= this.maxCapacity;
        },
        message: 'Passenger count cannot exceed maximum capacity',
      },
    },
    maxCapacity: {
      type: Number,
      required: [true, 'Maximum capacity is required'],
      min: [1, 'Maximum capacity must be at least 1'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
BusSchema.index({ busId: 1 }, { unique: true });
BusSchema.index({ routeId: 1 });
BusSchema.index({ driverId: 1 });
BusSchema.index({ online: 1 });
BusSchema.index({ status: 1 });
BusSchema.index({ lastUpdateAt: 1 });
BusSchema.index({ location: '2dsphere' }); // Geospatial index for location queries
BusSchema.index({ routeId: 1, online: 1 }); // Compound index for online buses on specific routes
BusSchema.index({ driverId: 1, online: 1 }); // Compound index for online drivers

// Virtual for occupancy percentage
BusSchema.virtual('occupancyPercentage').get(function () {
  if (this.maxCapacity > 0) {
    return Math.round((this.passengers / this.maxCapacity) * 100);
  }
  return 0;
});

// Virtual for isMoving
BusSchema.virtual('isMoving').get(function () {
  return this.speed > 5; // Consider moving if speed > 5 km/h
});

// Pre-save middleware to update timestamps
BusSchema.pre('save', function (next) {
  if (this.isModified('online') && this.online) {
    this.lastOnlineAt = new Date();
  }
  if (
    this.isModified('location') ||
    this.isModified('speed') ||
    this.isModified('heading')
  ) {
    this.lastUpdateAt = new Date();
  }
  next();
});

export const Bus = mongoose.model<IBusDocument>('Bus', BusSchema);
export default Bus;
