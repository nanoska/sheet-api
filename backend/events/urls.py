from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Crear un router y registrar nuestros viewsets
router = DefaultRouter()
router.register(r'locations', views.LocationViewSet, basename='location')
router.register(r'repertoires', views.RepertoireViewSet, basename='repertoire')
router.register(r'events', views.EventViewSet, basename='event')
router.register(r'jamdevientos', views.JamDeVientosViewSet, basename='jamdevientos')

# Las URLs de la API ahora se determinan automáticamente por el router
urlpatterns = [
    path('', include(router.urls)),
]
