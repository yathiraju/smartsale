// pages/SignupPage.jsx
import React, { useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import IndiaStateSelect from "../components/IndiaStateSelect";
import { getApiHost } from "../services/api";

export default function SignupPage() {
  const navigate = useNavigate();
  const usernameRef = useRef(null);

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "USER",
    name: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
    country: "IN"
  });

  // ---------- validations ----------
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPhone = (phone) => /^\d{10}$/.test(phone);
  const isValidName = (name) => /^[A-Za-z\s]+$/.test(name);
  const isValidPincode = (pin) => /^[1-9][0-9]{5}$/.test(pin);

  function update(k, v) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  async function submit(e) {
    e.preventDefault();
    if (loading) return;

    const {
      username, email, password, name,
      phone, line1, city, state, pincode
    } = form;

    // required checks
    if (!username || !email || !password || !name || !phone || !line1 || !city || !state || !pincode) {
      return alert("All mandatory fields must be filled");
    }

    if (!isValidEmail(email)) return alert("Invalid email");
    if (!isValidPhone(phone)) return alert("Phone must be 10 digits");
    if (!isValidName(name)) return alert("Name must contain only letters");
    if (!isValidPincode(pincode)) return alert("Invalid pincode");

    setLoading(true);

    try {
      const http = axios.create({
        baseURL: getApiHost(),
        headers: { "Content-Type": "application/json" }
      });

      const payload = {
        users: {
          username: form.username,
          password: form.password,
          email: form.email,
          role: form.role
        },
        name: form.name,
        phone: form.phone,
        line1: form.line1,
        line2: form.line2,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
        country: form.country
      };

      await http.post("/api/signup", payload);

      alert("Signup successful. Please login.");
      navigate("/login");

    } catch (err) {
      console.error(err);
      alert("Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <form
        onSubmit={submit}
        className="bg-white p-6 rounded shadow max-w-xl w-full"
      >
        <h2 className="text-xl font-bold mb-4 text-center">
          Create Account
        </h2>

        <div className="grid grid-cols-2 gap-3">

          <input placeholder="Username" value={form.username}
            onChange={e => update("username", e.target.value)}
            className="border p-2 rounded" />

          <input placeholder="Email" value={form.email}
            onChange={e => update("email", e.target.value)}
            className="border p-2 rounded" />

          <input type="password" placeholder="Password" value={form.password}
            onChange={e => update("password", e.target.value)}
            className="border p-2 rounded" />

          <input placeholder="Name" value={form.name}
            onChange={e => update("name", e.target.value.replace(/[^A-Za-z\s]/g, ""))}
            className="border p-2 rounded" />

          <input placeholder="Phone" maxLength={10} value={form.phone}
            onChange={e => update("phone", e.target.value.replace(/\D/g, ""))}
            className="border p-2 rounded" />

          <input placeholder="Address Line 1" value={form.line1}
            onChange={e => update("line1", e.target.value)}
            className="border p-2 rounded" />

          <input placeholder="Address Line 2" value={form.line2}
            onChange={e => update("line2", e.target.value)}
            className="border p-2 rounded" />

          <input placeholder="City" value={form.city}
            onChange={e => update("city", e.target.value)}
            className="border p-2 rounded" />

          <div className="col-span-2">
            <IndiaStateSelect
              value={form.state}
              onChange={state => update("state", state)}
            />
          </div>

          <input placeholder="Pincode" maxLength={6} value={form.pincode}
            onChange={e => update("pincode", e.target.value.replace(/\D/g, ""))}
            className="border p-2 rounded" />
        </div>

        <div className="flex justify-between mt-4">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="text-gray-600"
          >
            ← Back
          </button>

          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-1 rounded"
          >
            {loading ? "Signing up..." : "Sign Up"}
          </button>
        </div>
      </form>
    </div>
  );
}
