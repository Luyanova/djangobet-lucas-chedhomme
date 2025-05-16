from django.contrib import admin
from django.urls import path, include # Added include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('core_api.urls')), # Added our app's URLs under the 'api/' namespace
] 