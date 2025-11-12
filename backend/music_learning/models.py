"""
Models for Music Learning App - Gamified Music Education Platform
"""
import uuid
from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone


class Lesson(models.Model):
    """Musical lesson with exercises and prerequisites"""

    # Categories
    CATEGORY_CHOICES = [
        ('notes', 'Notas'),
        ('rhythm', 'Ritmo'),
        ('theory', 'Teoría'),
        ('chords', 'Acordes'),
        ('intervals', 'Intervalos'),
    ]

    # Difficulty levels
    DIFFICULTY_CHOICES = [
        ('beginner', 'Principiante'),
        ('intermediate', 'Intermedio'),
        ('advanced', 'Avanzado'),
    ]

    # Identification
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    slug = models.SlugField(unique=True, max_length=100)

    # Content
    title = models.CharField(max_length=200)
    description = models.TextField()
    icon = models.CharField(max_length=10, help_text="Emoji o código de ícono")

    # Visual configuration
    color = models.CharField(max_length=7, default='#1CB0F6', help_text="HEX color")

    # Categorization
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES)

    # Gamification
    estimated_time = models.IntegerField(
        help_text="Tiempo estimado en minutos",
        validators=[MinValueValidator(1)]
    )
    xp_reward = models.IntegerField(
        default=50,
        help_text="XP base por completar",
        validators=[MinValueValidator(0)]
    )

    # Prerequisites (self-referencing many-to-many)
    prerequisites = models.ManyToManyField(
        'self',
        symmetrical=False,
        blank=True,
        related_name='unlocks'
    )

    # Ordering
    order = models.IntegerField(
        default=0,
        help_text="Orden en el path de aprendizaje"
    )

    # Status
    is_active = models.BooleanField(default=True)
    is_published = models.BooleanField(default=False)

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='lessons_created'
    )

    class Meta:
        ordering = ['order', 'created_at']
        verbose_name = 'Lección'
        verbose_name_plural = 'Lecciones'
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['category', 'difficulty']),
            models.Index(fields=['is_published', 'order']),
        ]

    def __str__(self):
        return f"{self.title} ({self.get_difficulty_display()})"


class Exercise(models.Model):
    """Individual exercise within a lesson"""

    # Exercise types
    TYPE_CHOICES = [
        ('note-recognition', 'Reconocimiento de Notas'),
        ('rhythm', 'Ritmo'),
        ('chord', 'Acordes'),
        ('interval', 'Intervalos'),
        ('theory', 'Teoría Musical'),
    ]

    # Difficulty levels
    DIFFICULTY_CHOICES = [
        ('easy', 'Fácil'),
        ('medium', 'Medio'),
        ('hard', 'Difícil'),
    ]

    # Relation
    lesson = models.ForeignKey(
        Lesson,
        on_delete=models.CASCADE,
        related_name='exercises'
    )

    # Identification
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Type
    type = models.CharField(max_length=50, choices=TYPE_CHOICES)

    # Content
    question = models.TextField(help_text="Pregunta del ejercicio")
    hint = models.TextField(blank=True, help_text="Pista opcional")

    # Options and answer (JSON for flexibility)
    options = models.JSONField(
        help_text="Array de opciones: ['Do', 'Re', 'Mi', 'Fa']"
    )
    correct_answer = models.JSONField(
        help_text="Respuesta correcta (string o array para múltiples)"
    )

    # Configuration
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES)
    xp_reward = models.IntegerField(
        default=10,
        help_text="XP por respuesta correcta",
        validators=[MinValueValidator(0)]
    )

    # Ordering
    order = models.IntegerField(default=0)

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['lesson', 'order']
        verbose_name = 'Ejercicio'
        verbose_name_plural = 'Ejercicios'
        indexes = [
            models.Index(fields=['lesson', 'order']),
        ]

    def __str__(self):
        return f"{self.lesson.title} - Ejercicio {self.order + 1}"


