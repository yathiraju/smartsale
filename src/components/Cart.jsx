import React from 'react';

export default function Cart({ cart, onInc, onDec }) {
  const items = Object.values(cart);

  if (items.length === 0) {
    return <div className="text-gray-500 text-sm">Cart is empty</div>;
  }

  return (
    <div className="space-y-4">
      {items.map(ci => {
        const p = ci.product;
        const price = Number(p.salePrice ?? p.price ?? 0);
        const image = `https://via.placeholder.com/80x80?text=${encodeURIComponent(
          p.sku || p.name || 'Item'
        )}`;
        const lineTotal = price * ci.qty;

        return (
          <div
            key={p.id}
            className="flex items-center gap-3 border-b pb-3"
          >
            {/* Image */}
            <img
              src={image}
              alt={p.name}
              className="w-16 h-16 object-contain rounded bg-gray-100"
            />

            {/* Product info */}
            <div className="flex-1">
              <div className="font-medium">{p.name}</div>

              <div className="text-sm text-gray-500">
                ₹ {price} × {ci.qty}
              </div>

              <div className="font-semibold mt-1">
                ₹ {lineTotal.toFixed(2)}
              </div>
            </div>

            {/* Qty controls */}
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => onInc(p.id)}
                className="px-2 py-1 border rounded text-sm"
              >
                +
              </button>

              <div className="text-sm">{ci.qty}</div>

              <button
                onClick={() => onDec(p.id)}
                className="px-2 py-1 border rounded text-sm"
              >
                −
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
