"""
Serializers for Music Learning App API
"""
from rest_framework import serializers
from .models import (
    Lesson, Exercise, UserProfile, LessonProgress,
    ExerciseAttempt, Badge, UserBadge, Achievement, UserAchievement,
    Challenge, ChallengeNote, UserChallengeProgress
)


class ExerciseSerializer(serializers.ModelSerializer):
    """
    Exercise serializer - EXCLUDES correct_answer from response
    This is critical for security - don't send answers to frontend
    """
    class Meta:
        model = Exercise
        fields = [
            'id', 'type', 'question', 'options',
            'hint', 'difficulty', 'xp_reward', 'order'
        ]
        # Explicitly exclude correct_answer


class LessonListSerializer(serializers.ModelSerializer):
    """
    Lesson list serializer with user progress information
    Used for GET /lessons/ endpoint
    """
    exercises_count = serializers.IntegerField(
        source='exercises.count',
        read_only=True
    )
    is_unlocked = serializers.SerializerMethodField()
    user_progress = serializers.SerializerMethodField()
    prerequisites = serializers.PrimaryKeyRelatedField(
        many=True,
        read_only=True
    )

    class Meta:
        model = Lesson
        fields = [
            'id', 'slug', 'title', 'description', 'icon',
            'color', 'category', 'difficulty', 'estimated_time',
            'xp_reward', 'prerequisites', 'exercises_count',
            'is_unlocked', 'user_progress', 'order'
        ]

    def get_is_unlocked(self, obj):
        """Check if lesson is unlocked for current user"""
        request = self.context.get('request')

        # If no user or anonymous, only unlock lessons without prerequisites
        if not request or not request.user.is_authenticated:
            return obj.prerequisites.count() == 0

        # Check if user has progress entry with is_unlocked=True
        try:
            progress = LessonProgress.objects.get(
                user=request.user,
                lesson=obj
            )
            return progress.is_unlocked
        except LessonProgress.DoesNotExist:
            # If no progress exists, check if it's a first lesson
            return obj.prerequisites.count() == 0

    def get_user_progress(self, obj):
        """Get user progress for this lesson"""
        request = self.context.get('request')

        if not request or not request.user.is_authenticated:
            return None

        try:
            progress = LessonProgress.objects.get(
                user=request.user,
                lesson=obj
            )
            return {
                'is_completed': progress.is_completed,
                'stars': progress.stars,
                'best_score': progress.best_score,
                'attempts': progress.attempts
            }
        except LessonProgress.DoesNotExist:
            return None


class LessonDetailSerializer(LessonListSerializer):
    """
    Lesson detail serializer with nested exercises
    Used for GET /lessons/{id}/ endpoint
    """
    exercises = ExerciseSerializer(many=True, read_only=True)

    class Meta(LessonListSerializer.Meta):
        fields = LessonListSerializer.Meta.fields + ['exercises']


class UserProfileSerializer(serializers.ModelSerializer):
    """User profile with gamification data"""
    accuracy = serializers.ReadOnlyField()
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = UserProfile
        fields = [
            'username', 'level', 'current_xp', 'total_xp',
            'current_streak', 'longest_streak', 'last_practice_date',
            'total_lessons_completed', 'total_exercises_completed',
            'total_practice_time', 'accuracy',
            'correct_answers', 'total_answers',
            'sound_enabled', 'music_enabled', 'vibration_enabled'
        ]
        read_only_fields = [
            'level', 'current_xp', 'total_xp', 'current_streak',
            'longest_streak', 'total_lessons_completed',
            'total_exercises_completed', 'total_practice_time',
            'correct_answers', 'total_answers', 'accuracy'
        ]


