#!/usr/bin/env python3
"""
Script para crear datos de ejemplo para probar los endpoints de jamdevientos.com
"""
import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sheetmusic_api.settings')
django.setup()

from django.utils import timezone
from datetime import timedelta
from events.models import Location, Repertoire, RepertoireVersion, Event
from music.models import Theme, Version, Instrument

def create_sample_data():
    print("Creando datos de ejemplo...")

    # Crear ubicación
    location, created = Location.objects.get_or_create(
        name="Teatro Colón",
        defaults={
            'address': "Cerrito 628",
            'city': 'Buenos Aires',
            'postal_code': 'C1010',
            'country': 'Argentina',
            'capacity': 3000,
            'contact_email': 'info@teatrocolon.org.ar',
            'website': 'https://teatrocolon.org.ar'
        }
    )
    if created:
        print(f"✓ Ubicación creada: {location}")
    else:
        print(f"✓ Ubicación existente: {location}")

    # Crear instrumentos
    instruments = []
    for inst_data in [
        {'name': 'Saxofón Alto', 'family': 'VIENTO_MADERA', 'afinacion': 'Eb'},
        {'name': 'Trompeta', 'family': 'VIENTO_METAL', 'afinacion': 'Bb'},
        {'name': 'Trombón', 'family': 'VIENTO_METAL', 'afinacion': 'Bb'},
        {'name': 'Clarinete', 'family': 'VIENTO_MADERA', 'afinacion': 'Bb'},
    ]:
        inst, created = Instrument.objects.get_or_create(
            name=inst_data['name'],
            defaults=inst_data
        )
        instruments.append(inst)
        if created:
            print(f"✓ Instrumento creado: {inst}")
        else:
            print(f"✓ Instrumento existente: {inst}")

    # Crear temas
    themes = []
    for theme_data in [
        {
            'title': 'Autumn Leaves',
            'artist': 'Joseph Kosma',
            'tonalidad': 'Gm',
            'description': 'Estándar de jazz clásico'
        },
        {
            'title': 'Blue Bossa',
            'artist': 'Kenny Dorham',
            'tonalidad': 'Cm',
            'description': 'Bossa nova clásica'
        },
        {
            'title': 'So What',
            'artist': 'Miles Davis',
            'tonalidad': 'Dm',
            'description': 'Tema modal del quinteto de Miles Davis'
        },
        {
            'title': 'All The Things You Are',
            'artist': 'Jerome Kern',
            'tonalidad': 'Ab',
            'description': 'Estándar de jazz con cambios complejos'
        },
    ]:
        theme, created = Theme.objects.get_or_create(
            title=theme_data['title'],
            defaults=theme_data
        )
        themes.append(theme)
        if created:
            print(f"✓ Tema creado: {theme}")
        else:
            print(f"✓ Tema existente: {theme}")

    # Crear versiones para cada tema
    versions = []
    for i, theme in enumerate(themes):
        version, created = Version.objects.get_or_create(
            theme=theme,
            title=f"Versión {i+1}",
            defaults={
                'type': 'STANDARD',
                'notes': f'Versión estándar del tema {theme.title}'
            }
        )
        versions.append(version)
        if created:
            print(f"✓ Versión creada: {version}")
        else:
            print(f"✓ Versión existente: {version}")

    # Crear repertorio
    repertoire, created = Repertoire.objects.get_or_create(
        name="Jam de Vientos - Repertorio Estándar",
        defaults={
            'description': 'Repertorio seleccionado para jam de vientos con estándares de jazz'
        }
    )
    if created:
        print(f"✓ Repertorio creado: {repertoire}")
    else:
        print(f"✓ Repertorio existente: {repertoire}")

    # Asociar versiones al repertorio con orden
    for i, version in enumerate(versions):
        rep_version, created = RepertoireVersion.objects.get_or_create(
            repertoire=repertoire,
            version=version,
            defaults={
                'order': i,
                'notes': f'Posición {i+1} en el repertorio'
            }
        )
        if created:
            print(f"✓ Versión agregada al repertorio: {rep_version}")
        else:
            print(f"✓ Versión ya existe en el repertorio: {rep_version}")

    # Crear evento futuro
    future_date = timezone.now() + timedelta(days=7)
    event, created = Event.objects.get_or_create(
        title="Jam de Vientos - Edición Especial",
        defaults={
            'event_type': 'CONCERT',
            'status': 'CONFIRMED',
            'description': 'Noche especial de jam de vientos con músicos invitados',
            'start_datetime': future_date,
            'end_datetime': future_date + timedelta(hours=3),
            'location': location,
            'repertoire': repertoire,
            'is_public': True,
            'max_attendees': 100,
            'price': 25.00
        }
    )
    if created:
        print(f"✓ Evento creado: {event}")
    else:
        print(f"✓ Evento existente: {event}")

    print("\n=== DATOS DE EJEMPLO CREADOS ===")
    print(f"Total eventos: {Event.objects.count()}")
    print(f"Total repertorios: {Repertoire.objects.count()}")
    print(f"Total temas: {Theme.objects.count()}")
    print(f"Total versiones: {Version.objects.count()}")
    print(f"Total ubicaciones: {Location.objects.count()}")
    print(f"Total instrumentos: {Instrument.objects.count()}")

if __name__ == '__main__':
    create_sample_data()
