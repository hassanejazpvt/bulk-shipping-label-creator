/**
 * TypeScript interfaces matching backend models
 */

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface Shipment {
  id: string;
  order_no: string;
  status: "valid" | "warning" | "error" | "default_applied";

  // Ship From
  ship_from_first_name: string;
  ship_from_last_name: string;
  ship_from_address: string;
  ship_from_address2: string;
  ship_from_city: string;
  ship_from_state: string;
  ship_from_zip: string;
  ship_from_phone: string;

  // Ship To
  ship_to_first_name: string;
  ship_to_last_name: string;
  ship_to_address: string;
  ship_to_address2: string;
  ship_to_city: string;
  ship_to_state: string;
  ship_to_zip: string;
  ship_to_phone: string;

  // Package
  weight_lbs: number | null;
  weight_oz: number | null;
  length: number | null;
  width: number | null;
  height: number | null;
  item_sku: string;

  // Validation
  address_validation_status: string;
  address_validation_source: string;
  address_validation_message: string;

  // Shipping
  shipping_service: "priority_mail" | "ground_shipping" | "";
  calculated_price: number | null;

  // Formatted (from backend)
  ship_from_formatted?: string;
  ship_to_formatted?: string;
  package_details_formatted?: string;

  // Timestamps
  created_at: string;
  updated_at: string;

  available_services: ShippingService[];
}

export interface SavedAddress {
  id: string;
  name: string;
  first_name: string;
  last_name: string;
  address: string;
  address2: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface SavedPackage {
  id: string;
  name: string;
  length: number;
  width: number;
  height: number;
  weight_lbs: number;
  weight_oz: number;
  created_at: string;
  updated_at: string;
}

export interface ShippingService {
  id: string;
  name: string;
  base_price: number;
  per_oz_rate: number;
  price: number;
}

export interface UploadResponse {
  success: boolean;
  created: number;
  errors: number;
  error_details: Array<{ row: number | string; error: string }>;
  shipment_ids: string[];
}

export interface PurchaseRequest {
  shipment_ids: string[];
  label_size: "letter_a4" | "4x6";
  terms_accepted: boolean;
}

export interface PurchaseResponse {
  success: boolean;
  order_id: string;
  label_size: string;
  shipment_count: number;
  grand_total: number;
  message: string;
}
