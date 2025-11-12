"""
URL Configuration for Music Learning App
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    LessonViewSet,
    UserProgressViewSet,
    BadgeViewSet,
    AchievementViewSet
)

# Create router and register viewsets
router = DefaultRouter()
router.register(r'lessons', LessonViewSet, basename='lesson')
router.register(r'badges', BadgeViewSet, basename='badge')
router.register(r'achievements', AchievementViewSet, basename='achievement')

# Custom routes for user progress (no model-based routing)
user_progress_list = UserProgressViewSet.as_view({
    'get': 'progress'
})

user_progress_lessons = UserProgressViewSet.as_view({
    'get': 'lessons'
})

user_stats = UserProgressViewSet.as_view({
    'get': 'stats'
})

user_streak_update = UserProgressViewSet.as_view({
    'post': 'update_streak'
})

urlpatterns = [
    # Router URLs
    path('', include(router.urls)),
    
    # User progress endpoints
    path('user/progress/', user_progress_list, name='user-progress'),
    path('user/progress/lessons/', user_progress_lessons, name='user-progress-lessons'),
    path('user/stats/', user_stats, name='user-stats'),
    path('user/streak/update/', user_streak_update, name='user-streak-update'),
]
