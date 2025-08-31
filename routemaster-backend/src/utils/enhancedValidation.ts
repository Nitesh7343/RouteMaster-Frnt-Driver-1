import { z } from 'zod';

// Enhanced authentication schemas
export const enhancedSignupSchema = z.object({
  phone: z
    .string()
    .regex(
      /^\+?[1-9]\d{1,14}$/,
      'Phone number must be a valid international format'
    )
    .min(10, 'Phone number too short')
    .max(15, 'Phone number too long')
    .transform(val => val.replace(/\s+/g, '')), // Remove whitespace
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .regex(
      /^[a-zA-Z\s\-']+$/,
      'Name can only contain letters, spaces, hyphens, and apostrophes'
    )
    .transform(val => val.trim()),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    )
    .transform(val => val.trim()),
  role: z.enum(['driver', 'admin']).default('driver'),
});

export const enhancedLoginSchema = z.object({
  phone: z
    .string()
    .regex(
      /^\+?[1-9]\d{1,14}$/,
      'Phone number must be a valid international format'
    )
    .min(10, 'Phone number too short')
    .max(15, 'Phone number too long')
    .transform(val => val.replace(/\s+/g, '')),
  password: z
    .string()
    .min(1, 'Password is required')
    .max(128, 'Password too long')
    .transform(val => val.trim()),
});

