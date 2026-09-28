import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  Bot,
  Sparkles,
  RotateCcw,
  Turtle,
  CheckCircle,
  HelpCircle,
  Layers,
  Zap,
  BookOpen,
  Wheat,
  ListOrdered,
  HelpCircle as QuizIcon,
  Trash2,
  Check,
  X,
  Download,
  Loader,
  ArrowRight,
} from 'lucide-react';
import {
  ChatMessage,
  NetworkStatus,
  TutorMode,
  TransportType,
  User,
  LearnerProfile,
  TopicMastery,
} from '../types';
import { localDb } from '../services/localDb';
import { aiService } from '../services/aiService';
import { voiceService } from '../services/voiceService';
import { slowNetService } from '../services/slowNetService';
import { getLanguage, SUPPORTED_LANGUAGES, t } from '../services/i18n';

interface AiTutorScreenProps {
  initialPrompt?: string;
  onClearInitialPrompt?: () => void;
  networkStatus: NetworkStatus;
  onNavigateToLesson: (lessonId: string) => void;
  onNavigateToQuiz: (topicId: string) => void;
}

export const AiTutorScreen: React.FC<AiTutorScreenProps> = ({
  initialPrompt,
  onClearInitialPrompt,
  networkStatus,
  onNavigateToLesson,
  onNavigateToQuiz,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    localDb.getChatHistory()
  );
  const [inputText, setInputText] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSmsFallback, setIsSmsFallback] = useState<boolean>(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [speechRate, setSpeechRate] = useState<number>(0.9);
  const [tutorMode, setTutorMode] = useState<TutorMode>('explain');
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, { option: string; isCorrect: boolean }>>({});
  const [showVoskPrompt, setShowVoskPrompt] = useState<boolean>(false);
  const [voskStatus, setVoskStatus] = useState(voiceService.getEngineStatus());
  const lastProcessedPromptRef = useRef<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [profile, setProfile] = useState<LearnerProfile>(localDb.getProfile());
  const [user, setUser] = useState<User | null>(localDb.getUser());
  const currentLang = getLanguage();
  const currentLangName = SUPPORTED_LANGUAGES.find((l) => l.code === currentLang)?.nativeName || 'English';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
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

  useEffect(() => {
    const unsubVoice = voiceService.onEngineStatusChange((status) => {
      setVoskStatus(status);
    });
    return () => unsubVoice();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isProcessing]);

  useEffect(() => {
    if (initialPrompt && initialPrompt !== lastProcessedPromptRef.current) {
      lastProcessedPromptRef.current = initialPrompt;
      handleSendMessage(initialPrompt);
      if (onClearInitialPrompt) {
        onClearInitialPrompt();
      }
    }
  }, [initialPrompt]);

  const generateUniqueId = (prefix: string) => {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  };

  const handleSendMessage = async (textToSend: string, modeOverride?: TutorMode, msgIdToRetry?: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isProcessing) return;

    setInputText('');
    setSpeechError(null);
    setIsSmsFallback(false);

    const activeMode = modeOverride || tutorMode;

    const activeTransport: TransportType =
      networkStatus === 'message_fallback'
        ? 'SMS_FALLBACK'
        : networkStatus === 'low_bandwidth'
        ? 'LOW_BW_COMPACT'
        : networkStatus === 'offline'
        ? 'LOCAL_RULES'
        : 'ONLINE_HTTPS';

    const studentId = user?.id || 'STU101';
    const rawSmsPreview = networkStatus === 'message_fallback'
      ? `${studentId}#ASK#${trimmed}`
      : undefined;

    // 1. Add student message with robust unique id and transport
    const msgId = msgIdToRetry || generateUniqueId('msg-student');
    if (!msgIdToRetry) {
      const userMsg: ChatMessage = {
        id: msgId,
        sender: 'student',
        text: trimmed,
        timestamp: new Date().toISOString(),
        provider: 'local_engine',
        mode: activeMode,
        transport: activeTransport,
        rawSmsPayload: rawSmsPreview,
        charCount: rawSmsPreview?.length,
        status: networkStatus === 'low_bandwidth' ? 'sending' : 'sent',
      };
      localDb.addChatMessage(userMsg);
    } else {
      // Update existing message to sending
      const updatedMessages = localDb.getChatHistory().map(m => 
        m.id === msgId ? { ...m, status: 'sending' as const } : m
      );
      // We would ideally save it back, but let's just update local state if possible, 
      // or directly update in localDb if it has update method. For now, since localDb
      // might not have updateChatMessage, we rely on setMessages.
    }
    
    setMessages(localDb.getChatHistory().map(m => 
      m.id === msgId ? { ...m, status: 'sending' as const } : m
    ));
    setIsProcessing(true);

    try {
      // 2. Call Advanced AI Service (Passes history, mode, language, grade, networkStatus)
      let aiResponse;
      
      const fetchTutor = async () => aiService.askTutor(
        trimmed,
        profile,
        networkStatus,
        activeMode,
        messages
      );

      if (networkStatus === 'low_bandwidth') {
        try {
          aiResponse = await slowNetService.executeWithSlowNetBudget(
            (signal) => fetchTutor(),
            4500
          );
        } catch (error: any) {
          if (error.name === 'SlowNetTimeoutError' || error.message?.includes('Slow Net')) {
             // Fallback to SMS
             setIsSmsFallback(true);
             
             // Update user message to queued for retry
             setMessages(prev => prev.map(m => 
                m.id === msgId ? { ...m, status: 'queued' as const } : m
             ));
             
             // In a real app we might trigger actual SMS here, but for UI:
             // Simulate SMS delay
             await new Promise(r => setTimeout(r, 2000));
             
             // We can retrieve from askTutor with 'message_fallback' status
             aiResponse = await aiService.askTutor(
               trimmed,
               profile,
               'message_fallback',
               activeMode,
               messages
             );
          } else {
             throw error;
          }
        }
      } else {
        aiResponse = await fetchTutor();
      }

      // Update user message to sent
      setMessages(prev => prev.map(m => 
        m.id === msgId ? { ...m, status: 'sent' as const } : m
      ));

      // 3. Add AI message with rich pedagogical attributes
      const botMsg: ChatMessage = {
        id: generateUniqueId('msg-bot'),
        sender: 'ai',
        text: aiResponse.text,
        timestamp: new Date().toISOString(),
        provider: aiResponse.provider,
        mode: aiResponse.mode,
        transport: aiResponse.transport || activeTransport,
        rawSmsPayload: aiResponse.rawSmsPayload,
        smsReplyPayload: aiResponse.smsReplyPayload,
        charCount: aiResponse.charCount,
        suggestedAction: aiResponse.suggestedAction,
        followUps: aiResponse.followUps,
        practiceQuestion: aiResponse.practiceQuestion,
      };

      localDb.addChatMessage(botMsg);
      setMessages(localDb.getChatHistory());

      // Read aloud automatically
      playTts(botMsg.id, botMsg.text);
    } catch (e) {
      console.warn('AI Tutor error', e);
      setMessages(prev => prev.map(m => 
        m.id === msgId ? { ...m, status: 'failed' as const } : m
      ));
    } finally {
      setIsProcessing(false);
      setIsSmsFallback(false);
    }
  };

  const playTts = (msgId: string, text: string) => {
    if (speakingMessageId === msgId) {
      voiceService.stopSpeaking();
      setSpeakingMessageId(null);
      return;
    }

    setSpeakingMessageId(msgId);
    voiceService.speak(text, currentLang, {
      rate: speechRate,
      onStart: () => setSpeakingMessageId(msgId),
      onEnd: () => setSpeakingMessageId(null),
    });
  };

  // Microphone Voice Input
  const toggleListening = () => {
    if (isListening) {
      voiceService.stopListening();
      setIsListening(false);
      return;
    }

    if (voiceService.showPermissionPrompt()) {
      setShowVoskPrompt(true);
      return;
    }

    setSpeechError(null);
    setIsListening(true);

    const started = voiceService.startListening(
      currentLang,
      (transcript) => {
        setInputText(transcript);
      },
      (errorMsg) => {
        setSpeechError(errorMsg);
        setIsListening(false);
      },
      () => {
        setIsListening(false);
      }
    );

    if (!started) {
      setIsListening(false);
    }
  };

  const handleSelectPracticeOption = (msgId: string, option: string, correctAnswer: string) => {
    const isCorrect = option.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
    setSelectedAnswers((prev) => ({
      ...prev,
      [msgId]: { option, isCorrect },
    }));

    if (isCorrect) {
      profile.xpPoints += 15;
      localDb.setProfile(profile);
    }
  };

  const handleClearHistory = () => {
    if (confirm('Start a fresh conversation with your AI Tutor?')) {
      voiceService.stopSpeaking();
      setSpeakingMessageId(null);
      const welcomeMsg: ChatMessage = {
        id: generateUniqueId('msg-welcome'),
        sender: 'ai',
        text: `Hello! I am your RuralLearn AI tutor. I am here to help you master Mathematics, Science, and English for Class ${user?.grade || 7}!\n\nPick a topic or teaching style below, or ask me any question.`,
        timestamp: new Date().toISOString(),
        provider: 'local_engine',
        followUps: [
          'What is a fraction?',
          'Explain photosynthesis simply',
          'Give me an algebra problem',
          'Explain simple machines',
        ],
      };
      localStorage.setItem('rurallearn_chat_history', JSON.stringify([welcomeMsg]));
      setMessages([welcomeMsg]);
      setSelectedAnswers({});
    }
  };

  // Get dynamic follow-up suggestions from the last AI message, or fallback
  const lastAiMessage = [...messages].reverse().find((m) => m.sender === 'ai');
  const activeFollowUps =
    lastAiMessage?.followUps && lastAiMessage.followUps.length > 0
      ? lastAiMessage.followUps
      : [
          'What is a fraction?',
          'Explain photosynthesis simply',
          'Give me an algebra problem',
          'Explain like a village analogy 🌾',
        ];

  const weakTopics = Object.values(profile.topicMasteries as Record<string, TopicMastery>)
    .filter((m) => m.status === 'needs_practice')
    .map((m) => m.topicTitle);

  const modeOptions: { id: TutorMode; label: string; icon: any; desc: string }[] = [
    { id: 'explain', label: 'Explain', icon: Sparkles, desc: 'Direct answer & conceptual explanation' },
    { id: 'step_by_step', label: 'Step-by-Step', icon: ListOrdered, desc: 'Exact answer & numbered breakdown' },
    { id: 'quiz_me', label: 'Quiz Me', icon: QuizIcon, desc: 'Exact answer & practice problem' },
    { id: 'rural_analogy', label: 'Village Analogy', icon: Wheat, desc: 'Exact answer & farming analogies' },
    { id: 'quick_summary', label: 'Summary', icon: Zap, desc: 'Exact answer & key rules' },
  ];

  const renderFormattedText = (rawText: string, isStudent: boolean) => {
    if (isStudent) {
      return <div className="whitespace-pre-line font-medium">{rawText}</div>;
    }

    return (
      <div className="space-y-2.5 font-normal">
        {rawText.split('\n\n').map((paragraph, pIdx) => {
          const isAnswerBlock =
            paragraph.toLowerCase().startsWith('**answer:') ||
            paragraph.toLowerCase().startsWith('answer:') ||
            paragraph.includes('**Answer:');

          return (
            <div
              key={pIdx}
              className={
                isAnswerBlock
                  ? 'p-3 bg-gradient-to-r from-amber-50 to-orange-50/80 border border-amber-300 rounded-2xl text-amber-950 font-bold shadow-xs'
                  : 'leading-relaxed text-slate-800'
              }
            >
              {paragraph.split('\n').map((line, lIdx) => {
                const parts = line.split(/(\*\*.*?\*\*|`.*?`)/g);
                return (
                  <div
                    key={lIdx}
                    className={line.trim().startsWith('•') || line.trim().match(/^\d+\./) ? 'ml-2 my-0.5' : ''}
                  >
                    {parts.map((part, partIdx) => {
                      if (part.startsWith('**') && part.endsWith('**')) {
                        return (
                          <strong key={partIdx} className="font-extrabold text-slate-950">
                            {part.slice(2, -2)}
                          </strong>
                        );
                      }
                      if (part.startsWith('`') && part.endsWith('`')) {
                        return (
                          <code
                            key={partIdx}
                            className="bg-amber-100/70 text-orange-800 px-1.5 py-0.5 rounded font-mono text-[11px] font-bold"
                          >
                            {part.slice(1, -1)}
                          </code>
                        );
                      }
                      return part;
                    })}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-3 pb-8 max-w-3xl mx-auto flex flex-col h-[calc(100vh-190px)] min-h-[520px]">
      {/* 1. Header Card with Student Personalization Context & Teaching Modes */}
      <div className="bg-white rounded-3xl p-3 sm:p-4 border border-slate-200/90 shadow-sm flex flex-col gap-3 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center font-bold text-xl shadow-sm shadow-orange-500/20">
              🤖
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-slate-800 tracking-tight">
                  REHBER AI Tutor
                </h1>
                <span className="text-[10px] bg-orange-100 text-orange-800 font-bold px-2 py-0.5 rounded-full uppercase">
                  Class {user?.grade || 7}
                </span>
                <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                  {currentLangName}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                <span>Pace:</span>
                <strong className="text-slate-700">
                  {profile.currentSpeed === 'slow' ? '🐢 Gentle / Slow' : 'Standard'}
                </strong>
                <span>•</span>
                <span className="font-semibold">
                  {networkStatus === 'online' && '⚡ Gemini 3.8 Flash Hybrid'}
                  {networkStatus === 'low_bandwidth' && '📶 Low-Bandwidth 2G (<500B)'}
                  {networkStatus === 'offline' && '🌱 On-Device Offline AI (0 Bytes)'}
                  {networkStatus === 'message_fallback' && '💬 Cellular SMS Protocol ([ID]#[Code]#[Data])'}
                </span>
              </p>
            </div>
          </div>

          {/* Speed toggle, Clear, & Speech controls */}
          <div className="flex items-center gap-1.5 ml-auto">
            {/* Speed Rate Switcher */}
            <button
              onClick={() => {
                const next = speechRate === 0.7 ? 1.0 : speechRate === 1.0 ? 1.2 : 0.7;
                setSpeechRate(next);
              }}
              className={`px-2 py-1 rounded-xl text-[11px] font-bold border transition-colors flex items-center gap-1 ${
                speechRate === 0.7
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
              }`}
              title="Adjust text-to-speech audio rate"
            >
              <Turtle className="w-3 h-3" />
              <span>{speechRate}x</span>
            </button>

            {/* Clear Chat Button */}
            <button
              onClick={handleClearHistory}
              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Reset conversation"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Teaching Mode Selector Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none pt-1 border-t border-slate-100">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            Mode:
          </span>
          {modeOptions.map((m) => {
            const Icon = m.icon;
            const isSelected = tutorMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setTutorMode(m.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  isSelected
                    ? 'bg-orange-600 text-white shadow-xs scale-[1.02]'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-800'
                }`}
                title={m.desc}
              >
                <Icon className="w-3 h-3" />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Weak Topic Awareness Banner if any */}
      {weakTopics.length > 0 && (
        <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl px-3 py-1.5 text-xs text-amber-900 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="text-[11px]">
              Tutor is reinforcing support on:{' '}
              <strong className="text-amber-950">{weakTopics.join(', ')}</strong>
            </span>
          </div>
          <button
            onClick={() => handleSendMessage(`Help me practice ${weakTopics[0]} step-by-step`, 'step_by_step')}
            className="text-[10px] font-bold text-orange-700 bg-white border border-amber-200 hover:bg-orange-50 px-2 py-0.5 rounded-lg shrink-0"
          >
            Practice {weakTopics[0]}
          </button>
        </div>
      )}

      {/* 2. Messages Chat Feed */}
      <div className="flex-1 overflow-y-auto space-y-3.5 p-2 scrollbar-thin">
        {messages.map((msg, idx) => {
          const isStudent = msg.sender === 'student';
          const isTtsActive = speakingMessageId === msg.id;
          const uniqueKey = msg.id ? `${msg.id}-${idx}` : `msg-${idx}`;
          const currentAnswer = selectedAnswers[msg.id];

          return (
            <div
              key={uniqueKey}
              className={`flex items-start gap-2.5 ${
                isStudent ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-2xl flex items-center justify-center shrink-0 text-sm shadow-xs ${
                  isStudent
                    ? 'bg-orange-600 text-white'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {isStudent ? (user?.avatar || '👦🏽') : <Bot className="w-4 h-4 text-orange-600" />}
              </div>

              <div
                className={`max-w-[85%] rounded-3xl p-4 text-xs sm:text-sm leading-relaxed shadow-xs ${
                  isStudent
                    ? 'bg-orange-600 text-white rounded-tr-xs'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs'
                }`}
              >
                {/* AI / Student Text Body */}
                {renderFormattedText(msg.text, isStudent)}

                {/* Network Status Indicators for Student Messages */}
                {isStudent && msg.status === 'sending' && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-orange-200 font-medium">
                    <Loader className="w-3 h-3 animate-spin" />
                    <span>Sending via 2G...</span>
                  </div>
                )}
                {isStudent && msg.status === 'queued' && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-orange-200 font-medium">
                    <RotateCcw className="w-3 h-3 animate-reverse-spin" />
                    <span>Queued for retry</span>
                  </div>
                )}
                {isStudent && msg.status === 'failed' && (
                  <div className="mt-1.5 flex items-center justify-between text-[10px] text-rose-100 font-medium bg-rose-500/20 p-1.5 rounded-lg border border-rose-500/30">
                    <span>Message timeout</span>
                    <button onClick={() => handleSendMessage(msg.text, msg.mode, msg.id)} className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-md hover:bg-white/30 transition-colors text-white">
                      <RotateCcw className="w-3 h-3" /> Retry
                    </button>
                  </div>
                )}

                {/* Raw Cellular SMS Message Payload Card if available */}
                {msg.rawSmsPayload && (
                  <div className={`mt-2.5 p-2.5 rounded-2xl font-mono text-[11px] space-y-1.5 ${
                    isStudent ? 'bg-orange-700/80 text-orange-50 border border-orange-400/40' : 'bg-purple-50/90 text-purple-900 border border-purple-200'
                  }`}>
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider opacity-85">
                      <span className="flex items-center gap-1.5">
                        <span>💬 Cellular SMS Protocol</span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] ${isStudent ? 'bg-orange-800' : 'bg-purple-200 text-purple-800'}`}>
                          Standard [ID]#[Action]#[Data]
                        </span>
                      </span>
                      <span>{msg.charCount || msg.rawSmsPayload.length} chars</span>
                    </div>
                    <div className={`p-1.5 rounded-lg break-all select-all font-semibold ${
                      isStudent ? 'bg-orange-800/60' : 'bg-white border border-purple-100'
                    }`}>
                      {msg.rawSmsPayload}
                    </div>
                    {msg.smsReplyPayload && (
                      <div className="text-[10px] opacity-90 flex items-center gap-1 pt-0.5">
                        <span>← Gateway Reply:</span>
                        <span className="bg-white/80 px-1.5 py-0.5 rounded text-purple-950 font-bold border border-purple-100 break-all select-all">
                          {msg.smsReplyPayload}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Interactive Practice Question Card */}
                {msg.practiceQuestion && (
                  <div className="mt-3 p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                      <span>🎯</span>
                      <span>{msg.practiceQuestion.question}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {msg.practiceQuestion.options.map((opt, optIdx) => {
                        const isChosen = currentAnswer?.option === opt;
                        const isCorrectOption = opt.trim().toLowerCase() === msg.practiceQuestion!.correctAnswer.trim().toLowerCase();
                        let btnStyle = 'bg-white hover:bg-amber-100/60 border-slate-200 text-slate-800';

                        if (currentAnswer) {
                          if (isCorrectOption) {
                            btnStyle = 'bg-emerald-100 border-emerald-400 text-emerald-900 font-bold';
                          } else if (isChosen && !currentAnswer.isCorrect) {
                            btnStyle = 'bg-rose-100 border-rose-400 text-rose-900';
                          }
                        }

                        return (
                          <button
                            key={optIdx}
                            disabled={!!currentAnswer}
                            onClick={() =>
                              handleSelectPracticeOption(msg.id, opt, msg.practiceQuestion!.correctAnswer)
                            }
                            className={`text-left px-2.5 py-1.5 rounded-xl border text-xs transition-colors flex items-center justify-between gap-2 ${btnStyle}`}
                          >
                            <span>{opt}</span>
                            {currentAnswer && isCorrectOption && (
                              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            )}
                            {currentAnswer && isChosen && !currentAnswer.isCorrect && (
                              <X className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Feedback on answer */}
                    {currentAnswer && (
                      <div
                        className={`p-2 rounded-xl text-xs font-medium ${
                          currentAnswer.isCorrect
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}
                      >
                        <div className="font-bold flex items-center gap-1">
                          {currentAnswer.isCorrect ? (
                            <>
                              <span>🎉 Correct! +15 XP gained</span>
                            </>
                          ) : (
                            <>
                              <span>💡 Keep trying! Here is the explanation:</span>
                            </>
                          )}
                        </div>
                        <p className="mt-1 text-[11px] leading-relaxed">
                          {msg.practiceQuestion.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* AI Actions (e.g. Open Lesson or Quiz) */}
                {msg.suggestedAction && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (msg.suggestedAction?.type === 'open_lesson') {
                          onNavigateToLesson(msg.suggestedAction.payload);
                        } else if (msg.suggestedAction?.type === 'start_quiz') {
                          onNavigateToQuiz(msg.suggestedAction.payload);
                        }
                      }}
                      className="bg-orange-50 hover:bg-orange-100 text-orange-700 font-extrabold px-3 py-1.5 rounded-xl text-xs transition-colors flex items-center gap-1.5"
                    >
                      <span>▶ {msg.suggestedAction.label}</span>
                    </button>
                  </div>
                )}

                {/* AI Footer with Voice Toggle & Engine Attribution */}
                {!isStudent && (
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-semibold text-slate-500 flex items-center gap-1.5">
                      {msg.transport === 'SMS_FALLBACK' ? (
                        <span className="text-purple-700 bg-purple-100 font-bold px-1.5 py-0.5 rounded">💬 Cellular SMS Protocol</span>
                      ) : msg.transport === 'LOW_BW_COMPACT' ? (
                        <span className="text-amber-700 bg-amber-100 font-bold px-1.5 py-0.5 rounded">⚡ Low-BW 2G (&lt;500B)</span>
                      ) : msg.transport === 'LOCAL_RULES' || msg.provider === 'local_engine' ? (
                        <span className="text-emerald-700 bg-emerald-100 font-bold px-1.5 py-0.5 rounded">🌱 On-Device Offline AI</span>
                      ) : (
                        <span className="text-sky-700 bg-sky-100 font-bold px-1.5 py-0.5 rounded">⚡ Cloud Gemini 3.8 Flash</span>
                      )}
                    </span>

                    <button
                      onClick={() => playTts(msg.id, msg.text)}
                      className={`flex items-center gap-1 font-bold px-2 py-0.5 rounded-lg transition-colors ${
                        isTtsActive
                          ? 'bg-orange-100 text-orange-700'
                          : 'hover:bg-slate-100 text-slate-500'
                      }`}
                    >
                      {isTtsActive ? (
                        <>
                          <Volume2 className="w-3 h-3 animate-pulse" />
                          <span>Stop</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3 h-3" />
                          <span>Listen</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Active voice recognition chat bubble indicator */}
        {isListening && (
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-rose-50/80 border border-rose-200/90 text-xs text-rose-700 max-w-[85%] ml-auto animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
              <span className="font-bold">Listening to your voice... Speak now!</span>
            </div>
            <div className="flex items-center gap-1 h-3.5 ml-auto">
              <span className="w-0.5 bg-rose-500 rounded-full h-full wave-bar-1"></span>
              <span className="w-0.5 bg-rose-500 rounded-full h-full wave-bar-2"></span>
              <span className="w-0.5 bg-rose-500 rounded-full h-full wave-bar-3"></span>
              <span className="w-0.5 bg-rose-500 rounded-full h-full wave-bar-4"></span>
            </div>
          </div>
        )}

        {/* AI processing audio/query response indicator */}
        {isProcessing && (
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-900 max-w-[85%] animate-in fade-in duration-200">
            <div className="w-6 h-6 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 animate-spin" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-[11px] text-orange-950">AI Tutor is processing...</span>
              <span className="text-[10px] text-amber-700">Synthesizing personalized explanation in your dialect</span>
            </div>
            <div className="flex items-center gap-1 h-3.5 ml-auto">
              <span className="w-1 bg-amber-500 rounded-full h-full wave-bar-1"></span>
              <span className="w-1 bg-orange-500 rounded-full h-full wave-bar-3"></span>
              <span className="w-1 bg-rose-500 rounded-full h-full wave-bar-2"></span>
            </div>
          </div>
        )}

        {/* SMS Fallback active indicator */}
        {isSmsFallback && (
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-purple-50/80 border border-purple-200/80 text-xs text-purple-900 max-w-[85%] animate-in fade-in duration-200">
            <div className="w-6 h-6 rounded-xl bg-purple-500 text-white flex items-center justify-center shrink-0">
              <Zap className="w-3.5 h-3.5 animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-[11px] text-purple-950">⚡ Switching to SMS fallback...</span>
              <span className="text-[10px] text-purple-700">Network too slow, sending via reliable text message.</span>
            </div>
            <div className="flex items-center gap-1 h-3.5 ml-auto">
              <Loader className="w-4 h-4 animate-spin text-purple-500" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Follow-Ups Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 shrink-0 scrollbar-none">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
          Ask:
        </span>
        {activeFollowUps.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(q)}
            className="bg-white hover:bg-orange-50 text-slate-700 text-[11px] font-semibold px-2.5 py-1 rounded-xl border border-slate-200/80 whitespace-nowrap transition-colors shadow-2xs hover:border-orange-300"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Speech Error Banner if any */}
      {speechError && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1.5 rounded-xl text-xs shrink-0 flex items-center justify-between">
          <span>{speechError}</span>
          <button
            onClick={() => setSpeechError(null)}
            className="text-amber-900 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Voice Recognition Active Floating Visualizer */}
      {isListening && (
        <div className="bg-gradient-to-r from-rose-500/10 via-orange-500/15 to-amber-500/10 border border-rose-200 rounded-2xl p-2.5 shrink-0 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            </span>
            <span className="text-xs font-bold text-rose-700">
              Listening to your voice... Speak now!
            </span>
          </div>

          {/* Dynamic Audio Waveform Equalizer Bars */}
          <div className="flex items-center gap-1 h-5 px-2">
            <span className="w-1 bg-rose-500 rounded-full h-full wave-bar-1"></span>
            <span className="w-1 bg-orange-500 rounded-full h-full wave-bar-2"></span>
            <span className="w-1 bg-amber-500 rounded-full h-full wave-bar-3"></span>
            <span className="w-1 bg-orange-500 rounded-full h-full wave-bar-4"></span>
            <span className="w-1 bg-rose-500 rounded-full h-full wave-bar-5"></span>
          </div>
        </div>
      )}

      {/* 3. Input Controls: Big Mic Button & Type Bar */}
      <div
        className={`bg-white rounded-3xl p-2.5 border shadow-lg shrink-0 flex items-center gap-2 transition-all duration-300 ${
          isListening
            ? 'border-rose-400 ring-4 ring-rose-100 shadow-rose-200/50'
            : isProcessing
            ? 'border-orange-300 ring-2 ring-orange-100'
            : 'border-slate-200/90'
        }`}
      >
        {/* Large Child-Friendly Mic Button with Pulsing Wave Rings */}
        <div className="relative">
          {isListening && (
            <div className="absolute inset-0 rounded-2xl bg-rose-400/40 animate-ping pointer-events-none"></div>
          )}
          <button
            onClick={toggleListening}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-md shrink-0 relative z-10 ${
              isListening
                ? 'bg-rose-600 text-white animate-voice-ripple scale-105'
                : isProcessing
                ? 'bg-orange-500 text-white animate-pulse'
                : 'bg-orange-600 hover:bg-orange-700 text-white active:scale-95 shadow-orange-600/30'
            }`}
            title={isListening ? 'Stop listening' : 'Tap to speak'}
          >
            {isListening ? (
              <MicOff className="w-6 h-6 animate-pulse" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Text Input Field */}
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputText)}
          placeholder={
            isListening ? 'Listening to your voice... Speak now!' : 'Speak or type your question here...'
          }
          className={`flex-1 text-xs sm:text-sm rounded-2xl px-4 py-3 transition-colors focus:outline-none ${
            isListening
              ? 'bg-rose-50/60 border border-rose-300 text-rose-950 placeholder:text-rose-400 font-semibold'
              : 'bg-slate-50 border border-slate-200 text-slate-800 focus:ring-2 focus:ring-orange-500/30'
          }`}
        />

        {/* Send Button */}
        <button
          onClick={() => handleSendMessage(inputText)}
          disabled={!inputText.trim() || isProcessing}
          className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all shrink-0 ${
            inputText.trim() && !isProcessing
              ? 'bg-slate-900 text-white hover:bg-black active:scale-95'
              : 'bg-slate-100 text-slate-300 cursor-not-allowed'
          }`}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      {/* Vosk Offline Voice Model Prompt Modal */}
      {showVoskPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <Mic className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">🎤 Offline Voice Recognition</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Device missing browser speech</p>
                </div>
              </div>
              <button 
                onClick={() => setShowVoskPrompt(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-sm text-slate-600 leading-relaxed">
              Your device does not support browser speech recognition. Would you like to download the offline voice model (Vosk, ~50MB) for voice input?
            </p>

            {voskStatus.voskModelStatus === 'downloading' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-orange-700">
                  <span>Downloading model...</span>
                  <span>{voskStatus.voskModelProgress}%</span>
                </div>
                <div className="h-2 w-full bg-orange-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-orange-500 transition-all duration-300 rounded-full" 
                    style={{ width: `${voskStatus.voskModelProgress}%` }}
                  />
                </div>
              </div>
            )}

            {voskStatus.voskModelStatus === 'ready' && (
              <div className="bg-emerald-50 text-emerald-800 p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Voice model ready! Tap mic to speak.</span>
              </div>
            )}

            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => setShowVoskPrompt(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                No, I'll type
              </button>
              <button
                onClick={() => {
                  if (voskStatus.voskModelStatus === 'ready') {
                    setShowVoskPrompt(false);
                  } else {
                    voiceService.requestVoskInstall();
                  }
                }}
                disabled={voskStatus.voskModelStatus === 'downloading'}
                className="flex-[1.5] py-2.5 rounded-xl text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {voskStatus.voskModelStatus === 'ready' ? (
                  <>Got it <Check className="w-3.5 h-3.5" /></>
                ) : (
                  <>Download Voice Model <Download className="w-3.5 h-3.5" /></>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
