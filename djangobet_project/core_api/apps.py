from django.apps import AppConfig


class CoreApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'core_api'

    def ready(self):
        import core_api.models # Import your models to register signals
