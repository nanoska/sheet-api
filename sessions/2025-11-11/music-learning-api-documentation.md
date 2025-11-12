# Music Learning API - Documentación Completa para Frontend

**Fecha**: 2025-11-11  
**Backend**: sheet-api Django REST API  
**Frontend**: music-learning-app (React Mobile)  
**Base URL**: `http://localhost:8000/api/v1/` (desarrollo)

---

## 📋 Resumen

Backend completo implementado en `sheet-api/backend/music_learning/` con sistema de gamificación tipo Duolingo para aprendizaje musical.

### Características Implementadas

- ✅ 9 modelos Django con relaciones completas
- ✅ Sistema de XP y niveles (100 XP por nivel)
- ✅ Sistema de estrellas (90%=3★, 70%=2★, 50%=1★)
- ✅ Tracking de rachas diarias
- ✅ Desbloqueo de lecciones por prerequisitos
- ✅ Badges y achievements automáticos
- ✅ 9 endpoints REST documentados

---

## 🔌 Endpoints Disponibles

### **Base URL**: `/api/v1/`

| Endpoint | Método | Descripción | Auth Requerida |
|----------|--------|-------------|----------------|
| `/lessons/` | GET | Listar todas las lecciones | No |
| `/lessons/{id}/` | GET | Detalle de lección con ejercicios | No |
| `/lessons/{id}/complete/` | POST | Completar lección con resultados | Sí |
| `/user/progress/` | GET | Progreso general del usuario | Sí |
| `/user/progress/lessons/` | GET | Progreso en todas las lecciones | Sí |
| `/user/stats/` | GET | Estadísticas detalladas | Sí |
| `/user/streak/update/` | POST | Actualizar racha diaria | Sí |
| `/badges/` | GET | Listar todos los badges | No |
| `/achievements/` | GET | Listar todos los achievements | No |

---

## 📖 Documentación Detallada por Endpoint

### 1. GET `/api/v1/lessons/`

**Descripción**: Obtiene lista de todas las lecciones publicadas con información de progreso del usuario.

**Request**:
```bash
GET http://localhost:8000/api/v1/lessons/
Authorization: Bearer {token}  # Opcional
```

**Response** (200 OK):
```json
{
  "count": 6,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": "uuid-1",
      "slug": "notas-musicales-basicas",
      "title": "Notas Musicales Básicas",
      "description": "Aprende las 7 notas musicales fundamentales",
      "icon": "🎵",
      "color": "#1CB0F6",
      "category": "notes",
      "difficulty": "beginner",
      "estimated_time": 5,
      "xp_reward": 50,
      "prerequisites": [],
      "exercises_count": 4,
      "is_unlocked": true,
      "user_progress": {
        "is_completed": false,
        "stars": 0,
        "best_score": 0,
        "attempts": 0
      },
      "order": 1
    }
  ]
}
```

**Campos importantes**:
- `is_unlocked`: Indica si el usuario puede acceder a esta lección
- `user_progress`: `null` si usuario no autenticado, objeto con progreso si autenticado
- `prerequisites`: Array de UUIDs de lecciones que deben completarse primero

---

### 2. GET `/api/v1/lessons/{id}/`

**Descripción**: Obtiene detalle completo de una lección incluyendo todos sus ejercicios.

**Request**:
```bash
GET http://localhost:8000/api/v1/lessons/uuid-1/
```

**Response** (200 OK):
```json
{
  "id": "uuid-1",
  "slug": "notas-musicales-basicas",
  "title": "Notas Musicales Básicas",
  "description": "Aprende las 7 notas musicales fundamentales",
  "icon": "🎵",
  "color": "#1CB0F6",
  "category": "notes",
  "difficulty": "beginner",
  "estimated_time": 5,
  "xp_reward": 50,
  "prerequisites": [],
  "exercises_count": 4,
  "is_unlocked": true,
  "user_progress": null,
  "order": 1,
  "exercises": [
    {
      "id": "exercise-uuid-1",
      "type": "note-recognition",
      "question": "¿Cuál es la primera nota de la escala musical?",
      "options": ["Do", "Re", "Mi", "Sol"],
      "hint": "Es la nota base de la escala de Do mayor",
      "difficulty": "easy",
      "xp_reward": 10,
      "order": 0
    }
  ]
}
```

**IMPORTANTE**: El campo `correct_answer` NO se envía al frontend por seguridad.

