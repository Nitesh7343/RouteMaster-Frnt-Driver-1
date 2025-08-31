import { Request, Response, NextFunction } from 'express';
import { Driver } from '../models/Driver';
import { verifyToken, JWTPayload } from '../utils/jwt';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: any; // Will be populated with driver data
      token?: string; // Raw token for debugging
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user: any; // Driver document
  token: string;
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token is required',
        code: 'TOKEN_MISSING',
      });
      return;
    }

    // Verify token
    let payload: JWTPayload;
    try {
      payload = verifyToken(token);
    } catch (error) {
      res.status(401).json({
        success: false,
        message: error instanceof Error ? error.message : 'Invalid token',
        code: 'TOKEN_INVALID',
      });
      return;
    }

    // Find driver by ID
    const driver = await Driver.findById(payload.driverId).select(
      '-passwordHash'
    );
    if (!driver) {
      res.status(401).json({
        success: false,
        message: 'Driver not found',
        code: 'DRIVER_NOT_FOUND',
      });
      return;
    }

    // Check if driver is active
    if (driver.role === 'admin' && !driver.role) {
      res.status(403).json({
        success: false,
        message: 'Driver account is inactive',
        code: 'ACCOUNT_INACTIVE',
      });
      return;
    }

    // Attach driver and token to request
    req.user = driver;
    req.token = token;

    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during authentication',
      code: 'AUTH_ERROR',
    });
  }
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      try {
        const payload = verifyToken(token);
        const driver = await Driver.findById(payload.driverId).select(
          '-passwordHash'
        );

        if (driver) {
          req.user = driver;
          req.token = token;
        }
      } catch (error) {
        // Token is invalid, but we don't fail the request
        console.warn('Invalid token in optional auth:', error);
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next(); // Continue without authentication
  }
};

// Role-based access control middleware
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
      });
      return;
    }

    next();
  };
};

// Admin-only middleware
export const requireAdmin = requireRole(['admin']);

// Driver-only middleware
export const requireDriver = requireRole(['driver', 'admin']);
