import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAssignment {
  driverId: Types.ObjectId;
  busId: string;
  routeId: string;
  shiftStart: Date;
  shiftEnd: Date;
  active: boolean;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAssignmentDocument extends mongoose.Document, IAssignment {}

const AssignmentSchema = new Schema<IAssignmentDocument>(
  {
    driverId: {
      type: Schema.Types.ObjectId,
      ref: 'Driver',
      required: [true, 'Driver ID is required'],
    },
    busId: {
      type: String,
      required: [true, 'Bus ID is required'],
      trim: true,
      uppercase: true,
    },
    routeId: {
      type: String,
      required: [true, 'Route ID is required'],
      trim: true,
      uppercase: true,
    },
    shiftStart: {
      type: Date,
      required: [true, 'Shift start time is required'],
    },
    shiftEnd: {
      type: Date,
      required: [true, 'Shift end time is required'],
      validate: {
        validator: function (this: IAssignmentDocument, endTime: Date) {
          return endTime > this.shiftStart;
        },
        message: 'Shift end time must be after shift start time',
      },
    },
    active: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ['scheduled', 'active', 'completed', 'cancelled'],
      default: 'scheduled',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
AssignmentSchema.index({ driverId: 1 });
AssignmentSchema.index({ busId: 1 });
AssignmentSchema.index({ routeId: 1 });
AssignmentSchema.index({ active: 1 });
AssignmentSchema.index({ status: 1 });
AssignmentSchema.index({ shiftStart: 1 });
AssignmentSchema.index({ shiftEnd: 1 });
AssignmentSchema.index({ driverId: 1, active: 1 }); // Compound index for active driver assignments
AssignmentSchema.index({ busId: 1, active: 1 }); // Compound index for active bus assignments

// Virtual for shift duration
AssignmentSchema.virtual('shiftDuration').get(function () {
  if (this.shiftStart && this.shiftEnd) {
    return Math.round(
      (this.shiftEnd.getTime() - this.shiftStart.getTime()) / (1000 * 60)
    ); // minutes
  }
  return null;
});

// Pre-save middleware to validate shift times
AssignmentSchema.pre('save', function (next) {
  if (this.isModified('shiftStart') || this.isModified('shiftEnd')) {
    if (this.shiftEnd <= this.shiftStart) {
      return next(new Error('Shift end time must be after shift start time'));
    }
  }
  next();
});

export const Assignment = mongoose.model<IAssignmentDocument>(
  'Assignment',
  AssignmentSchema
);
export default Assignment;
