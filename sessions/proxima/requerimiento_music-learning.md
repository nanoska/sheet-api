# Requerimientos Backend para Music Learning App - Sistema RPG Gamificado

**Fecha**: 2025-11-11
**Proyecto**: MusicLearn - Integración Backend Django con Frontend Gaming
**Objetivo**: Implementar API REST completa para soportar sistema de aprendizaje musical gamificado tipo Duolingo

---

## 📋 Resumen Ejecutivo

El frontend de MusicLearn tiene una aplicación mobile-first gamificada (`/app`) que actualmente usa datos mock. Se requiere implementar el backend completo en Django para:

1. **Gestión de Lecciones y Ejercicios** - CRUD completo de contenido educativo
2. **Sistema RPG de Gamificación** - Niveles, XP, rachas, badges, achievements
3. **Tracking de Progreso** - Seguimiento detallado por usuario
4. **Estadísticas y Analytics** - Precisión, tiempo de práctica, rendimiento

---

## 🎯 Stack Tecnológico Requerido

- **Framework**: Django 4.2+ con Django REST Framework
- **Base de Datos**: PostgreSQL
- **Autenticación**: JWT (SimpleJWT) - Opcional para modo demo
- **Cache**: Redis (para rachas y rankings)
- **Serialización**: DRF con validación completa
- **Documentación**: drf-spectacular (OpenAPI/Swagger)

---

## 🗄️ Modelos de Base de Datos Requeridos

### 1. Modelo: `Lesson` (Lección)

**Propósito**: Representa una lección de música con sus metadatos y configuración.

```python
class Lesson(models.Model):
    """Lección de música con ejercicios asociados"""

    # Identificación
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    slug = models.SlugField(unique=True)  # ej: "notas-basicas"

    # Contenido
    title = models.CharField(max_length=200)
    description = models.TextField()
    icon = models.CharField(max_length=10)  # Emoji o código de ícono

    # Configuración visual
    color = models.CharField(max_length=7)  # HEX color (#1CB0F6)

    # Categorización
    category = models.CharField(
        max_length=50,
        choices=[
            ('notes', 'Notas'),
            ('rhythm', 'Ritmo'),
            ('theory', 'Teoría'),
            ('chords', 'Acordes'),
            ('intervals', 'Intervalos'),
        ]
    )

    difficulty = models.CharField(
        max_length=20,
        choices=[
            ('beginner', 'Principiante'),
            ('intermediate', 'Intermedio'),
            ('advanced', 'Avanzado'),
        ]
    )

    # Gamificación
    estimated_time = models.IntegerField(help_text="Tiempo estimado en minutos")
    xp_reward = models.IntegerField(default=50, help_text="XP base por completar")

    # Prerequisitos
    prerequisites = models.ManyToManyField(
        'self',
        symmetrical=False,
        blank=True,
        related_name='unlocks'
    )

    # Orden
    order = models.IntegerField(default=0, help_text="Orden en el path de aprendizaje")

    # Estado
    is_active = models.BooleanField(default=True)
    is_published = models.BooleanField(default=False)

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        'auth.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='lessons_created'
    )

    class Meta:
        ordering = ['order', 'created_at']
        verbose_name = 'Lección'
        verbose_name_plural = 'Lecciones'

    def __str__(self):
        return f"{self.title} ({self.get_difficulty_display()})"
```

---

### 2. Modelo: `Exercise` (Ejercicio)

**Propósito**: Ejercicio individual dentro de una lección con pregunta y respuestas.