---

### 3. POST `/api/v1/lessons/{id}/complete/`

**Descripción**: Completa una lección enviando los resultados de todos los ejercicios.

**Request**:
```bash
POST http://localhost:8000/api/v1/lessons/uuid-1/complete/
Authorization: Bearer {token}
Content-Type: application/json

{
  "exercise_results": [
    {
      "exercise_id": "exercise-uuid-1",
      "user_answer": "Do",
      "is_correct": true,
      "time_spent": 5
    },
    {
      "exercise_id": "exercise-uuid-2",
      "user_answer": "7",
      "is_correct": true,
      "time_spent": 8
    }
  ]
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "stars": 3,
  "score": 100,
  "xp_earned": 75,
  "new_level": 6,
  "level_up": true,
  "unlocked_lessons": ["uuid-2"],
  "unlocked_badges": [
    {
      "id": "badge-uuid",
      "code": "first-lesson",
      "name": "Primer Paso",
      "icon": "🎵",
      "description": "Completa tu primera lección",
      "category": "beginner"
    }
  ]
}
```

**Lógica del servidor**:
1. Valida todos los exercise_results
2. Crea registros de ExerciseAttempt
3. Calcula score y estrellas
4. Actualiza LessonProgress
5. Otorga XP y actualiza nivel
6. Actualiza estadísticas de UserProfile
7. Actualiza racha automáticamente
8. Desbloquea lecciones siguientes (si aplica)
9. Verifica y desbloquea badges/achievements
10. Retorna resumen completo

---

### 4. GET `/api/v1/user/progress/`

**Descripción**: Obtiene progreso general y estadísticas del usuario.

**Request**:
```bash
GET http://localhost:8000/api/v1/user/progress/
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "username": "usuario123",
  "level": 5,
  "current_xp": 45,
  "total_xp": 445,
  "current_streak": 7,
  "longest_streak": 12,
  "last_practice_date": "2025-11-11",
  "total_lessons_completed": 8,
  "total_exercises_completed": 42,
  "total_practice_time": 180,
  "accuracy": 87.5,
  "correct_answers": 35,
  "total_answers": 40,
  "sound_enabled": true,
  "music_enabled": true,
  "vibration_enabled": true,
  "badges_count": 3,
  "achievements_completed": 2
}
```

---

### 5. GET `/api/v1/user/progress/lessons/`

**Descripción**: Obtiene progreso detallado en cada lección del usuario.

**Request**:
```bash
GET http://localhost:8000/api/v1/user/progress/lessons/
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
[
  {
    "lesson_id": "uuid-1",
    "lesson_title": "Notas Musicales Básicas",
    "lesson_slug": "notas-musicales-basicas",
    "is_completed": true,
    "is_unlocked": true,
    "stars": 3,
    "best_score": 100,
    "attempts": 2,
    "first_attempted_at": "2025-11-10T10:30:00Z",
    "completed_at": "2025-11-10T15:30:00Z",
    "last_attempted_at": "2025-11-11T09:15:00Z"
  }
]
```

---

### 6. GET `/api/v1/user/stats/`

**Descripción**: Estadísticas detalladas por categoría y actividad reciente.

**Request**:
```bash
GET http://localhost:8000/api/v1/user/stats/
Authorization: Bearer {token}
```

