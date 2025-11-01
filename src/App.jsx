import React, { useEffect, useState } from 'react';
import { api, getToken, setToken, setUser, getSavedCartId, setSavedCartId, getSession } from './services/api';
import ProductCard from './components/ProductCard';
import Cart from './components/Cart';
import logo from './logo.svg';
import './App.css';

const CART_LS_KEY = 'mobile_pos_cart_v1';

export default function App(){
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({});
  // eslint-disable-next-line no-unused-vars
  const [username, setUsername] = useState(localStorage.getItem('rzp_username') || '(not logged in)');
  // eslint-disable-next-line no-unused-vars
  const [savedCartId, setSavedCartIdState] = useState(getSavedCartId() || '(none)');

  // load products and cart from localStorage on mount
  useEffect(() => {
    fetchProducts();
    try {
      const raw = localStorage.getItem(CART_LS_KEY);
      if (raw) setCart(JSON.parse(raw));
    } catch(e) { console.warn('Failed to parse cart from localStorage', e); }
  }, []);

  // persist cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(CART_LS_KEY, JSON.stringify(cart));
    } catch(e) { console.warn('Failed to save cart to localStorage', e); }
  }, [cart]);

  async function fetchProducts(){
    try{
      const res = await api.products();
      if(Array.isArray(res)) setProducts(res);
      else setProducts([]);
    } catch(e){ console.error(e); alert('Could not fetch products'); }
  }

  async function login(){
    const userInput = document.getElementById('login-username');
    const passwordInput = document.getElementById('login-password');

    if (!userInput || !passwordInput) {
      alert('Login fields not found in DOM');
      return;
    }

    const userName = userInput.value.trim();
    const password = passwordInput.value.trim();
    try{
      const res = await api.login(userName, password);
      if(res && res.token){
        setToken(res.token);
        setUser(userName || null);
        setUsername(userName || '(not logged in)');
        await fetchProducts();
      } else throw new Error('No token');
    }catch(e){ console.error(e); alert('Login failed'); }
  }

  function logout(){ setToken(null); setUser(null);  setUsername('(not logged in)'); }

  function addToCart(product) {
    setCart(prev => {
      const copy = { ...prev };
      const existing = copy[product.id];
      if (existing) {
        copy[product.id] = { ...existing, qty: existing.qty + 1 };
      } else {
        copy[product.id] = { product, qty: 1 };
      }
      return copy;
    });
  }

  function inc(id) {
    setCart(prev => {
      const copy = { ...prev };
      if (copy[id]) {
        const item = copy[id];
        copy[id] = { ...item, qty: item.qty + 1 };
      }
      return copy;
    });
  }

  function dec(id) {
    setCart(prev => {
      const copy = { ...prev };
      if (copy[id]) {
        const item = copy[id];
        const newQty = item.qty - 1;
        if (newQty > 0) {
          copy[id] = { ...item, qty: newQty };
        } else {
          delete copy[id];
        }
      }
      return copy;
    });
  }

  function clearCart(){ setCart({}); }

  function computeTotals(){
    let sub = 0;
    let gst = 0;

    Object.values(cart).forEach(ci => {
      const price = Number(ci.product.salePrice ?? ci.product.price ?? 0);
      const taxRate = Number(ci.product.taxRate ?? 0);

      sub += price * ci.qty;
      gst += price * taxRate/100 * ci.qty;
    });

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
      if(res && res.id){
        setSavedCartId(res.id);
        setSavedCartIdState(res.id);
      }
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

  // derive total count for badge
  const totalItemsCount = Object.values(cart).reduce((sum, it) => sum + (it.qty || 0), 0);

  function Header(){
    return (
      <header className="app-header" style={{display:'flex',alignItems:'center',gap:12,padding:12,background:'#111827',color:'#fff',borderRadius:8}}>
        <div style={{position:'relative',display:'inline-block'}}>
          <img src={logo} alt="Logo" style={{height:48,width:'auto'}} />
          { totalItemsCount > 0 && (
            <span style={{
              position:'absolute',
              right:-6,
              top:-6,
              minWidth:20,
              height:20,
              padding:'0 6px',
              borderRadius:10,
              display:'inline-flex',
              alignItems:'center',
              justifyContent:'center',
              background:'#ef4444',
              color:'#fff',
              fontSize:12,
              fontWeight:700
            }}>{totalItemsCount}</span>
          )}
        </div>
      </header>
    );
  }

  return (
    <div className="wrap" style={{padding:12}}>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
        <Header />
        <div style={{marginLeft:'auto',display:'flex',gap:12,alignItems:'center'}}>
          <div className="panel" style={{padding:8,borderRadius:8,display:'flex',gap:8,alignItems:'center'}}>
            <div>
              <label style={{fontSize:12,display:'block'}}>Username</label>
              <input id="login-username" defaultValue="" style={{width:140}} />
            </div>
            <div>
              <label style={{fontSize:12,display:'block'}}>Password</label>
              <input id="login-password" type="password" defaultValue="" style={{width:160}} />
            </div>
            <div><button onClick={login}>Login</button></div>
            <div><button onClick={logout} style={{background:'#e53e3e'}}>Logout</button></div>
          </div>
        </div>
      </div>

      <div className="grid" style={{display:'grid',gridTemplateColumns:'1fr 360px',gap:12}}>
        <div className="panel" style={{padding:12,borderRadius:8,background:'#fff'}}>
          <h3 style={{marginTop:0}}>Products</h3>
          <div style={{marginBottom:8}} className="row">
            <button onClick={fetchProducts}>Refresh</button>
            <button onClick={async ()=>{ try{ const t = getToken(); if(!t) return alert('No token'); const res = await api.products(); console.log('test auth', res); }catch(e){ alert('Test Auth failed'); } }} style={{background:'#805ad5'}}>Test Auth</button>
            <button onClick={loadActiveCart} style={{background:'#4a5568'}}>Load Active Cart</button>
            <button onClick={clearCart} style={{background:'#e53e3e'}}>Clear Cart</button>
          </div>
          <div className="products">
            {products.length === 0 ? <div className="muted">No products (or access denied)</div> : products.map(p => <ProductCard p={p} key={p.id} onAdd={addToCart} />)}
          </div>
        </div>

        <div className="panel" style={{padding:12,borderRadius:8,background:'#fff'}}>
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
