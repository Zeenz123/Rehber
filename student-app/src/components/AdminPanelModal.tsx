import React, { useState } from 'react';
import { X, Plus, Book, UserPlus, Check } from 'lucide-react';
import { localDb } from '../services/localDb';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'subject' | 'user'>('subject');

  // Subject Form State
  const [subjId, setSubjId] = useState('');
  const [subjName, setSubjName] = useState('');
  const [subjCode, setSubjCode] = useState('');
  const [subjIcon, setSubjIcon] = useState('BookOpen');
  const [subjDesc, setSubjDesc] = useState('');

  // User Form State
  const [userName, setUserName] = useState('');
  const [userGrade, setUserGrade] = useState<number>(7);

  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjId || !subjName || !subjCode) return;

    localDb.addSubject({
      id: subjId,
      name: subjName,
      code: subjCode,
      icon: subjIcon,
      color: 'from-blue-500 to-indigo-700', // Default color
      description: subjDesc,
      topicsCount: 0,
    });
    setMessage(`Subject "${subjName}" added successfully!`);
    setSubjId(''); setSubjName(''); setSubjCode(''); setSubjDesc('');
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName) return;

    try {
      const res = localDb.joinAsStudent(userName, userGrade, 'dY`dY?');
      setMessage(`User "${res.user.name}" added successfully to local DB!`);
      setUserName('');
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
          <h2 className="text-xl font-black text-slate-800">Admin Control Panel</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {message && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center gap-2">
            <Check className="w-4 h-4" />
            {message}
          </div>
        )}

        <div className="flex gap-2 mb-5">
          <button
            onClick={() => { setActiveTab('subject'); setMessage(''); }}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${
              activeTab === 'subject' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            Add Subject
          </button>
          <button
            onClick={() => { setActiveTab('user'); setMessage(''); }}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${
              activeTab === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            Add New User
          </button>
        </div>

        <div className="overflow-y-auto pr-2 scrollbar-thin flex-1">
          {activeTab === 'subject' ? (
            <form onSubmit={handleAddSubject} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Subject ID (e.g. hist)</label>
                <input value={subjId} onChange={e => setSubjId(e.target.value)} required className="w-full border border-slate-200 p-2 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Subject Name</label>
                <input value={subjName} onChange={e => setSubjName(e.target.value)} required className="w-full border border-slate-200 p-2 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Subject Code (e.g. HIST)</label>
                <input value={subjCode} onChange={e => setSubjCode(e.target.value)} required className="w-full border border-slate-200 p-2 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Icon Name</label>
                <select value={subjIcon} onChange={e => setSubjIcon(e.target.value)} className="w-full border border-slate-200 p-2 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500">
                  <option value="BookOpen">BookOpen</option>
                  <option value="Calculator">Calculator</option>
                  <option value="Leaf">Leaf</option>
                  <option value="Laptop">Laptop</option>
                  <option value="Sparkles">Sparkles</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Description</label>
                <textarea value={subjDesc} onChange={e => setSubjDesc(e.target.value)} className="w-full border border-slate-200 p-2 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"></textarea>
              </div>
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all">
                <Plus className="w-4 h-4" />
                Create Subject
              </button>
            </form>
          ) : (
            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl mb-4 text-xs text-amber-800 font-medium">
                Admin User Creation: Adds a student directly to the offline database without requiring them to join from the home screen.
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Student Full Name</label>
                <input value={userName} onChange={e => setUserName(e.target.value)} required className="w-full border border-slate-200 p-2 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Grade / Class</label>
                <input type="number" value={userGrade} onChange={e => setUserGrade(Number(e.target.value))} required className="w-full border border-slate-200 p-2 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500" />
              </div>
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all">
                <UserPlus className="w-4 h-4" />
                Add Student User
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
