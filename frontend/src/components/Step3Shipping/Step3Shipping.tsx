import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckSquare,
  Square,
  ArrowLeft,
  ArrowRight,
  Trash2,
} from "lucide-react";
import { apiClient } from "../../services/api";
import { Shipment } from "../../types";
import BulkServiceActions from "./BulkServiceActions";

interface Step3ShippingProps {
  shipments: Shipment[];
  onShipmentsChange: (shipments: Shipment[]) => void;
  onContinue: () => void;
  onBack: () => void;
}

export default function Step3Shipping({
  shipments,
  onShipmentsChange,
  onContinue,
  onBack,
}: Step3ShippingProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Ensure shipments is always an array
  const safeShipments = Array.isArray(shipments) ? shipments : [];

  // Helper function to format price safely
  const formatPrice = (price: number | string | undefined | null): string => {
    const numPrice = typeof price === "number" ? price : Number(price || 0);
    return numPrice.toFixed(2);
  };

  const handleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === safeShipments.length) {
        return new Set();
      } else {
        return new Set(safeShipments.map((s) => s.id));
      }
    });
  }, [safeShipments]);

  const handleSelectOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const newSelected = new Set(prev);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      return newSelected;
    });
  }, []);

  const handleServiceChange = useCallback(
    async (shipmentId: string, serviceId: string) => {
      try {
        setIsLoading(true);
        const shipment = safeShipments.find((s) => s.id === shipmentId);
        if (!shipment) return;

        const services = shipment.available_services || [];
        const selectedService = services.find((s) => s.id === serviceId);

        if (selectedService) {
          const updated = await apiClient.updateShipment(shipmentId, {
            shipping_service: serviceId as "priority_mail" | "ground_shipping",
            calculated_price: selectedService.price,
          });

          const newShipments = safeShipments.map((s) =>
            s.id === updated.id ? updated : s,
          );
          onShipmentsChange(newShipments);
        }
      } catch (error: any) {
        alert(`Failed to update service: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    },
    [safeShipments, onShipmentsChange],
  );

  const handleBulkServiceChange = useCallback(
    async (
      service: "priority_mail" | "ground_shipping" | "most_affordable",
    ) => {
      if (selectedIds.size === 0) return;

      try {
        setIsLoading(true);
        await apiClient.bulkUpdateShippingService({
          shipment_ids: Array.from(selectedIds),
          service,
        });

        // Reload shipments
        const updated = await apiClient.getShipments();
        onShipmentsChange(updated);
        setSelectedIds(new Set());
      } catch (error: any) {
        alert(`Failed to update: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    },
    [selectedIds, onShipmentsChange],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      if (!window.confirm("Are you sure you want to delete this shipment?")) {
        return;
      }

      try {
        await apiClient.deleteShipment(id);
        const updated = safeShipments.filter((s) => s.id !== id);
        onShipmentsChange(updated);
      } catch (error: any) {
        alert(`Failed to delete: ${error.message}`);
      }
    },
    [safeShipments, onShipmentsChange],
  );

  const totalPrice = useMemo(() => {
    return safeShipments.reduce((sum, s) => {
      return sum + Number(s.calculated_price || 0);
    }, 0);
  }, [safeShipments]);

  const handleBack = useCallback(() => {
    onBack();
    navigate("/review");
  }, [onBack, navigate]);

  const handleContinue = useCallback(() => {
    onContinue();
    navigate("/purchase");
  }, [onContinue, navigate]);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          Select Shipping Provider (Step 3 of 3)
        </h1>
        <p className="text-sm md:text-base text-gray-600">
          Choose shipping services for each shipment
        </p>
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-3 md:p-4 mb-6">
          <BulkServiceActions
            selectedCount={selectedIds.size}
            onBulkServiceChange={handleBulkServiceChange}
            isLoading={isLoading}
          />
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 md:px-4 py-3 text-left">
                    <button
                      onClick={handleSelectAll}
                      className="flex items-center"
                    >
                      {selectedIds.size === safeShipments.length &&
                      safeShipments.length > 0 ? (
                        <CheckSquare className="w-4 h-4 md:w-5 md:h-5 text-primary-600" />
                      ) : (
                        <Square className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                      )}
                    </button>
                  </th>
                  <th className="px-3 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-gray-700 whitespace-nowrap">
                    Ship From
                  </th>
                  <th className="px-3 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-gray-700 whitespace-nowrap">
                    Ship To
                  </th>
                  <th className="px-3 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-gray-700 whitespace-nowrap">
                    Package Details
                  </th>
                  <th className="px-3 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-gray-700 whitespace-nowrap">
                    Order No
                  </th>
                  <th className="px-3 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-gray-700 whitespace-nowrap">
                    Shipping Service
                  </th>
                  <th className="px-3 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-gray-700 whitespace-nowrap">
                    Price
                  </th>
                  <th className="px-3 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-gray-700 whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {safeShipments.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-12 text-center text-gray-500"
                    >
                      No shipments found
                    </td>
                  </tr>
                ) : (
                  safeShipments.map((shipment) => {
                    const services = shipment.available_services || [];

                    return (
                      <tr
                        key={shipment.id}
                        className={`hover:bg-gray-50 ${selectedIds.has(shipment.id) ? "bg-primary-50" : ""}`}
                      >
                        <td className="px-3 md:px-4 py-4">
                          <button onClick={() => handleSelectOne(shipment.id)}>
                            {selectedIds.has(shipment.id) ? (
                              <CheckSquare className="w-4 h-4 md:w-5 md:h-5 text-primary-600" />
                            ) : (
                              <Square className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                            )}
                          </button>
                        </td>
                        <td className="px-3 md:px-4 py-4 text-xs md:text-sm text-gray-900">
                          {shipment.ship_from_formatted || "Not set"}
                        </td>
                        <td className="px-3 md:px-4 py-4 text-xs md:text-sm text-gray-900">
                          {shipment.ship_to_formatted}
                        </td>
                        <td className="px-3 md:px-4 py-4 text-xs md:text-sm text-gray-900">
                          {shipment.package_details_formatted || "Not set"}
                        </td>
                        <td className="px-3 md:px-4 py-4 text-xs md:text-sm text-gray-900">
                          {shipment.order_no || "-"}
                        </td>
                        <td className="px-3 md:px-4 py-4">
                          <select
                            value={shipment.shipping_service || ""}
                            onChange={(e) =>
                              handleServiceChange(shipment.id, e.target.value)
                            }
                            disabled={isLoading}
                            className="w-full min-w-[140px] px-2 md:px-3 py-2 border border-gray-300 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50"
                          >
                            <option value="">Select service...</option>
                            {services.map((service) => (
                              <option key={service.id} value={service.id}>
                                {service.name} - ${formatPrice(service.price)}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 md:px-4 py-4 text-xs md:text-sm font-medium text-gray-900">
                          {shipment.calculated_price
                            ? `$${formatPrice(shipment.calculated_price)}`
                            : "-"}
                        </td>
                        <td className="px-3 md:px-4 py-4">
                          <button
                            onClick={() => handleDelete(shipment.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Total Summary */}
      <div className="mt-6 bg-white rounded-lg border border-gray-200 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs md:text-sm text-gray-600">Total Shipments</p>
            <p className="text-xl md:text-2xl font-bold text-gray-900">
              {safeShipments.length}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs md:text-sm text-gray-600">Grand Total</p>
            <p className="text-2xl md:text-3xl font-bold text-primary-600">
              ${totalPrice.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-6">
        <button
          onClick={handleBack}
          className="flex items-center justify-center gap-2 px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-full sm:w-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={handleContinue}
          disabled={safeShipments.length === 0 || totalPrice === 0}
          className="flex items-center justify-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
        >
          Continue to Purchase
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
