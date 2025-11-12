from django.apps import AppConfig


class MusicLearningConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'music_learning'

    def ready(self):
        """Import signals when app is ready"""
        import music_learning.signals
