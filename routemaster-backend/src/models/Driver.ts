import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IDriver {
  phone: string;
  name: string;
  passwordHash: string;
  role: 'driver' | 'admin';
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IDriverDocument extends mongoose.Document, IDriver {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const DriverSchema = new Schema<IDriverDocument>(
  {
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
      match: [/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number'],
    },
    name: {
      type: String,
      required: [true, 'Driver name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
    },
    role: {
      type: String,
      enum: ['driver', 'admin'],
      default: 'driver',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
DriverSchema.index({ phone: 1 }, { unique: true });
DriverSchema.index({ role: 1 });

// Virtual for password (exclude from JSON)
DriverSchema.virtual('password').set(function (password: string) {
  this.passwordHash = bcrypt.hashSync(password, 12);
});

// Instance method to compare password
DriverSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Pre-save middleware to hash password if modified
DriverSchema.pre('save', function (next) {
  if (
    this.isModified('passwordHash') &&
    !this.passwordHash.startsWith('$2b$')
  ) {
    this.passwordHash = bcrypt.hashSync(this.passwordHash, 12);
  }
  next();
});

export const Driver = mongoose.model<IDriverDocument>('Driver', DriverSchema);
export default Driver;
