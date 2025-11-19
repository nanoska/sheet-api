# Generated manually on 2025-11-19
# Data migration: Migrate all SheetMusic records to VersionFile

from django.db import migrations


def migrate_sheetmusic_to_versionfile(apps, schema_editor):
    """
    Migrate all SheetMusic records to VersionFile with file_type='STANDARD_INSTRUMENT'
    """
    SheetMusic = apps.get_model('music', 'SheetMusic')
    VersionFile = apps.get_model('music', 'VersionFile')

    migrated_count = 0
    errors = []

    for sheet_music in SheetMusic.objects.all():
        try:
            # Create corresponding VersionFile
            VersionFile.objects.create(
                version=sheet_music.version,
                file_type='STANDARD_INSTRUMENT',
                instrument=sheet_music.instrument,
                sheet_type=sheet_music.type,  # Maps TYPE_CHOICES to sheet_type
                clef=sheet_music.clef,
                tonalidad_relativa=sheet_music.tonalidad_relativa,
                file=sheet_music.file,
                audio=None,  # SheetMusic doesn't have audio field
                description=f'Migrated from SheetMusic #{sheet_music.id}',
                created_at=sheet_music.created_at,
                updated_at=sheet_music.updated_at,
            )
            migrated_count += 1
        except Exception as e:
            errors.append(f'Error migrating SheetMusic #{sheet_music.id}: {str(e)}')

    # Print summary
    print(f'\n=== SheetMusic → VersionFile Migration Summary ===')
    print(f'Total SheetMusic records: {SheetMusic.objects.count()}')
    print(f'Successfully migrated: {migrated_count}')
    print(f'Errors: {len(errors)}')

    if errors:
        print('\nErrors:')
        for error in errors:
            print(f'  - {error}')

    print('=== Migration Complete ===\n')


def reverse_migration(apps, schema_editor):
    """
    Reverse migration: Delete all VersionFile records with file_type='STANDARD_INSTRUMENT'
    that were created from SheetMusic migration
    """
    VersionFile = apps.get_model('music', 'VersionFile')

    deleted_count, _ = VersionFile.objects.filter(
        file_type='STANDARD_INSTRUMENT',
        description__startswith='Migrated from SheetMusic #'
    ).delete()

    print(f'\n=== Reverse Migration ===')
    print(f'Deleted {deleted_count} VersionFile records')
    print('=== Reverse Complete ===\n')


class Migration(migrations.Migration):

    dependencies = [
        ('music', '0010_add_standard_instrument_to_versionfile'),
    ]

    operations = [
        migrations.RunPython(
            migrate_sheetmusic_to_versionfile,
            reverse_code=reverse_migration
        ),
    ]
