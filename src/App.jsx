import React from "react";
import { Routes, Route } from 'react-router-dom';
import FlipkartLikeApp from "./FlipkartLikeApp";
import Login from './components/Login';
import OrdersPage from './components/OrdersPage';
import SignupPage from "./pages/SignupPage";
import AddressListPage from "./pages/AddressListPage";
import AddAddressPage from "./pages/AddAddressPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<FlipkartLikeApp />} />
      <Route path="/login" element={<Login />} />
      <Route path="/orders" element={<OrdersPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/addresses" element={<AddressListPage />} />
       <Route path="/addresses/new" element={<AddAddressPage />} />
    </Routes>
  );
}
