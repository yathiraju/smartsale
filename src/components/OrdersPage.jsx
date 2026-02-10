import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { getApiHost } from '../services/api';
import { useNavigate } from 'react-router-dom';
import Footer from "./Footer";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey,setRefreshKey] = useState(0);
  const navigate = useNavigate();

  const username = localStorage.getItem('rzp_username');

  // 🔁 Load orders
useEffect(() => {
  async function fetchOrders() {
    setLoading(true);
    try {
      const http = axios.create({
        baseURL: getApiHost(),
        headers: { 'Content-Type': 'application/json' }
      });

      const res = await http.post('/api/orders/byUser', {
        username: username
      });

      setOrders(res.data || []);
    } catch (e) {
      console.error(e);
      alert('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }

  fetchOrders();
}, [username, refreshKey]);


  // ✅ Refund allowed within 48 hours
  function isRefundAllowed(createdAt) {
    const createdTime = new Date(createdAt).getTime();
    const diffHours = (Date.now() - createdTime) / (1000 * 60 * 60);
    return diffHours <= 48;
  }

  // 💸 Refund flow
  async function refundOrder(order) {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;

    const http = axios.create({
      baseURL: getApiHost().replace(/\/+$/, ''),
      headers: { 'Content-Type': 'application/json' }
    });

    try {
      // 1️⃣ Get shipment IDs
      const shipmentRes = await http.post(
        `/api/shipping/shipment/ids/${order.id}`
      );

      const shipmentIds = shipmentRes.data;

      if (!Array.isArray(shipmentIds) || shipmentIds.length === 0) {
        alert('No shipments found for this order');
        return;
      }

      // 2️⃣ Cancel shipments
      await http.post('/api/shipping/shipment/cancel', shipmentIds);

      // 3️⃣ Razorpay refund
      await http.post('/api/refunds', {
        paymentId: order.paymentRef,
        amount: Math.round(order.grandTotal * 100),
        speed: 'optimum',
        receipt: null,
        notes: {
          reason: 'Customer cancelled',
          orderId: String(order.id)
        }
      });

      // 4️⃣ Cancel order
      await http.post(`/api/orders/cancel/${order.id}?restock=true`);

      alert('Order refunded and cancelled successfully');

      // 🔄 Refresh orders
      setRefreshKey(prev => prev + 1);

    } catch (err) {
      console.error(err);
      alert(
        err?.response?.data?.message ||
        'Refund process failed. Please contact support.'
      );
    }
  }

  // ⏳ Loading state
  if (loading) {
    return <div className="p-6">Loading orders...</div>;
  }

  return (

    <div className="max-w-6xl mx-auto p-6">
       {/* 🖤 BLACK HEADER ROW */}
           <div className="bg-black">
             <div className="max-w-6xl mx-auto px-6 py-4 flex justify-center">
               <img
                 src="/smartsale.png"
                 alt="SmartSale"
                 className="h-10 w-auto object-contain"
               />
             </div>
           </div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Orders</h1>

        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-blue-600 text-white rounded font-medium
                       hover:bg-blue-700 active:bg-blue-800 transition"
        >
          ← Back
        </button>
      </div>


      {orders.length === 0 && (
        <div className="text-center text-gray-500 mt-12">
          <div className="text-lg mb-4">No orders found</div>
        </div>
      )}


      <div className="space-y-6">
        {orders.map(order => (
          <div
            key={order.id}
            className="border rounded-lg shadow-sm p-5 bg-white"
          >
            {/* HEADER */}
            <div className="flex flex-wrap justify-between gap-4">
              <div>
                <div className="font-semibold text-lg">
                  Order #{order.id}
                </div>
                <div className="text-sm text-gray-600">
                  Placed on {new Date(order.createdAt).toLocaleString()}
                </div>
              </div>

              <div className="text-right">
                <div className="text-lg font-bold">
                  ₹{order.grandTotal.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">
                  Payment: {order.paymentStatus}
                </div>
              </div>
            </div>

            {/* ITEMS */}
            <div className="mt-4 border-t pt-3">
              <div className="font-semibold mb-2">Items</div>

              {order.items.map(item => (
                <div
                  key={item.id}
                  className="flex justify-between text-sm py-1"
                >
                  <div>
                    <div className="font-medium">
                      {item.product.name}
                    </div>
                  </div>

                  <div className="text-right">
                    ₹{item.product.salePrice} × {item.quantity}
                  </div>
                </div>
              ))}
            </div>

            {/* TOTALS */}
            <div className="mt-4 text-sm border-t pt-3 grid grid-cols-2 gap-y-1">
              <div>Subtotal</div>
              <div className="text-right">₹{order.subTotal}</div>

              <div>Tax</div>
              <div className="text-right">₹{order.tax}</div>

              <div className="font-semibold">Grand Total</div>
              <div className="text-right font-semibold">
                ₹{order.grandTotal}
              </div>
            </div>

            {/* ACTIONS */}
            <div className="mt-4 flex justify-end">
              {order.status === 'FULFILLED' &&
              isRefundAllowed(order.createdAt) ? (
                <button
                  onClick={() => refundOrder(order)}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  Refund
                </button>
              ) : (
                <button
                  disabled
                  className="bg-gray-300 text-gray-600 px-4 py-2 rounded cursor-not-allowed"
                >
                  Refund Not Available
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      <Footer />
    </div>

  );

}
