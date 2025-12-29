import React from "react";

export default function MobileDrawer({ open, onClose }) {
  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 left-0 h-full w-72 bg-white z-50 shadow-lg overflow-y-auto">

        {/* Header */}
        <div className="bg-[#232f3e] text-white px-4 py-4 flex justify-between">
          <div>
            <div className="text-sm">Browse</div>
            <div className="text-lg font-bold">SmartSale</div>
          </div>
          <button onClick={onClose}>✕</button>
        </div>

        {/* Menu */}
        <div className="p-4 text-black space-y-4">
          <div className="font-semibold">Trending</div>
          <ul className="space-y-2 text-sm">
            <li>Bestsellers</li>
            <li>New Releases</li>
            <li>Movers & Shakers</li>
          </ul>

          <hr />

          <div className="font-semibold">Top Categories</div>
          <ul className="space-y-2 text-sm">
            <li>Mobiles</li>
            <li>Computers</li>
            <li>Books</li>
            <li>Fashion</li>
          </ul>

          <button className="text-blue-600 text-sm">
            See All Categories
          </button>
        </div>
      </div>
    </>
  );
}
