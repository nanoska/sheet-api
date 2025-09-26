import django_filters
from django.db import models
from django.utils import timezone
from .models import Event, Repertoire

class EventFilter(django_filters.FilterSet):
    """
    Filtros personalizados para la vista de Eventos.
    """
    title = django_filters.CharFilter(lookup_expr='icontains')
    event_type = django_filters.ChoiceFilter(choices=Event.EVENT_TYPE_CHOICES)
    status = django_filters.ChoiceFilter(choices=Event.STATUS_CHOICES)
    start_date = django_filters.DateFilter(field_name='start_datetime', lookup_expr='date')
    end_date = django_filters.DateFilter(field_name='end_datetime', lookup_expr='date')
    upcoming = django_filters.BooleanFilter(method='filter_upcoming')
    ongoing = django_filters.BooleanFilter(method='filter_ongoing')
    is_public = django_filters.BooleanFilter()
    location = django_filters.NumberFilter(field_name='location__id')
    repertoire = django_filters.NumberFilter(field_name='repertoire__id')

    class Meta:
        model = Event
        fields = {
            'title': ['exact', 'icontains'],
            'event_type': ['exact'],
            'status': ['exact'],
            'start_datetime': ['lt', 'gt', 'lte', 'gte', 'date'],
            'end_datetime': ['lt', 'gt', 'lte', 'gte', 'date'],
            'is_public': ['exact'],
        }
        filter_overrides = {
            models.BooleanField: {
                'filter_class': django_filters.BooleanFilter,
                'extra': lambda f: {
                    'widget': 'django.forms.CheckboxInput',
                },
            },
        }

    def filter_upcoming(self, queryset, name, value):
        if value:
            return queryset.filter(start_datetime__gt=timezone.now())
        return queryset

    def filter_ongoing(self, queryset, name, value):
        if value:
            now = timezone.now()
            return queryset.filter(
                start_datetime__lte=now,
                end_datetime__gte=now
            )
        return queryset

class RepertoireFilter(django_filters.FilterSet):
    """
    Filtros personalizados para la vista de Repertorios.
    """
    name = django_filters.CharFilter(lookup_expr='icontains')
    is_active = django_filters.BooleanFilter()
    has_versions = django_filters.BooleanFilter(method='filter_has_versions')
    theme = django_filters.NumberFilter(field_name='repertoireversion__version__theme__id')
    version = django_filters.NumberFilter(field_name='repertoireversion__version__id')

    class Meta:
        model = Repertoire
        fields = ['name', 'is_active']

    def filter_has_versions(self, queryset, name, value):
        if value is not None:
            return queryset.filter(repertoireversion__isnull=not value).distinct()
        return queryset
