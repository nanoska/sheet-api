"""
Django signals for events app to send webhooks to n8n
"""
import os
import httpx
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Location, Event, Repertoire
import logging

logger = logging.getLogger(__name__)

# n8n webhook URL from environment
# Use localhost since sheet-api runs on host, n8n accessible via host network
N8N_WEBHOOK_URL = os.getenv('N8N_WEBHOOK_URL', 'http://localhost:5678/webhook/sheet-api-created')
WEBHOOK_ENABLED = os.getenv('WEBHOOK_ENABLED', 'true').lower() == 'true'


async def send_webhook(entity_type: str, entity_id: int, data: dict):
    """
    Send webhook to n8n when entity is created.

    Args:
        entity_type: Type of entity (Location, Event, Repertoire)
        entity_id: ID of created entity
        data: Entity data to send
    """
    if not WEBHOOK_ENABLED:
        logger.info(f"Webhooks disabled. Skipping {entity_type} #{entity_id}")
        return

    payload = {
        'entity_type': entity_type,
        'entity_id': entity_id,
        'action': 'created',
        'data': data
    }

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(N8N_WEBHOOK_URL, json=payload)
            response.raise_for_status()
            logger.info(f"Webhook sent for {entity_type} #{entity_id}: {response.status_code}")
    except httpx.HTTPError as e:
        logger.error(f"Failed to send webhook for {entity_type} #{entity_id}: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error sending webhook: {str(e)}")


@receiver(post_save, sender=Location)
def location_created(sender, instance, created, **kwargs):
    """Send webhook when Location is created."""
    if created:
        import asyncio
        data = {
            'id': instance.id,
            'name': instance.name,
            'address': instance.address,
            'city': instance.city,
            'capacity': instance.capacity,
            'phone': instance.phone,
            'email': instance.email,
            'website': instance.website,
            'notes': instance.notes,
            'created_at': instance.created_at.isoformat() if instance.created_at else None
        }

        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

        loop.run_until_complete(send_webhook('Location', instance.id, data))


@receiver(post_save, sender=Event)
def event_created(sender, instance, created, **kwargs):
    """Send webhook when Event is created."""
    if created:
        import asyncio
        data = {
            'id': instance.id,
            'title': instance.title,
            'event_type': instance.event_type,
            'start_datetime': instance.start_datetime.isoformat() if instance.start_datetime else None,
            'end_datetime': instance.end_datetime.isoformat() if instance.end_datetime else None,
            'location_id': instance.location.id if instance.location else None,
            'location_name': instance.location.name if instance.location else None,
            'repertoire_id': instance.repertoire.id if instance.repertoire else None,
            'repertoire_name': instance.repertoire.name if instance.repertoire else None,
            'notes': instance.notes,
            'created_at': instance.created_at.isoformat() if instance.created_at else None
        }

        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

        loop.run_until_complete(send_webhook('Event', instance.id, data))


@receiver(post_save, sender=Repertoire)
def repertoire_created(sender, instance, created, **kwargs):
    """Send webhook when Repertoire is created."""
    if created:
        import asyncio
        data = {
            'id': instance.id,
            'name': instance.name,
            'description': instance.description,
            'created_at': instance.created_at.isoformat() if instance.created_at else None
        }

        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

        loop.run_until_complete(send_webhook('Repertoire', instance.id, data))
