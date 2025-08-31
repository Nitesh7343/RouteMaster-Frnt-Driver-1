import { Request, Response } from 'express';
import { Route } from '../models/Route';

export const getAllRoutes = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const routes = await Route.find({ active: true })
      .select('routeId name description estimatedDuration distance active')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      message: 'Routes retrieved successfully',
      data: {
        routes,
        count: routes.length,
      },
    });
  } catch (error) {
    console.error('Get all routes error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving routes',
      code: 'ROUTES_FETCH_ERROR',
    });
  }
};

export const getRouteById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { routeId } = req.params;

    const route = await Route.findOne({ routeId, active: true }).select('-__v');

    if (!route) {
      res.status(404).json({
        success: false,
        message: 'Route not found',
        code: 'ROUTE_NOT_FOUND',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Route retrieved successfully',
      data: {
        route,
      },
    });
  } catch (error) {
    console.error('Get route by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving route',
      code: 'ROUTE_FETCH_ERROR',
    });
  }
};

export const getRouteStops = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { routeId } = req.params;

    const route = await Route.findOne({ routeId, active: true }).select(
      'routeId name stops'
    );

    if (!route) {
      res.status(404).json({
        success: false,
        message: 'Route not found',
        code: 'ROUTE_NOT_FOUND',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Route stops retrieved successfully',
      data: {
        routeId: route.routeId,
        routeName: route.name,
        stops: route.stops,
        stopCount: route.stops.length,
      },
    });
  } catch (error) {
    console.error('Get route stops error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving route stops',
      code: 'STOPS_FETCH_ERROR',
    });
  }
};

export const createRoute = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const routeData = req.body;

    // Check if route already exists
    const existingRoute = await Route.findOne({ routeId: routeData.routeId });
    if (existingRoute) {
      res.status(409).json({
        success: false,
        message: 'Route with this ID already exists',
        code: 'ROUTE_EXISTS',
      });
      return;
    }

    const route = new Route(routeData);
    await route.save();

    res.status(201).json({
      success: true,
      message: 'Route created successfully',
      data: {
        route,
      },
    });
  } catch (error) {
    console.error('Create route error:', error);

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
      message: 'Internal server error while creating route',
      code: 'ROUTE_CREATE_ERROR',
    });
  }
};

export const updateRoute = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { routeId } = req.params;
    const updateData = req.body;

    const route = await Route.findOneAndUpdate(
      { routeId, active: true },
      updateData,
      { new: true, runValidators: true }
    ).select('-__v');

    if (!route) {
      res.status(404).json({
        success: false,
        message: 'Route not found',
        code: 'ROUTE_NOT_FOUND',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Route updated successfully',
      data: {
        route,
      },
    });
  } catch (error) {
    console.error('Update route error:', error);

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
      message: 'Internal server error while updating route',
      code: 'ROUTE_UPDATE_ERROR',
    });
  }
};

export const deleteRoute = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { routeId } = req.params;

    const route = await Route.findOneAndUpdate(
      { routeId, active: true },
      { active: false },
      { new: true }
    );

    if (!route) {
      res.status(404).json({
        success: false,
        message: 'Route not found',
        code: 'ROUTE_NOT_FOUND',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Route deactivated successfully',
      data: {
        routeId: route.routeId,
        active: route.active,
      },
    });
  } catch (error) {
    console.error('Delete route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while deactivating route',
      code: 'ROUTE_DELETE_ERROR',
    });
  }
};
