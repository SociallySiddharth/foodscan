"use client";

import { useState, useRef, useEffect } from 'react';
import Quagga from 'quagga';

interface ScanResult {
  code: string;
  format: string;
}

interface BarcodeScannerProps {
  onScanSuccess: (result: ScanResult) => void;
}

export default function BarcodeScanner({ onScanSuccess }: BarcodeScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startScan = () => {
    setError(null);
    if (!scannerRef.current) {
      setError('Scanner container not found');
      return;
    }

    // Enhanced Quagga configuration
    const config = {
      inputStream: {
        name: 'Live',
        type: 'LiveStream',
        target: scannerRef.current,
        constraints: {
          width: { min: 1920 },  // Higher resolution
          height: { min: 1080 },
          facingMode: 'environment',
          aspectRatio: { min: 1.3333333333333333, max: 1.7777777777777777 },
          advanced: {
            // Improve lighting conditions
            brightness: { min: 0.1, max: 0.9 },
            contrast: { min: 0.2, max: 0.8 },
            exposureMode: 'manual',
            exposureCompensation: 0.5
          }
        }
      },
      decoder: {
        readers: [
          {
            format: 'ean_reader',
            config: {
              tryHarder: true,
              multiple: false,
              resultFunction: (code: any) => {
                // Validate barcode format
                if (!/^[0-9]+$/.test(code.code)) {
                  return null;
                }
                
                // Validate barcode length (EAN-13 or EAN-8)
                if (code.code.length !== 13 && code.code.length !== 8) {
                  return null;
                }
                
                // Validate checksum for EAN-13
                if (code.code.length === 13) {
                  const sum = code.code
                    .slice(0, -1)
                    .split('')
                    .map(Number)
                    .reduce((acc, digit, index) => {
                      return acc + digit * (index % 2 === 0 ? 1 : 3);
                    }, 0);
                  const checkDigit = (10 - (sum % 10)) % 10;
                  if (Number(code.code.slice(-1)) !== checkDigit) {
                    return null;
                  }
                }
                
                // Validate checksum for EAN-8
                if (code.code.length === 8) {
                  const sum = code.code
                    .slice(0, -1)
                    .split('')
                    .map(Number)
                    .reduce((acc, digit, index) => {
                      return acc + digit * (index % 2 === 0 ? 3 : 1);
                    }, 0);
                  const checkDigit = (10 - (sum % 10)) % 10;
                  if (Number(code.code.slice(-1)) !== checkDigit) {
                    return null;
                  }
                }
                
                return code;
              }
            }
          }
        ],
        debug: {
          drawBoundingBox: true,
          drawScanline: true
        }
      }
    };

    Quagga.init(config, (err) => {
      if (err) {
        setError(err.message);
        return;
      }

      // Handle scan results
      let lastValidScan: string | null = null;
      Quagga.onDetected((result) => {
        const code = result.codeResult.code;
        const format = result.codeResult.format;

        // Only process if it's a new scan
        if (code !== lastValidScan) {
          lastValidScan = code;
          onScanSuccess({ code, format });
          Quagga.stop();
          setIsScanning(false);
        }
      });

      // Handle errors
      Quagga.onProcessed((result) => {
        if (result.boxes) {
          // Do something with the boxes
        }
      });

      setIsScanning(true);
      Quagga.start();
    });
  };

  useEffect(() => {
    return () => {
      Quagga.stop();
    };
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={startScan}
            className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <div ref={scannerRef} className="relative h-[400px]">
        {isScanning && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-white">
              <h2 className="text-xl font-bold mb-2">Scanning...</h2>
              <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={startScan}
          disabled={isScanning}
          className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
        >
          {isScanning ? 'Scanning...' : 'Start Scan'}
        </button>
      </div>
    </div>
  );
}
