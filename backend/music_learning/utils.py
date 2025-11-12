"""
Utility functions for Music Learning App gamification logic
"""
from django.utils import timezone
from django.conf import settings


def calculate_level_from_xp(total_xp):
    """
    Calculate user level based on total XP
    Formula: level = (total_xp // XP_PER_LEVEL) + 1
    """
    xp_per_level = settings.MUSIC_LEARNING_SETTINGS.get('XP_PER_LEVEL', 100)
    return (total_xp // xp_per_level) + 1


def calculate_stars(correct_count, total_count):
    """
    Calculate stars based on accuracy percentage
    3 stars: >= 90% accuracy
    2 stars: >= 70% accuracy
    1 star: >= 50% accuracy
    0 stars: < 50% accuracy
    """
    if total_count == 0:
        return 0

    accuracy = (correct_count / total_count) * 100

    if accuracy >= 90:
        return 3
    elif accuracy >= 70:
        return 2
    elif accuracy >= 50:
        return 1
    else:
        return 0


def unlock_next_lessons(user, completed_lesson):
    """
    Unlock lessons that have the completed lesson as a prerequisite
    Only unlocks if ALL prerequisites are met

    Args:
        user: User instance
        completed_lesson: Lesson instance that was just completed

    Returns:
        list: List of newly unlocked Lesson instances
    """
    from .models import Lesson, LessonProgress

    # Find all lessons that have this lesson as a prerequisite
    next_lessons = Lesson.objects.filter(
        prerequisites=completed_lesson,
        is_published=True
    )

    unlocked_lessons = []

    for lesson in next_lessons:
        # Check if all prerequisites are completed
        all_prerequisites = lesson.prerequisites.all()

        all_met = all(
            LessonProgress.objects.filter(
                user=user,
                lesson=prereq,
                is_completed=True
            ).exists()
            for prereq in all_prerequisites
        )

        if all_met:
            # Get or create progress and unlock
            progress, created = LessonProgress.objects.get_or_create(
                user=user,
                lesson=lesson,
                defaults={'is_unlocked': True}
            )

            if not progress.is_unlocked:
                progress.is_unlocked = True
                progress.save()
                unlocked_lessons.append(lesson)
            elif created:
                unlocked_lessons.append(lesson)

    return unlocked_lessons


def check_achievements(user):
    """
    Check and update user achievements based on current metrics
    Automatically completes achievements when target is reached

    Args:
        user: User instance

    Returns:
        list: List of newly completed Achievement instances
    """
    from .models import Achievement, UserAchievement

    profile = user.music_profile
    achievements = Achievement.objects.filter(is_active=True)

    newly_completed = []

    for achievement in achievements:
        user_achievement, created = UserAchievement.objects.get_or_create(
            user=user,
            achievement=achievement
        )

        # Skip if already completed
        if user_achievement.is_completed:
            continue

        # Get current metric value
        current_value = 0
        if achievement.metric_type == 'lessons_completed':
            current_value = profile.total_lessons_completed
        elif achievement.metric_type == 'exercises_completed':
            current_value = profile.total_exercises_completed
        elif achievement.metric_type == 'streak_days':
            current_value = profile.current_streak
        elif achievement.metric_type == 'perfect_lessons':
            from .models import LessonProgress
            current_value = LessonProgress.objects.filter(
                user=user,
                stars=3
            ).count()
        elif achievement.metric_type == 'total_xp':
            current_value = profile.total_xp

        # Update progress
        user_achievement.current_progress = current_value

        # Check if completed
        if current_value >= achievement.target and not user_achievement.is_completed:
            user_achievement.is_completed = True
            user_achievement.completed_at = timezone.now()

            # Award XP
            profile.add_xp(achievement.xp_reward)

            newly_completed.append(achievement)

        user_achievement.save()

    return newly_completed


def check_badges(user):
    """
    Check and unlock badges based on unlock criteria

    Args:
        user: User instance

    Returns:
        list: List of newly unlocked Badge instances
    """
    from .models import Badge, UserBadge, LessonProgress

    profile = user.music_profile
    badges = Badge.objects.filter(is_active=True)

    newly_unlocked = []

    for badge in badges:
        # Skip if already unlocked
        if UserBadge.objects.filter(user=user, badge=badge).exists():
            continue

        # Check unlock criteria
        criteria = badge.unlock_criteria
        criteria_type = criteria.get('type')
        target = criteria.get('target', 0)

        should_unlock = False

        if criteria_type == 'lessons_completed':
            should_unlock = profile.total_lessons_completed >= target
        elif criteria_type == 'perfect_lessons':
            perfect_count = LessonProgress.objects.filter(user=user, stars=3).count()
            should_unlock = perfect_count >= target
        elif criteria_type == 'streak_days':
            should_unlock = profile.current_streak >= target
        elif criteria_type == 'total_xp':
            should_unlock = profile.total_xp >= target
        elif criteria_type == 'exercises_completed':
            should_unlock = profile.total_exercises_completed >= target

        if should_unlock:
            # Unlock badge
            UserBadge.objects.create(user=user, badge=badge)

            # Award XP
            if badge.xp_reward > 0:
                profile.add_xp(badge.xp_reward)

            newly_unlocked.append(badge)

    return newly_unlocked


def get_or_create_user_profile(user):
    """
    Get or create UserProfile for a user
    Helper function to ensure every user has a profile

    Args:
        user: User instance

    Returns:
        UserProfile instance
    """
    from .models import UserProfile

    profile, created = UserProfile.objects.get_or_create(
        user=user,
        defaults={
            'level': 1,
            'current_xp': 0,
            'total_xp': 0,
            'current_streak': 0,
            'longest_streak': 0,
        }
    )

    return profile