**Response** (200 OK):
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
    },
    "chords": {
      "lessons_completed": 0,
      "accuracy": 0
    }
  },
  "recent_activity": [
    {
      "date": "2025-11-11",
      "exercises_completed": 5,
      "xp_earned": 50
    },
    {
      "date": "2025-11-10",
      "exercises_completed": 8,
      "xp_earned": 80
    }
  ]
}
```

---

### 7. POST `/api/v1/user/streak/update/`

**Descripción**: Actualiza manualmente la racha del usuario (opcional, se actualiza automáticamente al completar lecciones).

**Request**:
```bash
POST http://localhost:8000/api/v1/user/streak/update/
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "current_streak": 8,
  "streak_updated": true,
  "message": "¡Increíble! Llevas 8 días consecutivos"
}
```

---

### 8. GET `/api/v1/badges/`

**Descripción**: Lista todos los badges disponibles con estado de desbloqueo.

**Request**:
```bash
GET http://localhost:8000/api/v1/badges/
Authorization: Bearer {token}  # Opcional
```

**Response** (200 OK):
```json
{
  "count": 5,
  "results": [
    {
      "id": "badge-uuid-1",
      "code": "first-lesson",
      "name": "Primer Paso",
      "description": "Completa tu primera lección",
      "icon": "🎵",
      "category": "beginner",
      "xp_reward": 25,
      "is_unlocked": true,
      "unlocked_at": "2025-11-01T10:00:00Z"
    },
    {
      "id": "badge-uuid-2",
      "code": "perfectionist",
      "name": "Perfeccionista",
      "description": "Obtén 3 estrellas en una lección",
      "icon": "⭐",
      "category": "mastery",
      "xp_reward": 50,
      "is_unlocked": false,
      "unlocked_at": null
    }
  ]
}
```

---

### 9. GET `/api/v1/achievements/`

**Descripción**: Lista todos los achievements con progreso del usuario.

**Request**:
```bash
GET http://localhost:8000/api/v1/achievements/
Authorization: Bearer {token}  # Opcional
```

**Response** (200 OK):
```json
{
  "count": 5,
  "results": [
    {
      "id": "achievement-uuid-1",
      "code": "complete-5-lessons",
      "title": "Estudiante Dedicado",
      "description": "Completa 5 lecciones",
      "target": 5,
      "metric_type": "lessons_completed",
      "xp_reward": 100,
      "current_progress": 3,
      "progress_percentage": 60.0,
      "is_completed": false,
      "completed_at": null
    }
  ]
}
```

---

## 🔐 Autenticación

### Configuración Actual

- **Modo Demo**: Endpoints con `permission_classes = [AllowAny]`
- **Modo Producción**: Configurar JWT con `djangorestframework-simplejwt`

### Para JWT (Opcional)

```bash
POST /api/v1/auth/login/
{
  "username": "usuario",
  "password": "contraseña"
}

Response:
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

Usar en headers:
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

---

## 📊 Tipos de Datos (TypeScript)

### Interfaces Recomendadas

```typescript
// Lesson
interface Lesson {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  category: 'notes' | 'rhythm' | 'theory' | 'chords' | 'intervals';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimated_time: number;
  xp_reward: number;
  prerequisites: string[];
  exercises_count: number;
  is_unlocked: boolean;
  user_progress: UserProgress | null;
  order: number;
}

// Exercise
interface Exercise {
  id: string;
  type: 'note-recognition' | 'rhythm' | 'chord' | 'interval' | 'theory';
  question: string;
  options: string[];
  hint: string;
  difficulty: 'easy' | 'medium' | 'hard';
  xp_reward: number;
  order: number;
}

// UserProgress
interface UserProgress {
  is_completed: boolean;
  stars: number;
  best_score: number;
  attempts: number;
}

// UserProfile
interface UserProfile {
  username: string;
  level: number;
  current_xp: number;
  total_xp: number;
  current_streak: number;
  longest_streak: number;
  last_practice_date: string;
  total_lessons_completed: number;
  total_exercises_completed: number;
  total_practice_time: number;
  accuracy: number;
  correct_answers: number;
  total_answers: number;
  sound_enabled: boolean;
  music_enabled: boolean;
  vibration_enabled: boolean;
  badges_count: number;
  achievements_completed: number;
}

// LessonCompleteRequest
interface LessonCompleteRequest {
  exercise_results: Array<{
    exercise_id: string;
    user_answer: string | number;
    is_correct: boolean;
    time_spent: number;
  }>;
}

// LessonCompleteResponse
interface LessonCompleteResponse {
  success: boolean;
  stars: number;
  score: number;
  xp_earned: number;
  new_level: number;
  level_up: boolean;
  unlocked_lessons: string[];
  unlocked_badges: Badge[];
}

// Badge
interface Badge {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  category: 'beginner' | 'progress' | 'mastery' | 'streak' | 'special';
  xp_reward: number;
  is_unlocked: boolean;
  unlocked_at: string | null;
}

// Achievement
interface Achievement {
  id: string;
  code: string;
  title: string;
  description: string;
  target: number;
  metric_type: 'lessons_completed' | 'exercises_completed' | 'streak_days' | 'perfect_lessons' | 'total_xp';
  xp_reward: number;
  current_progress: number;
  progress_percentage: number;
  is_completed: boolean;
  completed_at: string | null;
}
```

---

## 🛠️ Ejemplo de Integración (React)

### Configuración de API Client