class UserProfile(models.Model):
    """Extended user profile with gamification data"""

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='music_profile'
    )

    # Level and XP system
    level = models.IntegerField(default=1, validators=[MinValueValidator(1)])
    current_xp = models.IntegerField(
        default=0,
        help_text="XP en el nivel actual",
        validators=[MinValueValidator(0)]
    )
    total_xp = models.IntegerField(
        default=0,
        help_text="XP acumulado total",
        validators=[MinValueValidator(0)]
    )

    # Streak system
    current_streak = models.IntegerField(
        default=0,
        help_text="Días consecutivos",
        validators=[MinValueValidator(0)]
    )
    longest_streak = models.IntegerField(
        default=0,
        help_text="Mejor racha",
        validators=[MinValueValidator(0)]
    )
    last_practice_date = models.DateField(null=True, blank=True)

    # General statistics
    total_lessons_completed = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)]
    )
    total_exercises_completed = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)]
    )
    total_practice_time = models.IntegerField(
        default=0,
        help_text="Minutos totales",
        validators=[MinValueValidator(0)]
    )

    # Accuracy tracking
    correct_answers = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)]
    )
    total_answers = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)]
    )

    # User settings
    sound_enabled = models.BooleanField(default=True)
    music_enabled = models.BooleanField(default=True)
    vibration_enabled = models.BooleanField(default=True)

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Perfil de Usuario'
        verbose_name_plural = 'Perfiles de Usuarios'

    def __str__(self):
        return f"{self.user.username} - Level {self.level}"

    @property
    def accuracy(self):
        """Calculate accuracy percentage"""
        if self.total_answers == 0:
            return 0
        return round((self.correct_answers / self.total_answers) * 100, 2)

    def add_xp(self, amount):
        """Add XP and level up if necessary"""
        XP_PER_LEVEL = 100
        self.total_xp += amount
        self.current_xp += amount

        # Level up logic
        while self.current_xp >= XP_PER_LEVEL:
            self.level += 1
            self.current_xp -= XP_PER_LEVEL

        self.save()

    def update_streak(self):
        """Update streak based on practice date"""
        from datetime import date, timedelta

        today = date.today()

        if not self.last_practice_date:
            # First practice
            self.current_streak = 1
            self.last_practice_date = today
        elif self.last_practice_date == today:
            # Already practiced today, do nothing
            pass
        elif self.last_practice_date == today - timedelta(days=1):
            # Consecutive day
            self.current_streak += 1
            self.last_practice_date = today

            # Update longest streak
            if self.current_streak > self.longest_streak:
                self.longest_streak = self.current_streak
        else:
            # Streak broken
            self.current_streak = 1
            self.last_practice_date = today

        self.save()


class LessonProgress(models.Model):
    """User progress on a specific lesson"""

    # Relations
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='lesson_progress'
    )
    lesson = models.ForeignKey(
        Lesson,
        on_delete=models.CASCADE,
        related_name='user_progress'
    )

    # Status
    is_completed = models.BooleanField(default=False)
    is_unlocked = models.BooleanField(default=False)

    # Metrics
    stars = models.IntegerField(
        default=0,
        help_text="0-3 estrellas",
        validators=[MinValueValidator(0), MaxValueValidator(3)]
    )
    best_score = models.IntegerField(
        default=0,
        help_text="Mejor puntaje obtenido",
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    attempts = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)]
    )

    # Timestamps
    first_attempted_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    last_attempted_at = models.DateTimeField(null=True, blank=True)

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['user', 'lesson']
        ordering = ['-updated_at']
        verbose_name = 'Progreso de Lección'
        verbose_name_plural = 'Progresos de Lecciones'
        indexes = [
            models.Index(fields=['user', 'lesson']),
            models.Index(fields=['is_completed', 'updated_at']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.lesson.title}"

    def calculate_stars(self, correct_count, total_count):
        """Calculate stars based on accuracy"""
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


class ExerciseAttempt(models.Model):
    """Record of each exercise attempt"""

    # Relations
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='exercise_attempts'
    )
    exercise = models.ForeignKey(
        Exercise,
        on_delete=models.CASCADE,
        related_name='attempts'
    )
    lesson_progress = models.ForeignKey(
        LessonProgress,
        on_delete=models.CASCADE,
        related_name='exercise_attempts',
        null=True,
        blank=True
    )

    # User answer
    user_answer = models.JSONField(help_text="Respuesta del usuario")
    is_correct = models.BooleanField()

    # Time tracking
    time_spent = models.IntegerField(
        help_text="Segundos que tomó responder",
        validators=[MinValueValidator(0)]
    )

    # XP earned
    xp_earned = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)]
    )

    # Metadata
    attempted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-attempted_at']
        verbose_name = 'Intento de Ejercicio'
        verbose_name_plural = 'Intentos de Ejercicios'
        indexes = [
            models.Index(fields=['user', 'attempted_at']),
            models.Index(fields=['exercise', 'is_correct']),
        ]

    def __str__(self):
        status = "✓" if self.is_correct else "✗"
        return f"{status} {self.user.username} - {self.exercise}"


