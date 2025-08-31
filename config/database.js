// Database configuration for REST API approach
// In a real app, you would use a backend API instead of direct MongoDB connection
export const API_CONFIG = {
  baseUrl: 'https://your-api-endpoint.com', // Replace with your actual API endpoint
  endpoints: {
    locations: '/api/locations',
  },
  headers: {
    'Content-Type': 'application/json',
  }
};

// Example function to save location data via REST API
export const saveLocationData = async (locationData) => {
  try {
    const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.locations}`, {
      method: 'POST',
      headers: API_CONFIG.headers,
      body: JSON.stringify(locationData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to save location data');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error saving location data:', error);
    throw error;
  }
};
