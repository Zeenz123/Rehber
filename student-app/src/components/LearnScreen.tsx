import React, { useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Turtle,
  Mic,
  CheckCircle,
  HelpCircle,
  Sparkles,
  BookOpen,
  ArrowRight,
  Calculator,
  Leaf,
  Layers,
} from 'lucide-react';
import { Lesson, Topic, Subject } from '../types';
import { localDb } from '../services/localDb';
import { voiceService } from '../services/voiceService';
import { getLanguage, t } from '../services/i18n';
import { AdBanner } from './AdBanner';

interface LearnScreenProps {
  initialLessonId?: string;
  onOpenTutorWithPrompt: (prompt: string) => void;
  onStartQuiz: (topicId: string) => void;
}

export const LearnScreen: React.FC<LearnScreenProps> = ({
  initialLessonId,
  onOpenTutorWithPrompt,
  onStartQuiz,
}) => {
  const subjects = localDb.getSubjects();
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('math');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('math-fractions');

  const topics = localDb.getTopics(selectedSubjectId);
  const lessons = localDb.getLessons(selectedTopicId);

  const [activeLesson, setActiveLesson] = useState<Lesson>(
    () => (initialLessonId ? localDb.getLessonById(initialLessonId) : null) || lessons[0]
  );

  // Voice Guidance State
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [speechRate, setSpeechRate] = useState<number>(0.9); // normal child pace
  const currentLang = getLanguage();

  useEffect(() => {
    if (initialLessonId) {
      const found = localDb.getLessonById(initialLessonId);
      if (found) {
        setActiveLesson(found);
        setSelectedSubjectId(found.subjectId);
        setSelectedTopicId(found.topicId);
        setActiveStepIndex(0);
      }
    }
  }, [initialLessonId]);

  // When switching topic, update active lesson
  const handleSelectTopic = (topic: Topic) => {
    setSelectedTopicId(topic.id);
    const topicLessons = localDb.getLessons(topic.id);
    if (topicLessons.length > 0) {
      setActiveLesson(topicLessons[0]);
      setActiveStepIndex(0);
      voiceService.stopSpeaking();
      setIsSpeaking(false);
    }
  };

  // Speak specific step
  const speakStep = (index: number) => {
    if (!activeLesson.steps[index]) return;
    setActiveStepIndex(index);
    const step = activeLesson.steps[index];
    const textToRead = `Step ${step.stepNumber}. ${step.text}. ${step.explanation}`;

    setIsSpeaking(true);
    voiceService.speak(textToRead, currentLang, {
      rate: speechRate,
      onStart: () => setIsSpeaking(true),
      onEnd: () => {
        setIsSpeaking(false);
      },
    });
  };

  // Start whole lesson voice walkthrough
  const startVoiceGuidance = () => {
    speakStep(0);
  };

  const handlePauseVoice = () => {
    voiceService.pauseSpeaking();
    setIsSpeaking(false);
  };

  const handleResumeVoice = () => {
    voiceService.resumeSpeaking();
    setIsSpeaking(true);
  };

  const handleReplayCurrent = () => {
    speakStep(activeStepIndex);
  };

  const handleChangeSpeed = (newRate: number) => {
    setSpeechRate(newRate);
    if (isSpeaking) {
      voiceService.stopSpeaking();
      setTimeout(() => speakStep(activeStepIndex), 100);
    }
  };

  const handleNextStep = () => {
    if (activeStepIndex < activeLesson.steps.length - 1) {
      speakStep(activeStepIndex + 1);
    }
  };

  const profile = localDb.getProfile();
  const mastery = profile.topicMasteries[selectedTopicId];

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Subject Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {subjects.map((s) => (
          <button
            key={s.id}
            onClick={() => {
              setSelectedSubjectId(s.id);
              const top = localDb.getTopics(s.id)[0];
              if (top) handleSelectTopic(top);
            }}
            className={`px-4 py-2 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all flex items-center gap-2 ${
              selectedSubjectId === s.id
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>{s.name}</span>
          </button>
        ))}
      </div>

      {/* 2. Topics in Subject */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {topics.map((t) => {
          const isSelected = selectedTopicId === t.id;
          const topMastery = profile.topicMasteries[t.id];
          return (
            <button
              key={t.id}
              onClick={() => handleSelectTopic(t)}
              className={`p-3 rounded-2xl text-left border transition-all ${
                isSelected
                  ? 'bg-amber-50 border-orange-500 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1">
                <span>Topic {t.order}</span>
                {topMastery && (
                  <span
                    className={
                      topMastery.status === 'strong'
                        ? 'text-emerald-600'
                        : topMastery.status === 'improving'
                        ? 'text-amber-600'
                        : 'text-rose-600'
                    }
                  >
                    {topMastery.masteryPercentage}%
                  </span>
                )}
              </div>
              <h3 className="font-extrabold text-xs text-slate-800 line-clamp-1">
                {t.title}
              </h3>
            </button>
          );
        })}
      </div>

      {/* 3. Personalized Topic Banner (Section 12 specification) */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-3xl p-5 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-100 uppercase tracking-wider mb-1">
            <span>{subjects.find((s) => s.id === selectedSubjectId)?.name}</span>
            <span>•</span>
            <span>Level: {activeLesson.level.toUpperCase()}</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">{activeLesson.title}</h1>
          <p className="text-xs text-amber-100 mt-1 max-w-xl">
            {mastery
              ? `AI Profile: You are at ${mastery.masteryPercentage}% mastery. ${
                  mastery.status === 'needs_practice'
                    ? 'Recommended: Step-by-step slow explanation with worked examples.'
                    : 'Great progress! Review steps and challenge yourself with practice.'
                }`
              : 'AI recommendation: Read through each step and listen with voice.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onStartQuiz(selectedTopicId)}
            className="bg-white text-orange-900 hover:bg-orange-50 font-extrabold px-4 py-2.5 rounded-2xl text-xs flex items-center gap-1.5 shadow-sm transition-transform active:scale-[0.98]"
          >
            <span>📝 Take Quiz</span>
          </button>
          <button
            onClick={() => onOpenTutorWithPrompt(`Explain ${activeLesson.title} with a simple village example.`)}
            className="bg-black/25 hover:bg-black/35 text-white font-bold p-2.5 rounded-2xl transition-colors"
            title="Ask AI Tutor"
          >
            <Mic className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4. Lesson Step-by-Step Voice Guidance Player */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-6">
        {/* Voice Control Header Bar */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-extrabold text-slate-800 block">
                Step-by-Step Voice Guidance
              </span>
              <span className="text-[10px] text-slate-500">
                Listen to the AI tutor explain each concept clearly
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Play / Listen Button */}
            {!isSpeaking ? (
              <button
                onClick={startVoiceGuidance}
                className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-xs"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>{t('listen', 'Listen')}</span>
              </button>
            ) : (
              <button
                onClick={handlePauseVoice}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-xs"
              >
                <Pause className="w-3.5 h-3.5 fill-white" />
                <span>{t('pause', 'Pause')}</span>
              </button>
            )}

            {/* Replay */}
            <button
              onClick={handleReplayCurrent}
              className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs"
              title="Replay Current Step"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Speed Controls: Turtle / Rabbit */}
            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5 text-xs">
              <button
                onClick={() => handleChangeSpeed(0.7)}
                className={`px-2 py-1 rounded-lg flex items-center gap-1 font-bold ${
                  speechRate === 0.7 ? 'bg-orange-100 text-orange-700' : 'text-slate-600'
                }`}
                title="Explain Slowly (0.7x)"
              >
                <Turtle className="w-3 h-3" />
                <span className="text-[10px]">Slow</span>
              </button>
              <button
                onClick={() => handleChangeSpeed(1.0)}
                className={`px-2 py-1 rounded-lg font-bold text-[10px] ${
                  speechRate === 1.0 ? 'bg-orange-100 text-orange-700' : 'text-slate-600'
                }`}
              >
                1.0x
              </button>
              <button
                onClick={() => handleChangeSpeed(1.25)}
                className={`px-2 py-1 rounded-lg flex items-center gap-1 font-bold ${
                  speechRate === 1.25 ? 'bg-orange-100 text-orange-700' : 'text-slate-600'
                }`}
                title="Explain Faster (1.25x)"
              >
                <FastForward className="w-3 h-3" />
                <span className="text-[10px]">Fast</span>
              </button>
            </div>
          </div>
        </div>

        {/* Lesson Overview Description */}
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-1">
            Lesson Summary
          </h2>
          <p className="text-slate-700 text-sm leading-relaxed font-medium">
            {activeLesson.explanation}
          </p>
        </div>

        {/* Numbered Guided Steps */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Interactive Learning Steps (Click step to listen)
          </h3>
          {activeLesson.steps.map((step, idx) => {
            const isActive = activeStepIndex === idx;
            return (
              <div
                key={step.stepNumber}
                onClick={() => speakStep(idx)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-amber-50/70 border-orange-400 shadow-sm ring-2 ring-orange-200/50'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                      isActive
                        ? 'bg-orange-600 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {step.stepNumber}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-sm text-slate-800">
                        {step.text}
                      </h4>
                      {isActive && isSpeaking && (
                        <span className="flex items-center gap-1 text-[10px] text-orange-600 font-bold bg-orange-100 px-2 py-0.5 rounded-full">
                          <Volume2 className="w-3 h-3 animate-pulse" />
                          Speaking...
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {step.explanation}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Worked Examples Section */}
        {activeLesson.workedExamples.length > 0 && (
          <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-emerald-700 font-bold text-xs uppercase tracking-wider">
                💡 Worked Real-World Example
              </span>
            </div>

            {activeLesson.workedExamples.map((ex, i) => (
              <div key={i} className="space-y-2">
                <p className="font-extrabold text-xs text-slate-800">
                  {ex.question}
                </p>
                <div className="bg-white/80 p-3 rounded-xl border border-emerald-100 space-y-1">
                  {ex.stepByStepSolution.map((s, si) => (
                    <p key={si} className="text-xs text-slate-600 font-mono">
                      {s}
                    </p>
                  ))}
                  <div className="pt-2 border-t border-emerald-100 text-xs font-bold text-emerald-800">
                    Result: {ex.result}
                  </div>
                </div>
                <p className="text-[11px] text-emerald-700 italic">
                  🌟 Tip: {ex.tip}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Practice Prompt Buttons */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => onOpenTutorWithPrompt(`Can you give me another example problem for ${activeLesson.title}?`)}
            className="flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:text-orange-700 bg-orange-50 px-3 py-2 rounded-xl"
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Ask AI for Another Example</span>
          </button>

          <button
            onClick={() => onStartQuiz(selectedTopicId)}
            className="bg-orange-600 hover:bg-orange-700 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-sm transition-transform active:scale-[0.98]"
          >
            <span>Start Practice Quiz</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <AdBanner className="mt-6 mb-4" />
    </div>
  );
};


