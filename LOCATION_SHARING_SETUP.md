# Location Sharing Setup Guide

## Overview
The Route Master app now includes a location sharing feature that allows users to share their live location. This feature is accessible from the home screen and logs location data to the console. In a production app, you would connect this to a backend API.

## Features
- **ON/OFF Toggle Button**: Large circular button that changes color (green when ON, blue border when OFF)
- **Real-time Location Tracking**: Updates location every 10 seconds or when moving 10+ meters
- **Location Logging**: Currently logs location data to console (ready for API integration)
- **Location Display**: Shows current latitude, longitude, and accuracy
- **Status Indicator**: Displays current sharing status

## Setup Instructions

### 1. Current Implementation
The app currently logs location data to the console. You can view the location data in your development console when location sharing is active.

### 2. API Integration (Optional)
To integrate with a backend API:

1. Open `config/database.js`
2. Update the `baseUrl` in `API_CONFIG` to point to your backend API
3. Uncomment the `await saveLocationData(locationDocument);` line in `app/location-sharing.js`

### 3. Location Data Structure
The app generates location data in the following format:

```json
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "accuracy": 5.0,
  "speed": 10.5,
  "heading": 90.0,
  "altitude": 100.0,
  "deviceId": "route-master-device"
}
```

### 3. Permissions
The app has been configured with the necessary permissions:
- **Android**: ACCESS_FINE_LOCATION, ACCESS_COARSE_LOCATION
- **iOS**: NSLocationWhenInUseUsageDescription, NSLocationAlwaysAndWhenInUseUsageDescription

### 4. Usage Flow

#### Path 1: Valid Credentials
1. User enters valid phone number and password
2. App navigates to Route Management screen
3. User fills out route details and clicks "Done"
4. App navigates to Location Sharing screen
5. User can toggle location sharing ON/OFF
6. When ON, coordinates are shared to database
7. User can click "Done" to finish or "Back" to return

#### Path 2: Invalid Credentials
1. User enters invalid phone number or password
2. App navigates to Create Account screen
3. User creates new account and clicks "Create account"
4. App navigates to Location Sharing screen
5. User can toggle location sharing ON/OFF
6. When ON, coordinates are shared to database
7. User can click "Done" to finish or "Back" to return

## Security Notes
- **Important**: When integrating with a backend API, use proper authentication and HTTPS
- Consider using environment variables for production deployments
- The location data includes sensitive information, handle it securely

## Troubleshooting
- If location sharing fails, check your internet connection
- Ensure location permissions are granted on the device
- Check console logs for detailed error messages
- Verify API endpoint configuration if using backend integration

## Dependencies
- expo-location: For GPS location access
- react-native-dotenv: For environment variable management (optional)

## Testing

### Test Path 1: Valid Login
1. Run the app: `npm start`
2. Enter any phone number and password (both fields must be filled)
3. Click "Sign In"
4. App should navigate to Route Management
5. Fill out route details and click "Done"
6. App should navigate to Location Sharing
7. Test the ON/OFF toggle
8. Check console logs for location data

### Test Path 2: Invalid Login
1. Leave phone number or password empty
2. Click "Sign In"
3. App should navigate to Create Account
4. Fill out account details and click "Create account"
5. App should navigate to Location Sharing
6. Test the ON/OFF toggle
7. Check console logs for location data
