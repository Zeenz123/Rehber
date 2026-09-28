import React from 'react';
import {
  Flame,
  Award,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { localDb } from '../services/localDb';
import { t } from '../services/i18n';

interface ProgressScreenProps {
  onStartQuiz: (topicId: string) => void;
  onOpenDiagnostic: () => void;
}

export const ProgressScreen: React.FC<ProgressScreenProps> = ({
  onStartQuiz,
  onOpenDiagnostic,
}) => {
  const [profile, setProfile] = React.useState(localDb.getProfile());
  const [user, setUser] = React.useState(localDb.getUser());

  React.useEffect(() => {
    const handleUpdate = () => {
      setProfile(localDb.getProfile());
      setUser(localDb.getUser());
    };
    const unsubscribe = localDb.subscribe(handleUpdate);
    window.addEventListener('studentChanged', handleUpdate);
    return () => {
      unsubscribe();
      window.removeEventListener('studentChanged', handleUpdate);
    };
  }, []);

  const masteries = Object.values(profile.topicMasteries);

  const strongTopics = masteries.filter((m) => m.status === 'strong');
  const improvingTopics = masteries.filter((m) => m.status === 'improving');
  const needsPracticeTopics = masteries.filter((m) => m.status === 'needs_practice');

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Profile Summary Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="text-4xl bg-orange-100 p-3 rounded-2xl shadow-xs">
            {user?.avatar || '👦🏽'}
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">
              {user?.name || 'Rahul Kumar'}
            </h1>
            <p className="text-xs text-slate-500">
              Class {user?.grade || 7} • {profile.overallLevel.toUpperCase()} LEVEL •{' '}
              {profile.currentSpeed === 'slow' ? '🐢 Slow Pace' : 'Standard Pace'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-amber-50 border border-amber-200 px-4 py-2 rounded-2xl text-center">
            <span className="text-xs font-bold text-amber-800 block">Streak</span>
            <span className="text-lg font-black text-orange-600 flex items-center justify-center gap-1">
              <Flame className="w-4 h-4 fill-orange-500" />
              {profile.streakDays} {t('days', 'Days')}
            </span>
          </div>

          <div className="bg-orange-50 border border-orange-200 px-4 py-2 rounded-2xl text-center">
            <span className="text-xs font-bold text-orange-800 block">Points</span>
            <span className="text-lg font-black text-orange-700 flex items-center justify-center gap-1">
              <Award className="w-4 h-4 text-orange-600" />
              {profile.xpPoints} XP
            </span>
          </div>
        </div>
      </div>

      {/* 2. Topic Mastery Gap Analysis (Prompt Section 3 & 14) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-slate-800 tracking-tight">
              AI Learning Gap Analysis
            </h2>
            <p className="text-xs text-slate-500">
              Personalized concept tracking computed by the on-device AI engine
            </p>
          </div>

          <button
            onClick={onOpenDiagnostic}
            className="text-xs font-bold text-orange-600 hover:text-orange-700"
          >
            Retake Placement
          </button>
        </div>

        {/* Categories: Needs Practice, Improving, Strong */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Needs Practice */}
          <div className="bg-rose-50/60 border border-rose-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 uppercase tracking-wider">
              <span>🔴 Needs Practice ({needsPracticeTopics.length})</span>
            </div>
            {needsPracticeTopics.map((m) => (
              <div
                key={m.topicId}
                className="bg-white p-3 rounded-xl border border-rose-100 shadow-2xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-xs text-slate-800">{m.topicTitle}</h4>
                  <span className="text-xs font-black text-rose-600">
                    {m.masteryPercentage}%
                  </span>
                </div>
                {m.identifiedGaps.length > 0 && (
                  <p className="text-[10px] text-rose-700">
                    Gaps: {m.identifiedGaps.join(', ')}
                  </p>
                )}
                <button
                  onClick={() => onStartQuiz(m.topicId)}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold py-1.5 rounded-lg transition-colors"
                >
                  Practice Now
                </button>
              </div>
            ))}
          </div>

          {/* Improving */}
          <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 uppercase tracking-wider">
              <span>🟡 Improving ({improvingTopics.length})</span>
            </div>
            {improvingTopics.map((m) => (
              <div
                key={m.topicId}
                className="bg-white p-3 rounded-xl border border-amber-100 shadow-2xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-xs text-slate-800">{m.topicTitle}</h4>
                  <span className="text-xs font-black text-amber-600">
                    {m.masteryPercentage}%
                  </span>
                </div>
                <button
                  onClick={() => onStartQuiz(m.topicId)}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold py-1.5 rounded-lg transition-colors"
                >
                  Solidify Mastery
                </button>
              </div>
            ))}
          </div>

          {/* Strong */}
          <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 uppercase tracking-wider">
              <span>🟢 Strong Topics ({strongTopics.length})</span>
            </div>
            {strongTopics.map((m) => (
              <div
                key={m.topicId}
                className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-xs text-slate-800">{m.topicTitle}</h4>
                  <span className="text-xs font-black text-emerald-600">
                    {m.masteryPercentage}%
                  </span>
                </div>
                <span className="text-[10px] text-emerald-700 font-semibold block">
                  ✓ Concept Mastered
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Badges Collection (Section 24 Gamification) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
        <h2 className="text-base font-black text-slate-800 tracking-tight">
          Badges & Achievements
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {profile.badges.map((b) => (
            <div
              key={b.id}
              className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl flex items-center gap-3"
            >
              <span className="text-2xl p-2 bg-white rounded-xl shadow-2xs">
                {b.icon}
              </span>
              <div>
                <h4 className="font-extrabold text-xs text-slate-800">{b.title}</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">{b.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
