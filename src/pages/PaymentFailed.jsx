import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaTimesCircle } from "react-icons/fa";
import Footer from "../components/Footer";

export default function PaymentFailed() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const { orderId, reason } = state || {};

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">

      {/* 🖤 HEADER */}
      <div className="bg-black">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-center">
          <img
            src="/smartsale.png"
            alt="SmartSale"
            className="h-10 w-auto object-contain"
          />
        </div>
      </div>

      {/* ❌ MAIN CONTENT */}
      <div className="flex-grow flex items-center justify-center px-4">
        <div className="bg-white rounded shadow-lg p-6 max-w-md w-full text-center">

          <FaTimesCircle className="text-red-500 text-5xl mx-auto mb-4" />

          <h1 className="text-2xl font-bold mb-2">
            Payment Failed
          </h1>

          <p className="text-gray-600 mb-4">
            Unfortunately, your payment could not be completed.
          </p>

          {orderId && (
            <div className="text-sm bg-gray-50 border rounded p-3 mb-3">
              <strong>Order ID:</strong> {orderId}
            </div>
          )}

          {reason && (
            <div className="text-sm text-red-600 mb-4">
              Reason: {reason}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            >
              Retry Payment
            </button>

            <button
              onClick={() => navigate("/", { replace: true })}
              className="flex-1 border border-gray-400 py-2 rounded hover:bg-gray-100"
            >
              Back to Home
            </button>
          </div>

        </div>
      </div>

      {/* 🔻 FOOTER */}
      <Footer />
    </div>
  );
}
