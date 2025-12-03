"""
ViewSets for Music Learning App API
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.utils import timezone
from django.db.models import Avg, Count, Q
from datetime import datetime, timedelta

from .models import (
    Lesson, Exercise, UserProfile, LessonProgress,
    ExerciseAttempt, Badge, Achievement,
    Challenge, ChallengeNote, UserChallengeProgress
)
from .serializers import (
    LessonListSerializer, LessonDetailSerializer,
    UserProfileSerializer, LessonProgressSerializer,
    LessonCompleteRequestSerializer, BadgeSerializer,
    AchievementSerializer, BadgeInfoSerializer,
    ChallengeListSerializer, ChallengeDetailSerializer,
    UserChallengeProgressSerializer, ChallengeCompleteRequestSerializer
)
from .utils import get_or_create_user_profile, check_achievements, check_badges, unlock_next_lessons


class LessonViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Lesson model
    Provides list and retrieve actions
    Custom action: complete
    """
    queryset = Lesson.objects.filter(is_published=True).prefetch_related('exercises', 'prerequisites')
    permission_classes = [AllowAny]

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return LessonDetailSerializer
        return LessonListSerializer

    @action(detail=True, methods=['post'], permission_classes=[AllowAny])
    def complete(self, request, pk=None):
        """
        Complete a lesson with exercise results
        POST /api/v1/lessons/{id}/complete/
        
        Request body:
        {
            "exercise_results": [
                {
                    "exercise_id": "uuid",
                    "user_answer": "answer",
                    "is_correct": true,
                    "time_spent": 10
                }
            ]
        }
        """
        lesson = self.get_object()
        
        # Validate request data
        serializer = LessonCompleteRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        exercise_results = serializer.validated_data['exercise_results']
        
        # Get or create user (support anonymous mode)
        if request.user.is_authenticated:
            user = request.user
        else:
            # For demo mode - you might want to handle this differently
            return Response(
                {"error": "Authentication required to complete lessons"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Get or create user profile
        profile = get_or_create_user_profile(user)
        
        # Get or create lesson progress
        lesson_progress, created = LessonProgress.objects.get_or_create(
            user=user,
            lesson=lesson,
            defaults={'is_unlocked': True}
        )
        
        # Update attempt count
        lesson_progress.attempts += 1
        if not lesson_progress.first_attempted_at:
            lesson_progress.first_attempted_at = timezone.now()
        lesson_progress.last_attempted_at = timezone.now()
        
        # Process exercise results
        correct_count = 0
        total_count = len(exercise_results)
        total_time = 0
        total_xp = 0
        
        for result in exercise_results:
            exercise = Exercise.objects.get(id=result['exercise_id'])
            is_correct = result['is_correct']
            time_spent = result['time_spent']
            
            # Create exercise attempt record
            xp_earned = exercise.xp_reward if is_correct else 0
            ExerciseAttempt.objects.create(
                user=user,
                exercise=exercise,
                lesson_progress=lesson_progress,
                user_answer=result['user_answer'],
                is_correct=is_correct,
                time_spent=time_spent,
                xp_earned=xp_earned
            )
            
            if is_correct:
                correct_count += 1
                total_xp += xp_earned
            
            total_time += time_spent
        
        # Calculate score and stars
        score = round((correct_count / total_count) * 100)
        stars = lesson_progress.calculate_stars(correct_count, total_count)
        
        # Update lesson progress
        if score >= 50:  # Minimum 50% to complete
            lesson_progress.is_completed = True
            lesson_progress.completed_at = timezone.now()
        
        # Update best score and stars
        if score > lesson_progress.best_score:
            lesson_progress.best_score = score
        if stars > lesson_progress.stars:
            lesson_progress.stars = stars
        
        lesson_progress.save()
        
        # Update user profile
        old_level = profile.level
        
        # Add XP from lesson completion
        if lesson_progress.is_completed:
            total_xp += lesson.xp_reward
        
        profile.add_xp(total_xp)
        
        # Update statistics
        if lesson_progress.is_completed and lesson_progress.attempts == 1:
            # Only count first completion
            profile.total_lessons_completed += 1
        
        profile.total_exercises_completed += total_count
        profile.correct_answers += correct_count
        profile.total_answers += total_count
        profile.total_practice_time += total_time // 60  # Convert to minutes
        
        # Update streak
        profile.update_streak()
        profile.save()
        
        new_level = profile.level
        level_up = new_level > old_level
        
        # Check for unlocked content
        unlocked_lessons = []
        unlocked_badges = []
        
        if lesson_progress.is_completed:
            # Unlock next lessons
            next_lessons = unlock_next_lessons(user, lesson)
            unlocked_lessons = [str(l.id) for l in next_lessons]
            
            # Check badges and achievements
            new_badges = check_badges(user)
            unlocked_badges = BadgeInfoSerializer(new_badges, many=True).data
            
            check_achievements(user)
        
        # Return response
        return Response({
            'success': True,
            'stars': stars,
            'score': score,
            'xp_earned': total_xp,
            'new_level': new_level,
            'level_up': level_up,
            'unlocked_lessons': unlocked_lessons,
            'unlocked_badges': unlocked_badges
        })


class UserProgressViewSet(viewsets.ViewSet):
    """
    ViewSet for user progress and statistics
    Custom actions only - no model-based CRUD
    """
    permission_classes = [AllowAny]

    @action(detail=False, methods=['get'])
    def progress(self, request):
        """
        Get user progress summary
        GET /api/v1/user/progress/
        """
        if not request.user.is_authenticated:
            return Response(
                {"error": "Authentication required"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        profile = get_or_create_user_profile(request.user)
        serializer = UserProfileSerializer(profile)
        
        # Add badge and achievement counts
        from .models import UserBadge, UserAchievement
        data = serializer.data
        data['badges_count'] = UserBadge.objects.filter(user=request.user).count()
        data['achievements_completed'] = UserAchievement.objects.filter(
            user=request.user,
            is_completed=True
        ).count()
        
        return Response(data)

    @action(detail=False, methods=['get'])
    def lessons(self, request):
        """
        Get user progress on all lessons
        GET /api/v1/user/progress/lessons/
        """
        if not request.user.is_authenticated:
            return Response(
                {"error": "Authentication required"},
                status=status.HTTP_401_UNAUTHORIZED
            )

        progress = LessonProgress.objects.filter(user=request.user)
        serializer = LessonProgressSerializer(progress, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def challenges(self, request):
        """
        Get user progress on all challenges
        GET /api/v1/user/progress/challenges/
        """
        if not request.user.is_authenticated:
            return Response(
                {"error": "Authentication required"},
                status=status.HTTP_401_UNAUTHORIZED
            )

        progress = UserChallengeProgress.objects.filter(user=request.user)
        serializer = UserChallengeProgressSerializer(progress, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get detailed user statistics
        GET /api/v1/user/stats/
        """
        if not request.user.is_authenticated:
            return Response(
                {"error": "Authentication required"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        profile = get_or_create_user_profile(request.user)
        
        # Overview stats
        overview = {
            'level': profile.level,
            'total_xp': profile.total_xp,
            'streak': profile.current_streak,
            'accuracy': profile.accuracy
        }
        
        # Stats by category
        by_category = {}
        for category, _ in Lesson.CATEGORY_CHOICES:
            lessons_in_category = Lesson.objects.filter(category=category)
            completed = LessonProgress.objects.filter(
                user=request.user,
                lesson__category=category,
                is_completed=True
            )
            
            attempts_in_category = ExerciseAttempt.objects.filter(
                user=request.user,
                exercise__lesson__category=category
            )
            
            total_attempts = attempts_in_category.count()
            correct_attempts = attempts_in_category.filter(is_correct=True).count()
            
            category_accuracy = 0
            if total_attempts > 0:
                category_accuracy = round((correct_attempts / total_attempts) * 100, 2)
            
            by_category[category] = {
                'lessons_completed': completed.count(),
                'accuracy': category_accuracy
            }
        
        # Recent activity (last 7 days)
        recent_activity = []
        for i in range(7):
            date = datetime.now().date() - timedelta(days=i)
            attempts_on_day = ExerciseAttempt.objects.filter(
                user=request.user,
                attempted_at__date=date
            )
            
            if attempts_on_day.exists():
                recent_activity.append({
                    'date': str(date),
                    'exercises_completed': attempts_on_day.count(),
                    'xp_earned': sum(a.xp_earned for a in attempts_on_day)
                })
        
        return Response({
            'overview': overview,
            'by_category': by_category,
            'recent_activity': recent_activity
        })

    @action(detail=False, methods=['post'])
    def update_streak(self, request):
        """
        Update user streak
        POST /api/v1/user/streak/update/
        """
        if not request.user.is_authenticated:
            return Response(
                {"error": "Authentication required"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        profile = get_or_create_user_profile(request.user)
        profile.update_streak()
        
        return Response({
            'current_streak': profile.current_streak,
            'streak_updated': True,
            'message': f'¡Increíble! Llevas {profile.current_streak} días consecutivos'
        })


class BadgeViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Badge model
    Read-only: list and retrieve
    """
    queryset = Badge.objects.filter(is_active=True)
    serializer_class = BadgeSerializer
    permission_classes = [AllowAny]


class AchievementViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Achievement model
    Read-only: list and retrieve
    """
    queryset = Achievement.objects.filter(is_active=True)
    serializer_class = AchievementSerializer
    permission_classes = [AllowAny]


class ChallengeViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Challenge model
    Provides list and retrieve actions
    Custom action: complete
    """
    queryset = Challenge.objects.filter(is_published=True).prefetch_related('notes')
    permission_classes = [AllowAny]

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ChallengeDetailSerializer
        return ChallengeListSerializer

    @action(detail=True, methods=['post'], permission_classes=[AllowAny])
    def complete(self, request, pk=None):
        """
        Complete a challenge with accuracy results
        POST /api/v1/challenges/{id}/complete/

        Request body:
        {
            "accuracy": 85.5,
            "beats_completed": 15,
            "total_beats": 16
        }
        """
        challenge = self.get_object()

        # Validate request data
        serializer = ChallengeCompleteRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        accuracy = serializer.validated_data['accuracy']
        beats_completed = serializer.validated_data['beats_completed']
        total_beats = serializer.validated_data['total_beats']

        # Require authentication for completion
        if not request.user.is_authenticated:
            return Response(
                {"error": "Authentication required to complete challenges"},
                status=status.HTTP_401_UNAUTHORIZED
            )

        user = request.user

        # Get or create user profile
        profile = get_or_create_user_profile(user)

        # Get or create challenge progress
        progress, created = UserChallengeProgress.objects.get_or_create(
            user=user,
            challenge=challenge
        )

        # Calculate stars based on accuracy
        stars = progress.calculate_stars(accuracy)

        # Calculate XP earned (base + bonus for high accuracy)
        xp_earned = challenge.xp_reward
        if stars == 3:
            xp_earned = int(xp_earned * 1.5)  # 50% bonus for 3 stars
        elif stars == 2:
            xp_earned = int(xp_earned * 1.2)  # 20% bonus for 2 stars

        # Update progress
        old_level = profile.level
        progress.update_progress(accuracy, xp_earned)

        # Add XP to profile
        profile.add_xp(xp_earned)

        # Update stats
        profile.total_exercises_completed += 1
        profile.update_streak()
        profile.save()

        new_level = profile.level
        level_up = new_level > old_level

        # Check for unlocked badges
        unlocked_badges = []
        if progress.is_completed:
            new_badges = check_badges(user)
            unlocked_badges = BadgeInfoSerializer(new_badges, many=True).data
            check_achievements(user)

        # Return response
        return Response({
            'success': True,
            'stars': progress.stars,
            'accuracy': progress.accuracy,
            'xp_earned': xp_earned,
            'new_level': new_level,
            'level_up': level_up,
            'unlocked_badges': unlocked_badges
        })