```python
class Exercise(models.Model):
    """Ejercicio de práctica musical"""

    # Relación
    lesson = models.ForeignKey(
        Lesson,
        on_delete=models.CASCADE,
        related_name='exercises'
    )

    # Identificación
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Tipo de ejercicio
    type = models.CharField(
        max_length=50,
        choices=[
            ('note-recognition', 'Reconocimiento de Notas'),
            ('rhythm', 'Ritmo'),
            ('chord', 'Acordes'),
            ('interval', 'Intervalos'),
            ('theory', 'Teoría Musical'),
        ]
    )

    # Contenido
    question = models.TextField(help_text="Pregunta del ejercicio")
    hint = models.TextField(blank=True, help_text="Pista opcional")

    # Opciones (JSON para flexibilidad)
    options = models.JSONField(
        help_text="Array de opciones: ['Do', 'Re', 'Mi', 'Fa']"
    )

    # Respuesta correcta
    correct_answer = models.JSONField(
        help_text="Respuesta correcta (string o array para múltiples)"
    )

    # Configuración
    difficulty = models.CharField(
        max_length=20,
        choices=[
            ('easy', 'Fácil'),
            ('medium', 'Medio'),
            ('hard', 'Difícil'),
        ]
    )

    xp_reward = models.IntegerField(default=10, help_text="XP por respuesta correcta")

    # Orden
    order = models.IntegerField(default=0)

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['lesson', 'order']
        verbose_name = 'Ejercicio'
        verbose_name_plural = 'Ejercicios'

    def __str__(self):
        return f"{self.lesson.title} - Ejercicio {self.order + 1}"
```

---

### 3. Modelo: `UserProfile` (Perfil de Usuario)

**Propósito**: Extensión del modelo User para datos de gamificación.

```python
class UserProfile(models.Model):
    """Perfil extendido con datos de gamificación"""

    user = models.OneToOneField(
        'auth.User',
        on_delete=models.CASCADE,
        related_name='music_profile'
    )

    # Sistema de Niveles y XP
    level = models.IntegerField(default=1)
    current_xp = models.IntegerField(default=0, help_text="XP en el nivel actual")
    total_xp = models.IntegerField(default=0, help_text="XP acumulado total")

    # Sistema de Rachas (Streaks)
    current_streak = models.IntegerField(default=0, help_text="Días consecutivos")
    longest_streak = models.IntegerField(default=0, help_text="Mejor racha")
    last_practice_date = models.DateField(null=True, blank=True)

    # Estadísticas Generales
    total_lessons_completed = models.IntegerField(default=0)
    total_exercises_completed = models.IntegerField(default=0)
    total_practice_time = models.IntegerField(default=0, help_text="Minutos totales")

    # Precisión
    correct_answers = models.IntegerField(default=0)
    total_answers = models.IntegerField(default=0)

    # Configuración
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
        """Calcula el porcentaje de precisión"""
        if self.total_answers == 0:
            return 0
        return round((self.correct_answers / self.total_answers) * 100, 2)

    def add_xp(self, amount):
        """Agrega XP y sube de nivel si es necesario"""
        XP_PER_LEVEL = 100
        self.total_xp += amount
        self.current_xp += amount

        # Level up
        while self.current_xp >= XP_PER_LEVEL:
            self.level += 1
            self.current_xp -= XP_PER_LEVEL

        self.save()

    def update_streak(self):
        """Actualiza la racha basada en la fecha de práctica"""
        from datetime import date, timedelta

        today = date.today()

        if not self.last_practice_date:
            # Primera práctica
            self.current_streak = 1
            self.last_practice_date = today
        elif self.last_practice_date == today:
            # Ya practicó hoy, no hace nada
            pass
        elif self.last_practice_date == today - timedelta(days=1):
            # Día consecutivo
            self.current_streak += 1
            self.last_practice_date = today

            # Actualizar mejor racha
            if self.current_streak > self.longest_streak:
                self.longest_streak = self.current_streak
        else:
            # Racha rota
            self.current_streak = 1
            self.last_practice_date = today

        self.save()
```

---

### 4. Modelo: `LessonProgress` (Progreso de Lección)

**Propósito**: Tracking del progreso de cada usuario en cada lección.

