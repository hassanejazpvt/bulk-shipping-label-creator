from django.contrib import admin

from .models import SavedAddress, SavedPackage, Shipment


@admin.register(SavedAddress)
class SavedAddressAdmin(admin.ModelAdmin):
    list_display = ["name", "city", "state", "is_default", "created_at"]
    list_filter = ["is_default", "state"]
    search_fields = ["name", "city", "address"]


@admin.register(SavedPackage)
class SavedPackageAdmin(admin.ModelAdmin):
    list_display = ["name", "length", "width", "height", "weight_lbs", "weight_oz"]
    search_fields = ["name"]


@admin.register(Shipment)
class ShipmentAdmin(admin.ModelAdmin):
    list_display = [
        "order_no",
        "ship_to_city",
        "ship_to_state",
        "status",
        "shipping_service",
        "calculated_price",
        "created_at",
    ]
    list_filter = ["status", "shipping_service", "address_validation_status"]
    search_fields = [
        "order_no",
        "ship_to_first_name",
        "ship_to_last_name",
        "ship_to_city",
    ]
    readonly_fields = ["id", "created_at", "updated_at"]
