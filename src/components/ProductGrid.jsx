import React from 'react';
import ProductCard from './ProductCard';

export default function ProductGrid({ products, loading, size, cart, onAdd, onInc, onDec, onRemove }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: size > 0 ? Math.min(size, 8) : 8 }).map((_, i) => (
          <div key={i} className="bg-white p-3 rounded shadow animate-pulse h-64" />
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map(p => (
        <div key={p.id ?? p._id ?? p.sku} className="bg-white p-3 rounded shadow hover:shadow-lg flex flex-col h-full">
          <div className="flex-none">
            <img src={p.image} alt={p.name} className="w-full h-40 object-contain mb-2 rounded" />
          </div>
          <div className="flex-1">
            <ProductCard p={p} cart={cart} onAdd={onAdd} onInc={onInc} onDec={onDec} onRemove={onRemove} />
          </div>
        </div>
      ))}
    </div>
  );
}
