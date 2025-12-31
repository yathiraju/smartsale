// FlipkartLikeApp.jsx
// Layout reference image: /mnt/data/layout1.png

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { api, getToken, setToken, setUser, getSession,getApiHost } from './services/api';
import ProductCard from './components/ProductCard';
import Cart from './components/Cart';
import './App.css';
import IndiaStateSelect from "./components/IndiaStateSelect";
import MobileHeader from "./components/header/MobileHeader";
import MobileDrawer from "./components/header/MobileDrawer";
import { FaTimes } from "react-icons/fa";
import {
  FaUser,
  FaUserPlus,
  FaUserCircle,
  FaShoppingCart,
  FaSearch,
  FaChevronDown,
  FaSignOutAlt
} from "react-icons/fa";
export default function FlipkartLikeApp() {
  // ----------------------------
  // STATES
  // ----------------------------
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const [cart, setCart] = useState({});
  const [isCartOpen, setIsCartOpen] = useState(false);

  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(getToken()));
  const [usernameDisplay, setUsernameDisplay] = useState(localStorage.getItem('rzp_username') || '');


  const [paying, setPaying] = useState(false);

  const [profileOpen, setProfileOpen] = useState(false);


  // guest address (when user is NOT logged in and clicks Buy Now)
    const [guestAddrModalOpen, setGuestAddrModalOpen] = useState(false);
    const [guestAddress, setGuestAddress] = useState({
      name: '', phone: '', addressLine1: '', addressLine2: '',
      city: '', state: '', pincode: '', country: 'IN'
    });
    const [guestAddrSubmitting, setGuestAddrSubmitting] = useState(false);

  // ---------- NEW state: full manual address for logged-in user ----------
  const [manualAddrFull, setManualAddrFull] = useState({
    name: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'IN'
  });
  const [showAddNewAddr, setShowAddNewAddr] = useState(false);
  const [manualAddrSubmitting, setManualAddrSubmitting] = useState(false);
  // ---------- end NEW state ----------

  // NEW: address & shipping state
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [shippingChecked, setShippingChecked] = useState(false);

  // address modal UI
  const [addrModalOpen, setAddrModalOpen] = useState(false);
  const [addrChoices, setAddrChoices] = useState([]);

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

  const addrCtrlRef = useRef(null);
  const shippingCtrlRef = useRef(null);

  // validations - utilities
  const isValidPhone = (phone) => /^\d{10}$/.test(phone);
 const isValidPincode = (pin) =>  /^[1-9][0-9]{5}$/.test(pin);
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
    const host = (typeof getApiHost === 'function' ? getApiHost() : null) || 'http://localhost:8080';
    return axios.create({ baseURL: host, timeout: 30000 });
  }, []);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  // ---------- add helper to normalize delivery address for capture ----------
  function buildDeliveryAddressForCapture() {
    // prefer selectedAddress (chosen from saved/manual), fallback to guestAddress
    const src = selectedAddress || guestAddress || null;
    if (!src) return null;

    // Map fields to the backend AddressDto shape:
    // AddressDto(
    //   name, phone, addressLine1, addressLine2, city, state, pincode, country
    // )
    const name = src.name || src.line1 || usernameDisplay || '';
    const phone = src.phone || src.mobile || ''; // try different keys just in case
    const addressLine1 = src.line1 || src.addressLine1 || src.address1 || '';
    const addressLine2 = src.line2 || src.addressLine2 || src.address2 || '';
    const city = src.city || '';
    const state = src.state || '';
    const pincode = String(src.pincode || src.postalCode || src.zip || '').trim();
    const country = src.country || 'IN';

    return {
      name,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      country
    };
  }
  // ---------- end helper ----------

  // ---------- replaced pay() with capture including deliveryAddress ----------
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
            // response contains razorpay_order_id, razorpay_payment_id, razorpay_signature, etc.
            // Build the capture payload expected by your backend CaptureDTO:
            // { body: { ... }, deliveryAddress: { name, phone, addressLine1, ... } }

            const deliveryAddress = buildDeliveryAddressForCapture();

            const body = {
              // map provider response fields to the 'body' map
              body: {
                razorpay_order_id: response?.razorpay_order_id || '',
                razorpay_payment_id: response?.razorpay_payment_id || '',
                razorpay_signature: response?.razorpay_signature || '',
                orderId: String(appId || ''),
                cartId: String(cartId || '')
              },
              // include the normalized delivery address (or null)
              deliveryAddress
            };

            // call backend capture endpoint — backend will verify signature and persist order + address
            const cap = await api.capturePayment(body);

            // your backend currently inspects providerOrderId/paymentId and calls paymentService.markSuccess(...)
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
  // ---------- end pay() ------

  async function submitGuestAddress(e) {
      if (e && e.preventDefault) e.preventDefault();
      if (guestAddrSubmitting) return;

      // validation (mirror AddressDto constraints)
      const { name, phone, addressLine1, city, state, pincode, country } = guestAddress;
      if (!String(name || '').trim()) return alert('Name is required');
      if (!isValidPhone(phone)) return alert('Phone must be a 10-digit number');
      if (!String(addressLine1 || '').trim()) return alert('Address line1 is required');
      if (!String(city || '').trim()) return alert('City is required');
      if (!String(state || '').trim()) return alert('State is required');
      if (!isValidPincode(pincode)) return alert('Pincode must be a 6-digit number');
      if (!String(country || '').trim()) return alert('Country is required');

      setGuestAddrSubmitting(true);

      try {
        // normalize to the shape expected by onAddressChosen (it reads pincode and line1)
        const addr = {
          name: guestAddress.name,
          phone: guestAddress.phone,
          line1: guestAddress.addressLine1,
          line2: guestAddress.addressLine2,
          city: guestAddress.city,
          state: guestAddress.state,
          pincode: guestAddress.pincode,
          country: guestAddress.country
        };

        // Save guest address in its own state variable (user requested)
        setGuestAddress(addr);

        // Close modal and reuse existing flow: call onAddressChosen to perform shipping check + continue
        setGuestAddrModalOpen(false);

        // call same logic that handles shipping (onAddressChosen does shipping check and opens cart)
        await onAddressChosen(addr);

      } catch (err) {
        console.error('Guest address submit failed', err);
        alert('Failed to check shipping for this address. Please try again.');
      } finally {
        setGuestAddrSubmitting(false);
      }
    }


  async function handleBuyNow() {
      // ✅ CLOSE CART IMMEDIATELY
        setIsCartOpen(false);
      // if not logged in -> open guest address modal to collect AddressDto-like info
      if (!isLoggedIn) {
        // show the guest address modal
        setGuestAddrModalOpen(true);
        // scroll to top so modal is visible on small screens
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      // existing logic (when logged in) - unchanged
      setAddrLoading(true);

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
            setManualAddrFull({
              name: usernameDisplay || '',
              phone: '',
              addressLine1: '',
              addressLine2: '',
              city: '',
              state: '',
              pincode: '',
              country: 'IN'
            });
            setAddrModalOpen(true);
          } else {
            setAddrChoices(resp);
            setAddrModalOpen(true);
          }
        } else {
          setAddrChoices([]);
          setManualAddrFull({
            name: usernameDisplay || '',
            phone: '',
            addressLine1: '',
            addressLine2: '',
            city: '',
            state: '',
            pincode: '',
            country: 'IN'
          });
          setAddrModalOpen(true);
        }
      } catch (err) {
        const isCanceled = err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError' || axios.isCancel?.(err);
        if (!isCanceled) {
          console.error('Fetch addresses failed', err);
          alert('Failed to fetch addresses. Please enter address manually.');
          setAddrChoices([]);
         // setManualAddr({ line1: '', pincode: '' });
          setAddrModalOpen(true);
        }
      } finally {
        setAddrLoading(false);
        addrCtrlRef.current = null;
      }
    }

