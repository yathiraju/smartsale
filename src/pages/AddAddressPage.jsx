import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import IndiaStateSelect from "../components/IndiaStateSelect";

export default function AddAddressPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
    country: "IN"
  });

  const [errors, setErrors] = useState({});

  const isValidPhone = (v) => /^\d{10}$/.test(v);
  const isValidPincode = (v) => /^[1-9][0-9]{5}$/.test(v);

  function update(k, v) {
    setForm(prev => ({ ...prev, [k]: v }));
    setErrors(prev => ({ ...prev, [k]: null }));
  }

  function validate() {
    const e = {};

    if (!form.name.trim()) e.name = "Name is required";
    if (!isValidPhone(form.phone)) e.phone = "Phone must be 10 digits";
    if (!form.line1.trim()) e.line1 = "Address Line 1 is required";
    if (!form.city.trim()) e.city = "City is required";
    if (!form.state) e.state = "State is required";
    if (!isValidPincode(form.pincode)) e.pincode = "Invalid pincode";

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function submit(e) {
    e.preventDefault();
    if (!validate()) return;

    /**
     * IMPORTANT:
     * Backend does NOT support POST/PUT for address.
     * Address is saved ONLY during payment capture.
     *
     * So we store temporarily and let AddressListPage pick it up.
     */
    localStorage.setItem(
      "temp_address",
      JSON.stringify({
        ...form,
        pincode: String(form.pincode)
      })
    );

    navigate("/addresses");
  }

  return (
    <div className="max-w-xl mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Add New Address</h2>

      <form onSubmit={submit} className="grid gap-3">

        <div>
          <input
            placeholder="Name"
            value={form.name}
            onChange={e => update("name", e.target.value.replace(/[^A-Za-z\s]/g, ""))}
            className="border p-2 rounded w-full"
          />
          {errors.name && <p className="text-red-600 text-sm">{errors.name}</p>}
        </div>

        <div>
          <input
            placeholder="Phone (10 digits)"
            maxLength={10}
            value={form.phone}
            onChange={e => update("phone", e.target.value.replace(/\D/g, ""))}
            className="border p-2 rounded w-full"
          />
          {errors.phone && <p className="text-red-600 text-sm">{errors.phone}</p>}
        </div>

        <div>
          <input
            placeholder="Address Line 1"
            value={form.line1}
            onChange={e => update("line1", e.target.value)}
            className="border p-2 rounded w-full"
          />
          {errors.line1 && <p className="text-red-600 text-sm">{errors.line1}</p>}
        </div>

        <input
          placeholder="Address Line 2 (optional)"
          value={form.line2}
          onChange={e => update("line2", e.target.value)}
          className="border p-2 rounded w-full"
        />

        <div>
          <input
            placeholder="City"
            value={form.city}
            onChange={e => update("city", e.target.value)}
            className="border p-2 rounded w-full"
          />
          {errors.city && <p className="text-red-600 text-sm">{errors.city}</p>}
        </div>

        <div>
          <IndiaStateSelect
            value={form.state}
            onChange={state => update("state", state)}
          />
          {errors.state && <p className="text-red-600 text-sm">{errors.state}</p>}
        </div>

        <div>
          <input
            placeholder="Pincode"
            maxLength={6}
            value={form.pincode}
            onChange={e => update("pincode", e.target.value.replace(/\D/g, ""))}
            className="border p-2 rounded w-full"
          />
          {errors.pincode && <p className="text-red-600 text-sm">{errors.pincode}</p>}
        </div>

        <div className="flex justify-between mt-4">
          <button
            type="button"
            onClick={() => navigate("/addresses")}
            className="text-gray-600"
          >
            ← Back
          </button>

          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-1 rounded"
          >
            Save & Continue
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-2">
          Address will be saved permanently after successful order.
        </p>

      </form>
    </div>
  );
}
