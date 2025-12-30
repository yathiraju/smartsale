// MobileHeader.jsx
import React, { useState } from "react";
import {
  FaUser,
  //FaUserPlus,
  FaUserCircle,
  FaShoppingCart,
  FaSearch,
  FaSignOutAlt
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function MobileHeader({
  search,
  setSearch,
  totalItems,
  isLoggedIn,
  onCartClick,
  onMenuOpen,
  onLogout        // ✅ received from parent
}) {
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <>
      {/* HEADER */}
      <header className="md:hidden bg-[#232f3e] text-white sticky top-0 z-30 shadow">

        {/* TOP BAR */}
        <div className="flex items-center px-3 py-2 gap-3">

          {/* Hamburger */}
          <button onClick={onMenuOpen} className="text-xl">
            ☰
          </button>

          {/* Logo */}
          <img
            src="/smartsale.png"
            alt="SmartSale"
            className="h-7 object-contain"
          />

          {/* Right actions */}
          <div className="ml-auto flex items-center gap-4">

            {/* NOT LOGGED IN */}
            {!isLoggedIn && (
              <>
                <button onClick={() => navigate("/login")}>
                  <FaUser size={18} />
                </button>

               {/*  <button onClick={() => navigate("/signup")}>
                  <FaUserPlus size={18} />
                </button> */}
              </>
            )}

            {/* LOGGED IN */}
            {isLoggedIn && (
              <button onClick={() => setProfileOpen(true)}>
                <FaUserCircle size={20} />
              </button>
            )}

            {/* Cart */}
            <button onClick={onCartClick} className="relative">
              <FaShoppingCart size={18} />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-xs rounded-full px-1">
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* SEARCH */}
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

      {/* PROFILE MENU (shared logic) */}
      {profileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40"
          onClick={() => setProfileOpen(false)}
        >
          <div
            className="absolute right-3 top-14 w-48 bg-white rounded shadow text-black"
            onClick={e => e.stopPropagation()}
          >
          <button
               className="w-full px-4 py-3 text-left hover:bg-gray-100 flex items-center gap-2"
                                  >
                                    <FaUser /> My Profile
                                  </button>
            <button
              onClick={() => {
                setProfileOpen(false);
                navigate("/orders");
              }}
              className="w-full px-4 py-3 text-left hover:bg-gray-100 flex items-center gap-2"
            >
              <FaShoppingCart /> Orders
            </button>

            <button
              onClick={() => {
                setProfileOpen(false);
                onLogout();   // ✅ SAME logout as desktop
              }}
              className="w-full px-4 py-3 text-left text-red-600 hover:bg-gray-100 border-t flex items-center gap-2"
            >
              <FaSignOutAlt /> Logout
            </button>
          </div>
        </div>
      )}
    </>
  );
}
