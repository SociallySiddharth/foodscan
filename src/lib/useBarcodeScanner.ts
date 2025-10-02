"use client";

import { useState, useEffect } from 'react';
import Quagga from 'quagga';

interface BarcodeScanResult {
  code: string;
  format: string;
}

interface BarcodeScanResult {
  code: string;
  format: string;
}

"use client";

export function useBarcodeScanner(scannerRef: React.RefObject<HTMLDivElement>) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<BarcodeScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scannerInitialized, setScannerInitialized] = useState(false);
  const [lastValidScan, setLastValidScan] = useState<string | null>(null);

  // Initialize Quagga configuration
  const config = {
    inputStream: {
      name: 'Live',
      type: 'LiveStream',
      target: scannerRef.current,
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

  // Initialize Quagga and handle scanning
  useEffect(() => {
    // Handle scan results
    Quagga.onDetected((result: any) => {
      const code = result.codeResult.code;
      const format = result.codeResult.format;

      // Validate and correct barcode
      const validCode = isValidBarcode(code);
      if (!validCode) {
        setError('Invalid barcode format');
        return;
      }

      // Only update if it's a new barcode
      if (validCode !== lastValidScan) {
        setLastValidScan(validCode);
        setScanResult({ code: validCode, format });
        Quagga.stop();
        setIsScanning(false);
      }
    });

    // Handle errors
    Quagga.onProcessed((result: any) => {
      if (result.boxes) {
        // Do something with the boxes
      }
    });

    // Initialize scanner
    const initializeScanner = () => {
      if (!scannerRef.current) {
        setError('Scanner container not found');
        return;
      }

      // Create a new config object with the target set
      const scannerConfig = {
        inputStream: {
          name: 'Live',
          type: 'LiveStream',
          target: scannerRef.current,
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

      Quagga.init(scannerConfig, (err: any) => {
        if (err) {
          setError(err.message);
          return;
        }
        setScannerInitialized(true);
        Quagga.start();
      });
    };

    initializeScanner();

    // Clean up
    return () => {
      if (scannerInitialized) {
        Quagga.stop();
      }
    };
  }, [scannerRef, config]);

  // Validate barcode format and attempt to correct common misreads
  const isValidBarcode = (code: string): string | false => {
    // Check if barcode is numeric
    if (!/^[0-9]+$/.test(code)) return false;

    // Check barcode length
    const length = code.length;
    if (length !== 8 && length !== 13) return false;

    // For EAN-13 barcodes, try to correct common misreads
    if (length === 13) {
      // Try to correct common misreads
      const correctedCodes = [
        // Handle specific misread pattern (821 -> 890)
        code.replace(/^821/, '890'),
        // Handle common leading digit misreads
        code.replace(/^01111/, '890'),
        code.replace(/^0111/, '890'),
        code.replace(/^011/, '890'),
        code.replace(/^01/, '890'),
        code.replace(/^0/, '890')
      ];

      // Check each corrected version
      for (const corrected of correctedCodes) {
        if (isValidEAN13(corrected)) {
          return corrected;
        }
      }

      // If none of the corrections work, check the original
      if (isValidEAN13(code)) {
        return code;
      }
    }

    // For EAN-8 barcodes
    if (length === 8) {
      if (isValidEAN8(code)) {
        return code;
      }
    }

    return false;
  };

  // Helper function to validate EAN-13 checksum
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

  // Helper function to validate EAN-8 checksum
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

  const startScan = () => {
    setError(null);
    setScanResult(null);
    if (scannerInitialized) {
      Quagga.start();
      setIsScanning(true);
    } else {
      setError('Scanner is not initialized yet');
    }
  };

  return {
    isScanning,
    scanResult,
    error,
    startScan
  };
}
}
