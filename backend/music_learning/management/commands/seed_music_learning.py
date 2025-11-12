"""
Management command to seed the database with initial Music Learning data
Usage: python manage.py seed_music_learning
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from music_learning.models import Lesson, Exercise, Badge, Achievement


class Command(BaseCommand):
    help = 'Seeds the database with initial music learning data'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS('Starting Music Learning seed...'))
        
        # Create admin user if doesn't exist
        admin_user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@musiclearn.com',
                'is_staff': True,
                'is_superuser': True
            }
        )
        if created:
            admin_user.set_password('admin123')
            admin_user.save()
            self.stdout.write(self.style.SUCCESS('✓ Created admin user'))
        
        # Create Lessons
        self.stdout.write('Creating lessons...')
        
        lesson1 = Lesson.objects.get_or_create(
            slug='notas-musicales-basicas',
            defaults={
                'title': 'Notas Musicales Básicas',
                'description': 'Aprende las 7 notas musicales fundamentales',
                'icon': '🎵',
                'color': '#1CB0F6',
                'category': 'notes',
                'difficulty': 'beginner',
                'estimated_time': 5,
                'xp_reward': 50,
                'order': 1,
                'is_active': True,
                'is_published': True,
                'created_by': admin_user
            }
        )[0]
        
        lesson2 = Lesson.objects.get_or_create(
            slug='ritmo-y-compas',
            defaults={
                'title': 'Ritmo y Compás',
                'description': 'Domina los conceptos básicos del ritmo musical',
                'icon': '🥁',
                'color': '#58CC02',
                'category': 'rhythm',
                'difficulty': 'beginner',
                'estimated_time': 7,
                'xp_reward': 50,
                'order': 2,
                'is_active': True,
                'is_published': True,
                'created_by': admin_user
            }
        )[0]
        
        lesson3 = Lesson.objects.get_or_create(
            slug='acordes-mayores',
            defaults={
                'title': 'Acordes Mayores',
                'description': 'Aprende a identificar y formar acordes mayores',
                'icon': '🎹',
                'color': '#FF9600',
                'category': 'chords',
                'difficulty': 'intermediate',
                'estimated_time': 10,
                'xp_reward': 75,
                'order': 3,
                'is_active': True,
                'is_published': True,
                'created_by': admin_user
            }
        )[0]
        
        lesson4 = Lesson.objects.get_or_create(
            slug='intervalos-musicales',
            defaults={
                'title': 'Intervalos Musicales',
                'description': 'Comprende las distancias entre notas',
                'icon': '📏',
                'color': '#CE82FF',
                'category': 'intervals',
                'difficulty': 'intermediate',
                'estimated_time': 12,
                'xp_reward': 75,
                'order': 4,
                'is_active': True,
                'is_published': True,
                'created_by': admin_user
            }
        )[0]
        
        lesson5 = Lesson.objects.get_or_create(
            slug='teoria-musical-1',
            defaults={
                'title': 'Teoría Musical I',
                'description': 'Fundamentos de teoría musical',
                'icon': '📚',
                'color': '#00CD9C',
                'category': 'theory',
                'difficulty': 'intermediate',
                'estimated_time': 15,
                'xp_reward': 100,
                'order': 5,
                'is_active': True,
                'is_published': True,
                'created_by': admin_user
            }
        )[0]
        
        lesson6 = Lesson.objects.get_or_create(
            slug='lectura-primera-vista',
            defaults={
                'title': 'Lectura a Primera Vista',
                'description': 'Desarrolla tu habilidad de lectura musical',
                'icon': '👁️',
                'color': '#FF4B4B',
                'category': 'notes',
                'difficulty': 'advanced',
                'estimated_time': 20,
                'xp_reward': 150,
                'order': 6,
                'is_active': True,
                'is_published': True,
                'created_by': admin_user
            }
        )[0]
        
        # Add prerequisites
        lesson2.prerequisites.add(lesson1)
        lesson3.prerequisites.add(lesson1, lesson2)
        lesson4.prerequisites.add(lesson3)
        lesson5.prerequisites.add(lesson3)
        lesson6.prerequisites.add(lesson4, lesson5)
        
        self.stdout.write(self.style.SUCCESS('✓ Created 6 lessons'))
        
        # Create Exercises for Lesson 1
        self.stdout.write('Creating exercises...')
        
        exercises_lesson1 = [
            {
                'type': 'note-recognition',
                'question': '¿Cuál es la primera nota de la escala musical?',
                'options': ['Do', 'Re', 'Mi', 'Sol'],
                'correct_answer': 'Do',
                'hint': 'Es la nota base de la escala de Do mayor',
                'difficulty': 'easy',
                'xp_reward': 10,
                'order': 0
            },
            {
                'type': 'note-recognition',
                'question': '¿Cuántas notas tiene la escala musical básica?',
                'options': ['5', '7', '8', '12'],
                'correct_answer': '7',
                'hint': 'Cuenta desde Do hasta Si',
                'difficulty': 'easy',
                'xp_reward': 10,
                'order': 1
            },
            {
                'type': 'note-recognition',
                'question': '¿Qué nota viene después de Sol?',
                'options': ['La', 'Si', 'Fa', 'Mi'],
                'correct_answer': 'La',
                'hint': 'Sigue la secuencia: Do, Re, Mi, Fa, Sol, ...',
                'difficulty': 'easy',
                'xp_reward': 10,
                'order': 2
            },
            {
                'type': 'note-recognition',
                'question': '¿Qué nota está entre Mi y Sol?',
                'options': ['Fa', 'Re', 'La', 'Si'],
                'correct_answer': 'Fa',
                'hint': 'Revisa la secuencia completa de notas',
                'difficulty': 'medium',
                'xp_reward': 15,
                'order': 3
            },
        ]
        
        for ex_data in exercises_lesson1:
            Exercise.objects.get_or_create(
                lesson=lesson1,
                order=ex_data['order'],
                defaults=ex_data
            )
        
        # Create exercises for other lessons (simplified)
        exercises_lesson2 = [
            {
                'type': 'rhythm',
                'question': '¿Cuántos tiempos tiene un compás de 4/4?',
                'options': ['2', '3', '4', '6'],
                'correct_answer': '4',
                'hint': 'El número superior indica los tiempos',
                'difficulty': 'easy',
                'xp_reward': 10,
                'order': 0
            },
            {
                'type': 'rhythm',
                'question': '¿Qué figura musical dura 4 tiempos?',
                'options': ['Redonda', 'Blanca', 'Negra', 'Corchea'],
                'correct_answer': 'Redonda',
                'hint': 'Es la figura más larga',
                'difficulty': 'medium',
                'xp_reward': 15,
                'order': 1
            },
        ]
        
        for ex_data in exercises_lesson2:
            Exercise.objects.get_or_create(
                lesson=lesson2,
                order=ex_data['order'],
                defaults=ex_data
            )
        
        exercises_lesson3 = [
            {
                'type': 'chord',
                'question': '¿Cuántas notas forman un acorde básico?',
                'options': ['2', '3', '4', '5'],
                'correct_answer': '3',
                'hint': 'Tónica, tercera y quinta',
                'difficulty': 'easy',
                'xp_reward': 10,
                'order': 0
            },
        ]
        
        for ex_data in exercises_lesson3:
            Exercise.objects.get_or_create(
                lesson=lesson3,
                order=ex_data['order'],
                defaults=ex_data
            )
        
        self.stdout.write(self.style.SUCCESS('✓ Created exercises'))
        
        # Create Badges
        self.stdout.write('Creating badges...')
        
        Badge.objects.get_or_create(
            code='first-lesson',
            defaults={
                'name': 'Primer Paso',
                'description': 'Completa tu primera lección',
                'icon': '🎵',
                'category': 'beginner',
                'unlock_criteria': {'type': 'lessons_completed', 'target': 1},
                'xp_reward': 25,
                'is_active': True
            }
        )
        
        Badge.objects.get_or_create(
            code='perfectionist',
            defaults={
                'name': 'Perfeccionista',
                'description': 'Obtén 3 estrellas en una lección',
                'icon': '⭐',
                'category': 'mastery',
                'unlock_criteria': {'type': 'perfect_lessons', 'target': 1},
                'xp_reward': 50,
                'is_active': True
            }
        )
        
        Badge.objects.get_or_create(
            code='dedicated-student',
            defaults={
                'name': 'Estudiante Dedicado',
                'description': 'Completa 5 lecciones',
                'icon': '📚',
                'category': 'progress',
                'unlock_criteria': {'type': 'lessons_completed', 'target': 5},
                'xp_reward': 100,
                'is_active': True
            }
        )
        
        Badge.objects.get_or_create(
            code='fire-streak',
            defaults={
                'name': 'Racha de Fuego',
                'description': 'Practica 7 días consecutivos',
                'icon': '🔥',
                'category': 'streak',
                'unlock_criteria': {'type': 'streak_days', 'target': 7},
                'xp_reward': 75,
                'is_active': True
            }
        )
        
        Badge.objects.get_or_create(
            code='music-master',
            defaults={
                'name': 'Maestro Musical',
                'description': 'Alcanza 1000 puntos de XP',
                'icon': '🏆',
                'category': 'special',
                'unlock_criteria': {'type': 'total_xp', 'target': 1000},
                'xp_reward': 200,
                'is_active': True
            }
        )
        
        self.stdout.write(self.style.SUCCESS('✓ Created 5 badges'))
        
        # Create Achievements
        self.stdout.write('Creating achievements...')
        
        Achievement.objects.get_or_create(
            code='complete-5-lessons',
            defaults={
                'title': 'Estudiante Dedicado',
                'description': 'Completa 5 lecciones',
                'target': 5,
                'metric_type': 'lessons_completed',
                'xp_reward': 100,
                'is_active': True
            }
        )
        
        Achievement.objects.get_or_create(
            code='complete-50-exercises',
            defaults={
                'title': 'Practicante Incansable',
                'description': 'Completa 50 ejercicios',
                'target': 50,
                'metric_type': 'exercises_completed',
                'xp_reward': 150,
                'is_active': True
            }
        )
        
        Achievement.objects.get_or_create(
            code='streak-30-days',
            defaults={
                'title': 'Compromiso Total',
                'description': 'Mantén una racha de 30 días',
                'target': 30,
                'metric_type': 'streak_days',
                'xp_reward': 300,
                'is_active': True
            }
        )
        
        Achievement.objects.get_or_create(
            code='perfect-10-lessons',
            defaults={
                'title': 'Maestría Perfecta',
                'description': 'Obtén 3 estrellas en 10 lecciones',
                'target': 10,
                'metric_type': 'perfect_lessons',
                'xp_reward': 250,
                'is_active': True
            }
        )
        
        Achievement.objects.get_or_create(
            code='total-xp-2000',
            defaults={
                'title': 'Camino al Virtuoso',
                'description': 'Acumula 2000 puntos de experiencia',
                'target': 2000,
                'metric_type': 'total_xp',
                'xp_reward': 500,
                'is_active': True
            }
        )
        
        self.stdout.write(self.style.SUCCESS('✓ Created 5 achievements'))
        
        self.stdout.write(self.style.SUCCESS('\n✅ Music Learning seed completed successfully!'))
        self.stdout.write(self.style.SUCCESS('   - 6 lessons created'))
        self.stdout.write(self.style.SUCCESS('   - 7 exercises created'))
        self.stdout.write(self.style.SUCCESS('   - 5 badges created'))
        self.stdout.write(self.style.SUCCESS('   - 5 achievements created'))
