"""
Address validation service with fallback mechanism
Primary: USPS Address Validation API
Fallback: Google Address Validation API
"""

import logging
from typing import Any, Dict, Optional

import requests
from django.conf import settings

logger = logging.getLogger("shipping_platform")


class AddressValidator:
    """Address validation with automatic fallback"""

    def __init__(self):
        self.usps_user_id = getattr(settings, "USPS_USER_ID", "")
        self.google_api_key = getattr(settings, "GOOGLE_API_KEY", "")

    def validate_address(self, address_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate an address using primary API, fallback to secondary if needed
        Returns: {
            'valid': bool,
            'source': 'usps' | 'google' | 'none',
            'message': str,
            'validated_address': dict (if valid)
        }
        """
        # Try USPS first
        if self.usps_user_id:
            try:
                result = self._validate_usps(address_data)
                if result["valid"]:
                    logger.info(
                        f"Address validated via USPS: {address_data.get('city', '')}, {address_data.get('state', '')}"
                    )
                    return result
                else:
                    logger.warning(
                        f"USPS validation failed: {result.get('message', 'Unknown error')}"
                    )
            except Exception as e:
                logger.warning(f"USPS validation error: {str(e)}")

        # Fallback to Google
        if self.google_api_key:
            try:
                result = self._validate_google(address_data)
                if result["valid"]:
                    logger.info(
                        f"Address validated via Google (fallback): {address_data.get('city', '')}, {address_data.get('state', '')}"
                    )
                    return result
                else:
                    logger.warning(
                        f"Google validation failed: {result.get('message', 'Unknown error')}"
                    )
            except Exception as e:
                logger.warning(f"Google validation error: {str(e)}")

        # Both failed or no API keys
        logger.error("All address validation APIs failed or unavailable")
        return {
            "valid": False,
            "source": "none",
            "message": "Address validation unavailable. Please verify address manually.",
            "validated_address": None,
        }

    def _validate_usps(self, address_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate address using USPS Address Validation API"""
        try:
            # USPS Address Validation API endpoint
            url = "https://secure.shippingapis.com/ShippingAPI.dll"

            # Build XML request
            xml_request = f"""<?xml version="1.0"?>
<AddressValidateRequest USERID="{self.usps_user_id}">
    <Address>
        <Address1>{address_data.get('address', '')}</Address1>
        <Address2>{address_data.get('address2', '')}</Address2>
        <City>{address_data.get('city', '')}</City>
        <State>{address_data.get('state', '')}</State>
        <Zip5>{address_data.get('zip', '')[:5] if address_data.get('zip') else ''}</Zip5>
        <Zip4></Zip4>
    </Address>
</AddressValidateRequest>"""

            params = {"API": "Verify", "XML": xml_request}

            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()

            # Parse XML response (simplified - in production, use proper XML parser)
            if "Error" in response.text:
                return {
                    "valid": False,
                    "source": "usps",
                    "message": "USPS validation error",
                    "validated_address": None,
                }

            # If we get here, assume valid (simplified parsing)
            # In production, properly parse XML response
            return {
                "valid": True,
                "source": "usps",
                "message": "Address validated",
                "validated_address": address_data,
            }

        except requests.exceptions.RequestException as e:
            logger.error(f"USPS API request failed: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"USPS validation error: {str(e)}")
            raise

    def _validate_google(self, address_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate address using Google Address Validation API"""
        try:
            url = "https://addressvalidation.googleapis.com/v1:validateAddress"

            # Build address components
            address_lines = []
            if address_data.get("address"):
                address_lines.append(address_data["address"])
            if address_data.get("address2"):
                address_lines.append(address_data["address2"])

            request_body = {
                "address": {
                    "addressLines": address_lines,
                    "locality": address_data.get("city", ""),
                    "administrativeArea": address_data.get("state", ""),
                    "postalCode": address_data.get("zip", ""),
                    "regionCode": "US",
                }
            }

            headers = {"Content-Type": "application/json"}

            params = {"key": self.google_api_key}

            response = requests.post(
                url, json=request_body, headers=headers, params=params, timeout=10
            )
            response.raise_for_status()

            data = response.json()

            # Check validation result
            result = data.get("result", {})
            verdict = result.get("verdict", {})
            address_complete = verdict.get("addressComplete", False)

            if address_complete:
                # Extract validated address
                validated = result.get("address", {})
                return {
                    "valid": True,
                    "source": "google",
                    "message": "Address validated",
                    "validated_address": {
                        "address": " ".join(validated.get("addressLines", [])),
                        "city": validated.get("locality", ""),
                        "state": validated.get("administrativeArea", ""),
                        "zip": validated.get("postalCode", ""),
                    },
                }
            else:
                return {
                    "valid": False,
                    "source": "google",
                    "message": "Address could not be validated",
                    "validated_address": None,
                }

        except requests.exceptions.RequestException as e:
            logger.error(f"Google API request failed: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Google validation error: {str(e)}")
            raise


def validate_shipment_address(shipment_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate both Ship From and Ship To addresses for a shipment
    """
    validator = AddressValidator()

    results = {"ship_to": None, "ship_from": None}

    # Validate Ship To
    if shipment_data.get("ship_to_address"):
        ship_to_data = {
            "address": shipment_data.get("ship_to_address", ""),
            "address2": shipment_data.get("ship_to_address2", ""),
            "city": shipment_data.get("ship_to_city", ""),
            "state": shipment_data.get("ship_to_state", ""),
            "zip": shipment_data.get("ship_to_zip", ""),
        }
        results["ship_to"] = validator.validate_address(ship_to_data)

    # Validate Ship From (if present)
    if shipment_data.get("ship_from_address"):
        ship_from_data = {
            "address": shipment_data.get("ship_from_address", ""),
            "address2": shipment_data.get("ship_from_address2", ""),
            "city": shipment_data.get("ship_from_city", ""),
            "state": shipment_data.get("ship_from_state", ""),
            "zip": shipment_data.get("ship_from_zip", ""),
        }
        results["ship_from"] = validator.validate_address(ship_from_data)

    return results
