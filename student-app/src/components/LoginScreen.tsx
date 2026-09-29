import React, { useState, useEffect, useRef } from 'react';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface LoginScreenProps {
  onLoginSuccess: (studentId: string, token: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [studentId, setStudentId] = useState('GOV-SCH-001-STU-0001');
  const [password, setPassword] = useState('demo-password');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const googleBtnRef = useRef<HTMLDivElement>(null);

  // Load Google Identity Services and render the button
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
      document.head.removeChild(script);
    };
  }, []);

  const handleGoogleResponse = async (response: any) => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential, role: 'STUDENT' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || 'Google login failed');
        return;
      }
      localStorage.setItem('student_token', data.access_token);
      onLoginSuccess(data.student_id, data.access_token);
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
      const res = await fetch(`${API_URL}/api/auth/student/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ government_school_student_id: studentId, password }),
      });

      if (!res.ok) {
        throw new Error('Invalid student credentials or offline.');
      }

      const data = await res.json();
      localStorage.setItem('student_token', data.access_token);
      onLoginSuccess(studentId, data.access_token);
    } catch (err: any) {
      console.warn('Backend login failed. Falling back to offline mode.', err);
      if (password === 'demo-password') {
        localStorage.setItem('student_token', 'offline-demo-token');
        onLoginSuccess(studentId, 'offline-demo-token');
      } else {
        setError('Invalid credentials. Try demo-password');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 bg-slate-100 min-h-screen">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 border border-slate-200">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg text-white text-3xl">
            &#x1F393;
          </div>
          <h2 className="text-2xl font-black text-slate-800">Student Login</h2>
          <p className="text-slate-500 mt-2 text-sm">Access your personalized learning path</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 font-medium text-center border border-red-100">
            {error}
          </div>
        )}

        {/* Google Sign-In Button (real GIS) */}
        {GOOGLE_CLIENT_ID ? (
          <>
            <div ref={googleBtnRef} className="flex justify-center mb-2" />
            <p className="text-center text-[10px] text-slate-400 mb-4">Only @govschool.edu.pk accounts are allowed</p>
            <div className="flex items-center justify-center mb-6">
              <div className="border-t border-slate-200 w-full"></div>
              <span className="bg-white px-3 text-xs text-slate-400 uppercase tracking-wider whitespace-nowrap">or use ID</span>
              <div className="border-t border-slate-200 w-full"></div>
            </div>
          </>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6 text-center">
            <p className="text-amber-700 text-xs font-medium">Google Sign-In will activate once you add your OAuth Client ID.</p>
            <p className="text-amber-500 text-[10px] mt-1">Set VITE_GOOGLE_CLIENT_ID in .env</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Government Student ID</label>
            <input
              type="text"
              required
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-slate-50 focus:bg-white transition-colors font-mono text-sm"
              placeholder="GOV-SCH-001-STU-0001"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-slate-50 focus:bg-white transition-colors"
              placeholder="&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 rounded-xl transition-colors shadow-md shadow-orange-200 mt-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Verifying...' : 'Start Learning'}
          </button>
        </form>
      </div>
    </div>
  );
};
