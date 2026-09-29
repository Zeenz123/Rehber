'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('rehber_token');
    localStorage.removeItem('rehber_role');
    router.push('/login');
  };

  return (
    <button
      onClick={handleLogout}
      className="ml-4 px-3 py-1.5 rounded-md text-xs font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition"
    >
      Logout
    </button>
  );
}