```python
class LessonProgress(models.Model):
    """Progreso del usuario en una lección específica"""

    # Relaciones
    user = models.ForeignKey(
        'auth.User',
        on_delete=models.CASCADE,
        related_name='lesson_progress'
    )
    lesson = models.ForeignKey(
        Lesson,
        on_delete=models.CASCADE,
        related_name='user_progress'
    )

    # Estado
    is_completed = models.BooleanField(default=False)
    is_unlocked = models.BooleanField(default=False)

    # Métricas
    stars = models.IntegerField(default=0, help_text="0-3 estrellas")
    best_score = models.IntegerField(default=0, help_text="Mejor puntaje obtenido")
    attempts = models.IntegerField(default=0)

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

    def __str__(self):
        return f"{self.user.username} - {self.lesson.title}"

    def calculate_stars(self, correct_count, total_count):
        """Calcula estrellas basado en precisión"""
        accuracy = (correct_count / total_count) * 100

        if accuracy >= 90:
            return 3
        elif accuracy >= 70:
            return 2
        elif accuracy >= 50:
            return 1
        else:
            return 0
```

---

### 5. Modelo: `ExerciseAttempt` (Intento de Ejercicio)

**Propósito**: Registro detallado de cada intento de ejercicio por usuario.

```python
class ExerciseAttempt(models.Model):
    """Registro de cada intento de ejercicio"""

    # Relaciones
    user = models.ForeignKey(
        'auth.User',
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
        null=True
    )

    # Respuesta del usuario
    user_answer = models.JSONField(help_text="Respuesta del usuario")
    is_correct = models.BooleanField()

    # Tiempo
    time_spent = models.IntegerField(help_text="Segundos que tomó responder")

    # XP ganado
    xp_earned = models.IntegerField(default=0)

    # Metadata
    attempted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-attempted_at']
        verbose_name = 'Intento de Ejercicio'
        verbose_name_plural = 'Intentos de Ejercicios'

    def __str__(self):
        status = "✓" if self.is_correct else "✗"
        return f"{status} {self.user.username} - {self.exercise}"
```

---

### 6. Modelo: `Badge` (Insignia)

**Propósito**: Insignias/badges desbloqueables por logros.

```python
class Badge(models.Model):
    """Insignia desbloqueable"""

    # Identificación
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.SlugField(unique=True)  # ej: "first-lesson"

    # Contenido
    name = models.CharField(max_length=100)
    description = models.TextField()
    icon = models.CharField(max_length=10)  # Emoji

    # Configuración
    category = models.CharField(
        max_length=50,
        choices=[
            ('beginner', 'Principiante'),
            ('progress', 'Progreso'),
            ('mastery', 'Maestría'),
            ('streak', 'Racha'),
            ('special', 'Especial'),
        ]
    )

    # Criterios de desbloqueo
    unlock_criteria = models.JSONField(
        help_text="""
        Ejemplo: {
            "type": "lessons_completed",
            "target": 5
        }
        """
    )

    # Recompensa
    xp_reward = models.IntegerField(default=0)

    # Estado
    is_active = models.BooleanField(default=True)

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Insignia'
        verbose_name_plural = 'Insignias'

    def __str__(self):
        return f"{self.icon} {self.name}"
```

---

### 7. Modelo: `UserBadge` (Insignia de Usuario)

**Propósito**: Relación entre usuarios y badges desbloqueados.

```python
class UserBadge(models.Model):
    """Badge desbloqueado por un usuario"""

    user = models.ForeignKey(
        'auth.User',
        on_delete=models.CASCADE,
        related_name='badges'
    )
    badge = models.ForeignKey(
        Badge,
        on_delete=models.CASCADE,
        related_name='user_badges'
    )

    # Cuando se desbloqueó
    unlocked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'badge']
        ordering = ['-unlocked_at']
        verbose_name = 'Insignia de Usuario'
        verbose_name_plural = 'Insignias de Usuarios'

    def __str__(self):
        return f"{self.user.username} - {self.badge.name}"
```

---

### 8. Modelo: `Achievement` (Logro)

