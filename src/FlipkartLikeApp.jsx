import React, { useState } from 'react';
import useProducts from './hooks/useProducts';
import useAuthAndUser from './hooks/useAuthAndUser';
import useCart from './hooks/useCart';
import Header from './components/Header';
import ProductGrid from './components/ProductGrid';
import SignupModal from './components/SignupModal';
import AddressModal from './components/AddressModal';
import ProductCard from './components/ProductCard';
import Cart from './components/Cart';

export default function FlipkartLikeApp() {
  const { products, page, size, sort, totalPages, totalElements, loadingProducts, setQuery, setPage, setSize, setSort, fetchProducts } = useProducts({ initialSize: 12 });
  const { isLoggedIn, usernameDisplay, login, logout, setIsLoggedIn, setUsernameDisplay } = useAuthAndUser();
  const { cart, addToCart, inc, dec, removeFromCart, clearCart, computeCartWeight, payFlow, paying } = useCart();

  const [search, setSearch] = useState('');
  const [signupOpen, setSignupOpen] = useState(false);
  const [addrOpen, setAddrOpen] = useState(false);

  function onSearchClick() {
    fetchProducts({ q: search, p: 0, s: size, sortBy: sort });
  }

  function onOpenCart() {
    // open cart modal — here we simply scroll to cart area or toggle a state
    const el = document.getElementById('cart-area');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header search={search} setSearch={setSearch} onSearchClick={onSearchClick} isLoggedIn={isLoggedIn} usernameDisplay={usernameDisplay} onLogout={logout} onShowSignup={()=>setSignupOpen(true)} onOpenCart={onOpenCart} totalItems={Object.keys(cart).length} size={size} setSize={setSize} sort={sort} setSort={setSort} page={page} totalPages={totalPages} setPage={setPage} loadingProducts={loadingProducts} />

      <main className="max-w-7xl mx-auto p-4">
        <ProductGrid products={products} loading={loadingProducts} size={size} cart={cart} onAdd={addToCart} onInc={inc} onDec={dec} onRemove={removeFromCart} />

        <div id="cart-area" className="mt-8">
          <Cart cart={cart} onInc={inc} onDec={dec} onRemove={removeFromCart} onClear={clearCart} onPay={() => payFlow(()=>Promise.resolve(), clearCart)} paying={paying} />
        </div>
      </main>

      <SignupModal open={signupOpen} onClose={()=>setSignupOpen(false)} setUsernameInParent={(u)=>setUsernameDisplay(u)} onSignedUp={()=>setIsLoggedIn(false)} />
      <AddressModal open={addrOpen} onClose={()=>setAddrOpen(false)} />
    </div>
  );
}
