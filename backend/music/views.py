from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from .models import Theme, Instrument, Version, SheetMusic
from .serializers import (
    ThemeSerializer, InstrumentSerializer,
    VersionSerializer, VersionDetailSerializer,
    SheetMusicSerializer, SheetMusicDetailSerializer
)
from .utils import calculate_relative_tonality, get_clef_for_instrument


class ThemeViewSet(viewsets.ModelViewSet):
    queryset = Theme.objects.all()
    serializer_class = ThemeSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'artist', 'description']
    filterset_fields = ['tonalidad', 'artist']
    ordering_fields = ['title', 'artist', 'created_at', 'tonalidad']
    ordering = ['title']

    @action(detail=True, methods=['get'])
    def versions(self, request, pk=None):
        theme = self.get_object()
        versions = theme.versions.all()
        serializer = VersionSerializer(versions, many=True)
        return Response(serializer.data)


class InstrumentViewSet(viewsets.ModelViewSet):
    queryset = Instrument.objects.all()
    serializer_class = InstrumentSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'family']
    filterset_fields = ['family', 'afinacion']
    ordering_fields = ['name', 'family', 'afinacion', 'created_at']
    ordering = ['name']

    @action(detail=True, methods=['get'])
    def sheet_music(self, request, pk=None):
        instrument = self.get_object()
        sheet_music = instrument.sheet_music.all()
        serializer = SheetMusicSerializer(sheet_music, many=True)
        return Response(serializer.data)


class VersionViewSet(viewsets.ModelViewSet):
    queryset = Version.objects.select_related('theme').prefetch_related('sheet_music__instrument').all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'theme__title', 'notes']
    filterset_fields = ['theme', 'type']
    ordering_fields = ['created_at', 'updated_at', 'theme__title', 'type']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return VersionDetailSerializer
        return VersionSerializer

    @action(detail=True, methods=['get'])
    def sheet_music(self, request, pk=None):
        version = self.get_object()
        sheet_music = version.sheet_music.all()
        serializer = SheetMusicSerializer(sheet_music, many=True)
        return Response(serializer.data)


class SheetMusicViewSet(viewsets.ModelViewSet):
    queryset = SheetMusic.objects.select_related('version', 'instrument', 'version__theme').all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['version__title', 'version__theme__title', 'instrument__name']
    filterset_fields = ['version', 'instrument', 'version__theme', 'type', 'clef', 'tonalidad_relativa']
    ordering_fields = ['created_at', 'updated_at', 'type', 'clef']
    ordering = ['-created_at']

    def perform_create(self, serializer):
        """
        Calculate relative tonality when creating a new sheet music
        """
        # Get the data before saving
        version = serializer.validated_data['version']
        instrument = serializer.validated_data['instrument']

        # Calculate relative tonality using utils function
        theme_tonality = version.theme.tonalidad
        instrument_tuning = instrument.afinacion
        relative_tonality = calculate_relative_tonality(theme_tonality, instrument_tuning)

        # Auto-suggest clef if not provided
        if 'clef' not in serializer.validated_data or not serializer.validated_data['clef']:
            suggested_clef = get_clef_for_instrument(instrument.name, instrument.family)
            serializer.validated_data['clef'] = suggested_clef

        # Save with calculated relative tonality
        serializer.save(tonalidad_relativa=relative_tonality)

    def perform_update(self, serializer):
        """
        Recalculate relative tonality when updating sheet music
        """
        # Get the data before saving
        version = serializer.validated_data.get('version', serializer.instance.version)
        instrument = serializer.validated_data.get('instrument', serializer.instance.instrument)

        # Calculate relative tonality using utils function
        theme_tonality = version.theme.tonalidad
        instrument_tuning = instrument.afinacion
        relative_tonality = calculate_relative_tonality(theme_tonality, instrument_tuning)

        # Save with calculated relative tonality
        serializer.save(tonalidad_relativa=relative_tonality)

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return SheetMusicDetailSerializer
        return SheetMusicSerializer
