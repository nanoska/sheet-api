"""
Django Admin configuration for Music Learning App
"""
from django.contrib import admin
from .models import (
    Lesson, Exercise, UserProfile, LessonProgress,
    ExerciseAttempt, Badge, UserBadge, Achievement, UserAchievement,
    Challenge, ChallengeNote, UserChallengeProgress
)


class ExerciseInline(admin.TabularInline):
    """Inline for exercises within lesson admin"""
    model = Exercise
    extra = 1
    fields = ('type', 'question', 'difficulty', 'xp_reward', 'order')


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    """Admin for Lesson model"""
    list_display = ('title', 'category', 'difficulty', 'order', 'is_published', 'xp_reward')
    list_filter = ('category', 'difficulty', 'is_published', 'is_active')
    search_fields = ('title', 'description', 'slug')
    prepopulated_fields = {'slug': ('title',)}
    filter_horizontal = ('prerequisites',)
    inlines = [ExerciseInline]
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('title', 'slug', 'description', 'icon', 'color')
        }),
        ('Categorización', {
            'fields': ('category', 'difficulty', 'order')
        }),
        ('Gamificación', {
            'fields': ('estimated_time', 'xp_reward', 'prerequisites')
        }),
        ('Estado', {
            'fields': ('is_active', 'is_published', 'created_by')
        }),
    )


@admin.register(Exercise)
class ExerciseAdmin(admin.ModelAdmin):
    """Admin for Exercise model"""
    list_display = ('lesson', 'type', 'difficulty', 'order', 'xp_reward')
    list_filter = ('type', 'difficulty', 'lesson__category')
    search_fields = ('question', 'lesson__title')
    
    fieldsets = (
        ('Relación', {
            'fields': ('lesson',)
        }),
        ('Contenido', {
            'fields': ('type', 'question', 'hint')
        }),
        ('Opciones y Respuesta', {
            'fields': ('options', 'correct_answer')
        }),
        ('Configuración', {
            'fields': ('difficulty', 'xp_reward', 'order')
        }),
    )


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    """Admin for UserProfile model"""
    list_display = ('user', 'level', 'total_xp', 'current_streak', 'accuracy_display')
    list_filter = ('level',)
    search_fields = ('user__username', 'user__email')
    readonly_fields = ('accuracy_display', 'created_at', 'updated_at')
    
    fieldsets = (
        ('Usuario', {
            'fields': ('user',)
        }),
        ('Niveles y XP', {
            'fields': ('level', 'current_xp', 'total_xp')
        }),
        ('Rachas', {
            'fields': ('current_streak', 'longest_streak', 'last_practice_date')
        }),
        ('Estadísticas', {
            'fields': (
                'total_lessons_completed', 'total_exercises_completed',
                'total_practice_time', 'correct_answers', 'total_answers',
                'accuracy_display'
            )
        }),
        ('Configuración', {
            'fields': ('sound_enabled', 'music_enabled', 'vibration_enabled')
        }),
    )
    
    def accuracy_display(self, obj):
        return f"{obj.accuracy}%"
    accuracy_display.short_description = 'Precisión'


@admin.register(LessonProgress)
class LessonProgressAdmin(admin.ModelAdmin):
    """Admin for LessonProgress model"""
    list_display = ('user', 'lesson', 'is_completed', 'stars', 'best_score', 'attempts')
    list_filter = ('is_completed', 'is_unlocked', 'stars', 'lesson__category')
    search_fields = ('user__username', 'lesson__title')
    readonly_fields = ('first_attempted_at', 'completed_at', 'last_attempted_at', 'created_at', 'updated_at')
    
    fieldsets = (
        ('Relación', {
            'fields': ('user', 'lesson')
        }),
        ('Estado', {
            'fields': ('is_completed', 'is_unlocked')
        }),
        ('Métricas', {
            'fields': ('stars', 'best_score', 'attempts')
        }),
        ('Timestamps', {
            'fields': ('first_attempted_at', 'completed_at', 'last_attempted_at', 'created_at', 'updated_at')
        }),
    )


@admin.register(ExerciseAttempt)
class ExerciseAttemptAdmin(admin.ModelAdmin):
    """Admin for ExerciseAttempt model"""
    list_display = ('user', 'exercise', 'is_correct', 'time_spent', 'xp_earned', 'attempted_at')
    list_filter = ('is_correct', 'attempted_at')
    search_fields = ('user__username', 'exercise__question')
    readonly_fields = ('attempted_at',)
    date_hierarchy = 'attempted_at'


@admin.register(Badge)
class BadgeAdmin(admin.ModelAdmin):
    """Admin for Badge model"""
    list_display = ('name', 'icon', 'category', 'xp_reward', 'is_active')
    list_filter = ('category', 'is_active')
    search_fields = ('name', 'description', 'code')
    prepopulated_fields = {'code': ('name',)}
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('code', 'name', 'description', 'icon')
        }),
        ('Configuración', {
            'fields': ('category', 'unlock_criteria', 'xp_reward')
        }),
        ('Estado', {
            'fields': ('is_active',)
        }),
    )


