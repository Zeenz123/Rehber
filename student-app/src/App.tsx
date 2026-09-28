/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { SlowNetIndicator } from './components/SlowNetIndicator';
import { StudentNav } from './components/StudentNav';

import { HomeScreen } from './components/HomeScreen';
import { LearnScreen } from './components/LearnScreen';
import { QuizScreen } from './components/QuizScreen';
import { AiTutorScreen } from './components/AiTutorScreen';
import { ProgressScreen } from './components/ProgressScreen';
import { HubSyncScreen } from './components/HubSyncScreen';
import { TeacherDashboard } from './components/TeacherDashboard';
import { DiagnosticModal } from './components/DiagnosticModal';
import { GuidedDemoModal } from './components/GuidedDemoModal';
import { syncService } from './services/syncService';
import { localDb } from './services/localDb';
import { NetworkStatus } from './types';
import { initLanguage } from './services/i18n';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>('online');
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);

  // Tablet frame toggle
  const [isTabletFrame, setIsTabletFrame] = useState<boolean>(false);

  // Modals
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState<boolean>(false);
  const [isDemoOpen, setIsDemoOpen] = useState<boolean>(false);

  // Cross-screen contextual parameters
  const [activeLessonId, setActiveLessonId] = useState<string | undefined>('lesson-frac-1');
  const [activeQuizTopicId, setActiveQuizTopicId] = useState<string>('math-fractions');
  const [tutorInitialPrompt, setTutorInitialPrompt] = useState<string>('');

  // Re-render trigger when language changes
  const [, setLangTick] = useState<number>(0);

  useEffect(() => {
    initLanguage();

    const unsubscribe = syncService.subscribe((status, pending) => {
      setNetworkStatus(status);
      setPendingSyncCount(pending);
    });

    const handleLangChange = () => {
      setLangTick((prev) => prev + 1);
    };

    const handleClassChange = () => {
      setLangTick((prev) => prev + 1);
    };

    window.addEventListener('languageChanged', handleLangChange);
    window.addEventListener('classChanged', handleClassChange);

    return () => {
      unsubscribe();
      window.removeEventListener('languageChanged', handleLangChange);
      window.removeEventListener('classChanged', handleClassChange);
    };
  }, []);

  const handleStartLesson = (lessonId?: string) => {
    if (lessonId) setActiveLessonId(lessonId);
    setCurrentTab('learn');
  };

  const handleStartQuiz = (topicId?: string) => {
    if (topicId) setActiveQuizTopicId(topicId);
    setCurrentTab('practice');
  };

  const handleOpenTutorWithPrompt = (prompt: string) => {
    setTutorInitialPrompt(prompt);
    setCurrentTab('tutor');
  };

  const handleSyncNow = async () => {
    await syncService.syncNow();
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 selection:bg-orange-500 selection:text-white">
      {/* Tablet Frame Container Wrapper */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isTabletFrame
            ? 'max-w-4xl mx-auto my-4 bg-white rounded-[40px] shadow-2xl border-[14px] border-slate-900 overflow-hidden ring-1 ring-slate-800'
            : 'w-full'
        }`}
      >
        {/* Tablet camera bezel notch when in tablet frame mode */}
        {isTabletFrame && (
          <div className="bg-slate-900 h-4 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
          </div>
        )}

        {/* Global Navigation Header */}
        <Navbar
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          networkStatus={networkStatus}
          pendingSyncCount={pendingSyncCount}
          onOpenDemo={() => setIsDemoOpen(true)}
          onOpenDiagnostic={() => setIsDiagnosticOpen(true)}
          isTabletFrame={isTabletFrame}
          onToggleTabletFrame={() => setIsTabletFrame(!isTabletFrame)}
          onSync={handleSyncNow}
        />

        {/* Slow Net & 2G Telemetry Banner */}
        <SlowNetIndicator />

        {/* Main Content Area */}

        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
          {currentTab === 'home' && (
            <HomeScreen
              onStartLesson={handleStartLesson}
              onStartQuiz={handleStartQuiz}
              onOpenTutor={() => setCurrentTab('tutor')}
              onOpenDiagnostic={() => setIsDiagnosticOpen(true)}
              onOpenHub={() => setCurrentTab('hub')}
              networkStatus={networkStatus}
            />
          )}

          {currentTab === 'learn' && (
            <LearnScreen
              initialLessonId={activeLessonId}
              onOpenTutorWithPrompt={handleOpenTutorWithPrompt}
              onStartQuiz={handleStartQuiz}
            />
          )}

          {currentTab === 'practice' && (
            <QuizScreen
              topicId={activeQuizTopicId}
              onContinueLearning={handleStartLesson}
              onOpenTutorWithPrompt={handleOpenTutorWithPrompt}
            />
          )}

          {currentTab === 'tutor' && (
            <AiTutorScreen
              initialPrompt={tutorInitialPrompt}
              onClearInitialPrompt={() => setTutorInitialPrompt('')}
              networkStatus={networkStatus}
              onNavigateToLesson={handleStartLesson}
              onNavigateToQuiz={handleStartQuiz}
            />
          )}

          {currentTab === 'progress' && (
            <ProgressScreen
              onStartQuiz={handleStartQuiz}
              onOpenDiagnostic={() => setIsDiagnosticOpen(true)}
            />
          )}

          {currentTab === 'hub' && (
            <HubSyncScreen
              networkStatus={networkStatus}
              onSync={handleSyncNow}
            />
          )}

          {currentTab === 'teacher' && <TeacherDashboard />}
        </main>

        {/* Student Bottom Navigation (visible unless in teacher view) */}
        {currentTab !== 'teacher' && (
          <div className="sticky bottom-0 z-20">
            <StudentNav
              currentTab={currentTab}
              onTabChange={setCurrentTab}
              pendingSyncCount={pendingSyncCount}
            />
          </div>
        )}
      </div>

      {/* Diagnostic Onboarding Modal */}
      <DiagnosticModal
        isOpen={isDiagnosticOpen}
        onClose={() => setIsDiagnosticOpen(false)}
        onComplete={() => {
          setCurrentTab('home');
        }}
      />

      {/* 13-Step Guided Hackathon Demo Modal */}
      <GuidedDemoModal
        isOpen={isDemoOpen}
        onClose={() => setIsDemoOpen(false)}
        onNavigateTab={setCurrentTab}
        onOpenLesson={handleStartLesson}
        onOpenQuiz={handleStartQuiz}
        onOpenTutor={handleOpenTutorWithPrompt}
        onOpenDiagnostic={() => setIsDiagnosticOpen(true)}
      />
    </div>
  );
}
