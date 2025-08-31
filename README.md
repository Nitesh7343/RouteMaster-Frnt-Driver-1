# RouteMaster Backend

A Node.js backend API for the RouteMaster application built with TypeScript, Express, and MongoDB.

## Features

- TypeScript support
- Express.js REST API
- MongoDB with Mongoose ODM
- JWT authentication
- Socket.io for real-time communication
- Input validation with Zod
- Password hashing with bcrypt
- Scheduled tasks with node-cron
- CORS support

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your configuration

## Development

Start the development server:
```bash
npm run dev
```

## Build

Build the project for production:
```bash
npm run build
```

## Production

Start the production server:
```bash
npm start
```

## Project Structure

```
src/
├── controllers/     # Route controllers
├── db/             # Database connection
├── middleware/     # Custom middleware
├── models/         # Mongoose models
├── routes/         # API routes
├── sockets/        # Socket.io handlers
├── utils/          # Utility functions
├── workers/        # Background workers
└── index.ts        # Entry point
```

## API Endpoints

Coming soon...

## License

ISC


