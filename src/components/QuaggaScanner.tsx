"use client";

import { useState, useEffect, useRef } from 'react';
import Quagga from 'quagga';
import BarcodeInput from './BarcodeInput';
import type { Result } from 'quagga';

interface ScannerProps {
  onScanSuccess: (code: string) => void;
}

export default function QuaggaScanner({ onScanSuccess }: ScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [lastValidScan, setLastValidScan] = useState<string | null>(null);

  const config: Quagga.Config = {
    inputStream: {
      name: 'Live',
      type: 'LiveStream',
      target: scannerRef.current || document.createElement('div'),
      constraints: {
        width: { min: 640 },
        height: { min: 480 },
        facingMode: "environment",
        aspectRatio: { min: 1, max: 1.78 }
      }
    },
    decoder: {
      readers: ['ean_reader'],
      debug: {
        drawBoundingBox: true,
        drawScanline: true,
        showFrequency: false,
        drawScanlinePosition: false
      }
    }
  };

  const initializeScanner = () => {
    if (!scannerRef.current) {
      setError('Scanner container not found');
      return;
    }

    Quagga.init(config, (err: Error | null) => {
      if (err) {
        setError(`Scanner initialization failed: ${err.message}`);
        console.error('Scanner initialization error:', err);
        return;
      }
      
      console.log('Scanner initialized successfully');
      setDebugInfo('Scanner initialized');
      
      Quagga.start();
    });
  };

  useEffect(() => {
    if (isScanning) {
      console.log('Starting scanner...');
      
      // Initialize scanner
      initializeScanner();

      // Set up detection callback
      Quagga.onDetected((result: any) => {
        console.log('Barcode detected:', result);
        const code = result.codeResult.code;

        // Validate and correct barcode
        const validCode = isValidBarcode(code);
        if (!validCode) {
          setError('Invalid barcode format');
          return;
        }

        // Only update if it's a new barcode
        if (validCode !== lastValidScan) {
          console.log('Valid barcode scanned:', validCode);
          setLastValidScan(validCode);
          onScanSuccess(validCode);
          try {
            Quagga.stop();
          } catch (error) {
            console.error('Error stopping scanner after success:', error);
          }
          setIsScanning(false);
        }
      });
    } else {
      // Stop scanner when not scanning
      try {
        if (Quagga && Quagga.stop) {
          Quagga.stop();
        }
      } catch (error) {
        console.error('Error stopping scanner:', error);
      }
    }

    return () => {
      console.log('Cleaning up scanner...');
      try {
        if (Quagga && Quagga.stop) {
          Quagga.stop();
        }
      } catch (error) {
        console.error('Error stopping scanner:', error);
      }
    };
  }, [isScanning, onScanSuccess]);

  const isValidEAN13 = (code: string): boolean => {
    if (code.length !== 13) return false;
    
    const sum = code
      .slice(0, -1)
      .split('')
      .map(Number)
      .reduce((acc, digit, index) => {
        return acc + digit * (index % 2 === 0 ? 1 : 3);
      }, 0);
    const checkDigit = (10 - (sum % 10)) % 10;
    return Number(code.slice(-1)) === checkDigit;
  };

  const isValidEAN8 = (code: string): boolean => {
    if (code.length !== 8) return false;
    
    const sum = code
      .slice(0, -1)
      .split('')
      .map(Number)
      .reduce((acc, digit, index) => {
        return acc + digit * (index % 2 === 0 ? 3 : 1);
      }, 0);
    const checkDigit = (10 - (sum % 10)) % 10;
    return Number(code.slice(-1)) === checkDigit;
  };

  const isValidBarcode = (code: string): string | null => {
    const cleanedCode = code.replace(/\D/g, '');

    if (cleanedCode.length === 13 && isValidEAN13(cleanedCode)) {
      return cleanedCode;
    }

    if (cleanedCode.length === 8 && isValidEAN8(cleanedCode)) {
      return cleanedCode;
    }

    if (cleanedCode.length === 13) {
      if (cleanedCode.startsWith('821')) {
        const corrected = '890' + cleanedCode.substring(3);
        if (isValidEAN13(corrected)) {
          return corrected;
        }
      }

      if (cleanedCode.startsWith('01111')) {
        const corrected = '890' + cleanedCode.substring(5);
        if (isValidEAN13(corrected)) {
          return corrected;
        }
      }
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="p-4 bg-white rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-2">Barcode Scanner</h2>
            <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
              <div ref={scannerRef} />
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setIsScanning(true)}
                disabled={isScanning}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isScanning ? 'Scanning...' : 'Start Scanning'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { QuaggaScanner };
