import { memo } from "react";
import { Bell, User } from "lucide-react";

interface HeaderProps {
  totalPrice?: number;
}

function Header({ totalPrice }: HeaderProps) {
  // Ensure totalPrice is a number
  const numTotalPrice =
    typeof totalPrice === "number" ? totalPrice : Number(totalPrice || 0);

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Bulk Shipping Labels
          </h2>
        </div>

        <div className="flex items-center gap-6">
          {totalPrice !== undefined && numTotalPrice > 0 && (
            <div className="text-right">
              <div className="text-sm text-gray-500">Total</div>
              <div className="text-xl font-bold text-primary-600">
                ${numTotalPrice.toFixed(2)}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
              <User className="w-5 h-5 text-gray-600" />
              <div className="text-sm">
                <div className="font-medium text-gray-900">Demo User</div>
                <div className="text-gray-500">Balance: $1,234.56</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default memo(Header);
