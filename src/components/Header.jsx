import React from 'react';
import AuthControls from './AuthControls';

export default function Header({ search, setSearch, onSearchClick, isLoggedIn, usernameDisplay, onLogout, onShowSignup, onOpenCart, totalItems, size, setSize, sort, setSort, page, totalPages, setPage, loadingProducts }) {
  return (
    <header className="bg-blue-600 text-white sticky top-0 z-20 shadow">
      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className="flex items-center gap-4">
          <div className="flex-none">
            <img src="/smartsale.png" alt="SmartSale" className="w-16 h-16 object-contain mr-2" onError={(e)=>{e.currentTarget.style.display='none'}} />
          </div>

          <div className="flex-1">
            <div className="flex">
              <input type="text" placeholder="Search products..." value={search} onChange={e=>setSearch(e.target.value)} className="w-full rounded-l px-3 py-1 text-black" />
              <button className="bg-yellow-400 text-black px-4 rounded-r" onClick={onSearchClick}>Search</button>
            </div>
          </div>

          <div className="flex-none flex items-center gap-3">
            <AuthControls isLoggedIn={isLoggedIn} usernameDisplay={usernameDisplay} onLogout={onLogout} onShowSignup={onShowSignup} />

            <button className="bg-white text-blue-600 px-4 py-1 rounded ml-2" onClick={onOpenCart}>Cart 🛒({totalItems})</button>
          </div>
        </div>

        {/* categories row */}
        <div className="w-full bg-blue-500 mt-2">
          <div className="max-w-7xl mx-auto px-4 py-2">
            <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))' }}>
              {['Electronics','Clothing','Grocery','Stationery','Drinks','Home','Toys','Beauty'].map(c => (
                <button key={c} className="px-3 py-2 bg-white text-black rounded shadow hover:shadow-md whitespace-nowrap min-w-[120px]" onClick={()=>{ setSearch(c); setPage(0); onSearchClick(); }}>
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* filters */}
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
            <button disabled={page <= 0 || loadingProducts} onClick={() => setPage(Math.max(0, page - 1))} className="px-2 py-1 bg-white text-blue-600 rounded disabled:opacity-50">Prev</button>
            <span className="text-white text-sm">Page {Number(page) + 1} / {Math.max(1, totalPages)}</span>
            <button disabled={page + 1 >= totalPages || loadingProducts} onClick={() => setPage(Math.min(totalPages - 1, page + 1))} className="px-2 py-1 bg-white text-blue-600 rounded disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>
    </header>
  );
}
