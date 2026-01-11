import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Shipment } from "../../types";

// Move US_STATES outside component to prevent recreation on every render
const US_STATES = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
  "DC",
  "PR",
] as const;

interface EditAddressModalProps {
  shipment: Shipment;
  onClose: () => void;
  onSave: (data: Partial<Shipment>) => void;
}

function EditAddressModal({
  shipment,
  onClose,
  onSave,
}: EditAddressModalProps) {
  const [isShipFrom, setIsShipFrom] = useState(true);
  const [formData, setFormData] = useState({
    first_name: shipment.ship_from_first_name || "",
    last_name: shipment.ship_from_last_name || "",
    address: shipment.ship_from_address || "",
    address2: shipment.ship_from_address2 || "",
    city: shipment.ship_from_city || "",
    state: shipment.ship_from_state || "",
    zip: shipment.ship_from_zip || "",
    phone: shipment.ship_from_phone || "",
  });

  useEffect(() => {
    if (isShipFrom) {
      setFormData({
        first_name: shipment.ship_from_first_name || "",
        last_name: shipment.ship_from_last_name || "",
        address: shipment.ship_from_address || "",
        address2: shipment.ship_from_address2 || "",
        city: shipment.ship_from_city || "",
        state: shipment.ship_from_state || "",
        zip: shipment.ship_from_zip || "",
        phone: shipment.ship_from_phone || "",
      });
    } else {
      setFormData({
        first_name: shipment.ship_to_first_name || "",
        last_name: shipment.ship_to_last_name || "",
        address: shipment.ship_to_address || "",
        address2: shipment.ship_to_address2 || "",
        city: shipment.ship_to_city || "",
        state: shipment.ship_to_state || "",
        zip: shipment.ship_to_zip || "",
        phone: shipment.ship_to_phone || "",
      });
    }
  }, [
    isShipFrom,
    shipment.id,
    shipment.ship_from_first_name,
    shipment.ship_from_last_name,
    shipment.ship_from_address,
    shipment.ship_from_address2,
    shipment.ship_from_city,
    shipment.ship_from_state,
    shipment.ship_from_zip,
    shipment.ship_from_phone,
    shipment.ship_to_first_name,
    shipment.ship_to_last_name,
    shipment.ship_to_address,
    shipment.ship_to_address2,
    shipment.ship_to_city,
    shipment.ship_to_state,
    shipment.ship_to_zip,
    shipment.ship_to_phone,
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updateData: Partial<Shipment> = {};
    if (isShipFrom) {
      updateData.ship_from_first_name = formData.first_name;
      updateData.ship_from_last_name = formData.last_name;
      updateData.ship_from_address = formData.address;
      updateData.ship_from_address2 = formData.address2;
      updateData.ship_from_city = formData.city;
      updateData.ship_from_state = formData.state;
      updateData.ship_from_zip = formData.zip;
      updateData.ship_from_phone = formData.phone;
    } else {
      updateData.ship_to_first_name = formData.first_name;
      updateData.ship_to_last_name = formData.last_name;
      updateData.ship_to_address = formData.address;
      updateData.ship_to_address2 = formData.address2;
      updateData.ship_to_city = formData.city;
      updateData.ship_to_state = formData.state;
      updateData.ship_to_zip = formData.zip;
      updateData.ship_to_phone = formData.phone;
    }

    onSave(updateData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Edit Address</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4 flex gap-2">
            <button
              onClick={() => setIsShipFrom(true)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isShipFrom
                  ? "bg-primary-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Ship From
            </button>
            <button
              onClick={() => setIsShipFrom(false)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                !isShipFrom
                  ? "bg-primary-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Ship To
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.first_name}
                  onChange={(e) =>
                    setFormData({ ...formData, first_name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) =>
                    setFormData({ ...formData, last_name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address Line 1 *
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address Line 2
              </label>
              <input
                type="text"
                value={formData.address2}
                onChange={(e) =>
                  setFormData({ ...formData, address2: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State *
                </label>
                <select
                  required
                  value={formData.state}
                  onChange={(e) =>
                    setFormData({ ...formData, state: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Select...</option>
                  {US_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ZIP Code *
                </label>
                <input
                  type="text"
                  required
                  value={formData.zip}
                  onChange={(e) =>
                    setFormData({ ...formData, zip: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
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
    </div>
  );
}

export default EditAddressModal;
