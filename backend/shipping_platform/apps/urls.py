"""
URL configuration for shipping platform API
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ShipmentViewSet,
    SavedAddressViewSet,
    SavedPackageViewSet,
    ShippingServiceView,
    PurchaseView,
)

router = DefaultRouter()
router.register(r"shipments", ShipmentViewSet, basename="shipment")
router.register(r"saved-addresses", SavedAddressViewSet, basename="saved-address")
router.register(r"saved-packages", SavedPackageViewSet, basename="saved-package")
router.register(r"shipping-services", ShippingServiceView, basename="shipping-service")
router.register(r"purchase", PurchaseView, basename="purchase")

urlpatterns = [
    path("", include(router.urls)),
]
