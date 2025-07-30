# Secure OTP Automation Platform

A full-stack OTP automation platform with React/TypeScript admin portal and supporting infrastructure for managing desktop client users who execute automated OTP workflows on Android devices.

## Prerequisites

Before running the project locally, make sure you have the following installed:

- **Node.js** (version 18 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)

## Local Setup Instructions

### 1. Download and Extract
- Download the project files to your local machine
- Extract to a folder of your choice

### 2. Install Dependencies
Open terminal/command prompt in the project folder and run:

```bash
npm install
```

This will install all required packages including:
- React, TypeScript, and Vite for the frontend
- Express.js for the backend API
- SQLite database with Drizzle ORM
- UI components (Radix UI, Tailwind CSS)
- Authentication libraries

### 3. Start the Development Server
Run the following command to start both frontend and backend:

```bash
npm run dev
```

This will:
- Start the Express.js backend server on port 5000
- Start the Vite development server for the React frontend
- Initialize the SQLite database automatically
- Create the default admin account

### 4. Access the Application

Once the server starts successfully, you can access:

- **Admin Portal**: http://localhost:5000
- **API Endpoints**: http://localhost:5000/api/*

### 5. Login Credentials

The system automatically creates a default admin account:

- **Email**: `admin@admin.com`
- **Password**: `admin`

## Project Structure

```
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Application pages (login, dashboard, etc.)
│   │   ├── lib/           # Utilities and API client
│   │   └── hooks/         # Custom React hooks
├── server/                # Express.js backend
│   ├── routes.ts          # API route definitions
│   ├── storage.ts         # Database operations
│   ├── auth.ts            # Authentication logic
│   ├── database.ts        # SQLite setup and initialization
│   └── middleware/        # Express middleware
├── shared/                # Shared TypeScript types and schemas
└── data/                  # SQLite database files (auto-created)
```

## Features

### Admin Portal
- **Dashboard**: System statistics and recent activity monitoring
- **User Management**: Create, activate/deactivate, and delete desktop app users
- **Script Management**: Upload Python automation scripts organized by app name
- **Country Management**: Configure countries with phone number validation rules
- **Task Monitoring**: Track execution status and filter by various criteria

### Authentication & Security
- Session-based authentication for admin portal
- MAC address binding for desktop users (prevents account sharing)
- Bcrypt password hashing for secure credential storage
- SQLite database for persistent data storage

### API Capabilities
- RESTful API endpoints for all operations
- Role-based access control (admin vs user permissions)
- File upload handling for Python scripts
- Real-time task status tracking

## Development Commands

- `npm run dev` - Start development server (frontend + backend)
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## Database

The application uses SQLite for data persistence with the following tables:
- **admins** - Web portal administrators
- **users** - Desktop application users
- **countries** - Country configurations with phone validation rules
- **scripts** - Python automation scripts
- **tasks** - Execution logs and status tracking

The database is automatically initialized on first run and located in the `data/` directory.

## Troubleshooting

### Common Issues

1. **Port already in use**: If port 5000 is busy, the app will show an error. Stop other applications using this port.

2. **Database errors**: Delete the `data/` folder and restart to recreate the database.

3. **Installation issues**: Clear npm cache and reinstall:
   ```bash
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **Permission errors**: Make sure you have write permissions in the project directory for database creation.

### Getting Help

If you encounter issues:
1. Check the console output for error messages
2. Ensure all prerequisites are installed correctly
3. Try deleting `node_modules` and running `npm install` again
4. Check that no other applications are using port 5000

## Production Deployment

For production deployment:
1. Run `npm run build` to create optimized build
2. Set `NODE_ENV=production` environment variable
3. The built application serves both frontend and API from port 5000
4. Ensure the `data/` directory is writable for database operations

The application is designed to run as a single server instance serving both the admin portal and API endpoints.