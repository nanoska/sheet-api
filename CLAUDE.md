# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack sheet music management system designed for wind orchestras and bands. The project consists of:
- **Backend**: Django REST API with Django REST Framework
- **Frontend**: React + TypeScript admin dashboard
- **Database**: PostgreSQL (production) / SQLite (development)
- **Deployment**: Docker Compose with nginx reverse proxy

The system manages musical themes, their arrangements (versions), instruments with different tunings, sheet music files with automatic transposition calculations, and event/repertoire management.

## Development Commands

### Docker Development (Recommended)
- **Start all services**: `docker-compose up -d`
- **View logs**: `docker-compose logs -f [service_name]`
- **Stop services**: `docker-compose down`
- **Rebuild**: `docker-compose up --build`

### Backend (Django) - Local Development
- **Setup virtual environment**: `cd backend && python -m venv env && source env/bin/activate` (Linux/Mac) or `env\Scripts\activate` (Windows)
- **Install dependencies**: `pip install -r requirements.txt`
- **Start development server**: `python manage.py runserver`
- **Run migrations**: `python manage.py migrate`
- **Create migrations**: `python manage.py makemigrations`
- **Create superuser**: `python manage.py createsuperuser`
- **Run tests**: `python manage.py test`
- **Run specific test**: `python manage.py test music.tests.TestThemeModel`
- **Django shell**: `python manage.py shell`
- **Collect static files**: `python manage.py collectstatic`
- **Check for issues**: `python manage.py check`

