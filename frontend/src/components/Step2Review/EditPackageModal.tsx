import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Shipment } from "../../types";

interface EditPackageModalProps {
  shipment: Shipment;
  onClose: () => void;
  onSave: (data: Partial<Shipment>) => void;
}

function EditPackageModal({
  shipment,
  onClose,
  onSave,
}: EditPackageModalProps) {
  const [formData, setFormData] = useState({
    item_sku: shipment.item_sku || "",
    length: shipment.length?.toString() || "",
    width: shipment.width?.toString() || "",
    height: shipment.height?.toString() || "",
    weight_lbs: shipment.weight_lbs?.toString() || "",
    weight_oz: shipment.weight_oz?.toString() || "",
  });

  // Sync formData when shipment prop changes
  useEffect(() => {
    setFormData({
      item_sku: shipment.item_sku || "",
      length: shipment.length?.toString() || "",
      width: shipment.width?.toString() || "",
      height: shipment.height?.toString() || "",
      weight_lbs: shipment.weight_lbs?.toString() || "",
      weight_oz: shipment.weight_oz?.toString() || "",
    });
  }, [
    shipment.id,
    shipment.item_sku,
    shipment.length,
    shipment.width,
    shipment.height,
    shipment.weight_lbs,
    shipment.weight_oz,
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updateData: Partial<Shipment> = {
      item_sku: formData.item_sku,
      length: formData.length ? parseFloat(formData.length) : null,
      width: formData.width ? parseFloat(formData.width) : null,
      height: formData.height ? parseFloat(formData.height) : null,
      weight_lbs: formData.weight_lbs ? parseInt(formData.weight_lbs) : null,
      weight_oz: formData.weight_oz ? parseInt(formData.weight_oz) : null,
    };

    onSave(updateData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Edit Package Details
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Item ID / SKU
            </label>
            <input
              type="text"
              value={formData.item_sku}
              onChange={(e) =>
                setFormData({ ...formData, item_sku: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Length (in) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.length}
                onChange={(e) =>
                  setFormData({ ...formData, length: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Width (in) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.width}
                onChange={(e) =>
                  setFormData({ ...formData, width: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Height (in) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.height}
                onChange={(e) =>
                  setFormData({ ...formData, height: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Weight (lbs)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={formData.weight_lbs}
                onChange={(e) =>
                  setFormData({ ...formData, weight_lbs: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Weight (oz)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                max="15"
                value={formData.weight_oz}
                onChange={(e) =>
                  setFormData({ ...formData, weight_oz: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditPackageModal;
