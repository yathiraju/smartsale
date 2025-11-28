import { useState } from 'react';
import { api, getSession } from '../services/api';
import { createHttp } from '../services/http';

export default function useCart() {
  const [cart, setCart] = useState({});
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [shippingChecked, setShippingChecked] = useState(false);
  const [paying, setPaying] = useState(false);

  function resetShippingState() { setShippingChecked(false); setDeliveryFee(0); setSelectedAddress(null); }

  function addToCart(product) {
    setCart(prev => {
      const copy = { ...prev };
      const item = copy[product.id];
      if (item) copy[product.id] = { product, qty: item.qty + 1 };
      else copy[product.id] = { product, qty: 1 };
      return copy;
    });
    resetShippingState();
  }
  function inc(id) { setCart(prev => { const c = { ...prev }; if (c[id]) c[id] = { ...c[id], qty: c[id].qty + 1 }; return c; }); resetShippingState(); }
  function dec(id) { setCart(prev => { const c = { ...prev }; if (c[id]) { const newQty = c[id].qty - 1; if (newQty > 0) c[id] = { ...c[id], qty: newQty }; else delete c[id]; } return c; }); resetShippingState(); }
  function removeFromCart(id) { setCart(prev => { const c = { ...prev }; delete c[id]; return c; }); resetShippingState(); }
  function clearCart() { setCart({}); resetShippingState(); }

  function computeCartWeight() { let sum = 0; Object.values(cart).forEach(ci => { const w = Number(ci?.product?.weight ?? 0.5); sum += w * ci.qty; }); return sum; }

  async function saveCartToServer() {
    try {
      const items = Object.values(cart).map(ci => ({ productId: ci.product.id, quantity: ci.qty, priceAtAdd: ci.product.salePrice ?? ci.product.price }));
      if (items.length === 0) return null;
      const username = localStorage.getItem('rzp_username');
      const payload = { username, sessionId: getSession(), items };
      const res = await api.saveCart(payload);
      return res;
    } catch (e) {
      console.error(e);
      alert('Save cart failed');
      return null;
    }
  }

  async function payFlow(loadRazorpayScript, onSuccessClearCart) {
    if (paying) return;
    setPaying(true);
    try {
      const saved = await saveCartToServer();
      if (!saved?.id) throw new Error('Cart not saved');
      const cartId = saved.id;
      const sub = Object.values(cart).reduce((s, ci) => { const price = Number(ci.product.salePrice ?? ci.product.price ?? 0); return s + price * ci.qty; }, 0);
      const gst = Object.values(cart).reduce((g, ci) => { const price = Number(ci.product.salePrice ?? ci.product.price ?? 0); const taxRate = Number(ci.product.taxRate ?? 0); return g + (price * (taxRate / 100) * ci.qty); }, 0);
      const tax = Math.round(gst * 100) / 100;
      const grand = Math.round((sub + tax + (deliveryFee || 0)) * 100) / 100;
      const amountPaise = Math.round(grand * 100);

      const appOrder = await api.createAppOrder();
      const appId = appOrder?.orderId || appOrder?.id;
      if (!appId) throw new Error('No internal order ID');

      const rzpOrder = await api.createPaymentOrder({ amount: amountPaise, currency: 'INR', orderId: appId, receipt: 'order_' + appId });

      await loadRazorpayScript();

      const rzp = new window.Razorpay({
        key: process.env.REACT_APP_RZP_KEY,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        order_id: rzpOrder.providerOrderId,
        name: 'Shop At Smart Sale',
        description: 'Order ' + appId,
        handler: async (response) => {
          try {
            const body = { ...response, orderId: appId, cartId };
            const cap = await api.capturePayment(body);
            if (cap && String(cap.status).toLowerCase() === 'paid') {
              alert('Order Placed successful');
              onSuccessClearCart();
            } else {
              alert('Payment failed');
            }
          } catch (e) {
            console.error(e);
            alert('Payment failed');
          }
        }
      });

      rzp.on('payment.failed', (err) => { console.error(err); alert('Payment failed: ' + err.error.description); });
      rzp.open();

    } catch (e) {
      console.error(e);
      alert('Payment flow failed: ' + (e.message || e));
    } finally {
      setPaying(false);
    }
  }

  return { cart, addToCart, inc, dec, removeFromCart, clearCart, computeCartWeight, deliveryFee, setDeliveryFee, selectedAddress, setSelectedAddress, shippingChecked, setShippingChecked, saveCartToServer, payFlow, paying };
}
