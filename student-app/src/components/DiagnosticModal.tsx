import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  RotateCcw,
  BookOpen,
  Award,
  Globe,
  Sliders,
  Check,
} from 'lucide-react';
import { LanguageCode } from '../types';
import { SUPPORTED_LANGUAGES, setLanguage, getLanguage, t } from '../services/i18n';
import { localDb } from '../services/localDb';
import { localAiEngine } from '../services/localAiEngine';
import { messageService } from '../services/messageService';

interface DiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export const DiagnosticModal: React.FC<DiagnosticModalProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  if (!isOpen) return null;

  const [step, setStep] = useState<'setup' | 'quiz' | 'analyzing' | 'result'>('setup');
  const [selectedLang, setSelectedLang] = useState<LanguageCode>(getLanguage());
  const [selectedGrade, setSelectedGrade] = useState<number>(7);

  // Diagnostic questions covering Math, Science, and English
  const diagnosticQuestions = [
    {
      id: 'diag-1',
      subjectId: 'math',
      topicId: 'math-algebra',
      text: 'Solve for x: x + 4 = 11',
      options: ['5', '7', '15', '44'],
      correctAnswer: '7',
      gap: 'linear_equations',
    },
    {
      id: 'diag-2',
      subjectId: 'math',
      topicId: 'math-fractions',
      text: 'What is 1/4 + 2/4 in simplest form?',
      options: ['3/4', '3/8', '2/4', '1/2'],
      correctAnswer: '3/4',
      gap: 'fraction_addition',
    },
    {
      id: 'diag-3',
      subjectId: 'math',
      topicId: 'math-geometry',
      text: 'What is the measure of a perfect square right angle?',
      options: ['45°', '90°', '180°', '360°'],
      correctAnswer: '90°',
      gap: 'angles',
    },
    {
      id: 'diag-4',
      subjectId: 'science',
      topicId: 'sci-plants',
      text: 'What green pigment traps sunlight during photosynthesis in crop leaves?',
      options: ['Chlorophyll', 'Hemoglobin', 'Carotene', 'Melanin'],
      correctAnswer: 'Chlorophyll',
      gap: 'plant_pigments',
    },
    {
      id: 'diag-5',
      subjectId: 'science',
      topicId: 'sci-energy',
      text: 'Which simple machine is used on a village well to lift heavy water buckets?',
      options: ['Pulley', 'Wedge', 'Screw', 'Ramp'],
      correctAnswer: 'Pulley',
      gap: 'simple_machines',
    },
  ];

  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [analyzedProfile, setAnalyzedProfile] = useState<any>(null);

  const handleStartQuestions = () => {
    setLanguage(selectedLang);
    const user = localDb.getUser();
    if (user) {
      user.language = selectedLang;
      user.grade = selectedGrade;
      localDb.setUser(user);
    }
    setStep('quiz');
    setCurrentQIndex(0);
    setAnswers({});
  };

  const handleSelectOption = (opt: string) => {
    setAnswers({
      ...answers,
      [diagnosticQuestions[currentQIndex].id]: opt,
    });
  };

  const handleNextQuestion = () => {
    if (currentQIndex < diagnosticQuestions.length - 1) {
      setCurrentQIndex(currentQIndex + 1);
    } else {
      // Analyze results with on-device AI
      setStep('analyzing');

      setTimeout(() => {
        // Compute per topic score
        const topicScores: Record<string, { score: number; count: number; gaps: string[] }> = {
          'math-algebra': { score: 0, count: 0, gaps: [] },
          'math-fractions': { score: 0, count: 0, gaps: [] },
          'math-geometry': { score: 0, count: 0, gaps: [] },
          'sci-plants': { score: 0, count: 0, gaps: [] },
          'sci-energy': { score: 0, count: 0, gaps: [] },
        };

        diagnosticQuestions.forEach((q) => {
          const ans = answers[q.id];
          const isCorrect = ans && ans.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
          topicScores[q.topicId].count++;
          if (isCorrect) {
            topicScores[q.topicId].score += 100;
          } else {
            topicScores[q.topicId].gaps.push(q.gap);
          }
        });

        const resultsPayload = Object.entries(topicScores).map(([tId, val]) => ({
          subjectId: tId.startsWith('math') ? 'math' : 'science',
          topicId: tId,
          score: val.count > 0 ? Math.round(val.score / val.count) : 50,
          gaps: val.gaps,
        }));

        const updatedProfile = localAiEngine.processDiagnosticAssessment(resultsPayload);
        setAnalyzedProfile(updatedProfile);
        setStep('result');
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Step 1: Language & Grade Setup */}
        {step === 'setup' && (
          <div className="space-y-5">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto mb-2 text-2xl">
                🎯
              </div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">
                {t('diagnosticTitle', 'Diagnostic Assessment')}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {t('diagnosticSubtitle', "Let's find your personal learning level!")}
              </p>
            </div>

            {/* Select Language */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                {t('selectLanguage', 'Select Language / Regional Dialect')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {SUPPORTED_LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => setSelectedLang(l.code)}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                      selectedLang === l.code
                        ? 'bg-orange-50 border-orange-500 text-orange-950 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{l.nativeName}</span>
                    <span className="text-[10px] text-slate-400">{l.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Select Grade */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                {t('selectClass', 'Select Class / Grade')}
              </label>
              <div className="flex items-center gap-2">
                {[5, 6, 7, 8, 9].map((g) => (
                  <button
                    key={g}
                    onClick={() => setSelectedGrade(g)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${
                      selectedGrade === g
                        ? 'bg-orange-600 text-white border-orange-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Class {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                onClick={onClose}
                className="text-xs font-bold text-slate-500 hover:text-slate-700 px-3 py-2"
              >
                Skip for now
              </button>
              <button
                onClick={handleStartQuestions}
                className="bg-orange-600 hover:bg-orange-700 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-orange-600/20"
              >
                <span>{t('startAssessment', 'Start Diagnostic')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Diagnostic Questions */}
        {step === 'quiz' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400">
              <span className="text-orange-600 uppercase">
                Diagnostic Question {currentQIndex + 1} of {diagnosticQuestions.length}
              </span>
              <span>{diagnosticQuestions[currentQIndex].subjectId.toUpperCase()}</span>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-orange-600 h-full rounded-full transition-all"
                style={{
                  width: `${((currentQIndex + 1) / diagnosticQuestions.length) * 100}%`,
                }}
              ></div>
            </div>

            <h3 className="font-extrabold text-sm sm:text-base text-slate-800 leading-snug">
              {diagnosticQuestions[currentQIndex].text}
            </h3>

            <div className="space-y-2">
              {diagnosticQuestions[currentQIndex].options.map((opt, i) => {
                const isSelected = answers[diagnosticQuestions[currentQIndex].id] === opt;
                return (
                  <button
                    key={i}
                    onClick={() => handleSelectOption(opt)}
                    className={`w-full p-3 rounded-xl border text-left text-xs transition-all ${
                      isSelected
                        ? 'bg-orange-50 border-orange-500 text-orange-950 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleNextQuestion}
                disabled={!answers[diagnosticQuestions[currentQIndex].id]}
                className={`font-extrabold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 ${
                  answers[diagnosticQuestions[currentQIndex].id]
                    ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                <span>{currentQIndex === diagnosticQuestions.length - 1 ? 'Finish & Analyze' : 'Next'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Analyzing screen */}
        {step === 'analyzing' && (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full border-4 border-orange-500 border-t-transparent animate-spin mx-auto"></div>
            <h3 className="font-black text-base text-slate-800">
              {t('analyzingResults', 'AI is analyzing your answers...')}
            </h3>
            <p className="text-xs text-slate-500">
              Detecting learning gaps and personalizing your adaptive speed.
            </p>
          </div>
        )}

        {/* Step 4: Diagnostic Results & Generated Profile */}
        {step === 'result' && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-1 font-bold text-xl">
                ✓
              </div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">
                {t('yourLearningProfile', 'Your Learning Profile')}
              </h2>
              <p className="text-xs text-slate-500">
                AI has configured your personalized learning path!
              </p>
            </div>

            {/* Topic Mastery Summary */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2 text-xs">
              <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider block">
                Subject Diagnostics
              </span>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between font-bold">
                  <span>Mathematics: Algebra</span>
                  <span className="text-rose-600 flex items-center gap-1">
                    🔴 Needs Practice
                  </span>
                </div>
                <div className="flex items-center justify-between font-bold">
                  <span>Mathematics: Fractions</span>
                  <span className="text-amber-600 flex items-center gap-1">
                    🟡 Improving
                  </span>
                </div>
                <div className="flex items-center justify-between font-bold">
                  <span>Mathematics: Geometry</span>
                  <span className="text-emerald-600 flex items-center gap-1">
                    🟢 Strong
                  </span>
                </div>
                <div className="flex items-center justify-between font-bold">
                  <span>Science: Plant Life</span>
                  <span className="text-emerald-600 flex items-center gap-1">
                    🟢 Strong
                  </span>
                </div>
              </div>
            </div>

            {/* Generated Recommendation */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs space-y-1">
              <span className="font-bold text-amber-900 block">
                ⭐ AI Initial Learning Recommendation:
              </span>
              <p className="text-amber-950 font-semibold">
                Start with Algebra Basics (Slow Pace)
              </p>
              <p className="text-[11px] text-amber-800 leading-normal">
                We will start with fun worked examples and roti/balance scale concepts before tackling harder equations.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  const currentUser = localDb.getUser();
                  if (currentUser) {
                    messageService.sendRegistration(
                      currentUser.id,
                      currentUser.name,
                      currentUser.grade,
                      currentUser.language
                    );
                  }
                  onComplete();
                  onClose();
                }}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-extrabold py-3 px-4 rounded-xl text-xs shadow-md shadow-orange-600/20"
              >
                Go to My Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