```typescript
// src/services/api.ts
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### Fetch Lessons

```typescript
// src/services/lessonService.ts
import api from './api';
import { Lesson, LessonDetail } from '../types';

export const lessonService = {
  async getLessons(): Promise<Lesson[]> {
    const response = await api.get('/lessons/');
    return response.data.results;
  },

  async getLessonDetail(id: string): Promise<LessonDetail> {
    const response = await api.get(`/lessons/${id}/`);
    return response.data;
  },

  async completeLesson(id: string, results: any) {
    const response = await api.post(`/lessons/${id}/complete/`, results);
    return response.data;
  },
};
```

### Complete Lesson Flow

```typescript
// En tu componente de lección
const completeLesson = async () => {
  const results = {
    exercise_results: exercises.map((ex, idx) => ({
      exercise_id: ex.id,
      user_answer: userAnswers[idx],
      is_correct: userAnswers[idx] === correctAnswers[idx],
      time_spent: timings[idx],
    })),
  };

  try {
    const response = await lessonService.completeLesson(lessonId, results);
    
    if (response.level_up) {
      showLevelUpAnimation(response.new_level);
    }
    
    if (response.unlocked_badges.length > 0) {
      showBadgesModal(response.unlocked_badges);
    }
    
    if (response.unlocked_lessons.length > 0) {
      showUnlockedLessonsModal(response.unlocked_lessons);
    }
    
    showResultsScreen({
      stars: response.stars,
      score: response.score,
      xp: response.xp_earned,
    });
  } catch (error) {
    console.error('Error completing lesson:', error);
  }
};
```

---

## 🧪 Testing de API

### Comando para iniciar servidor

```bash
cd /home/nano/nahue/satori/porfolio/portfolio-apps/music-projects/sheet-api/backend
python3 manage.py runserver
```

### Testing con curl

```bash
# Listar lecciones
curl http://localhost:8000/api/v1/lessons/

# Detalle de lección
curl http://localhost:8000/api/v1/lessons/{uuid}/

# Completar lección (requiere token)
curl -X POST http://localhost:8000/api/v1/lessons/{uuid}/complete/ \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "exercise_results": [
      {
        "exercise_id": "uuid",
        "user_answer": "Do",
        "is_correct": true,
        "time_spent": 5
      }
    ]
  }'

# Ver progreso de usuario
curl http://localhost:8000/api/v1/user/progress/ \
  -H "Authorization: Bearer {token}"
```

---

## 📝 Notas Importantes

### Lógica de Gamificación

1. **XP y Niveles**: 100 XP = 1 nivel. Fórmula: `level = (total_xp // 100) + 1`
2. **Estrellas**: 
   - 3★ = 90%+ de precisión
   - 2★ = 70-89% de precisión
   - 1★ = 50-69% de precisión
   - 0★ = <50% de precisión
3. **Rachas**: Se actualiza automáticamente al completar lecciones. Días consecutivos.
4. **Desbloqueo**: Las lecciones se desbloquean cuando TODAS sus prerequisitos están completados.

### Datos de Seed

Ejecutar para poblar base de datos:
```bash
python3 manage.py seed_music_learning
```

Crea:
- 6 lecciones (notas, ritmo, acordes, intervalos, teoría, lectura)
- 7 ejercicios
- 5 badges
- 5 achievements

### Django Admin

Acceder a: `http://localhost:8000/admin/`
- User: admin
- Pass: admin123 (si se creó con seed)

---

## 🚀 Próximos Pasos para Frontend

1. **Configurar variables de entorno**:
   ```env
   REACT_APP_API_URL=http://localhost:8000/api/v1
   ```

2. **Instalar axios** (si no está):
   ```bash
   npm install axios
   ```

3. **Crear servicios de API** siguiendo ejemplos anteriores

4. **Migrar de mock data a API real**:
   - Reemplazar `mockLessons` con `lessonService.getLessons()`
   - Reemplazar lógica de completar local con `lessonService.completeLesson()`

5. **Implementar manejo de autenticación**:
   - Login/Register (opcional si quieren modo demo)
   - Guardar tokens en localStorage
   - Interceptores de axios

6. **UI para nuevas features**:
   - Modal de badges desbloqueados
   - Animación de level up
   - Lista de lecciones desbloqueadas

---

**Documentación generada**: 2025-11-11  
**Backend Status**: ✅ Completamente implementado y testeado  
**Compatibilidad**: 100% con frontend /app existente
