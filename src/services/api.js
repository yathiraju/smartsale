export const STORAGE_KEYS = {
  API_HOST: 'rzp_api_host',
  TOKEN: 'rzp_token',
  USER: 'rzp_username',
  SESSION: 'rzp_session',
  CART_ID: 'rzp_cart_id'
};

let tokenCache = localStorage.getItem(STORAGE_KEYS.TOKEN) || null;

export function getApiHost(){ return localStorage.getItem(STORAGE_KEYS.API_HOST) || 'http://localhost:8080'; }
export function setApiHost(h){ localStorage.setItem(STORAGE_KEYS.API_HOST, h); }
export function getToken(){ return tokenCache || localStorage.getItem(STORAGE_KEYS.TOKEN); }
export function setToken(t){ tokenCache = t; if(t){ localStorage.setItem(STORAGE_KEYS.TOKEN, t); } else { localStorage.removeItem(STORAGE_KEYS.TOKEN); } }
export function setUser(u){ if(u){ localStorage.setItem(STORAGE_KEYS.USER, u); } else { localStorage.removeItem(STORAGE_KEYS.USER); } }
export function getSession(){ let s = localStorage.getItem(STORAGE_KEYS.SESSION); if(!s){ s = 'sess_' + Math.random().toString(36).slice(2,12); localStorage.setItem(STORAGE_KEYS.SESSION, s);} return s; }
export function setSavedCartId(id){ if(id){ localStorage.setItem(STORAGE_KEYS.CART_ID, id); } else { localStorage.removeItem(STORAGE_KEYS.CART_ID); } }
export function getSavedCartId(){ return localStorage.getItem(STORAGE_KEYS.CART_ID); }

async function _fetch(path, opts = {}){
  const host = getApiHost().replace(/\/$/, '');
  const url = host + path;
  const headers = opts.headers || {};
  const token = getToken();
  if(token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(url, { ...opts, headers, mode: 'cors' });
  const text = await res.text();
  try{ return JSON.parse(text); } catch(e){ return text; }
}

export const api = {
  login: (username, password) => _fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ username, password }) }),
  products: () => _fetch('/api/products'),
  saveCart: (payload) => _fetch('/api/carts', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) }),
  loadActiveCart: () => _fetch('/api/carts/active?sessionId=' + encodeURIComponent(getSession())),
  createAppOrder: () => _fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ sessionId: getSession() }) }),
  createPaymentOrder: (payload) => _fetch('/api/orders', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) }),
  capturePayment: (payload) => _fetch('/api/payments/capture', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) })
};
