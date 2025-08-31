import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen 
          name="home" 
          options={{ 
            title: 'Route Master',
            headerShown: false 
          }} 
        />
        <Stack.Screen 
          name="index" 
          options={{ 
            title: 'Driver Login',
            headerShown: false 
          }} 
        />
        <Stack.Screen 
          name="signup" 
          options={{ 
            title: 'Create Account',
            headerShown: true 
          }} 
        />
        <Stack.Screen 
          name="user" 
          options={{ 
            title: 'User Home',
            headerShown: false 
          }} 
        />
        <Stack.Screen 
          name="tracking-bus" 
          options={{ 
            title: 'Track Bus',
            headerShown: false 
          }} 
        />

        <Stack.Screen 
          name="route-management" 
          options={{ 
            title: 'Route Management',
            headerShown: false 
          }} 
        />
        <Stack.Screen 
          name="location-sharing" 
          options={{ 
            title: 'Location Sharing',
            headerShown: false 
          }} 
        />
      </Stack>
    </>
  );
}
