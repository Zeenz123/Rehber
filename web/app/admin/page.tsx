"use client";

import { useState } from 'react';
import { API_BASE_URL } from '@/lib/api';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'subject' | 'user'>('subject');
  const [message, setMessage] = useState('');

  // Subject State
  const [subjId, setSubjId] = useState('');
  const [subjCode, setSubjCode] = useState('');
  const [subjName, setSubjName] = useState('');
  const [subjDesc, setSubjDesc] = useState('');

  // User State
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [token, setToken] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const res = await fetch(`${API_BASE_URL}/auth/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();
      if (res.ok && data.access_token) {
        setToken(data.access_token);
        localStorage.setItem('admin_token', data.access_token);
      } else {
        setErrorMsg(data.detail || 'Login failed');
      }
    } catch (err: any) {
      setErrorMsg(`Connection error: ${err.message}`);
    }
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setErrorMsg('');
    try {
      const res = await fetch(`${API_BASE_URL}/curriculum/subjects`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: subjId,
          code: subjCode,
          name: subjName,
          grade: 6,
          description: subjDesc,
          icon: 'book'
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage(data.message || `Subject ${subjName} added to the central database successfully!`);
        setSubjId(''); setSubjCode(''); setSubjName(''); setSubjDesc('');
      } else {
        setErrorMsg(data.error?.message || data.detail || 'Failed to add subject.');
      }
    } catch (err: any) {
      setErrorMsg(`Connection error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setErrorMsg('');
    try {
      const res = await fetch(`${API_BASE_URL}/auth/users`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: email,
          phone_number: null,
          password: password,
          name: fullName,
          role: 'TEACHER'
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage(data.message || `Admin/Teacher User ${fullName} added successfully to the central users table!`);
        setEmail(''); setFullName(''); setPassword('');
      } else {
        setErrorMsg(data.error?.message || data.detail || 'Failed to add user.');
      }
    } catch (err: any) {
      setErrorMsg(`Connection error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="p-8 max-w-md mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-slate-800">Admin Login</h1>
        {errorMsg && <div className="p-4 mb-4 bg-rose-50 text-rose-700 rounded-lg">{errorMsg}</div>}
        <form onSubmit={handleLogin} className="space-y-4 bg-white p-6 rounded-xl border">
          <div>
            <label className="block text-sm font-semibold mb-1">Email</label>
            <input type="email" value={loginEmail} onChange={e=>setLoginEmail(e.target.value)} required className="w-full border p-2 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Password</label>
            <input type="password" value={loginPassword} onChange={e=>setLoginPassword(e.target.value)} required className="w-full border p-2 rounded-lg" />
          </div>
          <button type="submit" className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 rounded-lg">Login</button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Admin Control Panel</h1>
        <p className="text-sm text-slate-500">Add new curriculum subjects or provision new admin/teacher users to the central Postgres database.</p>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 text-emerald-700 font-medium rounded-xl border border-emerald-200">
          {message}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 text-rose-700 font-medium rounded-xl border border-rose-200">
          {errorMsg}
        </div>
      )}

      <div className="flex gap-4">
        <button
          onClick={() => { setActiveTab('subject'); setMessage(''); setErrorMsg(''); }}
          className={`px-4 py-2 font-semibold rounded-lg ${activeTab === 'subject' ? 'bg-sky-600 text-white' : 'bg-white text-slate-700 border'}`}
        >
          Add Curriculum Subject
        </button>
        <button
          onClick={() => { setActiveTab('user'); setMessage(''); setErrorMsg(''); }}
          className={`px-4 py-2 font-semibold rounded-lg ${activeTab === 'user' ? 'bg-sky-600 text-white' : 'bg-white text-slate-700 border'}`}
        >
          Add Admin / Teacher User
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        {activeTab === 'subject' ? (
          <form onSubmit={handleAddSubject} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-sm font-semibold mb-1">Subject ID (e.g. HIST)</label>
              <input value={subjId} onChange={e=>setSubjId(e.target.value)} required disabled={isLoading} className="w-full border p-2 rounded-lg disabled:opacity-50" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Subject Code</label>
              <input value={subjCode} onChange={e=>setSubjCode(e.target.value)} required disabled={isLoading} className="w-full border p-2 rounded-lg disabled:opacity-50" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Subject Name</label>
              <input value={subjName} onChange={e=>setSubjName(e.target.value)} required disabled={isLoading} className="w-full border p-2 rounded-lg disabled:opacity-50" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Description</label>
              <textarea value={subjDesc} onChange={e=>setSubjDesc(e.target.value)} disabled={isLoading} className="w-full border p-2 rounded-lg disabled:opacity-50" />
            </div>
            <button type="submit" disabled={isLoading} className="bg-sky-600 hover:bg-sky-700 disabled:bg-slate-400 text-white font-bold py-2 px-4 rounded-lg">
              {isLoading ? 'Processing...' : 'Add Subject to DB'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleAddUser} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-sm font-semibold mb-1">Full Name</label>
              <input value={fullName} onChange={e=>setFullName(e.target.value)} required disabled={isLoading} className="w-full border p-2 rounded-lg disabled:opacity-50" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Email</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required disabled={isLoading} className="w-full border p-2 rounded-lg disabled:opacity-50" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Password</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required disabled={isLoading} className="w-full border p-2 rounded-lg disabled:opacity-50" />
            </div>
            <button type="submit" disabled={isLoading} className="bg-sky-600 hover:bg-sky-700 disabled:bg-slate-400 text-white font-bold py-2 px-4 rounded-lg">
              {isLoading ? 'Processing...' : 'Create Admin User in DB'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
