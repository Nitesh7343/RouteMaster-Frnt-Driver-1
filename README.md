# Route Master

A React Native + Expo mobile app for sharing live location with others.

## Features

- **Login Screen**: User authentication with name and password
- **Signup Screen**: Create new account with full name, email, and password
- **Home Screen**: Placeholder screen for the main app functionality
- **Navigation**: Seamless navigation between screens using Expo Router

## Tech Stack

- **React Native**: Cross-platform mobile development
- **Expo**: Development platform and tools
- **Expo Router**: File-based navigation system
- **React Hooks**: useState, useRouter for state management and navigation

## Project Structure

```
RouteMaster/
├── app/
│   ├── _layout.js          # Root layout with navigation stack
│   ├── index.js            # Login screen (main entry point)
│   ├── signup.js           # Signup screen
│   └── home.js             # Home screen (placeholder)
├── assets/
│   └── logo.png            # App logo (60x60px recommended)
├── package.json            # Dependencies and scripts
├── app.json               # Expo configuration
├── babel.config.js        # Babel configuration
└── README.md              # This file
```

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development) or Android Studio (for Android development)

### Installation

1. **Clone or download the project**
   ```bash
   cd RouteMaster
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Add your logo**
   - Replace `assets/logo.png` with your actual logo image
   - Recommended size: 60x60 pixels
   - Format: PNG

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Run on device/simulator**
   - Press `i` for iOS Simulator
   - Press `a` for Android Emulator
   - Scan QR code with Expo Go app on your phone

## App Screens

### Login Screen (`app/index.js`)
- App name "Route Master" at the top
- Logo in the top-right corner
- Name input field
- Password input field (hidden)
- Login button
- "Create new account" link

### Signup Screen (`app/signup.js`)
- Full name input
- Email input
- Password input
- Confirm password input
- Create account button
- Back to login link

### Home Screen (`app/home.js`)
- Welcome message
- Feature preview
- Logout button

## Navigation Flow

1. **App starts** → Login Screen
2. **Login button** → Home Screen (if credentials are valid)
3. **Create new account** → Signup Screen
4. **Back to login** → Returns to Login Screen
5. **Logout** → Returns to Login Screen

## Customization

### Styling
- All styles are defined using `StyleSheet.create()`
- Colors, spacing, and typography can be easily modified
- Responsive design with proper keyboard handling

### Functionality
- Add real authentication logic in `handleLogin()` and `handleSignup()`
- Implement actual location sharing features in the Home Screen
- Add form validation and error handling

## Development Notes

- Uses Expo Router for file-based navigation
- Implements proper keyboard handling with `KeyboardAvoidingView`
- Safe area handling for different device sizes
- Clean, modern UI with consistent styling

## Next Steps

To complete the Route Master app, consider adding:

1. **Real Authentication**: Connect to a backend service
2. **Location Services**: Implement GPS tracking and sharing
3. **User Management**: User profiles and friend lists
4. **Real-time Updates**: WebSocket or Firebase integration
5. **Maps Integration**: Display locations on interactive maps
6. **Push Notifications**: Location sharing alerts
7. **Privacy Controls**: Granular sharing permissions

## Troubleshooting

- **Metro bundler issues**: Clear cache with `npx expo start --clear`
- **Navigation problems**: Ensure Expo Router is properly configured
- **Image loading**: Verify logo.png exists in assets folder
- **Platform-specific issues**: Check Expo documentation for platform requirements


