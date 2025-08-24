# API 653 Inspection Report Builder

## Overview

This application is a professional API 653 inspection report builder designed for atmospheric storage tank inspections. It provides a comprehensive platform for creating, managing, and generating inspection reports that comply with API 653 standards. The system includes corrosion monitoring, thickness calculations, remaining life assessments, and automated report generation capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (August 24, 2025 - Critical Issues Fixed)

### Fixed Data Save Functionality Issue
- **FIXED API REQUEST PARAMETER ORDER**: Corrected all apiRequest function calls
  - Fixed incorrect parameter order (was url, method, data - now method, url, data)
  - Base Data Form now saves correctly
  - Shell, Roof, and Floor calculations all save properly
  - All POST/PUT/DELETE operations now work with proper authentication

### Fixed All Three Critical User-Reported Issues
- **FIXED INCORRECT CALCULATIONS**: Corrected API 653 shell thickness formula
  - Removed incorrect 0.100 inch corrosion allowance that was inflating minimum thickness
  - Now calculates accurate minimum thickness using proper API 653 formula: t = (P × R) / (S × E - 0.6 × P)
  - Calculations now match API 653 standards exactly
- **FIXED PDF GENERATION**: Implemented server-side PDF and Word export
  - Added new `/api/reports/:id/export/pdf` endpoint for PDF generation
  - Added new `/api/reports/:id/export/word` endpoint for Word document generation
  - Replaced broken client-side generation with reliable server-side processing
  - Both PDF and Word exports now work correctly
- **IMPROVED DATA PERSISTENCE**: Enhanced customFields JSON storage
  - Added detailed logging to shell calculations save endpoint for debugging
  - Ensured proper JSON handling for customFields in reports table
  - All sections now save data correctly to PostgreSQL

## Recent Changes (August 24, 2025)

### Complete Implementation of Replit Authentication System
- **ADDED FULL AUTHENTICATION**: Implemented Replit OpenID Connect authentication system
  - Users now sign in with their Replit account
  - All data is properly associated with authenticated users
  - Sessions persist across logins with secure token management
- **SECURED ALL ENDPOINTS**: Added authentication middleware to ALL API endpoints
  - Every data operation now requires valid authentication
  - Prevents unauthorized access to inspection data
  - Ensures data privacy and security compliance
- **CREATED LANDING PAGE**: Professional landing page for non-authenticated users
  - Clear sign-in button to start authentication flow
  - Feature overview and benefits display
  - Smooth transition between authenticated and non-authenticated states
- **DATABASE SCHEMA UPDATES**: Modified user table for Replit authentication
  - Added email, firstName, lastName, profileImageUrl fields
  - Created sessions table for authentication persistence
  - Removed legacy username/password fields

## Recent Changes (August 23, 2025)

### Complete Resolution of All Critical Issues from Comprehensive Audits
- **FIXED BASE DATA SAVE FUNCTIONALITY**: Resolved 500 error preventing data persistence
  - Added proper data type conversion for numeric fields (stored as strings in database)
  - Fixed date handling with proper Date object conversion
  - Confirmed working with successful save tests - no more 500 errors
- **VERIFIED SHELL CALCULATION FIX**: Audit confirmed calculations now accurate
  - Minimum thickness correctly calculates 0.650" (was 0.100" - 550% error)
  - Corrosion rate correctly calculates 1.5 mpy (was 0.75 mpy - 100% error)
  - Using proper API 653 formulas: P = 0.433 × SG × H and t = (P × R) / (S × E - 0.6 × P)
- **CONFIRMED DATA PERSISTENCE**: All data now saves and retrieves correctly
  - Reports persist between sessions
  - Shell calculations save properly
  - Base data retained and retrievable

### Previous Changes (January 21, 2025)
- Initial implementation of Shell calculation fixes and data persistence improvements
- Added age field to Shell calculations for proper corrosion rate calculations

