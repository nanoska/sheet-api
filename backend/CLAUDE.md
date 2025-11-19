# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Django REST API for managing sheet music, designed specifically for wind orchestras and bands. The API handles musical themes, their various arrangements (versions), instruments with different tunings, and sheet music files with automatic transposition calculations.

## Development Commands

### Basic Django Operations
- **Start development server**: `python manage.py runserver`
- **Run migrations**: `python manage.py migrate`
- **Create migrations**: `python manage.py makemigrations`
- **Create superuser**: `python manage.py createsuperuser`
- **Django shell**: `python manage.py shell`

### Testing
- **Run tests**: `python manage.py test`
- **Run specific app tests**: `python manage.py test music`

### Database Management
- **Check for issues**: `python manage.py check`
- **Collect static files**: `python manage.py collectstatic`

## Architecture

### Core Models Hierarchy
The application follows a hierarchical structure with file inheritance:

1. **Theme** (Musical piece)
   - Contains: title, artist, tonality, description, audio, image
   - Has many **Versions**

2. **Version** (Arrangement of a theme)
   - Contains: title, type (Standard/Ensamble/Dueto/Grupo Reducido), audio_file, mus_file, notes
   - Belongs to one **Theme**
   - Has many **VersionFile** records
   - **File Inheritance**: If no image/audio, inherits from Theme (via @property)

3. **Instrument** (Musical instrument with tuning)
   - Contains: name, family (wind/brass/percussion), tuning (Bb, Eb, F, C, etc.)
   - Has many **VersionFile** records

4. **VersionFile** (Unified model for all sheet music files) 🆕
   - Replaces SheetMusic model with support for all version types
   - Contains: file_type, instrument, sheet_type, clef, tonalidad_relativa, file, audio
   - Belongs to one **Version** and optionally one **Instrument**
   - **File Types**:
     - `STANDARD_INSTRUMENT`: Individual parts for STANDARD versions (replaces SheetMusic)
     - `DUETO_TRANSPOSITION`: Transposed scores for DUETO versions
     - `ENSAMBLE_INSTRUMENT`: Individual parts for ENSAMBLE versions
     - `STANDARD_SCORE`: General scores for GRUPO_REDUCIDO versions
   - **File Inheritance**: Inherits image from Version→Theme, audio from self→Version→Theme
   - **Unique Constraints**: Varies by file_type (e.g., version+instrument+sheet_type for STANDARD_INSTRUMENT)

5. **SheetMusic** (DEPRECATED) ⚠️
   - Legacy model kept for backward compatibility
   - All new sheet music should use VersionFile with file_type='STANDARD_INSTRUMENT'
   - Migration: All SheetMusic records migrated to VersionFile in migration 0011

### Key Features

**File Inheritance System** 🆕: Three-level inheritance chain to avoid file duplication:
- Theme → Version → VersionFile
- Models provide `@property` methods:
  - `Version.get_image`: Returns self.image or self.theme.image
  - `Version.get_audio`: Returns self.audio_file or self.theme.audio
  - `VersionFile.get_image`: Returns self.version.get_image
  - `VersionFile.get_audio`: Returns self.audio or self.version.get_audio
- Serializers expose `image_url`, `audio_url`, `has_own_image`, `has_own_audio` fields
- Allows setting images/audio at Theme level and reusing across all Versions/VersionFiles

**Automatic Transposition**: The system automatically calculates relative tonalities for transposing instruments using `music/utils.py:calculate_relative_tonality()`. When creating/updating sheet music, the API determines the correct written pitch based on the theme's concert pitch and the instrument's transposition.

**Smart File Organization**: Files are organized using theme-based naming conventions via utility functions in `music/utils.py`. All uploads follow the pattern: `{theme}_{version_type}_{sheet_type}_{date}.{ext}`

**RESTful API Design**: Uses Django REST Framework ViewSets with:
- Filtering and search capabilities
- Pagination (20 items per page)
- CORS enabled for development
- File upload support for audio, images, and sheet music

### API Endpoints Structure
Base URL: `/api/v1/api/`

- `themes/` - Theme management with nested versions access
- `instruments/` - Instrument management with version files access
- `versions/` - Version management with nested version_files
  - Includes inheritance fields: `image_url`, `audio_url`, `has_own_image`, `has_own_audio`
  - Nested `version_files` serializer for all file types
- `version-files/` - VersionFile management (unified endpoint for all file types) 🆕
  - Supports filtering by version, file_type, instrument
  - Includes inheritance fields: `image_url`, `audio_url`, `has_own_audio`
  - Replaces separate endpoints for different version types
- `sheet-music/` - SheetMusic management (DEPRECATED, use version-files instead) ⚠️

### File Handling
- **Media files**: Stored in `media/` directory
- **Audio formats**: Supported for themes and versions
- **Sheet music**: PDF and other music notation files
- **MuseScore files**: `.mscz`, `.mscx` files supported for versions
- **Images**: Supported for themes and versions

### Transposition Logic
Located in `music/utils.py`, the transposition system:
- Maps 24 tonalities (major/minor keys) to semitones
- Handles common band instrument transpositions (Bb, Eb, F, C)
- Automatically suggests appropriate clef based on instrument type
- Calculates written pitch from concert pitch for transposing instruments

### Database
- **Development**: SQLite (`db.sqlite3`)
- **Models**: Located in `music/models.py`
- **Migrations**: Standard Django migrations in `music/migrations/`

### Key Files to Know
- `music/models.py` - Core data models with choices and relationships
- `music/views.py` - API viewsets with filtering and custom actions
- `music/serializers.py` - Data serialization with nested relationships
- `music/utils.py` - Transposition calculations and file handling utilities
- `sheetmusic_api/settings.py` - Django configuration with DRF settings