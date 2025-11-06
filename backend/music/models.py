from django.db import models
from .utils import (
    theme_audio_upload_path, theme_image_upload_path,
    version_audio_upload_path, version_image_upload_path,
    version_mus_file_upload_path, sheet_music_upload_path,
    version_file_upload_path, version_file_audio_upload_path
)


class Theme(models.Model):
    TONALITY_CHOICES = [
        ('C', 'Do Mayor'),
        ('Cm', 'Do menor'),
        ('C#', 'Do# Mayor'),
        ('C#m', 'Do# menor'),
        ('D', 'Re Mayor'),
        ('Dm', 'Re menor'),
        ('D#', 'Re# Mayor'),
        ('D#m', 'Re# menor'),
        ('E', 'Mi Mayor'),
        ('Em', 'Mi menor'),
        ('F', 'Fa Mayor'),
        ('Fm', 'Fa menor'),
        ('F#', 'Fa# Mayor'),
        ('F#m', 'Fa# menor'),
        ('G', 'Sol Mayor'),
        ('Gm', 'Sol menor'),
        ('G#', 'Sol# Mayor'),
        ('G#m', 'Sol# menor'),
        ('A', 'La Mayor'),
        ('Am', 'La menor'),
        ('A#', 'La# Mayor'),
        ('A#m', 'La# menor'),
        ('B', 'Si Mayor'),
        ('Bm', 'Si menor'),
    ]

    title = models.CharField(max_length=200)
    artist = models.CharField(max_length=200, blank=True)
    image = models.ImageField(upload_to=theme_image_upload_path, blank=True, null=True)
    tonalidad = models.CharField(max_length=10, choices=TONALITY_CHOICES, blank=True)
    description = models.TextField(blank=True)
    audio = models.FileField(upload_to=theme_audio_upload_path, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        if self.artist:
            return f"{self.title} - {self.artist}"
        return self.title

    class Meta:
        ordering = ['title']


class Instrument(models.Model):
    TUNING_CHOICES = [
        ('Bb', 'Si bemol'),
        ('Eb', 'Mi bemol'),
        ('F', 'Fa'),
        ('C', 'Do'),
        ('G', 'Sol'),
        ('D', 'Re'),
        ('A', 'La'),
        ('E', 'Mi'),
        ('NONE', 'Sin afinación específica'),
    ]

    FAMILY_CHOICES = [
        ('VIENTO_MADERA', 'Vientos-Madera'),
        ('VIENTO_METAL', 'Vientos-Metales'),
        ('PERCUSION', 'Percusión'),
    ]

    name = models.CharField(max_length=100)
    family = models.CharField(max_length=20, choices=FAMILY_CHOICES, blank=True)
    afinacion = models.CharField(max_length=10, choices=TUNING_CHOICES, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']


class Version(models.Model):
    TYPE_CHOICES = [
        ('STANDARD', 'Standard'),
        ('ENSAMBLE', 'Ensamble'),
        ('DUETO', 'Dueto'),
        ('GRUPO_REDUCIDO', 'Grupo Reducido'),
    ]

    theme = models.ForeignKey(Theme, on_delete=models.CASCADE, related_name='versions')
    title = models.CharField(max_length=300, blank=True)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='STANDARD')
    image = models.ImageField(upload_to=version_image_upload_path, blank=True, null=True)
    audio_file = models.FileField(upload_to=version_audio_upload_path, blank=True, null=True)
    mus_file = models.FileField(upload_to=version_mus_file_upload_path, blank=True, null=True, help_text='Archivo de MuseScore (.mscz, .mscx)')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.theme.title} - Version {self.id}"

    class Meta:
        ordering = ['-created_at']


class SheetMusic(models.Model):
    TYPE_CHOICES = [
        ('MELODIA_PRINCIPAL', 'Melodía Principal'),
        ('MELODIA_SECUNDARIA', 'Melodía Secundaria'),
        ('ARMONIA', 'Armonía'),
        ('BAJO', 'Bajo'),
    ]

    CLEF_CHOICES = [
        ('SOL', 'Clave de Sol'),
        ('FA', 'Clave de Fa'),
    ]

    version = models.ForeignKey(Version, on_delete=models.CASCADE, related_name='sheet_music')
    instrument = models.ForeignKey(Instrument, on_delete=models.CASCADE, related_name='sheet_music')
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='MELODIA_PRINCIPAL')
    clef = models.CharField(max_length=10, choices=CLEF_CHOICES, default='SOL')
    tonalidad_relativa = models.CharField(max_length=10, blank=True, help_text='Tonalidad calculada según la afinación del instrumento')
    file = models.FileField(upload_to=sheet_music_upload_path)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


    def __str__(self):
        return f"{self.version.theme.title} - {self.instrument.name} ({self.get_type_display()})"

    class Meta:
        ordering = ['-created_at']
        unique_together = ['version', 'instrument', 'type']


