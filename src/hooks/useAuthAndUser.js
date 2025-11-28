import { useState } from 'react';
import { api, getToken, setToken, setUser } from '../services/api';

export default function useAuthAndUser() {
  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(getToken()));
  const [usernameDisplay, setUsernameDisplay] = useState(localStorage.getItem('rzp_username') || '');

  async function login(username, password) {
    const res = await api.login(username, password);
    if (res && res.token) {
      setToken(res.token);
      setUser(username);
      localStorage.setItem('rzp_username', username);
      setUsernameDisplay(username);
      setIsLoggedIn(true);
      return true;
    }
    return false;
  }

  function logout() {
    setToken(null);
    setUser(null);
    setIsLoggedIn(false);
    setUsernameDisplay('');
    try { localStorage.removeItem('rzp_username'); } catch (_) {}
  }

  return { isLoggedIn, usernameDisplay, login, logout, setIsLoggedIn, setUsernameDisplay };
}
