import React, { useEffect, useState } from 'react';
import { api, getApiHost, setApiHost, getToken, setToken, setUser, getSavedCartId, setSavedCartId, getSession } from './services/api';
import ProductCard from './components/ProductCard';
import Cart from './components/Cart';

export default function App(){
  const [apiHost, setHost] = useState(getApiHost());
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({});
  const [tokenPreview, setTokenPreview] = useState(getToken() ? (getToken().slice(0,24) + '...') : '(none)');
  const [username, setUsername] = useState(localStorage.getItem('rzp_username') || '(not logged in)');
  const [savedCartId, setSavedCartIdState] = useState(getSavedCartId() || '(none)');

  useEffect(() => { fetchProducts(); }, []);

  async function fetchProducts(){
    try{
      const res = await api.products();
      if(Array.isArray(res)) setProducts(res);
      else setProducts([]);
    } catch(e){ console.error(e); alert('Could not fetch products'); }
  }

  function saveHostClicked(){ setApiHost(apiHost); alert('API host saved'); }

  async function login(){
    const u = prompt('Username', 'admin');
    const p = prompt('Password', 'admin123');
    if(!u || !p) return;
    try{
      const res = await api.login(u,p);
      if(res && res.token){ setToken(res.token); setUser(res.username || null); setTokenPreview(res.token.slice(0,24)+'...'); setUsername(res.username || u); await fetchProducts(); alert('Login successful'); }
      else throw new Error('No token');
    }catch(e){ console.error(e); alert('Login failed'); }
  }

  function logout(){ setToken(null); setUser(null); setTokenPreview('(none)'); setUsername('(not logged in)'); alert('Logged out'); }

  function addToCart(product){ setCart(prev => { const copy = {...prev}; if(!copy[product.id]) copy[product.id] = { product, qty:0 }; copy[product.id].qty += 1; return copy; }); }
  function inc(id){ setCart(prev => { const copy = {...prev}; if(copy[id]) copy[id].qty += 1; return copy; }); }
  function dec(id){ setCart(prev => { const copy = {...prev}; if(copy[id]){ copy[id].qty = Math.max(0, copy[id].qty - 1); if(copy[id].qty === 0) delete copy[id]; } return copy; }); }

  function clearCart(){ setCart({}); }

  function computeTotals(){
    let sub = 0;
    let gst = 0;

    Object.values(cart).forEach(ci => {
      const price = Number(ci.product.salePrice ?? ci.product.price ?? 0);
      const taxRate = Number(ci.product.taxRate ?? 0);

      sub += price * ci.qty;
      gst += price * taxRate/100 * ci.qty; // accumulate numeric value
    });

    // round to 2 decimals for display/calculation
    const tax = Math.round(gst * 100) / 100;
    const grand = Math.round((sub + tax) * 100) / 100;

    return { sub, tax, grand };
  }


  async function saveCart(){
    try{
      const items = Object.values(cart).map(ci => ({ productId: Number(ci.product.id), quantity: Number(ci.qty), priceAtAdd: Number((ci.product.price || ci.product.salePrice || 0)) }));
      if(items.length === 0) return alert('Cart empty');
      const payload = { username: null, sessionId: getSession(), items };
      const res = await api.saveCart(payload);
      if(res && res.id){ setSavedCartId(res.id); setSavedCartIdState(res.id); alert('Cart saved: ' + res.id); }
    }catch(e){ console.error(e); alert('Save cart failed'); }
  }

  async function loadActiveCart(){
    try{
      const res = await api.loadActiveCart();
      if(res && Array.isArray(res.items)){
        const newCart = {};
        res.items.forEach(it => {
          const prod = products.find(p => p.id === it.productId);
          if(prod) newCart[prod.id] = { product: prod, qty: it.quantity };
        });
        setCart(newCart);
      }
    }catch(e){ console.error(e); alert('Load active cart failed'); }
  }

  async function checkout(){
    try{
      let cartResp = null;
      const saved = getSavedCartId();
      if(saved) cartResp = { id: saved };
      else cartResp = await (async ()=>{ const items = Object.values(cart).map(ci => ({ productId: Number(ci.product.id), quantity: Number(ci.qty), priceAtAdd: Number((ci.product.price || ci.product.salePrice || 0)) })); return await api.saveCart({ username:null, sessionId: getSession(), items }); })();
      const cartId = cartResp && cartResp.id;
      const { grand } = computeTotals();
      const amountPaise = Math.round(grand * 100);

      const appOrderId = await api.createAppOrder();
      const appId = appOrderId && (appOrderId.orderId || appOrderId.id || appOrderId.order_id);
      if(!appId) throw new Error('No app order id');

      const order = await api.createPaymentOrder({ amount: amountPaise, currency: 'INR', orderId: appId, receipt: 'order_' + appId });

      await loadRazorpayScript();

      const options = {
        key: 'rzp_test_GgMAe22ANeEPcW',
        amount: order.amount,
        currency: order.currency,
        order_id: order.providerOrderId,
        name: 'POS Shop',
        description: 'Payment for order ' + appId,
        handler: async function(response){
          try{
            const captureBody = Object.assign({}, response, { orderId: appId, cartId: cartId });
            const cap = await api.capturePayment(captureBody);
            if (cap && String(cap.status).toLowerCase() === 'paid'){
              alert('Payment captured successfully');
              setCart({}); setSavedCartId(null); setSavedCartIdState('(none)');
            } else alert('Capture failed');
          }catch(e){ console.error(e); alert('Capture failed'); }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function(err){ console.error('payment failed', err); alert('Payment failed: ' + (err.error && err.error.description)); });
      rzp.open();

    }catch(e){ console.error(e); alert('Checkout failed: ' + (e.message || e)); }
  }

  function loadRazorpayScript(){
    return new Promise((resolve, reject) => {
      if(window.Razorpay) return resolve();
      const s = document.createElement('script');
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('Razorpay script load failed'));
      document.body.appendChild(s);
    });
  }

  const totals = computeTotals();

  return (
    <div className="wrap">
      <div className="top">
        <h2>POS — Token persistence & immediate products fetch</h2>
        <div style={{marginLeft:'auto',display:'flex',gap:12,alignItems:'center'}}>
          <div>
            <label style={{display:'block',fontSize:12}}>API Host</label>
            <input style={{width:280}} value={apiHost} onChange={e => setHost(e.target.value)} />
          </div>
          <button onClick={saveHostClicked}>Save Host</button>
          <div className="panel" style={{padding:8,borderRadius:8,display:'flex',gap:8,alignItems:'center'}}>
            <div>
              <label style={{fontSize:12,display:'block'}}>Username</label>
              <input defaultValue="admin" style={{width:140}} />
            </div>
            <div>
              <label style={{fontSize:12,display:'block'}}>Password</label>
              <input type="password" defaultValue="admin123" style={{width:160}} />
            </div>
            <div><button onClick={login}>Login</button></div>
            <div><button onClick={logout} style={{background:'#e53e3e'}}>Logout</button></div>
          </div>
        </div>
      </div>

      <div style={{marginTop:8,display:'flex',gap:12,alignItems:'center'}}>
        <div className="muted">Logged in as: <span>{username}</span></div>
        <div className="muted">Token: <span>{tokenPreview}</span></div>
        <div className="muted">Saved Cart Id: <span>{savedCartId}</span></div>
      </div>

      <div className="grid">
        <div className="panel">
          <h3 style={{marginTop:0}}>Products</h3>
          <div style={{marginBottom:8}} className="row">
            <button onClick={fetchProducts}>Refresh</button>
            <button onClick={async ()=>{ try{ const t = getToken(); if(!t) return alert('No token'); const res = await api.products(); console.log('test auth', res); alert('Test Auth finished'); }catch(e){ alert('Test Auth failed'); } }} style={{background:'#805ad5'}}>Test Auth</button>
            <button onClick={loadActiveCart} style={{background:'#4a5568'}}>Load Active Cart</button>
            <button onClick={clearCart} style={{background:'#e53e3e'}}>Clear Cart</button>
          </div>
          <div className="products">
            {products.length === 0 ? <div className="muted">No products (or access denied)</div> : products.map(p => <ProductCard p={p} key={p.id} onAdd={addToCart} />)}
          </div>
        </div>

        <div className="panel">
          <h3 style={{marginTop:0}}>Cart</h3>
          <div id="cartContainer" style={{minHeight:120}}>
            <Cart cart={cart} onInc={inc} onDec={dec} />
          </div>
          <div style={{marginTop:8}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div><strong>Subtotal:</strong> ₹<span>{totals.sub.toFixed(2)}</span></div>
              <div><strong>Tax:</strong> ₹<span>{totals.tax.toFixed(2)}</span></div>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:6}}>
              <div><strong>Grand Total:</strong> ₹<span>{totals.grand.toFixed(2)}</span></div>
              <div>
                <button onClick={saveCart}>Save Cart</button>
                <button onClick={checkout} style={{marginLeft:8,background:'#2f855a'}}>Checkout</button>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
