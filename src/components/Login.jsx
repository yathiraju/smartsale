import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api, setToken, setUser } from "../services/api";
import { useOtpAuth } from "../hooks/useOtpAuth";

export default function Login() {
  const phoneRef = useRef(null);
  const otpRef = useRef(null);
  const navigate = useNavigate();

  const {
    step,        // "PHONE" | "OTP"
    loading,
    error,
    expiresIn,
    sendOtp,
    verifyOtp,
    reset,
  } = useOtpAuth(api);

  // ---------- Validation helpers ----------
  const validatePhone = (phone) => {
    if (!phone) return "Mobile number is required";
    if (!/^[6-9]\d{9}$/.test(phone))
      return "Enter a valid 10-digit mobile number";
    return null;
  };

  const validateOtp = (otp) => {
    if (!otp) return "OTP is required";
    if (!/^\d{6}$/.test(otp))
      return "OTP must be 6 digits";
    return null;
  };

  // ---------- Submit handler ----------
  async function handleSubmit(e) {
    e.preventDefault();

    const phone = phoneRef.current?.value?.trim();
    const otp = otpRef.current?.value?.trim();

    // STEP 1: Send OTP
    if (step === "PHONE") {
      const phoneError = validatePhone(phone);
      if (phoneError) {
        reset(phoneError);
        return;
      }

      try {
        await sendOtp(phone);
      } catch {
        // error handled by hook
      }
      return;
    }

    // STEP 2: Verify OTP
    if (step === "OTP") {
      const otpError = validateOtp(otp);
      if (otpError) {
        reset(otpError);
        return;
      }

      try {
        const res = await verifyOtp(phone, otp);

        if (!res || !res.success) {
          reset("Invalid OTP. Please try again.");
          return;
        }

        if (res.token) {
          setToken(res.token);
        }

        setUser(phone);

        // allow response flush before navigation
        setTimeout(() => {
          navigate("/");
        }, 0);
      } catch {
        // error handled by hook
      }
    }
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded shadow max-w-md w-full"
      >
        <h2 className="text-2xl font-bold mb-4 text-center">
          {step === "PHONE" ? "Login with Mobile" : "Enter OTP"}
        </h2>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 text-red-700 bg-red-100 border border-red-300 rounded text-sm">
            {error}
          </div>
        )}

        {/* Phone */}
        <input
          ref={phoneRef}
          type="tel"
          placeholder="Enter mobile number"
          disabled={step === "OTP"}
          className="border p-2 rounded w-full mb-3 disabled:bg-gray-100"
        />

        {/* OTP */}
        {step === "OTP" && (
          <>
            <input
              ref={otpRef}
              type="number"
              placeholder="Enter 6 digit OTP"
              className="border p-2 rounded w-full mb-2"
            />

            {expiresIn > 0 && (
              <div className="text-xs text-gray-600 mb-2">
                OTP expires in <b>{expiresIn}s</b>
              </div>
            )}
          </>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
        >
          {loading
            ? "Please wait..."
            : step === "PHONE"
            ? "Send OTP"
            : "Verify OTP"}
        </button>

        {step === "OTP" && (
          <button
            type="button"
            onClick={() => reset()}
            className="w-full mt-3 text-sm text-gray-600 hover:underline"
          >
            ← Change mobile number
          </button>
        )}
      </form>
    </div>
    </div>
  );
}
