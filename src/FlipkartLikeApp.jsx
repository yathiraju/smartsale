import React, { useEffect, useState, useRef, useCallback } from 'react';
import { api, getToken, setToken, setUser, getSession } from './services/api';
import ProductCard from './components/ProductCard';
import Cart from './components/Cart';
import './App.css';

// =======================================================
// FlipkartLikeApp — Full Integrated POS + Flipkart UI
// =======================================================

export default function FlipkartLikeApp() {

  // ----------------------------
  // STATES
  // ----------------------------
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

  // ----------------------------
  // image URL
  // ----------------------------
  function imageUrlForSku(sku, ext = 'png') {
    if (!sku) return '/placeholder.png';
    const repoUser = 'yathiraju';
    const repo = 'smartsale-images';
    // Option A: use default branch (fast)
    // return `https://cdn.jsdelivr.net/gh/${repoUser}/${repo}/products/${encodeURIComponent(sku)}.${ext}`;

    // Option B: pin to a tag/commit to avoid caching surprises (recommended)
    const version = 'main'; // or 'v1.0.0' or commit-sha
    return `https://cdn.jsdelivr.net/gh/${repoUser}/${repo}@${version}/products/${encodeURIComponent(sku)}.${ext}`;
  }

  // ----------------------------
  // FETCH PRODUCTS
  // useCallback so it can be used safely in useEffect deps
  // ----------------------------
  const fetchProducts = useCallback(async () => {
    try {
      const res = await api.products();
      const list = Array.isArray(res) ? res : [];

      // add placeholder image based on SKU
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
  }, []); // stable, no external deps

  // ----------------------------
  // SEARCH
  // applySearch is stable via useCallback and depends on products & search
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

  // ----------------------------
  // EFFECTS
  // ----------------------------
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    applySearch();
  }, [applySearch]);

  // ----------------------------
  // LOGIN
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
  // SIGNUP
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

  function signupFieldChange(k, v) {
    setSignupData(prev => ({ ...prev, [k]: v }));
  }

  // ----------------------------
  // CART LOGIC
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

  function inc(id) {
    setCart(prev => {
      const c = { ...prev };
      if (c[id]) c[id] = { ...c[id], qty: c[id].qty + 1 };
      return c;
    });
  }

  function dec(id) {
    setCart(prev => {
      const c = { ...prev };
      if (c[id]) {
        const newQty = c[id].qty - 1;
        if (newQty > 0) c[id] = { ...c[id], qty: newQty };
        else delete c[id];
      }
      return c;
    });
  }

  function clearCart() {
    setCart({});
  }

  const totalItems = Object.values(cart).reduce((x, i) => x + i.qty, 0);

  // ----------------------------
  // GST + TOTALS
  // ----------------------------
  function computeTotals() {
    let sub = 0, gst = 0;
    Object.values(cart).forEach(ci => {
      const p = ci.product;
      const price = Number(p.salePrice ?? p.price ?? 0);
      const taxRate = Number(p.taxRate ?? 0);
      sub += price * ci.qty;
      gst += price * (taxRate / 100) * ci.qty;
    });
    const tax = Math.round(gst * 100) / 100;
    const grand = Math.round((sub + tax) * 100) / 100;
    return { sub, tax, grand };
  }
  const totals = computeTotals();

  // ----------------------------
  // SAVE CART → CHECKOUT → RZP ORDER → PAYMENT
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

  function removeFromCart(id) {
    setCart(prev => {
      const c = { ...prev };
      delete c[id];
      return c;
    });
  }

  async function pay() {
    if (paying) return;
    setPaying(true);

    try {
      const saved = await saveCart();
      if (!saved?.id) throw new Error('Cart not saved');

      const cartId = saved.id;
      const { grand } = totals;
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
      alert('Payment flow failed: ' + e.message);
    } finally {
      setPaying(false);
    }
  }


  // ----------------------------
  // RENDER
  // ----------------------------
  return (
    <div className="min-h-screen bg-gray-50">

      {/* HEADER */}
      <header className="bg-blue-600 text-white sticky top-0 z-20 shadow">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-4 py-3">

          {/* Logo */}
          <div className="flex items-center">
            <img
              src="/smartsale.png"
              alt="SmartSale"
              className="w-16 h-16 object-contain mr-2"   // small icon size; adjust as needed
              onError={(e) => { e.currentTarget.style.display = 'none'; }} // hide if missing
              aria-hidden={false}
            />
         {/*    <span className="text-white font-bold hidden sm:inline">SMARTSALE</span> */}
          </div>

          {/* Search */}
          <div className="flex-1">
            <div className="flex">
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full rounded-l px-3 py-1 text-black"
              />
              <button className="bg-yellow-400 text-black px-4 rounded-r" onClick={() => applySearch(search)}>Search</button>
            </div>
          </div>

          {/* Login / Logout */}
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

          {/* Cart */}
          <button
            className="bg-white text-blue-600 px-4 py-1 rounded"
            onClick={() => setIsCartOpen(true)}
          >
            Cart ({totalItems})
          </button>

        </div>
      </header>

      {/* MAIN GRID */}
      <main className="max-w-7xl mx-auto px-4 py-6">

        {/* Categories */}
        <div className="flex gap-3 overflow-x-auto pb-4">
          {['Electronics', 'Clothing', 'Grocery', 'Stationery', 'Drinks'].map(c => (
            <span key={c} className="px-3 py-1 bg-white rounded shadow">{c}</span>
          ))}
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(p => (
            <div key={p.id} className="bg-white p-3 rounded shadow hover:shadow-lg">
              {/* Image */}
              <img src={p.image} alt={p.name} className="w-full h-40 object-contain mb-2 rounded" />

              <ProductCard p={p} onAdd={addToCart} />
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
        open={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />

      {/* SIGNUP MODAL */}
      {showSignup && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <form
            onSubmit={signupSubmit}
            className="bg-white p-6 rounded shadow max-w-xl w-full"
          >
            <h2 className="text-xl font-bold mb-4">Create Account</h2>

            <div className="grid grid-cols-2 gap-3 text-black">
              {Object.keys(signupData).map(k => (
                <input
                  key={k}
                  placeholder={k}
                  value={signupData[k]}
                  onChange={(e) => signupFieldChange(k, e.target.value)}
                  className="border p-2 rounded"
                />
              ))}
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button type="button" onClick={() => setShowSignup(false)}>Cancel</button>
              <button type="submit" className="bg-green-500 text-white px-3 py-1 rounded">
                {signupLoading ? '...' : 'Sign Up'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
