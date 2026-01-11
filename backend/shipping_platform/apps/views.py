"""
API views for shipping platform
"""

import logging
import uuid
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.db.models import Q

from .models import Shipment, SavedAddress, SavedPackage
from .serializers import (
    ShipmentSerializer,
    ShipmentListSerializer,
    SavedAddressSerializer,
    SavedPackageSerializer,
    BulkUpdateSerializer,
    BulkDeleteSerializer,
    ShippingServiceSerializer,
    BulkServiceUpdateSerializer,
    PurchaseSerializer,
)
from .validators import parse_csv_file, validate_shipment_data
from .address_validator import validate_shipment_address
from .pricing import (
    calculate_shipping_price,
    get_available_services,
    get_most_affordable_service,
)

logger = logging.getLogger("shipping_platform")


class ShipmentViewSet(viewsets.ModelViewSet):
    """ViewSet for Shipment CRUD operations"""

    queryset = Shipment.objects.all()

    def get_serializer_class(self):
        if self.action == "list":
            return ShipmentListSerializer
        return ShipmentSerializer

    def get_queryset(self):
        queryset = Shipment.objects.all()

        # Filter by status if provided
        status_filter = self.request.query_params.get("status", None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        # Search functionality
        search = self.request.query_params.get("search", None)
        if search:
            queryset = queryset.filter(
                Q(order_no__icontains=search)
                | Q(ship_to_first_name__icontains=search)
                | Q(ship_to_last_name__icontains=search)
                | Q(ship_to_address__icontains=search)
                | Q(ship_to_city__icontains=search)
            )

        return queryset.order_by("-created_at")

    @action(detail=False, methods=["post"], parser_classes=[MultiPartParser, FormParser])
    def upload(self, request):
        """Upload and parse CSV file"""
        logger.info("CSV upload request received")

        if "file" not in request.FILES:
            return Response({"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)

        file = request.FILES["file"]

        try:
            # Read file content
            file_content = file.read()
            logger.info(f"File uploaded: {file.name}, size: {len(file_content)} bytes")

            # Parse CSV
            records = parse_csv_file(file_content)
            logger.info(f"Parsed {len(records)} records from CSV")

            # Get default address (first saved address marked as default, or first one)
            default_address_obj = SavedAddress.objects.filter(is_default=True).first()
            if not default_address_obj:
                default_address_obj = SavedAddress.objects.first()

            default_address = None
            if default_address_obj:
                default_address = {
                    "first_name": default_address_obj.first_name,
                    "last_name": default_address_obj.last_name,
                    "address": default_address_obj.address,
                    "address2": default_address_obj.address2,
                    "city": default_address_obj.city,
                    "state": default_address_obj.state,
                    "zip_code": default_address_obj.zip_code,
                    "phone": default_address_obj.phone,
                }

            # Validate and create shipments
            created_shipments = []
            errors = []

            with transaction.atomic():
                # Clear existing shipments (optional - could be configurable)
                # Shipment.objects.all().delete()

                for record in records:
                    try:
                        # Validate record
                        validated_record = validate_shipment_data(record, default_address)

                        # Create shipment
                        shipment = Shipment.objects.create(
                            ship_from_first_name=validated_record.get("ship_from_first_name", ""),
                            ship_from_last_name=validated_record.get("ship_from_last_name", ""),
                            ship_from_address=validated_record.get("ship_from_address", ""),
                            ship_from_address2=validated_record.get("ship_from_address2", ""),
                            ship_from_city=validated_record.get("ship_from_city", ""),
                            ship_from_state=validated_record.get("ship_from_state", ""),
                            ship_from_zip=validated_record.get("ship_from_zip", ""),
                            ship_from_phone=validated_record.get("ship_from_phone", ""),
                            ship_to_first_name=validated_record.get("ship_to_first_name", ""),
                            ship_to_last_name=validated_record.get("ship_to_last_name", ""),
                            ship_to_address=validated_record.get("ship_to_address", ""),
                            ship_to_address2=validated_record.get("ship_to_address2", ""),
                            ship_to_city=validated_record.get("ship_to_city", ""),
                            ship_to_state=validated_record.get("ship_to_state", ""),
                            ship_to_zip=validated_record.get("ship_to_zip", ""),
                            ship_to_phone=validated_record.get("ship_to_phone", ""),
                            weight_lbs=validated_record.get("weight_lbs"),
                            weight_oz=validated_record.get("weight_oz"),
                            length=validated_record.get("length"),
                            width=validated_record.get("width"),
                            height=validated_record.get("height"),
                            item_sku=validated_record.get("item_sku", ""),
                            order_no=validated_record.get("order_no", ""),
                            status=validated_record.get("status", "valid"),
                        )

                        # Validate addresses
                        try:
                            validation_results = validate_shipment_address(
                                {
                                    "ship_to_address": shipment.ship_to_address,
                                    "ship_to_address2": shipment.ship_to_address2,
                                    "ship_to_city": shipment.ship_to_city,
                                    "ship_to_state": shipment.ship_to_state,
                                    "ship_to_zip": shipment.ship_to_zip,
                                    "ship_from_address": shipment.ship_from_address,
                                    "ship_from_address2": shipment.ship_from_address2,
                                    "ship_from_city": shipment.ship_from_city,
                                    "ship_from_state": shipment.ship_from_state,
                                    "ship_from_zip": shipment.ship_from_zip,
                                }
                            )

                            if validation_results.get("ship_to"):
                                ship_to_result = validation_results["ship_to"]
                                shipment.address_validation_status = (
                                    "valid" if ship_to_result["valid"] else "invalid"
                                )
                                shipment.address_validation_source = ship_to_result.get(
                                    "source", ""
                                )
                                shipment.address_validation_message = ship_to_result.get(
                                    "message", ""
                                )
                        except Exception as e:
                            logger.warning(
                                f"Address validation failed for shipment {shipment.id}: {str(e)}"
                            )
                            shipment.address_validation_status = "pending"

                        # Calculate default shipping price
                        if shipment.weight_lbs or shipment.weight_oz:
                            default_service = get_most_affordable_service(
                                weight_lbs=shipment.weight_lbs,
                                weight_oz=shipment.weight_oz,
                                length=shipment.length,
                                width=shipment.width,
                                height=shipment.height,
                            )
                            shipment.shipping_service = default_service
                            shipment.calculated_price = calculate_shipping_price(
                                default_service,
                                weight_lbs=shipment.weight_lbs,
                                weight_oz=shipment.weight_oz,
                                length=shipment.length,
                                width=shipment.width,
                                height=shipment.height,
                            )

                        created_shipments.append(shipment.id)

                    except Exception as e:
                        logger.error(
                            f"Error creating shipment from row {record.get('row_number', 'unknown')}: {str(e)}"
                        )
                        errors.append(
                            {
                                "row": record.get("row_number", "unknown"),
                                "error": str(e),
                            }
                        )

            logger.info(f"Created {len(created_shipments)} shipments, {len(errors)} errors")

            return Response(
                {
                    "success": True,
                    "created": len(created_shipments),
                    "errors": len(errors),
                    "error_details": errors,
                    "shipment_ids": created_shipments,
                },
                status=status.HTTP_201_CREATED,
            )

        except Exception as e:
            logger.error(f"CSV upload failed: {str(e)}", exc_info=True)
            return Response(
                {"error": f"Failed to process CSV: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=False, methods=["post"])
    def bulk_update(self, request):
        """Bulk update Ship From address or Package details"""
        serializer = BulkUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        shipment_ids = serializer.validated_data["shipment_ids"]
        address_id = serializer.validated_data.get("address_id")
        package_id = serializer.validated_data.get("package_id")

        logger.info(f"Bulk update request: {len(shipment_ids)} shipments")

        shipments = Shipment.objects.filter(id__in=shipment_ids)
        updated_count = 0

        with transaction.atomic():
            if address_id:
                try:
                    address = SavedAddress.objects.get(id=address_id)
                    shipments.update(
                        ship_from_first_name=address.first_name,
                        ship_from_last_name=address.last_name,
                        ship_from_address=address.address,
                        ship_from_address2=address.address2,
                        ship_from_city=address.city,
                        ship_from_state=address.state,
                        ship_from_zip=address.zip_code,
                        ship_from_phone=address.phone,
                    )
                    updated_count += shipments.count()
                    logger.info(f"Updated {updated_count} shipments with address {address_id}")
                except SavedAddress.DoesNotExist:
                    return Response(
                        {"error": "Address not found"}, status=status.HTTP_404_NOT_FOUND
                    )

            if package_id:
                try:
                    package = SavedPackage.objects.get(id=package_id)
                    shipments.update(
                        weight_lbs=package.weight_lbs,
                        weight_oz=package.weight_oz,
                        length=package.length,
                        width=package.width,
                        height=package.height,
                    )
                    # Recalculate prices
                    for shipment in shipments:
                        if shipment.shipping_service:
                            shipment.calculated_price = calculate_shipping_price(
                                shipment.shipping_service,
                                weight_lbs=shipment.weight_lbs,
                                weight_oz=shipment.weight_oz,
                                length=shipment.length,
                                width=shipment.width,
                                height=shipment.height,
                            )
                            shipment.save()
                    updated_count += shipments.count()
                    logger.info(f"Updated {updated_count} shipments with package {package_id}")
                except SavedPackage.DoesNotExist:
                    return Response(
                        {"error": "Package not found"}, status=status.HTTP_404_NOT_FOUND
                    )

        return Response({"success": True, "updated": updated_count})

    @action(detail=False, methods=["post"])
    def bulk_delete(self, request):
        """Bulk delete shipments"""
        serializer = BulkDeleteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        shipment_ids = serializer.validated_data["shipment_ids"]
        logger.info(f"Bulk delete request: {len(shipment_ids)} shipments")

        deleted_count, _ = Shipment.objects.filter(id__in=shipment_ids).delete()

        return Response({"success": True, "deleted": deleted_count})

    @action(detail=False, methods=["post"])
    def validate_addresses(self, request):
        """Trigger address validation for shipments"""
        shipment_ids = request.data.get("shipment_ids", [])

        if not shipment_ids:
            # Validate all shipments
            shipments = Shipment.objects.all()
        else:
            shipments = Shipment.objects.filter(id__in=shipment_ids)

        logger.info(f"Address validation request: {shipments.count()} shipments")

        validated_count = 0

        for shipment in shipments:
            try:
                validation_results = validate_shipment_address(
                    {
                        "ship_to_address": shipment.ship_to_address,
                        "ship_to_address2": shipment.ship_to_address2,
                        "ship_to_city": shipment.ship_to_city,
                        "ship_to_state": shipment.ship_to_state,
                        "ship_to_zip": shipment.ship_to_zip,
                        "ship_from_address": shipment.ship_from_address,
                        "ship_from_address2": shipment.ship_from_address2,
                        "ship_from_city": shipment.ship_from_city,
                        "ship_from_state": shipment.ship_from_state,
                        "ship_from_zip": shipment.ship_from_zip,
                    }
                )

                if validation_results.get("ship_to"):
                    ship_to_result = validation_results["ship_to"]
                    shipment.address_validation_status = (
                        "valid" if ship_to_result["valid"] else "invalid"
                    )
                    shipment.address_validation_source = ship_to_result.get("source", "")
                    shipment.address_validation_message = ship_to_result.get("message", "")
                    shipment.save()
                    validated_count += 1
            except Exception as e:
                logger.warning(f"Address validation failed for shipment {shipment.id}: {str(e)}")

        return Response({"success": True, "validated": validated_count})


class SavedAddressViewSet(viewsets.ModelViewSet):
    """ViewSet for SavedAddress"""

    queryset = SavedAddress.objects.all()
    serializer_class = SavedAddressSerializer


class SavedPackageViewSet(viewsets.ModelViewSet):
    """ViewSet for SavedPackage"""

    queryset = SavedPackage.objects.all()
    serializer_class = SavedPackageSerializer


class ShippingServiceView(viewsets.ViewSet):
    """View for shipping services"""

    def list(self, request):
        """Get available shipping services with prices"""
        weight_lbs = request.query_params.get("weight_lbs", None)
        weight_oz = request.query_params.get("weight_oz", None)
        length = request.query_params.get("length", None)
        width = request.query_params.get("width", None)
        height = request.query_params.get("height", None)

        # Convert to appropriate types
        weight_lbs = int(weight_lbs) if weight_lbs else None
        weight_oz = int(weight_oz) if weight_oz else None

        from decimal import Decimal

        length = Decimal(length) if length else None
        width = Decimal(width) if width else None
        height = Decimal(height) if height else None

        services = get_available_services(
            weight_lbs=weight_lbs,
            weight_oz=weight_oz,
            length=length,
            width=width,
            height=height,
        )

        serializer = ShippingServiceSerializer(services, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["post"])
    def bulk_update_service(self, request):
        """Bulk update shipping service for selected shipments"""
        serializer = BulkServiceUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        shipment_ids = serializer.validated_data["shipment_ids"]
        service = serializer.validated_data["service"]

        logger.info(f"Bulk service update: {len(shipment_ids)} shipments to {service}")

        shipments = Shipment.objects.filter(id__in=shipment_ids)
        updated_count = 0

        with transaction.atomic():
            for shipment in shipments:
                if service == "most_affordable":
                    selected_service = get_most_affordable_service(
                        weight_lbs=shipment.weight_lbs,
                        weight_oz=shipment.weight_oz,
                        length=shipment.length,
                        width=shipment.width,
                        height=shipment.height,
                    )
                else:
                    selected_service = service

                shipment.shipping_service = selected_service
                shipment.calculated_price = calculate_shipping_price(
                    selected_service,
                    weight_lbs=shipment.weight_lbs,
                    weight_oz=shipment.weight_oz,
                    length=shipment.length,
                    width=shipment.width,
                    height=shipment.height,
                )
                shipment.save()
                updated_count += 1

        return Response({"success": True, "updated": updated_count})


class PurchaseView(viewsets.ViewSet):
    """View for purchase/checkout"""

    def create(self, request):
        """Process purchase/checkout"""
        serializer = PurchaseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        shipment_ids = serializer.validated_data["shipment_ids"]
        label_size = serializer.validated_data["label_size"]
        terms_accepted = serializer.validated_data["terms_accepted"]

        if not terms_accepted:
            return Response({"error": "Terms must be accepted"}, status=status.HTTP_400_BAD_REQUEST)

        logger.info(f"Purchase request: {len(shipment_ids)} shipments, label size: {label_size}")

        shipments = Shipment.objects.filter(id__in=shipment_ids)

        # Calculate grand total
        grand_total = sum(float(shipment.calculated_price or 0) for shipment in shipments)

        # In a real application, this would:
        # - Create order record
        # - Generate shipping labels
        # - Process payment
        # - Send confirmation

        logger.info(f"Purchase completed: ${grand_total:.2f} total")

        return Response(
            {
                "success": True,
                "order_id": str(uuid.uuid4()),
                "label_size": label_size,
                "shipment_count": shipments.count(),
                "grand_total": round(grand_total, 2),
                "message": "Labels created successfully",
            }
        )
