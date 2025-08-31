import { Request, Response } from 'express';
import { Assignment } from '../models/Assignment';
import { Route } from '../models/Route';
import { Vehicle } from '../models/Vehicle';

export const getMyAssignment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const driverId = req.user._id;
    const currentTime = new Date();

    // Find active assignment for the current driver
    const assignment = await Assignment.findOne({
      driverId,
      active: true,
      $and: [
        { shiftStart: { $lte: currentTime } },
        { shiftEnd: { $gte: currentTime } },
      ],
    }).populate('driverId', 'name phone');

    if (!assignment) {
      res.status(404).json({
        success: false,
        message: 'No active assignment found for current time',
        code: 'NO_ACTIVE_ASSIGNMENT',
        data: {
          assignment: null,
          currentTime: currentTime.toISOString(),
        },
      });
      return;
    }

    // Get route details
    const route = await Route.findOne({ routeId: assignment.routeId }).select(
      'name description estimatedDuration distance'
    );

    // Get vehicle details
    const vehicle = await Vehicle.findOne({ busId: assignment.busId }).select(
      'plate capacity type manufacturer vehicleModel'
    );

    // Calculate shift progress
    const shiftStart = new Date(assignment.shiftStart);
    const shiftEnd = new Date(assignment.shiftEnd);
    const totalShiftDuration = shiftEnd.getTime() - shiftStart.getTime();
    const elapsedTime = currentTime.getTime() - shiftStart.getTime();
    const shiftProgress = Math.min(
      Math.max((elapsedTime / totalShiftDuration) * 100, 0),
      100
    );

    // Calculate remaining time
    const remainingTime = Math.max(
      shiftEnd.getTime() - currentTime.getTime(),
      0
    );
    const remainingMinutes = Math.ceil(remainingTime / (1000 * 60));

    const assignmentData = {
      assignmentId: assignment._id,
      busId: assignment.busId,
      routeId: assignment.routeId,
      shift: {
        start: assignment.shiftStart,
        end: assignment.shiftEnd,
        progress: Math.round(shiftProgress),
        remainingMinutes,
        status: assignment.status,
      },
      route: route || null,
      vehicle: vehicle || null,
      notes: assignment.notes,
    };

    res.status(200).json({
      success: true,
      message: 'Current assignment retrieved successfully',
      data: {
        assignment: assignmentData,
        currentTime: currentTime.toISOString(),
      },
    });
  } catch (error) {
    console.error('Get my assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving assignment',
      code: 'ASSIGNMENT_FETCH_ERROR',
    });
  }
};

export const getMyUpcomingAssignments = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const driverId = req.user._id;
    const currentTime = new Date();

    // Find upcoming assignments for the current driver
    const upcomingAssignments = await Assignment.find({
      driverId,
      active: true,
      shiftStart: { $gt: currentTime },
    })
      .populate('driverId', 'name phone')
      .sort({ shiftStart: 1 })
      .limit(5);

    // Get route and vehicle details for each assignment
    const assignmentsWithDetails = await Promise.all(
      upcomingAssignments.map(async assignment => {
        const route = await Route.findOne({
          routeId: assignment.routeId,
        }).select('name description estimatedDuration');

        const vehicle = await Vehicle.findOne({
          busId: assignment.busId,
        }).select('plate capacity type');

        return {
          assignmentId: assignment._id,
          busId: assignment.busId,
          routeId: assignment.routeId,
          shift: {
            start: assignment.shiftStart,
            end: assignment.shiftEnd,
            status: assignment.status,
          },
          route: route || null,
          vehicle: vehicle || null,
          notes: assignment.notes,
        };
      })
    );

    res.status(200).json({
      success: true,
      message: 'Upcoming assignments retrieved successfully',
      data: {
        assignments: assignmentsWithDetails,
        count: assignmentsWithDetails.length,
        currentTime: currentTime.toISOString(),
      },
    });
  } catch (error) {
    console.error('Get upcoming assignments error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving upcoming assignments',
      code: 'UPCOMING_ASSIGNMENTS_FETCH_ERROR',
    });
  }
};

export const getMyAssignmentHistory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const driverId = req.user._id;
    const { page = 1, limit = 10, status } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query: any = { driverId };
    if (status) {
      query.status = status;
    }

    // Get total count
    const totalAssignments = await Assignment.countDocuments(query);

    // Get assignments with pagination
    const assignments = await Assignment.find(query)
      .populate('driverId', 'name phone')
      .sort({ shiftStart: -1 })
      .skip(skip)
      .limit(limitNum);

    // Get route and vehicle details for each assignment
    const assignmentsWithDetails = await Promise.all(
      assignments.map(async assignment => {
        const route = await Route.findOne({
          routeId: assignment.routeId,
        }).select('name description');

        const vehicle = await Vehicle.findOne({
          busId: assignment.busId,
        }).select('plate capacity type');

        return {
          assignmentId: assignment._id,
          busId: assignment.busId,
          routeId: assignment.routeId,
          shift: {
            start: assignment.shiftStart,
            end: assignment.shiftEnd,
            status: assignment.status,
          },
          route: route || null,
          vehicle: vehicle || null,
          notes: assignment.notes,
          completedAt: assignment.updatedAt,
        };
      })
    );

    res.status(200).json({
      success: true,
      message: 'Assignment history retrieved successfully',
      data: {
        assignments: assignmentsWithDetails,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalAssignments / limitNum),
          totalAssignments,
          hasNextPage: pageNum * limitNum < totalAssignments,
          hasPrevPage: pageNum > 1,
        },
      },
    });
  } catch (error) {
    console.error('Get assignment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving assignment history',
      code: 'ASSIGNMENT_HISTORY_FETCH_ERROR',
    });
  }
};
