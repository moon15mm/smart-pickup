'use client';

import Image from 'next/image';
import { formatPrice } from '@/lib/utils';
import type { Product } from '@smart-pickup/shared';

interface Props {
  product: Product;
  onAdd: () => void;
}

export function ProductCard({ product, onAdd }: Props) {
  const price = Number(product.salePrice ?? product.price);
  const originalPrice = product.salePrice ? Number(product.price) : null;

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex flex-col">
      <div className="relative h-36 bg-gray-100">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.nameAr}
            fill
            className="object-cover"
            sizes="50vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-gray-300">
            📦
          </div>
        )}
        {product.salePrice && (
          <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
            خصم
          </span>
        )}
        {product.stockQuantity === 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white text-xs font-bold bg-black/60 px-3 py-1 rounded-full">
              نفذت الكمية
            </span>
          </div>
        )}
      </div>

      <div className="p-3 flex flex-col flex-1">
        <p className="text-sm font-semibold text-gray-800 leading-tight mb-1 line-clamp-2">
          {product.nameAr}
        </p>

        <div className="mt-auto flex items-center justify-between">
          <div>
            <span className="text-blue-900 font-bold text-sm">{formatPrice(price)}</span>
            {originalPrice && (
              <span className="text-gray-400 text-xs line-through mr-1">
                {formatPrice(originalPrice)}
              </span>
            )}
          </div>

          <button
            disabled={product.stockQuantity === 0}
            onClick={onAdd}
            className="w-8 h-8 bg-blue-900 text-white rounded-full flex items-center justify-center text-lg font-bold disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-transform"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
