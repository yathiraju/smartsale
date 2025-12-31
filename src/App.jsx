import React from "react";
import { Routes, Route } from 'react-router-dom';
import FlipkartLikeApp from "./FlipkartLikeApp";
import Login from './components/Login';
import OrdersPage from './components/OrdersPage';
import SignupPage from "./pages/SignupPage";
import TermsAndConditions from "./pages/TermsAndConditions";
import RefundPolicy from "./pages/RefundPolicy";
import ShippingPolicy from "./pages/ShippingPolicy";
import Contact from "./pages/Contact";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<FlipkartLikeApp />} />
      <Route path="/login" element={<Login />} />
      <Route path="/orders" element={<OrdersPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
      <Route path="/refund-policy" element={<RefundPolicy />} />
      <Route path="/shipping-policy" element={<ShippingPolicy />} />
       <Route path="/contact" element={<Contact />} />
    </Routes>
  );
}
