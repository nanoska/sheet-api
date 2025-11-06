from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404

from .models import Theme, Instrument, Version, SheetMusic, VersionFile
from .serializers import (
    ThemeSerializer, InstrumentSerializer,
    VersionSerializer, VersionDetailSerializer,
    SheetMusicSerializer, SheetMusicDetailSerializer,
    VersionFileSerializer, VersionFileDetailSerializer
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


class VersionFileViewSet(viewsets.ModelViewSet):
    """
    ViewSet for VersionFile model.

    Handles CRUD operations for version files with support for:
    - DUETO: files organized by transposition
    - ENSAMBLE: files organized by instrument
    - STANDARD: general version files
    """
    queryset = VersionFile.objects.select_related('version', 'instrument', 'version__theme').all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['version__title', 'version__theme__title', 'instrument__name', 'description']
    filterset_fields = ['version', 'file_type', 'tuning', 'instrument', 'version__type']
    ordering_fields = ['created_at', 'updated_at', 'file_type']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return VersionFileDetailSerializer
        return VersionFileSerializer

    @action(detail=False, methods=['get'])
    def download_for_instrument(self, request):
        """
        Get the appropriate file for a specific instrument.

        Query params:
        - version_id: ID of the Version
        - instrument_id: ID of the Instrument

        Returns the VersionFile that matches the instrument's tuning and clef.
        """
        version_id = request.query_params.get('version_id')
        instrument_id = request.query_params.get('instrument_id')

        if not version_id or not instrument_id:
            return Response(
                {'error': 'Both version_id and instrument_id are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        version = get_object_or_404(Version, id=version_id)
        instrument = get_object_or_404(Instrument, id=instrument_id)

        # Get the appropriate file based on version type
        version_file = None

        if version.type == 'DUETO':
            # For DUETO, find file by tuning mapping
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
            from .utils import get_clef_for_instrument
            clef = get_clef_for_instrument(instrument.name, instrument.family)

            if clef == 'FA':
                target_tuning = 'C_BASS'

            version_file = VersionFile.objects.filter(
                version=version,
                file_type='DUETO_TRANSPOSITION',
                tuning=target_tuning
            ).first()

        elif version.type == 'ENSAMBLE':
            # For ENSAMBLE, find file by specific instrument
            version_file = VersionFile.objects.filter(
                version=version,
                file_type='ENSAMBLE_INSTRUMENT',
                instrument=instrument
            ).first()

        elif version.type in ['STANDARD', 'GRUPO_REDUCIDO']:
            # For STANDARD, return any STANDARD_SCORE file
            version_file = VersionFile.objects.filter(
                version=version,
                file_type='STANDARD_SCORE'
            ).first()

        if not version_file:
            return Response(
                {'error': 'No file found for this instrument and version combination'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = self.get_serializer(version_file)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_version(self, request):
        """
        Get all files for a specific version.

        Query param:
        - version_id: ID of the Version
        """
        version_id = request.query_params.get('version_id')

        if not version_id:
            return Response(
                {'error': 'version_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        version_files = self.get_queryset().filter(version_id=version_id)
        serializer = self.get_serializer(version_files, many=True)
        return Response(serializer.data)
