"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import QuaggaScanner from '@/components/QuaggaScanner';

export default function ScannerPage() {
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(false);
  const [scannerInitialized, setScannerInitialized] = useState(false);
  const [manualInput, setManualInput] = useState(false);

  const handleScanSuccess = (code: string) => {
    console.log('Scanned code:', code);
    router.push(`/product/${code}`);
  };

  const handleStartScan = () => {
    setManualInput(false);
    if (!scannerInitialized) {
      console.log('Scanner not initialized yet');
      return;
    }
    console.log('Starting scan...');
    setIsScanning(true);
  };

  const handleManualInput = () => {
    setIsScanning(false);
    setManualInput(true);
  };

  const handleManualSubmit = (barcode: string) => {
    if (barcode.length === 8 || barcode.length === 13) {
      router.push(`/product/${barcode}`);
    } else {
      alert('Please enter a valid 8 or 13 digit barcode');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-700 mb-4">Scan a Product</h1>
          <p className="text-gray-600">
            Choose your preferred method to analyze a product's nutritional information
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-8">
          {!manualInput ? (
            <>
              <QuaggaScanner onScanSuccess={handleScanSuccess} onInitialized={() => setScannerInitialized(true)} />
              <div className="mt-6 text-center">
                {!scannerInitialized && (
                  <p className="text-gray-600 mb-4">Initializing scanner...</p>
                )}
                <div className="flex justify-center gap-4">
                  <button
                    onClick={handleStartScan}
                    disabled={!scannerInitialized || isScanning}
                    className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    {isScanning ? 'Scanning...' : scannerInitialized ? 'Scan Barcode' : 'Initializing...'}
                  </button>
                  <button
                    onClick={handleManualInput}
                    className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Enter Manually
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center">
              <h2 className="text-2xl font-semibold mb-4">Enter Barcode Manually</h2>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Enter 8 or 13 digit barcode"
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  maxLength={13}
                  pattern="\d*"
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    e.target.value = value;
                  }}
                />
                <button
                  onClick={() => {
                    const input = document.querySelector('input') as HTMLInputElement;
                    if (input) {
                      const barcode = input.value;
                      handleManualSubmit(barcode);
                    }
                  }}
                  className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors"
                >
                  Submit
                </button>
              </div>
              <button
                onClick={() => setManualInput(false)}
                className="text-gray-600 hover:text-gray-800"
              >
                Back to Scanner
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