class VersionFile(models.Model):
    """
    Model to handle file uploads at the Version level.

    For DUETO type: Upload 4 files per transposition (Bb, Eb, C, C_BASS)
    For ENSAMBLE type: Upload 1 file per instrument
    For STANDARD type: Upload general files for the version
    """

    FILE_TYPE_CHOICES = [
        ('DUETO_TRANSPOSITION', 'Dueto - Transposición'),
        ('ENSAMBLE_INSTRUMENT', 'Ensamble - Instrumento'),
        ('STANDARD_SCORE', 'Standard - Partitura General'),
    ]

    TUNING_CHOICES = [
        ('Bb', 'Si bemol - Clave de Sol'),
        ('Eb', 'Mi bemol - Clave de Sol'),
        ('F', 'Fa - Clave de Sol'),
        ('C', 'Do - Clave de Sol'),
        ('C_BASS', 'Do - Clave de Fa (Bass)'),
    ]

    version = models.ForeignKey(Version, on_delete=models.CASCADE, related_name='version_files')
    file_type = models.CharField(
        max_length=30,
        choices=FILE_TYPE_CHOICES,
        help_text='Tipo de archivo según el tipo de version'
    )

    # Para DUETO: se usa tuning para identificar la transposición
    tuning = models.CharField(
        max_length=10,
        choices=TUNING_CHOICES,
        blank=True,
        null=True,
        help_text='Afinación/transposición del archivo (solo para DUETO)'
    )

    # Para ENSAMBLE: se usa instrument para identificar el instrumento específico
    instrument = models.ForeignKey(
        Instrument,
        on_delete=models.CASCADE,
        related_name='version_files',
        blank=True,
        null=True,
        help_text='Instrumento específico (solo para ENSAMBLE)'
    )

    # Archivos
    file = models.FileField(
        upload_to=version_file_upload_path,
        help_text='Archivo PDF de la partitura'
    )
    audio = models.FileField(
        upload_to=version_file_audio_upload_path,
        blank=True,
        null=True,
        help_text='Archivo de audio opcional para esta versión'
    )

    # Metadata
    description = models.TextField(blank=True, help_text='Descripción o notas adicionales')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        if self.file_type == 'DUETO_TRANSPOSITION':
            return f"{self.version.theme.title} - Dueto {self.tuning}"
        elif self.file_type == 'ENSAMBLE_INSTRUMENT' and self.instrument:
            return f"{self.version.theme.title} - {self.instrument.name}"
        else:
            return f"{self.version.theme.title} - {self.get_file_type_display()}"

    class Meta:
        ordering = ['-created_at']
        # Unique constraints based on file_type
        constraints = [
            # For DUETO: version + tuning must be unique
            models.UniqueConstraint(
                fields=['version', 'tuning'],
                condition=models.Q(file_type='DUETO_TRANSPOSITION'),
                name='unique_version_dueto_tuning'
            ),
            # For ENSAMBLE: version + instrument must be unique
            models.UniqueConstraint(
                fields=['version', 'instrument'],
                condition=models.Q(file_type='ENSAMBLE_INSTRUMENT'),
                name='unique_version_ensamble_instrument'
            ),
        ]

    def clean(self):
        """Validate model constraints"""
        from django.core.exceptions import ValidationError

        # Validate DUETO type must have tuning
        if self.file_type == 'DUETO_TRANSPOSITION' and not self.tuning:
            raise ValidationError({'tuning': 'Tuning is required for DUETO_TRANSPOSITION type'})

        # Validate ENSAMBLE type must have instrument
        if self.file_type == 'ENSAMBLE_INSTRUMENT' and not self.instrument:
            raise ValidationError({'instrument': 'Instrument is required for ENSAMBLE_INSTRUMENT type'})

        # Validate that file_type matches version type
        if self.file_type == 'DUETO_TRANSPOSITION' and self.version.type != 'DUETO':
            raise ValidationError({'file_type': 'DUETO_TRANSPOSITION can only be used with DUETO versions'})

        if self.file_type == 'ENSAMBLE_INSTRUMENT' and self.version.type != 'ENSAMBLE':
            raise ValidationError({'file_type': 'ENSAMBLE_INSTRUMENT can only be used with ENSAMBLE versions'})

        if self.file_type == 'STANDARD_SCORE' and self.version.type not in ['STANDARD', 'GRUPO_REDUCIDO']:
            raise ValidationError({'file_type': 'STANDARD_SCORE can only be used with STANDARD or GRUPO_REDUCIDO versions'})