@admin.register(UserBadge)
class UserBadgeAdmin(admin.ModelAdmin):
    """Admin for UserBadge model"""
    list_display = ('user', 'badge', 'unlocked_at')
    list_filter = ('badge__category', 'unlocked_at')
    search_fields = ('user__username', 'badge__name')
    readonly_fields = ('unlocked_at',)
    date_hierarchy = 'unlocked_at'


@admin.register(Achievement)
class AchievementAdmin(admin.ModelAdmin):
    """Admin for Achievement model"""
    list_display = ('title', 'metric_type', 'target', 'xp_reward', 'is_active')
    list_filter = ('metric_type', 'is_active')
    search_fields = ('title', 'description', 'code')
    prepopulated_fields = {'code': ('title',)}
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('code', 'title', 'description')
        }),
        ('Configuración', {
            'fields': ('metric_type', 'target', 'xp_reward')
        }),
        ('Estado', {
            'fields': ('is_active',)
        }),
    )


@admin.register(UserAchievement)
class UserAchievementAdmin(admin.ModelAdmin):
    """Admin for UserAchievement model"""
    list_display = ('user', 'achievement', 'current_progress', 'target', 'is_completed', 'progress_percentage_display')
    list_filter = ('is_completed', 'achievement__metric_type')
    search_fields = ('user__username', 'achievement__title')
    readonly_fields = ('progress_percentage_display', 'completed_at', 'created_at', 'updated_at')
    
    fieldsets = (
        ('Relación', {
            'fields': ('user', 'achievement')
        }),
        ('Progreso', {
            'fields': ('current_progress', 'is_completed', 'progress_percentage_display')
        }),
        ('Timestamps', {
            'fields': ('completed_at', 'created_at', 'updated_at')
        }),
    )
    
    def target(self, obj):
        return obj.achievement.target
    target.short_description = 'Meta'
    
    def progress_percentage_display(self, obj):
        return f"{obj.progress_percentage}%"
    progress_percentage_display.short_description = 'Porcentaje de Progreso'


class ChallengeNoteInline(admin.TabularInline):
    """Inline for challenge notes within challenge admin"""
    model = ChallengeNote
    extra = 1
    fields = ('note', 'octave', 'beats_to_hold', 'bpm', 'cents_threshold', 'order')


@admin.register(Challenge)
class ChallengeAdmin(admin.ModelAdmin):
    """Admin for Challenge model"""
    list_display = ('title', 'type', 'difficulty', 'order', 'is_published', 'xp_reward')
    list_filter = ('type', 'difficulty', 'is_published', 'is_active')
    search_fields = ('title', 'description', 'slug')
    prepopulated_fields = {'slug': ('title',)}
    inlines = [ChallengeNoteInline]

    fieldsets = (
        ('Información Básica', {
            'fields': ('title', 'slug', 'description', 'type')
        }),
        ('Configuración', {
            'fields': ('difficulty', 'order', 'xp_reward')
        }),
        ('Estado', {
            'fields': ('is_active', 'is_published')
        }),
    )


@admin.register(ChallengeNote)
class ChallengeNoteAdmin(admin.ModelAdmin):
    """Admin for ChallengeNote model"""
    list_display = ('challenge', 'note', 'octave', 'beats_to_hold', 'bpm', 'cents_threshold', 'order')
    list_filter = ('note', 'octave', 'challenge__type')
    search_fields = ('challenge__title',)

    fieldsets = (
        ('Relación', {
            'fields': ('challenge',)
        }),
        ('Nota', {
            'fields': ('note', 'octave')
        }),
        ('Parámetros', {
            'fields': ('beats_to_hold', 'bpm', 'cents_threshold', 'order')
        }),
    )


@admin.register(UserChallengeProgress)
class UserChallengeProgressAdmin(admin.ModelAdmin):
    """Admin for UserChallengeProgress model"""
    list_display = ('user', 'challenge', 'is_completed', 'stars', 'accuracy', 'best_accuracy', 'attempts')
    list_filter = ('is_completed', 'stars', 'challenge__type', 'challenge__difficulty')
    search_fields = ('user__username', 'challenge__title')
    readonly_fields = (
        'first_attempted_at', 'completed_at', 'last_attempted_at',
        'created_at', 'updated_at'
    )

    fieldsets = (
        ('Relación', {
            'fields': ('user', 'challenge')
        }),
        ('Estado', {
            'fields': ('is_completed', 'stars')
        }),
        ('Métricas', {
            'fields': ('accuracy', 'best_accuracy', 'attempts', 'total_xp_earned')
        }),
        ('Timestamps', {
            'fields': (
                'first_attempted_at', 'completed_at', 'last_attempted_at',
                'created_at', 'updated_at'
            )
        }),
    )