class LessonProgressSerializer(serializers.ModelSerializer):
    """Lesson progress serializer"""
    lesson_id = serializers.UUIDField(source='lesson.id', read_only=True)
    lesson_title = serializers.CharField(source='lesson.title', read_only=True)
    lesson_slug = serializers.CharField(source='lesson.slug', read_only=True)

    class Meta:
        model = LessonProgress
        fields = [
            'lesson_id', 'lesson_title', 'lesson_slug',
            'is_completed', 'is_unlocked', 'stars', 'best_score',
            'attempts', 'first_attempted_at', 'completed_at',
            'last_attempted_at'
        ]


class ExerciseResultSerializer(serializers.Serializer):
    """Serializer for individual exercise result in lesson completion"""
    exercise_id = serializers.UUIDField()
    user_answer = serializers.JSONField()
    is_correct = serializers.BooleanField()
    time_spent = serializers.IntegerField(min_value=0)


class LessonCompleteRequestSerializer(serializers.Serializer):
    """Request serializer for POST /lessons/{id}/complete/"""
    exercise_results = ExerciseResultSerializer(many=True)

    def validate_exercise_results(self, value):
        """Ensure at least one exercise result"""
        if not value:
            raise serializers.ValidationError(
                "At least one exercise result is required"
            )
        return value


class BadgeInfoSerializer(serializers.ModelSerializer):
    """Badge information for response"""
    class Meta:
        model = Badge
        fields = ['id', 'code', 'name', 'icon', 'description', 'category']


class LessonCompleteResponseSerializer(serializers.Serializer):
    """Response serializer for POST /lessons/{id}/complete/"""
    success = serializers.BooleanField()
    stars = serializers.IntegerField()
    score = serializers.IntegerField()
    xp_earned = serializers.IntegerField()
    new_level = serializers.IntegerField()
    level_up = serializers.BooleanField()
    unlocked_lessons = serializers.ListField(child=serializers.UUIDField())
    unlocked_badges = BadgeInfoSerializer(many=True)


class BadgeSerializer(serializers.ModelSerializer):
    """Badge serializer with unlock status"""
    is_unlocked = serializers.SerializerMethodField()
    unlocked_at = serializers.SerializerMethodField()

    class Meta:
        model = Badge
        fields = [
            'id', 'code', 'name', 'description', 'icon',
            'category', 'xp_reward', 'is_unlocked', 'unlocked_at'
        ]

    def get_is_unlocked(self, obj):
        """Check if badge is unlocked for current user"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False

        return UserBadge.objects.filter(
            user=request.user,
            badge=obj
        ).exists()

    def get_unlocked_at(self, obj):
        """Get unlock timestamp if unlocked"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None

        try:
            user_badge = UserBadge.objects.get(
                user=request.user,
                badge=obj
            )
            return user_badge.unlocked_at
        except UserBadge.DoesNotExist:
            return None


class AchievementSerializer(serializers.ModelSerializer):
    """Achievement serializer with user progress"""
    current_progress = serializers.SerializerMethodField()
    progress_percentage = serializers.SerializerMethodField()
    is_completed = serializers.SerializerMethodField()
    completed_at = serializers.SerializerMethodField()

    class Meta:
        model = Achievement
        fields = [
            'id', 'code', 'title', 'description',
            'target', 'metric_type', 'xp_reward',
            'current_progress', 'progress_percentage',
            'is_completed', 'completed_at'
        ]

    def get_current_progress(self, obj):
        """Get user's current progress on this achievement"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return 0

        try:
            user_achievement = UserAchievement.objects.get(
                user=request.user,
                achievement=obj
            )
            return user_achievement.current_progress
        except UserAchievement.DoesNotExist:
            return 0

    def get_progress_percentage(self, obj):
        """Get progress percentage"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return 0

        try:
            user_achievement = UserAchievement.objects.get(
                user=request.user,
                achievement=obj
            )
            return user_achievement.progress_percentage
        except UserAchievement.DoesNotExist:
            return 0

    def get_is_completed(self, obj):
        """Check if achievement is completed"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False

        try:
            user_achievement = UserAchievement.objects.get(
                user=request.user,
                achievement=obj
            )
            return user_achievement.is_completed
        except UserAchievement.DoesNotExist:
            return False

    def get_completed_at(self, obj):
        """Get completion timestamp"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None

        try:
            user_achievement = UserAchievement.objects.get(
                user=request.user,
                achievement=obj
            )
            return user_achievement.completed_at
        except UserAchievement.DoesNotExist:
            return None


