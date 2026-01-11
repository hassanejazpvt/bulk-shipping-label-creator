from rest_framework import serializers
from .models import Shipment, SavedAddress, SavedPackage


class SavedAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavedAddress
        fields = "__all__"


class SavedPackageSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavedPackage
        fields = "__all__"


class ShipmentSerializer(serializers.ModelSerializer):
    ship_from_formatted = serializers.CharField(source="get_ship_from_formatted", read_only=True)
    ship_to_formatted = serializers.CharField(source="get_ship_to_formatted", read_only=True)
    package_details_formatted = serializers.CharField(
        source="get_package_details_formatted", read_only=True
    )
    available_services = serializers.SerializerMethodField()

    def get_available_services(self, obj):
        """Calculate and return available shipping services for this shipment"""
        from .pricing import get_available_services

        return get_available_services(
            weight_lbs=obj.weight_lbs,
            weight_oz=obj.weight_oz,
            length=obj.length,
            width=obj.width,
            height=obj.height,
        )

    class Meta:
        model = Shipment
        fields = "__all__"
        read_only_fields = ("id", "created_at", "updated_at")


class ShipmentListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views"""

    ship_from_formatted = serializers.CharField(source="get_ship_from_formatted", read_only=True)
    ship_to_formatted = serializers.CharField(source="get_ship_to_formatted", read_only=True)
    package_details_formatted = serializers.CharField(
        source="get_package_details_formatted", read_only=True
    )
    available_services = serializers.SerializerMethodField()

    def get_available_services(self, obj):
        """Calculate and return available shipping services for this shipment"""
        from .pricing import get_available_services

        return get_available_services(
            weight_lbs=obj.weight_lbs,
            weight_oz=obj.weight_oz,
            length=obj.length,
            width=obj.width,
            height=obj.height,
        )

    class Meta:
        model = Shipment
        fields = "__all__"  # Includes all model fields + custom formatted fields
        read_only_fields = ("id", "created_at", "updated_at")


class BulkUpdateSerializer(serializers.Serializer):
    shipment_ids = serializers.ListField(child=serializers.UUIDField())
    address_id = serializers.UUIDField(required=False, allow_null=True)
    package_id = serializers.UUIDField(required=False, allow_null=True)


class BulkDeleteSerializer(serializers.Serializer):
    shipment_ids = serializers.ListField(child=serializers.UUIDField())


class ShippingServiceSerializer(serializers.Serializer):
    id = serializers.CharField()
    name = serializers.CharField()
    base_price = serializers.DecimalField(max_digits=10, decimal_places=2)
    per_oz_rate = serializers.DecimalField(max_digits=10, decimal_places=2)
    price = serializers.DecimalField(max_digits=10, decimal_places=2)


class BulkServiceUpdateSerializer(serializers.Serializer):
    shipment_ids = serializers.ListField(child=serializers.UUIDField())
    service = serializers.ChoiceField(
        choices=["priority_mail", "ground_shipping", "most_affordable"]
    )


class PurchaseSerializer(serializers.Serializer):
    shipment_ids = serializers.ListField(child=serializers.UUIDField())
    label_size = serializers.ChoiceField(choices=["letter_a4", "4x6"])
    terms_accepted = serializers.BooleanField()
