"""
CSV parsing and data validation utilities
"""

import csv
import io
import logging
from typing import List, Dict, Any, Optional
from decimal import Decimal, InvalidOperation

logger = logging.getLogger("shipping_platform")


def parse_csv_file(file_content: bytes) -> List[Dict[str, Any]]:
    """
    Parse CSV file with 2-header-row structure (23 columns)
    Returns list of parsed shipment records
    """
    logger.info("Starting CSV parsing")

    try:
        # Decode file content
        content = file_content.decode("utf-8")
        csv_reader = csv.reader(io.StringIO(content))

        # Read first two header rows
        header_row_1 = next(csv_reader, None)
        header_row_2 = next(csv_reader, None)

        if not header_row_1 or not header_row_2:
            raise ValueError("CSV file must have at least 2 header rows")

        logger.info(
            f"CSV headers parsed. First row: {len(header_row_1)} columns, Second row: {len(header_row_2)} columns"
        )

        # Column mapping based on PRD
        # Row 2 contains the actual field names
        records = []
        row_num = 2  # Start counting from row 3 (after headers)

        for row in csv_reader:
            row_num += 1

            # Skip empty rows
            if not any(cell.strip() for cell in row):
                continue

            # Ensure row has at least 23 columns (pad if needed)
            while len(row) < 23:
                row.append("")

            try:
                record = {
                    # Ship From (columns 0-6)
                    "ship_from_first_name": row[0].strip() if len(row) > 0 else "",
                    "ship_from_last_name": row[1].strip() if len(row) > 1 else "",
                    "ship_from_address": row[2].strip() if len(row) > 2 else "",
                    "ship_from_address2": row[3].strip() if len(row) > 3 else "",
                    "ship_from_city": row[4].strip() if len(row) > 4 else "",
                    "ship_from_zip": row[5].strip() if len(row) > 5 else "",
                    "ship_from_state": row[6].strip() if len(row) > 6 else "",
                    # Ship To (columns 7-13)
                    "ship_to_first_name": row[7].strip() if len(row) > 7 else "",
                    "ship_to_last_name": row[8].strip() if len(row) > 8 else "",
                    "ship_to_address": row[9].strip() if len(row) > 9 else "",
                    "ship_to_address2": row[10].strip() if len(row) > 10 else "",
                    "ship_to_city": row[11].strip() if len(row) > 11 else "",
                    "ship_to_zip": row[12].strip() if len(row) > 12 else "",
                    "ship_to_state": row[13].strip() if len(row) > 13 else "",
                    # Package (columns 14-18)
                    "weight_lbs": _parse_int(row[14]) if len(row) > 14 else None,
                    "weight_oz": _parse_int(row[15]) if len(row) > 15 else None,
                    "length": _parse_decimal(row[16]) if len(row) > 16 else None,
                    "width": _parse_decimal(row[17]) if len(row) > 17 else None,
                    "height": _parse_decimal(row[18]) if len(row) > 18 else None,
                    # Contact (columns 19-20)
                    "ship_to_phone": row[19].strip() if len(row) > 19 else "",
                    "ship_from_phone": row[20].strip() if len(row) > 20 else "",
                    # Reference (columns 21-22)
                    "order_no": row[21].strip() if len(row) > 21 else "",
                    "item_sku": row[22].strip() if len(row) > 22 else "",
                    "row_number": row_num,
                }

                records.append(record)

            except Exception as e:
                logger.warning(f"Error parsing row {row_num}: {str(e)}")
                continue

        logger.info(f"CSV parsing completed. Parsed {len(records)} records")
        return records

    except Exception as e:
        logger.error(f"CSV parsing failed: {str(e)}", exc_info=True)
        raise ValueError(f"Failed to parse CSV file: {str(e)}")


def _parse_int(value: str) -> Optional[int]:
    """Parse integer value, return None if invalid"""
    if not value or not value.strip():
        return None
    try:
        # Remove any non-numeric characters except minus
        cleaned = "".join(c for c in value.strip() if c.isdigit() or c == "-")
        if cleaned:
            return int(float(cleaned))  # Handle "5.0" -> 5
        return None
    except (ValueError, TypeError):
        return None


def _parse_decimal(value: str) -> Optional[Decimal]:
    """Parse decimal value, return None if invalid"""
    if not value or not value.strip():
        return None
    try:
        return Decimal(str(value).strip())
    except (ValueError, InvalidOperation, TypeError):
        return None


def validate_shipment_data(
    record: Dict[str, Any], default_address: Optional[Dict] = None
) -> Dict[str, Any]:
    """
    Validate a single shipment record and determine its status
    Returns record with status and validation info
    """
    status = "valid"
    issues = []

    # Check Ship To (required)
    if not record.get("ship_to_first_name") and not record.get("ship_to_last_name"):
        status = "error"
        issues.append("Missing Ship To name")

    if not record.get("ship_to_address"):
        status = "error"
        issues.append("Missing Ship To address")

    if not record.get("ship_to_city"):
        status = "error"
        issues.append("Missing Ship To city")

    if not record.get("ship_to_state"):
        status = "error"
        issues.append("Missing Ship To state")

    if not record.get("ship_to_zip"):
        status = "error"
        issues.append("Missing Ship To ZIP code")

    # Check Ship From - apply default if missing
    ship_from_missing = (
        not record.get("ship_from_first_name")
        and not record.get("ship_from_address")
        and not record.get("ship_from_city")
    )

    if ship_from_missing and default_address:
        # Apply default address
        record["ship_from_first_name"] = default_address.get("first_name", "")
        record["ship_from_last_name"] = default_address.get("last_name", "")
        record["ship_from_address"] = default_address.get("address", "")
        record["ship_from_address2"] = default_address.get("address2", "")
        record["ship_from_city"] = default_address.get("city", "")
        record["ship_from_state"] = default_address.get("state", "")
        record["ship_from_zip"] = default_address.get("zip_code", "")
        record["ship_from_phone"] = default_address.get("phone", "")
        if status == "valid":
            status = "default_applied"
    elif ship_from_missing:
        # No default available, mark as warning
        if status == "valid":
            status = "warning"
        issues.append("Missing Ship From address")

    # Check Package - warnings if missing
    has_weight = record.get("weight_lbs") or record.get("weight_oz")
    has_dimensions = record.get("length") and record.get("width") and record.get("height")

    if not has_weight and not has_dimensions:
        if status == "valid":
            status = "warning"
        issues.append("Missing package weight and dimensions")
    elif not has_weight:
        if status == "valid":
            status = "warning"
        issues.append("Missing package weight")
    elif not has_dimensions:
        if status == "valid":
            status = "warning"
        issues.append("Missing package dimensions")

    record["status"] = status
    record["validation_issues"] = issues

    return record