// ---------- NEW: submit manual address for logged-in users ----------
async function submitManualAddrForLoggedIn(e) {
  if (e && e.preventDefault) e.preventDefault();
  if (manualAddrSubmitting) return;

  // mirror same validations as guest
  const { name, phone, addressLine1, city, state, pincode, country } = manualAddrFull;
  if (!String(name || '').trim()) return alert('Name is required');
  if (!isValidPhone(phone)) return alert('Phone must be a 10-digit number');
  if (!String(addressLine1 || '').trim()) return alert('Address line1 is required');
  if (!String(city || '').trim()) return alert('City is required');
  if (!String(state || '').trim()) return alert('State is required');
  if (!isValidPincode(pincode)) return alert('Pincode must be a 6-digit number');
  if (!String(country || '').trim()) return alert('Country is required');

  setManualAddrSubmitting(true);
  try {
    const addr = {
      name: manualAddrFull.name,
      phone: manualAddrFull.phone,
      line1: manualAddrFull.addressLine1,
      line2: manualAddrFull.addressLine2,
      city: manualAddrFull.city,
      state: manualAddrFull.state,
      pincode: manualAddrFull.pincode,
      country: manualAddrFull.country
    };

    // close modal and use same shipping logic
    setAddrModalOpen(false);

    // reuse the shipping check / onAddressChosen flow
    await onAddressChosen(addr);
  } catch (err) {
    console.error('submit manual addr failed', err);
    alert('Failed to check shipping for this address. Please try again.');
  } finally {
    setManualAddrSubmitting(false);
  }
}
// ---------- end NEW ----------


  async function onAddressChosen(addr) {
    const pincode = addr?.pincode || addr?.postalCode || addr?.zip;
    if (!isValidPincode(pincode)) {
      alert('Selected address has invalid/missing pincode. Please enter a valid 6-digit pincode.');
      //setManualAddr({ line1: addr?.line1 || addr?.name || '', pincode: '' });
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
        //alert(`Delivery fee ₹${fee.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} added.`);
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

  const [animateCart, setAnimateCart] = useState(false);
  const prevTotalRef = useRef(totalItems);
   useEffect(() => {
      if (totalItems > prevTotalRef.current) {
        setAnimateCart(true);

        const t = setTimeout(() => setAnimateCart(false), 300);
        return () => clearTimeout(t);
      }

      prevTotalRef.current = totalItems;
    }, [totalItems]);

  return (
    <>
    <MobileHeader
      search={search}
      setSearch={setSearch}
      totalItems={totalItems}
      isLoggedIn={isLoggedIn}
      onCartClick={() => setIsCartOpen(true)}
      onMenuOpen={() => setMobileMenuOpen(true)}
      onLogout={logout}
    />

    <MobileDrawer
      open={mobileMenuOpen}
      onClose={() => setMobileMenuOpen(false)}
    />
      {/* --- REPLACE HEADER WITH THIS BLOCK --- */}
      <header className="hidden md:block bg-blue-600 text-white sticky top-0 z-20 shadow">
        <div className="max-w-7xl mx-auto px-4 py-2">
          {/* ROW 1: Logo | Search | Cart */}
          <div className="max-w-7xl mx-auto px-4 py-2">

              {/* ROW 1 */}
              <div className="flex items-center gap-4">

                {/* Logo */}
                <div className="flex-none">
                  <img
                    src="/smartsale.png"
                    alt="SmartSale"
                    className="h-10 w-auto object-contain"
                  />
                </div>

                {/* Search */}
                <div className="flex w-full max-w-4xl bg-white rounded shadow-sm border h-10">
                  <select className="bg-yellow-400 hover:bg-yellow-500 text-black text-sm px-3 h-10 border-r border-yellow-500 outline-none cursor-pointer">
                    <option value="all">All</option>
                    <option value="electronics">Electronics</option>
                    <option value="grocery">Grocery</option>
                  </select>

                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search SmartSales.in"
                    className="flex-1 h-10 px-3 text-black outline-none"
                  />

                  <button
                    onClick={() => {
                      setPage(0);
                      fetchProducts({ q: search, p: 0, s: size, sortBy: sort });
                    }}
                    className="h-10 bg-yellow-400 px-4 flex items-center justify-center hover:bg-yellow-500"
                  >
                    <FaSearch className="text-black" />
                  </button>
                </div>

                {/* NOT LOGGED IN */}
                {!isLoggedIn && (
                  <div className="flex items-center gap-2">

                    {/* Login */}
                    <button
                      onClick={() => navigate("/login")}
                      className="h-10 px-4 bg-white text-blue-600 rounded hover:bg-gray-100 border flex items-center justify-center"
                      title="Login"
                    >
                      <FaUser size={18} />
                    </button>

                    {/* Sign Up */}
                    <button
                      onClick={() => navigate("/signup")}
                      className="h-10 px-4 bg-yellow-400 text-black rounded hover:bg-yellow-300 flex items-center justify-center"
                      title="Sign Up"
                    >
                      <FaUserPlus size={18} />
                    </button>

                  </div>
                )}

                {/* LOGGED IN */}
                {isLoggedIn && (
                  <div className="relative">

                    <button
                      onClick={() => setProfileOpen(prev => !prev)}
                      className="h-10 px-3 bg-white text-blue-600 rounded flex items-center gap-1 shadow"
                    >
                      <FaUserCircle size={22} />
                      <FaChevronDown
                        className={`transition-transform ${profileOpen ? "rotate-180" : ""}`}
                      />
                    </button>

                    {profileOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white text-black rounded shadow-lg py-2 z-50">

                        <button
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <FaUser /> My Profile
                        </button>

                        <button
                          onClick={() => {
                            setProfileOpen(false);
                            navigate("/orders");
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <FaShoppingCart /> Orders
                        </button>

                        <button
                          onClick={() => {
                            setProfileOpen(false);
                            logout();
                          }}
                          className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 border-t flex items-center gap-2"
                        >
                          <FaSignOutAlt /> Logout
                        </button>

                      </div>
                    )}
                  </div>
                )}

                {/* Cart */}
                <div className="flex-none">
                  <button
                    onClick={() => setIsCartOpen(true)}
                    className="relative h-10 bg-white text-blue-600 px-3 rounded flex items-center"
                  >
                    <FaShoppingCart size={18} />

                    {totalItems > 0 && (
                      <span
                        className={`
                          absolute -top-1 -right-1
                          bg-red-600 text-white
                          text-xs font-bold
                          rounded-full
                          min-w-[18px] h-[18px]
                          flex items-center justify-center
                          px-1
                          transition-transform duration-200
                          ${animateCart ? "scale-125" : "scale-100"}
                        `}
                      >
                        {totalItems > 99 ? "99+" : totalItems}
                      </span>
                    )}
                  </button>
                </div>

              </div>
            </div>
          </div>
          {/* ROW 2: Filters / pagination */}
          <div className="w-full bg-blue-600">
            <div className="max-w-7xl mx-auto px-4 py-1">
              <div className="flex items-center justify-between gap-4">
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
          </div>


      </header>
      {/* --- END REPLACEMENT HEADER --- */}

      {/* MAIN GRID */}
      <main className="max-w-7xl mx-auto px-4 py-6">
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

        {/* GUEST ADDRESS MODAL (shown when Buy Now clicked and user not logged in) */}
        {guestAddrModalOpen && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <form onSubmit={submitGuestAddress} className="bg-white p-6 rounded shadow max-w-lg w-full">
              <h2 className="text-xl font-bold mb-3">Enter delivery address</h2>

              <div className="grid grid-cols-1 gap-2 text-black">
                <input placeholder="Name" value={guestAddress.name} onChange={e => setGuestAddress(prev => ({ ...prev, name: e.target.value.replace(/[^A-Za-z\s]/g, "") }))} className="border p-2 rounded" />
                <input placeholder="Phone (10 digits)" value={guestAddress.phone} maxLength={10} onChange={e => setGuestAddress(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, "") }))} className="border p-2 rounded" />
                <input placeholder="Address line 1" value={guestAddress.addressLine1} onChange={e => setGuestAddress(prev => ({ ...prev, addressLine1: e.target.value }))} className="border p-2 rounded" />
                <input placeholder="Address line 2 (optional)" value={guestAddress.addressLine2} onChange={e => setGuestAddress(prev => ({ ...prev, addressLine2: e.target.value }))} className="border p-2 rounded" />
                <input placeholder="City" value={guestAddress.city} onChange={e => setGuestAddress(prev => ({ ...prev, city: e.target.value }))} className="border p-2 rounded" />
                                <div className="w-full"><IndiaStateSelect
                                  value={guestAddress.state}
                                  onChange={(state) =>
                                    setGuestAddress(prev => ({ ...prev, state }))
                                  }
                                /></div>
                <input placeholder="Pincode (6 digits)" value={guestAddress.pincode} maxLength={6} onChange={e => setGuestAddress(prev => ({ ...prev, pincode: e.target.value.replace(/\D/g, "") }))} className="border p-2 rounded" />
                <input placeholder="Country" value={guestAddress.country} onChange={e => setGuestAddress(prev => ({ ...prev, country: e.target.value }))} className="border p-2 rounded" />
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setGuestAddrModalOpen(false)}>Cancel</button>
                <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded">{guestAddrSubmitting ? 'Checking...' : 'Continue'}</button>
              </div>
            </form>
          </div>
        )}


      {/* ADDRESS SELECTION / MANUAL ENTRY MODAL */}
      {addrModalOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow max-w-lg w-full relative">

            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold">Choose delivery address</h3>

              {/* ❌ Close button */}
              <button
                type="button"
                onClick={() => {
                  setAddrModalOpen(false);
                  setShowAddNewAddr(false); // reset add-new state
                }}
                aria-label="Close address popup"
                className="text-gray-500 hover:text-red-600 transition"
              >
                <FaTimes size={18} />
              </button>
            </div>


            {addrLoading && <div>Loading addresses...</div>}

            {!addrLoading && Array.isArray(addrChoices) && addrChoices.length > 0 && !showAddNewAddr && (
              <>
                <div className="space-y-2 max-h-64 overflow-auto mb-3">
                  {addrChoices.map((a, idx) => (
                    <div key={idx} className="p-3 border rounded flex justify-between items-center">
                      <div>
                        <div className="font-semibold">
                          {a.name || a.users?.username || `Address ${idx + 1}`}
                        </div>
                       <div className="text-sm text-gray-600 space-y-1">
                         {/* Address lines */}
                         <div>
                           {a.line1}
                           {a.line2 ? `, ${a.line2}` : ''}
                         </div>

                         {/* Phone */}
                         {(a.phone || a.mobile || a.users?.mobile) && (
                           <div className="text-xs text-gray-700">
                             📞 {a.phone || a.mobile || a.users?.mobile}
                           </div>
                         )}
                         {/* City + Pincode */}
                         <div className="text-xs text-gray-500">
                           {a.city} • {a.pincode}
                         </div>
                       </div>

                      </div>
                      <button
                        onClick={() => chooseAddrFromList(a)}
                        className="bg-blue-600 text-white px-3 py-1 rounded"
                      >
                        Deliver here
                      </button>
                    </div>
                  ))}
                </div>

                {/* ➕ Add New Address */}
                <button
                  onClick={() => setShowAddNewAddr(true)}
                  className="w-full border border-dashed border-blue-500 text-blue-600 py-2 rounded hover:bg-blue-50"
                >
                  ➕ Add New Address
                </button>
              </>
            )}
            {showAddNewAddr && (
              <div>
                <h4 className="font-semibold mb-2">Add new delivery address</h4>

                <form onSubmit={submitManualAddrForLoggedIn} className="grid grid-cols-1 gap-2">
                  <input
                    placeholder="Name"
                    value={manualAddrFull.name}
                    onChange={e => setManualAddrFull(prev => ({ ...prev, name: e.target.value }))}
                    className="border p-2 rounded"
                  />

                  <input
                    placeholder="Phone (10 digits)"
                    value={manualAddrFull.phone}
                    maxLength={10}
                    onChange={e => setManualAddrFull(prev => ({
                      ...prev,
                      phone: e.target.value.replace(/\D/g, "")
                    }))}
                    className="border p-2 rounded"
                  />

                  <input
                    placeholder="Address line 1"
                    value={manualAddrFull.addressLine1}
                    onChange={e => setManualAddrFull(prev => ({ ...prev, addressLine1: e.target.value }))}
                    className="border p-2 rounded"
                  />

                  <input
                    placeholder="Address line 2 (optional)"
                    value={manualAddrFull.addressLine2}
                    onChange={e => setManualAddrFull(prev => ({ ...prev, addressLine2: e.target.value }))}
                    className="border p-2 rounded"
                  />

                  <input
                    placeholder="City"
                    value={manualAddrFull.city}
                    onChange={e => setManualAddrFull(prev => ({ ...prev, city: e.target.value }))}
                    className="border p-2 rounded"
                  />

                  <IndiaStateSelect
                    value={manualAddrFull.state}
                    onChange={state =>
                      setManualAddrFull(prev => ({ ...prev, state }))
                    }
                  />

                  <input
                    placeholder="Pincode"
                    value={manualAddrFull.pincode}
                    maxLength={6}
                    onChange={e =>
                      setManualAddrFull(prev => ({
                        ...prev,
                        pincode: e.target.value.replace(/\D/g, "")
                      }))
                    }
                    className="border p-2 rounded"
                  />

                  <div className="flex justify-between mt-3">
                    <button
                      type="button"
                      onClick={() => setShowAddNewAddr(false)}
                      className="text-gray-500"
                    >
                      ← Back
                    </button>

                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-4 py-1 rounded"
                    >
                      {manualAddrSubmitting ? "Checking..." : "Use this address"}
                    </button>
                  </div>
                </form>
              </div>
            )}


            {!addrLoading && (!addrChoices || addrChoices.length === 0) && (
              <div>
                <div className="text-sm text-gray-600 mb-2">No saved addresses. Enter delivery address.</div>

                <form onSubmit={submitManualAddrForLoggedIn} className="grid grid-cols-1 gap-2">
                  <input placeholder="Name" value={manualAddrFull.name} onChange={e => setManualAddrFull(prev => ({ ...prev, name: e.target.value }))} className="border p-2 rounded" />
                  <input placeholder="Phone (10 digits)" value={manualAddrFull.phone} onChange={e => setManualAddrFull(prev => ({ ...prev, phone: e.target.value }))} className="border p-2 rounded" />
                  <input placeholder="Address line 1" value={manualAddrFull.addressLine1} onChange={e => setManualAddrFull(prev => ({ ...prev, addressLine1: e.target.value }))} className="border p-2 rounded" />
                  <input placeholder="Address line 2 (optional)" value={manualAddrFull.addressLine2} onChange={e => setManualAddrFull(prev => ({ ...prev, addressLine2: e.target.value }))} className="border p-2 rounded" />
                  <input placeholder="City" value={manualAddrFull.city} onChange={e => setManualAddrFull(prev => ({ ...prev, city: e.target.value }))} className="border p-2 rounded" />
                                    <div className="w-full"><IndiaStateSelect
                                      value={manualAddrFull.state}
                                      onChange={(state) =>
                                        setManualAddrFull(prev => ({ ...prev, state }))
                                      }
                                    /></div>
                  <input placeholder="Pincode (6 digits)" value={manualAddrFull.pincode} onChange={e => setManualAddrFull(prev => ({ ...prev, pincode: e.target.value }))} className="border p-2 rounded" />
                  <input placeholder="Country" value={manualAddrFull.country} onChange={e => setManualAddrFull(prev => ({ ...prev, country: e.target.value }))} className="border p-2 rounded" />

                  <div className="flex justify-end gap-2 mt-3">
                    <button type="button" onClick={() => setAddrModalOpen(false)} className="px-3 py-1">Cancel</button>
                    <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded">{manualAddrSubmitting ? 'Checking...' : 'Use this address'}</button>
                  </div>
                </form>
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
