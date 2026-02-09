import React, { useEffect } from "react";
import { FiTrash2 } from "react-icons/fi";
import { FaShoppingCart } from "react-icons/fa";


/**
 * ProductCard
 * Props:
 *  - p: product object
 *  - cart: cart object (map[id] => { product, qty })
 *  - onAdd(product)
 *  - onInc(id)
 *  - onDec(id)
 *  - onRemove(id)
 */
export default function ProductCard({
  p = {},
  cart = {},
  onAdd,
  onInc,
  onDec,
  onRemove
}) {
  // robust id resolution
  const pid = p.id ?? p._id ?? p.sku ?? null;

  // price resolution
  const price =
    p.salePrice != null
      ? p.salePrice
      : p.price != null
      ? p.price
      : 0;

  // cart qty
  const item = pid ? cart?.[pid] : null;
  const qty = Number(item?.qty || 0);

  // stock handling
  const stock = Number(p.stock ?? Infinity); // null = unlimited
  const isOutOfStock = stock <= 0;
  const isMaxReached = qty >= stock;

  // debug warning
  useEffect(() => {
    if (!pid) {
      console.warn("[ProductCard] Missing product id/sku", p);
    }
  }, [pid, p]);

  return (
    <div className="product flex flex-col justify-between h-full border rounded p-3 bg-white">
      {/* Product Info */}
      <div>
        <div className="text-sm font-semibold text-gray-900 line-clamp-2">
          {p.name || "Unnamed product"}
        </div>

        <div className="text-xs text-gray-500 mt-1">
          SKU:{" "}
          <span className="font-medium text-gray-700">
            {p.sku || "-"}
          </span>
        </div>

        <div className="mt-2">
          <span className="text-base font-bold">
            ₹ {Number(price).toLocaleString("en-IN")}
          </span>

          {p.mrp && p.mrp !== price && (
            <span className="text-xs text-gray-400 line-through ml-2">
              ₹ {Number(p.mrp).toLocaleString("en-IN")}
            </span>
          )}
        </div>

        {!isOutOfStock && stock !== Infinity && (
          <div className="text-xs text-green-600 mt-1">
            In stock: {stock}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-3">
        {isOutOfStock ? (
          // OUT OF STOCK
          <button
            disabled
            className="w-full bg-gray-300 text-gray-600 font-semibold px-3 py-2 rounded cursor-not-allowed border"
            type="button"
          >
            Out of Stock
          </button>
        ) : !qty ? (
          // ADD BUTTON
          <button
            onClick={() =>
              onAdd
                ? onAdd(p)
                : console.warn("[ProductCard] onAdd not provided", p)
            }
            className="w-full inline-flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-3 py-2 rounded shadow-sm border-2 border-yellow-300"
            type="button"
          >
            <FaShoppingCart className="w-4 h-4" />
            Add
          </button>
        ) : (
          // QTY CONTROLS
          <div className="flex items-center gap-2">
            {qty > 1 ? (
              <button
                onClick={() =>
                  onDec
                    ? onDec(pid)
                    : console.warn(
                        "[ProductCard] onDec not provided",
                        pid
                      )
                }
                className="w-10 h-10 rounded bg-white border hover:bg-gray-50 text-gray-800"
                type="button"
              >
                −
              </button>
            ) : (
              <button
                onClick={() =>
                  onRemove
                    ? onRemove(pid)
                    : console.warn("[ProductCard] onRemove not provided", pid)
                }
                className="inline-flex items-center justify-center w-10 h-10 rounded bg-white border hover:bg-gray-50 text-red-600"
                aria-label={`Remove ${p.name} from cart`}
                type="button"
              >
                <FiTrash2 className="w-4 h-4" />
              </button>

            )}

            <div className="flex-1 text-center font-semibold">
              {qty}
            </div>

            <button
              onClick={() =>
                onInc
                  ? onInc(pid)
                  : console.warn(
                      "[ProductCard] onInc not provided",
                      pid
                    )
              }
              disabled={isMaxReached}
              className={`w-10 h-10 rounded text-white ${
                isMaxReached
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
              type="button"
            >
              +
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
