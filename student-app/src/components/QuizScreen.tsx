import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle,
  XCircle,
  Clock,
  Award,
  Sparkles,
  ArrowRight,
  RotateCcw,
  BookOpen,
  Volume2,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';
import { Question, QuizAttempt } from '../types';
import { localDb } from '../services/localDb';
import { localAiEngine, PerformanceAnalysis } from '../services/localAiEngine';
import { voiceService } from '../services/voiceService';
import { messageService } from '../services/messageService';
import { getLanguage, t } from '../services/i18n';

interface QuizScreenProps {
  topicId?: string;
  onContinueLearning: (lessonId?: string) => void;
  onOpenTutorWithPrompt: (prompt: string) => void;
}

export const QuizScreen: React.FC<QuizScreenProps> = ({
  topicId = 'math-fractions',
  onContinueLearning,
  onOpenTutorWithPrompt,
}) => {
  const [selectedTopicId, setSelectedTopicId] = useState<string>(topicId);
  const topics = localDb.getTopics();
  const currentTopic = topics.find((t) => t.id === selectedTopicId) || topics[0];

  // Fetch 5 questions for this quiz session
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [answersHistory, setAnswersHistory] = useState<
    { questionId: string; studentAnswer: string; isCorrect: boolean }[]
  >([]);

  const [startTime, setStartTime] = useState<number>(Date.now());
  const [quizFinished, setQuizFinished] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<PerformanceAnalysis | null>(null);
  const [smsQuizOutbound, setSmsQuizOutbound] = useState<string | null>(null);
  const [smsQuizReply, setSmsQuizReply] = useState<string | null>(null);

  // Load questions when topic changes
  useEffect(() => {
    loadQuestionsForTopic(selectedTopicId);
  }, [selectedTopicId]);

  const loadQuestionsForTopic = (tid: string) => {
    const qList = localDb.getQuestions(tid, 5);
    setQuestions(qList);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setIsAnswerSubmitted(false);
    setAnswersHistory([]);
    setQuizFinished(false);
    setAnalysisResult(null);
    setStartTime(Date.now());
  };

  const currentQ = questions[currentQuestionIndex];

  const handleSelectOption = (opt: string) => {
    if (isAnswerSubmitted) return;
    setSelectedAnswer(opt);
  };

  const handleSubmitAnswer = () => {
    if (!selectedAnswer || isAnswerSubmitted) return;

    const isCorrect =
      selectedAnswer.trim().toLowerCase() === currentQ.correctAnswer.trim().toLowerCase();

    setIsAnswerSubmitted(true);

    const newHistory = [
      ...answersHistory,
      {
        questionId: currentQ.id,
        studentAnswer: selectedAnswer,
        isCorrect,
      },
    ];
    setAnswersHistory(newHistory);

    // Audio voice feedback
    const lang = getLanguage();
    if (isCorrect) {
      voiceService.speak('Great job! That is correct.', lang);
    } else {
      voiceService.speak("Let's understand why.", lang);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setIsAnswerSubmitted(false);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    const timeSpentSeconds = Math.max(15, Math.round((Date.now() - startTime) / 1000));
    const correctCount = answersHistory.filter((a) => a.isCorrect).length;
    const score = Math.round((correctCount / questions.length) * 100);

    const attempt: QuizAttempt = {
      id: 'quiz-' + Date.now(),
      studentId: localDb.getUser()?.id || 'student-rahul-01',
      topicId: selectedTopicId,
      subjectId: currentTopic.subjectId,
      score,
      totalQuestions: questions.length,
      correctCount,
      timeSpentSeconds,
      timestamp: new Date().toISOString(),
      answers: answersHistory,
      synced: false,
    };

    localDb.saveQuizAttempt(attempt);

    // Analyze performance with on-device AI Engine
    const analysis = localAiEngine.analyzeQuizPerformance(attempt, questions);
    setAnalysisResult(analysis);
    setQuizFinished(true);

    // Also serialize to cellular SMS protocol [StudentID]#QZ#[QuizID]|[Answers]
    const studentId = localDb.getUser()?.id || 'STU101';
    const ansMap: Record<string, string> = {};
    answersHistory.forEach((a, i) => {
      ansMap[`Q${i + 1}`] = a.studentAnswer.slice(0, 1).toUpperCase();
    });
    const ansStr = Object.entries(ansMap).map(([k, v]) => `${k}:${v}`).join(',');
    const serializedPayload = `${studentId}#QZ#${selectedTopicId}|${ansStr}`;
    setSmsQuizOutbound(serializedPayload);

    messageService.sendQuizSubmission(studentId, selectedTopicId, ansMap).then((res) => {
      setSmsQuizReply(res.resultText);
    });

    if (score >= 70) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // ignore
      }
    }
  };

  // If no questions found
  if (questions.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-8 text-center border border-slate-200">
        <h3 className="font-extrabold text-base text-slate-800">
          No questions available for this topic.
        </h3>
        <button
          onClick={() => loadQuestionsForTopic('math-fractions')}
          className="mt-4 bg-orange-600 text-white font-bold px-4 py-2 rounded-xl text-xs"
        >
          Load Fractions Quiz
        </button>
      </div>
    );
  }

  // --- RESULTS SCREEN ---
  if (quizFinished && analysisResult) {
    const isPassing = analysisResult.score >= 60;

    return (
      <div className="space-y-6 pb-12 max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm text-center space-y-4">
          <div className="inline-flex p-3 rounded-full bg-orange-100 text-orange-600 mb-1">
            <Award className="w-8 h-8" />
          </div>

          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
              {analysisResult.score >= 75
                ? 'Outstanding Mastery! 🎉'
                : analysisResult.score >= 50
                ? 'Good Effort! 👏'
                : "Let's Practice Again 💡"}
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              {analysisResult.feedbackMessage}
            </p>
          </div>

          {/* Score Cards Grid */}
          <div className="grid grid-cols-3 gap-3 py-3 border-y border-slate-100">
            <div className="bg-slate-50 p-3 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {t('score', 'Score')}
              </span>
              <span
                className={`text-2xl font-black ${
                  analysisResult.score >= 70
                    ? 'text-emerald-600'
                    : analysisResult.score >= 50
                    ? 'text-amber-600'
                    : 'text-rose-600'
                }`}
              >
                {analysisResult.score}%
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {t('accuracy', 'Accuracy')}
              </span>
              <span className="text-2xl font-black text-slate-800">
                {answersHistory.filter((a) => a.isCorrect).length}/{questions.length}
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Learning Pace
              </span>
              <span className="text-sm font-extrabold text-orange-600 block mt-1">
                {analysisResult.adaptedSpeed === 'slow'
                  ? '🐢 Slow Mode'
                  : analysisResult.adaptedSpeed === 'fast'
                  ? '⚡ Fast'
                  : 'Normal'}
              </span>
            </div>
          </div>

          {/* AI On-Device Adaptation Report */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 text-left space-y-2">
            <div className="flex items-center gap-1.5 text-amber-900 font-extrabold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>On-Device AI Adaptation</span>
            </div>

            <p className="text-xs text-amber-950 font-medium leading-relaxed">
              ⭐ {analysisResult.recommendation.title}
            </p>
            <p className="text-[11px] text-amber-800 leading-normal">
              {analysisResult.recommendation.reason}
            </p>

            {analysisResult.identifiedGaps.length > 0 && (
              <div className="pt-2 border-t border-amber-200/60">
                <span className="text-[11px] font-bold text-rose-800 block mb-1">
                  Identified Gaps to Strengthen:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {analysisResult.identifiedGaps.map((gap, i) => (
                    <span
                      key={i}
                      className="bg-white/90 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-rose-200"
                    >
                      • {gap.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Cellular SMS Protocol Serialization Badge */}
            {smsQuizOutbound && (
              <div className="pt-2.5 border-t border-amber-200/60 font-mono text-[10px] space-y-1">
                <div className="flex items-center justify-between text-purple-900 font-bold uppercase tracking-wider">
                  <span>📶 Cellular SMS Sync Protocol ([ID]#[Code]#[Data])</span>
                  <span>{smsQuizOutbound.length} chars</span>
                </div>
                <div className="bg-white/90 p-2 rounded-xl border border-purple-200 text-purple-950 break-all select-all font-semibold">
                  {smsQuizOutbound}
                </div>
                {smsQuizReply && (
                  <div className="text-emerald-800 flex items-center gap-1 font-semibold pt-0.5">
                    <span>← Gateway Reply:</span>
                    <span className="bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-bold">
                      {smsQuizReply}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              onClick={() => onContinueLearning(analysisResult.recommendation.lessonId)}
              className="w-full sm:flex-1 bg-orange-600 hover:bg-orange-700 text-white font-extrabold py-3 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md shadow-orange-600/20 transition-transform active:scale-[0.98]"
            >
              <span>{analysisResult.recommendation.actionText}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => loadQuestionsForTopic(selectedTopicId)}
              className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-2xl text-xs flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retake Quiz</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- ACTIVE QUIZ QUESTION SCREEN ---
  return (
    <div className="space-y-6 pb-12 max-w-2xl mx-auto">
      {/* Quiz Header & Topic Switcher */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
            {currentTopic.title}
          </span>
          <h2 className="text-lg font-black text-slate-800 mt-1">
            Question {currentQuestionIndex + 1} of {questions.length}
          </h2>
        </div>

        <select
          value={selectedTopicId}
          onChange={(e) => setSelectedTopicId(e.target.value)}
          className="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-2.5 py-1.5 focus:outline-none"
        >
          {topics.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
        <div
          className="bg-orange-600 h-full rounded-full transition-all duration-300"
          style={{
            width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
          }}
        ></div>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-6">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Difficulty: {currentQ.difficulty.toUpperCase()}
          </span>
          <h3 className="text-base sm:text-lg font-extrabold text-slate-800 leading-snug mt-1">
            {currentQ.text}
          </h3>
        </div>

        {/* Options */}
        <div className="space-y-2.5">
          {currentQ.options?.map((opt, i) => {
            const isSelected = selectedAnswer === opt;
            const isCorrectAnswer =
              opt.trim().toLowerCase() === currentQ.correctAnswer.trim().toLowerCase();

            let optionStyle =
              'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700';

            if (isSelected && !isAnswerSubmitted) {
              optionStyle = 'bg-orange-50 border-orange-500 text-orange-950 font-bold';
            }

            if (isAnswerSubmitted) {
              if (isCorrectAnswer) {
                optionStyle = 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold';
              } else if (isSelected && !isCorrectAnswer) {
                optionStyle = 'bg-rose-50 border-rose-500 text-rose-950 font-bold';
              } else {
                optionStyle = 'bg-slate-50/50 border-slate-100 text-slate-400';
              }
            }

            return (
              <button
                key={i}
                onClick={() => handleSelectOption(opt)}
                disabled={isAnswerSubmitted}
                className={`w-full p-4 rounded-2xl border text-left text-xs sm:text-sm transition-all flex items-center justify-between ${optionStyle}`}
              >
                <span>{opt}</span>
                {isAnswerSubmitted && isCorrectAnswer && (
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                )}
                {isAnswerSubmitted && isSelected && !isCorrectAnswer && (
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Feedback Explanation Box */}
        {isAnswerSubmitted && (
          <div
            className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
              selectedAnswer?.trim().toLowerCase() === currentQ.correctAnswer.trim().toLowerCase()
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                : 'bg-amber-50/70 border-amber-200 text-amber-950'
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold">
              <Lightbulb className="w-4 h-4 text-amber-600" />
              <span>
                {selectedAnswer?.trim().toLowerCase() === currentQ.correctAnswer.trim().toLowerCase()
                  ? t('greatJob', 'Great! 🎉')
                  : t('letsUnderstandWhy', "Let's understand why 💡")}
              </span>
            </div>
            <p className="leading-relaxed font-medium">{currentQ.explanation}</p>
          </div>
        )}

        {/* Submit / Next Button */}
        <div className="pt-2 flex items-center justify-between gap-3">
          <button
            onClick={() => onOpenTutorWithPrompt(`Explain this question: "${currentQ.text}"`)}
            className="text-xs font-bold text-slate-500 hover:text-slate-700 flex items-center gap-1"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Ask Tutor</span>
          </button>

          {!isAnswerSubmitted ? (
            <button
              onClick={handleSubmitAnswer}
              disabled={!selectedAnswer}
              className={`font-extrabold px-6 py-2.5 rounded-xl text-xs transition-all ${
                selectedAnswer
                  ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-md shadow-orange-600/20 active:scale-[0.98]'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              {t('submit', 'Submit Answer')}
            </button>
          ) : (
            <button
              onClick={handleNextQuestion}
              className="bg-orange-600 hover:bg-orange-700 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-orange-600/20 transition-transform active:scale-[0.98]"
            >
              <span>{t('nextQuestion', 'Next Question')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
