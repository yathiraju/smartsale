import { useEffect, useRef, useState } from "react";

export function useOtpAuth(api) {
  const [step, setStep] = useState("PHONE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [requestId, setRequestId] = useState(null);
  const [expiresIn, setExpiresIn] = useState(0);

  const controllerRef = useRef(null);
  const inFlightRef = useRef(false);
  const timerRef = useRef(null);

  const normalizePhone = (p) =>
    p.startsWith("91") ? p : "91" + p;

  function cleanup() {
    if (controllerRef.current) controllerRef.current.abort();
    if (timerRef.current) clearInterval(timerRef.current);
    controllerRef.current = null;
    timerRef.current = null;
    inFlightRef.current = false;
  }

  // 🔴 CENTRAL ERROR HANDLER
function handleApiError(err, fallbackMessage) {
  if (err?.name === "AbortError") return;

  // ✅ backend JSON message (highest priority)
  if (err?.data?.message) {
    setError(err.data.message);
    return;
  }

  // ✅ Error.message (from _fetch)
  if (err?.message) {
    setError(err.message);
    return;
  }

  // fallback (last resort)
  setError(fallbackMessage || "Something went wrong");
}


  async function sendOtp(phone) {
    if (loading || inFlightRef.current) return;

    const normalized = normalizePhone(phone.trim());
    if (!normalized) {
      setError("Enter mobile number");
      return;
    }

    setError("");
    setLoading(true);
    inFlightRef.current = true;
    controllerRef.current = new AbortController();

    try {
      const res = await api.sendOtp(
        normalized,
        { signal: controllerRef.current.signal }
      );

      setRequestId(res.requestId);
      setStep("OTP");
      setExpiresIn(res.expiresIn || 300);

    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
      inFlightRef.current = false;
    }
  }

  async function verifyOtp(phone, otp) {
    if (loading || inFlightRef.current) return;

    setError("");
    setLoading(true);
    inFlightRef.current = true;
    controllerRef.current = new AbortController();

    try {
      return await api.verifyOtp(
        normalizePhone(phone),
        requestId,
        otp,
        { signal: controllerRef.current.signal }
      );

    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
      inFlightRef.current = false;
    }
  }

  function reset(msg = "") {
    cleanup();
    setStep("PHONE");
    setRequestId(null);
    setError(msg);
    setExpiresIn(0);
  }

  useEffect(() => cleanup, []);

  return {
    step,
    loading,
    error,
    expiresIn,
    sendOtp,
    verifyOtp,
    reset
  };
}
