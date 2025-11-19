"""
Django signals for music app to send webhooks to n8n
"""
import os
import httpx
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Theme, Instrument, Version
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
        entity_type: Type of entity (Theme, Instrument, Version, etc.)
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


@receiver(post_save, sender=Theme)
def theme_created(sender, instance, created, **kwargs):
    """Send webhook when Theme is created."""
    if created:
        import asyncio
        data = {
            'id': instance.id,
            'title': instance.title,
            'artist': instance.artist,
            'tonalidad': instance.tonalidad,
            'description': instance.description,
            'created_at': instance.created_at.isoformat() if instance.created_at else None
        }

        # Run async webhook in sync context
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

        loop.run_until_complete(send_webhook('Theme', instance.id, data))


@receiver(post_save, sender=Instrument)
def instrument_created(sender, instance, created, **kwargs):
    """Send webhook when Instrument is created."""
    if created:
        import asyncio
        data = {
            'id': instance.id,
            'name': instance.name,
            'family': instance.family,
            'afinacion': instance.afinacion,
            'created_at': instance.created_at.isoformat() if instance.created_at else None
        }

        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

        loop.run_until_complete(send_webhook('Instrument', instance.id, data))


@receiver(post_save, sender=Version)
def version_created(sender, instance, created, **kwargs):
    """Send webhook when Version is created."""
    if created:
        import asyncio
        data = {
            'id': instance.id,
            'theme_id': instance.theme.id,
            'theme_title': instance.theme.title,
            'title': instance.title,
            'type': instance.type,
            'notes': instance.notes,
            'created_at': instance.created_at.isoformat() if instance.created_at else None
        }

        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

        loop.run_until_complete(send_webhook('Version', instance.id, data))
