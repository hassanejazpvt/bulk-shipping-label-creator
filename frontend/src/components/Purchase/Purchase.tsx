import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Download, Printer } from "lucide-react";
import { apiClient } from "../../services/api";
import { Shipment } from "../../types";

interface PurchaseProps {
  shipments: Shipment[];
  totalPrice: number;
  onComplete: () => void;
}

export default function Purchase({
  shipments,
  totalPrice,
  onComplete,
}: PurchaseProps) {
  const [labelSize, setLabelSize] = useState<"letter_a4" | "4x6">("letter_a4");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [purchaseComplete, setPurchaseComplete] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const navigate = useNavigate();

  const handlePurchase = async () => {
    if (!termsAccepted) {
      alert("Please accept the terms and conditions to proceed.");
      return;
    }

    setIsProcessing(true);

    try {
      const response = await apiClient.purchase({
        shipment_ids: shipments.map((s) => s.id),
        label_size: labelSize,
        terms_accepted: termsAccepted,
      });

      setOrderId(response.order_id);
      setPurchaseComplete(true);
    } catch (error: any) {
      alert(`Purchase failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (purchaseComplete) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg border border-gray-200 p-6 md:p-12 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 md:w-12 md:h-12 text-green-600" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Purchase Successful!
            </h1>
            <p className="text-sm md:text-base text-gray-600 mb-6">
              Your shipping labels have been created successfully.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 md:p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 text-left">
              <div>
                <p className="text-xs md:text-sm text-gray-600 mb-1">
                  Order ID
                </p>
                <p className="text-base md:text-lg font-semibold text-gray-900">
                  {orderId}
                </p>
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-600 mb-1">
                  Labels Created
                </p>
                <p className="text-base md:text-lg font-semibold text-gray-900">
                  {shipments.length}
                </p>
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-600 mb-1">
                  Label Size
                </p>
                <p className="text-base md:text-lg font-semibold text-gray-900">
                  {labelSize === "letter_a4" ? "Letter/A4" : "4x6 inch"}
                </p>
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-600 mb-1">
                  Total Amount
                </p>
                <p className="text-base md:text-lg font-semibold text-primary-600">
                  ${totalPrice.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
            <button
              onClick={() => {
                // Simulate download
                alert("Download functionality would be implemented here");
              }}
              className="flex items-center justify-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors w-full sm:w-auto"
            >
              <Download className="w-4 h-4" />
              Download Labels
            </button>
            <button
              onClick={() => {
                // Simulate print
                alert("Print functionality would be implemented here");
              }}
              className="flex items-center justify-center gap-2 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors w-full sm:w-auto"
            >
              <Printer className="w-4 h-4" />
              Print Labels
            </button>
          </div>

          <div className="mt-8">
            <button
              onClick={() => {
                onComplete();
                navigate("/upload");
              }}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Create New Labels
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          Complete Purchase
        </h1>
        <p className="text-sm md:text-base text-gray-600">
          Review your order and complete the purchase
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6 mb-6">
        <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-4">
          Label Size Selection
        </h2>
        <div className="space-y-3">
          <label className="flex items-center gap-3 p-3 md:p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="radio"
              name="labelSize"
              value="letter_a4"
              checked={labelSize === "letter_a4"}
              onChange={(e) => setLabelSize(e.target.value as "letter_a4")}
              className="w-4 h-4 text-primary-600 focus:ring-primary-500 flex-shrink-0"
            />
            <div>
              <div className="font-medium text-gray-900 text-sm md:text-base">
                Letter/A4
              </div>
              <div className="text-xs md:text-sm text-gray-600">
                Standard paper size (8.5x11 or A4)
              </div>
            </div>
          </label>
          <label className="flex items-center gap-3 p-3 md:p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="radio"
              name="labelSize"
              value="4x6"
              checked={labelSize === "4x6"}
              onChange={(e) => setLabelSize(e.target.value as "4x6")}
              className="w-4 h-4 text-primary-600 focus:ring-primary-500 flex-shrink-0"
            />
            <div>
              <div className="font-medium text-gray-900 text-sm md:text-base">
                4x6 inch
              </div>
              <div className="text-xs md:text-sm text-gray-600">
                Thermal label format
              </div>
            </div>
          </label>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6 mb-6">
        <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-4">
          Order Summary
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm md:text-base text-gray-600">
              Number of Labels
            </span>
            <span className="font-medium text-sm md:text-base text-gray-900">
              {shipments.length}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm md:text-base text-gray-600">
              Label Size
            </span>
            <span className="font-medium text-sm md:text-base text-gray-900">
              {labelSize === "letter_a4" ? "Letter/A4" : "4x6 inch"}
            </span>
          </div>
          <div className="border-t border-gray-200 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-base md:text-lg font-semibold text-gray-900">
                Grand Total
              </span>
              <span className="text-xl md:text-2xl font-bold text-primary-600">
                ${totalPrice.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6 mb-6">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-1 w-4 h-4 text-primary-600 focus:ring-primary-500 flex-shrink-0"
          />
          <div className="text-xs md:text-sm text-gray-700">
            <span className="font-medium">
              I accept the terms and conditions
            </span>
            <p className="text-gray-500 mt-1">
              By proceeding, you agree to our shipping terms and conditions.
              Labels will be generated immediately upon purchase.
            </p>
          </div>
        </label>
      </div>

      <div className="flex items-center justify-end">
        <button
          onClick={handlePurchase}
          disabled={!termsAccepted || isProcessing}
          className="w-full sm:w-auto px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm md:text-base"
        >
          {isProcessing ? "Processing..." : "Complete Purchase"}
        </button>
      </div>
    </div>
  );
}
