import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, FileText, Download, AlertCircle } from "lucide-react";
import { apiClient } from "../../services/api";
import { Shipment } from "../../types";

interface Step1UploadProps {
  onUploadSuccess: (shipments: Shipment[]) => void;
}

export default function Step1Upload({ onUploadSuccess }: Step1UploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith(".csv")) {
      setError("Please upload a CSV file");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const response = await apiClient.uploadCSV(file);

      if (response.success) {
        // Fetch the created shipments
        const shipments = await apiClient.getShipments();
        onUploadSuccess(shipments);
        navigate("/review");
      } else {
        setError(
          `Upload completed with ${response.errors} errors. Check details.`,
        );
      }
    } catch (err: any) {
      setError(err.message || "Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch("/Template.csv");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "Template.csv";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download template:", error);
      alert("Failed to download template. Please try again.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          Upload Spreadsheet (Step 1 of 3)
        </h1>
        <p className="text-sm md:text-base text-gray-600">
          Upload your CSV file containing shipping order data
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Upload Area */}
        <div className="lg:col-span-2">
          <div
            className={`
              border-2 border-dashed rounded-lg p-6 md:p-12 text-center transition-colors
              ${
                isDragging
                  ? "border-primary-500 bg-primary-50"
                  : "border-gray-300 hover:border-primary-400"
              }
              ${isUploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isUploading}
            />

            {isUploading ? (
              <div className="space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                <p className="text-gray-600">Uploading and processing...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto" />
                <div>
                  <p className="text-base md:text-lg font-medium text-gray-900 mb-2">
                    Drag and drop your CSV file here
                  </p>
                  <p className="text-gray-500 mb-4">or</p>
                  <button className="w-full sm:w-auto px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                    Browse Files
                  </button>
                </div>
                <p className="text-sm text-gray-400">Supported format: CSV</p>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Upload Error</p>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Help Section */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Help & Resources
            </h3>

            <div className="space-y-4">
              <div>
                <button
                  onClick={handleDownloadTemplate}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download Template
                </button>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Instructions:
                </h4>
                <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                  <li>Download the template file</li>
                  <li>Fill in your shipping data</li>
                  <li>Save as CSV format</li>
                  <li>Upload using the area on the left</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> The template includes 2 header rows. Make
              sure your CSV follows the same structure.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
