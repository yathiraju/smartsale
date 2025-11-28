import React from 'react';
import { createHttp } from '../services/http';

export default function SignupModal({ open, onClose, initialData = {}, onSignedUp, setUsernameInParent }) {
  const [data, setData] = React.useState({ username: '', email: '', password: '', role: 'USER', name: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '', country: 'IN', lat: '', lng: '', ...initialData });
  const [loading, setLoading] = React.useState(false);

  async function submit(e) {
    e.preventDefault();
    if (loading) return;
    if (!data.username || !data.email || !data.password) return alert('Provide username, email, password');

    setLoading(true);
    try {
      const http = createHttp();
      const res = await http.post('/api/signup', {
        users: { username: data.username, password: data.password, email: data.email, role: data.role },
        name: data.name,
        phone: data.phone,
        line1: data.line1, line2: data.line2, city: data.city, state: data.state, pincode: data.pincode, country: data.country, lat: data.lat ? Number(data.lat) : null, lng: data.lng ? Number(data.lng) : null
      }, { headers: { 'Content-Type': 'application/json' } });

      if (res.status >= 200 && res.status < 300) {
        alert('Signup successful. You can now log in.');
        onClose();
        setUsernameInParent && setUsernameInParent(data.username);
        onSignedUp && onSignedUp();
      } else {
        alert('Signup failed: ' + JSON.stringify(res.data || res.statusText || res.status));
      }
    } catch (err) {
      console.error(err);
      alert('Signup request failed');
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <form onSubmit={submit} className="bg-white p-6 rounded shadow max-w-xl w-full">
        <h2 className="text-xl font-bold mb-4">Create Account</h2>
        <div className="grid grid-cols-2 gap-3 text-black">
          {Object.keys(data).map(k => (
            <input key={k} placeholder={k} value={data[k]} onChange={(e)=>setData(prev=>({ ...prev, [k]: e.target.value }))} className="border p-2 rounded" />
          ))}
        </div>
        <div className="flex justify-end gap-3 mt-4">
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="submit" className="bg-green-500 text-white px-3 py-1 rounded">{loading ? '...' : 'Sign Up'}</button>
        </div>
      </form>
    </div>
  );
}
