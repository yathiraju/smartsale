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

  // 🔴 inline error states
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");

  // ---------- validations ----------
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPhone = (phone) => /^\d{10}$/.test(phone);
  const isValidName = (name) => /^[A-Za-z\s]+$/.test(name);
  const isValidPincode = (pin) => /^[1-9][0-9]{5}$/.test(pin);

  function update(key, value) {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: "" })); // clear field error
    setFormError("");
  }

  async function submit(e) {
    e.preventDefault();
    if (loading) return;

    const {
      username,
      email,
      password,
      name,
      phone,
      line1,
      city,
      state,
      pincode
    } = form;

    const newErrors = {};

    // 🔴 Mandatory checks
    if (!username.trim()) newErrors.username = "Username is required";
    if (!email.trim()) newErrors.email = "Email is required";
    if (!password.trim()) newErrors.password = "Password is required";
    if (!name.trim()) newErrors.name = "Name is required";
    if (!phone.trim()) newErrors.phone = "Phone is required";
    if (!line1.trim()) newErrors.line1 = "Address Line 1 is required";
    if (!city.trim()) newErrors.city = "City is required";
    if (!state.trim()) newErrors.state = "State is required";
    if (!pincode.trim()) newErrors.pincode = "Pincode is required";

    // 🔴 Format validations
    if (email && !isValidEmail(email))
      newErrors.email = "Please enter a valid email address";

    if (phone && !isValidPhone(phone))
      newErrors.phone = "Phone number must be exactly 10 digits";

    if (name && !isValidName(name))
      newErrors.name = "Name should contain only letters";

    if (pincode && !isValidPincode(pincode))
      newErrors.pincode = "Pincode must be a valid 6-digit number";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

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

      navigate("/login");

    } catch (err) {
      console.error(err);
      setFormError("Signup failed. Please try again.");
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

        {/* 🔴 Form-level error */}
        {formError && (
          <div className="mb-3 bg-red-100 text-red-700 px-3 py-2 rounded">
            {formError}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">

          {/* Username */}
          <div>
            <input
              ref={usernameRef}
              placeholder="Username"
              value={form.username}
              onChange={e => update("username", e.target.value)}
              className="border p-2 rounded w-full"
            />
            {errors.username && <p className="text-red-600 text-xs">{errors.username}</p>}
          </div>

          {/* Email */}
          <div>
            <input
              placeholder="Email"
              value={form.email}
              onChange={e => update("email", e.target.value)}
              className="border p-2 rounded w-full"
            />
            {errors.email && <p className="text-red-600 text-xs">{errors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={e => update("password", e.target.value)}
              className="border p-2 rounded w-full"
            />
            {errors.password && <p className="text-red-600 text-xs">{errors.password}</p>}
          </div>

          {/* Name */}
          <div>
            <input
              placeholder="Name"
              value={form.name}
              onChange={e => update("name", e.target.value.replace(/[^A-Za-z\s]/g, ""))}
              className="border p-2 rounded w-full"
            />
            {errors.name && <p className="text-red-600 text-xs">{errors.name}</p>}
          </div>

          {/* Phone */}
          <div>
            <input
              placeholder="Phone"
              maxLength={10}
              value={form.phone}
              onChange={e => update("phone", e.target.value.replace(/\D/g, ""))}
              className="border p-2 rounded w-full"
            />
            {errors.phone && <p className="text-red-600 text-xs">{errors.phone}</p>}
          </div>

          {/* Address Line 1 */}
          <div>
            <input
              placeholder="Address Line 1"
              value={form.line1}
              onChange={e => update("line1", e.target.value)}
              className="border p-2 rounded w-full"
            />
            {errors.line1 && <p className="text-red-600 text-xs">{errors.line1}</p>}
          </div>

          {/* Address Line 2 */}
          <input
            placeholder="Address Line 2"
            value={form.line2}
            onChange={e => update("line2", e.target.value)}
            className="border p-2 rounded col-span-2"
          />

          {/* City */}
          <div>
            <input
              placeholder="City"
              value={form.city}
              onChange={e => update("city", e.target.value)}
              className="border p-2 rounded w-full"
            />
            {errors.city && <p className="text-red-600 text-xs">{errors.city}</p>}
          </div>

          {/* State */}
          <div>
            <IndiaStateSelect
              value={form.state}
              onChange={state => update("state", state)}
            />
            {errors.state && <p className="text-red-600 text-xs">{errors.state}</p>}
          </div>

          {/* Pincode */}
          <div>
            <input
              placeholder="Pincode"
              maxLength={6}
              value={form.pincode}
              onChange={e => update("pincode", e.target.value.replace(/\D/g, ""))}
              className="border p-2 rounded w-full"
            />
            {errors.pincode && <p className="text-red-600 text-xs">{errors.pincode}</p>}
          </div>
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
            disabled={loading}
          >
            {loading ? "Signing up..." : "Sign Up"}
          </button>
        </div>
      </form>
    </div>
  );
}