// Enhanced route schemas
export const enhancedRouteSchema = z.object({
  routeId: z
    .string()
    .min(3, 'Route ID must be at least 3 characters')
    .max(20, 'Route ID must be less than 20 characters')
    .regex(
      /^[A-Z0-9\-_]+$/,
      'Route ID can only contain uppercase letters, numbers, hyphens, and underscores'
    )
    .transform(val => val.toUpperCase().trim()),
  name: z
    .string()
    .min(2, 'Route name must be at least 2 characters')
    .max(100, 'Route name must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-_()]+$/, 'Route name contains invalid characters')
    .transform(val => val.trim()),
  polyline: z
    .array(
      z
        .tuple([z.number(), z.number()])
        .refine(
          ([lng, lat]) => lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90,
          {
            message:
              'Invalid coordinates: longitude must be -180 to 180, latitude must be -90 to 90',
          }
        )
    )
    .min(2, 'Route must have at least 2 points'),
  stops: z
    .array(
      z.object({
        stopId: z
          .string()
          .min(3, 'Stop ID must be at least 3 characters')
          .max(20, 'Stop ID must be less than 20 characters')
          .regex(
            /^[A-Z0-9\-_]+$/,
            'Stop ID can only contain uppercase letters, numbers, hyphens, and underscores'
          ),
        name: z
          .string()
          .min(2, 'Stop name must be at least 2 characters')
          .max(100, 'Stop name must be less than 100 characters')
          .regex(
            /^[a-zA-Z0-9\s\-_()]+$/,
            'Stop name contains invalid characters'
          ),
        location: z.object({
          type: z.literal('Point'),
          coordinates: z
            .tuple([z.number(), z.number()])
            .refine(
              ([lng, lat]) =>
                lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90,
              {
                message: 'Invalid stop coordinates',
              }
            ),
        }),
      })
    )
    .min(2, 'Route must have at least 2 stops'),
});

// Enhanced vehicle schemas
export const enhancedVehicleSchema = z.object({
  busId: z
    .string()
    .min(6, 'Bus ID must be at least 6 characters')
    .max(10, 'Bus ID must be less than 10 characters')
    .regex(
      /^[A-Z0-9]+$/,
      'Bus ID can only contain uppercase letters and numbers'
    )
    .transform(val => val.toUpperCase().trim()),
  plate: z
    .string()
    .min(5, 'License plate must be at least 5 characters')
    .max(15, 'License plate must be less than 15 characters')
    .regex(/^[A-Z0-9\-\s]+$/, 'License plate contains invalid characters')
    .transform(val => val.toUpperCase().trim()),
  capacity: z
    .number()
    .int('Capacity must be a whole number')
    .min(1, 'Capacity must be at least 1')
    .max(200, 'Capacity cannot exceed 200'),
  type: z.enum(['bus', 'minibus', 'coach', 'shuttle']).default('bus'),
  manufacturer: z
    .string()
    .min(2, 'Manufacturer must be at least 2 characters')
    .max(50, 'Manufacturer must be less than 50 characters')
    .regex(/^[a-zA-Z\s\-]+$/, 'Manufacturer contains invalid characters')
    .transform(val => val.trim()),
  vehicleModel: z
    .string()
    .min(1, 'Model is required')
    .max(50, 'Model must be less than 50 characters')
    .regex(/^[a-zA-Z0-9\s\-]+$/, 'Model contains invalid characters')
    .transform(val => val.trim()),
  year: z
    .number()
    .int('Year must be a whole number')
    .min(1990, 'Year must be 1990 or later')
    .max(new Date().getFullYear() + 1, 'Year cannot be in the future'),
});

// Enhanced assignment schemas
export const enhancedAssignmentSchema = z
  .object({
    driverId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Driver ID must be a valid MongoDB ObjectId'),
    busId: z
      .string()
      .min(6, 'Bus ID must be at least 6 characters')
      .max(10, 'Bus ID must be less than 10 characters')
      .regex(
        /^[A-Z0-9]+$/,
        'Bus ID can only contain uppercase letters and numbers'
      ),
    routeId: z
      .string()
      .min(3, 'Route ID must be at least 3 characters')
      .max(20, 'Route ID must be less than 20 characters')
      .regex(
        /^[A-Z0-9\-_]+$/,
        'Route ID can only contain uppercase letters, numbers, hyphens, and underscores'
      ),
    shiftStart: z
      .string()
      .datetime('Shift start must be a valid ISO datetime')
      .refine(val => new Date(val) > new Date(), {
        message: 'Shift start must be in the future',
      }),
    shiftEnd: z.string().datetime('Shift end must be a valid ISO datetime'),
    active: z.boolean().default(true),
    status: z
      .enum(['scheduled', 'active', 'completed', 'cancelled'])
      .default('scheduled'),
  })
  .refine(
    data => {
      const start = new Date(data.shiftStart);
      const end = new Date(data.shiftEnd);
      return end > start;
    },
    {
      message: 'Shift end must be after shift start',
      path: ['shiftEnd'],
    }
  );

// Enhanced bus location schemas
export const enhancedBusLocationSchema = z.object({
  busId: z
    .string()
    .min(6, 'Bus ID must be at least 6 characters')
    .max(10, 'Bus ID must be less than 10 characters')
    .regex(
      /^[A-Z0-9]+$/,
      'Bus ID can only contain uppercase letters and numbers'
    ),
  lng: z
    .number()
    .min(-180, 'Longitude must be at least -180')
    .max(180, 'Longitude must be at most 180'),
  lat: z
    .number()
    .min(-90, 'Latitude must be at least -90')
    .max(90, 'Latitude must be at most 90'),
  speed: z
    .number()
    .min(0, 'Speed cannot be negative')
    .max(200, 'Speed cannot exceed 200 km/h'),
  heading: z
    .number()
    .min(0, 'Heading must be at least 0')
    .max(360, 'Heading must be at most 360'),
  ts: z
    .number()
    .int('Timestamp must be a whole number')
    .min(0, 'Timestamp cannot be negative')
    .refine(val => val <= Date.now() + 60000, {
      message: 'Timestamp cannot be more than 1 minute in the future',
    }),
});

// Enhanced geospatial query schemas
export const enhancedGeoQuerySchema = z.object({
  lng: z
    .string()
    .regex(/^-?\d+(\.\d+)?$/, 'Longitude must be a valid number')
    .transform(val => parseFloat(val))
    .refine(val => val >= -180 && val <= 180, {
      message: 'Longitude must be between -180 and 180',
    }),
  lat: z
    .string()
    .regex(/^-?\d+(\.\d+)?$/, 'Latitude must be a valid number')
    .transform(val => parseFloat(val))
    .refine(val => val >= -90 && val <= 90, {
      message: 'Latitude must be between -90 and 90',
    }),
  r: z
    .string()
    .regex(/^\d+(\.\d+)?$/, 'Radius must be a valid positive number')
    .transform(val => parseFloat(val))
    .refine(val => val > 0 && val <= 50000, {
      message: 'Radius must be between 0 and 50,000 meters',
    }),
});

// Enhanced pagination schemas
export const enhancedPaginationSchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/, 'Page must be a positive integer')
    .transform(val => parseInt(val))
    .refine(val => val > 0, {
      message: 'Page must be greater than 0',
    })
    .default(1),
  limit: z
    .string()
    .regex(/^\d+$/, 'Limit must be a positive integer')
    .transform(val => parseInt(val))
    .refine(val => val > 0 && val <= 200, {
      message: 'Limit must be between 1 and 200',
    })
    .default(50),
  sortBy: z
    .string()
    .regex(/^[a-zA-Z_]+$/, 'Sort field contains invalid characters')
    .optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// Enhanced filter schemas
