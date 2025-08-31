import { Request, Response } from 'express';
import { Bus } from '../models/Bus';

export const getBusById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { busId } = req.params;

    const bus = await Bus.findOne({ busId })
      .select(
        'busId routeId driverId online location speed heading lastOnlineAt lastUpdateAt status passengers maxCapacity'
      )
      .populate('driverId', 'name phone')
      .lean();

    if (!bus) {
      res.status(404).json({
        success: false,
        message: 'Bus not found',
        code: 'BUS_NOT_FOUND',
      });
      return;
    }

    // Calculate last seen information
    const now = new Date();
    const lastSeen = bus.lastUpdateAt || bus.lastOnlineAt;
    const lastSeenMinutes = lastSeen
      ? Math.round((now.getTime() - lastSeen.getTime()) / (1000 * 60))
      : null;

    const busData = {
      ...bus,
      lastSeen: {
        timestamp: lastSeen,
        minutesAgo: lastSeenMinutes,
        status: lastSeenMinutes
          ? lastSeenMinutes < 5
            ? 'very_recent'
            : lastSeenMinutes < 30
              ? 'recent'
              : lastSeenMinutes < 120
                ? 'moderate'
                : 'old'
          : 'unknown',
      },
    };

    res.status(200).json({
      success: true,
      message: 'Bus information retrieved successfully',
      data: {
        bus: busData,
      },
    });
  } catch (error) {
    console.error('Get bus by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving bus information',
      code: 'BUS_FETCH_ERROR',
    });
  }
};

export const getNearbyBuses = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { lng, lat, r } = req.query;

    // Validate query parameters
    if (!lng || !lat || !r) {
      res.status(400).json({
        success: false,
        message: 'Missing required parameters: lng, lat, r',
        code: 'MISSING_PARAMETERS',
      });
      return;
    }

    const longitude = parseFloat(lng as string);
    const latitude = parseFloat(lat as string);
    const radius = parseInt(r as string);

    // Validate coordinate ranges
    if (isNaN(longitude) || longitude < -180 || longitude > 180) {
      res.status(400).json({
        success: false,
        message: 'Invalid longitude value. Must be between -180 and 180',
        code: 'INVALID_LONGITUDE',
      });
      return;
    }

    if (isNaN(latitude) || latitude < -90 || latitude > 90) {
      res.status(400).json({
        success: false,
        message: 'Invalid latitude value. Must be between -90 and 90',
        code: 'INVALID_LATITUDE',
      });
      return;
    }

    if (isNaN(radius) || radius <= 0 || radius > 50000) {
      res.status(400).json({
        success: false,
        message: 'Invalid radius value. Must be between 1 and 50000 meters',
        code: 'INVALID_RADIUS',
      });
      return;
    }

    // Find nearby buses using $near query with 2dsphere index
    const nearbyBuses = await Bus.find({
      online: true,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          $maxDistance: radius,
        },
      },
    })
      .select(
        'busId routeId driverId location speed heading lastOnlineAt lastUpdateAt status passengers maxCapacity'
      )
      .populate('driverId', 'name phone')
      .limit(50)
      .lean();

    // Calculate distances and last seen information for each bus
    const now = new Date();
    const busesWithDetails = nearbyBuses.map(bus => {
      const lastSeen = bus.lastUpdateAt || bus.lastOnlineAt;
      const lastSeenMinutes = lastSeen
        ? Math.round((now.getTime() - lastSeen.getTime()) / (1000 * 60))
        : null;

      // Calculate distance from query point (approximate)
      const busLng = bus.location.coordinates[0];
      const busLat = bus.location.coordinates[1];
      const distance = calculateDistance(latitude, longitude, busLat, busLng);

      return {
        ...bus,
        distance: Math.round(distance), // Distance in meters
        lastSeen: {
          timestamp: lastSeen,
          minutesAgo: lastSeenMinutes,
          status: lastSeenMinutes
            ? lastSeenMinutes < 5
              ? 'very_recent'
              : lastSeenMinutes < 30
                ? 'recent'
                : lastSeenMinutes < 120
                  ? 'moderate'
                  : 'old'
            : 'unknown',
        },
      };
    });

    // Sort by distance (closest first)
    busesWithDetails.sort((a, b) => a.distance - b.distance);

    res.status(200).json({
      success: true,
      message: 'Nearby buses retrieved successfully',
      data: {
        buses: busesWithDetails,
        count: busesWithDetails.length,
        query: {
          center: { longitude, latitude },
          radius,
          maxResults: 50,
        },
        timestamp: now.toISOString(),
      },
    });
  } catch (error) {
    console.error('Get nearby buses error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving nearby buses',
      code: 'NEARBY_BUSES_FETCH_ERROR',
    });
  }
};

export const getAllBuses = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { online, routeId, limit = 100 } = req.query;

    const query: any = {};

    // Filter by online status if specified
    if (online !== undefined) {
      query.online = online === 'true';
    }

    // Filter by route if specified
    if (routeId) {
      query.routeId = routeId;
    }

    const maxLimit = Math.min(parseInt(limit as string) || 100, 200); // Cap at 200

    const buses = await Bus.find(query)
      .select(
        'busId routeId driverId online location speed heading lastOnlineAt lastUpdateAt status passengers maxCapacity'
      )
      .populate('driverId', 'name phone')
      .limit(maxLimit)
      .sort({ lastUpdateAt: -1 })
      .lean();

    // Calculate last seen information for each bus
    const now = new Date();
    const busesWithDetails = buses.map(bus => {
      const lastSeen = bus.lastUpdateAt || bus.lastOnlineAt;
      const lastSeenMinutes = lastSeen
        ? Math.round((now.getTime() - lastSeen.getTime()) / (1000 * 60))
        : null;

      return {
        ...bus,
        lastSeen: {
          timestamp: lastSeen,
          minutesAgo: lastSeenMinutes,
          status: lastSeenMinutes
            ? lastSeenMinutes < 5
              ? 'very_recent'
              : lastSeenMinutes < 30
                ? 'recent'
                : lastSeenMinutes < 120
                  ? 'moderate'
                  : 'old'
            : 'unknown',
        },
      };
    });

    res.status(200).json({
      success: true,
      message: 'Buses retrieved successfully',
      data: {
        buses: busesWithDetails,
        count: busesWithDetails.length,
        filters: {
          online: query.online,
          routeId: query.routeId,
          limit: maxLimit,
        },
        timestamp: now.toISOString(),
      },
    });
  } catch (error) {
    console.error('Get all buses error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving buses',
      code: 'BUSES_FETCH_ERROR',
    });
  }
};

// Helper function to calculate distance between two points using Haversine formula
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
