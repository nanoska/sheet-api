from rest_framework import serializers
from .models import Theme, Instrument, Version, SheetMusic, VersionFile


class ThemeSerializer(serializers.ModelSerializer):
    versions_count = serializers.ReadOnlyField(source='versions.count')
    tonalidad_display = serializers.ReadOnlyField(source='get_tonalidad_display')

    class Meta:
        model = Theme
        fields = [
            'id', 'title', 'artist', 'image', 'tonalidad', 'tonalidad_display',
            'description', 'audio', 'created_at', 'updated_at', 'versions_count'
        ]


class InstrumentSerializer(serializers.ModelSerializer):
    sheet_music_count = serializers.ReadOnlyField(source='sheet_music.count')
    afinacion_display = serializers.ReadOnlyField(source='get_afinacion_display')
    family_display = serializers.ReadOnlyField(source='get_family_display')

    class Meta:
        model = Instrument
        fields = ['id', 'name', 'family', 'family_display', 'afinacion', 'afinacion_display', 'created_at', 'sheet_music_count']


class SheetMusicSerializer(serializers.ModelSerializer):
    instrument_name = serializers.ReadOnlyField(source='instrument.name')
    instrument_afinacion = serializers.ReadOnlyField(source='instrument.afinacion')
    version_title = serializers.ReadOnlyField(source='version.title')
    theme_title = serializers.ReadOnlyField(source='version.theme.title')
    theme_tonalidad = serializers.ReadOnlyField(source='version.theme.tonalidad')
    type_display = serializers.ReadOnlyField(source='get_type_display')
    clef_display = serializers.ReadOnlyField(source='get_clef_display')

    class Meta:
        model = SheetMusic
        fields = [
            'id', 'version', 'version_title', 'instrument', 'instrument_name', 'instrument_afinacion',
            'theme_title', 'theme_tonalidad', 'type', 'type_display', 'clef', 'clef_display',
            'tonalidad_relativa', 'file', 'created_at', 'updated_at'
        ]


class VersionSerializer(serializers.ModelSerializer):
    theme_title = serializers.ReadOnlyField(source='theme.title')
    sheet_music_count = serializers.ReadOnlyField(source='sheet_music.count')
    version_files_count = serializers.ReadOnlyField(source='version_files.count')
    type_display = serializers.ReadOnlyField(source='get_type_display')
    image_url = serializers.SerializerMethodField()
    audio_url = serializers.SerializerMethodField()
    has_own_image = serializers.SerializerMethodField()
    has_own_audio = serializers.SerializerMethodField()

    class Meta:
        model = Version
        fields = [
            'id', 'theme', 'theme_title', 'title', 'type', 'type_display',
            'image', 'image_url', 'has_own_image',
            'audio_file', 'audio_url', 'has_own_audio',
            'mus_file', 'notes',
            'sheet_music_count', 'version_files_count',
            'created_at', 'updated_at'
        ]

    def get_image_url(self, obj):
        """Return image URL using inheritance chain (Version → Theme)"""
        image = obj.get_image
        return image.url if image and hasattr(image, 'url') else None

    def get_audio_url(self, obj):
        """Return audio URL using inheritance chain (Version → Theme)"""
        audio = obj.get_audio
        return audio.url if audio and hasattr(audio, 'url') else None

    def get_has_own_image(self, obj):
        """Return True if version has its own image"""
        return obj.has_own_image

    def get_has_own_audio(self, obj):
        """Return True if version has its own audio"""
        return obj.has_own_audio


class VersionFileSerializer(serializers.ModelSerializer):
    """Serializer for VersionFile model with display fields"""
    version_title = serializers.ReadOnlyField(source='version.title')
    theme_title = serializers.ReadOnlyField(source='version.theme.title')
    version_type = serializers.ReadOnlyField(source='version.type')
    file_type_display = serializers.ReadOnlyField(source='get_file_type_display')
    tuning_display = serializers.ReadOnlyField(source='get_tuning_display')
    instrument_name = serializers.CharField(source='instrument.name', read_only=True)

    # New fields for STANDARD_INSTRUMENT support
    sheet_type_display = serializers.ReadOnlyField(source='get_sheet_type_display')
    clef_display = serializers.ReadOnlyField(source='get_clef_display')

    # Inheritance fields
    image_url = serializers.SerializerMethodField()
    audio_url = serializers.SerializerMethodField()
    has_own_audio = serializers.SerializerMethodField()

    class Meta:
        model = VersionFile
        fields = [
            'id', 'version', 'version_title', 'theme_title', 'version_type',
            'file_type', 'file_type_display', 'tuning', 'tuning_display',
            'instrument', 'instrument_name',
            'sheet_type', 'sheet_type_display', 'clef', 'clef_display', 'tonalidad_relativa',
            'file', 'audio', 'audio_url', 'has_own_audio',
            'image_url', 'description', 'created_at', 'updated_at'
        ]

    def get_image_url(self, obj):
        """Return image URL using inheritance chain"""
        image = obj.get_image
        return image.url if image and hasattr(image, 'url') else None

    def get_audio_url(self, obj):
        """Return audio URL using inheritance chain"""
        audio = obj.get_audio
        return audio.url if audio and hasattr(audio, 'url') else None

    def get_has_own_audio(self, obj):
        """Return True if VersionFile has its own audio"""
        return obj.has_own_audio

    def validate(self, data):
        """Custom validation to ensure file_type matches requirements"""
        file_type = data.get('file_type')
        tuning = data.get('tuning')
        instrument = data.get('instrument')
        sheet_type = data.get('sheet_type')
        clef = data.get('clef')
        version = data.get('version')

        # Validate STANDARD_INSTRUMENT type
        if file_type == 'STANDARD_INSTRUMENT':
            if not instrument:
                raise serializers.ValidationError({'instrument': 'Instrument is required for STANDARD_INSTRUMENT type'})
            if not sheet_type:
                raise serializers.ValidationError({'sheet_type': 'Sheet type is required for STANDARD_INSTRUMENT type'})
            if not clef:
                raise serializers.ValidationError({'clef': 'Clef is required for STANDARD_INSTRUMENT type'})
            if version and version.type != 'STANDARD':
                raise serializers.ValidationError({'file_type': 'STANDARD_INSTRUMENT can only be used with STANDARD versions'})

        # Validate DUETO type
        if file_type == 'DUETO_TRANSPOSITION':
            if not tuning:
                raise serializers.ValidationError({'tuning': 'Tuning is required for DUETO_TRANSPOSITION type'})
            if version and version.type != 'DUETO':
                raise serializers.ValidationError({'file_type': 'DUETO_TRANSPOSITION can only be used with DUETO versions'})

        # Validate ENSAMBLE type
        if file_type == 'ENSAMBLE_INSTRUMENT':
            if not instrument:
                raise serializers.ValidationError({'instrument': 'Instrument is required for ENSAMBLE_INSTRUMENT type'})
            if version and version.type != 'ENSAMBLE':
                raise serializers.ValidationError({'file_type': 'ENSAMBLE_INSTRUMENT can only be used with ENSAMBLE versions'})

        # Validate GRUPO_REDUCIDO type
        if file_type == 'STANDARD_SCORE':
            if version and version.type != 'GRUPO_REDUCIDO':
                raise serializers.ValidationError({'file_type': 'STANDARD_SCORE can only be used with GRUPO_REDUCIDO versions'})

        return data


