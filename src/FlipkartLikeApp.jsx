// src/App.jsx  (or wherever your FlipkartLikeApp lives)
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { api, getToken, setToken, setUser, getSession } from './services/api';
import ProductCard from './components/ProductCard';
import Cart from './components/Cart';
import './App.css';

export default function FlipkartLikeApp() {
  // STATES
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');

  const [cart, setCart] = useState({});
  const [isCartOpen, setIsCartOpen] = useState(false);

  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(getToken()));
  const [usernameDisplay, setUsernameDisplay] = useState(localStorage.getItem('rzp_username') || '');

  const usernameRef = useRef(null);
  const passwordRef = useRef(null);

  const [paying, setPaying] = useState(false);

  const [showSignup, setShowSignup] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupData, setSignupData] = useState({
    username: '', email: '', password: '', role: 'USER',
    name: '', phone: '', line1: '', line2: '', city: '', state: '',
    pincode: '', country: 'IN', lat: '', lng: ''
  });

  // NEW: selectedAddress & deliveryFee (kept in parent for reuse)
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [deliveryFee, setDeliveryFee] = useState(0);

  // UI state for address modals
  const [addrModalOpen, setAddrModalOpen] = useState(false);
  const [addrChoices, setAddrChoices] = useState([]); // multiple addresses returned from API
  const [manualAddr, setManualAddr] = useState({ line1: '', pincode: '' });
  const [addrLoading, setAddrLoading] = useState(false);

  // ----------------------------
  // image URL helper (unchanged)
  // ----------------------------
  function imageUrlForSku(sku, ext = 'png') {
    if (!sku) return '/placeholder.png';
    const repoUser = 'yathiraju';
    const repo = 'smartsale-images';
    const version = 'test';
    return `https://cdn.jsdelivr.net/gh/${repoUser}/${repo}@${version}/products/${encodeURIComponent(sku)}.${ext}`;
  }

  // ----------------------------
  // FETCH PRODUCTS
  // ----------------------------
  const fetchProducts = useCallback(async () => {
    try {
      const res = await api.products();
      const list = Array.isArray(res) ? res : [];
      const mapped = list.map(p => ({
        ...p,
        image: p.sku ? imageUrlForSku(p.sku) : `https://via.placeholder.com/300x300?text=${encodeURIComponent(p.name || 'Product')}`
      }));
      setProducts(mapped);
      setFiltered(mapped);
    } catch (e) {
      console.error(e);
      alert('Cannot load products');
    }
  }, []);

  // ----------------------------
  // SEARCH
  // ----------------------------
  const applySearch = useCallback((q = null) => {
    const query = q !== null ? String(q) : String(search);
    const s = String(query).trim().toLowerCase();
    if (!s) {
      setFiltered(products);
      return;
    }
    setFiltered(products.filter(p =>
      (String(p.name || '').toLowerCase().includes(s)) ||
      (p.sku && String(p.sku || '').toLowerCase().includes(s))
    ));
  }, [products, search]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { applySearch(); }, [applySearch]);

  // ----------------------------
  // LOGIN / LOGOUT (unchanged)
  // ----------------------------
  async function login() {
    const userName = String(usernameRef.current?.value || '').trim();
    const pwd = String(passwordRef.current?.value || '').trim();
    if (!userName || !pwd) return alert('Enter username and password');

    try {
      const res = await api.login(userName, pwd);
      if (res && res.token) {
        setToken(res.token);
        setUser(userName);
        localStorage.setItem('rzp_username', userName);
        setUsernameDisplay(userName);
        setIsLoggedIn(true);
        await fetchProducts();
      } else throw new Error('No token');
    } catch (e) {
      console.error(e);
      alert('Login failed');
    }
  }

  function logout() {
    setToken(null);
    setUser(null);
    setIsLoggedIn(false);
    setUsernameDisplay('');
    try { localStorage.removeItem('rzp_username'); } catch (_) {}
  }

  // ----------------------------
  // SIGNUP (unchanged)
  // ----------------------------
  async function signupSubmit(e) {
    e.preventDefault();
    if (signupLoading) return;
    if (!signupData.username || !signupData.email || !signupData.password)
      return alert('Provide username, email, password');

    setSignupLoading(true);
    try {
      const payload = {
        users: {
          username: signupData.username,
          password: signupData.password,
          email: signupData.email,
          role: signupData.role
        },
        name: signupData.name,
        phone: signupData.phone,
        line1: signupData.line1,
        line2: signupData.line2,
        city: signupData.city,
        state: signupData.state,
        pincode: signupData.pincode,
        country: signupData.country,
        lat: signupData.lat ? Number(signupData.lat) : null,
        lng: signupData.lng ? Number(signupData.lng) : null
      };

      const host = api.getApiHost?.() || 'http://localhost:8080';
      const resRaw = await fetch(host + '/api/signup', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      let res;
      try { res = await resRaw.json(); }
      catch { res = await resRaw.text(); }

      if (resRaw.ok) {
        alert('Signup successful. You can now log in.');
        setShowSignup(false);
        if (usernameRef.current) usernameRef.current.value = signupData.username;
      } else {
        alert('Signup failed: ' + (res?.message || JSON.stringify(res)));
      }
    } catch (e) {
      console.error(e);
      alert('Signup request failed');
    } finally {
      setSignupLoading(false);
    }
  }
  function signupFieldChange(k, v) { setSignupData(prev => ({ ...prev, [k]: v })); }

  // ----------------------------
  // CART LOGIC (unchanged)
  // ----------------------------
  function addToCart(product) {
    setCart(prev => {
      const copy = { ...prev };
      const item = copy[product.id];
      if (item) copy[product.id] = { product, qty: item.qty + 1 };
      else copy[product.id] = { product, qty: 1 };
      return copy;
    });
  }
  function inc(id) { setCart(prev => { const c = { ...prev }; if (c[id]) c[id] = { ...c[id], qty: c[id].qty + 1 }; return c; }); }
  function dec(id) { setCart(prev => { const c = { ...prev }; if (c[id]) { const newQty = c[id].qty - 1; if (newQty > 0) c[id] = { ...c[id], qty: newQty }; else delete c[id]; } return c; }); }
  function clearCart() { setCart({}); }
  function removeFromCart(id) { setCart(prev => { const c = { ...prev }; delete c[id]; return c; }); }

  const totalItems = Object.values(cart).reduce((x, i) => x + i.qty, 0);

  // ----------------------------
  // COMPUTE WEIGHT (for shipping)
  // ----------------------------
  function computeCartWeight() {
    // Use product.weight if available (in kg). fallback 0.5 kg per item.
    let sum = 0;
    Object.values(cart).forEach(ci => {
      const w = Number(ci?.product?.weight ?? 0.5); // assume 0.5 kg if missing
      sum += w * ci.qty;
    });
    return sum;
  }

  // ----------------------------
  // SAVE CART & PAYMENT (unchanged, but pay reads deliveryFee from parent)
  // ----------------------------
  async function saveCart() {
    try {
      const items = Object.values(cart).map(ci => ({
        productId: ci.product.id,
        quantity: ci.qty,
        priceAtAdd: ci.product.salePrice ?? ci.product.price
      }));
      if (items.length === 0) return null;

      const username = localStorage.getItem('rzp_username');
      const payload = { username, sessionId: getSession(), items };

      const res = await api.saveCart(payload);
      return res;
    } catch (e) {
      console.error(e);
      alert('Save cart failed');
      return null;
    }
  }

  async function pay() {
    if (paying) return;
    setPaying(true);

    try {
      const saved = await saveCart();
      if (!saved?.id) throw new Error('Cart not saved');

      const cartId = saved.id;
      // compute totals on server; client uses totals with deliveryFee included
      // compute totals here (same logic as Cart component)
      const sub = Object.values(cart).reduce((s, ci) => {
        const price = Number(ci.product.salePrice ?? ci.product.price ?? 0);
        return s + price * ci.qty;
      }, 0);
      const gst = Object.values(cart).reduce((g, ci) => {
        const price = Number(ci.product.salePrice ?? ci.product.price ?? 0);
        const taxRate = Number(ci.product.taxRate ?? 0);
        return g + (price * (taxRate / 100) * ci.qty);
      }, 0);
      const tax = Math.round(gst * 100) / 100;
      const grand = Math.round((sub + tax + (deliveryFee || 0)) * 100) / 100;

      const amountPaise = Math.round(grand * 100);

      const appOrder = await api.createAppOrder();
      const appId = appOrder?.orderId || appOrder?.id;
      if (!appId) throw new Error('No internal order ID');

      const rzpOrder = await api.createPaymentOrder({
        amount: amountPaise,
        currency: 'INR',
        orderId: appId,
        receipt: 'order_' + appId
      });

      // load and open Razorpay as before...
      await loadRazorpayScript();

      const rzp = new window.Razorpay({
        key: process.env.REACT_APP_RZP_KEY,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        order_id: rzpOrder.providerOrderId,
        name: 'Shop At Low Price',
        description: 'Order ' + appId,
        handler: async (response) => {
          try {
            const body = { ...response, orderId: appId, cartId };
            const cap = await api.capturePayment(body);
            if (cap && String(cap.status).toLowerCase() === 'paid') {
              alert('Payment successful');
              clearCart();
              setIsCartOpen(false);
            } else {
              alert('Capture failed');
            }
          } catch (e) {
            console.error(e);
            alert('Capture failed');
          }
        }
      });

      rzp.on('payment.failed', (err) => {
        console.error(err);
        alert('Payment failed: ' + err.error.description);
      });

      rzp.open();

    } catch (e) {
      console.error(e);
      alert('Payment flow failed: ' + (e.message || e));
    } finally {
      setPaying(false);
    }
  }

  // helper to load Razorpay script (copied)
  function loadRazorpayScript() {
    return new Promise((resolve, reject) => {
      if (window.Razorpay) return resolve();
      const s = document.createElement('script');
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.onload = resolve;
      s.onerror = () => reject(new Error('Razorpay failed'));
      document.body.appendChild(s);
    });
  }

  // ----------------------------
  // NEW: Buy Now flow (called from Cart)
  // ----------------------------
  async function handleBuyNow() {
    // 1) require login
    if (!isLoggedIn) {
      alert('Please sign in to buy now.');
      // reveal login inputs so user can sign in quickly
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setAddrLoading(true);
    try {
      const username = localStorage.getItem('rzp_username') || usernameDisplay;
      if (!username) {
        alert('Username not found. Please log in again.');
        setIsLoggedIn(false);
        return;
      }

      // fetch addresses
      const host = api.getApiHost?.() || 'http://localhost:8080';
      const resRaw = await fetch(`${host}/api/user/address/${encodeURIComponent(username)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      let resp;
      try { resp = await resRaw.json(); } catch { resp = null; }

      if (resRaw.ok && Array.isArray(resp) && resp.length > 0) {
        // show selection modal
        setAddrChoices(resp);
        setAddrModalOpen(true);
      } else {
        // no addresses: ask for manual entry (at minimum need pincode)
        setManualAddr({ line1: '', pincode: '' });
        setAddrChoices([]);
        setAddrModalOpen(true);
      }
    } catch (err) {
      console.error('Fetch addresses failed', err);
      alert('Failed to fetch addresses. Please enter address manually.');
      setAddrChoices([]);
      setManualAddr({ line1: '', pincode: '' });
      setAddrModalOpen(true);
    } finally {
      setAddrLoading(false);
    }
  }

  // called when user selects an address object or submits manual address
  async function onAddressChosen(addr) {
    setAddrModalOpen(false);
    // store for future use
    setSelectedAddress(addr);

    // compute weight
    const weight = computeCartWeight();

    // call shipping availability API
    try {
      const host = api.getApiHost?.() || 'http://localhost:8080';
      const body = {
        pickup_postcode: null,
        delivery_postcode: addr.pincode || addr.pincode || addr.postalCode || addr.zip || addr.pincode,
        cod: 0,
        weight: Number(weight || 0)
      };

      const respRaw = await fetch(`${host}/api/shipping/check/availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      let shippingResp;
      try { shippingResp = await respRaw.json(); } catch { shippingResp = null; }

      // Try to read totalPayable from common shapes
      let fee = 0;
      if (!shippingResp) {
        fee = 0;
      } else if (typeof shippingResp.totalPayable === 'number') {
        fee = shippingResp.totalPayable;
      } else if (typeof shippingResp.total_payable === 'number') {
        fee = shippingResp.total_payable;
      } else if (shippingResp.data && typeof shippingResp.data.totalPayable === 'number') {
        fee = shippingResp.data.totalPayable;
      } else if (shippingResp.data && typeof shippingResp.data.total_payable === 'number') {
        fee = shippingResp.data.total_payable;
      } else if (shippingResp.total && typeof shippingResp.total === 'number') {
        fee = shippingResp.total;
      } else {
        // best effort: try to find nested courier choice
        try {
          const candidate = shippingResp.available_courier_companies?.[0] || shippingResp.data?.available_courier_companies?.[0];
          if (candidate && (candidate.totalPayable || candidate.total_payable || candidate.total)) {
            fee = Number(candidate.totalPayable ?? candidate.total_payable ?? candidate.total);
          }
        } catch (_) { /* ignore */ }
      }

      fee = Number(isNaN(fee) ? 0 : fee);
      setDeliveryFee(fee);

      // show cart drawer (with updated totals)
      setIsCartOpen(true);

      if (fee > 0) {
        alert(`Delivery fee ₹${fee.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} added.`);
      } else {
        alert('Delivery not available or free. Proceed to checkout.');
      }

    } catch (err) {
      console.error('Shipping check failed', err);
      alert('Shipping check failed. Please try again.');
    }
  }

  // UI helpers for address modal actions
  function chooseAddrFromList(a) { onAddressChosen(a); }
  function submitManualAddr() {
    if (!manualAddr.pincode) return alert('Please enter delivery pincode');
    const addr = { line1: manualAddr.line1 || '', pincode: manualAddr.pincode };
    onAddressChosen(addr);
  }

  // ----------------------------
  // RENDER
  // ----------------------------
  return (
    <div className="min-h-screen bg-gray-50">

      {/* HEADER */}
      <header className="bg-blue-600 text-white sticky top-0 z-20 shadow">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-4 py-3">

          <div className="flex items-center">
            <img src="/smartsale.png" alt="SmartSale" className="w-16 h-16 object-contain mr-2" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          </div>

          <div className="flex-1">
            <div className="flex">
              <input type="text" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} className="w-full rounded-l px-3 py-1 text-black" />
              <button className="bg-yellow-400 text-black px-4 rounded-r" onClick={() => applySearch(search)}>Search</button>
            </div>
          </div>

          {!isLoggedIn ? (
            <div className="flex items-center gap-3">
              <input ref={usernameRef} placeholder="Username" className="text-black px-2 py-1 rounded" />
              <input ref={passwordRef} type="password" placeholder="Password" className="text-black px-2 py-1 rounded" />
              <button onClick={login} className="bg-white text-blue-600 px-3 py-1 rounded">Login</button>
              <button onClick={() => setShowSignup(true)} className="bg-green-500 text-white px-3 py-1 rounded">Sign Up</button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span>Hello, <b>{usernameDisplay}</b></span>
              <button onClick={logout} className="bg-white text-red-600 px-3 py-1 rounded">Logout</button>
            </div>
          )}

          <button className="bg-white text-blue-600 px-4 py-1 rounded" onClick={() => setIsCartOpen(true)}>
            Cart 🛒({totalItems})
          </button>
        </div>
      </header>

      {/* MAIN GRID */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-3 overflow-x-auto pb-4">
          {['Electronics', 'Clothing', 'Grocery', 'Stationery', 'Drinks'].map(c => (<span key={c} className="px-3 py-1 bg-white rounded shadow">{c}</span>))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(p => (
            <div key={p.id ?? p._id ?? p.sku} className="bg-white p-3 rounded shadow hover:shadow-lg flex flex-col h-full">
              <div className="flex-none">
                <img src={p.image} alt={p.name} className="w-full h-40 object-contain mb-2 rounded" />
              </div>
              <div className="flex-1">
                <ProductCard p={p} cart={cart} onAdd={addToCart} onInc={inc} onDec={dec} onRemove={removeFromCart} />
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* CART DRAWER */}
      <Cart
        cart={cart}
        onInc={inc}
        onDec={dec}
        onRemove={removeFromCart}
        onPay={pay}
        onBuyNow={handleBuyNow}       // NEW: pass buy handler
        open={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        deliveryFee={deliveryFee}     // NEW: show delivery fee
        selectedAddress={selectedAddress}
      />

      {/* SIGNUP MODAL */}
      {showSignup && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <form onSubmit={signupSubmit} className="bg-white p-6 rounded shadow max-w-xl w-full">
            <h2 className="text-xl font-bold mb-4">Create Account</h2>
            <div className="grid grid-cols-2 gap-3 text-black">
              {Object.keys(signupData).map(k => (
                <input key={k} placeholder={k} value={signupData[k]} onChange={(e) => signupFieldChange(k, e.target.value)} className="border p-2 rounded" />
              ))}
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button type="button" onClick={() => setShowSignup(false)}>Cancel</button>
              <button type="submit" className="bg-green-500 text-white px-3 py-1 rounded">{signupLoading ? '...' : 'Sign Up'}</button>
            </div>
          </form>
        </div>
      )}

      {/* ADDRESS SELECTION / MANUAL ENTRY MODAL */}
      {addrModalOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow max-w-lg w-full">
            <h3 className="text-lg font-bold mb-3">Choose delivery address</h3>

            {addrLoading && <div>Loading addresses...</div>}

            {!addrLoading && Array.isArray(addrChoices) && addrChoices.length > 0 && (
              <div className="space-y-2 max-h-64 overflow-auto">
                {addrChoices.map((a, idx) => (
                  <div key={idx} className="p-3 border rounded flex justify-between items-center">
                    <div>
                      <div className="font-semibold">{a.name || a.users?.username || `Address ${idx + 1}`}</div>
                      <div className="text-sm text-gray-600">{a.line1}{a.line2 ? ', ' + a.line2 : ''} • {a.city} • {a.pincode}</div>
                    </div>
                    <div>
                      <button onClick={() => chooseAddrFromList(a)} className="bg-blue-600 text-white px-3 py-1 rounded">Select</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!addrLoading && (!addrChoices || addrChoices.length === 0) && (
              <div>
                <div className="text-sm text-gray-600 mb-2">No saved addresses. Enter delivery address (pincode required).</div>
                <div className="grid grid-cols-1 gap-2">
                  <input placeholder="Address line 1" value={manualAddr.line1} onChange={e => setManualAddr(prev => ({ ...prev, line1: e.target.value }))} className="border p-2 rounded" />
                  <input placeholder="Pincode" value={manualAddr.pincode} onChange={e => setManualAddr(prev => ({ ...prev, pincode: e.target.value }))} className="border p-2 rounded" />
                </div>
                <div className="flex justify-end gap-2 mt-3">
                  <button onClick={() => setAddrModalOpen(false)} className="px-3 py-1">Cancel</button>
                  <button onClick={submitManualAddr} className="bg-blue-600 text-white px-3 py-1 rounded">Use this address</button>
                </div>
              </div>
            )}

            <div className="text-right mt-4">
              <button onClick={() => setAddrModalOpen(false)} className="text-sm text-gray-500">Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
