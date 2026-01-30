import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setToken, setUser } from '../services/api';

export default function Login() {
  const phoneRef = useRef(null);
  const otpRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1 = enter phone, 2 = enter otp
  const [requestId, setRequestId] = useState(null);

  const navigate = useNavigate();

  // STEP 1: Send OTP
  async function handleSendOtp(e) {
    e.preventDefault();
    if (loading) return;

    setError('');

    let phone = phoneRef.current.value.trim();

    if (!phone) {
      setError('Please enter mobile number');
      return;
    }

    // normalize phone (India)

      if (phone.startsWith('91')) {

      } else {
        phone = '91' + phone;
      }


    try {
      setLoading(true);
      const res = await api.sendOtp(phone);

      if (!res?.requestId) throw new Error('Invalid response from server');

      setRequestId(res.requestId);
      setStep(2); // move to OTP screen
    } catch (err) {
      console.error(err);
      setError('Failed to send OTP. Try again.');
    } finally {
      setLoading(false);
    }
  }

  // STEP 2: Verify OTP
  async function handleVerifyOtp(e) {
    e.preventDefault();
    if (loading) return;

    setError('');

    const otp = otpRef.current.value.trim();
    let phone = phoneRef.current.value.trim();

    if (!otp) {
      setError('Please enter OTP');
      return;
    }


      if (phone.startsWith('91') ) {

      } else {
        phone = '91' + phone;
      }


    try {
      setLoading(true);
      const res = await api.verifyOtp(phone, requestId, otp);

      if (!res?.success) {
        throw new Error('OTP verification failed');
      }

      // If your backend returns token later, use it here
      // For now, just store phone as user
      setUser(phone);
      setToken(res.token);
      localStorage.setItem('rzp_username', phone);

      navigate('/');
    } catch (err) {
      console.error(err);
      setError('Invalid OTP or OTP expired');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <form
        onSubmit={step === 1 ? handleSendOtp : handleVerifyOtp}
        className="bg-white p-6 rounded shadow max-w-md w-full"
      >
        <h2 className="text-2xl font-bold mb-4 text-center">
          {step === 1 ? 'Login with Mobile' : 'Enter OTP'}
        </h2>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-2 text-red-700 bg-red-100 border border-red-300 rounded text-sm">
            {error}
          </div>
        )}

        {/* Phone Input */}
        <input
          ref={phoneRef}
          placeholder="Enter mobile number"
          className="border p-2 rounded w-full mb-3"
          disabled={step === 2}
        />

        {/* OTP Input */}
        {step === 2 && (
          <input
            ref={otpRef}
            placeholder="Enter 6 digit OTP"
            className="border p-2 rounded w-full mb-4"
          />
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading
            ? 'Please wait...'
            : step === 1
            ? 'Send OTP'
            : 'Verify OTP'}
        </button>

        {step === 2 && (
          <button
            type="button"
            onClick={() => {
              setStep(1);
              setRequestId(null);
            }}
            className="w-full mt-3 text-sm text-gray-600 hover:underline"
          >
            ← Change mobile number
          </button>
        )}
      </form>
    </div>
  );
}
