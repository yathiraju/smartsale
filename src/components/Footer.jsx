import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-gray-100 border-t mt-10">
      <div className="max-w-7xl mx-auto px-4 py-6 text-sm text-gray-600">

        {/* Top row */}
        <div className="flex flex-col md:flex-row md:justify-between gap-4">

          {/* Brand */}
          <div>
            <img src="/smartsale.png" alt="SmartSale" className="h-8 mb-2" />
            <p className="max-w-sm">
              SmartSale is an online shopping platform offering quality products
              with reliable delivery across India.
            </p>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <Link to="/terms-and-conditions" className="hover:underline">Terms & Conditions</Link>
              <Link to="/refund-policy" className="hover:underline">Refund Policy</Link>
              <Link to="/privacyPolicy" className="hover:underline">Privacy Policy</Link>
              <Link to="/shipping-policy" className="hover:underline">Shipping Policy</Link>
            </div>

            <div className="flex flex-col gap-1">
              <Link to="/contact" className="hover:underline">Contact Us</Link>
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="border-t mt-6 pt-4 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} SmartSale. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
