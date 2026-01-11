import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "./components/Layout/Sidebar";
import Header from "./components/Layout/Header";
import Step1Upload from "./components/Step1Upload/Step1Upload";
import Step2Review from "./components/Step2Review/Step2Review";
import Step3Shipping from "./components/Step3Shipping/Step3Shipping";
import Purchase from "./components/Purchase/Purchase";
import { Shipment } from "./types";
import { apiClient } from "./services/api";

function AppContent() {
  const location = useLocation();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load shipments on mount and when navigating to review/shipping pages
  useEffect(() => {
    if (
      location.pathname === "/review" ||
      location.pathname === "/shipping" ||
      location.pathname === "/purchase"
    ) {
      loadShipments();
    }
  }, [location.pathname]);

  const loadShipments = useCallback(async () => {
    // Cancel any pending requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const data = await apiClient.getShipments(
        undefined,
        abortController.signal,
      );
      if (!abortController.signal.aborted) {
        setShipments(data);
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return; // Request was cancelled, ignore
      }
      console.error("Failed to load shipments:", error);
    }
  }, []);

  // Calculate total price from shipments using useMemo
  const totalPrice = useMemo(() => {
    const safeShipments = Array.isArray(shipments) ? shipments : [];
    return safeShipments.reduce((sum, shipment) => {
      return sum + Number(shipment.calculated_price || 0);
    }, 0);
  }, [shipments]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const currentStep =
    location.pathname === "/upload"
      ? 1
      : location.pathname === "/review"
        ? 2
        : location.pathname === "/shipping"
          ? 3
          : 4;

  const handleUploadSuccess = useCallback(async () => {
    await loadShipments();
  }, [loadShipments]);

  const handleShipmentsChange = useCallback(async () => {
    await loadShipments();
  }, [loadShipments]);

  const handleComplete = useCallback(async () => {
    setShipments([]);
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col overflow-x-auto">
        <Header
          totalPrice={currentStep === 3 ? totalPrice : undefined}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="flex-1 p-4 md:p-6">
          <Routes>
            <Route path="/" element={<Navigate to="/upload" replace />} />
            <Route
              path="/upload"
              element={<Step1Upload onUploadSuccess={handleUploadSuccess} />}
            />
            <Route
              path="/review"
              element={
                <Step2Review
                  shipments={shipments}
                  onShipmentsChange={handleShipmentsChange}
                  onContinue={() => {}}
                  onBack={() => {}}
                />
              }
            />
            <Route
              path="/shipping"
              element={
                <Step3Shipping
                  shipments={shipments}
                  onShipmentsChange={handleShipmentsChange}
                  onContinue={() => {}}
                  onBack={() => {}}
                />
              }
            />
            <Route
              path="/purchase"
              element={
                <Purchase
                  shipments={shipments}
                  totalPrice={totalPrice}
                  onComplete={handleComplete}
                />
              }
            />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
