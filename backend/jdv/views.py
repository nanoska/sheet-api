"""
ViewSets for Jam de Vientos API.

Provides read-only endpoints optimized for the jam-de-vientos frontend,
including complete event data with repertoires and sheet music files.
"""
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.shortcuts import get_object_or_404

from events.models import Event
from .serializers import JDVEventSerializer, JDVEventListSerializer


class JDVViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Jam de Vientos events.

    Provides read-only access to public events with their complete repertoires,
    versions, and sheet music file URLs. Optimized for jam-de-vientos frontend.

    Endpoints:
        GET /api/v1/jdv/events/ - List public events
        GET /api/v1/jdv/events/{id}/ - Event detail with full repertoire
        GET /api/v1/jdv/events/upcoming/ - Next upcoming public events
        GET /api/v1/jdv/events/carousel/ - Events for carousel display
        GET /api/v1/jdv/events/by-slug/?slug={slug} - Event by slug (future)
    """
    queryset = Event.objects.select_related(
        'location', 'repertoire'
    ).prefetch_related(
        'repertoire__repertoireversion_set__version__theme',
        'repertoire__repertoireversion_set__version__sheet_music',
        'repertoire__repertoireversion_set__version__version_files',
    ).all()
    permission_classes = [AllowAny]  # Public access for jam-de-vientos
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'location__name', 'location__city']
    ordering_fields = ['start_datetime', 'end_datetime', 'created_at']
    ordering = ['start_datetime']

    def get_serializer_class(self):
        """Use detailed serializer for retrieve, list serializer for list."""
        if self.action == 'retrieve' or self.action in ['upcoming', 'carousel', 'by_slug']:
            return JDVEventSerializer
        return JDVEventListSerializer

    def get_queryset(self):
        """
        Filter to show only public confirmed/upcoming events by default.

        Can be overridden with query parameters:
        - ?all=true - Show all events (admin only)
        - ?status=DRAFT - Filter by status
        """
        queryset = super().get_queryset()

        # Default: only public events
        if not self.request.query_params.get('all', '').lower() == 'true':
            queryset = queryset.filter(is_public=True)

        # Default: only confirmed or upcoming events
        if not self.request.query_params.get('include_cancelled', '').lower() == 'true':
            queryset = queryset.exclude(status='CANCELLED')

        return queryset

    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """
        Get upcoming public events.

        Query parameters:
        - limit (int): Number of events to return (default: 10)

        Returns: List of upcoming events with full repertoire data
        """
        limit = int(request.query_params.get('limit', 10))

        upcoming_events = self.get_queryset().filter(
            start_datetime__gte=timezone.now(),
            is_public=True,
            status='CONFIRMED'
        ).order_by('start_datetime')[:limit]

        serializer = JDVEventSerializer(
            upcoming_events,
            many=True,
            context={'request': request}
        )

        return Response({
            'events': serializer.data,
            'total': upcoming_events.count()
        })

    @action(detail=False, methods=['get'])
    def carousel(self, request):
        """
        Get events optimized for carousel display.

        Returns the next 10 upcoming confirmed public events.

        Returns:
            {
                "events": [...],
                "total": 10
            }
        """
        carousel_events = self.get_queryset().filter(
            start_datetime__gte=timezone.now(),
            is_public=True,
            status='CONFIRMED'
        ).order_by('start_datetime')[:10]

        serializer = JDVEventSerializer(
            carousel_events,
            many=True,
            context={'request': request}
        )

        return Response({
            'events': serializer.data,
            'total': carousel_events.count()
        })

    @action(detail=False, methods=['get'])
    def by_slug(self, request):
        """
        Get event by slug (future feature).

        Query parameters:
        - slug (str): Event slug

        Returns: Event detail with full repertoire

        NOTE: Slug field doesn't exist yet in Event model.
        This is prepared for future implementation.
        """
        slug = request.query_params.get('slug')

        if not slug:
            return Response(
                {'error': 'slug parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # TODO: Add slug field to Event model
        # For now, try to match by title (temporary)
        event = get_object_or_404(
            self.get_queryset(),
            title__iexact=slug.replace('-', ' ')
        )

        serializer = JDVEventSerializer(event, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def repertoire(self, request, pk=None):
        """
        Get detailed repertoire for a specific event.

        Returns: Event with full repertoire, versions, and sheet music files
        """
        event = self.get_object()
        serializer = JDVEventSerializer(event, context={'request': request})
        return Response(serializer.data)
