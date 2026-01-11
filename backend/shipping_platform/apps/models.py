from django.db import models
from django.core.validators import MinValueValidator
import uuid


class SavedAddress(models.Model):
    """Saved ship-from addresses for reuse"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100, blank=True)
    address = models.CharField(max_length=200)
    address2 = models.CharField(max_length=200, blank=True)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=2)  # US state abbreviation
    zip_code = models.CharField(max_length=10)
    phone = models.CharField(max_length=20, blank=True)
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Saved Addresses"
        ordering = ["-is_default", "name"]

    def __str__(self):
        return f"{self.name} - {self.city}, {self.state}"


class SavedPackage(models.Model):
    """Saved package presets for reuse"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    length = models.DecimalField(max_digits=6, decimal_places=2, validators=[MinValueValidator(0)])
    width = models.DecimalField(max_digits=6, decimal_places=2, validators=[MinValueValidator(0)])
    height = models.DecimalField(max_digits=6, decimal_places=2, validators=[MinValueValidator(0)])
    weight_lbs = models.IntegerField(validators=[MinValueValidator(0)], default=0)
    weight_oz = models.IntegerField(validators=[MinValueValidator(0)], default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Saved Packages"
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} - {self.length}x{self.width}x{self.height} in, {self.weight_lbs}lb {self.weight_oz}oz"


class Shipment(models.Model):
    """Individual shipment record"""

    STATUS_CHOICES = [
        ("valid", "Valid"),
        ("warning", "Warning"),
        ("error", "Error"),
        ("default_applied", "Default Applied"),
    ]

    SHIPPING_SERVICE_CHOICES = [
        ("priority_mail", "Priority Mail"),
        ("ground_shipping", "Ground Shipping"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Ship From Address
    ship_from_first_name = models.CharField(max_length=100, blank=True)
    ship_from_last_name = models.CharField(max_length=100, blank=True)
    ship_from_address = models.CharField(max_length=200, blank=True)
    ship_from_address2 = models.CharField(max_length=200, blank=True)
    ship_from_city = models.CharField(max_length=100, blank=True)
    ship_from_state = models.CharField(max_length=2, blank=True)
    ship_from_zip = models.CharField(max_length=10, blank=True)
    ship_from_phone = models.CharField(max_length=20, blank=True)

    # Ship To Address
    ship_to_first_name = models.CharField(max_length=100)
    ship_to_last_name = models.CharField(max_length=100, blank=True)
    ship_to_address = models.CharField(max_length=200)
    ship_to_address2 = models.CharField(max_length=200, blank=True)
    ship_to_city = models.CharField(max_length=100)
    ship_to_state = models.CharField(max_length=2)
    ship_to_zip = models.CharField(max_length=10)
    ship_to_phone = models.CharField(max_length=20, blank=True)

    # Package Details
    weight_lbs = models.IntegerField(
        validators=[MinValueValidator(0)], default=0, null=True, blank=True
    )
    weight_oz = models.IntegerField(
        validators=[MinValueValidator(0)], default=0, null=True, blank=True
    )
    length = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        null=True,
        blank=True,
    )
    width = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        null=True,
        blank=True,
    )
    height = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        null=True,
        blank=True,
    )
    item_sku = models.CharField(max_length=100, blank=True)

    # Reference
    order_no = models.CharField(max_length=100, blank=True)

    # Status and Validation
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="valid")
    address_validation_status = models.CharField(
        max_length=50, blank=True
    )  # 'valid', 'invalid', 'pending'
    address_validation_source = models.CharField(
        max_length=50, blank=True
    )  # 'usps', 'google', etc.
    address_validation_message = models.TextField(blank=True)

    # Shipping
    shipping_service = models.CharField(max_length=50, choices=SHIPPING_SERVICE_CHOICES, blank=True)
    calculated_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["order_no"]),
        ]

    def __str__(self):
        return f"Shipment {self.order_no or self.id} - {self.ship_to_city}, {self.ship_to_state}"

    def get_ship_from_formatted(self):
        """Format ship from address for display"""
        parts = []
        if self.ship_from_first_name or self.ship_from_last_name:
            parts.append(f"{self.ship_from_first_name} {self.ship_from_last_name}".strip())
        if self.ship_from_address:
            parts.append(self.ship_from_address)
        if self.ship_from_address2:
            parts.append(self.ship_from_address2)
        if self.ship_from_city and self.ship_from_state:
            parts.append(
                f"{self.ship_from_city}, {self.ship_from_state} {self.ship_from_zip}".strip()
            )
        return ", ".join(parts) if parts else "Not set"

    def get_ship_to_formatted(self):
        """Format ship to address for display"""
        parts = []
        if self.ship_to_first_name or self.ship_to_last_name:
            parts.append(f"{self.ship_to_first_name} {self.ship_to_last_name}".strip())
        if self.ship_to_address:
            parts.append(self.ship_to_address)
        if self.ship_to_address2:
            parts.append(self.ship_to_address2)
        if self.ship_to_city and self.ship_to_state:
            parts.append(f"{self.ship_to_city}, {self.ship_to_state} {self.ship_to_zip}".strip())
        return ", ".join(parts)

    def get_package_details_formatted(self):
        """Format package details for display"""
        parts = []
        if self.length and self.width and self.height:
            parts.append(f"{self.length}×{self.width}×{self.height} in")
        if self.weight_lbs or self.weight_oz:
            weight_str = ""
            if self.weight_lbs:
                weight_str += f"{self.weight_lbs} lb"
            if self.weight_oz:
                if weight_str:
                    weight_str += " "
                weight_str += f"{self.weight_oz} oz"
            parts.append(weight_str)
        return " | ".join(parts) if parts else "Not set"
