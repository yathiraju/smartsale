// services/http.js
import axios from 'axios';
import { getApiHost } from './api';

export function createHttp() {
  const host = (getApiHost && getApiHost()) || 'http://localhost:8080';
  return axios.create({ baseURL: host, timeout: 30000 });
}
