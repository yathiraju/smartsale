import React from 'react';

export default function Cart({ cart, onInc, onDec }){
  const items = Object.values(cart);
  if(items.length === 0) return <div className="muted">Cart is empty</div>;
  return (
    <>
      {items.map(ci => {
        const p = ci.product; const price = p.salePrice != null ? Number(p.salePrice) : Number(p.price);
        return (
          <div className="cart-item" key={p.id}>
            <div style={{flex:1}}>
              <div><strong>{p.name}</strong></div>
              <div className="muted">₹ {price}</div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <button onClick={() => onDec(p.id)}>-</button>
              <div>{ci.qty}</div>
              <button onClick={() => onInc(p.id)}>+</button>
            </div>
          </div>
        );
      })}
    </>
  );
}
