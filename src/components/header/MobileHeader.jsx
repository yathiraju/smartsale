import React from "react";
import { FaUser, FaShoppingCart, FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function MobileHeader({
  search,
  setSearch,
  totalItems,
  isLoggedIn,
  onCartClick,
  onMenuOpen
}) {
  const navigate = useNavigate();

  return (
    <header className="md:hidden bg-[#232f3e] text-white sticky top-0 z-30">

      {/* Top bar */}
      <div className="flex items-center px-3 py-2 gap-3">

        {/* Hamburger */}
        <button onClick={onMenuOpen} className="text-xl">
          ☰
        </button>

        {/* Logo */}
        <img
          src="/smartsale.png"
          alt="SmartSale"
          className="h-7"
        />

        {/* Right icons */}
        <div className="ml-auto flex items-center gap-4">
          <button onClick={() => navigate(isLoggedIn ? "/profile" : "/login")}>
            <FaUser size={18} />
          </button>

          <button onClick={onCartClick} className="relative">
            <FaShoppingCart size={18} />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-600 text-xs rounded-full px-1">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <div className="flex bg-white rounded overflow-hidden">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search SmartSale"
            className="flex-1 px-3 py-2 text-black outline-none"
          />
          <button className="bg-yellow-400 px-4">
            <FaSearch className="text-black" />
          </button>
        </div>
      </div>
    </header>
  );
}
