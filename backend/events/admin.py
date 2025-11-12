from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import Location, Repertoire, RepertoireVersion, Event


class RepertoireVersionInline(admin.TabularInline):
    model = RepertoireVersion
    extra = 1
    fields = ('version', 'order', 'notes')
    ordering = ('order', 'created_at')
    show_change_link = True

@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ('name', 'city', 'capacity', 'contact_phone', 'is_active')
    list_filter = ('city', 'country')
    search_fields = ('name', 'address', 'city', 'contact_email')
    list_editable = ('is_active',)
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('Información Básica', {
            'fields': ('name', 'description')
        }),
        ('Ubicación', {
            'fields': ('address', 'city', 'postal_code', 'country')
        }),
        ('Contacto', {
            'fields': ('contact_email', 'contact_phone', 'website')
        }),
        ('Configuración', {
            'fields': ('capacity', 'notes', 'is_active')
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def is_active(self, obj):
        return obj.events.filter(status__in=['DRAFT', 'CONFIRMED']).exists()
    is_active.boolean = True
    is_active.short_description = 'Activo'

@admin.register(Repertoire)
class RepertoireAdmin(admin.ModelAdmin):
    list_display = ('name', 'version_count', 'is_active', 'created_at')
    search_fields = ('name', 'description')
    list_filter = ('is_active', 'created_at')
    inlines = [RepertoireVersionInline]
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        (None, {
            'fields': ('name', 'description', 'is_active')
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def version_count(self, obj):
        return obj.versions.count()
    version_count.short_description = 'N° Versiones'

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('title', 'event_type', 'start_datetime', 'end_datetime', 'location_link', 'status', 'is_public')
    list_filter = ('event_type', 'status', 'is_public', 'start_datetime')
    search_fields = ('title', 'description', 'location__name')
    readonly_fields = ('created_at', 'updated_at')
    date_hierarchy = 'start_datetime'
    
    fieldsets = (
        ('Información del Evento', {
            'fields': ('title', 'description', 'event_type', 'status')
        }),
        ('Fecha y Hora', {
            'fields': ('start_datetime', 'end_datetime')
        }),
        ('Ubicación y Repertorio', {
            'fields': ('location', 'repertoire')
        }),
        ('Configuración', {
            'fields': ('is_public', 'max_attendees', 'price')
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def location_link(self, obj):
        if obj.location:
            url = reverse('admin:events_location_change', args=[obj.location.id])
            return mark_safe(f'<a href="{url}">{obj.location.name}</a>')
        return "-"
    location_link.short_description = 'Ubicación'
    location_link.allow_tags = True


    def save_model(self, request, obj, form, change):
        # Si no se especifica un máximo de asistentes, usar la capacidad del lugar
        if obj.location and not obj.max_attendees:
            obj.max_attendees = obj.location.capacity
        super().save_model(request, obj, form, change)

@admin.register(RepertoireVersion)
class RepertoireVersionAdmin(admin.ModelAdmin):
    list_display = ('__str__', 'repertoire', 'version', 'order')
    list_filter = ('repertoire',)
    search_fields = ('repertoire__name', 'version__title', 'notes')
    list_editable = ('order',)
    readonly_fields = ('created_at',)
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('repertoire', 'version', 'version__theme')
