// App.jsx (updated with Signup form)
import React, { useEffect, useState, useRef, useCallback, memo } from 'react';
import { api, getToken, setToken, setUser, getSavedCartId, setSavedCartId, getSession, getApiHost } from './services/api';
import ProductCard from './components/ProductCard';
import Cart from './components/Cart';
import logo from './logo.svg';
import './App.css';

const CART_LS_KEY = 'mobile_pos_cart_v1';

export default function App(){
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({});
  const [savedCartId, setSavedCartIdState] = useState(getSavedCartId() || '(none)');
  const [usernameDisplay, setUsernameDisplay] = useState(localStorage.getItem('rzp_username') || '');

  // uncontrolled inputs (refs) to avoid cursor loss
  const usernameRef = useRef(null);
  const passwordRef = useRef(null);

  const [paying, setPaying] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(getToken()));
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Signup modal state + controlled inputs for signup
  const [showSignup, setShowSignup] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupData, setSignupData] = useState({
    username: '', email: '', password: '', role: 'USER',
    name: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '', country: 'IN', lat: '', lng: ''
  });

  useEffect(() => {
    fetchProducts();
    try {
      const raw = localStorage.getItem(CART_LS_KEY);
      if (raw) setCart(JSON.parse(raw));
    } catch(e) { console.warn('Failed to parse cart from localStorage', e); }

    if (isLoggedIn) fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try { localStorage.setItem(CART_LS_KEY, JSON.stringify(cart)); } catch(e){ console.warn('Failed to save cart to localStorage', e); }
  }, [cart]);

  async function fetchProducts(){
    try{
      const res = await api.products();
      if(Array.isArray(res)) setProducts(res);
      else setProducts([]);
    } catch(e){ console.error(e); alert('Could not fetch products'); }
  }

  const fetchOrders = useCallback(async () => {
    if (!isLoggedIn) return;
    setOrdersLoading(true);
    try {
      let res = null;
      if (typeof api.getOrders === 'function') {
        res = await api.getOrders();
      } else if (typeof api.orders === 'function') {
        res = await api.orders();
      } else if (typeof api.fetchOrders === 'function') {
        res = await api.fetchOrders();
      }

      if (Array.isArray(res)) setOrders(res);
      else if (res && Array.isArray(res.orders)) setOrders(res.orders);
      else setOrders([]);
    } catch (e) {
      console.error('Fetch orders failed', e);
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  }, [isLoggedIn]);

  async function login(){
    const userName = String(usernameRef.current?.value || '').trim();
    const pwd = String(passwordRef.current?.value || '').trim();
    if(!userName || !pwd) return alert('Please enter username and password');

    try{
      const res = await api.login(userName, pwd);
      if(res && res.token){
        setToken(res.token);
        setUser(userName || null);
        try { localStorage.setItem('rzp_username', userName); } catch(_) {}
        setUsernameDisplay(userName);
        setIsLoggedIn(true);

        await fetchProducts();
        await fetchOrders();
        try { await loadActiveCart(); } catch(_) {}
      } else throw new Error('No token');
    }catch(e){ console.error(e); alert('Login failed'); }
    finally { if (passwordRef.current) passwordRef.current.value = ''; }
  }

  function logout(){
    setToken(null);
    setUser(null);
    setIsLoggedIn(false);
    setOrders([]);
    setUsernameDisplay('');
    try { localStorage.removeItem('rzp_username'); } catch(_) {}
  }

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
    let sub = 0; let gst = 0;
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
      if(items.length === 0) { alert('Cart empty'); return null; }
      const payload = { username: localStorage.getItem("rzp_username"), sessionId: getSession(), items };
      const res = await api.saveCart(payload);
      if(res && res.id){
        try { setSavedCartId(res.id); } catch(_) { }
        setSavedCartIdState(res.id);
        return res;
      }
      return res || null;
    }catch(e){ console.error(e); alert('Save cart failed'); return null; }
  }

  async function loadActiveCart(){
    try{ if (typeof api.loadActiveCart !== 'function') return; const res = await api.loadActiveCart();
      if(res && Array.isArray(res.items)){
        const newCart = {};
        res.items.forEach(it => { const prod = products.find(p => p.id === it.productId); if(prod) newCart[prod.id] = { product: prod, qty: it.quantity }; });
        setCart(newCart);
      }
    }catch(e){ console.error(e); alert('Load active cart failed'); }
  }

  function loadOrderIntoCart(order) {
    if (!order || !Array.isArray(order.items)) return alert('Order has no items to load');
    const newCart = {};
    order.items.forEach(it => {
      const prod = products.find(p => p.id === it.productId) || { id: it.productId, name: it.name || 'Item #' + it.productId, price: it.price || it.priceAtAdd || 0 };
      newCart[prod.id] = { product: prod, qty: it.quantity };
    });
    setCart(newCart);
  }

  async function pay(){
    if (paying) return; setPaying(true);
    try{
      const savedResp = await saveCart(); if(!savedResp || !savedResp.id) { setPaying(false); return; }
      const cartId = savedResp.id;
      const { grand } = computeTotals(); const amountPaise = Math.round(grand * 100);
      const appOrderId = await api.createAppOrder();
      const appId = appOrderId && (appOrderId.orderId || appOrderId.id || appOrderId.order_id);
      if(!appId) throw new Error('No app order id');
      const order = await api.createPaymentOrder({ amount: amountPaise, currency: 'INR', orderId: appId, receipt: 'order_' + appId });
      await loadRazorpayScript();
      const options = { key: process.env.REACT_APP_RZP_KEY, amount: order.amount, currency: order.currency, order_id: order.providerOrderId, name: 'Shop At Low price', description: 'Payment for order ' + appId,
        handler: async function(response){
          try{ const captureBody = Object.assign({}, response, { orderId: appId, cartId: cartId }); const cap = await api.capturePayment(captureBody);
            if (cap && String(cap.status).toLowerCase() === 'paid'){ alert('Payment captured successfully'); setCart({}); setSavedCartId(null); setSavedCartIdState('(none)'); } else alert('Capture failed');
          }catch(e){ console.error(e); alert('Capture failed'); }
        }
      };
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function(err){ console.error('payment failed', err); alert('Payment failed: ' + (err.error && err.error.description)); });
      rzp.open();
    }catch(e){ console.error('Pay failed', e); alert('Payment flow failed: ' + (e.message || e)); } finally { setPaying(false); }
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
  const totalItemsCount = Object.values(cart).reduce((sum, it) => sum + (it.qty || 0), 0);

  const goToOrders = useCallback(() => {
    const el = document.getElementById('ordersSection');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    else fetchOrders();
  }, [fetchOrders]);

  const Header = memo(function HeaderComponent(){
    return (
      <header className="app-header" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, padding:12, background:'#111827', color:'#fff', borderRadius:8, position:'relative' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <img src={logo} alt="Logo" style={{ height:48, width:'auto', userSelect:'none' }} />
          <div style={{ fontSize:18, fontWeight:700 }}>Shop At Low Price</div>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          {isLoggedIn && (
            <button onClick={goToOrders} style={{ background: '#2563eb', color: '#fff', padding: '8px 12px', borderRadius: 6 }}>Orders {orders && orders.length > 0 ? `(${orders.length})` : ''}</button>
          )}

          <div style={{ display:'flex', gap:8, alignItems:'center', padding:8, borderRadius:8, background: isLoggedIn ? 'transparent' : '#f3f4f6' }}>
            {!isLoggedIn ? (
              <>
                <div>
                  <label style={{ fontSize:12, display:'block', color:'#111' }}>Username</label>
                  <input id="login-username" ref={usernameRef} defaultValue={usernameDisplay} style={{ width:160, padding:6 }} autoComplete="username" />
                </div>

                <div>
                  <label style={{ fontSize:12, display:'block', color:'#111' }}>Password</label>
                  <input id="login-password" ref={passwordRef} type="password" defaultValue="" style={{ width:160, padding:6 }} autoComplete="current-password" />
                </div>

                <div>
                  <button onClick={login} style={{ padding: '8px 12px' }}>Login</button>
                </div>

                {/* Signup button: shown before login, disabled after login (controlled by isLoggedIn) */}
                <div>
                  <button onClick={() => setShowSignup(true)} disabled={isLoggedIn} style={{ padding: '8px 12px', background:'#10b981', color:'#fff', borderRadius:6 }}>Sign up</button>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize:14, color:'#fff', marginRight:8 }}>Signed in as <strong style={{ marginLeft:6 }}>{usernameDisplay || '(you)'}</strong></div>
                <button onClick={logout} style={{ background:'#e53e3e', color:'#fff', padding: '8px 12px', borderRadius: 6 }}>Logout</button>
              </>
            )}
          </div>
        </div>

      </header>
    );
  });

  // Signup form submit handler
  async function signupSubmit(e){
    e?.preventDefault?.();
    if (signupLoading) return;
    // basic validation
    if(!signupData.username || !signupData.email || !signupData.password) return alert('Please provide username, email and password');

    setSignupLoading(true);
    try{
      // build payload to match UserAddressDTO
      const payload = {
        users: { username: signupData.username, password: signupData.password, email: signupData.email, role: signupData.role },
        name: signupData.name,
        phone: signupData.phone,
        line1: signupData.line1,
        line2: signupData.line2,
        city: signupData.city,
        state: signupData.state,
        pincode: signupData.pincode,
        country: signupData.country || 'IN',
        lat: signupData.lat ? Number(signupData.lat) : null,
        lng: signupData.lng ? Number(signupData.lng) : null
      };

      const host = getApiHost().replace(/\/$/, '');
      const resRaw = await fetch(host + '/api/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      let res;
      try{ res = await resRaw.json(); }catch(e){ res = await resRaw.text(); }
      if(resRaw.ok){
        alert('Signup successful. You can now log in.');
        setShowSignup(false);
        // optional: prefill username field
        if(usernameRef.current) usernameRef.current.value = signupData.username;
      } else {
        console.error('Signup error', res);
        alert('Signup failed: ' + (res && res.message ? res.message : JSON.stringify(res)));
      }

    }catch(e){ console.error(e); alert('Signup request failed'); }
    finally { setSignupLoading(false); }
  }

  function signupFieldChange(k, v){ setSignupData(prev => ({ ...prev, [k]: v })); }

  return (
    <div className="wrap" style={{ padding:12 }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
        <Header />
      </div>

      <div className="grid" style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap:12 }}>
        <div className="panel" style={{ padding:12, borderRadius:8, background:'#fff' }}>
          <h3 style={{ marginTop:0 }}>Products</h3>

          {isLoggedIn && orders && orders.length > 0 && (
            <div id="ordersSection" style={{ marginBottom:12, padding:12, borderRadius:8, background:'#f8fafc' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                <strong>Your Orders</strong>
                <button onClick={fetchOrders} disabled={ordersLoading}>{ordersLoading ? 'Refreshing…' : 'Refresh'}</button>
              </div>
              <div style={{ maxHeight:220, overflow:'auto' }}>
                {orders.map(o => (
                  <div key={o.id || o.orderId} style={{ padding:8, borderRadius:8, marginBottom:8, border:'1px solid #e6e6e6', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div>
                      <div><strong>Order #{o.id || o.orderId}</strong></div>
                      <div style={{ fontSize:12, color:'#666' }}>{o.status || (o.state ? o.state : '')} • {o.items ? o.items.length : (o.itemCount || 0)} items</div>
                    </div>
                    <div style={{ display:'flex', gap:8 }}>
                      <button onClick={() => loadOrderIntoCart(o)}>Load to cart</button>
                      <button onClick={() => { navigator.clipboard?.writeText(String(o.id || o.orderId)); alert('Order id copied'); }}>Copy ID</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginBottom:8 }} className="row">
            <button onClick={fetchProducts}>Dry Fruits</button>
            <button onClick={async ()=>{ try{ const t = getToken(); if(!t) return alert('No token'); const res = await api.products(); console.log('test auth', res); }catch(e){ alert('Test Auth failed'); } }} style={{ background:'#805ad5' }}>Cloths</button>
            <button onClick={loadActiveCart} style={{ background:'#4a5568' }}>Electronics</button>
          </div>

          <div className="products">
            {products.length === 0 ? <div className="muted">No products (or access denied)</div> : products.map(p => <ProductCard p={p} key={p.id} onAdd={addToCart} />)}
          </div>
        </div>

        <div className="panel" style={{ padding:12, borderRadius:8, background:'#fff' }}>
          <h3 style={{ marginTop:0 }}>Cart 🛒 </h3>
          <div id="cartContainer" style={{ minHeight:120 }}>
            <Cart cart={cart} onInc={inc} onDec={dec} />
          </div>

          <div style={{ marginTop:8 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div><strong>Subtotal:</strong> ₹<span>{totals.sub.toFixed(2)}</span></div>
              <div><strong>Tax:</strong> ₹<span>{totals.tax.toFixed(2)}</span></div>
            </div>

            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, flexWrap: 'wrap', gap: 12 }}>
                <div style={{ fontSize: 15 }}>
                  <strong>Grand Total:</strong> ₹<span>{totals.grand.toFixed(2)}</span>
                </div>

                <div style={{ gap:12, display:'flex', alignItems:'center' }}>
                  <button className="cart-button cart-button--danger" onClick={clearCart} disabled={totalItemsCount === 0}>Clear Cart 🛒️</button>
                  <button onClick={pay} disabled={paying || totalItemsCount === 0}>{paying ? 'Processing…' : 'Pay 💳'}</button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Signup modal (simple inline modal) */}
      {showSignup && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}>
          <form onSubmit={signupSubmit} style={{ width:720, maxWidth:'95%', background:'#fff', padding:16, borderRadius:8 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <h3 style={{ margin:0 }}>Sign up</h3>
              <div>
                <button type="button" onClick={() => setShowSignup(false)} style={{ padding:'6px 10px' }}>Close</button>
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              <input placeholder="Username*" value={signupData.username} onChange={e => signupFieldChange('username', e.target.value)} />
              <input placeholder="Email*" value={signupData.email} onChange={e => signupFieldChange('email', e.target.value)} />
              <input placeholder="Password*" type="password" value={signupData.password} onChange={e => signupFieldChange('password', e.target.value)} />
              <input placeholder="Role (optional)" value={signupData.role} onChange={e => signupFieldChange('role', e.target.value)} />

              <input placeholder="Full name" value={signupData.name} onChange={e => signupFieldChange('name', e.target.value)} />
              <input placeholder="Phone" value={signupData.phone} onChange={e => signupFieldChange('phone', e.target.value)} />
              <input placeholder="Address line 1" value={signupData.line1} onChange={e => signupFieldChange('line1', e.target.value)} />
              <input placeholder="Address line 2" value={signupData.line2} onChange={e => signupFieldChange('line2', e.target.value)} />

              <input placeholder="City" value={signupData.city} onChange={e => signupFieldChange('city', e.target.value)} />
              <input placeholder="State" value={signupData.state} onChange={e => signupFieldChange('state', e.target.value)} />
              <input placeholder="Pincode" value={signupData.pincode} onChange={e => signupFieldChange('pincode', e.target.value)} />
              <input placeholder="Country" value={signupData.country} onChange={e => signupFieldChange('country', e.target.value)} />

              <input placeholder="Latitude" value={signupData.lat} onChange={e => signupFieldChange('lat', e.target.value)} />
              <input placeholder="Longitude" value={signupData.lng} onChange={e => signupFieldChange('lng', e.target.value)} />
            </div>

            <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:12 }}>
              <button type="button" onClick={() => setShowSignup(false)} disabled={signupLoading}>Cancel</button>
              <button type="submit" disabled={signupLoading} style={{ background:'#10b981', color:'#fff', padding:'8px 12px', borderRadius:6 }}>{signupLoading ? 'Signing…' : 'Create account'}</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
