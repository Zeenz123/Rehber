'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/api\/?$/, '');

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<'teacher' | 'admin'>('teacher');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  // Load Google Identity Services
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if ((window as any).google && googleBtnRef.current) {
        (window as any).google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
          auto_select: false,
        });
        (window as any).google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'outline',
          size: 'large',
          width: '100%',
          text: 'continue_with',
          shape: 'pill',
          logo_alignment: 'left',
        });
      }
    };
    document.head.appendChild(script);

    return () => {
      try { document.head.removeChild(script); } catch {}
    };
  }, [role]);

  const handleGoogleResponse = async (response: any) => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential, role: role.toUpperCase() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || 'Google login failed');
        return;
      }
      localStorage.setItem('rehber_token', data.access_token);
      localStorage.setItem('rehber_role', role);
      router.push(role === 'admin' ? '/admin' : '/');
    } catch (err: any) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/${role}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Login failed');
      }

      const data = await res.json();
      localStorage.setItem('rehber_token', data.access_token);
      localStorage.setItem('rehber_role', role);

      if (role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100">
        <div className="bg-slate-900 p-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg">
            <span className="text-3xl">&#x1F4DA;</span>
          </div>
          <h2 className="text-2xl font-black text-white">Rehber Hub Login</h2>
          <p className="text-slate-400 mt-2 text-sm">Access the Teacher &amp; Admin Dashboard</p>
        </div>

        <div className="p-8">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 font-medium border border-red-100">
              {error}
            </div>
          )}

          {/* Role selector */}
          <div className="mb-5">
            <label className="block text-sm font-bold text-slate-700 mb-1">Role</label>
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setRole('teacher')}
                className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${role === 'teacher' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Teacher
              </button>
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${role === 'admin' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Admin
              </button>
            </div>
          </div>

          {/* Google Sign-In Button (real GIS) */}
          {GOOGLE_CLIENT_ID ? (
            <>
              <div ref={googleBtnRef} className="flex justify-center mb-2" />
              <p className="text-center text-[10px] text-slate-400 mb-4">Only @govschool.edu.pk accounts are allowed</p>
              <div className="flex items-center justify-center mb-6">
                <div className="border-t border-slate-200 w-full"></div>
                <span className="bg-white px-3 text-xs text-slate-400 uppercase tracking-wider whitespace-nowrap">or use email</span>
                <div className="border-t border-slate-200 w-full"></div>
              </div>
            </>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6 text-center">
              <p className="text-amber-700 text-xs font-medium">Google Sign-In will activate once you add your OAuth Client ID.</p>
              <p className="text-amber-500 text-[10px] mt-1">Set NEXT_PUBLIC_GOOGLE_CLIENT_ID in .env.local</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white transition-colors"
                placeholder={`demo-${role}@rehber.local`}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white transition-colors"
                placeholder="&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition-colors shadow-md shadow-emerald-200 mt-2 disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400">
            <p>Demo Teacher: <strong>teacher@rehber.demo</strong> (demo-password)</p>
            <p className="mt-1">Demo Admin: <strong>admin@rehber.demo</strong> (demo-password)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
