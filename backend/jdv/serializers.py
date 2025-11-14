"""
Serializers for Jam de Vientos API.

Provides specialized serializers that include sheet music file URLs
organized for easy consumption by the jam-de-vientos frontend.
"""
from rest_framework import serializers
from events.models import Event, Repertoire, RepertoireVersion, Location
from music.models import Version, Theme
from .utils import get_sheet_music_urls


class JDVVersionSerializer(serializers.ModelSerializer):
    """
    Version serializer for Jam de Vientos with sheet music files.

    Includes all version data plus organized sheet music file URLs.
    """
    theme_title = serializers.CharField(source='theme.title', read_only=True)
    artist = serializers.CharField(source='theme.artist', read_only=True)
    tonalidad = serializers.CharField(source='theme.tonalidad', read_only=True)
    type_display = serializers.CharField(source='get_type_display', read_only=True)

    # Include both theme and version media files
    theme_image = serializers.SerializerMethodField()
    theme_audio = serializers.SerializerMethodField()

    # Sheet music files organized by tuning and part type
    sheet_music_files = serializers.SerializerMethodField()

    # Additional metadata
    sheet_music_count = serializers.IntegerField(source='sheet_music.count', read_only=True)

    class Meta:
        model = Version
        fields = [
            'id', 'title', 'theme_title', 'artist', 'tonalidad', 'type', 'type_display',
            'image', 'audio_file', 'mus_file', 'notes',
            'theme_image', 'theme_audio', 'sheet_music_files', 'sheet_music_count',
            'created_at', 'updated_at'
        ]

    def get_theme_image(self, obj):
        """Get absolute URL for theme image."""
        if obj.theme and obj.theme.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.theme.image.url)
            return obj.theme.image.url
        return None

    def get_theme_audio(self, obj):
        """Get absolute URL for theme audio."""
        if obj.theme and obj.theme.audio:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.theme.audio.url)
            return obj.theme.audio.url
        return None

    def get_sheet_music_files(self, obj):
        """
        Get sheet music files organized by tuning and part type.

        Returns:
            dict: Nested dictionary with structure:
                {
                    "Bb": {"MELODIA_PRINCIPAL": "url", "ARMONIA": "url", "BAJO": None},
                    "Eb": {...},
                    ...
                }
        """
        request = self.context.get('request')
        return get_sheet_music_urls(obj, request)

    def to_representation(self, instance):
        """Override to convert file fields to absolute URLs."""
        representation = super().to_representation(instance)
        request = self.context.get('request')

        if request:
            # Convert image URL to absolute
            if representation.get('image'):
                representation['image'] = request.build_absolute_uri(instance.image.url)

            # Convert audio_file URL to absolute
            if representation.get('audio_file'):
                representation['audio_file'] = request.build_absolute_uri(instance.audio_file.url)

            # Convert mus_file URL to absolute
            if representation.get('mus_file'):
                representation['mus_file'] = request.build_absolute_uri(instance.mus_file.url)

        return representation


class JDVRepertoireVersionSerializer(serializers.ModelSerializer):
    """RepertoireVersion serializer with full version data."""
    version = JDVVersionSerializer(read_only=True)

    class Meta:
        model = RepertoireVersion
        fields = ['id', 'version', 'order', 'notes', 'created_at']
        read_only_fields = ['created_at']


class JDVRepertoireSerializer(serializers.ModelSerializer):
    """Repertoire serializer for Jam de Vientos with ordered versions."""
    versions = serializers.SerializerMethodField()
    version_count = serializers.IntegerField(source='repertoireversion_set.count', read_only=True)

    class Meta:
        model = Repertoire
        fields = ['id', 'name', 'description', 'versions', 'version_count', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

    def get_versions(self, obj):
        """Get versions ordered by RepertoireVersion.order field."""
        repertoire_versions = obj.repertoireversion_set.select_related(
            'version__theme'
        ).prefetch_related('version__sheet_music').order_by('order')

        return JDVRepertoireVersionSerializer(
            repertoire_versions,
            many=True,
            context=self.context
        ).data


class JDVLocationSerializer(serializers.ModelSerializer):
    """Location serializer with Google Maps URL."""
    google_maps_url = serializers.SerializerMethodField()

    class Meta:
        model = Location
        fields = [
            'id', 'name', 'address', 'city', 'postal_code', 'country',
            'capacity', 'contact_email', 'contact_phone', 'website',
            'google_maps_url', 'notes', 'is_active'
        ]

    def get_google_maps_url(self, obj):
        """Generate Google Maps search URL for this location."""
        import urllib.parse
        query = f"{obj.name}, {obj.address}, {obj.city}, {obj.country}"
        encoded_query = urllib.parse.quote(query)
        return f"https://www.google.com/maps/search/?api=1&query={encoded_query}"


class JDVEventSerializer(serializers.ModelSerializer):
    """
    Event serializer for Jam de Vientos with full repertoire and location data.

    Includes all event information plus the complete repertoire with versions
    and their sheet music files.
    """
    repertoire = JDVRepertoireSerializer(read_only=True)
    location = JDVLocationSerializer(read_only=True)

    # Convenience fields for simple location display
    location_name = serializers.CharField(source='location.name', read_only=True)
    location_city = serializers.CharField(source='location.city', read_only=True)

    # Event status helpers
    event_type_display = serializers.CharField(source='get_event_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    is_upcoming = serializers.BooleanField(read_only=True)
    is_ongoing = serializers.BooleanField(read_only=True)

    class Meta:
        model = Event
        fields = [
            'id', 'title', 'event_type', 'event_type_display', 'status', 'status_display',
            'description', 'start_datetime', 'end_datetime',
            'location', 'location_name', 'location_city', 'repertoire',
            'is_public', 'max_attendees', 'price',
            'is_upcoming', 'is_ongoing', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class JDVEventListSerializer(serializers.ModelSerializer):
    """
    Simplified event serializer for list views.

    Includes basic event info without full repertoire data.
    """
    location_name = serializers.CharField(source='location.name', read_only=True)
    location_city = serializers.CharField(source='location.city', read_only=True)
    repertoire_name = serializers.CharField(source='repertoire.name', read_only=True)
    event_type_display = serializers.CharField(source='get_event_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Event
        fields = [
            'id', 'title', 'event_type', 'event_type_display', 'status', 'status_display',
            'description', 'start_datetime', 'end_datetime',
            'location_name', 'location_city', 'repertoire_name',
            'is_public', 'price'
        ]