**Propósito**: Sistema de achievements con progreso trackeable.

```python
class Achievement(models.Model):
    """Logro con progreso trackeable"""

    # Identificación
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.SlugField(unique=True)

    # Contenido
    title = models.CharField(max_length=200)
    description = models.TextField()

    # Configuración
    target = models.IntegerField(help_text="Meta a alcanzar")
    metric_type = models.CharField(
        max_length=50,
        choices=[
            ('lessons_completed', 'Lecciones Completadas'),
            ('exercises_completed', 'Ejercicios Completados'),
            ('streak_days', 'Días de Racha'),
            ('perfect_lessons', 'Lecciones Perfectas (3 estrellas)'),
            ('total_xp', 'XP Total'),
        ]
    )

    # Recompensa
    xp_reward = models.IntegerField(default=100)

    # Estado
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'Logro'
        verbose_name_plural = 'Logros'

    def __str__(self):
        return self.title
```

---

### 9. Modelo: `UserAchievement` (Logro de Usuario)

**Propósito**: Progreso del usuario en cada achievement.

```python
class UserAchievement(models.Model):
    """Progreso del usuario en un logro"""

    user = models.ForeignKey(
        'auth.User',
        on_delete=models.CASCADE,
        related_name='achievements'
    )
    achievement = models.ForeignKey(
        Achievement,
        on_delete=models.CASCADE,
        related_name='user_achievements'
    )

    # Progreso
    current_progress = models.IntegerField(default=0)
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
        """Porcentaje de completado"""
        return round((self.current_progress / self.achievement.target) * 100, 2)
```

---

## 🔌 Endpoints de API Requeridos

### **Base URL**: `/api/v1/`

### 1. **Lecciones** - `/lessons/`

#### GET `/lessons/` - Listar todas las lecciones
**Respuesta**:
```json
[
  {
    "id": "uuid",
    "slug": "notas-musicales-basicas",
    "title": "Notas Musicales Básicas",
    "description": "Aprende las 7 notas musicales",
    "icon": "🎵",
    "color": "#1CB0F6",
    "category": "notes",
    "difficulty": "beginner",
    "estimated_time": 5,
    "xp_reward": 50,
    "prerequisites": [],
    "exercises_count": 5,
    "is_unlocked": true,
    "user_progress": {
      "is_completed": false,
      "stars": 0,
      "best_score": 0
    }
  }
]
```

#### GET `/lessons/{id}/` - Detalle de lección con ejercicios
**Respuesta**:
```json
{
  "id": "uuid",
  "title": "Notas Musicales Básicas",
  "description": "...",
  "exercises": [
    {
      "id": "uuid",
      "type": "note-recognition",
      "question": "¿Cuál es la primera nota?",
      "options": ["Do", "Re", "Mi", "Fa"],
      "hint": "Es la nota inicial",
      "difficulty": "easy",
      "xp_reward": 10,
      "order": 0
    }
  ]
}
```

---

### 2. **Progreso de Usuario** - `/user/progress/`

#### GET `/user/progress/` - Progreso general del usuario
**Respuesta**:
```json
{
  "level": 5,
  "current_xp": 45,
  "total_xp": 445,
  "current_streak": 7,
  "longest_streak": 12,
  "total_lessons_completed": 8,
  "total_exercises_completed": 42,
  "accuracy": 87.5,
  "badges_count": 3,
  "achievements_completed": 2
}
```

#### GET `/user/progress/lessons/` - Progreso en lecciones
**Respuesta**:
```json
[
  {
    "lesson_id": "uuid",
    "lesson_title": "Notas Básicas",
    "is_completed": true,
    "stars": 3,
    "best_score": 100,
    "attempts": 2,
    "completed_at": "2025-11-10T15:30:00Z"
  }
]
```

---

### 3. **Completar Lección** - `/lessons/{id}/complete/`

