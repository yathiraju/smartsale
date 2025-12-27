import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setToken, setUser } from '../services/api';

export default function Login() {
  const usernameRef = useRef(null);
  const passwordRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    if (loading) return;

    const username = usernameRef.current.value.trim();
    const password = passwordRef.current.value.trim();

    if (!username || !password) {
      alert('Enter username and password');
      return;
    }

    try {
      setLoading(true);
      const res = await api.login(username, password);

      if (!res?.token) throw new Error('Invalid response');

      setToken(res.token);
      setUser(username);
      localStorage.setItem('rzp_username', username);

      navigate('/'); // go back to home after login
    } catch (err) {
      console.error(err);
      alert('Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <form
        onSubmit={handleLogin}
        className="bg-white p-6 rounded shadow max-w-md w-full"
      >
        <h2 className="text-2xl font-bold mb-4 text-center">Login</h2>

        <input
          ref={usernameRef}
          placeholder="Username"
          className="border p-2 rounded w-full mb-3"
        />

        <input
          ref={passwordRef}
          type="password"
          placeholder="Password"
          className="border p-2 rounded w-full mb-4"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>

        <button
          type="button"
          onClick={() => navigate('/')}
          className="w-full mt-3 text-sm text-gray-600 hover:underline"
        >
          ← Back to Home
        </button>
      </form>
    </div>
  );
}
