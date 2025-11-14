// src/components/ProductCard.jsx
import React, { useEffect } from "react";

/**
 * ProductCard (debug-friendly)
 * Props:
 *  - p: product object
 *  - cart: cart object from parent (map[id] => { product, qty })
 *  - onAdd(product): add one (used when Add pressed)
 *  - onInc(id): increment by 1
 *  - onDec(id): decrement by 1 (if >1)
 *  - onRemove(id): remove from cart
 */
export default function ProductCard({ p = {}, cart = {}, onAdd, onInc, onDec, onRemove }) {
  // robust id resolution: support id, _id, sku as fallback
  const pid = p.id ?? p._id ?? p.sku ?? null;

  // price fallback
  const price = p.salePrice != null ? p.salePrice : p.price ?? 0;

  // defensive qty lookup
  const item = pid ? cart?.[pid] : null;
  const qty = Number(item?.qty || 0);

  // debug log (remove in production)
  useEffect(() => {
    // only log when something unexpected happens
    if (!pid) {
      console.warn(`[ProductCard] product missing id/_id/sku:`, p);
    }
  }, [pid, p]);

  return (
    <div className="product flex flex-col justify-between h-full">
      <div>
        <div className="text-sm font-semibold text-gray-900 line-clamp-2">{p.name || "Unnamed product"}</div>
        <div className="text-xs text-gray-500 mt-1">SKU: <span className="font-medium text-gray-700">{p.sku || '-'}</span></div>
        <div className="mt-2">
          <span className="text-base font-bold">₹ {Number(price).toLocaleString('en-IN')}</span>
          {p.mrp && p.mrp !== price && (
            <span className="text-xs text-gray-400 line-through ml-2">₹ {Number(p.mrp).toLocaleString('en-IN')}</span>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="mt-3">
        {!qty ? (
          // Add button: made visually obvious for debugging (border + full width)
          <button
            onClick={() => onAdd ? onAdd(p) : console.warn('[ProductCard] onAdd not provided', p)}
            className="w-full inline-flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-3 py-2 rounded shadow-sm border-2 border-yellow-300"
            aria-label={`Add ${p.name} to cart`}
            type="button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M7 4h-2l-1 2H1v2h2l3.6 7.59-1.35 2.45A1 1 0 0 0 6 19h12v-2H6.42a.25.25 0 0 1-.23-.15L6.1 16h9.45a1 1 0 0 0 .95-.68L19.92 8H7.21L7 6.5V4z"/>
            </svg>
            Add
          </button>
        ) : (
          <div className="flex items-center gap-2">
            {/* Minus or Delete */}
            {qty > 1 ? (
              <button
                onClick={() => onDec ? onDec(pid) : console.warn('[ProductCard] onDec not provided', pid)}
                className="inline-flex items-center justify-center w-10 h-10 rounded bg-white border hover:bg-gray-50 text-gray-800"
                aria-label={`Decrease quantity of ${p.name}`}
                type="button"
              >
                <span className="text-lg font-bold">−</span>
              </button>
            ) : (
              <button
                onClick={() => onRemove ? onRemove(pid) : console.warn('[ProductCard] onRemove not provided', pid)}
                className="inline-flex items-center justify-center w-10 h-10 rounded bg-white border hover:bg-gray-50 text-red-600"
                aria-label={`Remove ${p.name} from cart`}
                type="button"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M9 3h6l1 2h5v2H4V5h5l1-2zm2 6v8h2V9h-2zM7 9v8h2V9H7zm8 0v8h2V9h-2z"/>
                </svg>
              </button>
            )}

            {/* Quantity */}
            <div className="flex-1 text-center">
              <div className="text-sm font-semibold">{qty}</div>
            </div>

            {/* Plus */}
            <button
              onClick={() => onInc ? onInc(pid) : console.warn('[ProductCard] onInc not provided', pid)}
              className="inline-flex items-center justify-center w-10 h-10 rounded bg-blue-600 hover:bg-blue-700 text-white"
              aria-label={`Increase quantity of ${p.name}`}
              type="button"
            >
              <span className="text-lg font-bold">+</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
