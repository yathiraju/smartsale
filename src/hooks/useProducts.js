import { useState, useEffect, useRef, useCallback } from 'react';
import { createHttp } from '../services/http';

export default function useProducts({ initialPage = 0, initialSize = 20, initialSort = 'name,asc', initialQuery = '' } = {}) {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(initialPage);
  const [size, setSize] = useState(initialSize);
  const [sort, setSort] = useState(initialSort);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [query, setQuery] = useState(initialQuery);

  const ctrlRef = useRef(null);

  const imageUrlForSku = useCallback((sku, ext = 'png') => {
    if (!sku) return '/placeholder.png';
    const repoUser = 'yathiraju';
    const repo = 'smartsale-images';
    const version = 'test';
    return `https://cdn.jsdelivr.net/gh/${repoUser}/${repo}@${version}/products/${encodeURIComponent(sku)}.${ext}`;
  }, []);

  const fetchProducts = useCallback(async ({ q = '', p = 0, s = 20, sortBy = 'name,asc' } = {}) => {
    setLoadingProducts(true);
    if (ctrlRef.current) {
      try { ctrlRef.current.abort(); } catch(_) {}
    }
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    const http = createHttp();

    try {
      const params = { page: Math.max(0, Number(p)), size: Math.max(1, Number(s)), sort: sortBy };
      if (q && String(q).trim()) params.query = String(q).trim();
      const res = await http.get('/api/products/page', { params, signal: ctrl.signal });
      const data = res.data;
      const list = Array.isArray(data?.content) ? data.content : [];
      const mapped = list.map(pObj => ({ ...pObj, image: pObj.sku ? imageUrlForSku(pObj.sku) : `https://via.placeholder.com/300x300?text=${encodeURIComponent(pObj.name || 'Product')}` }));
      setProducts(mapped);
      setTotalPages(Number(data?.totalPages ?? 0));
      setTotalElements(Number(data?.totalElements ?? 0));
      setPage(Number(data?.number ?? p));
    } catch (err) {
      const isCanceled = err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError';
      if (!isCanceled) {
        console.error('fetchProducts failed', err);
        alert('Cannot load products (server error)');
      }
    } finally {
      setLoadingProducts(false);
      ctrlRef.current = null;
    }
  }, [imageUrlForSku]);

  // debounce query
  useEffect(() => {
    const tid = setTimeout(() => {
      setPage(0);
      fetchProducts({ q: query, p: 0, s: size, sortBy: sort });
    }, 350);
    return () => clearTimeout(tid);
  }, [query, size, sort, fetchProducts]);

  useEffect(() => {
    fetchProducts({ q: query, p: page, s: size, sortBy: sort });
  }, [page, size, sort, fetchProducts, query]);

  return {
    products, page, size, sort, totalPages, totalElements, loadingProducts,
    setQuery, setPage, setSize, setSort, fetchProducts
  };
}
