from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from django.utils import timezone
from music.models import Version

class Location(models.Model):
    """
    Modelo para almacenar información de ubicaciones donde se realizan los eventos.
    """
    name = models.CharField(max_length=200, verbose_name='Nombre del lugar')
    address = models.TextField(verbose_name='Dirección')
    city = models.CharField(max_length=100, verbose_name='Ciudad')
    postal_code = models.CharField(max_length=10, verbose_name='Código Postal')
    country = models.CharField(max_length=100, verbose_name='País', default='Argentina')
    capacity = models.PositiveIntegerField(
        verbose_name='Capacidad',
        help_text='Capacidad máxima de personas',
        validators=[MinValueValidator(1)]
    )
    contact_email = models.EmailField(verbose_name='Email de contacto', blank=True, null=True)
    contact_phone = models.CharField(max_length=20, verbose_name='Teléfono de contacto', blank=True, null=True)
    website = models.URLField(verbose_name='Sitio web', blank=True, null=True)
    notes = models.TextField(verbose_name='Notas adicionales', blank=True)
    is_active = models.BooleanField(default=True, verbose_name='Activo')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Ubicación'
        verbose_name_plural = 'Ubicaciones'
        ordering = ['name']

    def __str__(self):
        return f"{self.name}, {self.city}"

class Repertoire(models.Model):
    """
    Modelo para agrupar versiones de temas que se tocarán en un evento.
    """
    name = models.CharField(max_length=200, verbose_name='Nombre del repertorio')
    description = models.TextField(verbose_name='Descripción', blank=True)
    versions = models.ManyToManyField(
        Version,
        through='RepertoireVersion',
        related_name='repertoires',
        verbose_name='Versiones de temas',
        blank=True
    )
    is_active = models.BooleanField(default=True, verbose_name='Activo')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Repertorio'
        verbose_name_plural = 'Repertorios'
        ordering = ['-created_at']

    def __str__(self):
        return self.name

class RepertoireVersion(models.Model):
    """
    Modelo intermedio para la relación muchos a muchos entre Repertoire y Version
    con campos adicionales como el orden de las versiones en el repertorio.
    """
    repertoire = models.ForeignKey(Repertoire, on_delete=models.CASCADE)
    version = models.ForeignKey(Version, on_delete=models.CASCADE)
    order = models.PositiveIntegerField(
        default=0,
        help_text='Orden de la versión en el repertorio'
    )
    notes = models.TextField(blank=True, verbose_name='Notas adicionales')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'created_at']
        unique_together = ('repertoire', 'version')
        verbose_name = 'Versión en repertorio'
        verbose_name_plural = 'Versiones en repertorios'

    def __str__(self):
        return f"{self.repertoire.name} - {self.version.theme.title} (Orden: {self.order})"

class Event(models.Model):
    """
    Modelo para representar un evento donde se tocará un repertorio.
    """
    EVENT_TYPE_CHOICES = [
        ('CONCERT', 'Concierto'),
        ('REHEARSAL', 'Ensayo'),
        ('RECORDING', 'Grabación'),
        ('WORKSHOP', 'Taller'),
        ('OTHER', 'Otro'),
    ]

    STATUS_CHOICES = [
        ('DRAFT', 'Borrador'),
        ('CONFIRMED', 'Confirmado'),
        ('CANCELLED', 'Cancelado'),
        ('COMPLETED', 'Completado'),
    ]

    title = models.CharField(max_length=200, verbose_name='Título del evento')
    event_type = models.CharField(
        max_length=20,
        choices=EVENT_TYPE_CHOICES,
        default='CONCERT',
        verbose_name='Tipo de evento'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='DRAFT',
        verbose_name='Estado'
    )
    description = models.TextField(verbose_name='Descripción', blank=True)
    start_datetime = models.DateTimeField(verbose_name='Fecha y hora de inicio')
    end_datetime = models.DateTimeField(verbose_name='Fecha y hora de finalización')
    location = models.ForeignKey(
        Location,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='events',
        verbose_name='Ubicación'
    )
    repertoire = models.ForeignKey(
        Repertoire,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='events',
        verbose_name='Repertorio'
    )
    is_public = models.BooleanField(default=False, verbose_name='Evento público')
    max_attendees = models.PositiveIntegerField(
        verbose_name='Máximo de asistentes',
        null=True,
        blank=True,
        help_text='Dejar en blanco para usar la capacidad del lugar'
    )
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        verbose_name='Precio de entrada',
        help_text='0 para entrada gratuita'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Evento'
        verbose_name_plural = 'Eventos'
        ordering = ['start_datetime']

    def __str__(self):
        return f"{self.title} - {self.get_event_type_display()} - {self.start_datetime.strftime('%d/%m/%Y %H:%M')}"

    def clean(self):
        # Validar que la fecha de inicio sea anterior a la de finalización
        if self.start_datetime and self.end_datetime and self.start_datetime >= self.end_datetime:
            raise ValidationError('La fecha de inicio debe ser anterior a la de finalización')
        
        # Validar que la fecha de inicio no sea en el pasado al crear un nuevo evento
        if not self.pk and self.start_datetime < timezone.now():
            raise ValidationError('No se puede crear un evento con fecha en el pasado')

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)


    @property
    def is_upcoming(self):
        """
        Retorna True si el evento está programado para el futuro.
        """
        return self.start_datetime > timezone.now()

    @property
    def is_ongoing(self):
        """
        Retorna True si el evento está en curso.
        """
        now = timezone.now()
        return self.start_datetime <= now <= self.end_datetime
