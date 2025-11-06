"""
Music utilities for transposition calculations and file handling
"""
import os
import uuid
from datetime import datetime


def get_theme_based_filename(instance, filename, file_type):
    """
    Generate a filename based on theme, version type, and sheet music type.
    
    Format: {theme_title}_{version_type}_{sheet_type}_{date}.{ext}
    
    Args:
        instance: The model instance where the file is being attached
        filename: Original filename
        file_type: Type of the file (e.g., 'audio', 'image', 'sheet')
        
    Returns:
        str: Formatted filename with path
    """
    # Get file extension
    ext = filename.split('.')[-1].lower()
    
    # Get current date in YYYYMMDD format
    date_str = datetime.now().strftime('%Y%m%d')
    
    # Base parts of the filename
    parts = []
    
    # Add theme title (sanitized)
    theme_title = ''
    if hasattr(instance, 'theme'):
        theme_title = instance.theme.title.replace(' ', '_')
    elif hasattr(instance, 'version') and hasattr(instance.version, 'theme'):
        theme_title = instance.version.theme.title.replace(' ', '_')
    
    if theme_title:
        parts.append(theme_title)
    
    # Add version type if available
    if hasattr(instance, 'version') and hasattr(instance.version, 'get_type_display'):
        version_type = instance.version.get_type_display().replace(' ', '_')
        parts.append(version_type)
    
    # Add sheet music type if available
    if hasattr(instance, 'get_type_display'):
        sheet_type = instance.get_type_display().replace(' ', '_')
        parts.append(sheet_type)
    
    # Add file type if not a sheet music file
    if file_type != 'sheet':
        parts.append(file_type)
    
    # Add date
    parts.append(date_str)
    
    # Join all parts with underscores
    base_name = '_'.join(parts)
    
    # Sanitize the filename (remove any special characters)
    import re
    base_name = re.sub(r'[^\w\-_]', '', base_name)
    
    # Construct the final filename
    new_filename = f"{base_name}.{ext}"
    
    return os.path.join(os.path.dirname(filename), new_filename)


def theme_audio_upload_path(instance, filename):
    """Return the upload path for theme audio files"""
    return get_theme_based_filename(instance, filename, 'audio')


def theme_image_upload_path(instance, filename):
    """Return the upload path for theme image files"""
    return get_theme_based_filename(instance, filename, 'image')


def version_audio_upload_path(instance, filename):
    """Return the upload path for version audio files"""
    return get_theme_based_filename(instance, filename, 'audio')


def version_image_upload_path(instance, filename):
    """Return the upload path for version image files"""
    return get_theme_based_filename(instance, filename, 'image')


def version_mus_file_upload_path(instance, filename):
    """Return the upload path for MuseScore files"""
    return get_theme_based_filename(instance, filename, 'musescore')


def sheet_music_upload_path(instance, filename):
    """Return the upload path for sheet music files"""
    return get_theme_based_filename(instance, filename, 'sheet')


def version_file_upload_path(instance, filename):
    """Return the upload path for version file PDFs"""
    return get_theme_based_filename(instance, filename, 'version_file')


def version_file_audio_upload_path(instance, filename):
    """Return the upload path for version file audio"""
    return get_theme_based_filename(instance, filename, 'version_audio')




def calculate_relative_tonality(theme_tonality, instrument_tuning):
    """
    Calculate relative tonality based on theme's tonality and instrument's tuning.

    Args:
        theme_tonality (str): Original theme tonality (e.g., 'C', 'Bb', 'Am')
        instrument_tuning (str): Instrument tuning (e.g., 'Bb', 'Eb', 'F', 'C')

    Returns:
        str: Calculated relative tonality for the sheet music

    Examples:
        >>> calculate_relative_tonality('C', 'Bb')
        'D'
        >>> calculate_relative_tonality('C', 'Eb')
        'A'
        >>> calculate_relative_tonality('C', 'F')
        'G'
        >>> calculate_relative_tonality('Cm', 'Bb')
        'Dm'
    """
    if not theme_tonality or not instrument_tuning:
        return theme_tonality or ''

    # Mapping of keys to semitones from C
    key_to_semitones = {
        'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5,
        'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11,
        'Cm': 0, 'C#m': 1, 'Dm': 2, 'D#m': 3, 'Em': 4, 'Fm': 5,
        'F#m': 6, 'Gm': 7, 'G#m': 8, 'Am': 9, 'A#m': 10, 'Bm': 11
    }

    # Transposition intervals for each instrument (semitones to ADD to written pitch)
    # For transposing instruments, we need to write higher than concert pitch
    instrument_transposition = {
        'C': 0,   # Concert pitch (no transposition)
        'Bb': 2,  # Major 2nd up (C theme -> D written)
        'Eb': 9,  # Major 6th up (C theme -> A written)
        'F': 7,   # Perfect 5th up (C theme -> G written)
        'G': 5,   # Perfect 4th up (used for some horn parts)
        'D': 10,  # Major 7th up (rare)
        'A': 3,   # Minor 3rd up (rare)
        'E': 8,   # Minor 6th up (rare)
        'NONE': 0,  # No specific tuning
    }

    # Semitones to key mapping
    semitones_to_key = {
        0: ('C', 'Cm'), 1: ('C#', 'C#m'), 2: ('D', 'Dm'), 3: ('D#', 'D#m'),
        4: ('E', 'Em'), 5: ('F', 'Fm'), 6: ('F#', 'F#m'), 7: ('G', 'Gm'),
        8: ('G#', 'G#m'), 9: ('A', 'Am'), 10: ('A#', 'A#m'), 11: ('B', 'Bm')
    }

    if theme_tonality not in key_to_semitones or instrument_tuning not in instrument_transposition:
        return theme_tonality  # Return original if can't calculate

    # Calculate transposition
    theme_semitones = key_to_semitones[theme_tonality]
    transposition = instrument_transposition[instrument_tuning]
    relative_semitones = (theme_semitones + transposition) % 12

    # Determine if major or minor
    is_minor = theme_tonality.endswith('m')
    relative_key = semitones_to_key[relative_semitones][1 if is_minor else 0]

    return relative_key