export const enhancedFilterSchema = z.object({
  online: z
    .string()
    .regex(/^(true|false)$/, 'Online filter must be true or false')
    .transform(val => val === 'true')
    .optional(),
  routeId: z
    .string()
    .regex(/^[A-Z0-9\-_]+$/, 'Route ID contains invalid characters')
    .optional(),
  status: z.enum(['idle', 'moving', 'stopped', 'maintenance']).optional(),
  type: z.enum(['bus', 'minibus', 'coach', 'shuttle']).optional(),
});

// Socket event validation schemas
export const enhancedSocketEventSchema = z.object({
  busId: z
    .string()
    .min(6, 'Bus ID must be at least 6 characters')
    .max(10, 'Bus ID must be less than 10 characters')
    .regex(
      /^[A-Z0-9]+$/,
      'Bus ID can only contain uppercase letters and numbers'
    ),
  online: z.boolean(),
});

export const enhancedLocationEventSchema = z.object({
  busId: z
    .string()
    .min(6, 'Bus ID must be at least 6 characters')
    .max(10, 'Bus ID must be less than 10 characters')
    .regex(
      /^[A-Z0-9]+$/,
      'Bus ID can only contain uppercase letters and numbers'
    ),
  lng: z
    .number()
    .min(-180, 'Longitude must be at least -180')
    .max(180, 'Longitude must be at most 180'),
  lat: z
    .number()
    .min(-90, 'Latitude must be at least -90')
    .max(90, 'Latitude must be at most 90'),
  speed: z
    .number()
    .min(0, 'Speed cannot be negative')
    .max(200, 'Speed cannot exceed 200 km/h'),
  heading: z
    .number()
    .min(0, 'Heading must be at least 0')
    .max(360, 'Heading must be at most 360'),
  ts: z
    .number()
    .int('Timestamp must be a whole number')
    .min(0, 'Timestamp cannot be negative'),
});

// Generic ID validation
export const idParamSchema = z.object({
  id: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'ID must be a valid MongoDB ObjectId'),
});

export const busIdParamSchema = z.object({
  busId: z
    .string()
    .min(6, 'Bus ID must be at least 6 characters')
    .max(10, 'Bus ID must be less than 10 characters')
    .regex(
      /^[A-Z0-9]+$/,
      'Bus ID can only contain uppercase letters and numbers'
    ),
});

export const routeIdParamSchema = z.object({
  routeId: z
    .string()
    .min(3, 'Route ID must be at least 3 characters')
    .max(20, 'Route ID must be less than 20 characters')
    .regex(
      /^[A-Z0-9\-_]+$/,
      'Route ID can only contain uppercase letters, numbers, hyphens, and underscores'
    ),
});

// Export all schemas
export const enhancedValidationSchemas = {
  signup: enhancedSignupSchema,
  login: enhancedLoginSchema,
  route: enhancedRouteSchema,
  vehicle: enhancedVehicleSchema,
  assignment: enhancedAssignmentSchema,
  busLocation: enhancedBusLocationSchema,
  geoQuery: enhancedGeoQuerySchema,
  pagination: enhancedPaginationSchema,
  filter: enhancedFilterSchema,
  socketEvent: enhancedSocketEventSchema,
  locationEvent: enhancedLocationEventSchema,
  idParam: idParamSchema,
  busIdParam: busIdParamSchema,
  routeIdParam: routeIdParamSchema,
};
