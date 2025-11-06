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
    type_display = serializers.ReadOnlyField(source='get_type_display')

    class Meta:
        model = Version
        fields = [
            'id', 'theme', 'theme_title', 'title', 'type', 'type_display',
            'image', 'audio_file', 'mus_file', 'notes', 'sheet_music_count',
            'created_at', 'updated_at'
        ]


class VersionDetailSerializer(serializers.ModelSerializer):
    theme = ThemeSerializer(read_only=True)
    sheet_music = SheetMusicSerializer(many=True, read_only=True)
    version_files_count = serializers.SerializerMethodField()
    type_display = serializers.ReadOnlyField(source='get_type_display')

    class Meta:
        model = Version
        fields = [
            'id', 'theme', 'title', 'type', 'type_display', 'image', 'audio_file',
            'mus_file', 'notes', 'sheet_music', 'version_files_count',
            'created_at', 'updated_at'
        ]

    def get_version_files_count(self, obj):
        return obj.version_files.count()


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


class VersionFileSerializer(serializers.ModelSerializer):
    """Serializer for VersionFile model with display fields"""
    version_title = serializers.ReadOnlyField(source='version.title')
    theme_title = serializers.ReadOnlyField(source='version.theme.title')
    version_type = serializers.ReadOnlyField(source='version.type')
    file_type_display = serializers.ReadOnlyField(source='get_file_type_display')
    tuning_display = serializers.ReadOnlyField(source='get_tuning_display')
    instrument_name = serializers.CharField(source='instrument.name', read_only=True)
    has_audio = serializers.SerializerMethodField()

    class Meta:
        model = VersionFile
        fields = [
            'id', 'version', 'version_title', 'theme_title', 'version_type',
            'file_type', 'file_type_display', 'tuning', 'tuning_display',
            'instrument', 'instrument_name', 'file', 'audio', 'has_audio',
            'description', 'created_at', 'updated_at'
        ]

    def get_has_audio(self, obj):
        return bool(obj.audio)

    def validate(self, data):
        """Custom validation to ensure file_type matches requirements"""
        file_type = data.get('file_type')
        tuning = data.get('tuning')
        instrument = data.get('instrument')
        version = data.get('version')

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

        # Validate STANDARD type
        if file_type == 'STANDARD_SCORE':
            if version and version.type not in ['STANDARD', 'GRUPO_REDUCIDO']:
                raise serializers.ValidationError({'file_type': 'STANDARD_SCORE can only be used with STANDARD or GRUPO_REDUCIDO versions'})

        return data


class VersionFileDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer with nested data"""
    version = VersionSerializer(read_only=True)
    instrument = InstrumentSerializer(read_only=True)
    file_type_display = serializers.ReadOnlyField(source='get_file_type_display')
    tuning_display = serializers.ReadOnlyField(source='get_tuning_display')
    has_audio = serializers.SerializerMethodField()

    class Meta:
        model = VersionFile
        fields = [
            'id', 'version', 'file_type', 'file_type_display',
            'tuning', 'tuning_display', 'instrument', 'file', 'audio',
            'has_audio', 'description', 'created_at', 'updated_at'
        ]

    def get_has_audio(self, obj):
        return bool(obj.audio)