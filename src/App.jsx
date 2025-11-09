import React from 'react';

// Flipkart-like single-file React component preview
// Tailwind CSS required. This file exports a default React component you can drop into a project.

const sampleProducts = Array.from({ length: 12 }).map((_, i) => ({
  id: i + 1,
  title: `Product ${i + 1} — Smart gadget with great specs`,
  price: (999 + i * 150).toFixed(0),
  originalPrice: (1499 + i * 180).toFixed(0),
  rating: (3.8 + (i % 3) * 0.4).toFixed(1),
  image: `https://via.placeholder.com/300x300?text=Prod+${i + 1}`,
  badge: i % 4 === 0 ? 'Deal of the Day' : i % 5 === 0 ? 'Limited' : null,
}));

export default function FlipkartLikeUI() {
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
              <div className="flex">
                <input
                  type="text"
                  placeholder="Search for products, brands and more"
                  className="w-full rounded-l-md px-4 py-2 text-gray-700 focus:outline-none"
                />
                <button className="bg-yellow-400 text-black px-4 rounded-r-md font-semibold">Search</button>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-6">
              <button className="text-sm">Login</button>
              <button className="text-sm">Become a Seller</button>
              <button className="text-sm">More</button>
              <button className="text-sm bg-white text-blue-600 px-3 py-1 rounded">Cart (2)</button>
            </nav>
          </div>
        </div>
      </header>

      {/* Nav / Categories */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-4 overflow-x-auto py-3">
            {['Electronics','Mobiles','Fashion','Home','Appliances','TVs & AV','Grocery','Beauty','Toys','Furniture'].map((c) => (
              <button key={c} className="whitespace-nowrap px-3 py-1 rounded hover:bg-gray-100">{c}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left filters */}
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
                <div>
                  <label className="block text-xs font-medium">Brand</label>
                  <div className="mt-2 space-y-1">
                    <label className="flex items-center gap-2"><input type="checkbox"/> Boat</label>
                    <label className="flex items-center gap-2"><input type="checkbox"/> Noise</label>
                    <label className="flex items-center gap-2"><input type="checkbox"/> Samsung</label>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium">Customer Ratings</label>
                  <div className="mt-2 space-y-1">
                    <label className="flex items-center gap-2"><input type="radio" name="rating"/> 4★ & above</label>
                    <label className="flex items-center gap-2"><input type="radio" name="rating"/> 3★ & above</label>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded shadow-sm">
              <h4 className="font-semibold mb-2">Categories</h4>
              <ul className="space-y-1 text-sm">
                <li className="flex justify-between"><span>Mobiles</span><span>1256</span></li>
                <li className="flex justify-between"><span>Headphones</span><span>892</span></li>
                <li className="flex justify-between"><span>Smart Watches</span><span>412</span></li>
              </ul>
            </div>

            <div className="bg-white p-4 rounded shadow-sm text-sm">
              <h4 className="font-semibold mb-2">Offers</h4>
              <p>Bank offers, Exchange offers, No-cost EMI and more.</p>
            </div>
          </div>
        </aside>

        {/* Right content */}
        <section className="lg:col-span-3 space-y-6">
          {/* Hero / Carousel */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 bg-gradient-to-r from-yellow-100 to-white rounded p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Big Savings on Electronics</h2>
                <p className="mt-2 text-sm">Up to 60% off — limited time deals on mobiles, TVs & more.</p>
                <div className="mt-4 flex gap-3">
                  <button className="bg-blue-600 text-white px-4 py-2 rounded">Shop Now</button>
                  <button className="border px-4 py-2 rounded">View Offers</button>
                </div>
              </div>
              <img src="https://via.placeholder.com/260x160?text=Hero+Banner" alt="hero" className="hidden md:block rounded" />
            </div>

            <div className="bg-white p-4 rounded shadow-sm">
              <h4 className="font-semibold mb-2">Flash Sale</h4>
              <img src="https://via.placeholder.com/330x160?text=Flash+Sale" alt="flash" className="w-full rounded" />
            </div>
          </div>

          {/* Sort & view controls */}
          <div className="flex items-center justify-between">
            <div className="text-sm">Showing 1–24 of 5,432 results</div>
            <div className="flex items-center gap-3">
              <select className="border px-2 py-1 rounded">
                <option>Relevance</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Newest First</option>
              </select>
              <div className="flex items-center gap-2 text-sm">
                <button className="px-2 py-1 border rounded">Grid</button>
                <button className="px-2 py-1 border rounded">List</button>
              </div>
            </div>
          </div>

          {/* Products grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {sampleProducts.map((p) => (
              <article key={p.id} className="bg-white p-3 rounded shadow-sm hover:shadow-md transition">
                <div className="relative">
                  {p.badge && (
                    <span className="absolute top-2 left-2 bg-yellow-400 text-black text-xs px-2 py-1 rounded">{p.badge}</span>
                  )}
                  <img src={p.image} alt={p.title} className="w-full h-40 object-contain" />
                </div>
                <h3 className="mt-2 text-sm font-medium line-clamp-2">{p.title}</h3>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <div>
                    <div className="font-bold">₹{p.price}</div>
                    <div className="text-xs line-through text-gray-400">₹{p.originalPrice}</div>
                  </div>
                  <div className="text-xs bg-green-600 text-white px-2 py-1 rounded">{p.rating}★</div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button className="flex-1 border rounded py-1 text-sm">Add to Cart</button>
                  <button className="w-10 border rounded py-1 text-sm">❤️</button>
                </div>
              </article>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center py-6">
            <div className="inline-flex items-center gap-2">
              <button className="px-3 py-1 border rounded">Prev</button>
              <button className="px-3 py-1 border rounded bg-blue-600 text-white">1</button>
              <button className="px-3 py-1 border rounded">2</button>
              <button className="px-3 py-1 border rounded">3</button>
              <button className="px-3 py-1 border rounded">Next</button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <h4 className="font-semibold mb-2">About</h4>
            <p className="text-sm">Short description about the shop. Customer care info, policies and more.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Help</h4>
            <ul className="text-sm space-y-1">
              <li>Payments</li>
              <li>Shipping</li>
              <li>FAQ</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Shop by Category</h4>
            <ul className="text-sm space-y-1">
              <li>Mobiles</li>
              <li>Electronics</li>
              <li>Home & Kitchen</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Download App</h4>
            <div className="space-y-2 text-sm">
              <div className="border rounded px-3 py-2 inline-block">App Store</div>
              <div className="border rounded px-3 py-2 inline-block">Google Play</div>
            </div>
          </div>
        </div>
        <div className="text-center text-xs text-gray-500 py-4">© {new Date().getFullYear()} YourShop — Built with ❤️</div>
      </footer>
    </div>
  );
}
