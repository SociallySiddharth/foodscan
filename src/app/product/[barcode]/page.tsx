'use client';

interface Product {
  barcode: number;
  id: number;
  name: string;
  category: string;
  energy: number;
  carbohydrate: number;
  sugar: number;
  fat: number;
  protein: number;
  sodium: number;
  productimage: string;
}

interface ProductRating {
  score: number;
  rating: number;
  highlights: string[];
  ratingDetails: {
    calories: number;
    fat: number;
    sodium: number;
    sugar: number;
  };
}

interface Alternative {
  barcode: number;
  id: number;
  name: string;
  category: string;
  energy: number;
  carbohydrate: number;
  sugar: number;
  fat: number;
  protein: number;
  sodium: number;
  productimage: string;
}

interface Params {
  barcode: string;
}

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, testSupabaseConnection } from '@/lib/supabase';
import type { ReactNode } from 'react';
import { calculateProductRating, findAlternatives } from '@/lib/productScoring';

function ProductPage({ params }: { params: Params }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [alternatives, setAlternatives] = useState<Alternative[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState<ProductRating | null>(null);

  const fetchProductData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Convert string barcode to number
      const barcodeNum = parseInt(params.barcode);
      if (isNaN(barcodeNum)) {
        throw new Error('Invalid barcode format');
      }
      
      // Fetch product data from Supabase
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('barcode', barcodeNum)
        .single();

      if (productError) {
        if (productError.code === 'PGRST116') {
          throw new Error('Product not found in database');
        }
        throw productError;
      }

      if (!productData) {
        throw new Error('No product data returned');
      }
      
      // Transform data to match our interface
      const transformedProduct = {
        ...productData,
        // Convert numeric values to numbers
        energy: productData.energy ? Number(productData.energy) : 0,
        carbohydrate: productData.carbohydrate ? Number(productData.carbohydrate) : 0,
        sugar: productData.sugar ? Number(productData.sugar) : 0,
        fat: productData.fat ? Number(productData.fat) : 0,

        sodium: productData.sodium ? Number(productData.sodium) : 0
      };
      
      // Calculate product rating
      const productRating = calculateProductRating(transformedProduct);
      
      setProduct(transformedProduct);
      setRating(productRating);

      // Fetch alternatives
      const { data: alternativesData, error: alternativesError } = await supabase
        .from('products')
        .select('*')
        .eq('category', productData?.category)
        .neq('barcode', barcodeNum)
        .limit(3);

      if (alternativesError) throw alternativesError;
      
      const transformedAlternatives = alternativesData?.map(product => ({
        ...product,
        // Convert numeric values to numbers
        energy: product.energy ? Number(product.energy) : 0,
        carbohydrate: product.carbohydrate ? Number(product.carbohydrate) : 0,
        sugar: product.sugar ? Number(product.sugar) : 0,
        fat: product.fat ? Number(product.fat) : 0,

        sodium: product.sodium ? Number(product.sodium) : 0
      })) || [];
      
      const filteredAlternatives = findAlternatives(
        transformedAlternatives,
        transformedProduct,
        transformedProduct.category
      ).map((product: any) => ({
        barcode: Number(product.barcode) || 0,
        id: Number(product.id) || 0,
        name: product.name ?? '',
        category: product.category ?? '',
        energy: Number(product.energy) || 0,
        carbohydrate: Number(product.carbohydrate) || 0,
        sugar: Number(product.sugar) || 0,
        fat: Number(product.fat) || 0,
        protein: Number(product.protein) || 0,
        sodium: Number(product.sodium) || 0,
        productimage: product.productimage ?? '',
      }));
      setAlternatives(filteredAlternatives);
    } catch (error: any) {
      console.error('Error fetching product data:', error);
      setError(error.message || 'An error occurred while fetching product data');
      setProduct(null);
      setAlternatives([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!params?.barcode) return;
    
    fetchProductData();
  }, [params]);

  if (typeof window === 'undefined') {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                fetchProductData();
              }
            }}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center p-8 bg-red-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-red-700">Product Not Found</h2>
          <p className="text-gray-600">We couldn't find information for this product.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg">
          {/* Product Header */}
          <div className="p-6 border-b flex flex-col md:flex-row items-center justify-between">
            <div className="md:w-1/3">
              {product.productimage && (
                <img 
                  src={product.productimage} 
                  alt={product.name}
                  className="w-full h-64 object-contain rounded-lg"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.src = '/placeholder-product.png';
                  }}
                />
              )}
            </div>
            <div className="md:w-2/3">
              <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
              <p className="text-gray-600 mb-4">{product.category}</p>
              
              {/* Product Rating */}
              <div className="flex items-center gap-4 mb-4">
                <div className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold bg-blue-100 text-blue-700">
                  {rating?.rating}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-gray-600">Overall Rating</span>
                  {rating?.highlights && rating.highlights.length > 0 && (
                    <div className="flex gap-2 mt-1">
                      {rating.highlights.map((highlight: string, index: number) => (
                        <span key={index} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                          {highlight}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Nutrition Score */}
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold bg-gray-100 text-gray-700">
                  {product.energy} kcal
                </div>
              </div>
            </div>
          </div>

          {/* Rating Breakdown */}
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold mb-4">Rating Breakdown</h2>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(rating?.ratingDetails || {}).map(([nutrient, score]) => (
                <div key={nutrient} className="flex justify-between items-center border-b py-2">
                  <span className="text-gray-600 capitalize">{nutrient}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{score}/100</span>
                    <div className="w-24 h-2 bg-gray-200 rounded-full">
                      <div 
                        className="h-2 bg-blue-500 rounded-full transition-all duration-300"
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Nutrition Facts */}
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Nutrition Facts</h2>
            <div className="grid grid-cols-2 gap-4">
              {product.energy > 0 && (
                <div className="flex justify-between items-center border-b py-2">
                  <span className="text-gray-600">Energy</span>
                  <span className="font-semibold">{product.energy} kcal</span>
                </div>
              )}
              {product.carbohydrate > 0 && (
                <div className="flex justify-between items-center border-b py-2">
                  <span className="text-gray-600">Carbohydrate</span>
                  <span className="font-semibold">{product.carbohydrate}g</span>
                </div>
              )}
              {product.sugar > 0 && (
                <div className="flex justify-between items-center border-b py-2">
                  <span className="text-gray-600">Sugar</span>
                  <span className="font-semibold">{product.sugar}g</span>
                </div>
              )}
              {product.fat > 0 && (
                <div className="flex justify-between items-center border-b py-2">
                  <span className="text-gray-600">Fat</span>
                  <span className="font-semibold">{product.fat}g</span>
                </div>
              )}
              {product.protein > 0 && (
                <div className="flex justify-between items-center border-b py-2">
                  <span className="text-gray-600">Protein</span>
                  <span className="font-semibold">{product.protein}g</span>
                </div>
              )}
              {product.sodium > 0 && (
                <div className="flex justify-between items-center border-b py-2">
                  <span className="text-gray-600">Sodium</span>
                  <span className="font-semibold">{product.sodium}mg</span>
                </div>
              )}
            </div>
          </div>
          {/* Alternative Products */}
          <div className="p-6 border-t">
            <h2 className="text-xl font-bold mb-4">Alternative Products</h2>
            {alternatives.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {alternatives.map((alternative) => (
                  <div key={alternative.barcode} className="bg-white rounded-lg shadow">
                    <div className="p-4">
                      {alternative.productimage && (
                        <img 
                          src={alternative.productimage} 
                          alt={alternative.name}
                          className="w-full h-32 object-contain rounded-lg mb-4"
                          onError={(e) => {
                            const img = e.target as HTMLImageElement;
                            img.src = '/placeholder-product.png';
                          }} 
                        />
                      )}
                      <h3 className="font-semibold mb-2">{alternative.name}</h3>
                      <p className="text-gray-600 mb-4">{alternative.category}</p>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold bg-gray-100 text-gray-700">
                          {Math.round(alternative.energy)} kcal
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-600">No better alternatives found. This is the best-rated product in its category.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
export default ProductPage;