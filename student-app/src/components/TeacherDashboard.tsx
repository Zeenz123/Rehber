import React, { useState, useEffect } from 'react';
import {
  Users,
  AlertTriangle,
  TrendingUp,
  Clock,
  Search,
  Filter,
  CheckCircle,
  HelpCircle,
  BookOpen,
  ArrowRight,
  Sparkles,
  ChevronRight,
  GraduationCap,
  WifiOff,
} from 'lucide-react';
import { TeacherStudentView, ClassInsight } from '../types';
import { OFFLINE_STUDENTS_DATA, OFFLINE_CLASS_INSIGHTS } from '../services/teacherOfflineData';
import { AdminPanelModal } from './AdminPanelModal';

export const TeacherDashboard: React.FC = () => {
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [students, setStudents] = useState<TeacherStudentView[]>(() => {
    try {
      const saved = localStorage.getItem('rurallearn_teacher_students');
      return saved ? JSON.parse(saved) : OFFLINE_STUDENTS_DATA;
    } catch {
      return OFFLINE_STUDENTS_DATA;
    }
  });
  const [classInsights, setClassInsights] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('rurallearn_teacher_insights');
      return saved ? JSON.parse(saved) : OFFLINE_CLASS_INSIGHTS;
    } catch {
      return OFFLINE_CLASS_INSIGHTS;
    }
  });
  const [selectedStudent, setSelectedStudent] = useState<TeacherStudentView | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterNeedsSupport, setFilterNeedsSupport] = useState<boolean>(false);

  useEffect(() => {
    // Attempt to refresh from backend server when online, with graceful offline fallback
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return;
    }

    fetch('/api/teacher/students')
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setStudents(data);
          try {
            localStorage.setItem('rurallearn_teacher_students', JSON.stringify(data));
          } catch {}
        }
      })
      .catch((e) => {
        // Retain offline cached data smoothly
        console.info('Teacher dashboard operating in offline cached mode:', e.message);
      });

    fetch('/api/teacher/class-insights')
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then((data) => {
        if (data) {
          setClassInsights(data);
          try {
            localStorage.setItem('rurallearn_teacher_insights', JSON.stringify(data));
          } catch {}
        }
      })
      .catch((e) => {
        console.info('Class insights operating in offline cached mode:', e.message);
      });
  }, []);

  const filteredStudents = students.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSupport = filterNeedsSupport ? s.needsSupport : true;
    return matchesSearch && matchesSupport;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Dashboard Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider mb-1">
              <GraduationCap className="w-4 h-4" />
              <span>Rampur Secondary School • Class 7 Section A</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight">
              Teacher & Classroom Analytics Dashboard
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Aggregated from offline tablet syncing across the village community solar hub.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAdminModalOpen(true)}
              className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-full transition-colors border border-indigo-400"
            >
              Admin Settings
            </button>
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold px-3 py-1.5 rounded-full">
              Solar Hub Sync: Active
            </span>
          </div>
        </div>

        {/* Top Summary Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-slate-800 mt-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Total Students
            </span>
            <span className="text-2xl font-black text-white">32</span>
            <span className="text-[10px] text-emerald-400 block mt-0.5">28 Active Today</span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
            <span className="text-[10px] uppercase font-bold text-rose-400 block mb-1">
              Need Support
            </span>
            <span className="text-2xl font-black text-rose-400">9</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Below 60% Mastery</span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
            <span className="text-[10px] uppercase font-bold text-amber-400 block mb-1">
              Average Progress
            </span>
            <span className="text-2xl font-black text-white">68%</span>
            <span className="text-[10px] text-amber-300 block mt-0.5">+14% this month</span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
            <span className="text-[10px] uppercase font-bold text-blue-400 block mb-1">
              Tablets Synced
            </span>
            <span className="text-2xl font-black text-white">6 / 6</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Solar Node #4</span>
          </div>
        </div>
      </div>

      {/* 2. Classroom AI Insights: Topic Weaknesses Aggregation (Section 21) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-600" />
              <h2 className="text-base font-black text-slate-800 tracking-tight">
                Classroom AI Insights & Conceptual Bottlenecks
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Aggregated across all student diagnostic and quiz attempts to highlight where the whole class struggles.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {classInsights?.topicWeaknesses?.map((tw: any, i: number) => (
            <div
              key={i}
              className={`p-4 rounded-2xl border space-y-2 ${
                tw.severity === 'high'
                  ? 'bg-rose-50/60 border-rose-200'
                  : tw.severity === 'medium'
                  ? 'bg-amber-50/60 border-amber-200'
                  : 'bg-emerald-50/60 border-emerald-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  {tw.subject}
                </span>
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    tw.severity === 'high'
                      ? 'bg-rose-100 text-rose-800'
                      : tw.severity === 'medium'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {tw.studentsCount} Students Need Practice
                </span>
              </div>

              <h4 className="font-extrabold text-sm text-slate-800">{tw.topic}</h4>
              <p className="text-xs text-slate-600 leading-normal">
                💡 <strong className="text-slate-800">Teacher Action:</strong> {tw.suggestion}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Student Roster with Filters & Drill-down */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-slate-800 tracking-tight">
              Class Roster & Individual Mastery
            </h2>
            <p className="text-xs text-slate-500">
              Click any student row to inspect detailed concept drill-down and AI suggested interventions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search student name..."
                className="bg-slate-50 border border-slate-200 text-xs rounded-xl pl-8 pr-3 py-1.5 focus:outline-none"
              />
            </div>

            <button
              onClick={() => setFilterNeedsSupport(!filterNeedsSupport)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 ${
                filterNeedsSupport
                  ? 'bg-rose-50 border-rose-300 text-rose-800'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              <span>Needs Support Only</span>
            </button>
          </div>
        </div>

        {/* Student Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold">
                <th className="py-2.5 px-3">Student</th>
                <th className="py-2.5 px-3">Learning Level</th>
                <th className="py-2.5 px-3">Overall Progress</th>
                <th className="py-2.5 px-3">Avg Score</th>
                <th className="py-2.5 px-3">Weak Topics</th>
                <th className="py-2.5 px-3">Last Sync</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredStudents.map((st) => (
                <tr
                  key={st.id}
                  onClick={() => setSelectedStudent(st)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl bg-orange-50 p-1.5 rounded-xl">
                        {st.avatar}
                      </span>
                      <div>
                        <span className="font-extrabold text-slate-800 block text-xs">
                          {st.name}
                        </span>
                        <span className="text-[10px] text-slate-400">Class {st.grade}</span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        st.learningLevel === 'advanced'
                          ? 'bg-purple-100 text-purple-800'
                          : st.learningLevel === 'intermediate'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {st.learningLevel}
                    </span>
                  </td>

                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-orange-600 h-full rounded-full"
                          style={{ width: `${st.overallProgress}%` }}
                        ></div>
                      </div>
                      <span className="font-extrabold text-slate-700">
                        {st.overallProgress}%
                      </span>
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <span
                      className={`font-black ${
                        st.averageScore >= 70
                          ? 'text-emerald-600'
                          : st.averageScore >= 60
                          ? 'text-amber-600'
                          : 'text-rose-600'
                      }`}
                    >
                      {st.averageScore}%
                    </span>
                  </td>

                  <td className="py-3 px-3">
                    <div className="flex flex-wrap gap-1">
                      {st.weakTopics.map((w, wi) => (
                        <span
                          key={wi}
                          className="bg-rose-50 text-rose-700 text-[10px] px-1.5 py-0.5 rounded border border-rose-200/60 font-semibold"
                        >
                          {w}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td className="py-3 px-3 text-slate-500 text-[11px]">
                    {st.lastSync}
                  </td>

                  <td className="py-3 px-3 text-right">
                    <button className="text-orange-600 font-bold group-hover:translate-x-1 transition-transform inline-flex items-center gap-0.5">
                      <span>View</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Individual Student Drill-Down Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl bg-orange-100 p-2 rounded-2xl">
                  {selectedStudent.avatar}
                </span>
                <div>
                  <h3 className="font-black text-lg text-slate-800">
                    {selectedStudent.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Class {selectedStudent.grade} • Pace: {selectedStudent.learningSpeed.toUpperCase()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Subject Mastery Breakdown */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Subject Progress
              </span>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-500 block">Math</span>
                  <span className="text-base font-black text-slate-800">
                    {selectedStudent.subjectProgress.math}%
                  </span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-500 block">Science</span>
                  <span className="text-base font-black text-slate-800">
                    {selectedStudent.subjectProgress.science}%
                  </span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-500 block">English</span>
                  <span className="text-base font-black text-slate-800">
                    {selectedStudent.subjectProgress.english}%
                  </span>
                </div>
              </div>
            </div>

            {/* AI Suggested Intervention for Teacher */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs space-y-1">
              <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>AI Recommended Intervention for Teacher:</span>
              </div>
              <p className="text-amber-950 font-medium leading-relaxed">
                {selectedStudent.recommendedIntervention}
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedStudent(null)}
                className="bg-slate-900 text-white font-bold px-4 py-2 rounded-xl text-xs"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      <AdminPanelModal isOpen={isAdminModalOpen} onClose={() => setIsAdminModalOpen(false)} />
    </div>
  );
};
