import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Edit,
  Trash2,
  CheckSquare,
  Square,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { apiClient } from "../../services/api";
import { Shipment, SavedAddress, SavedPackage } from "../../types";
import { useDebounce } from "../../hooks/useDebounce";
import EditAddressModal from "./EditAddressModal";
import EditPackageModal from "./EditPackageModal";
import BulkActionsBar from "./BulkActionsBar";
import StatusBadge from "./StatusBadge";

interface Step2ReviewProps {
  shipments: Shipment[];
  onShipmentsChange: (shipments: Shipment[]) => void;
  onContinue: () => void;
  onBack: () => void;
}

export default function Step2Review({
  shipments,
  onShipmentsChange,
  onContinue,
  onBack,
}: Step2ReviewProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [editingShipment, setEditingShipment] = useState<Shipment | null>(null);
  const [editingType, setEditingType] = useState<"address" | "package" | null>(
    null,
  );
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [savedPackages, setSavedPackages] = useState<SavedPackage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    loadSavedData();

    return () => {
      abortController.abort();
    };
  }, []);

  const loadSavedData = async () => {
    try {
      const [addresses, packages] = await Promise.all([
        apiClient.getSavedAddresses(),
        apiClient.getSavedPackages(),
      ]);
      if (!abortControllerRef.current?.signal.aborted) {
        setSavedAddresses(addresses);
        setSavedPackages(packages);
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      console.error("Failed to load saved data:", error);
    }
  };

  // Ensure shipments is always an array
  const safeShipments = Array.isArray(shipments) ? shipments : [];

  // Memoize filtered shipments with debounced search
  const filteredShipments = useMemo(() => {
    if (!debouncedSearchQuery) return safeShipments;
    const query = debouncedSearchQuery.toLowerCase();
    return safeShipments.filter((shipment) => {
      return (
        (shipment.order_no || "").toLowerCase().includes(query) ||
        (shipment.ship_from_formatted || "").toLowerCase().includes(query) ||
        (shipment.ship_to_formatted || "").toLowerCase().includes(query)
      );
    });
  }, [safeShipments, debouncedSearchQuery]);

  const handleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === filteredShipments.length) {
        return new Set();
      } else {
        return new Set(filteredShipments.map((s) => s.id));
      }
    });
  }, [filteredShipments]);

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

  const handleEdit = useCallback(
    (shipment: Shipment, type: "address" | "package") => {
      setEditingShipment(shipment);
      setEditingType(type);
    },
    [],
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

  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.size === 0) return;
    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedIds.size} shipment(s)?`,
      )
    ) {
      return;
    }

    try {
      await apiClient.bulkDeleteShipments(Array.from(selectedIds));
      const updated = safeShipments.filter((s) => !selectedIds.has(s.id));
      onShipmentsChange(updated);
      setSelectedIds(new Set());
    } catch (error: any) {
      alert(`Failed to delete: ${error.message}`);
    }
  }, [selectedIds, safeShipments, onShipmentsChange]);

  const handleBulkUpdateAddress = useCallback(
    async (addressId: string) => {
      if (selectedIds.size === 0) return;

      try {
        setIsLoading(true);
        const response = await apiClient.bulkUpdateShipments({
          shipment_ids: Array.from(selectedIds),
          address_id: addressId,
        });

        if (response.success) {
          // Fetch updated shipments to get formatted data
          const updated = await apiClient.getShipments();
          onShipmentsChange(updated);
          setSelectedIds(new Set());
        }
      } catch (error: any) {
        alert(`Failed to update: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    },
    [selectedIds, onShipmentsChange],
  );

  const handleBulkUpdatePackage = useCallback(
    async (packageId: string) => {
      if (selectedIds.size === 0) return;

      try {
        setIsLoading(true);
        const response = await apiClient.bulkUpdateShipments({
          shipment_ids: Array.from(selectedIds),
          package_id: packageId,
        });

        if (response.success) {
          // Fetch updated shipments to get formatted data
          const updated = await apiClient.getShipments();
          onShipmentsChange(updated);
          setSelectedIds(new Set());
        }
      } catch (error: any) {
        alert(`Failed to update: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    },
    [selectedIds, onShipmentsChange],
  );

  const handleSaveEdit = useCallback(
    async (updatedData: Partial<Shipment>) => {
      if (!editingShipment) return;

      try {
        const updated = await apiClient.updateShipment(
          editingShipment.id,
          updatedData,
        );
        const newShipments = safeShipments.map((s) =>
          s.id === updated.id ? updated : s,
        );
        onShipmentsChange(newShipments);
        setEditingShipment(null);
        setEditingType(null);
      } catch (error: any) {
        alert(`Failed to save: ${error.message}`);
      }
    },
    [editingShipment, safeShipments, onShipmentsChange],
  );

  const handleBack = useCallback(() => {
    if (
      window.confirm("Going back will lose your current data. Are you sure?")
    ) {
      onBack();
      navigate("/upload");
    }
  }, [onBack, navigate]);

  const handleContinue = useCallback(() => {
    // Validate that all shipments have required data
    const hasErrors = safeShipments.some((s) => s.status === "error");
    if (hasErrors) {
      alert("Please fix all errors before continuing.");
      return;
    }
    onContinue();
    navigate("/shipping");
  }, [safeShipments, onContinue, navigate]);

  const handleCloseModal = useCallback(() => {
    setEditingShipment(null);
    setEditingType(null);
  }, []);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Review and Edit File (Step 2 of 3)
        </h1>
        <p className="text-gray-600">
          Review your imported data, make edits, and apply bulk changes
        </p>
      </div>

      {/* Search and Bulk Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order number, name, or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {selectedIds.size > 0 && (
          <BulkActionsBar
            selectedCount={selectedIds.size}
            savedAddresses={savedAddresses}
            savedPackages={savedPackages}
            onBulkDelete={handleBulkDelete}
            onBulkUpdateAddress={handleBulkUpdateAddress}
            onBulkUpdatePackage={handleBulkUpdatePackage}
            isLoading={isLoading}
          />
        )}
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={handleSelectAll}
                    className="flex items-center"
                  >
                    {selectedIds.size === filteredShipments.length &&
                    filteredShipments.length > 0 ? (
                      <CheckSquare className="w-5 h-5 text-primary-600" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Ship From
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Ship To
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Package Details
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Order No
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredShipments.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-gray-500"
                  >
                    No shipments found
                  </td>
                </tr>
              ) : (
                filteredShipments.map((shipment) => (
                  <tr
                    key={shipment.id}
                    className={`hover:bg-gray-50 ${selectedIds.has(shipment.id) ? "bg-primary-50" : ""}`}
                  >
                    <td className="px-4 py-4">
                      <button onClick={() => handleSelectOne(shipment.id)}>
                        {selectedIds.has(shipment.id) ? (
                          <CheckSquare className="w-5 h-5 text-primary-600" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {shipment.ship_from_formatted || "Not set"}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {shipment.ship_to_formatted}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {shipment.package_details_formatted || "Not set"}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {shipment.order_no || "-"}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={shipment.status} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(shipment, "address")}
                          className="p-1 text-primary-600 hover:bg-primary-50 rounded"
                          title="Edit Address"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(shipment, "package")}
                          className="p-1 text-primary-600 hover:bg-primary-50 rounded"
                          title="Edit Package"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(shipment.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={handleContinue}
          className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Edit Modals */}
      {editingShipment && editingType === "address" && (
        <EditAddressModal
          key={`address-${editingShipment.id}`}
          shipment={editingShipment}
          onClose={handleCloseModal}
          onSave={handleSaveEdit}
        />
      )}

      {editingShipment && editingType === "package" && (
        <EditPackageModal
          key={`package-${editingShipment.id}`}
          shipment={editingShipment}
          onClose={handleCloseModal}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}
