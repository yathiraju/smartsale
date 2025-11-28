import React from 'react';

export default function AddressModal({ open, onClose, addrChoices = [], manualAddr = {}, setManualAddr = () => {}, onChoose = () => {}, loading = false, usernameDisplay = '' }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow max-w-lg w-full">
        <h3 className="text-lg font-bold mb-3">Choose delivery address</h3>

        {loading && <div>Loading addresses...</div>}

        <div className="grid gap-2">
          {addrChoices.map((a, idx) => (
            <div key={idx} className="border p-2 rounded flex justify-between items-center">
              <div>
                <div className="font-semibold">{a.name}</div>
                <div className="text-sm">{a.line1} {a.line2} {a.city} {a.pincode}</div>
              </div>
              <button onClick={()=>onChoose(a)}>Use</button>
            </div>
          ))}
        </div>

        <hr className="my-3" />
        <div>
          <h4 className="font-semibold mb-2">Or add manually</h4>
          <div className="grid grid-cols-2 gap-2">
            <input placeholder="Line1" value={manualAddr.line1||''} onChange={e=>setManualAddr({...manualAddr,line1:e.target.value})} className="border p-2 rounded" />
            <input placeholder="Line2" value={manualAddr.line2||''} onChange={e=>setManualAddr({...manualAddr,line2:e.target.value})} className="border p-2 rounded" />
            <input placeholder="City" value={manualAddr.city||''} onChange={e=>setManualAddr({...manualAddr,city:e.target.value})} className="border p-2 rounded" />
            <input placeholder="Pincode" value={manualAddr.pincode||''} onChange={e=>setManualAddr({...manualAddr,pincode:e.target.value})} className="border p-2 rounded" />
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button onClick={onClose}>Cancel</button>
            <button onClick={()=>onChoose(manualAddr)}>Use address</button>
          </div>
        </div>
      </div>
    </div>
  );
}
