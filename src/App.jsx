import React from "react";
import { Routes, Route } from 'react-router-dom';
import FlipkartLikeApp from "./FlipkartLikeApp";
import Login from './components/Login';
import OrdersPage from './components/OrdersPage';
import SignupPage from "./pages/SignupPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<FlipkartLikeApp />} />
      <Route path="/login" element={<Login />} />
      <Route path="/orders" element={<OrdersPage />} />
      <Route path="/signup" element={<SignupPage />} />
    </Routes>
  );
}
