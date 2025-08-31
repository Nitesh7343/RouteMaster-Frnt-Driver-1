import { Request, Response } from 'express';
import { Assignment } from '../models/Assignment';
import { Driver } from '../models/Driver';
import { Vehicle } from '../models/Vehicle';
import { Route } from '../models/Route';

export const getAllAssignments = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const assignments = await Assignment.find()
      .populate('driverId', 'name phone')
      .select('busId routeId shiftStart shiftEnd active status')
      .sort({ shiftStart: -1 });

    res.status(200).json({
      success: true,
      message: 'Assignments retrieved successfully',
      data: {
        assignments,
        count: assignments.length,
      },
    });
  } catch (error) {
    console.error('Get all assignments error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving assignments',
      code: 'ASSIGNMENTS_FETCH_ERROR',
    });
  }
};

export const getAssignmentById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { assignmentId } = req.params;

    const assignment = await Assignment.findById(assignmentId)
      .populate('driverId', 'name phone role')
      .select('-__v');

    if (!assignment) {
      res.status(404).json({
        success: false,
        message: 'Assignment not found',
        code: 'ASSIGNMENT_NOT_FOUND',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Assignment retrieved successfully',
      data: {
        assignment,
      },
    });
  } catch (error) {
    console.error('Get assignment by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving assignment',
      code: 'ASSIGNMENT_FETCH_ERROR',
    });
  }
};

export const getActiveAssignments = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const assignments = await Assignment.find({ active: true })
      .populate('driverId', 'name phone')
      .select('busId routeId shiftStart shiftEnd status')
      .sort({ shiftStart: 1 });

    res.status(200).json({
      success: true,
      message: 'Active assignments retrieved successfully',
      data: {
        assignments,
        count: assignments.length,
      },
    });
  } catch (error) {
    console.error('Get active assignments error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving active assignments',
      code: 'ACTIVE_ASSIGNMENTS_FETCH_ERROR',
    });
  }
};

export const createAssignment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { driverId, busId, routeId, shiftStart, shiftEnd, active } = req.body;

    // Validate that driver exists
    const driver = await Driver.findById(driverId);
    if (!driver) {
      res.status(404).json({
        success: false,
        message: 'Driver not found',
        code: 'DRIVER_NOT_FOUND',
      });
      return;
    }

    // Validate that vehicle exists
    const vehicle = await Vehicle.findOne({ busId });
    if (!vehicle) {
      res.status(404).json({
        success: false,
        message: 'Vehicle not found',
        code: 'VEHICLE_NOT_FOUND',
      });
      return;
    }

    // Validate that route exists
    const route = await Route.findOne({ routeId, active: true });
    if (!route) {
      res.status(404).json({
        success: false,
        message: 'Route not found or inactive',
        code: 'ROUTE_NOT_FOUND',
      });
      return;
    }

    // Check for conflicting assignments (same driver, vehicle, or route in overlapping time)
    const conflictingAssignment = await Assignment.findOne({
      $or: [
        { driverId, active: true },
        { busId, active: true },
        { routeId, active: true },
      ],
      $and: [
        {
          $or: [
            { shiftStart: { $lt: shiftEnd, $gte: shiftStart } },
            { shiftEnd: { $gt: shiftStart, $lte: shiftEnd } },
            { shiftStart: { $lte: shiftStart }, shiftEnd: { $gte: shiftEnd } },
          ],
        },
      ],
    });

    if (conflictingAssignment) {
      res.status(409).json({
        success: false,
        message: 'Conflicting assignment found for the specified time period',
        code: 'CONFLICTING_ASSIGNMENT',
      });
      return;
    }

    const assignment = new Assignment({
      driverId,
      busId,
      routeId,
      shiftStart: new Date(shiftStart),
      shiftEnd: new Date(shiftEnd),
      active: active || true,
    });

    await assignment.save();

    // Populate the created assignment for response
    const populatedAssignment = await Assignment.findById(assignment._id)
      .populate('driverId', 'name phone')
      .select('-__v');

    res.status(201).json({
      success: true,
      message: 'Assignment created successfully',
      data: {
        assignment: populatedAssignment,
      },
    });
  } catch (error) {
    console.error('Create assignment error:', error);

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
      message: 'Internal server error while creating assignment',
      code: 'ASSIGNMENT_CREATE_ERROR',
    });
  }
};

export const updateAssignment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { assignmentId } = req.params;
    const updateData = req.body;

    const assignment = await Assignment.findByIdAndUpdate(
      assignmentId,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('driverId', 'name phone')
      .select('-__v');

    if (!assignment) {
      res.status(404).json({
        success: false,
        message: 'Assignment not found',
        code: 'ASSIGNMENT_NOT_FOUND',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Assignment updated successfully',
      data: {
        assignment,
      },
    });
  } catch (error) {
    console.error('Update assignment error:', error);

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
      message: 'Internal server error while updating assignment',
      code: 'ASSIGNMENT_UPDATE_ERROR',
    });
  }
};

export const deactivateAssignment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { assignmentId } = req.params;

    const assignment = await Assignment.findByIdAndUpdate(
      assignmentId,
      { active: false, status: 'completed' },
      { new: true }
    );

    if (!assignment) {
      res.status(404).json({
        success: false,
        message: 'Assignment not found',
        code: 'ASSIGNMENT_NOT_FOUND',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Assignment deactivated successfully',
      data: {
        assignmentId: assignment._id,
        active: assignment.active,
        status: assignment.status,
      },
    });
  } catch (error) {
    console.error('Deactivate assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while deactivating assignment',
      code: 'ASSIGNMENT_DEACTIVATE_ERROR',
    });
  }
};
