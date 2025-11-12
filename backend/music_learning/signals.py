"""
Signal handlers for Music Learning App
Auto-trigger achievements, badge checks, and lesson unlocks
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from .models import LessonProgress, UserProfile
from .utils import check_achievements, check_badges, unlock_next_lessons


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """
    Automatically create UserProfile when a new User is created
    """
    if created:
        UserProfile.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    """
    Save UserProfile when User is saved
    """
    if hasattr(instance, 'music_profile'):
        instance.music_profile.save()


@receiver(post_save, sender=LessonProgress)
def on_lesson_progress_update(sender, instance, created, **kwargs):
    """
    When a lesson is completed:
    1. Check and unlock achievements
    2. Check and unlock badges
    3. Unlock next lessons if prerequisites are met
    """
    # Only trigger if lesson was just completed (not on every save)
    if instance.is_completed:
        user = instance.user
        lesson = instance.lesson

        # Check for achievements
        check_achievements(user)

        # Check for badges
        check_badges(user)

        # Unlock next lessons
        unlock_next_lessons(user, lesson)
