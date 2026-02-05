// services/api.js

export const STORAGE_KEYS = {
  API_HOST: 'rzp_api_host',
  TOKEN: 'rzp_token',
  USER: 'rzp_username',
  SESSION: 'rzp_session',
  CART_ID: 'rzp_cart_id'
};

let tokenCache = localStorage.getItem(STORAGE_KEYS.TOKEN) || null;

export function getApiHost(){
return process.env.REACT_APP_API_HOST || 'http://localhost:8080';
 }
export function setApiHost(h){ localStorage.setItem(STORAGE_KEYS.API_HOST, h); }

export function getToken(){ return tokenCache || localStorage.getItem(STORAGE_KEYS.TOKEN); }
export function setToken(t){ tokenCache = t; if(t){ localStorage.setItem(STORAGE_KEYS.TOKEN, t); } else { localStorage.removeItem(STORAGE_KEYS.TOKEN); } }
export function setUser(u){ if(u){ localStorage.setItem(STORAGE_KEYS.USER, u); } else { localStorage.removeItem(STORAGE_KEYS.USER); } }

export function getSession() {
  let s = localStorage.getItem(STORAGE_KEYS.SESSION);
  if (!s) {
    s = generateSecureId();
    localStorage.setItem(STORAGE_KEYS.SESSION, s);
  }
  return s;
}
export function generateSecureId() {
  return 'sess_' + ([1e7]+-1e3+-4e3+-8e3+-1e11)
    .replace(/[018]/g, c =>
      ((c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16))
    );
}
export function setSavedCartId(id){ if(id){ localStorage.setItem(STORAGE_KEYS.CART_ID, id); } else { localStorage.removeItem(STORAGE_KEYS.CART_ID); } }
export function getSavedCartId(){ return localStorage.getItem(STORAGE_KEYS.CART_ID); }

async function _fetch(path, opts = {}) {
  const host = getApiHost().replace(/\/$/, '');
  const url = host + path;

  const { headers: customHeaders = {}, signal, ...rest } = opts;

  const headers = { ...customHeaders };
  const token = getToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;

  const res = await fetch(url, {
    ...rest,
    headers,
    signal,
    mode: 'cors'
  });

  let data = null;
  try {
    data = await res.json();
  } catch {}

  if (!res.ok) {
    const err = new Error(
      data?.message || `HTTP ${res.status}`
    );
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}




export const api = {
  login: (username, password) => _fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ username, password }) }),
  products: () => _fetch('/api/products'),
  saveCart: (payload) => _fetch('/api/carts', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) }),
  loadActiveCart: () => _fetch('/api/carts/active?sessionId=' + encodeURIComponent(getSession())),
  createAppOrder: () => _fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ sessionId: getSession() }) }),
  createPaymentOrder: (payload) => _fetch('/api/orders', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) }),
  capturePayment: (payload) => _fetch('/api/payments/capture', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) }),

  sendOtp: (phone, opts = {}) =>
    _fetch('/api/auth/otp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
      ...opts            // ✅ allows signal
    }),

  verifyOtp: (phone, requestId, otp, opts = {}) =>
    _fetch('/api/auth/otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, requestId, otp }),
      ...opts            // ✅ allows signal
    }),

  // Signup: expects payload matching UserAddressDTO
  // {
  //   users: { username, password, email, role },
  //   name, phone, line1, line2, city, state, pincode, country, lat, lng
  // }
  signup: async (payload, { autoLogin = true } = {}) => {
    const res = await _fetch('/api/signup', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
    // If backend returns a token on signup, store it and set username
    try {
      if (autoLogin && res && (res.token || res.accessToken)) {
        setToken(res.token || res.accessToken);
        // set username from payload if available; otherwise from response if present
        const uname = (payload && payload.users && payload.users.username) || res.username || (res.user && res.user.username);
        if (uname) setUser(uname);
      }
    } catch (e) {
      // ignore token handling errors
      console.warn('signup auto-login failed', e);
    }
    return res;
  }
};
