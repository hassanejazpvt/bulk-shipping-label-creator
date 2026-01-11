"""
Shipping price calculation
"""

from decimal import Decimal
from typing import Optional
import logging

logger = logging.getLogger("shipping_platform")


# Shipping service configurations
SHIPPING_SERVICES = {
    "priority_mail": {
        "name": "Priority Mail",
        "base_price": Decimal("5.00"),
        "per_oz_rate": Decimal("0.10"),
        "min_price": Decimal("4.00"),
        "max_price": Decimal("8.00"),
    },
    "ground_shipping": {
        "name": "Ground Shipping",
        "base_price": Decimal("2.50"),
        "per_oz_rate": Decimal("0.05"),
        "min_price": Decimal("2.00"),
        "max_price": Decimal("5.00"),
    },
}


def calculate_shipping_price(
    service: str,
    weight_lbs: Optional[int] = None,
    weight_oz: Optional[int] = None,
    length: Optional[Decimal] = None,
    width: Optional[Decimal] = None,
    height: Optional[Decimal] = None,
) -> Decimal:
    """
    Calculate shipping price based on service and package details
    Formula: Base price + (total_weight_oz × per_oz_rate)
    """
    if service not in SHIPPING_SERVICES:
        logger.warning(f"Unknown shipping service: {service}")
        return Decimal("0.00")

    config = SHIPPING_SERVICES[service]

    # Calculate total weight in ounces
    total_oz = 0
    if weight_lbs:
        total_oz += weight_lbs * 16
    if weight_oz:
        total_oz += weight_oz

    # Default to 1 oz if no weight provided
    if total_oz == 0:
        total_oz = 1

    # Calculate price: base + (oz × rate)
    price = config["base_price"] + (Decimal(total_oz) * config["per_oz_rate"])

    # Apply min/max constraints
    price = max(price, config["min_price"])
    price = min(price, config["max_price"])

    # Round to 2 decimal places
    price = price.quantize(Decimal("0.01"))

    logger.debug(f"Calculated price for {service}: ${price} (weight: {total_oz} oz)")

    return price


def get_available_services(
    weight_lbs: Optional[int] = None,
    weight_oz: Optional[int] = None,
    length: Optional[Decimal] = None,
    width: Optional[Decimal] = None,
    height: Optional[Decimal] = None,
) -> list:
    """
    Get all available shipping services with calculated prices
    """
    services = []

    for service_id, config in SHIPPING_SERVICES.items():
        price = calculate_shipping_price(
            service_id,
            weight_lbs=weight_lbs,
            weight_oz=weight_oz,
            length=length,
            width=width,
            height=height,
        )

        services.append(
            {
                "id": service_id,
                "name": config["name"],
                "base_price": float(config["base_price"]),
                "per_oz_rate": float(config["per_oz_rate"]),
                "price": float(price),
            }
        )

    # Sort by price (most affordable first)
    services.sort(key=lambda x: x["price"])

    return services


def get_most_affordable_service(
    weight_lbs: Optional[int] = None,
    weight_oz: Optional[int] = None,
    length: Optional[Decimal] = None,
    width: Optional[Decimal] = None,
    height: Optional[Decimal] = None,
) -> str:
    """
    Get the most affordable shipping service ID
    """
    services = get_available_services(
        weight_lbs=weight_lbs,
        weight_oz=weight_oz,
        length=length,
        width=width,
        height=height,
    )

    if services:
        return services[0]["id"]

    return "ground_shipping"  # Default fallback