class VersionDetailSerializer(serializers.ModelSerializer):
    theme = ThemeSerializer(read_only=True)
    sheet_music = SheetMusicSerializer(many=True, read_only=True)
    version_files = VersionFileSerializer(many=True, read_only=True)
    version_files_count = serializers.SerializerMethodField()
    type_display = serializers.ReadOnlyField(source='get_type_display')
    image_url = serializers.SerializerMethodField()
    audio_url = serializers.SerializerMethodField()
    has_own_image = serializers.SerializerMethodField()
    has_own_audio = serializers.SerializerMethodField()

    class Meta:
        model = Version
        fields = [
            'id', 'theme', 'title', 'type', 'type_display',
            'image', 'image_url', 'has_own_image',
            'audio_file', 'audio_url', 'has_own_audio',
            'mus_file', 'notes',
            'sheet_music', 'version_files', 'version_files_count',
            'created_at', 'updated_at'
        ]

    def get_version_files_count(self, obj):
        return obj.version_files.count()

    def get_image_url(self, obj):
        """Return image URL using inheritance chain (Version → Theme)"""
        image = obj.get_image
        return image.url if image and hasattr(image, 'url') else None

    def get_audio_url(self, obj):
        """Return audio URL using inheritance chain (Version → Theme)"""
        audio = obj.get_audio
        return audio.url if audio and hasattr(audio, 'url') else None

    def get_has_own_image(self, obj):
        """Return True if version has its own image"""
        return obj.has_own_image

    def get_has_own_audio(self, obj):
        """Return True if version has its own audio"""
        return obj.has_own_audio


class SheetMusicDetailSerializer(serializers.ModelSerializer):
    instrument = InstrumentSerializer(read_only=True)
    version = VersionSerializer(read_only=True)
    type_display = serializers.ReadOnlyField(source='get_type_display')
    clef_display = serializers.ReadOnlyField(source='get_clef_display')

    class Meta:
        model = SheetMusic
        fields = [
            'id', 'version', 'instrument', 'type', 'type_display', 'clef', 'clef_display',
            'tonalidad_relativa', 'file', 'created_at', 'updated_at'
        ]


class VersionFileDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer with nested data"""
    version = VersionSerializer(read_only=True)
    instrument = InstrumentSerializer(read_only=True)
    file_type_display = serializers.ReadOnlyField(source='get_file_type_display')
    tuning_display = serializers.ReadOnlyField(source='get_tuning_display')
    sheet_type_display = serializers.ReadOnlyField(source='get_sheet_type_display')
    clef_display = serializers.ReadOnlyField(source='get_clef_display')
    image_url = serializers.SerializerMethodField()
    audio_url = serializers.SerializerMethodField()
    has_own_audio = serializers.SerializerMethodField()

    class Meta:
        model = VersionFile
        fields = [
            'id', 'version', 'file_type', 'file_type_display',
            'tuning', 'tuning_display', 'instrument',
            'sheet_type', 'sheet_type_display', 'clef', 'clef_display', 'tonalidad_relativa',
            'file', 'audio', 'audio_url', 'has_own_audio',
            'image_url', 'description', 'created_at', 'updated_at'
        ]

    def get_image_url(self, obj):
        """Return image URL using inheritance chain"""
        image = obj.get_image
        return image.url if image and hasattr(image, 'url') else None

    def get_audio_url(self, obj):
        """Return audio URL using inheritance chain"""
        audio = obj.get_audio
        return audio.url if audio and hasattr(audio, 'url') else None

    def get_has_own_audio(self, obj):
        """Return True if VersionFile has its own audio"""
        return obj.has_own_audio