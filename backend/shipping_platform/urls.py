"""
URL configuration for shipping_platform project.
"""

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("shipping_platform.apps.urls")),
]
