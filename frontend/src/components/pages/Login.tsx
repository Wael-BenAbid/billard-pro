import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';

export const Login: React.FC = () => {
  const { settings, setUser } = useAppContext();
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginUsername === 'admin' && loginPassword === 'admin123') {
      const u = { username: 'admin', role: 'admin' };
      setUser(u);
      localStorage.setItem('billard_auth', JSON.stringify(u));
    } else {
      alert('Identifiants incorrects');
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-zinc-900/50 rounded-[3rem] border border-white/5 p-12 shadow-2xl backdrop-blur-xl text-center">
        <h1
          style={{ color: settings.themeColor }}
          className="text-5xl font-black italic tracking-tighter mb-2"
        >
          {settings.clubName}
        </h1>
        <form onSubmit={handleLogin} className="space-y-6 mt-10">
          <input
            type="text"
            placeholder="Admin ID"
            value={loginUsername}
            onChange={(e) => setLoginUsername(e.target.value)}
            className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-5 text-white font-bold outline-none"
          />
          <input
            type="password"
            placeholder="Password"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-5 text-white font-bold outline-none"
          />
          <button
            type="submit"
            style={{ backgroundColor: settings.themeColor }}
            className="w-full text-black font-black py-5 rounded-2xl hover:brightness-110 uppercase text-sm tracking-widest"
          >
            Entrer
          </button>
        </form>
      </div>
    </div>
  );
};
