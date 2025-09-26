from rest_framework import serializers
from .models import Theme, Instrument, Version, SheetMusic


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
    type_display = serializers.ReadOnlyField(source='get_type_display')

    class Meta:
        model = Version
        fields = [
            'id', 'theme', 'title', 'type', 'type_display', 'image', 'audio_file',
            'mus_file', 'notes', 'sheet_music', 'created_at', 'updated_at'
        ]


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