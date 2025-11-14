from rest_framework import serializers
from .models import Location, Repertoire, RepertoireVersion, Event
from music.models import Version, Theme
from music.serializers import VersionSerializer, ThemeSerializer

class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')

class RepertoireVersionSerializer(serializers.ModelSerializer):
    version = VersionSerializer(read_only=True)
    version_id = serializers.PrimaryKeyRelatedField(
        queryset=Version.objects.all(),
        source='version',
        write_only=True
    )
    
    class Meta:
        model = RepertoireVersion
        fields = ['id', 'version', 'version_id', 'order', 'notes', 'created_at']
        read_only_fields = ('created_at',)

class RepertoireSerializer(serializers.ModelSerializer):
    versions = RepertoireVersionSerializer(
        source='repertoireversion_set', 
        many=True, 
        read_only=True
    )
    version_count = serializers.IntegerField(
        source='repertoireversion_set.count', 
        read_only=True
    )
    
    class Meta:
        model = Repertoire
        fields = [
            'id', 'name', 'description', 'is_active', 
            'versions', 'version_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ('created_at', 'updated_at')
    
    def create(self, validated_data):
        versions_data = self.context.get('request').data.get('versions', [])
        repertoire = Repertoire.objects.create(**validated_data)
        
        for version_data in versions_data:
            RepertoireVersion.objects.create(
                repertoire=repertoire,
                version_id=version_data.get('version_id'),
                order=version_data.get('order', 0),
                notes=version_data.get('notes', '')
            )
        
        return repertoire

class EventSerializer(serializers.ModelSerializer):
    location = LocationSerializer(read_only=True)
    location_id = serializers.PrimaryKeyRelatedField(
        queryset=Location.objects.all(),
        source='location',
        write_only=True,
        required=False,
        allow_null=True
    )
    
    repertoire = RepertoireSerializer(read_only=True)
    repertoire_id = serializers.PrimaryKeyRelatedField(
        queryset=Repertoire.objects.all(),
        source='repertoire',
        write_only=True,
        required=False,
        allow_null=True
    )
    
    is_upcoming = serializers.BooleanField(read_only=True)
    is_ongoing = serializers.BooleanField(read_only=True)

    class Meta:
        model = Event
        fields = [
            'id', 'title', 'event_type', 'status', 'description',
            'start_datetime', 'end_datetime',
            'location', 'location_id', 'repertoire', 'repertoire_id',
            'is_public', 'max_attendees', 'price', 'is_upcoming',
            'is_ongoing', 'created_at', 'updated_at'
        ]
        read_only_fields = ('created_at', 'updated_at')
    
    def validate(self, data):
        start_datetime = data.get('start_datetime')
        end_datetime = data.get('end_datetime')

        if start_datetime and end_datetime and start_datetime >= end_datetime:
            raise serializers.ValidationError({
                'end_datetime': 'La fecha de finalización debe ser posterior a la de inicio.'
            })

        return data
            
class EventCarouselSerializer(serializers.ModelSerializer):
    """
    Serializer optimizado para mostrar eventos en el carrousel de jamdevientos.com
    Incluye solo los datos necesarios para la selección de eventos.
    """
    repertoire_name = serializers.CharField(source='repertoire.name', read_only=True)
    location_name = serializers.CharField(source='location.name', read_only=True)
    location_city = serializers.CharField(source='location.city', read_only=True)

    class Meta:
        model = Event
        fields = [
            'id', 'title', 'event_type', 'description', 'start_datetime',
            'end_datetime', 'location_name', 'location_city', 'repertoire_name',
            'is_public', 'price'
        ]


class RepertoireCarouselSerializer(serializers.ModelSerializer):
    """
    Serializer para mostrar el repertorio completo con versiones ordenadas
    para el carrousel de jamdevientos.com
    """
    versions = serializers.SerializerMethodField()

    class Meta:
        model = Repertoire
        fields = ['id', 'name', 'description', 'versions']

    def get_versions(self, obj):
        # Obtener las versiones ordenadas por el campo 'order' en RepertoireVersion
        repertoire_versions = obj.repertoireversion_set.select_related(
            'version__theme'
        ).prefetch_related('version__sheet_music').order_by('order')

        versions_data = []
        for rv in repertoire_versions:
            version = rv.version
            theme = version.theme

            version_data = {
                'id': version.id,
                'title': version.title or theme.title,
                'theme_title': theme.title,
                'artist': theme.artist,
                'tonalidad': theme.tonalidad,
                'image': theme.image.url if theme.image else None,
                'audio': theme.audio.url if theme.audio else None,
                'version_audio': version.audio_file.url if version.audio_file else None,
                'version_image': version.image.url if version.image else None,
                'mus_file': version.mus_file.url if version.mus_file else None,
                'type': version.type,
                'order': rv.order,
                'notes': version.notes,
                'sheet_music_count': version.sheet_music.count(),
                'created_at': version.created_at.isoformat() if version.created_at else None,
            }
            versions_data.append(version_data)

        return versions_data


class EventWithRepertoireSerializer(serializers.ModelSerializer):
    """
    Serializer completo para eventos que incluye el repertorio con versiones
    """
    repertoire = RepertoireCarouselSerializer(read_only=True)
    location = LocationSerializer(read_only=True)

    class Meta:
        model = Event
        fields = [
            'id', 'title', 'event_type', 'status', 'description',
            'start_datetime', 'end_datetime', 'location', 'repertoire',
            'is_public', 'max_attendees', 'price', 'is_upcoming', 'is_ongoing'
        ]


class JamDeVientosEventSerializer(serializers.ModelSerializer):
    """
    Serializer específico para jamdevientos.com que incluye toda la información
    necesaria para mostrar eventos con sus repertorios y versiones.
    """
    repertoire = RepertoireCarouselSerializer(read_only=True)
    location_name = serializers.CharField(source='location.name', read_only=True)
    location_city = serializers.CharField(source='location.city', read_only=True)

    class Meta:
        model = Event
        fields = [
            'id', 'title', 'event_type', 'description', 'start_datetime',
            'end_datetime', 'location_name', 'location_city', 'repertoire',
            'is_public', 'price', 'is_upcoming', 'is_ongoing'
        ]
