"""
Utilities for Jam de Vientos API endpoints.

Provides helpers to organize sheet music files for frontend consumption.
"""


def get_sheet_music_urls(version, request=None):
    """
    Get sheet music file URLs organized by tuning/transposition and part type.

    Returns a dictionary structure suitable for jam-de-vientos frontend:
    {
        "Bb": {
            "MELODIA_PRINCIPAL": "http://localhost:8000/media/...",
            "ARMONIA": "http://localhost:8000/media/...",
            "BAJO": None
        },
        "Eb": { ... },
        "C": { ... },
        "F": { ... },
        "C_BASS": { ... }
    }

    Args:
        version: Version instance
        request: Django request object (for building absolute URLs)

    Returns:
        dict: Nested dictionary of sheet music URLs
    """
    from music.models import SheetMusic, VersionFile

    # Initialize structure with all tunings and part types
    TUNINGS = ['Bb', 'Eb', 'C', 'F', 'C_BASS']
    PART_TYPES = ['MELODIA_PRINCIPAL', 'ARMONIA', 'BAJO']

    result = {
        tuning: {part_type: None for part_type in PART_TYPES}
        for tuning in TUNINGS
    }

    # Different logic based on version type
    if version.type == 'STANDARD':
        # For STANDARD: use SheetMusic model (individual instrument parts)
        sheet_music = SheetMusic.objects.filter(version=version).select_related('instrument')

        for sm in sheet_music:
            instrument_tuning = sm.instrument.afinacion

            # Map tuning to our keys
            tuning_map = {
                'Bb': 'Bb',
                'Eb': 'Eb',
                'C': 'C',
                'F': 'F',
            }

            # Map sheet music type to frontend part types
            type_map = {
                'MELODIA_PRINCIPAL': 'MELODIA_PRINCIPAL',
                'MELODIA_SECUNDARIA': 'ARMONIA',  # Map secondary melody to harmony
                'ARMONIA': 'ARMONIA',
                'BAJO': 'BAJO',
            }

            tuning_key = tuning_map.get(instrument_tuning)
            part_type_key = type_map.get(sm.type)

            if tuning_key and part_type_key:
                # Get absolute URL
                if sm.file and request:
                    result[tuning_key][part_type_key] = request.build_absolute_uri(sm.file.url)
                elif sm.file:
                    result[tuning_key][part_type_key] = sm.file.url

    elif version.type == 'DUETO':
        # For DUETO: use VersionFile model with tuning field
        version_files = VersionFile.objects.filter(
            version=version,
            file_type='DUETO_TRANSPOSITION'
        )

        for vf in version_files:
            tuning_key = vf.tuning  # Already in correct format (Bb, Eb, C, C_BASS)

            # For dueto, same file for all part types
            if tuning_key in result:
                file_url = None
                if vf.file and request:
                    file_url = request.build_absolute_uri(vf.file.url)
                elif vf.file:
                    file_url = vf.file.url

                # Set same URL for all part types in this tuning
                for part_type in PART_TYPES:
                    result[tuning_key][part_type] = file_url

    elif version.type in ['ENSAMBLE', 'GRUPO_REDUCIDO']:
        # For ENSAMBLE/GRUPO_REDUCIDO: use VersionFile model with instrument field
        file_type = 'ENSAMBLE_INSTRUMENT' if version.type == 'ENSAMBLE' else 'STANDARD_SCORE'

        version_files = VersionFile.objects.filter(
            version=version,
            file_type=file_type
        ).select_related('instrument')

        for vf in version_files:
            if vf.instrument:
                instrument_tuning = vf.instrument.afinacion

                # Map tuning
                tuning_map = {
                    'Bb': 'Bb',
                    'Eb': 'Eb',
                    'C': 'C',
                    'F': 'F',
                }

                tuning_key = tuning_map.get(instrument_tuning)

                if tuning_key and tuning_key in result:
                    file_url = None
                    if vf.file and request:
                        file_url = request.build_absolute_uri(vf.file.url)
                    elif vf.file:
                        file_url = vf.file.url

                    # Set same URL for all part types in this tuning
                    for part_type in PART_TYPES:
                        result[tuning_key][part_type] = file_url

    return result
