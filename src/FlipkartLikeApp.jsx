// FlipkartLikeApp.jsx
// Layout reference image: /mnt/data/layout1.png

import React, { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { api, getToken, setToken, setUser, getSession } from './services/api';
import ProductCard from './components/ProductCard';
import Cart from './components/Cart';
import './App.css';

export default function FlipkartLikeApp() {
  // ----------------------------
  // STATES
  // ----------------------------
  const [products, setProducts] = useState([]);
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

  // NEW: address & shipping state
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [shippingChecked, setShippingChecked] = useState(false);

  // address modal UI
  const [addrModalOpen, setAddrModalOpen] = useState(false);
  const [addrChoices, setAddrChoices] = useState([]);
  const [manualAddr, setManualAddr] = useState({ line1: '', pincode: '' });
  const [addrLoading, setAddrLoading] = useState(false);

  // ----------------------------
  // PAGINATION / SERVER-SEARCH STATE
  // ----------------------------
  const [page, setPage] = useState(0);        // zero-based page
  const [size, setSize] = useState(20);       // items per page
  const [sort, setSort] = useState('name,asc');
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Axios controller refs for cancellation
  const productsCtrlRef = useRef(null);
  const signupCtrlRef = useRef(null);
  const addrCtrlRef = useRef(null);
  const shippingCtrlRef = useRef(null);

  // ----------------------------
  // image URL helper (stable)
  // ----------------------------
  const imageUrlForSku = useCallback((sku, ext = 'png') => {
    if (!sku) return '/placeholder.png';
    const repoUser = 'yathiraju';
    const repo = 'smartsale-images';
    const version = 'test';
    return `https://cdn.jsdelivr.net/gh/${repoUser}/${repo}@${version}/products/${encodeURIComponent(sku)}.${ext}`;
  }, []);

  // ----------------------------
  // Helper: base axios instance for host (stable)
  // ----------------------------
  const getHttp = useCallback(() => {
    const host = api.getApiHost?.() || 'http://localhost:8080';
    return axios.create({ baseURL: host, timeout: 30000 });
  }, []);

  // ----------------------------
  // FETCH PRODUCTS (paged, axios + AbortController)
  // stable useCallback so effect deps are safe
  // ----------------------------
 // ---------- corrected fetchProducts ----------
 const fetchProducts = useCallback(async ({ q = '', p, s, sortBy } = {}) => {
   setLoadingProducts(true);

   // cancel previous products request
   if (productsCtrlRef.current) {
     try { productsCtrlRef.current.abort(); } catch (_) {}
   }
   const ctrl = new AbortController();
   productsCtrlRef.current = ctrl;
   const http = getHttp();

   try {
     // Use provided params, fallback to safe defaults (do NOT read outer page/size/sort)
     const pageNum = Math.max(0, Number(p ?? 0));
     const sizeNum = Math.max(1, Number(s ?? 20));
     const sortParam = sortBy || 'name,asc';

     const params = {
       page: pageNum,
       size: sizeNum,
       sort: sortParam
     };
     if (q && String(q).trim()) params.query = String(q).trim();

     const res = await http.get('/api/products/page', { params, signal: ctrl.signal });
     const data = res.data;

     const list = Array.isArray(data?.content) ? data.content : [];
     const mapped = list.map(pObj => ({
       ...pObj,
       image: pObj.sku ? imageUrlForSku(pObj.sku) : `https://via.placeholder.com/300x300?text=${encodeURIComponent(pObj.name || 'Product')}`
     }));

     setProducts(mapped);
     setTotalPages(Number(data?.totalPages ?? 0));
     setTotalElements(Number(data?.totalElements ?? 0));
     setPage(Number(data?.number ?? pageNum)); // use returned page number or the requested one
   } catch (err) {
     const isCanceled = err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError' || axios.isCancel?.(err);
     if (!isCanceled) {
       console.error('fetchProducts failed', err);
       alert('Cannot load products (server error)');
     }
   } finally {
     setLoadingProducts(false);
     productsCtrlRef.current = null;
   }
 }, [getHttp, imageUrlForSku]);
 // ---------- end corrected fetchProducts ----------


  // ----------------------------
  // DEBOUNCE SEARCH (calls server)
  // ----------------------------
  useEffect(() => {
    const tid = setTimeout(() => {
      setPage(0);
      fetchProducts({ q: search, p: 0, s: size, sortBy: sort });
    }, 350);
    return () => clearTimeout(tid);
  }, [search, size, sort, fetchProducts]);

  // Re-fetch when page/size/sort changes (user clicks)
  useEffect(() => {
    fetchProducts({ q: search, p: page, s: size, sortBy: sort });
  }, [page, size, sort, fetchProducts, search]);

  // ----------------------------
  // LOGIN / LOGOUT
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
        fetchProducts({ q: search, p: 0, s: size, sortBy: sort });
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
    setSelectedAddress(null);
    setDeliveryFee(0);
    setShippingChecked(false);
  }

  // ----------------------------
  // SIGNUP (axios)
  // ----------------------------
  async function signupSubmit(e) {
    e.preventDefault();
    if (signupLoading) return;
    if (!signupData.username || !signupData.email || !signupData.password)
      return alert('Provide username, email, password');

    setSignupLoading(true);

    // cancel previous signup call if any
    if (signupCtrlRef.current) {
      try { signupCtrlRef.current.abort(); } catch (_) {}
    }
    const ctrl = new AbortController();
    signupCtrlRef.current = ctrl;
    const http = getHttp();

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

      const res = await http.post('/api/signup', payload, { signal: ctrl.signal, headers: { 'Content-Type': 'application/json' } });
      if (res.status >= 200 && res.status < 300) {
        alert('Signup successful. You can now log in.');
        setShowSignup(false);
        if (usernameRef.current) usernameRef.current.value = signupData.username;
      } else {
        alert('Signup failed: ' + JSON.stringify(res.data || res.statusText || res.status));
      }
    } catch (err) {
      const isCanceled = err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError' || axios.isCancel?.(err);
      if (!isCanceled) {
        console.error('Signup request failed', err);
        alert('Signup request failed');
      }
    } finally {
      setSignupLoading(false);
      signupCtrlRef.current = null;
    }
  }
  function signupFieldChange(k, v) { setSignupData(prev => ({ ...prev, [k]: v })); }

  // ----------------------------
  // CART LOGIC (mutations reset shipping state)
  // ----------------------------
  function resetShippingState() {
    setShippingChecked(false);
    setDeliveryFee(0);
    setSelectedAddress(null);
  }

  function addToCart(product) {
    setCart(prev => {
      const copy = { ...prev };
      const item = copy[product.id];
      if (item) copy[product.id] = { product, qty: item.qty + 1 };
      else copy[product.id] = { product, qty: 1 };
      return copy;
    });
    resetShippingState();
  }

  function inc(id) {
    setCart(prev => {
      const c = { ...prev };
      if (c[id]) c[id] = { ...c[id], qty: c[id].qty + 1 };
      return c;
    });
    resetShippingState();
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
    resetShippingState();
  }

  function removeFromCart(id) {
    setCart(prev => {
      const c = { ...prev };
      delete c[id];
      return c;
    });
    resetShippingState();
  }

  function clearCart() {
    setCart({});
    resetShippingState();
  }

  const totalItems = Object.values(cart).reduce((x, i) => x + i.qty, 0);

  // ----------------------------
  // COMPUTE WEIGHT (for shipping)
  // ----------------------------
  function computeCartWeight() {
    let sum = 0;
    Object.values(cart).forEach(ci => {
      const w = Number(ci?.product?.weight ?? 0.5); // default 0.5 kg per item
      sum += w * ci.qty;
    });
    return sum;
  }

  // ----------------------------
  // SAVE CART & PAYMENT (unchanged uses api helper)
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

  async function pay() {
    if (paying) return;
    setPaying(true);

    try {
      const saved = await saveCart();
      if (!saved?.id) throw new Error('Cart not saved');

      const cartId = saved.id;
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

      await loadRazorpayScript();

      const rzp = new window.Razorpay({
        key: process.env.REACT_APP_RZP_KEY,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        order_id: rzpOrder.providerOrderId,
        name: 'Shop At Smart Sale',
        description: 'Order ' + appId,
        handler: async (response) => {
          try {
            const body = { ...response, orderId: appId, cartId };
            const cap = await api.capturePayment(body);
            if (cap && String(cap.status).toLowerCase() === 'paid') {
              alert('Order Placed successful');
              clearCart();
              setIsCartOpen(false);
            } else {
              alert('Payment failed');
            }
          } catch (e) {
            console.error(e);
            alert('Payment failed');
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

  // ----------------------------
  // Utilities
  // ----------------------------
  function isValidPincode(pin) {
    return /^[1-9][0-9]{5}$/.test(String(pin || '').trim());
  }

  // ----------------------------
  // BUY NOW & ADDRESS FLOW (axios)
  // ----------------------------
  async function handleBuyNow() {
    if (!isLoggedIn) {
      alert('Please sign in to buy now.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setAddrLoading(true);

    // cancel previous addr request
    if (addrCtrlRef.current) {
      try { addrCtrlRef.current.abort(); } catch (_) {}
    }
    const ctrl = new AbortController();
    addrCtrlRef.current = ctrl;
    const http = getHttp();

    try {
      const username = localStorage.getItem('rzp_username') || usernameDisplay;
      if (!username) {
        alert('Username not found. Please log in again.');
        setIsLoggedIn(false);
        return;
      }

      const res = await http.get(`/api/user/address/${encodeURIComponent(username)}`, { signal: ctrl.signal });
      const resp = res.data;

      if (Array.isArray(resp) && resp.length > 0) {
        const hasValid = resp.some(a => isValidPincode(a?.pincode));
        if (!hasValid) {
          setAddrChoices([]);
          setManualAddr({ line1: '', pincode: '' });
          setAddrModalOpen(true);
        } else {
          setAddrChoices(resp);
          setAddrModalOpen(true);
        }
      } else {
        setAddrChoices([]);
        setManualAddr({ line1: '', pincode: '' });
        setAddrModalOpen(true);
      }
    } catch (err) {
      const isCanceled = err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError' || axios.isCancel?.(err);
      if (!isCanceled) {
        console.error('Fetch addresses failed', err);
        alert('Failed to fetch addresses. Please enter address manually.');
        setAddrChoices([]);
        setManualAddr({ line1: '', pincode: '' });
        setAddrModalOpen(true);
      }
    } finally {
      setAddrLoading(false);
      addrCtrlRef.current = null;
    }
  }



  async function onAddressChosen(addr) {
    const pincode = addr?.pincode || addr?.postalCode || addr?.zip;
    if (!isValidPincode(pincode)) {
      alert('Selected address has invalid/missing pincode. Please enter a valid 6-digit pincode.');
      setManualAddr({ line1: addr?.line1 || addr?.name || '', pincode: '' });
      setAddrChoices([]);
      setAddrModalOpen(true);
      return;
    }

    setAddrModalOpen(false);
    const normalized = { ...addr, pincode: String(pincode).trim(), line1: addr?.line1 || addr?.name || '' };
    setSelectedAddress(normalized);

    const weight = computeCartWeight();

    // cancel previous shipping check
    if (shippingCtrlRef.current) {
      try { shippingCtrlRef.current.abort(); } catch (_) {}
    }
    const ctrl = new AbortController();
    shippingCtrlRef.current = ctrl;
    const http = getHttp();

    try {
      const body = {
        pickup_postcode: null,
        delivery_postcode: normalized.pincode,
        cod: 0,
        weight: Number(weight || 0)
      };

      const res = await http.post('/api/shipping/check/availability', body, { signal: ctrl.signal, headers: { 'Content-Type': 'application/json' } });
      const shippingResp = res.data;

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
        try {
          const candidate = shippingResp.available_courier_companies?.[0] || shippingResp.data?.available_courier_companies?.[0];
          if (candidate && (candidate.totalPayable || candidate.total_payable || candidate.total)) {
            fee = Number(candidate.totalPayable ?? candidate.total_payable ?? candidate.total);
          }
        } catch (_) { /* ignore */ }
      }

      fee = Number(isNaN(fee) ? 0 : fee);
      setDeliveryFee(fee);
      setShippingChecked(true);
      setIsCartOpen(true);

      if (fee > 0) {
        alert(`Delivery fee ₹${fee.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} added.`);
      } else {
        alert('Delivery not available. Choose different deliver address.');
      }
    } catch (err) {
      const isCanceled = err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError' || axios.isCancel?.(err);
      if (!isCanceled) {
        console.error('Shipping check failed', err);
        alert('Shipping check failed. Please try again.');
      }
    } finally {
      shippingCtrlRef.current = null;
    }
  }

  function chooseAddrFromList(a) { onAddressChosen(a); }
  function submitManualAddr() {
    const pin = String(manualAddr.pincode || '').trim();
    if (!pin) return alert('Please enter delivery pincode');
    if (!isValidPincode(pin)) return alert('Please enter a valid 6-digit pincode (e.g. 500089)');
    const addr = { line1: manualAddr.line1 || '', pincode: pin };
    onAddressChosen(addr);
  }

  // ----------------------------
  // Initial fetch on mount
  // ----------------------------
  useEffect(() => {
    fetchProducts({ q: search, p: page, s: size, sortBy: sort });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  // ----------------------------
  // RENDER
  // ----------------------------
  function computeRange(pageLocal, sizeLocal, total) {
    if (!total) return '0 items';
    const start = pageLocal * sizeLocal + 1;
    const end = Math.min(total, (pageLocal + 1) * sizeLocal);
    return `${start}–${end}`;
  }

  return (
    <>
      {/* HEADER - Flipkart-style (3 rows) */}
      <header className="bg-blue-600 text-white sticky top-0 z-20 shadow">
        <div className="max-w-7xl mx-auto px-4 py-2">
          {/* ROW 1: Logo | Search | Auth + Cart */}
          <div className="flex items-center gap-4">
            <div className="flex-none">
              <img src="/smartsale.png" alt="SmartSale" className="w-16 h-16 object-contain mr-2" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            </div>

            <div className="flex-1">
              <div className="flex">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full rounded-l px-3 py-1 text-black"
                />
                <button
                  className="bg-yellow-400 text-black px-4 rounded-r"
                  onClick={() => { setPage(0); fetchProducts({ q: search, p: 0, s: size, sortBy: sort }); }}
                >
                  Search
                </button>
              </div>
            </div>

            <div className="flex-none flex items-center gap-3">
              {!isLoggedIn ? (
                <>
                  <div className="hidden sm:flex items-center gap-2">
                    <input ref={usernameRef} placeholder="Username" className="text-black px-2 py-1 rounded" />
                    <input ref={passwordRef} type="password" placeholder="Password" className="text-black px-2 py-1 rounded" />
                    <button onClick={login} className="bg-white text-blue-600 px-3 py-1 rounded">Login</button>
                  </div>
                  <button onClick={() => setShowSignup(true)} className="bg-green-500 text-white px-3 py-1 rounded">Sign Up</button>
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">Hello, <b>{usernameDisplay}</b></span>
                  <button onClick={logout} className="bg-white text-red-600 px-3 py-1 rounded">Logout</button>
                </>
              )}

              <button className="bg-white text-blue-600 px-4 py-1 rounded ml-2" onClick={() => setIsCartOpen(true)}>
                Cart 🛒({totalItems})
              </button>
            </div>
          </div>

          {/* ROW 2: Categories */}
          {/* ROW 2: FULL-WIDTH Categories (replace existing ROW 2) */}
          {/* this block sits directly under the top inner container inside <header> */}
          <div className="w-full bg-blue-500"> {/* full width background */}
            <div className="max-w-7xl mx-auto px-4 py-2">
              <div
                className="grid gap-3"
                style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))' }}
              >
                {['Electronics', 'Clothing', 'Grocery', 'Stationery', 'Drinks', 'Home', 'Toys', 'Beauty'].map(c => (
                  <button
                    key={c}
                    className="px-3 py-2 bg-white text-black rounded shadow hover:shadow-md whitespace-nowrap min-w-[120px]"
                    onClick={() => { setSearch(c); setPage(0); fetchProducts({ q: c, p: 0, s: size, sortBy: sort }); }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>


          {/* ROW 3: Filters / pagination */}
          <div className="mt-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="text-white text-sm hidden sm:inline">Show</label>
              <select value={size} onChange={e => { setSize(Number(e.target.value)); setPage(0); }} className="text-black px-2 py-1 rounded">
                <option value={8}>8</option>
                <option value={12}>12</option>
                <option value={20}>20</option>
                <option value={48}>48</option>
              </select>

              <label className="text-white text-sm hidden sm:inline">Sort</label>
              <select value={sort} onChange={e => { setSort(e.target.value); setPage(0); }} className="text-black px-2 py-1 rounded">
                <option value="name,asc">Name ↑</option>
                <option value="name,desc">Name ↓</option>
                <option value="price,asc">Price ↑</option>
                <option value="price,desc">Price ↓</option>
                <option value="id,desc">Newest</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <button
                disabled={page <= 0 || loadingProducts}
                onClick={() => setPage(Math.max(0, page - 1))}
                className="px-2 py-1 bg-white text-blue-600 rounded disabled:opacity-50"
              >
                Prev
              </button>
              <span className="text-white text-sm">Page {Number(page) + 1} / {Math.max(1, totalPages)}</span>
              <button
                disabled={page + 1 >= totalPages || loadingProducts}
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                className="px-2 py-1 bg-white text-blue-600 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN GRID */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-3 overflow-x-auto pb-4">
          {/* category chips repeated in main for accessibility on large screens */}
          {['Electronics', 'Clothing', 'Grocery', 'Stationery', 'Drinks'].map(c => (
            <span key={c} className="px-3 py-1 bg-white rounded shadow">{c}</span>
          ))}
        </div>

        {loadingProducts ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: size > 0 ? Math.min(size, 8) : 8 }).map((_, i) => (
              <div key={i} className="bg-white p-3 rounded shadow animate-pulse h-64" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map(p => (
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
        )}

        {/* page summary */}
        <div className="mt-4 text-sm text-gray-600">
          {totalElements ? `Showing ${computeRange(page, size, totalElements)} of ${totalElements} products` : 'No products to display'}
        </div>
      </main>

      {/* CART DRAWER */}
      <Cart
        cart={cart}
        onInc={inc}
        onDec={dec}
        onRemove={removeFromCart}
        onPay={pay}
        onBuyNow={handleBuyNow}
        open={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        deliveryFee={deliveryFee}
        selectedAddress={selectedAddress}
        shippingChecked={shippingChecked}
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
                  <input placeholder="Pincode (6 digits)" value={manualAddr.pincode} onChange={e => setManualAddr(prev => ({ ...prev, pincode: e.target.value }))} className="border p-2 rounded" />
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
    </>
  );
}
