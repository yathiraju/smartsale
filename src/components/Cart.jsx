// src/components/Cart.jsx
import React, { useEffect } from 'react';

function fmtINR(v) {
  const n = Number(v || 0);
  if (!isFinite(n)) return '—';
  return n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

export default function Cart({
  cart = {},          // { [id]: { product, qty } }
  onInc,              // (id) => void
  onDec,              // (id) => void
  onRemove,           // (id) => void
  onPay,              // () => void
  onClear,            // () => void
  open,               // boolean -> render as overlay drawer when true
  onClose,            // () => void
}) {
  const items = Object.values(cart);


  const rows = items.map((ci) => {
    const p = ci.product || {};
    const unitPrice = p.salePrice != null ? Number(p.salePrice) : Number(p.price || 0);
    const qty = Number(ci.qty || 0);
    const taxRate = Number(p.taxRate || 0);

    const lineSubtotal = unitPrice * qty;
    const lineGST = (unitPrice * taxRate / 100) * qty;


    return {
      id: p.id,
      name: p.name || 'Item',
      unitPrice,
      qty,
      lineGST,
      lineTotal: lineSubtotal + lineGST,
    };
  });


  // Close on ESC when drawer is open
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Drawer wrapper
  const Wrapper = ({ children }) => {
    if (typeof open === 'boolean') {
      if (!open) return null;
      return (
        <div
          className="cart-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            justifyContent: 'flex-end',
            zIndex: 9999,
            overscrollBehavior: 'contain',
          }}
          onClick={(e) => {
            // click outside to close
            if (e.target === e.currentTarget) onClose?.();
          }}
        >
          <aside
            className="cart-drawer"
            style={{
              width: 420,
              maxWidth: '92vw',
              height: '100%',
              background: '#fff',
              boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
            }}
          >
            {children}
          </aside>
        </div>
      );
    }
    // Inline fallback (non-overlay)
    return (
      <aside
        className="cart-panel"
        style={{
          background: '#fff',
          borderRadius: 8,
          border: '1px solid #e5e7eb',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'min(80vh, 720px)', // keep footer visible in inline mode too
        }}
      >
        {children}
      </aside>
    );
  };

  // Heights to keep the footer in view:
  // header ~64px, footer ~150px -> body maxHeight leaves safe buffer
  const bodyMaxHeight = 'calc(100vh - 214px)';

  return (
    <Wrapper>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px',
          borderBottom: '1px solid #f1f5f9',
          flexShrink: 0,
        }}
      >
        <div style={{ fontWeight: 700 }}>Your Cart</div>
        {typeof open === 'boolean' && (
          <button
            onClick={onClose}
            aria-label="Close cart"
            title="Close"
            style={{
              appearance: 'none',
              background: 'transparent',
              border: 0,
              fontSize: 20,
              lineHeight: 1,
              width: 32,
              height: 32,
              borderRadius: 6,
              color: '#6b7280',
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        )}
      </div>

      {/* Scrollable body (only this section scrolls) */}
      <div
        style={{
          padding: 16,
          overflowY: 'auto',
          flex: 1,
          maxHeight: bodyMaxHeight, // ensures long lists scroll and footer stays visible
        }}
      >
        {rows.length === 0 ? (
          <div className="muted" style={{ color: '#6b7280' }}>Cart is empty</div>
        ) : (
          rows.map((r) => (
            <div
              key={r.id}
              style={{
                padding: '10px 0',
                borderBottom: '1px solid #f1f5f9',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, wordBreak: 'break-word' }}>{r.name}</div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                    ₹{fmtINR(r.unitPrice)} × {r.qty}
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>
                    GST: ₹{fmtINR(Math.round(r.lineGST))}
                  </div>
                </div>

                <div style={{ textAlign: 'right', minWidth: 72, fontWeight: 600 }}>
                  ₹{fmtINR(Math.round(r.lineTotal))}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginTop: 8,
                }}
              >
                <button
                  onClick={() => onDec?.(r.id)}
                  aria-label="decrease"
                  style={{ border: '1px solid #e5e7eb', borderRadius: 6, width: 28, height: 28 }}
                >
                  –
                </button>
                <div style={{ minWidth: 20, textAlign: 'center' }}>{r.qty}</div>
                <button
                  onClick={() => onInc?.(r.id)}
                  aria-label="increase"
                  style={{ border: '1px solid #e5e7eb', borderRadius: 6, width: 28, height: 28 }}
                >
                  +
                </button>

                <button
                  onClick={() => onRemove?.(r.id)}
                  title="Remove item"
                  style={{
                    marginLeft: 12,
                    fontSize: 12,
                    color: '#ef4444',
                    textDecoration: 'underline',
                    background: 'transparent',
                    border: 0,
                    cursor: 'pointer',
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Sticky footer (SECOND SECTION) with totals + Checkout & Clear Cart */}
      <div
        style={{
          borderTop: '1px solid #f1f5f9',
          padding: 16,
          background: '#fff',
          boxShadow: '0 -6px 12px rgba(0,0,0,0.04)',
          position: 'sticky',
          bottom: 0,
          zIndex: 1,
          flexShrink: 0,
        }}
      >
      </div>
    </Wrapper>
  );
}
