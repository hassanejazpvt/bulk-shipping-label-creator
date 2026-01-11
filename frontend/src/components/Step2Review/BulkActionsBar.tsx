import { memo, useState, useRef } from "react";
import { Trash2, MapPin, Package } from "lucide-react";
import { SavedAddress, SavedPackage } from "../../types";
import { useClickOutside } from "../../hooks/useClickOutside";

interface BulkActionsBarProps {
  selectedCount: number;
  savedAddresses: SavedAddress[];
  savedPackages: SavedPackage[];
  onBulkDelete: () => void;
  onBulkUpdateAddress: (addressId: string) => void;
  onBulkUpdatePackage: (packageId: string) => void;
  isLoading: boolean;
}

function BulkActionsBar({
  selectedCount,
  savedAddresses,
  savedPackages,
  onBulkDelete,
  onBulkUpdateAddress,
  onBulkUpdatePackage,
  isLoading,
}: BulkActionsBarProps) {
  const [showAddressMenu, setShowAddressMenu] = useState(false);
  const [showPackageMenu, setShowPackageMenu] = useState(false);
  const addressMenuRef = useRef<HTMLDivElement>(null);
  const packageMenuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useClickOutside(addressMenuRef, () => {
    setShowAddressMenu(false);
  });

  useClickOutside(packageMenuRef, () => {
    setShowPackageMenu(false);
  });

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700">
          {selectedCount} selected
        </span>

        <div className="flex items-center gap-2">
          {/* Change Ship From Address */}
          <div className="relative" ref={addressMenuRef}>
            <button
              onClick={() => {
                setShowAddressMenu(!showAddressMenu);
                setShowPackageMenu(false);
              }}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50"
            >
              <MapPin className="w-4 h-4" />
              Change Ship From
            </button>

            {showAddressMenu && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[200px]">
                {savedAddresses.length === 0 ? (
                  <div className="px-4 py-2 text-sm text-gray-500">
                    No saved addresses
                  </div>
                ) : (
                  savedAddresses.map((address) => (
                    <button
                      key={address.id}
                      onClick={() => {
                        onBulkUpdateAddress(address.id);
                        setShowAddressMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                    >
                      <div className="font-medium">{address.name}</div>
                      <div className="text-xs text-gray-500">
                        {address.city}, {address.state}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Change Package Details */}
          <div className="relative" ref={packageMenuRef}>
            <button
              onClick={() => {
                setShowPackageMenu(!showPackageMenu);
                setShowAddressMenu(false);
              }}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50"
            >
              <Package className="w-4 h-4" />
              Change Package
            </button>

            {showPackageMenu && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[200px]">
                {savedPackages.length === 0 ? (
                  <div className="px-4 py-2 text-sm text-gray-500">
                    No saved packages
                  </div>
                ) : (
                  savedPackages.map((pkg) => (
                    <button
                      key={pkg.id}
                      onClick={() => {
                        onBulkUpdatePackage(pkg.id);
                        setShowPackageMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                    >
                      <div className="font-medium">{pkg.name}</div>
                      <div className="text-xs text-gray-500">
                        {pkg.length}×{pkg.width}×{pkg.height} in
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Delete Selected */}
          <button
            onClick={onBulkDelete}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            Delete Selected
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(BulkActionsBar);
