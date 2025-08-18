# API 653 Inspection Report Builder

## Overview

This application is a professional API 653 inspection report builder designed for atmospheric storage tank inspections. It provides a comprehensive platform for creating, managing, and generating inspection reports that comply with API 653 standards. The system includes corrosion monitoring, thickness calculations, remaining life assessments, and automated report generation capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (January 17, 2025)

### Settlement Survey Feature Implementation
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