import React from 'react';

export default function ProductCard({ p, onAdd }){
  const price = p.salePrice != null ? p.salePrice : p.price;
  return (
    <div className="product">
      <div><strong>{p.name}</strong></div>
      <div className="muted">₹ {price}</div>
      <div style={{marginTop:8}}>
        <button onClick={() => onAdd(p)}>Add</button>
      </div>
    </div>
  );
}
