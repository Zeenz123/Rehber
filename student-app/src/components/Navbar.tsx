import React, { useState, useEffect } from 'react';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Flame,
  Award,
  Globe,
  Sun,
  GraduationCap,
  PlayCircle,
  Smartphone,
  Maximize2,
  BookOpen,
  ChevronDown,
  Check,
  UserCheck,
  Users,
} from 'lucide-react';
import { LanguageCode, NetworkStatus, User } from '../types';
import { SUPPORTED_LANGUAGES, setLanguage, getLanguage, t } from '../services/i18n';
import { syncService } from '../services/syncService';
import { localDb } from '../services/localDb';
import { JoinStudentModal } from './JoinStudentModal';

interface NavbarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  networkStatus: NetworkStatus;
  pendingSyncCount: number;
  onOpenDemo: () => void;
  onOpenDiagnostic?: () => void;
  isTabletFrame: boolean;
  onToggleTabletFrame: () => void;
  onSync: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  networkStatus,
  pendingSyncCount,
  onOpenDemo,
  onOpenDiagnostic,
  isTabletFrame,
  onToggleTabletFrame,
  onSync,
}) => {
  const [lang, setLang] = useState<LanguageCode>(getLanguage());
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showClassMenu, setShowClassMenu] = useState(false);
  const [user, setUser] = useState<User | null>(localDb.getUser());
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [currentGrade, setCurrentGrade] = useState<number>(localDb.getUser()?.grade || 7);
  const [profile, setProfile] = useState(localDb.getProfile());

  useEffect(() => {
    const handleUpdate = () => {
      const u = localDb.getUser();
      setUser(u);
      if (u?.grade) {
        setCurrentGrade(u.grade);
      }
      setProfile(localDb.getProfile());
    };

    const unsubscribe = localDb.subscribe(handleUpdate);
    window.addEventListener('classChanged', handleUpdate);
    window.addEventListener('studentChanged', handleUpdate);

    return () => {
      unsubscribe();
      window.removeEventListener('classChanged', handleUpdate);
      window.removeEventListener('studentChanged', handleUpdate);
    };
  }, []);

  const handleGradeChange = (grade: number) => {
    setCurrentGrade(grade);
    setShowClassMenu(false);
    const currentUser = localDb.getUser();
    if (currentUser) {
      currentUser.grade = grade;
      localDb.setUser(currentUser);
    }
    window.dispatchEvent(new CustomEvent('classChanged', { detail: grade }));
  };

  const handleLanguageChange = (code: LanguageCode) => {
    setLanguage(code);
    setLang(code);
    setShowLangMenu(false);
    const currentUser = localDb.getUser();
    if (currentUser) {
      currentUser.language = code;
      localDb.setUser(currentUser);
    }
    // reload slightly to update text
    window.dispatchEvent(new Event('languageChanged'));
  };

  const toggleNetwork = () => {
    syncService.cycleNetworkStatus();
  };

  return (
    <header className="bg-white border-b border-amber-100 shadow-sm sticky top-0 z-30">
      {/* Top Banner Bar for Rural Network & Hub Status */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white px-4 py-1.5 text-xs font-medium flex flex-wrap items-center justify-between gap-2 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                networkStatus === 'online'
                  ? 'bg-emerald-300'
                  : networkStatus === 'low_bandwidth'
                  ? 'bg-amber-300'
                  : networkStatus === 'message_fallback'
                  ? 'bg-purple-300'
                  : networkStatus === 'syncing'
                  ? 'bg-sky-300'
                  : 'bg-rose-300'
              }`}
            ></span>
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                networkStatus === 'online'
                  ? 'bg-emerald-400'
                  : networkStatus === 'low_bandwidth'
                  ? 'bg-amber-400'
                  : networkStatus === 'message_fallback'
                  ? 'bg-purple-400'
                  : networkStatus === 'syncing'
                  ? 'bg-sky-400'
                  : 'bg-rose-400'
              }`}
            ></span>
          </span>
          <span className="font-bold tracking-wider text-xs">
            {networkStatus === 'online' && '🟢 ONLINE (Cloud HTTPS • Gemini 3.8 Flash)'}
            {networkStatus === 'low_bandwidth' && '🟡 LOW-BANDWIDTH (EDGE/2G • Minimal <500B)'}
            {networkStatus === 'offline' && '🔴 100% OFFLINE (On-Device AI • 0-Byte Network)'}
            {networkStatus === 'message_fallback' && '🟣 CELLULAR SMS (Message Protocol [ID]#[Action]#[Data])'}
            {networkStatus === 'syncing' && '🔄 SYNCING (Batch sync with Solar Hub...)'}
          </span>
          <span className="hidden sm:inline text-slate-500">|</span>
          <span className="hidden sm:inline text-slate-400 text-[11px]">
            Node #4: Rampur Solar Panchayat Hub
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Multi-transport Network Selector Chips */}
          <div className="flex items-center bg-slate-800/90 rounded-xl p-0.5 border border-slate-700">
            <button
              onClick={() => syncService.setNetworkStatus('online')}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                networkStatus === 'online'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Fast Cloud Gemini 3.8 Flash"
            >
              Online
            </button>
            <button
              onClick={() => syncService.setNetworkStatus('low_bandwidth')}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                networkStatus === 'low_bandwidth'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Low-bandwidth 2G EDGE compressed payload"
            >
              2G/Low-BW
            </button>
            <button
              onClick={() => syncService.setNetworkStatus('offline')}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                networkStatus === 'offline'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="100% On-device Local AI & SQLite/IndexedDB"
            >
              Offline
            </button>
            <button
              onClick={() => syncService.setNetworkStatus('message_fallback')}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                networkStatus === 'message_fallback'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Cellular SMS Protocol [StudentID]#[ActionCode]#[PayloadData]"
            >
              SMS Mode
            </button>
          </div>

          {/* Pending Sync Pill */}
          <button
            onClick={onSync}
            className="flex items-center gap-1 bg-white/10 hover:bg-white/20 px-2.5 py-0.5 rounded-xl text-[11px] font-semibold transition-colors border border-white/10"
            title="Click to synchronize offline records with Solar Hub"
          >
            <RefreshCw
              className={`w-3 h-3 ${networkStatus === 'syncing' ? 'animate-spin' : ''}`}
            />
            <span>
              {pendingSyncCount > 0 ? `${pendingSyncCount} Pending` : 'Synced ✓'}
            </span>
          </button>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
        {/* Logo & Rural Branding */}
        <div
          onClick={() => onTabChange('home')}
          className="flex items-center gap-3 cursor-pointer select-none"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-sky-500/20 font-bold text-xl">
            🌱
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl tracking-tight text-slate-900">
                REHBER <span className="text-sky-600 text-base font-semibold">(رہبر)</span>
              </span>
              <span className="bg-sky-100 text-sky-800 text-[10px] font-extrabold px-1.5 py-0.5 rounded uppercase">
                Offline First
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              AI Personalized Learning Platform for Rural Communities
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Hackathon Guided Demo Button */}
          <button
            onClick={onOpenDemo}
            className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm shadow-orange-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            title="Launch 13-step hackathon demo tour"
          >
            <PlayCircle className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Guided Demo Tour</span>
            <span className="xs:hidden">Demo</span>
          </button>

          {/* Student Profile Switcher Badge */}
          <button
            onClick={() => setIsJoinModalOpen(true)}
            className="flex items-center gap-1.5 bg-orange-50 hover:bg-orange-100 text-orange-950 border border-orange-200/90 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs hover:border-orange-300 cursor-pointer"
            title="Switch Learner or Join as New Student"
          >
            <span className="text-sm">{user?.avatar || '👦🏽'}</span>
            <span className="max-w-[70px] sm:max-w-[110px] truncate">{user?.name || 'Rahul'}</span>
            <ChevronDown className="w-3 h-3 text-orange-600" />
          </button>

          {/* Class Option (Near Demo) */}
          <div className="relative">
            <button
              onClick={() => setShowClassMenu(!showClassMenu)}
              className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/90 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs hover:border-amber-300"
              title="Select Class / Grade level"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-700" />
              <span>Class {currentGrade}</span>
              <ChevronDown className="w-3 h-3 text-amber-600 ml-0.5" />
            </button>

            {showClassMenu && (
              <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between px-2 py-1 border-b border-slate-100 mb-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Select Class / Grade
                  </span>
                  <span className="text-[10px] font-extrabold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-md">
                    Active: Class {currentGrade}
                  </span>
                </div>

                <div className="max-h-56 overflow-y-auto space-y-0.5 scrollbar-thin">
                  <div className="text-[10px] font-bold text-slate-400 px-2 pt-1 pb-0.5">
                    Middle School (Curriculum Ready)
                  </div>
                  {[5, 6, 7, 8].map((g) => (
                    <button
                      key={g}
                      onClick={() => handleGradeChange(g)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-xl font-medium transition-colors ${
                        currentGrade === g
                          ? 'bg-orange-500 text-white font-bold shadow-xs'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>📚</span>
                        <span>Class {g}</span>
                      </div>
                      {currentGrade === g && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}

                  <div className="text-[10px] font-bold text-slate-400 px-2 pt-2 pb-0.5 border-t border-slate-100">
                    Primary & Secondary
                  </div>
                  {[1, 2, 3, 4, 9, 10].map((g) => (
                    <button
                      key={g}
                      onClick={() => handleGradeChange(g)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-xl font-medium transition-colors ${
                        currentGrade === g
                          ? 'bg-orange-500 text-white font-bold shadow-xs'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>📖</span>
                        <span>Class {g}</span>
                      </div>
                      {currentGrade === g && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>

                {onOpenDiagnostic && (
                  <div className="pt-1.5 mt-1 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setShowClassMenu(false);
                        onOpenDiagnostic();
                      }}
                      className="w-full text-center py-1.5 px-2 rounded-xl text-[11px] font-bold text-orange-700 bg-orange-50 hover:bg-orange-100 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span>🎯</span>
                      <span>Take Class Diagnostic</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Gamification Streak & Points */}
          <div className="hidden md:flex items-center gap-2 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-xl text-xs">
            <div className="flex items-center gap-1 text-orange-600 font-bold">
              <Flame className="w-4 h-4 fill-orange-500 text-orange-500" />
              <span>{profile.streakDays} {t('days', 'Days')}</span>
            </div>
            <div className="w-px h-3 bg-amber-200"></div>
            <div className="flex items-center gap-1 text-amber-700 font-bold">
              <Award className="w-4 h-4 text-amber-600" />
              <span>{profile.xpPoints} XP</span>
            </div>
          </div>

          {/* Language Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-slate-600" />
              <span>
                {SUPPORTED_LANGUAGES.find((l) => l.code === lang)?.nativeName || 'English'}
              </span>
            </button>

            {showLangMenu && (
              <div className="absolute right-0 mt-2 w-44 bg-white border border-slate-200 rounded-2xl shadow-xl p-1.5 z-50">
                <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Regional Dialects
                </div>
                {SUPPORTED_LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => handleLanguageChange(l.code)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 text-xs rounded-xl transition-colors ${
                      lang === l.code
                        ? 'bg-orange-50 text-orange-700 font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{l.nativeName}</span>
                    <span className="text-slate-400 text-[11px]">{l.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tablet Frame View Toggle */}
          <button
            onClick={onToggleTabletFrame}
            className={`p-2 rounded-xl text-xs font-medium transition-colors hidden sm:flex items-center gap-1 ${
              isTabletFrame
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            title="Toggle Low-Cost Rural Tablet Simulator Frame"
          >
            {isTabletFrame ? (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-amber-700" />
                <span className="text-[11px] font-bold">Full View</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5" />
                <span className="text-[11px]">Tablet Frame</span>
              </>
            )}
          </button>

          {/* Logout Button */}
          <button
            onClick={() => { localStorage.removeItem('student_token'); window.location.reload(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all bg-red-50 text-red-600 hover:bg-red-100"
          >
            <span className="hidden sm:inline">Logout</span>
          </button>

          {/* Teacher Dashboard Switch */}
          <button
            onClick={() => onTabChange(currentTab === 'teacher' ? 'home' : 'teacher')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              currentTab === 'teacher'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {currentTab === 'teacher' ? 'Student View' : 'Teacher View'}
            </span>
          </button>
        </div>
      </div>

      {/* Join / Switch Student Modal */}
      <JoinStudentModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
      />
    </header>
  );
};

