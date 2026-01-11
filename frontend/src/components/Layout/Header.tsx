import { memo } from "react";
import { Bell, User, Menu } from "lucide-react";

interface HeaderProps {
  totalPrice?: number;
  onMenuClick: () => void;
}

function Header({ totalPrice, onMenuClick }: HeaderProps) {
  // Ensure totalPrice is a number
  const numTotalPrice =
    typeof totalPrice === "number" ? totalPrice : Number(totalPrice || 0);

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 md:px-6 md:py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h2 className="text-base md:text-lg font-semibold text-gray-800">
            Bulk Shipping Labels
          </h2>
        </div>

        <div className="flex items-center gap-3 md:gap-6">
          {totalPrice !== undefined && numTotalPrice > 0 && (
            <div className="text-right hidden sm:block">
              <div className="text-xs md:text-sm text-gray-500">Total</div>
              <div className="text-lg md:text-xl font-bold text-primary-600">
                ${numTotalPrice.toFixed(2)}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 md:gap-3">
            <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 px-2 md:px-3 py-2 bg-gray-50 rounded-lg">
              <User className="w-4 h-4 md:w-5 md:h-5 text-gray-600 flex-shrink-0" />
              <div className="text-xs md:text-sm hidden sm:block">
                <div className="font-medium text-gray-900">Demo User</div>
                <div className="text-gray-500 hidden md:block">
                  Balance: $1,234.56
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default memo(Header);
