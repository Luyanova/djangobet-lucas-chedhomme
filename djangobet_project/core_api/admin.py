from django.contrib import admin
from .models import Lizard, Race, Bet # Import your models

# Register your models here so they appear in the Django admin interface.
admin.site.register(Lizard)
admin.site.register(Race)
admin.site.register(Bet)
