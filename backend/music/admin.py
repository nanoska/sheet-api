from django.contrib import admin
from .models import Theme, Instrument, Version, SheetMusic, VersionFile


@admin.register(Theme)
class ThemeAdmin(admin.ModelAdmin):
    list_display = ['title', 'artist', 'tonalidad', 'created_at', 'versions_count']
    list_filter = ['tonalidad', 'artist', 'created_at']
    search_fields = ['title', 'artist', 'description']
    readonly_fields = ['created_at', 'updated_at']

    fieldsets = (
        ('Información Básica', {
            'fields': ('title', 'artist', 'tonalidad', 'description')
        }),
        ('Archivos', {
            'fields': ('image', 'audio')
        }),
        ('Metadatos', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def versions_count(self, obj):
        return obj.versions.count()
    versions_count.short_description = 'Versions'


@admin.register(Instrument)
class InstrumentAdmin(admin.ModelAdmin):
    list_display = ['name', 'family', 'afinacion', 'created_at', 'sheet_music_count']
    list_filter = ['family', 'afinacion']
    search_fields = ['name']
    readonly_fields = ['created_at']

    def sheet_music_count(self, obj):
        return obj.sheet_music.count()
    sheet_music_count.short_description = 'Sheet Music'


@admin.register(Version)
class VersionAdmin(admin.ModelAdmin):
    list_display = ['title', 'theme', 'type', 'created_at', 'sheet_music_count']
    list_filter = ['theme', 'type', 'created_at']
    search_fields = ['title', 'theme__title', 'notes']
    readonly_fields = ['created_at', 'updated_at']
    autocomplete_fields = ['theme']

    def sheet_music_count(self, obj):
        return obj.sheet_music.count()
    sheet_music_count.short_description = 'Sheet Music'

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('theme')


@admin.register(SheetMusic)
class SheetMusicAdmin(admin.ModelAdmin):
    list_display = ['version', 'instrument', 'type', 'clef', 'tonalidad_relativa', 'created_at']
    list_filter = ['instrument', 'version__theme', 'type', 'clef', 'created_at']
    search_fields = ['version__title', 'version__theme__title', 'instrument__name']
    readonly_fields = ['created_at', 'updated_at', 'tonalidad_relativa']
    autocomplete_fields = ['version', 'instrument']

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('version', 'instrument', 'version__theme')


@admin.register(VersionFile)
class VersionFileAdmin(admin.ModelAdmin):
    list_display = ['version', 'file_type', 'tuning', 'instrument', 'created_at', 'has_audio']
    list_filter = ['file_type', 'tuning', 'version__type', 'created_at']
    search_fields = ['version__title', 'version__theme__title', 'instrument__name', 'description']
    readonly_fields = ['created_at', 'updated_at']
    autocomplete_fields = ['version', 'instrument']

    fieldsets = (
        ('Version', {
            'fields': ('version', 'file_type')
        }),
        ('Dueto - Transposición', {
            'fields': ('tuning',),
            'description': 'Solo para tipo DUETO_TRANSPOSITION'
        }),
        ('Ensamble - Instrumento', {
            'fields': ('instrument',),
            'description': 'Solo para tipo ENSAMBLE_INSTRUMENT'
        }),
        ('Archivos', {
            'fields': ('file', 'audio')
        }),
        ('Información Adicional', {
            'fields': ('description',)
        }),
        ('Metadatos', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def has_audio(self, obj):
        return bool(obj.audio)
    has_audio.boolean = True
    has_audio.short_description = 'Audio'

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('version', 'instrument', 'version__theme')
