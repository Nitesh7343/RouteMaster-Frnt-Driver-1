import jwt from 'jsonwebtoken';
import { verifyToken, JWTPayload } from './jwt';
import { Driver } from '../models/Driver';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-here';

export interface AuthenticatedSocketData {
  driverId: string;
  phone: string;
  role: string;
  busId?: string;
  routeId?: string;
}

export const authenticateSocket = async (
  token: string
): Promise<AuthenticatedSocketData> => {
  try {
    // Verify JWT token
    const payload = verifyToken(token);

    // Find driver in database
    const driver = await Driver.findById(payload.driverId).select(
      '_id phone role'
    );
    if (!driver) {
      throw new Error('Driver not found');
    }

    return {
      driverId: (driver._id as any).toString(),
      phone: driver.phone,
      role: driver.role,
    };
  } catch (error) {
    throw new Error('Authentication failed');
  }
};

export const verifySocketToken = (token: string): JWTPayload => {
  try {
    return verifyToken(token);
  } catch (error) {
    throw new Error('Invalid token');
  }
};
