import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface BarcodeInputProps {
  onBarcodeScanned?: (barcode: string) => void;
}

export default function BarcodeInput({ onBarcodeScanned }: BarcodeInputProps) {
  const [barcode, setBarcode] = useState('');
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numeric input
    if (/^[0-9]*$/.test(value)) {
      setBarcode(value);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (barcode.length === 8 || barcode.length === 13) {
      // Validate barcode length
      if (onBarcodeScanned) {
        onBarcodeScanned(barcode);
      } else {
        // Navigate to product page
        router.push(`/product/${barcode}`);
      }
    } else {
      alert('Please enter a valid barcode (8 or 13 digits)');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="relative">
        <input
          type="text"
          value={barcode}
          onChange={handleInputChange}
          placeholder="Enter barcode manually"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          maxLength={13}
        />
        <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500">
          {barcode.length}/13
        </span>
      </div>
      <button
        type="submit"
        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        disabled={barcode.length !== 8 && barcode.length !== 13}
      >
        Search Product
      </button>
    </form>
  );
}
