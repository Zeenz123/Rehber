import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  Users,
  Check,
  X,
  Sparkles,
  Flame,
  Award,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { localDb } from '../services/localDb';
import { User, LearnerProfile } from '../types';

interface JoinStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStudentChanged?: (user: User, profile: LearnerProfile) => void;
}

const AVATAR_OPTIONS = [
  '👦🏽', '👧🏽', '👦🏾', '👧🏾', '🧑🏻', '👧🏻', '🌟', '🚀', '🦁', '🐯', '🦉', '🦊', '🌻', '🎨', '🎯'
];

export const JoinStudentModal: React.FC<JoinStudentModalProps> = ({
  isOpen,
  onClose,
  onStudentChanged,
}) => {
  const [students, setStudents] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [nameInput, setNameInput] = useState<string>('');
  const [studentIdInput, setStudentIdInput] = useState<string>('');
  const [selectedGrade, setSelectedGrade] = useState<number>(7);
  const [selectedAvatar, setSelectedAvatar] = useState<string>('👦🏽');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const u = localDb.getUser();
      setCurrentUser(u);
      if (u) {
        setSelectedGrade(u.grade || 7);
      }
      setStudents(localDb.getAllStudents());
      setNameInput('');
      setStudentIdInput('');
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleJoinNewStudent = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = nameInput.trim();
    const trimmedId = studentIdInput.trim().toUpperCase();

    if (!trimmed) {
      setErrorMsg('Please enter a student name to join.');
      return;
    }
    if (!trimmedId) {
      setErrorMsg('Please enter a Government Student ID for authorization.');
      return;
    }

    // Check Government Student ID uniqueness among existing students on this tablet
    const existing = students.find(
      (s) =>
        (s as any).governmentStudentId?.toUpperCase() === trimmedId ||
        s.id?.toUpperCase() === trimmedId
    );
    if (existing) {
      setErrorMsg(`Government Student ID "${trimmedId}" is already registered on this tablet.`);
      return;
    }

    try {
      const result = localDb.joinAsStudent(trimmed, selectedGrade, selectedAvatar, trimmedId);
      // Store the governmentStudentId alongside the user record in localStorage
      const allStudents = localDb.getAllStudents();
      const updatedStudents = allStudents.map((s) =>
        s.id === result.user.id ? { ...s, governmentStudentId: trimmedId } : s
      );
      localStorage.setItem('rehber_all_students', JSON.stringify(updatedStudents));

      setCurrentUser({ ...result.user, governmentStudentId: trimmedId });
      setStudents(localDb.getAllStudents());
      setSuccessMsg(`Welcome, ${result.user.name} (${trimmedId})! Your authorized learning profile is ready.`);
      if (onStudentChanged) {
        onStudentChanged(result.user, result.profile);
      }
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err: any) {
      setErrorMsg('Could not join: ' + err.message);
    }
  };

  const handleSelectStudent = (studentId: string) => {
    try {
      const result = localDb.switchStudent(studentId);
      setCurrentUser(result.user);
      setSuccessMsg(`Switched to ${result.user.name}'s learning dashboard!`);
      if (onStudentChanged) {
        onStudentChanged(result.user, result.profile);
      }
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMsg('Could not switch student: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xl shadow-xs">
              👥
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-800 tracking-tight">
                Join or Switch Student
              </h2>
              <p className="text-xs text-slate-500">
                Shared Tablet Mode: Enter any student name to track individual learning
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto space-y-5 py-3 pr-1 scrollbar-thin">
          {/* Notification Messages */}
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-semibold animate-in fade-in">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Section 1: Join as Any Name */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50/70 border border-amber-200/90 rounded-2xl p-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-black text-amber-950 uppercase tracking-wide">
                <UserPlus className="w-4 h-4 text-orange-600" />
                <span>Join with Your Name</span>
              </div>
              <span className="text-[10px] font-bold bg-white text-orange-700 px-2 py-0.5 rounded-full border border-amber-200">
                Creates Custom Learner Profile
              </span>
            </div>

            <form onSubmit={handleJoinNewStudent} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Student Full Name:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Enter student name (e.g., Rishi Raj, Aarav, Pooja...)"
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white shadow-2xs"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white text-xs sm:text-sm font-bold shadow-md shadow-orange-600/20 transition-all flex items-center gap-1.5 shrink-0"
                  >
                    <span>Join Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Government Student ID field for authorization */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Government Student ID
                </label>
                <input
                  type="text"
                  value={studentIdInput}
                  onChange={(e) => setStudentIdInput(e.target.value.toUpperCase())}
                  placeholder="GOV-SCH-001-STU-0001"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white shadow-2xs font-mono tracking-wide"
                />
              </div>

              {/* Class Grade & Avatar Selection Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Grade picker */}
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Select Class / Grade:
                  </label>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {[5, 6, 7, 8, 9, 10].map((g) => (
                      <button
                        type="button"
                        key={g}
                        onClick={() => setSelectedGrade(g)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors shrink-0 ${
                          selectedGrade === g
                            ? 'bg-orange-600 text-white shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        Class {g}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Avatar picker */}
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Pick Profile Avatar:
                  </label>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {AVATAR_OPTIONS.slice(0, 8).map((av, idx) => (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => setSelectedAvatar(av)}
                        className={`w-7 h-7 rounded-lg text-base flex items-center justify-center transition-transform shrink-0 ${
                          selectedAvatar === av
                            ? 'bg-white ring-2 ring-orange-500 scale-110 shadow-xs'
                            : 'hover:bg-white/80'
                        }`}
                      >
                        {av}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Section 2: Switch to Existing Student Profiles */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-black text-slate-700 uppercase tracking-wide">
                <Users className="w-4 h-4 text-slate-500" />
                <span>Classroom Learners on this Tablet ({students.length})</span>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold">
                Tap to switch profile
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
              {students.map((student) => {
                const isActive = currentUser?.id === student.id;
                const profile = localDb.getStudentProfile(student.id);

                return (
                  <button
                    key={student.id}
                    onClick={() => handleSelectStudent(student.id)}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 ${
                      isActive
                        ? 'bg-amber-50/90 border-orange-500 ring-2 ring-orange-500/30 shadow-xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-xl shrink-0">
                        {student.avatar || '👦🏽'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-xs text-slate-900 truncate">
                            {student.name}
                          </span>
                          {isActive && (
                            <span className="text-[9px] font-black uppercase bg-orange-600 text-white px-1.5 py-0.2 rounded-md shrink-0">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 truncate">
                          {student.governmentStudentId ? <span className="font-mono text-slate-600 font-semibold">{student.governmentStudentId} • </span> : null}Class {student.grade || 7} • {profile.overallLevel}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-right shrink-0">
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1 text-[10px] font-bold text-orange-600">
                          <Flame className="w-3 h-3 fill-orange-500" />
                          <span>{profile.streakDays}d</span>
                        </div>
                        <div className="text-[9px] font-bold text-amber-700">
                          {profile.xpPoints} XP
                        </div>
                      </div>
                      {isActive && <Check className="w-4 h-4 text-orange-600 shrink-0" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
          <span>Active: <strong className="text-slate-700">{currentUser?.name || 'Rahul Kumar'}</strong></span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
