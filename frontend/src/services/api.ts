/**
 * API client service
 */
import axios, { AxiosInstance, AxiosError } from "axios";
import {
  Shipment,
  SavedAddress,
  SavedPackage,
  ShippingService,
  UploadResponse,
  PurchaseRequest,
  PurchaseResponse,
  PaginatedResponse,
} from "../types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response) {
          // Server responded with error
          const message = (error.response.data as any)?.error || error.message;
          return Promise.reject(new Error(message));
        } else if (error.request) {
          // Request made but no response
          return Promise.reject(
            new Error("Network error. Please check your connection."),
          );
        } else {
          // Something else happened
          return Promise.reject(error);
        }
      },
    );
  }

  // Shipments
  async uploadCSV(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await this.client.post<UploadResponse>(
      "/shipments/upload/",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data;
  }

  async getShipments(
    params?: { status?: string; search?: string },
    signal?: AbortSignal,
  ): Promise<Shipment[]> {
    const response = await this.client.get<PaginatedResponse<Shipment>>(
      "/shipments/",
      {
        params,
        signal,
      },
    );
    return response.data.results;
  }

  async getShipment(id: string): Promise<Shipment> {
    const response = await this.client.get<Shipment>(`/shipments/${id}/`);
    return response.data;
  }

  async updateShipment(id: string, data: Partial<Shipment>): Promise<Shipment> {
    const response = await this.client.patch<Shipment>(
      `/shipments/${id}/`,
      data,
    );
    return response.data;
  }

  async deleteShipment(id: string): Promise<void> {
    await this.client.delete(`/shipments/${id}/`);
  }

  async bulkUpdateShipments(data: {
    shipment_ids: string[];
    address_id?: string;
    package_id?: string;
  }): Promise<{ success: boolean; updated: number }> {
    const response = await this.client.post("/shipments/bulk_update/", data);
    return response.data;
  }

  async bulkDeleteShipments(
    shipment_ids: string[],
  ): Promise<{ success: boolean; deleted: number }> {
    const response = await this.client.post("/shipments/bulk_delete/", {
      shipment_ids,
    });
    return response.data;
  }

  async validateAddresses(
    shipment_ids?: string[],
  ): Promise<{ success: boolean; validated: number }> {
    const response = await this.client.post("/shipments/validate_addresses/", {
      shipment_ids: shipment_ids || [],
    });
    return response.data;
  }

  // Saved Addresses
  async getSavedAddresses(): Promise<SavedAddress[]> {
    const response =
      await this.client.get<PaginatedResponse<SavedAddress>>(
        "/saved-addresses/",
      );
    return response.data.results;
  }

  // Saved Packages
  async getSavedPackages(): Promise<SavedPackage[]> {
    const response =
      await this.client.get<PaginatedResponse<SavedPackage>>(
        "/saved-packages/",
      );
    return response.data.results;
  }

  // Shipping Services
  async getShippingServices(
    params?: {
      weight_lbs?: number;
      weight_oz?: number;
      length?: number;
      width?: number;
      height?: number;
    },
    signal?: AbortSignal,
  ): Promise<ShippingService[]> {
    const response = await this.client.get<ShippingService[]>(
      "/shipping-services/",
      {
        params,
        signal,
      },
    );
    return response.data;
  }

  async bulkUpdateShippingService(data: {
    shipment_ids: string[];
    service: "priority_mail" | "ground_shipping" | "most_affordable";
  }): Promise<{ success: boolean; updated: number }> {
    const response = await this.client.post(
      "/shipping-services/bulk_update_service/",
      data,
    );
    return response.data;
  }

  // Purchase
  async purchase(data: PurchaseRequest): Promise<PurchaseResponse> {
    const response = await this.client.post<PurchaseResponse>(
      "/purchase/",
      data,
    );
    return response.data;
  }
}

export const apiClient = new ApiClient();
