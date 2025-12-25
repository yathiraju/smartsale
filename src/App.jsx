import React from "react";
import { Routes, Route } from 'react-router-dom';
import FlipkartLikeApp from "./FlipkartLikeApp";
import Login from './components/Login';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<FlipkartLikeApp />} />
      <Route path="/login" element={<Login />} />
    </Routes>
  );
}
