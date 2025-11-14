"""
URL configuration for Jam de Vientos API.

Provides endpoints for jam-de-vientos frontend to access events,
repertoires, and sheet music files.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create router and register viewsets
router = DefaultRouter()
router.register(r'events', views.JDVViewSet, basename='jdv-events')

# URL patterns
urlpatterns = [
    path('', include(router.urls)),
]
