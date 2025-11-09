import React, { useEffect, useMemo, useState } from "react";
// Wire-up to your existing services/api.js
import { api, getSession, getToken, setToken, setUser } from "./services/api";

// --- helpers ---
const fmtINR = (v) => {
  const n = Number(v);
  if (!isFinite(n)) return "—";
  return n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
};
const pickImage = (p) => p?.image || p?.thumbnail || p?.img || `https://via.placeholder.com/300x300?text=${encodeURIComponent(p?.name || p?.title || "Item")}`;

export default function FlipkartLikeApp() {
  // auth
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authUser, setAuthUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);

  // catalog
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");

  // cart
  // items: { id, name, price, qty }
  const [cart, setCart] = useState([]);
  const cartCount = useMemo(() => cart.reduce((s, x) => s + x.qty, 0), [cart]);
  const cartTotal = useMemo(() => cart.reduce((s, x) => s + Number(x.price || 0) * x.qty, 0), [cart]);

  // ----- effects -----
  useEffect(() => {
    // initialize auth state from token
    const t = getToken();
    if (t) setAuthUser({ username: localStorage.getItem("rzp_username") || "user" });
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");
    api
      .products()
      .then((list) => {
        if (!mounted) return;
        // Normalize product shape a bit to avoid undefined access
        const normalized = (Array.isArray(list) ? list : list?.content || list?.items || []).map((p, i) => ({
          id: p.id ?? p.productId ?? p.sku ?? i + 1,
          name: p.name ?? p.title ?? p.productName ?? `Item ${i + 1}`,
          price: p.price ?? p.unitPrice ?? p.mrp ?? 0,
          originalPrice: p.originalPrice ?? p.mrp ?? p.price ?? 0,
          rating: p.rating ?? p.avgRating ?? 4,
          image: pickImage(p),
          raw: p,
        }));
        setProducts(normalized);
      })
      .catch((e) => setError(typeof e === "string" ? e : e?.message || "Failed to load products"))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  // ----- handlers -----
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return products;
    return products.filter((p) => [p.name, p.raw?.brand, p.raw?.category]
      .filter(Boolean)
      .some((s) => String(s).toLowerCase().includes(term)));
  }, [products, q]);

  function addToCart(p) {
    if (!authUser) {
      setShowLogin(true);
      return;
    }
    setCart((prev) => {
      const idx = prev.findIndex((x) => x.id === p.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        return next;
      }
      return [...prev, { id: p.id, name: p.name, price: p.price, qty: 1 }];
    });
  }

  async function persistCart() {
    // Save cart to backend using your session id
    try {
      const payload = {
        sessionId: getSession(),
        items: cart.map((c) => ({ productId: c.id, quantity: c.qty, price: c.price })),
      };
      await api.saveCart(payload);
    } catch (e) {
      console.warn("saveCart failed", e);
    }
  }

  useEffect(() => {
    if (cart.length) {
      persistCart();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart]);

  async function doLogin(e) {
    e?.preventDefault?.();
    try {
      const res = await api.login(username, password);
      if (res?.token || res?.accessToken) {
        setToken(res.token || res.accessToken);
        setUser(username);
        setAuthUser({ username });
        setShowLogin(false);
      }
    } catch (e2) {
      alert("Login failed: " + (e2?.message || e2));
    }
  }

  async function checkout() {
    if (!authUser) {
      setShowLogin(true);
      return;
    }
    try {
      // create the app order (ties to session/cart)
      const order = await api.createAppOrder();
      // optionally also create a payment order on your gateway
      // const pay = await api.createPaymentOrder({ amount: Math.round(cartTotal) });
      alert("Order created: " + JSON.stringify(order));
      // Clear cart local state after successful creation
      setCart([]);
    } catch (e) {
      alert("Checkout failed: " + (e?.message || e));
    }
  }

  // ----- UI -----
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 py-3">
            <div className="flex items-center gap-3">
              <div className="bg-white rounded px-3 py-1 text-blue-600 font-bold">LOGO</div>
              <div className="hidden sm:block text-sm">Deliver to Hyderabad</div>
            </div>

            <div className="flex-1">
              <form className="flex" onSubmit={(e)=>e.preventDefault()}>
                <input
                  value={q}
                  onChange={(e)=>setQ(e.target.value)}
                  type="text"
                  placeholder="Search for products, brands and more"
                  className="w-full rounded-l-md px-4 py-2 text-gray-700 focus:outline-none"
                />
                <button type="button" onClick={()=>setQ(q)} className="bg-yellow-400 text-black px-4 rounded-r-md font-semibold">Search</button>
              </form>
            </div>

            <nav className="hidden md:flex items-center gap-6">
              {authUser ? (
                <span className="text-sm">Hi, {authUser.username}</span>
              ) : (
                <button className="text-sm" onClick={()=>setShowLogin(true)}>Login</button>
              )}
              <button className="text-sm">Become a Seller</button>
              <button className="text-sm">More</button>
              <button className="text-sm bg-white text-blue-600 px-3 py-1 rounded">Cart ({cartCount})</button>
            </nav>
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters sidebar (static demo) */}
        <aside className="hidden lg:block lg:col-span-1">
          <div className="sticky top-20 space-y-4">
            <div className="bg-white p-4 rounded shadow-sm">
              <h3 className="font-semibold mb-2">Filters</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <label className="block text-xs font-medium">Price</label>
                  <div className="flex gap-2 mt-2">
                    <input placeholder="Min" className="w-1/2 border px-2 py-1 rounded" />
                    <input placeholder="Max" className="w-1/2 border px-2 py-1 rounded" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Products area */}
        <section className="lg:col-span-3 space-y-6">
          {/* status */}
          {loading && <div className="bg-white p-4 rounded shadow-sm">Loading products…</div>}
          {error && <div className="bg-red-50 text-red-700 p-4 rounded shadow-sm">{String(error)}</div>}

          {/* grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((p) => (
              <article key={p.id} className="bg-white p-3 rounded shadow-sm hover:shadow-md transition">
                <div className="relative">
                  <img src={pickImage(p)} alt={p.name} className="w-full h-40 object-contain" />
                </div>
                <h3 className="mt-2 text-sm font-medium line-clamp-2">{p.name}</h3>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <div>
                    <div className="font-bold">₹{fmtINR(p.price)}</div>
                    {p.originalPrice ? (
                      <div className="text-xs line-through text-gray-400">₹{fmtINR(p.originalPrice)}</div>
                    ) : null}
                  </div>
                  <div className="text-xs bg-green-600 text-white px-2 py-1 rounded">{p.rating}★</div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button className="flex-1 border rounded py-1 text-sm" onClick={()=>addToCart(p)}>Add to Cart</button>
                  <button className="w-10 border rounded py-1 text-sm" title="Wishlist">❤️</button>
                </div>
              </article>
            ))}
          </div>

          {/* Cart summary & checkout */}
          <div className="bg-white p-4 rounded shadow-sm flex items-center justify-between">
            <div className="text-sm">Items: <b>{cartCount}</b> • Total: <b>₹{fmtINR(cartTotal)}</b></div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={checkout} disabled={!cart.length}>Checkout</button>
          </div>
        </section>
      </main>

      {/* Login modal */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <form onSubmit={doLogin} className="bg-white w-full max-w-sm rounded-xl p-6 space-y-3">
            <h3 className="text-lg font-semibold">Login</h3>
            <input value={username} onChange={(e)=>setUsername(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="Username" />
            <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="Password" />
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="px-3 py-2" onClick={()=>setShowLogin(false)}>Cancel</button>
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Login</button>
            </div>
          </form>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} SmartSale — Built with ❤️
        </div>
      </footer>
    </div>
  );
}
