import React, { useState, useEffect } from 'react';
import {
  Flame,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Play,
  Mic,
  Calculator,
  Leaf,
  BookOpen,
  Award,
  Zap,
  HelpCircle,
  UserPlus,
  Users,
  MoreVertical,
  X,
  Laptop,
} from 'lucide-react';
import { localDb } from '../services/localDb';
import { t } from '../services/i18n';
import { NetworkStatus, User, LearnerProfile } from '../types';
import { JoinStudentModal } from './JoinStudentModal';

interface HomeScreenProps {
  onStartLesson: (lessonId?: string) => void;
  onStartQuiz: (topicId?: string) => void;
  onOpenTutor: () => void;
  onOpenDiagnostic: () => void;
  onOpenHub: () => void;
  networkStatus: NetworkStatus;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onStartLesson,
  onStartQuiz,
  onOpenTutor,
  onOpenDiagnostic,
  onOpenHub,
  networkStatus,
}) => {
  const [user, setUser] = useState<User | null>(localDb.getUser());
  const [profile, setProfile] = useState<LearnerProfile>(localDb.getProfile());
  const [isJoinModalOpen, setIsJoinModalOpen] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [currentDemoStep, setCurrentDemoStep] = useState(0);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const recommendation = localDb.getCurrentRecommendation();
  const subjects = localDb.getSubjects();
  const lastSyncTime = localDb.getLastSyncTime();

  const demoSteps = [
    {
      title: 'Welcome to Rehber! 🎓',
      description: 'Rehber is your AI-powered rural learning companion. It works offline, on slow 2G networks, and even via basic SMS! Let us show you around.'
    },
    {
      title: '💬 Ask Your AI Tutor',
      description: 'Tap the "AI Tutor" button to ask any question in your language. Try: "What is photosynthesis?" or "Solve 2x + 5 = 15". The AI works offline with exact math answers!'
    },
    {
      title: '📝 Practice with Quizzes',
      description: 'Each subject has 5+ quizzes with 10-15 questions. Your results are analyzed by our IRT adaptive engine to find your learning gaps and recommend the perfect next lesson.'
    },
    {
      title: '📡 2G Data Saver Mode',
      description: 'Toggle the 2G Data Saver in the top bar. Messages are compressed by 80%, non-essential data is deferred, and if the connection drops, your question is automatically sent via SMS protocol.'
    },
    {
      title: '🎤 Voice Learning',
      description: 'Tap the microphone icon to ask questions by voice. The app reads answers aloud too! Works offline with downloaded voice models. Perfect for students who prefer listening.'
    },
    {
      title: '📱 SMS When Internet Fails',
      description: 'No internet? No problem! Your questions are encoded in a compact SMS format: StudentID#ASK#Question. The system processes it and sends back an SMS reply. Try it in the AI Tutor screen!'
    },
    {
      title: '☀️ Solar Hub & Offline Sync',
      description: 'Visit the Hub screen to see your solar learning node status. All your progress syncs automatically when you connect to the village hub. Battery-powered learning, even without grid electricity!'
    },
    {
      title: '👩🏫 For Teachers',
      description: 'Teachers can access the web dashboard at localhost:3001 to monitor all student progress, send interventions via SMS, and view class-wide analytics in real-time.'
    }
  ];

  useEffect(() => {
    const handleUpdate = () => {
      setUser(localDb.getUser());
      setProfile(localDb.getProfile());
    };

    const unsubscribe = localDb.subscribe(handleUpdate);
    window.addEventListener('studentChanged', handleUpdate);
    window.addEventListener('classChanged', handleUpdate);

    return () => {
      unsubscribe();
      window.removeEventListener('studentChanged', handleUpdate);
      window.removeEventListener('classChanged', handleUpdate);
    };
  }, []);

  // Calculate subject progress from profile masteries
  const calculateSubjectProgress = (subjId: string): number => {
    const masteries = Object.values(profile.topicMasteries).filter(
      (m) => m.subjectId === subjId
    );
    if (masteries.length === 0) return 60;
    const total = masteries.reduce((acc, curr) => acc + curr.masteryPercentage, 0);
    return Math.round(total / masteries.length);
  };

  const getSubjectIcon = (iconName: string) => {
    switch (iconName) {
      case 'Calculator':
        return Calculator;
      case 'Leaf':
        return Leaf;
      case 'BookOpen':
        return BookOpen;
      case 'Laptop':
        return Laptop;
      default:
        return Sparkles;
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* 1. Student Greeting & Daily Progress */}
      <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-6 text-white shadow-xl shadow-orange-500/15 relative overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute -top-12 -right-12 w-44 h-44 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
        <div className="absolute -bottom-8 -left-8 w-36 h-36 bg-black/10 rounded-full blur-lg pointer-events-none"></div>

        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsJoinModalOpen(true)}
                className="text-4xl bg-white/20 hover:bg-white/30 transition-transform active:scale-95 p-2 rounded-2xl shadow-inner backdrop-blur-sm cursor-pointer"
                title="Click to Switch Student or Change Avatar"
              >
                {user?.avatar || '👦🏽'}
              </button>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-black tracking-tight">
                    {t('goodMorning', 'Good Morning!')} {user?.name || 'Rahul'} 👋
                  </h1>
                  <button
                    onClick={() => setIsJoinModalOpen(true)}
                    className="bg-white/20 hover:bg-white/35 active:scale-95 text-white text-xs font-bold px-2.5 py-1 rounded-xl backdrop-blur-sm transition-all flex items-center gap-1 border border-white/25 shadow-2xs cursor-pointer"
                    title="Add a new user or switch student"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Add / Switch User</span>
                  </button>
                </div>
                <p className="text-amber-100 text-xs font-medium">
                  Class {user?.grade || 7} • Rampur Community Hub Node • Level: <strong className="capitalize">{profile.overallLevel}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/20">
                <Flame className="w-5 h-5 text-orange-300 fill-orange-300" />
                <div className="text-right">
                  <span className="text-sm font-black text-white">{profile.streakDays}</span>
                  <span className="text-[10px] text-amber-100 block -mt-1 font-semibold">
                    {t('days', 'Days')} Streak
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/20">
                <Award className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                <div className="text-right">
                  <span className="text-sm font-black text-white">{profile.xpPoints}</span>
                  <span className="text-[10px] text-amber-100 block -mt-1 font-semibold">
                    XP Points
                  </span>
                </div>
              </div>

              {/* Three-dot menu */}
              <div className="relative ml-2">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-2 bg-black/20 hover:bg-black/30 backdrop-blur-md rounded-xl border border-white/20 text-white transition-colors cursor-pointer"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>

                {isMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-slate-900 rounded-xl shadow-2xl border border-slate-700 py-1.5 z-50 overflow-hidden">
                      <button 
                        onClick={() => { setIsMenuOpen(false); setIsDemoOpen(true); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        📖 App Demo & Walkthrough
                      </button>
                      <button 
                        onClick={() => { setIsMenuOpen(false); alert('Coming soon!'); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        🎤 Voice Settings
                      </button>
                      <button 
                        onClick={() => { setIsMenuOpen(false); alert('Coming soon!'); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        📊 Learning Analytics
                      </button>
                      <button 
                        onClick={() => { setIsMenuOpen(false); alert('Coming soon!'); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        🔄 Sync Status
                      </button>
                      <button 
                        onClick={() => { setIsMenuOpen(false); setIsAboutOpen(true); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        ℹ️ About Rehber
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Today's Learning Target Bar */}
          <div className="bg-black/20 backdrop-blur-md rounded-2xl p-3.5 border border-white/15">
            <div className="flex items-center justify-between text-xs mb-1.5 font-bold">
              <span className="text-amber-100">{t('todaysLearning', "Today's Learning for")} {user?.name || 'Learner'}</span>
              <span className="text-white">
                {profile.completedLessons.length > 0 ? '75% Completed' : 'Ready to Start!'}
              </span>
            </div>
            <div className="w-full bg-black/30 rounded-full h-3.5 p-0.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-300 to-yellow-200 h-full rounded-full transition-all duration-700 shadow-sm"
                style={{ width: profile.completedLessons.length > 0 ? '75%' : '20%' }}
              ></div>
            </div>
            <p className="text-[11px] text-amber-100 mt-1.5 flex items-center justify-between font-medium">
              <span>🎯 Goal: 2 lessons & 1 practice quiz today!</span>
              <span className="text-[10px] text-amber-200">
                {profile.completedLessons.length} lessons mastered
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Join / Switch Student Modal */}
      <JoinStudentModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
      />

      {/* 2. Primary Action Cards: Continue Learning & AI Recommendation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Continue Learning Card */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow relative flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {t('continueLearning', 'Continue Learning')}
              </span>
              <span className="bg-orange-100 text-orange-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
                Mathematics
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight mb-1">
              Fractions & Decimals
            </h2>
            <p className="text-xs text-slate-500 mb-4 line-clamp-2">
              Learn how to share rotis and divide agricultural harvest using step-by-step voice guidance.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => onStartLesson('lesson-frac-1')}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-sm shadow-orange-600/20 transition-transform active:scale-[0.98]"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{t('startLesson', 'Start Lesson')}</span>
            </button>
            <button
              onClick={onOpenTutor}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl transition-colors"
              title="Ask AI tutor about Fractions"
            >
              <Mic className="w-4 h-4 text-orange-600" />
            </button>
          </div>
        </div>

        {/* AI Recommendation Card */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50/60 rounded-3xl p-5 border border-amber-200 shadow-sm relative flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600 fill-amber-500" />
                <span className="text-xs font-extrabold text-amber-900 uppercase tracking-wider">
                  {t('aiRecommendation', 'AI Recommendation')}
                </span>
              </div>
              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                  recommendation.recommendedSpeed === 'slow'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {recommendation.recommendedSpeed === 'slow' ? '🐢 Slow Pace' : '⚡ Standard'}
              </span>
            </div>

            <h2 className="text-lg font-black text-amber-950 tracking-tight mb-1">
              ⭐ {recommendation.title}
            </h2>
            <p className="text-xs text-amber-800/90 leading-relaxed mb-4">
              {recommendation.reason}
            </p>
          </div>

          <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between gap-3">
            <span className="text-[11px] font-bold text-amber-700">
              Level: {recommendation.recommendedLevel.toUpperCase()}
            </span>
            <button
              onClick={() => onStartLesson(recommendation.lessonId)}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded-2xl text-xs flex items-center gap-1.5 shadow-sm shadow-amber-600/20 transition-transform active:scale-[0.98]"
            >
              <span>{recommendation.actionText}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Subject Progress Overview */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-black text-slate-800 tracking-tight">
            {t('yourProgress', 'Your Progress')}
          </h2>
          <button
            onClick={onOpenDiagnostic}
            className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
          >
            <span>Retake Diagnostic</span>
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {subjects.map((subj) => {
            const Icon = getSubjectIcon(subj.icon);
            const progress = calculateSubjectProgress(subj.id);

            return (
              <div
                key={subj.id}
                onClick={() => {
                  let targetTopic = 'eng-vocab';
                  if (subj.id === 'math') targetTopic = 'math-fractions';
                  if (subj.id === 'science') targetTopic = 'sci-plants';
                  if (subj.id === 'english') targetTopic = 'eng-vocab';
                  if (subj.id === 'digital') targetTopic = 'dig-basics';
                  onStartQuiz(targetTopic);
                }}
                className="bg-slate-50 hover:bg-orange-50/50 p-4 rounded-2xl border border-slate-200/60 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-xl bg-white shadow-xs group-hover:scale-110 transition-transform">
                    <Icon className="w-4 h-4 text-orange-600" />
                  </div>
                  <span className="text-sm font-black text-slate-800">
                    {progress}%
                  </span>
                </div>
                <h3 className="font-extrabold text-sm text-slate-800 mb-2">
                  {subj.name}
                </h3>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      progress >= 75
                        ? 'bg-emerald-500'
                        : progress >= 60
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 font-medium">
                  {subj.topicsCount} Topics • Offline Ready
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Offline Status & Solar Hub Sync Bar */}
      <div className="bg-slate-900 text-white rounded-3xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                {t('availableOffline', '✓ Available Offline')}
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
                100% On-Device
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-0.5">
              All 10 topics, 30 lessons, and 100 quizzes operate with zero internet connection.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center">
          <div className="text-right text-xs text-slate-400 font-medium">
            <span className="block text-[10px] uppercase tracking-wider text-slate-500">
              {t('lastSync', 'Last Sync')}
            </span>
            <span className="text-slate-200">{lastSyncTime}</span>
          </div>

          <button
            onClick={onOpenHub}
            className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors shadow-sm"
          >
            Hub Status
          </button>
        </div>
      </div>

      {/* Walkthrough Modal */}
      {isDemoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsDemoOpen(false)} />
          <div className="relative bg-slate-800 text-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-700 transform transition-all">
            <button 
              onClick={() => setIsDemoOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-700 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="mb-8 mt-2 min-h-[140px]">
              <h3 className="text-2xl font-black mb-3">{demoSteps[currentDemoStep].title}</h3>
              <p className="text-slate-300 leading-relaxed text-sm">{demoSteps[currentDemoStep].description}</p>
            </div>
            
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-700">
              <div className="flex gap-1.5">
                {demoSteps.map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-1.5 rounded-full transition-all duration-300 ${i === currentDemoStep ? 'w-6 bg-orange-500' : 'w-1.5 bg-slate-600'}`}
                  />
                ))}
              </div>
              
              <div className="flex gap-2">
                <button 
                  disabled={currentDemoStep === 0}
                  onClick={() => setCurrentDemoStep(Math.max(0, currentDemoStep - 1))}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  Previous
                </button>
                {currentDemoStep === demoSteps.length - 1 ? (
                  <button 
                    onClick={() => { setIsDemoOpen(false); setCurrentDemoStep(0); }}
                    className="px-6 py-2 rounded-xl text-sm font-bold bg-orange-600 hover:bg-orange-700 text-white transition-colors cursor-pointer"
                  >
                    Got it!
                  </button>
                ) : (
                  <button 
                    onClick={() => setCurrentDemoStep(Math.min(demoSteps.length - 1, currentDemoStep + 1))}
                    className="px-6 py-2 rounded-xl text-sm font-bold bg-slate-700 hover:bg-slate-600 text-white transition-colors cursor-pointer"
                  >
                    Next
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* About Modal */}
      {isAboutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsAboutOpen(false)} />
          <div className="relative bg-slate-800 text-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-700 text-center">
            <button 
              onClick={() => setIsAboutOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-700 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            
            <h3 className="text-xl font-black mb-1">Rehber - Rural Learning Ecosystem</h3>
            <p className="text-orange-400 font-bold text-sm mb-4">Version 2.0.0</p>
            
            <p className="text-slate-300 text-sm mb-6 leading-relaxed">
              AI-powered adaptive learning for rural students. Works offline, on 2G networks, and via SMS. Built for solar-powered village learning hubs.
            </p>
            
            <div className="bg-slate-900/50 rounded-2xl p-4 text-left border border-slate-700">
              <h4 className="font-bold text-slate-200 mb-2 text-xs uppercase tracking-wider">Key Features</h4>
              <ul className="text-sm text-slate-400 space-y-1.5">
                <li>• Offline AI Tutor</li>
                <li>• Adaptive Quizzes</li>
                <li>• Voice Learning</li>
                <li>• SMS Fallback</li>
                <li>• Solar Hub Sync</li>
                <li>• Teacher Dashboard</li>
              </ul>
            </div>
            
            <button 
              onClick={() => setIsAboutOpen(false)}
              className="w-full mt-6 py-3 rounded-xl text-sm font-bold bg-slate-700 hover:bg-slate-600 text-white transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
