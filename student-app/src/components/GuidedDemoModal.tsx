import React, { useState } from 'react';
import {
  PlayCircle,
  ArrowRight,
  CheckCircle,
  RotateCcw,
  Sparkles,
  Volume2,
  WifiOff,
  Wifi,
  GraduationCap,
  Award,
} from 'lucide-react';
import { localDb } from '../services/localDb';
import { syncService } from '../services/syncService';
import { voiceService } from '../services/voiceService';
import { getLanguage } from '../services/i18n';

interface GuidedDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: string) => void;
  onOpenLesson: (lessonId: string) => void;
  onOpenQuiz: (topicId: string) => void;
  onOpenTutor: (prompt: string) => void;
  onOpenDiagnostic: () => void;
}

export const GuidedDemoModal: React.FC<GuidedDemoModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onOpenLesson,
  onOpenQuiz,
  onOpenTutor,
  onOpenDiagnostic,
}) => {
  if (!isOpen) return null;

  const [currentStep, setCurrentStep] = useState<number>(1);

  const demoSteps = [
    {
      step: 1,
      title: 'Step 1: Open RuralLearn AI',
      desc: 'The child-friendly home screen opens with high-contrast buttons, daily goal progress, and 100% offline availability.',
      actionLabel: 'Go to Home Screen',
      execute: () => {
        onNavigateTab('home');
      },
    },
    {
      step: 2,
      title: 'Step 2: Select Language & Class',
      desc: 'Select Hindi, Tamil, Telugu, Malayalam, Kannada, or English. The app switches to native dialect localization and Class 7.',
      actionLabel: 'Open Diagnostic Setup',
      execute: () => {
        onOpenDiagnostic();
      },
    },
    {
      step: 3,
      title: 'Step 3: Student Diagnostic Assessment',
      desc: 'Quick initial questions evaluate student capability across Mathematics and Science without overwhelming the child.',
      actionLabel: 'Take Diagnostic Assessment',
      execute: () => {
        onOpenDiagnostic();
      },
    },
    {
      step: 4,
      title: 'Step 4: AI Analyzes Diagnostic Results',
      desc: 'Local AI builds personalized profile: Algebra 🔴 Weak (35%), Fractions 🟡 Medium (65%), Geometry 🟢 Strong (82%).',
      actionLabel: 'View AI Learning Profile',
      execute: () => {
        onNavigateTab('progress');
      },
    },
    {
      step: 5,
      title: 'Step 5: AI Recommends Next Lesson',
      desc: 'AI detects gaps and recommends: "Start with Algebra Basics (Slow Pace)" to build solid intuition.',
      actionLabel: 'Check Recommendation Card',
      execute: () => {
        onNavigateTab('home');
      },
    },
    {
      step: 6,
      title: 'Step 6: Open Lesson & Voice Guidance',
      desc: 'Student opens Algebra lesson. Step-by-step numbered steps are read aloud with pitch & speed controls (🐢 Slow, ⚡ Fast).',
      actionLabel: 'Open Algebra Lesson',
      execute: () => {
        onOpenLesson('lesson-alg-1');
      },
    },
    {
      step: 7,
      title: 'Step 7: Child Asks AI with Voice',
      desc: 'Student taps "🎤 Ask" and speaks: "Explain this to me". AI responds in simple language with practical village analogies.',
      actionLabel: 'Ask AI Tutor',
      execute: () => {
        onOpenTutor('Explain algebra equations with a simple village example.');
      },
    },
    {
      step: 8,
      title: 'Step 8: Student Takes Practice Quiz',
      desc: 'Interactive quiz checks understanding. Instant feedback explains why each answer is right or wrong.',
      actionLabel: 'Launch Practice Quiz',
      execute: () => {
        onOpenQuiz('math-algebra');
      },
    },
    {
      step: 9,
      title: 'Step 9: Student Scores 42% (Needs Practice)',
      desc: 'AI adapts: "Let\'s practice this topic again." Learning pace is automatically slowed down to protect confidence.',
      actionLabel: 'Simulate 42% Score & Slow Down',
      execute: () => {
        const profile = localDb.getProfile();
        profile.currentSpeed = 'slow';
        profile.topicMasteries['math-algebra'] = {
          ...profile.topicMasteries['math-algebra'],
          masteryPercentage: 42,
          status: 'needs_practice',
          recommendedSpeed: 'slow',
        };
        localDb.setProfile(profile);
        localDb.setRecommendation({
          id: 'rec-slow-01',
          studentId: 'student-rahul-01',
          subjectId: 'math',
          topicId: 'math-algebra',
          topicTitle: 'Algebra Basics & Equations',
          lessonId: 'lesson-alg-1',
          title: 'Revise Algebra Basics (Slow Pace 🐢)',
          reason: 'Score was 42%. The on-device AI slowed down the speed and scheduled easier worked examples.',
          recommendedLevel: 'beginner',
          recommendedSpeed: 'slow',
          practiceCount: 5,
          actionText: 'Revise Basics',
          isRevision: true,
          timestamp: new Date().toISOString(),
        });
        onNavigateTab('home');
      },
    },
    {
      step: 10,
      title: 'Step 10: Retest Score: 78% (Promoted!)',
      desc: 'After gentle practice, score jumps to 78%! AI changes recommendation to "Ready for Intermediate Algebra"!',
      actionLabel: 'Simulate 78% Mastery & Advance',
      execute: () => {
        const profile = localDb.getProfile();
        profile.currentSpeed = 'normal';
        profile.topicMasteries['math-algebra'] = {
          ...profile.topicMasteries['math-algebra'],
          masteryPercentage: 78,
          status: 'strong',
          recommendedSpeed: 'normal',
          recommendedDifficulty: 'intermediate',
        };
        localDb.setProfile(profile);
        localDb.setRecommendation({
          id: 'rec-adv-01',
          studentId: 'student-rahul-01',
          subjectId: 'math',
          topicId: 'math-algebra',
          topicTitle: 'Algebra Basics & Equations',
          lessonId: 'lesson-alg-2',
          title: 'Advance to Intermediate Algebra',
          reason: 'Terrific improvement (78%)! You mastered variables and are promoted to multiplication equations.',
          recommendedLevel: 'intermediate',
          recommendedSpeed: 'normal',
          practiceCount: 3,
          actionText: 'Start Next Challenge',
          isRevision: false,
          timestamp: new Date().toISOString(),
        });
        onNavigateTab('home');
      },
    },
    {
      step: 11,
      title: 'Step 11: 100% Offline & Cellular SMS Fallback',
      desc: 'Simulate extreme rural network conditions. In Offline mode, the on-device AI runs with 0 bytes sent. In SMS mode, queries serialize into compact cellular strings ([StudentID]#[ActionCode]#[PayloadData]) for SMS dispatch.',
      actionLabel: 'Activate SMS Fallback & Query',
      execute: () => {
        syncService.setNetworkStatus('message_fallback');
        onNavigateTab('tutor');
        onOpenTutor('Why is 1/2 bigger than 1/4?');
      },
    },
    {
      step: 12,
      title: 'Step 12: Hub Connectivity & Sync Complete',
      desc: 'Device reaches the solar-powered community hub. Status changes: Syncing... -> Sync Complete ✓. Records backed up.',
      actionLabel: 'Connect & Sync with Hub',
      execute: async () => {
        syncService.setNetworkStatus('online');
        onNavigateTab('hub');
        await syncService.syncNow();
      },
    },
    {
      step: 13,
      title: 'Step 13: Teacher Dashboard Updates',
      desc: 'Teacher logs into dashboard to see updated class mastery, aggregated topic bottlenecks, and student drill-down.',
      actionLabel: 'Open Teacher Dashboard',
      execute: () => {
        onNavigateTab('teacher');
      },
    },
  ];

  const currentStepData = demoSteps[currentStep - 1];

  const handleExecuteAndNext = () => {
    currentStepData.execute();
    if (currentStep < demoSteps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 relative overflow-hidden space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
              🚀
            </span>
            <div>
              <h2 className="text-base font-black text-slate-800 tracking-tight">
                13-Step Guided Hackathon Demo
              </h2>
              <p className="text-[11px] text-slate-500">
                Official end-to-end evaluation scenario from the prompt specification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold text-sm"
          >
            ✕
          </button>
        </div>

        {/* Step Navigation Pill Indicator */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
          {demoSteps.map((s) => (
            <button
              key={s.step}
              onClick={() => setCurrentStep(s.step)}
              className={`w-7 h-7 rounded-lg text-xs font-black shrink-0 transition-all ${
                currentStep === s.step
                  ? 'bg-orange-600 text-white shadow-xs scale-110'
                  : currentStep > s.step
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {s.step}
            </button>
          ))}
        </div>

        {/* Current Step Body Card */}
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-orange-600 uppercase tracking-wider">
              Step {currentStep} of 13
            </span>
            <span className="text-[10px] bg-white px-2 py-0.5 rounded-full text-slate-500 font-bold border border-amber-200">
              Interactive Execution
            </span>
          </div>

          <h3 className="text-lg font-black text-slate-800 leading-snug">
            {currentStepData.title}
          </h3>

          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            {currentStepData.desc}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            onClick={() => {
              if (currentStep > 1) setCurrentStep(currentStep - 1);
            }}
            disabled={currentStep === 1}
            className={`text-xs font-bold px-3 py-2 rounded-xl ${
              currentStep === 1 ? 'text-slate-300' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Previous
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                currentStepData.execute();
                onClose();
              }}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl transition-colors"
            >
              Execute & Close
            </button>

            <button
              onClick={handleExecuteAndNext}
              className="bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-orange-600/20 flex items-center gap-1.5 transition-transform active:scale-[0.98]"
            >
              <span>{currentStep === 13 ? 'Finish Tour' : currentStepData.actionLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
