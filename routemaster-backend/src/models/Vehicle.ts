import mongoose, { Document, Schema } from 'mongoose';

export interface IVehicle {
  busId: string;
  plate: string;
  capacity: number;
  type: 'bus' | 'minibus' | 'coach';
  manufacturer: string;
  vehicleModel: string;
  year: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IVehicleDocument extends mongoose.Document, IVehicle {}

const VehicleSchema = new Schema<IVehicleDocument>(
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
    plate: {
      type: String,
      required: [true, 'License plate is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    capacity: {
      type: Number,
      required: [true, 'Vehicle capacity is required'],
      min: [1, 'Capacity must be at least 1'],
      max: [100, 'Capacity cannot exceed 100'],
    },
    type: {
      type: String,
      enum: ['bus', 'minibus', 'coach'],
      default: 'bus',
    },
    manufacturer: {
      type: String,
      required: [true, 'Manufacturer is required'],
      trim: true,
    },
    vehicleModel: {
      type: String,
      required: [true, 'Vehicle model is required'],
      trim: true,
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
      min: [1990, 'Year must be 1990 or later'],
      max: [new Date().getFullYear() + 1, 'Year cannot be in the future'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
VehicleSchema.index({ busId: 1 }, { unique: true });
VehicleSchema.index({ plate: 1 }, { unique: true });
VehicleSchema.index({ type: 1 });
VehicleSchema.index({ capacity: 1 });

export const Vehicle = mongoose.model<IVehicleDocument>(
  'Vehicle',
  VehicleSchema
);
export default Vehicle;
