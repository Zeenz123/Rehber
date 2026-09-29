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
      </div>
    </div>
  );
};
