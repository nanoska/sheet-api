from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone

from .models import Location, Repertoire, Event
from .serializers import (
    LocationSerializer, 
    RepertoireSerializer, 
    EventSerializer,
    EventCarouselSerializer,
    RepertoireCarouselSerializer,
    EventWithRepertoireSerializer,
    JamDeVientosEventSerializer
)
from .filters import EventFilter, RepertoireFilter

class LocationViewSet(viewsets.ModelViewSet):
    """
    API endpoint que permite ver y editar ubicaciones.
    """
    queryset = Location.objects.all()
    serializer_class = LocationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'city', 'address']
    ordering_fields = ['name', 'city', 'capacity']
    ordering = ['name']

    def get_permissions(self):
        """
        Los usuarios no administradores solo pueden ver las ubicaciones.
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            self.permission_classes = [IsAdminUser]
        return super().get_permissions()

class RepertoireViewSet(viewsets.ModelViewSet):
    """
    API endpoint que permite ver y editar repertorios.
    """
    queryset = Repertoire.objects.prefetch_related('repertoireversion_set__version').all()
    serializer_class = RepertoireSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = RepertoireFilter
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at', 'updated_at']
    ordering = ['-created_at']

    def get_queryset(self):
        """
        Filtra los repertorios activos por defecto.
        """
        queryset = super().get_queryset()
        if self.request.query_params.get('all', '').lower() != 'true':
            queryset = queryset.filter(is_active=True)
        return queryset

    def perform_destroy(self, instance):
        """
        En lugar de eliminar, desactiva el repertorio.
        """
        instance.is_active = False
        instance.save()

class EventViewSet(viewsets.ModelViewSet):
    """
    API endpoint que permite ver y editar eventos.
    """
    queryset = Event.objects.select_related('location', 'repertoire').all()
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = EventFilter
    search_fields = ['title', 'description', 'location__name']
    ordering_fields = ['start_datetime', 'end_datetime', 'created_at']
    ordering = ['start_datetime']

    def get_queryset(self):
        """
        Filtra los eventos según los parámetros de consulta.
        """
        queryset = super().get_queryset()
        
        # Filtro por fechas
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if start_date:
            queryset = queryset.filter(start_datetime__date__gte=start_date)
        if end_date:
            queryset = queryset.filter(end_datetime__date__lte=end_date)
            
        # Filtro por eventos próximos
        if self.request.query_params.get('upcoming', '').lower() == 'true':
            queryset = queryset.filter(start_datetime__gte=timezone.now())
            
        # Filtro por eventos en curso
        if self.request.query_params.get('ongoing', '').lower() == 'true':
            now = timezone.now()
            queryset = queryset.filter(
                start_datetime__lte=now,
                end_datetime__gte=now
            )
            
        return queryset

    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        """
        Duplica un evento existente.
        """
        event = self.get_object()
        event.pk = None
        event.title = f"{event.title} (copia)"
        event.status = 'DRAFT'
        event.save()
        
        serializer = self.get_serializer(event)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """
        Cancela un evento.
        """
        event = self.get_object()
        event.status = 'CANCELLED'
        event.save()
        
        serializer = self.get_serializer(event)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """
        Marca un evento como completado.
        """
        event = self.get_object()
        event.status = 'COMPLETED'
        event.save()
        
        serializer = self.get_serializer(event)
        return Response(serializer.data)


class JamDeVientosViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet específico para jamdevientos.com
    Proporciona endpoints optimizados para el carrousel y selección de eventos.
    """
    queryset = Event.objects.select_related('location', 'repertoire').prefetch_related(
        'repertoire__repertoireversion_set__version__theme'
    ).filter(is_public=True)
    permission_classes = []  # Sin autenticación requerida para jamdevientos.com

    @action(detail=False, methods=['get'])
    def carousel(self, request):
        """
        Endpoint para obtener eventos en formato carrousel para jamdevientos.com
        GET /api/v1/events/jamdevientos/carousel/
        """
        events = self.get_queryset().filter(
            start_datetime__gte=timezone.now()
        ).order_by('start_datetime')[:10]  # Próximos 10 eventos

        serializer = EventCarouselSerializer(events, many=True)
        return Response({
            'events': serializer.data,
            'total': len(serializer.data)
        })

    @action(detail=True, methods=['get'])
    def repertoire(self, request, pk=None):
        """
        Endpoint para obtener el repertorio completo de un evento específico
        GET /api/v1/events/jamdevientos/{event_id}/repertoire/
        """
        event = self.get_object()
        if not event.repertoire:
            return Response(
                {'error': 'Este evento no tiene un repertorio asociado'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = RepertoireCarouselSerializer(event.repertoire)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """
        Endpoint para obtener eventos próximos con sus repertorios completos
        GET /api/v1/events/jamdevientos/upcoming/
        """
        events = self.get_queryset().filter(
            start_datetime__gte=timezone.now()
        ).order_by('start_datetime')

        serializer = JamDeVientosEventSerializer(events, many=True)
        return Response({
            'events': serializer.data,
            'total': len(serializer.data)
        })

    def list(self, request):
        """
        Override del método list para usar el serializer específico de jamdevientos
        """
        queryset = self.filter_queryset(self.get_queryset())
        serializer = JamDeVientosEventSerializer(queryset, many=True)
        return Response({
            'events': serializer.data,
            'total': len(serializer.data)
        })

    def retrieve(self, request, pk=None):
        """
        Override del método retrieve para usar el serializer específico de jamdevientos
        """
        instance = self.get_object()
        serializer = JamDeVientosEventSerializer(instance)
        return Response(serializer.data)
