// src/components/Cart.jsx
import React, { useEffect } from 'react';

function fmtINR(v, digits = 2) {
  const n = Number(v ?? 0);
  if (!isFinite(n)) return '—';
  return n.toLocaleString('en-IN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export default function Cart({
  cart = {},
  onInc,
  onDec,
  onRemove,
  onPay,
  open,
  onClose,
}) {
  const items = Object.values(cart);

  // Close on Escape only when used as a drawer
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const Wrapper = ({ children }) => {
    if (typeof open === 'boolean') {
      if (!open) return null;
      return (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            justifyContent: 'flex-end',
            zIndex: 9999,
          }}
        >
          <aside
            style={{
              width: 420,
              maxWidth: '92vw',
              height: '100vh',
              background: '#fff',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {children}
          </aside>
        </div>
      );
    }
    return (
      <aside
        style={{
          background: '#fff',
          borderRadius: 8,
          border: '1px solid #e5e7eb',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '100vh',
        }}
      >
        {children}
      </aside>
    );
  };

  // ✅ Totals with per-item taxRate (your logic)
  function computeTotals() {
    let sub = 0;
    let gst = 0;
    Object.values(cart).forEach((ci) => {
      const price = Number(ci?.product?.salePrice ?? ci?.product?.price ?? 0);
      const taxRate = Number(ci?.product?.taxRate ?? 0);
      sub += price * ci.qty;
      gst += (price * taxRate) / 100 * ci.qty;
    });
    const tax = Math.round(gst * 100) / 100;
    const grand = Math.round((sub + tax) * 100) / 100;
    return { sub, tax, grand };
  }

  const { sub: subtotal, tax: gst, grand } = computeTotals();

  return (
    <Wrapper>
      {/* Header */}
      <div
        style={{
          padding: 16,
          borderBottom: '1px solid #f1f5f9',
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        Your Cart
      </div>

      {/* Single scroll area */}
      <div style={{ padding: 16, overflowY: 'auto', flex: 1 }}>
        {items.length === 0 ? (
          <div style={{ color: '#6b7280' }}>Cart is empty</div>
        ) : (
          items.map((ci) => {
            const p = ci.product || {};
            const id = p.id;
            const unitPrice = Number(p.salePrice ?? p.price ?? 0);
            const lineTotal = unitPrice * ci.qty;

            return (
              <div
                key={id}
                style={{ padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>
                      ₹{fmtINR(unitPrice)} × {ci.qty}
                      {p.taxRate != null && (
                        <span> • GST {Number(p.taxRate)}%</span>
                      )}
                    </div>
                  </div>
                  <div style={{ fontWeight: 600 }}>₹{fmtINR(lineTotal)}</div>
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
                  <button type="button" onClick={() => onDec?.(id)} style={{ width: 28 }}>
                    –
                  </button>
                  <div style={{ width: 24, textAlign: 'center' }}>{ci.qty}</div>
                  <button type="button" onClick={() => onInc?.(id)} style={{ width: 28 }}>
                    +
                  </button>

                  <button
                    type="button"
                    onClick={() => onRemove?.(id)}
                    style={{
                      marginLeft: 12,
                      fontSize: 12,
                      color: '#ef4444',
                      textDecoration: 'underline',
                      background: 'transparent',
                      border: 0,
                      cursor: 'pointer',
                      padding: 0,
                    }}
                    aria-label={`Remove ${p.name}`}
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer (always visible) */}
      <div
        style={{
          padding: 16,
          borderTop: '1px solid #f1f5f9',
          boxShadow: '0 -6px 12px rgba(0,0,0,0.04)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ color: '#374151' }}>Subtotal:</span>
          <strong>₹{fmtINR(subtotal)}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ color: '#374151' }}>GST:</span>
          <strong>₹{fmtINR(gst)}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontWeight: 700 }}>Total:</span>
          <strong style={{ fontWeight: 800 }}>₹{fmtINR(grand)}</strong>
        </div>
        <button
          type="button"
          onClick={onPay}
          style={{
            width: '100%',
            padding: '12px 14px',
            fontWeight: 700,
            borderRadius: 8,
            border: 0,
            background: '#111827',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          Checkout
        </button>
      </div>
    </Wrapper>
  );
}