#### POST `/lessons/{id}/complete/` - Completar una lección
**Request**:
```json
{
  "exercise_results": [
    {
      "exercise_id": "uuid",
      "user_answer": "Do",
      "is_correct": true,
      "time_spent": 5
    }
  ]
}
```

**Respuesta**:
```json
{
  "success": true,
  "stars": 3,
  "score": 100,
  "xp_earned": 75,
  "new_level": 6,
  "level_up": true,
  "unlocked_lessons": ["uuid2"],
  "unlocked_badges": [
    {
      "id": "uuid",
      "name": "Perfeccionista",
      "icon": "⭐"
    }
  ]
}
```

---

### 4. **Badges** - `/badges/`

#### GET `/badges/` - Listar todos los badges
**Respuesta**:
```json
[
  {
    "id": "uuid",
    "code": "first-lesson",
    "name": "Primer Paso",
    "description": "Completa tu primera lección",
    "icon": "🎵",
    "category": "beginner",
    "is_unlocked": true,
    "unlocked_at": "2025-11-01T10:00:00Z"
  }
]
```

---

### 5. **Achievements** - `/achievements/`

#### GET `/achievements/` - Listar logros con progreso
**Respuesta**:
```json
[
  {
    "id": "uuid",
    "title": "Estudiante Dedicado",
    "description": "Completa 5 lecciones",
    "target": 5,
    "current_progress": 3,
    "progress_percentage": 60,
    "is_completed": false,
    "xp_reward": 100
  }
]
```

---

### 6. **Estadísticas** - `/user/stats/`

#### GET `/user/stats/` - Estadísticas detalladas
**Respuesta**:
```json
{
  "overview": {
    "level": 5,
    "total_xp": 445,
    "streak": 7,
    "accuracy": 87.5
  },
  "by_category": {
    "notes": {
      "lessons_completed": 2,
      "accuracy": 90.0
    },
    "rhythm": {
      "lessons_completed": 1,
      "accuracy": 85.0
    }
  },
  "recent_activity": [
    {
      "date": "2025-11-11",
      "exercises_completed": 5,
      "xp_earned": 50
    }
  ]
}
```

---

### 7. **Racha (Streak)** - `/user/streak/`

#### POST `/user/streak/update/` - Actualizar racha diaria
**Respuesta**:
```json
{
  "current_streak": 8,
  "streak_updated": true,
  "message": "¡Increíble! Llevas 8 días consecutivos"
}
```

---

### 8. **Leaderboard** - `/leaderboard/`

#### GET `/leaderboard/` - Ranking de usuarios
**Query Params**: `?period=weekly|monthly|all_time`

**Respuesta**:
```json
{
  "period": "weekly",
  "users": [
    {
      "rank": 1,
      "username": "musicfan",
      "level": 12,
      "xp": 1250,
      "streak": 15
    }
  ],
  "current_user_rank": 5
}
```

---

## 🎮 Lógica de Gamificación RPG

### Sistema de Niveles

```python
# Fórmula XP por nivel
XP_PER_LEVEL = 100  # Base

def get_xp_for_level(level):
    """XP necesario para alcanzar un nivel"""
    return level * XP_PER_LEVEL

def calculate_level_from_xp(total_xp):
    """Calcula nivel basado en XP total"""
    return (total_xp // XP_PER_LEVEL) + 1
```

### Sistema de Estrellas

```python
def calculate_stars(correct_count, total_count):
    """
    3 estrellas: >= 90% de precisión
    2 estrellas: >= 70% de precisión
    1 estrella: >= 50% de precisión
    0 estrellas: < 50% de precisión
    """
    accuracy = (correct_count / total_count) * 100

    if accuracy >= 90:
        return 3
    elif accuracy >= 70:
        return 2
    elif accuracy >= 50:
        return 1
    else:
        return 0
```

### Sistema de Rachas (Streaks)

