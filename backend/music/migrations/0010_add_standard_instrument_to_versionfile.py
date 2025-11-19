# Generated manually on 2025-11-19
# Adds STANDARD_INSTRUMENT support to VersionFile model

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('music', '0009_versionfile_versionfile_unique_version_dueto_tuning_and_more'),
    ]

    operations = [
        # Add new fields to VersionFile for STANDARD_INSTRUMENT support
        migrations.AddField(
            model_name='versionfile',
            name='sheet_type',
            field=models.CharField(
                blank=True,
                choices=[
                    ('MELODIA_PRINCIPAL', 'Melodía Principal'),
                    ('MELODIA_SECUNDARIA', 'Melodía Secundaria'),
                    ('ARMONIA', 'Armonía'),
                    ('BAJO', 'Bajo')
                ],
                help_text='Tipo de partitura (solo para STANDARD_INSTRUMENT)',
                max_length=20,
                null=True
            ),
        ),
        migrations.AddField(
            model_name='versionfile',
            name='clef',
            field=models.CharField(
                blank=True,
                choices=[
                    ('SOL', 'Clave de Sol'),
                    ('FA', 'Clave de Fa')
                ],
                help_text='Clave musical (solo para STANDARD_INSTRUMENT)',
                max_length=10,
                null=True
            ),
        ),
        migrations.AddField(
            model_name='versionfile',
            name='tonalidad_relativa',
            field=models.CharField(
                blank=True,
                help_text='Tonalidad calculada según la afinación del instrumento',
                max_length=10
            ),
        ),
        # Update file_type choices to include STANDARD_INSTRUMENT
        migrations.AlterField(
            model_name='versionfile',
            name='file_type',
            field=models.CharField(
                choices=[
                    ('STANDARD_INSTRUMENT', 'Standard - Instrumento Individual'),
                    ('DUETO_TRANSPOSITION', 'Dueto - Transposición'),
                    ('ENSAMBLE_INSTRUMENT', 'Ensamble - Instrumento'),
                    ('STANDARD_SCORE', 'Grupo Reducido - Partitura General')
                ],
                help_text='Tipo de archivo según el tipo de version',
                max_length=30
            ),
        ),
        # Update instrument help text to include STANDARD_INSTRUMENT
        migrations.AlterField(
            model_name='versionfile',
            name='instrument',
            field=models.ForeignKey(
                blank=True,
                help_text='Instrumento específico (para ENSAMBLE y STANDARD_INSTRUMENT)',
                null=True,
                on_delete=models.deletion.CASCADE,
                related_name='version_files',
                to='music.instrument'
            ),
        ),
        # Add unique constraint for STANDARD_INSTRUMENT
        migrations.AddConstraint(
            model_name='versionfile',
            constraint=models.UniqueConstraint(
                condition=models.Q(('file_type', 'STANDARD_INSTRUMENT')),
                fields=('version', 'instrument', 'sheet_type'),
                name='unique_version_standard_instrument_type'
            ),
        ),
    ]
