import { Request, Response } from 'express';
import { Vehicle } from '../models/Vehicle';

export const getAllVehicles = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const vehicles = await Vehicle.find()
      .select('busId plate capacity type manufacturer vehicleModel year')
      .sort({ busId: 1 });

    res.status(200).json({
      success: true,
      message: 'Vehicles retrieved successfully',
      data: {
        vehicles,
        count: vehicles.length,
      },
    });
  } catch (error) {
    console.error('Get all vehicles error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving vehicles',
      code: 'VEHICLES_FETCH_ERROR',
    });
  }
};

export const getVehicleById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { busId } = req.params;

    const vehicle = await Vehicle.findOne({ busId }).select('-__v');

    if (!vehicle) {
      res.status(404).json({
        success: false,
        message: 'Vehicle not found',
        code: 'VEHICLE_NOT_FOUND',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Vehicle retrieved successfully',
      data: {
        vehicle,
      },
    });
  } catch (error) {
    console.error('Get vehicle by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving vehicle',
      code: 'VEHICLE_FETCH_ERROR',
    });
  }
};

export const getVehiclesByType = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { type } = req.params;

    const vehicles = await Vehicle.find({ type })
      .select('busId plate capacity manufacturer vehicleModel year')
      .sort({ busId: 1 });

    res.status(200).json({
      success: true,
      message: `Vehicles of type ${type} retrieved successfully`,
      data: {
        vehicles,
        count: vehicles.length,
        type,
      },
    });
  } catch (error) {
    console.error('Get vehicles by type error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving vehicles by type',
      code: 'VEHICLES_TYPE_FETCH_ERROR',
    });
  }
};

export const createVehicle = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const vehicleData = req.body;

    // Check if vehicle already exists
    const existingVehicle = await Vehicle.findOne({
      $or: [{ busId: vehicleData.busId }, { plate: vehicleData.plate }],
    });

    if (existingVehicle) {
      res.status(409).json({
        success: false,
        message: 'Vehicle with this Bus ID or plate already exists',
        code: 'VEHICLE_EXISTS',
      });
      return;
    }

    const vehicle = new Vehicle(vehicleData);
    await vehicle.save();

    res.status(201).json({
      success: true,
      message: 'Vehicle created successfully',
      data: {
        vehicle,
      },
    });
  } catch (error) {
    console.error('Create vehicle error:', error);

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
      message: 'Internal server error while creating vehicle',
      code: 'VEHICLE_CREATE_ERROR',
    });
  }
};

export const updateVehicle = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { busId } = req.params;
    const updateData = req.body;

    const vehicle = await Vehicle.findOneAndUpdate({ busId }, updateData, {
      new: true,
      runValidators: true,
    }).select('-__v');

    if (!vehicle) {
      res.status(404).json({
        success: false,
        message: 'Vehicle not found',
        code: 'VEHICLE_NOT_FOUND',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Vehicle updated successfully',
      data: {
        vehicle,
      },
    });
  } catch (error) {
    console.error('Update vehicle error:', error);

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
      message: 'Internal server error while updating vehicle',
      code: 'VEHICLE_UPDATE_ERROR',
    });
  }
};

export const deleteVehicle = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { busId } = req.params;

    const vehicle = await Vehicle.findOneAndDelete({ busId });

    if (!vehicle) {
      res.status(404).json({
        success: false,
        message: 'Vehicle not found',
        code: 'VEHICLE_NOT_FOUND',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Vehicle deleted successfully',
      data: {
        busId: vehicle.busId,
        plate: vehicle.plate,
      },
    });
  } catch (error) {
    console.error('Delete vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while deleting vehicle',
      code: 'VEHICLE_DELETE_ERROR',
    });
  }
};
