from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from . import views

router = DefaultRouter()
router.register(r'themes', views.ThemeViewSet)
router.register(r'instruments', views.InstrumentViewSet)
router.register(r'versions', views.VersionViewSet)
router.register(r'sheet-music', views.SheetMusicViewSet)
router.register(r'version-files', views.VersionFileViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]