class Badge(models.Model):
    """Unlockable badge/achievement"""

    # Categories
    CATEGORY_CHOICES = [
        ('beginner', 'Principiante'),
        ('progress', 'Progreso'),
        ('mastery', 'Maestría'),
        ('streak', 'Racha'),
        ('special', 'Especial'),
    ]

    # Identification
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.SlugField(unique=True, max_length=100)

    # Content
    name = models.CharField(max_length=100)
    description = models.TextField()
    icon = models.CharField(max_length=10, help_text="Emoji")

    # Configuration
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)

    # Unlock criteria (JSON for flexibility)
    unlock_criteria = models.JSONField(
        help_text="""
        Ejemplo: {
            "type": "lessons_completed",
            "target": 5
        }
        """
    )

    # Reward
    xp_reward = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)]
    )

    # Status
    is_active = models.BooleanField(default=True)

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Insignia'
        verbose_name_plural = 'Insignias'

    def __str__(self):
        return f"{self.icon} {self.name}"


class UserBadge(models.Model):
    """Badge unlocked by a user"""

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='badges'
    )
    badge = models.ForeignKey(
        Badge,
        on_delete=models.CASCADE,
        related_name='user_badges'
    )

    # When unlocked
    unlocked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'badge']
        ordering = ['-unlocked_at']
        verbose_name = 'Insignia de Usuario'
        verbose_name_plural = 'Insignias de Usuarios'

    def __str__(self):
        return f"{self.user.username} - {self.badge.name}"


class Achievement(models.Model):
    """Achievement with trackable progress"""

    # Metric types
    METRIC_CHOICES = [
        ('lessons_completed', 'Lecciones Completadas'),
        ('exercises_completed', 'Ejercicios Completados'),
        ('streak_days', 'Días de Racha'),
        ('perfect_lessons', 'Lecciones Perfectas (3 estrellas)'),
        ('total_xp', 'XP Total'),
    ]

    # Identification
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.SlugField(unique=True, max_length=100)

    # Content
    title = models.CharField(max_length=200)
    description = models.TextField()

    # Configuration
    target = models.IntegerField(
        help_text="Meta a alcanzar",
        validators=[MinValueValidator(1)]
    )
    metric_type = models.CharField(max_length=50, choices=METRIC_CHOICES)

    # Reward
    xp_reward = models.IntegerField(
        default=100,
        validators=[MinValueValidator(0)]
    )

    # Status
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'Logro'
        verbose_name_plural = 'Logros'

    def __str__(self):
        return self.title


class UserAchievement(models.Model):
    """User progress on an achievement"""

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='achievements'
    )
    achievement = models.ForeignKey(
        Achievement,
        on_delete=models.CASCADE,
        related_name='user_achievements'
    )

    # Progress
    current_progress = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)]
    )
    is_completed = models.BooleanField(default=False)

    # Timestamps
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['user', 'achievement']
        verbose_name = 'Logro de Usuario'
        verbose_name_plural = 'Logros de Usuarios'

    def __str__(self):
        progress = f"{self.current_progress}/{self.achievement.target}"
        return f"{self.user.username} - {self.achievement.title} ({progress})"

    @property
    def progress_percentage(self):
        """Calculate completion percentage"""
        if self.achievement.target == 0:
            return 0
        return round((self.current_progress / self.achievement.target) * 100, 2)
