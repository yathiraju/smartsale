// src/services/apiClient.js
import axios from 'axios';
import { getApiHost, getToken, setToken, setUser } from './api';

// create an axios instance using the app host (falls back to env)
const createInstance = () => {
  const host = (typeof getApiHost === 'function' ? getApiHost() : process.env.REACT_APP_API_HOST) || 'http://localhost:8080';
  const baseURL = host.replace(/\/$/, '');
  return axios.create({
    baseURL,
    timeout: 30000 // 30s - tweak if needed
  });
};

const apiClient = createInstance();

// Request interceptor: attach Authorization if token present
apiClient.interceptors.request.use((config) => {
  try {
    const token = getToken && getToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = 'Bearer ' + token;
    }
  } catch (e) {
    // ignore token retrieval errors
    console.warn('apiClient: token read failed', e);
  }
  return config;
}, (error) => Promise.reject(error));

// Response interceptor: simple 401 handling
apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if (status === 401) {
      // automatically clear token if unauthorized (optional: redirect)
      try {
        setToken && setToken(null);
        setUser && setUser(null);
      } catch (e) { /* ignore */ }
      console.warn('apiClient: 401 response — token cleared');
      // you could also forward location to login page here if desired:
      // window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default apiClient;

// convenience helper: returns a fresh instance (same interceptors)
export function getHttp() {
  return apiClient;
}
