import React, { useRef } from 'react';

export default function AuthControls({ isLoggedIn, usernameDisplay, onLogout, onShowSignup, onLogin }) {
  const usernameRef = useRef(null);
  const passwordRef = useRef(null);

  return (
    <div className="flex items-center gap-3">
      {!isLoggedIn ? (
        <>
          <div className="hidden sm:flex items-center gap-2">
            <input ref={usernameRef} placeholder="Username" className="text-black px-2 py-1 rounded" />
            <input ref={passwordRef} type="password" placeholder="Password" className="text-black px-2 py-1 rounded" />
            <button onClick={() => onLogin?.(usernameRef.current?.value, passwordRef.current?.value)} className="bg-white text-blue-600 px-3 py-1 rounded">Login</button>
          </div>
          <button onClick={onShowSignup} className="bg-green-500 text-white px-3 py-1 rounded">Sign Up</button>
        </>
      ) : (
        <>
          <span className="hidden sm:inline">Hello, <b>{usernameDisplay}</b></span>
          <button onClick={onLogout} className="bg-white text-red-600 px-3 py-1 rounded">Logout</button>
        </>
      )}
    </div>
  );
}
