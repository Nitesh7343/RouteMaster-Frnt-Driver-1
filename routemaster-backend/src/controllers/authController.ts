import { Request, Response } from 'express';
import { Driver } from '../models/Driver';
import { generateToken } from '../utils/jwt';
import { SignupInput, LoginInput } from '../utils/validation';

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, name, password }: SignupInput = req.body;

    // Check if driver already exists
    const existingDriver = await Driver.findOne({ phone });
    if (existingDriver) {
      res.status(409).json({
        success: false,
        message: 'Driver with this phone number already exists',
        code: 'DRIVER_EXISTS',
      });
      return;
    }

    // Create new driver
    const driver = new Driver({
      phone,
      name,
      password, // Will be hashed automatically by the model
    });

    await driver.save();

    // Generate JWT token
    const token = generateToken(driver);

    // Remove password hash from response
    const driverResponse = driver.toObject();
    delete (driverResponse as any).passwordHash;

    res.status(201).json({
      success: true,
      message: 'Driver account created successfully',
      data: {
        driver: driverResponse,
        token,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);

    if (error instanceof Error && error.name === 'ValidationError') {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error during signup',
      code: 'SIGNUP_ERROR',
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, password }: LoginInput = req.body;

    // Find driver by phone number
    const driver = await Driver.findOne({ phone });
    if (!driver) {
      res.status(401).json({
        success: false,
        message: 'Invalid phone number or password',
        code: 'INVALID_CREDENTIALS',
      });
      return;
    }

    // Verify password
    const isPasswordValid = await driver.comparePassword(password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid phone number or password',
        code: 'INVALID_CREDENTIALS',
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

    // Generate JWT token
    const token = generateToken(driver);

    // Remove password hash from response
    const driverResponse = driver.toObject();
    delete (driverResponse as any).passwordHash;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        driver: driverResponse,
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login',
      code: 'LOGIN_ERROR',
    });
  }
};

export const getProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Driver data is already attached by auth middleware
    const driver = req.user;

    if (!driver) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
      return;
    }

    // Remove password hash from response
    const driverResponse = driver.toObject();
    delete (driverResponse as any).passwordHash;

    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        driver: driverResponse,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving profile',
      code: 'PROFILE_ERROR',
    });
  }
};

export const updateProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const driver = req.user;
    if (!driver) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
      return;
    }

    const { name, currentPassword, newPassword } = req.body;

    // Update name if provided
    if (name) {
      driver.name = name;
    }

    // Update password if provided
    if (currentPassword && newPassword) {
      const isCurrentPasswordValid =
        await driver.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        res.status(400).json({
          success: false,
          message: 'Current password is incorrect',
          code: 'INVALID_CURRENT_PASSWORD',
        });
        return;
      }

      driver.password = newPassword; // Will be hashed automatically
    }

    await driver.save();

    // Remove password hash from response
    const driverResponse = driver.toObject();
    delete (driverResponse as any).passwordHash;

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        driver: driverResponse,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);

    if (error instanceof Error && error.name === 'ValidationError') {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while updating profile',
      code: 'UPDATE_PROFILE_ERROR',
    });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    // In a real application, you might want to blacklist the token
    // For now, we'll just return a success response
    res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during logout',
      code: 'LOGOUT_ERROR',
    });
  }
};