### Frontend (React) - Local Development
- **Navigate to frontend**: `cd frontend`
- **Install dependencies**: `npm install`
- **Start development server**: `npm start` (runs on http://localhost:3000)
- **Build for production**: `npm run build`
- **Run tests**: `npm test`
- **Run tests without watch**: `npm test -- --coverage --passWithNoTests`

## Architecture

### Full-Stack Structure

The application follows a decoupled architecture:
- **Backend**: Provides REST API at `/api/v1/`
- **Frontend**: Consumes API and provides admin interface
- **Communication**: HTTP requests with JWT authentication
- **File Storage**: Local filesystem with organized folder structure

### Backend (Django) Architecture

**Core Apps:**
- `music/` - Main app for themes, instruments, versions, and sheet music
- `events/` - Event management with locations and repertoires
- `sheetmusic_api/` - Django project settings and main URL configuration

**Data Model Hierarchy:**
1. **Theme** (Musical piece) → has many **Versions**
2. **Version** (Arrangement) → belongs to **Theme**, has many **SheetMusic**
3. **Instrument** (with tuning) → has many **SheetMusic**
4. **SheetMusic** → belongs to **Version** + **Instrument** (unique constraint)
5. **Event** → has **Location** and **Repertoire**
6. **Repertoire** → has many **Versions** through **RepertoireVersion**

**Key Features:**
- **Automatic Transposition**: Uses `music/utils.py:calculate_relative_tonality()` to handle transposing instruments (Bb, Eb, F, C)
- **Smart File Organization**: Theme-based naming via `music/utils.py` upload functions
- **RESTful API**: ViewSets with filtering, search, pagination (20 items per page)

### Frontend (React + TypeScript) Architecture

**Project Structure:**
- `src/components/` - Reusable React components (Login, ProtectedRoute)
- `src/components/managers/` - Entity manager components for CRUD operations
- `src/pages/Dashboard.tsx` - Main single-page dashboard with tabbed interface
- `src/context/` - React contexts (AuthContext)
- `src/services/api.ts` - Axios HTTP client with JWT handling
- `src/types/api.ts` - TypeScript interfaces matching Django models
- `src/theme/` - Material-UI dark theme configuration

**Key Features:**
- **Single Dashboard Interface** - Tabbed layout with all functionality in one page
- **Dark Theme Design** - Custom Material-UI theme with gradient accents (#00d4aa, #4fc3f7)
- **Compact Manager Components** - Card-based layouts with search and CRUD functionality
- **Material-UI (MUI)** - Component library with custom dark theming
- **JWT Authentication** - Token-based auth with automatic refresh
- **Protected Routes** - Route-level authentication guards
- **File Upload** - Drag-and-drop interface with React Dropzone
- **Responsive Design** - CSS Grid layout system, mobile and desktop optimized
- **Glassmorphism Effects** - Modern UI with backdrop blur and gradient overlays

### API Endpoints Structure

Base URL: `/api/v1/`

**Music App:**
- `themes/` - Theme CRUD with nested versions access
- `instruments/` - Instrument management
- `versions/` - Version CRUD with sheet music relationships
- `sheet-music/` - Sheet music with automatic transposition

**Events App:**
- `events/` - Event management with date/time validation
- `locations/` - Venue management
- `repertoires/` - Repertoire management with version ordering

**Authentication:**
- `auth/login/` - JWT token authentication
- `auth/refresh/` - Token refresh

### File Handling

**Media Storage:**
- Development: Local `media/` directory
- File uploads organized by type: themes, versions, sheet music
- Supported formats: Audio (MP3, WAV), Images (JPG, PNG), PDFs, MuseScore (.mscz, .mscx)

**Frontend Build:**
- Production files served by nginx
- Static assets cached and optimized
- Docker multi-stage build for optimized images

### Transposition System

Located in `music/utils.py`:
- Maps 24 tonalities (major/minor) to semitones
- Handles common band instruments (Bb clarinet, Eb alto sax, F horn, etc.)
- Auto-calculates written pitch from concert pitch
- Suggests appropriate clef based on instrument family

### Environment Configuration

**Development (.env):**
- Django settings with DEBUG=True
- Local database connections
- CORS enabled for localhost:3000
- Local static/media file serving

**Docker Compose Services:**
- `db`: PostgreSQL database (port 5432)
- `backend`: Django with gunicorn (port 8000)
- `frontend`: React app served by nginx (port 3000 in development, port 80 in production)

## Key Files Reference

**Backend Critical Files:**
- `music/models.py` - Core data models with relationships
- `music/views.py` - API ViewSets with custom filtering
- `music/serializers.py` - DRF serializers with nested data
- `music/utils.py` - Transposition logic and file upload paths
- `events/models.py` - Event management models with validation
- `sheetmusic_api/settings.py` - Django configuration with DRF setup

**Frontend Critical Files:**
- `src/App.tsx` - Main routing and authentication providers (simplified routing)
- `src/pages/Dashboard.tsx` - Single-page dashboard with tabbed interface
- `src/components/Login.tsx` - Updated login with dark theme styling
- `src/components/managers/` - Manager components for each entity type:
  - `ThemeManager.tsx` - Theme CRUD with image/audio uploads
  - `VersionManager.tsx` - Version management with file handling
  - `SheetMusicManager.tsx` - PDF sheet music upload and management
  - `EventManager.tsx` - Event scheduling and management
  - `LocationManager.tsx` - Venue management
  - `RepertoireManager.tsx` - Repertoire organization
- `src/theme/index.ts` - Complete dark theme configuration
- `src/services/api.ts` - HTTP client with interceptors
- `src/types/api.ts` - TypeScript interfaces for type safety
- `src/context/AuthContext.tsx` - Authentication state management

## Recent Frontend Redesign (2024)

The frontend has been completely redesigned with a focus on simplicity and modern UX:

### Design Changes
- **Unified Dashboard**: Single-page application with tabbed interface replacing multiple separate pages
- **Dark Mode Theme**: Complete dark theme with teal (#00d4aa) and blue (#4fc3f7) gradient accents
- **Modern UI Elements**: Glassmorphism effects, backdrop blur, and subtle animations
- **Compact Information Display**: Card-based layouts showing key information at a glance
- **Mobile-First Design**: Responsive CSS Grid layout system for all screen sizes

### Technical Improvements
- **Simplified Architecture**: Consolidated from 6+ page components to single dashboard with managers
- **Consistent API Handling**: Unified response handling for both array and paginated API responses
- **Type Safety**: Enhanced TypeScript integration with proper error handling
- **Performance**: Removed legacy Material-UI Grid in favor of CSS Grid for better performance
- **File Management**: Integrated drag-and-drop upload functionality across all managers

### User Experience Enhancements
- **Intuitive Navigation**: Tab-based navigation keeps all functionality accessible
- **Search & Filter**: Global search functionality in each manager component
- **Modal Forms**: Centralized create/edit forms with validation and error handling
- **Visual Feedback**: Loading states, success indicators, and clear error messages
- **Accessibility**: ARIA labels, keyboard navigation, and screen reader support

## Development Workflow

### Common Development Tasks
- **Reset database**: `python manage.py flush` (Django) or delete `db.sqlite3` file
- **View API documentation**: Start backend and visit `http://localhost:8000/swagger/` or `http://localhost:8000/redoc/`
- **Check API endpoints**: `python manage.py show_urls` (if django-extensions installed)
- **Create sample data**: `python backend/create_sample_data.py` (if exists)

### Testing Strategy
- **Backend tests**: Unit tests for models, views, and utilities in `music/tests.py` and `events/tests.py`
- **Frontend tests**: Component tests using React Testing Library
- **API testing**: Use tools like Postman or curl against the Django API endpoints

### File Structure Notes
- **Media files**: Stored in `backend/media/` with subdirectories for themes, versions, and sheet music
- **Static files**: Collected in `backend/staticfiles/` for production
- **Frontend build**: Generated in `frontend/build/` and served by nginx in production