```python
from datetime import date, timedelta

def update_streak(user_profile):
    """
    Actualiza la racha del usuario:
    - Mismo día: no hace nada
    - Día consecutivo: +1 racha
    - Día salteado: reset a 1
    """
    today = date.today()
    last_practice = user_profile.last_practice_date

    if not last_practice:
        user_profile.current_streak = 1
    elif last_practice == today:
        pass  # Ya practicó hoy
    elif last_practice == today - timedelta(days=1):
        user_profile.current_streak += 1
        if user_profile.current_streak > user_profile.longest_streak:
            user_profile.longest_streak = user_profile.current_streak
    else:
        user_profile.current_streak = 1

    user_profile.last_practice_date = today
    user_profile.save()
```

### Desbloqueo de Lecciones

```python
def unlock_next_lessons(user, completed_lesson):
    """
    Desbloquea lecciones que tenían como prerequisito
    la lección recién completada
    """
    next_lessons = Lesson.objects.filter(
        prerequisites=completed_lesson,
        is_published=True
    )

    for lesson in next_lessons:
        # Verificar que todas las prerequisitos estén completados
        all_prerequisites_met = all(
            LessonProgress.objects.filter(
                user=user,
                lesson=prereq,
                is_completed=True
            ).exists()
            for prereq in lesson.prerequisites.all()
        )

        if all_prerequisites_met:
            LessonProgress.objects.get_or_create(
                user=user,
                lesson=lesson,
                defaults={'is_unlocked': True}
            )
```

### Chequeo de Achievements

```python
def check_achievements(user):
    """
    Verifica y desbloquea achievements basados en métricas
    """
    profile = user.music_profile
    achievements = Achievement.objects.filter(is_active=True)

    unlocked = []

    for achievement in achievements:
        user_achievement, created = UserAchievement.objects.get_or_create(
            user=user,
            achievement=achievement
        )

        if user_achievement.is_completed:
            continue

        # Obtener métrica actual
        if achievement.metric_type == 'lessons_completed':
            current = profile.total_lessons_completed
        elif achievement.metric_type == 'streak_days':
            current = profile.current_streak
        elif achievement.metric_type == 'total_xp':
            current = profile.total_xp
        # ... más métricas

        user_achievement.current_progress = current

        # Verificar si se completó
        if current >= achievement.target and not user_achievement.is_completed:
            user_achievement.is_completed = True
            user_achievement.completed_at = timezone.now()
            profile.add_xp(achievement.xp_reward)
            unlocked.append(achievement)

        user_achievement.save()

    return unlocked
```

---

## 📊 Serializers Requeridos (DRF)

### LessonSerializer

```python
from rest_framework import serializers

class ExerciseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exercise
        fields = [
            'id', 'type', 'question', 'options',
            'hint', 'difficulty', 'xp_reward', 'order'
        ]
        # Excluir correct_answer para no enviarlo al frontend

class LessonListSerializer(serializers.ModelSerializer):
    exercises_count = serializers.IntegerField(
        source='exercises.count',
        read_only=True
    )
    is_unlocked = serializers.SerializerMethodField()
    user_progress = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = [
            'id', 'slug', 'title', 'description', 'icon',
            'color', 'category', 'difficulty', 'estimated_time',
            'xp_reward', 'prerequisites', 'exercises_count',
            'is_unlocked', 'user_progress'
        ]

    def get_is_unlocked(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return obj.prerequisites.count() == 0

        progress = LessonProgress.objects.filter(
            user=request.user,
            lesson=obj
        ).first()

        return progress.is_unlocked if progress else False

    def get_user_progress(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None

        progress = LessonProgress.objects.filter(
            user=request.user,
            lesson=obj
        ).first()

        if not progress:
            return None

        return {
            'is_completed': progress.is_completed,
            'stars': progress.stars,
            'best_score': progress.best_score
        }

class LessonDetailSerializer(LessonListSerializer):
    exercises = ExerciseSerializer(many=True, read_only=True)

    class Meta(LessonListSerializer.Meta):
        fields = LessonListSerializer.Meta.fields + ['exercises']
```

