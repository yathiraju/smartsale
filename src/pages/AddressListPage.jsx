// pages/AddressListPage.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { getApiHost } from "../services/api";

export default function AddressListPage() {
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAddresses();
  }, []);

  async function fetchAddresses() {
    try {
      const username = localStorage.getItem("rzp_username");
      if (!username) {
        alert("Please login again");
        navigate("/login");
        return;
      }

      const http = axios.create({
        baseURL: getApiHost(),
        headers: { "Content-Type": "application/json" }
      });

      const res = await http.get(
        `/api/user/address/${encodeURIComponent(username)}`
      );

      setAddresses(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to load addresses", err);
      alert("Failed to load saved addresses");
    } finally {
      setLoading(false);
    }
  }

  function selectAddress(addr) {
    // store selected address (simple & reliable)
    localStorage.setItem("selected_address", JSON.stringify(addr));
    navigate("/");
  }

  if (loading) {
    return (
      <div className="p-4 text-center">
        Loading addresses...
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Delivery Addresses</h2>

      {addresses.length === 0 && (
        <div className="text-gray-600 mb-4">
          No saved addresses found.
        </div>
      )}

      <div className="space-y-3">
        {addresses.map((a, idx) => (
          <div
            key={idx}
            className="border rounded p-3 flex justify-between items-start"
          >
            <div>
              <div className="font-semibold">
                {a.name || "Address"}
              </div>
              <div className="text-sm text-gray-600">
                {a.line1}
                {a.line2 ? `, ${a.line2}` : ""}
              </div>
              <div className="text-sm text-gray-600">
                {a.city}, {a.state} - {a.pincode}
              </div>
              <div className="text-sm text-gray-600">
                Phone: {a.phone}
              </div>
            </div>

            <button
              onClick={() => selectAddress(a)}
              className="bg-blue-600 text-white px-3 py-1 rounded"
            >
              Deliver Here
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-between">
        <button
          onClick={() => navigate("/")}
          className="text-gray-600"
        >
          ← Back
        </button>

        <button
          onClick={() => navigate("/addresses/new")}
          className="bg-green-600 text-white px-3 py-1 rounded"
        >
          + Add New Address
        </button>
      </div>
    </div>
  );
}
