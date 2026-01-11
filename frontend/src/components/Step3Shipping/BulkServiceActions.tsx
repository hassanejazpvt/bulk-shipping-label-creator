import { memo, useState, useRef } from "react";
import { Truck } from "lucide-react";
import { useClickOutside } from "../../hooks/useClickOutside";

interface BulkServiceActionsProps {
  selectedCount: number;
  onBulkServiceChange: (
    service: "priority_mail" | "ground_shipping" | "most_affordable",
  ) => void;
  isLoading: boolean;
}

function BulkServiceActions({
  selectedCount,
  onBulkServiceChange,
  isLoading,
}: BulkServiceActionsProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useClickOutside(menuRef, () => {
    setShowMenu(false);
  });

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      <span className="text-xs md:text-sm font-medium text-gray-700">
        {selectedCount} selected
      </span>

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-1.5 text-xs md:text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50"
        >
          <Truck className="w-4 h-4" />
          <span className="hidden sm:inline">Change Shipping Services</span>
          <span className="sm:hidden">Change Service</span>
        </button>

        {showMenu && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[200px] sm:min-w-[250px] max-w-[calc(100vw-2rem)]">
            <button
              onClick={() => {
                onBulkServiceChange("most_affordable");
                setShowMenu(false);
              }}
              className="w-full text-left px-4 py-2 text-xs md:text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg transition-colors"
            >
              <span className="hidden sm:inline">
                Switch to the most affordable rate available
              </span>
              <span className="sm:hidden">Most Affordable</span>
            </button>
            <button
              onClick={() => {
                onBulkServiceChange("priority_mail");
                setShowMenu(false);
              }}
              className="w-full text-left px-4 py-2 text-xs md:text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Change to Priority Mail
            </button>
            <button
              onClick={() => {
                onBulkServiceChange("ground_shipping");
                setShowMenu(false);
              }}
              className="w-full text-left px-4 py-2 text-xs md:text-sm text-gray-700 hover:bg-gray-50 last:rounded-b-lg transition-colors"
            >
              Change to Ground Shipping
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(BulkServiceActions);