---

## 🔐 Permisos y Autenticación

### Estrategia de Autenticación

**Opción 1: Modo Demo (Sin Auth)**
- Usar UUID anónimo guardado en localStorage
- Crear perfil temporal vinculado a session
- Permitir "guardar progreso" con registro posterior

**Opción 2: JWT Full**
- SimpleJWT para tokens
- Refresh tokens
- Login/Register endpoints

**Recomendación**: Implementar ambas con flag de configuración

```python
# settings.py
MUSIC_LEARNING_SETTINGS = {
    'ALLOW_ANONYMOUS': True,  # Permitir modo demo
    'XP_PER_LEVEL': 100,
    'STREAK_REQUIRED_HOURS': 24,
}
```

---

## 🧪 Datos de Seed (Fixtures)

Crear comando para popular base de datos:

```bash
python manage.py seed_music_learning
```

**Debe crear**:
- 6 lecciones base (las del mock actual)
- 20 ejercicios distribuidos
- 5 badges iniciales
- 5 achievements

---

## 📈 Métricas y Analytics

### Dashboard Admin

Implementar en Django Admin:
- Total de usuarios activos
- Promedio de XP por usuario
- Lección más completada
- Tasa de abandono por lección
- Distribución de niveles

### Queries Optimizadas

```python
# Usar select_related y prefetch_related
lessons = Lesson.objects.prefetch_related(
    'exercises',
    'prerequisites'
).select_related('created_by')

# Agregar índices
class Meta:
    indexes = [
        models.Index(fields=['user', 'lesson']),
        models.Index(fields=['is_completed', 'updated_at']),
    ]
```

---

## 🚀 Priorización de Implementación

### Fase 1 (MVP) - **Alta Prioridad**
1. ✅ Modelos: Lesson, Exercise, UserProfile, LessonProgress
2. ✅ Endpoints: GET lessons, GET lesson detail, POST complete
3. ✅ Sistema de XP y niveles
4. ✅ Progreso básico

### Fase 2 (Gamificación) - **Media Prioridad**
5. ✅ Badges y Achievements
6. ✅ Sistema de rachas
7. ✅ Estadísticas detalladas

### Fase 3 (Social) - **Baja Prioridad**
8. ⏳ Leaderboards
9. ⏳ Compartir logros
10. ⏳ Competencias entre usuarios

---

## 📝 Notas Adicionales

### Cache con Redis

```python
from django.core.cache import cache

def get_user_leaderboard(period='weekly'):
    cache_key = f'leaderboard:{period}'
    data = cache.get(cache_key)

    if not data:
        # Calcular leaderboard
        data = calculate_leaderboard(period)
        cache.set(cache_key, data, timeout=300)  # 5 minutos

    return data
```

### Signals para Auto-Updates

```python
from django.db.models.signals import post_save

@receiver(post_save, sender=LessonProgress)
def check_achievements_on_lesson_complete(sender, instance, **kwargs):
    if instance.is_completed:
        check_achievements(instance.user)
        unlock_next_lessons(instance.user, instance.lesson)
```

### Tests Requeridos

- Unit tests para modelos
- Tests de endpoints
- Tests de lógica de gamificación
- Tests de permisos

---

## 🎯 Resultado Esperado

Al implementar estos requerimientos, el frontend de MusicLearn podrá:

1. ✅ Consumir lecciones y ejercicios dinámicos desde Django
2. ✅ Guardar progreso real en base de datos
3. ✅ Sincronizar XP, niveles y rachas
4. ✅ Desbloquear badges y achievements
5. ✅ Mostrar estadísticas reales del usuario
6. ✅ Soportar modo demo sin autenticación

**Compatibilidad**: 100% compatible con el frontend actual en `/app`

---

**Documento creado**: 2025-11-11
**Versión**: 1.0
**Autor**: Sistema MusicLearn
**Próximo paso**: Implementar modelos y endpoints en Django