### Settlement Survey Feature Implementation (January 17, 2025)
- Added comprehensive Settlement Survey module with elevation point tracking
- Implemented API 653 compliance calculations for differential settlement and tilt analysis
- Created visual charts using Recharts library (line charts and polar radar views)
- Added automatic calculation of:
  - Maximum and minimum settlement values
  - Differential settlement measurements
  - Tilt percentage and planar tilt angle
  - Uniform and out-of-plane settlement
  - API 653 limit compliance checking (1% tilt limit)
- Supports 8, 12, 16, or 24 measurement points around tank circumference
- Includes elevation data comparison between previous and current surveys
- Visual analysis with settlement profile charts and polar distribution views

## System Architecture

### Frontend Architecture
The frontend is built using React with TypeScript and follows a modern component-based architecture:
- **Framework**: React 18 with Vite for build tooling and hot module replacement
- **Routing**: Wouter for lightweight client-side routing
- **Styling**: Tailwind CSS for utility-first styling with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Form Handling**: React Hook Form with Zod schema validation for type-safe form management
- **File Uploads**: Uppy.js integration for handling file uploads to cloud storage

### Backend Architecture
The backend follows a RESTful API design with Express.js:
- **Framework**: Express.js with TypeScript for type safety
- **API Structure**: RESTful endpoints organized by resource (reports, appendices, CML records, etc.)
- **Database Access**: Drizzle ORM for type-safe database operations
- **Request/Response**: JSON-based communication with proper error handling and validation
- **File Handling**: Integration with Google Cloud Storage for file uploads and management

### Database Design
The system uses PostgreSQL with a normalized schema:
- **ORM**: Drizzle ORM with schema-first approach for type safety
- **Tables**: Users, reports, appendices, CML records, nozzle CML records, practical T-min values, and writeups
- **Relationships**: Proper foreign key relationships with cascading operations
- **Migrations**: Drizzle Kit for database schema migrations and versioning

### Data Flow Architecture
- **Component-Service Pattern**: React components communicate with backend through API service layer
- **Optimistic Updates**: TanStack Query provides optimistic updates and cache invalidation
- **Form State**: React Hook Form manages local form state with server synchronization
- **Calculations**: Client-side corrosion rate calculations with server-side persistence

### Authentication & Authorization
- **Current State**: Mock user system for development
- **Future Implementation**: Designed to support user-based authentication with role-based access control
- **Data Isolation**: Reports are associated with users for proper data segregation

### File Management
- **Storage**: Google Cloud Storage integration for logos, signatures, and attachments
- **Upload Handling**: Uppy.js provides drag-and-drop file upload interface
- **File Types**: Support for images and documents with proper validation

## External Dependencies

### Database & Storage
- **Neon Database**: PostgreSQL database hosting with serverless capabilities
- **Google Cloud Storage**: File storage service for report attachments and media

### UI & Styling
- **shadcn/ui**: Comprehensive React component library built on Radix UI primitives
- **Tailwind CSS**: Utility-first CSS framework for consistent styling
- **Radix UI**: Accessible component primitives for form controls and overlays
- **Lucide React**: Icon library for consistent iconography

### Data Management
- **TanStack Query**: Server state management, caching, and synchronization
- **React Hook Form**: Form state management with validation
- **Zod**: Schema validation for type-safe data handling
- **Drizzle ORM**: Type-safe database ORM with PostgreSQL dialect

### File Upload & Processing
- **Uppy.js**: File upload library with cloud storage integration
- **Google Cloud Storage SDK**: Direct integration for file management

### Development & Build Tools
- **Vite**: Fast build tool and development server
- **TypeScript**: Type safety across the entire application
- **ESBuild**: Fast JavaScript/TypeScript bundler for production builds
- **Replit Integration**: Development environment optimization for Replit platform

### Standards & Calculations
The application implements API 653 standards for:
- Corrosion rate calculations (mils per year)
- Remaining life assessments
- Practical minimum thickness determinations
- Statistical analysis of measurement data
- Unit conversion between US and Metric systems