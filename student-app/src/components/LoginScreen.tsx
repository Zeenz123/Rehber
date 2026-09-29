import React, { useState } from 'react';

interface LoginScreenProps {
  onLoginSuccess: (studentId: string, token: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [studentId, setStudentId] = useState('GOV-SCH-001-STU-0001');
  const [password, setPassword] = useState('demo-password');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // If the app is online, hit the backend
      const res = await fetch('http://localhost:8000/api/auth/student/login', {
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
      // Offline fallback for demo purposes
      console.warn("Backend login failed. Falling back to offline mode.", err);
      if (password === 'demo-password') {
        localStorage.setItem('student_token', 'offline-demo-token');
        onLoginSuccess(studentId, 'offline-demo-token');
      } else {
        setError("Invalid credentials. Try demo-password");
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
            ??
          </div>
          <h2 className="text-2xl font-black text-slate-800">Student Login</h2>
          <p className="text-slate-500 mt-2 text-sm">Access your personalized learning path</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 font-medium text-center border border-red-100">
            {error}
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
              placeholder="��������"
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

        <div className="mt-6 flex items-center justify-center">
          <div className="border-t border-slate-200 w-full"></div>
          <span className="bg-white px-3 text-xs text-slate-400 uppercase tracking-wider">OR</span>
          <div className="border-t border-slate-200 w-full"></div>
        </div>

        <button
          onClick={(e) => { e.preventDefault(); onLoginSuccess('GOV-SCH-001-STU-0001', 'mock-google-token'); }}
          className="w-full mt-6 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-3.5 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-3 cursor-pointer"
        >
          <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
            <path fill="none" d="M0 0h48v48H0z"></path>
          </svg>
          Continue with Google
        </button>
      </div>
    </div>
  );
};