def get_clef_for_instrument(instrument_name, instrument_family):
    """
    Suggest appropriate clef for an instrument based on its name and family.

    Args:
        instrument_name (str): Name of the instrument
        instrument_family (str): Family of the instrument

    Returns:
        str: Suggested clef ('SOL' or 'FA')
    """
    # Instruments that typically use bass clef
    bass_clef_instruments = [
        'tuba', 'fagot', 'trombón', 'bombardino', 'contrabajo',
        'trombone', 'bassoon', 'euphonium', 'bass'
    ]

    instrument_lower = instrument_name.lower()

    # Check if instrument typically uses bass clef
    for bass_instrument in bass_clef_instruments:
        if bass_instrument in instrument_lower:
            return 'FA'

    # Default to treble clef for most wind instruments
    return 'SOL'


def get_file_for_instrument(version, instrument):
    """
    Get the appropriate VersionFile for a given version and instrument.

    Args:
        version: Version instance
        instrument: Instrument instance

    Returns:
        VersionFile instance or None if not found

    Logic:
        - For DUETO versions: Match by tuning (Bb, Eb, F, C, C_BASS based on instrument)
        - For ENSAMBLE versions: Match by specific instrument
        - For STANDARD/GRUPO_REDUCIDO versions: Return any STANDARD_SCORE file
    """
    # Import here to avoid circular imports
    from .models import VersionFile

    if version.type == 'DUETO':
        # Map instrument tuning to VersionFile tuning choices
        tuning_map = {
            'Bb': 'Bb',
            'Eb': 'Eb',
            'F': 'F',
            'C': 'C',
            'G': 'C',
            'D': 'C',
            'A': 'C',
            'E': 'C',
            'NONE': 'C'
        }

        target_tuning = tuning_map.get(instrument.afinacion, 'C')

        # Check if instrument uses bass clef
        clef = get_clef_for_instrument(instrument.name, instrument.family)

        if clef == 'FA':
            target_tuning = 'C_BASS'

        return VersionFile.objects.filter(
            version=version,
            file_type='DUETO_TRANSPOSITION',
            tuning=target_tuning
        ).first()

    elif version.type == 'ENSAMBLE':
        # For ENSAMBLE, find file by specific instrument
        return VersionFile.objects.filter(
            version=version,
            file_type='ENSAMBLE_INSTRUMENT',
            instrument=instrument
        ).first()

    elif version.type in ['STANDARD', 'GRUPO_REDUCIDO']:
        # For STANDARD, return any STANDARD_SCORE file
        return VersionFile.objects.filter(
            version=version,
            file_type='STANDARD_SCORE'
        ).first()

    return None


if __name__ == "__main__":
    # Test the function
    test_cases = [
        ('C', 'Bb', 'D'),
        ('C', 'Eb', 'A'),
        ('C', 'F', 'G'),
        ('C', 'C', 'C'),
        ('F', 'Bb', 'G'),
        ('Cm', 'Bb', 'Dm'),
        ('Am', 'Eb', 'F#m'),
    ]

    print("Testing transposition function:")
    print("Theme -> Instrument -> Expected -> Calculated")
    print("-" * 45)

    for theme, instrument, expected in test_cases:
        result = calculate_relative_tonality(theme, instrument)
        status = "✓" if result == expected else "✗"
        print(f"{theme:2} -> {instrument:2} -> {expected:3} -> {result:3} {status}")