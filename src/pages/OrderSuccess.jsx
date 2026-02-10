import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaCheckCircle } from "react-icons/fa";
import Footer from "../components/Footer";

export default function OrderSuccess() {
  const navigate = useNavigate();
  const { state } = useLocation();

  // data passed from payment success
  const {
    orderId,
    amount,
    address
  } = state || {};

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">

      {/* 🖤 HEADER ROW */}
      <div className="bg-black">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-center">
          <img
            src="/smartsale.png"
            alt="SmartSale"
            className="h-10 w-auto object-contain"
          />
        </div>
      </div>

      {/* ✅ MAIN CONTENT (centered card) */}
      <div className="flex-grow flex items-center justify-center px-4">
        <div className="bg-white rounded shadow-lg p-6 max-w-md w-full text-center">

          <FaCheckCircle className="text-green-500 text-5xl mx-auto mb-4" />

          <h1 className="text-2xl font-bold mb-2">
            Order Placed Successfully
          </h1>

          <p className="text-gray-600 mb-4">
            Thank you for shopping with <strong>Smart Sale</strong>
          </p>

          {/* Order Info */}
          {orderId && (
            <div className="text-left text-sm border rounded p-3 mb-4 bg-gray-50">
              <div><strong>Order ID:</strong> {orderId}</div>
              {amount && <div><strong>Amount Paid:</strong> ₹{amount}</div>}
              {address && (
                <div className="mt-2">
                  <strong>Delivered To:</strong>
                  <div className="text-gray-600 text-xs">
                    {address.name}<br />
                    {address.addressLine1}<br />
                    {address.city} - {address.pincode}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/", { replace: true })}
              className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            >
              Back to Home
            </button>

            <button
              onClick={() => navigate("/orders")}
              className="flex-1 border border-blue-600 text-blue-600 py-2 rounded hover:bg-blue-50"
            >
              View Orders
            </button>
          </div>

        </div>
      </div>

      {/* 🔻 FOOTER */}
      <Footer />

    </div>
  );

}
