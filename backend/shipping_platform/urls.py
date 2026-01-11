"""
URL configuration for shipping_platform project.
"""

from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("shipping_platform.apps.urls")),
]
