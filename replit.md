# Secure OTP Automation Platform

## Overview

This is a full-stack OTP automation platform consisting of a React/TypeScript admin web portal and supporting infrastructure for managing desktop client users who execute automated OTP workflows on Android devices. The system provides enterprise-grade security with MAC address binding, script management, user administration, and task tracking capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

**July 2025**
- Added SQLite database integration replacing in-memory storage
- Created comprehensive README.md with local setup instructions
- Fixed SelectItem UI components to prevent empty value prop errors
- Updated admin credentials to use admin@admin.com email format
- Database automatically initializes with default admin account (admin@admin.com/admin)

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state management
- **UI Components**: Radix UI primitives with shadcn/ui styling system
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite for development and bundling

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM (configured for Neon Database)
- **Authentication**: JWT tokens with bcrypt password hashing
- **File Handling**: Multer for script uploads with local file storage
- **API Design**: RESTful endpoints with role-based access control

### Database Schema
The system uses five main entities:
- **Admins**: Web portal administrators with email/password authentication
- **Users**: Desktop app users with MAC address binding
- **Countries**: Country configurations with phone number validation rules
- **Scripts**: Python automation scripts uploaded by admins
- **Tasks**: Execution logs and status tracking for user activities

## Key Components

### Authentication & Authorization
- **JWT-based authentication** with 24-hour token expiration
- **Role-based access control** separating admin and user permissions
- **MAC address binding** for desktop users to prevent account sharing
- **Bcrypt password hashing** for secure credential storage

### Script Management System
- **File upload handling** for Python automation scripts
- **Script-country association** for localized phone number processing
- **Temporary file generation** for secure script distribution
- **Phone number validation** based on country-specific rules

### Admin Web Portal Features
- **Dashboard** with system statistics and recent task monitoring
- **User Management** with creation, status tracking, and deletion
- **Script Management** with upload, organization by app name, and deletion
- **Country Management** with phone number length validation rules
- **Task Monitoring** with filtering and status tracking

### Security Model
- **MAC Address Binding**: Each user account tied to single device
- **Script Secrecy**: Scripts downloaded as temporary files and deleted after use
- **Token-based API Security**: All endpoints protected with JWT validation
- **No Persistent Phone Storage**: Phone numbers processed but not permanently stored

## Data Flow

### Admin Workflow
1. Admin logs into React web portal using email/password
2. Creates user accounts for desktop app users
3. Uploads Python automation scripts associated with app names
4. Configures countries with validation rules
5. Monitors task execution and system statistics

### User Workflow (Desktop App Integration)
1. User attempts login from desktop application
2. System validates credentials and binds MAC address on first login
3. User selects script, country, and uploads phone numbers
4. System validates phone numbers against country rules
5. Script is dynamically injected with phone numbers and provided as temporary file
6. User executes script locally, system tracks task status
7. Results reported back to admin portal for monitoring

### API Communication
- **Authentication endpoints** for admin and user login
- **CRUD operations** for users, scripts, countries, and tasks
- **File upload endpoints** for script management
- **Statistics endpoints** for dashboard data
- **Task reporting endpoints** for execution status updates

## External Dependencies

### Development & Build Tools
- **Vite**: Frontend development server and build tool
- **TypeScript**: Type safety across frontend and backend
- **ESBuild**: Backend bundling for production
- **PostCSS & Autoprefixer**: CSS processing

### UI & Styling
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first styling framework
- **Lucide React**: Icon library
- **Class Variance Authority**: Component variant management

### Backend Infrastructure
- **Express.js**: Web application framework
- **Drizzle ORM**: Type-safe database operations
- **Neon Database**: Serverless PostgreSQL hosting
- **Multer**: Multipart form data handling
- **JWT & Bcrypt**: Authentication and security

### Data Management
- **TanStack Query**: Server state management and caching
- **React Hook Form**: Form handling and validation
- **Zod**: Runtime type validation and schema definition

## Deployment Strategy

### Development Environment
- **Vite dev server** for frontend with HMR support
- **tsx** for backend TypeScript execution
- **Concurrent development** with frontend proxy to backend API

### Production Build
- **Frontend**: Vite builds optimized React bundle to `dist/public`
- **Backend**: ESBuild bundles Node.js server to `dist/index.js`
- **Database**: Drizzle migrations manage schema changes
- **Environment**: Production mode serves static files and API from single Express server

### Database Management
- **Schema Definition**: Centralized in `shared/schema.ts` using Drizzle
- **Migrations**: Generated and applied via `drizzle-kit`
- **Connection**: Configured for PostgreSQL with connection pooling
- **Environment**: Database URL provided via environment variables

The system is designed to be deployed as a single application serving both the admin web interface and API endpoints, with the desktop client applications connecting to the deployed API for authentication and script management.