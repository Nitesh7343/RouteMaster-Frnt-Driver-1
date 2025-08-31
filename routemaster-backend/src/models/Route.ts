import mongoose, { Document, Schema } from 'mongoose';

export interface IStop {
  stopId: string;
  name: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  description?: string;
  estimatedTime?: number; // minutes from route start
}

export interface IRoute {
  routeId: string;
  name: string;
  polyline: [number, number][]; // Array of [longitude, latitude]
  stops: IStop[];
  description?: string;
  estimatedDuration?: number; // minutes
  distance?: number; // kilometers
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRouteDocument extends mongoose.Document, IRoute {}

const StopSchema = new Schema<IStop>({
  stopId: {
    type: String,
    required: [true, 'Stop ID is required'],
    trim: true,
  },
  name: {
    type: String,
    required: [true, 'Stop name is required'],
    trim: true,
    minlength: [2, 'Stop name must be at least 2 characters long'],
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
        message: 'Coordinates must be [longitude, latitude] with valid ranges',
      },
    },
  },
  description: {
    type: String,
    trim: true,
  },
  estimatedTime: {
    type: Number,
    min: [0, 'Estimated time cannot be negative'],
  },
});

const RouteSchema = new Schema<IRouteDocument>(
  {
    routeId: {
      type: String,
      required: [true, 'Route ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
      match: [
        /^[A-Z0-9]{4,8}$/,
        'Route ID must be 4-8 alphanumeric characters',
      ],
    },
    name: {
      type: String,
      required: [true, 'Route name is required'],
      trim: true,
      minlength: [3, 'Route name must be at least 3 characters long'],
      maxlength: [100, 'Route name cannot exceed 100 characters'],
    },
    polyline: {
      type: [[Number]],
      required: [true, 'Polyline coordinates are required'],
      validate: {
        validator: function (coords: [number, number][]) {
          return (
            coords.length >= 2 &&
            coords.every(
              coord =>
                coord.length === 2 &&
                coord[0] >= -180 &&
                coord[0] <= 180 && // longitude
                coord[1] >= -90 &&
                coord[1] <= 90 // latitude
            )
          );
        },
        message:
          'Polyline must have at least 2 valid [longitude, latitude] coordinates',
      },
    },
    stops: [StopSchema],
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    estimatedDuration: {
      type: Number,
      min: [1, 'Estimated duration must be at least 1 minute'],
    },
    distance: {
      type: Number,
      min: [0.1, 'Distance must be at least 0.1 km'],
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
RouteSchema.index({ routeId: 1 }, { unique: true });
RouteSchema.index({ name: 1 });
RouteSchema.index({ active: 1 });
RouteSchema.index({ 'stops.location': '2dsphere' }); // Geospatial index for stops

export const Route = mongoose.model<IRouteDocument>('Route', RouteSchema);
export default Route;