class ChallengeNoteSerializer(serializers.ModelSerializer):
    """Challenge note serializer with all parameters"""
    class Meta:
        model = ChallengeNote
        fields = [
            'id', 'note', 'octave', 'beats_to_hold',
            'bpm', 'cents_threshold', 'order'
        ]


class ChallengeListSerializer(serializers.ModelSerializer):
    """Challenge list serializer with basic info"""
    notes_count = serializers.IntegerField(
        source='notes.count',
        read_only=True
    )
    user_progress = serializers.SerializerMethodField()

    class Meta:
        model = Challenge
        fields = [
            'id', 'slug', 'title', 'description', 'type',
            'difficulty', 'xp_reward', 'notes_count',
            'user_progress', 'order'
        ]

    def get_user_progress(self, obj):
        """Get user progress for this challenge"""
        request = self.context.get('request')

        if not request or not request.user.is_authenticated:
            return None

        try:
            progress = UserChallengeProgress.objects.get(
                user=request.user,
                challenge=obj
            )
            return {
                'is_completed': progress.is_completed,
                'stars': progress.stars,
                'accuracy': progress.accuracy,
                'best_accuracy': progress.best_accuracy,
                'attempts': progress.attempts
            }
        except UserChallengeProgress.DoesNotExist:
            return None


class ChallengeDetailSerializer(ChallengeListSerializer):
    """Challenge detail serializer with nested notes"""
    notes = ChallengeNoteSerializer(many=True, read_only=True)

    class Meta(ChallengeListSerializer.Meta):
        fields = ChallengeListSerializer.Meta.fields + ['notes']


class UserChallengeProgressSerializer(serializers.ModelSerializer):
    """User challenge progress serializer"""
    challenge_id = serializers.UUIDField(source='challenge.id', read_only=True)
    challenge_title = serializers.CharField(source='challenge.title', read_only=True)
    challenge_slug = serializers.CharField(source='challenge.slug', read_only=True)

    class Meta:
        model = UserChallengeProgress
        fields = [
            'challenge_id', 'challenge_title', 'challenge_slug',
            'is_completed', 'stars', 'accuracy', 'best_accuracy',
            'attempts', 'total_xp_earned',
            'first_attempted_at', 'completed_at', 'last_attempted_at'
        ]


class ChallengeCompleteRequestSerializer(serializers.Serializer):
    """Request serializer for POST /challenges/{id}/complete/"""
    accuracy = serializers.FloatField(
        min_value=0,
        max_value=100,
        help_text="Porcentaje de precisión (0-100)"
    )
    beats_completed = serializers.IntegerField(
        min_value=0,
        help_text="Cantidad de beats completados correctamente"
    )
    total_beats = serializers.IntegerField(
        min_value=1,
        help_text="Cantidad total de beats en el desafío"
    )

    def validate(self, data):
        """Validate that beats_completed doesn't exceed total_beats"""
        if data['beats_completed'] > data['total_beats']:
            raise serializers.ValidationError({
                'beats_completed': 'Cannot exceed total_beats'
            })
        return data


class ChallengeCompleteResponseSerializer(serializers.Serializer):
    """Response serializer for POST /challenges/{id}/complete/"""
    success = serializers.BooleanField()
    stars = serializers.IntegerField()
    accuracy = serializers.FloatField()
    xp_earned = serializers.IntegerField()
    new_level = serializers.IntegerField()
    level_up = serializers.BooleanField()
    unlocked_badges = BadgeInfoSerializer(many=True)
