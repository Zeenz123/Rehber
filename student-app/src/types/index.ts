export type LanguageCode = 'en' | 'hi' | 'ta' | 'te' | 'ml' | 'kn';

export interface Language {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
}

export type LearningLevel = 'beginner' | 'intermediate' | 'advanced';
export type LearningSpeed = 'slow' | 'normal' | 'fast';
export type NetworkStatus = 'online' | 'low_bandwidth' | 'offline' | 'message_fallback' | 'syncing';
export type TransportType = 'ONLINE_HTTPS' | 'LOW_BW_COMPACT' | 'LOCAL_RULES' | 'SMS_FALLBACK';

export interface SmsMessageLog {
  id: string;
  studentId: string;
  actionCode: string;
  direction: 'inbound' | 'outbound';
  rawPayload: string;
  decodedText?: string;
  status: 'sent' | 'received' | 'pending' | 'simulated';
  timestamp: string;
  charCount: number;
  segments: number;
}

export interface SlowNetMetrics {
  effectiveSpeed: '2G' | 'EDGE' | '3G' | '4G' | 'OFFLINE';
  latencyMs: number;
  bytesSavedKb: number;
  compressionRatioPercent: number;
  dataSaverActive: boolean;
  queuedTelemetryCount: number;
  autoFallbackToSms: boolean;
}

export type EcosystemEventType =
  | 'SMS_DISPATCHED'
  | 'SMS_RECEIVED'
  | 'SYNC_BATCH_QUEUED'
  | 'SYNC_BATCH_PUSHED'
  | 'TEACHER_INTERVENTION'
  | 'NETWORK_MODE_CHANGED'
  | 'SLOW_NET_TELEMETRY';

export interface EcosystemEvent {
  id: string;
  type: EcosystemEventType;
  studentId: string;
  payload: any;
  timestamp: string;
  source: 'student_app' | 'web_portal' | 'sms_gateway' | 'fastapi_backend';
}


export interface User {
  id: string;
  name: string;
  role: 'student' | 'teacher' | 'admin';
  grade: number; // e.g. 7
  language: LanguageCode;
  avatar: string;
  schoolId: string;
  hubId: string;
  governmentStudentId?: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  icon: string;
  color: string;
  description: string;
  topicsCount: number;
}

export interface Topic {
  id: string;
  subjectId: string;
  title: string;
  description: string;
  level: LearningLevel;
  order: number;
  lessonsCount: number;
}

export interface LessonStep {
  stepNumber: number;
  text: string;
  explanation: string;
  visualCue?: string;
  audioPrompt?: string;
}

export interface Lesson {
  id: string;
  topicId: string;
  subjectId: string;
  title: string;
  description: string;
  level: LearningLevel;
  difficulty: number; // 1 to 5
  estimatedMinutes: number;
  explanation: string;
  steps: LessonStep[];
  workedExamples: {
    question: string;
    stepByStepSolution: string[];
    result: string;
    tip: string;
  }[];
  practiceQuestions: string[];
  offlineAvailable: boolean;
  language: LanguageCode;
}

export interface Question {
  id: string;
  lessonId: string;
  topicId: string;
  subjectId: string;
  type: 'multiple_choice' | 'true_false' | 'short_text';
  text: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  hint: string;
  difficulty: LearningLevel;
  subtopic: string;
}

export interface QuizAttempt {
  id: string;
  studentId: string;
  topicId: string;
  subjectId: string;
  score: number; // percentage 0-100
  totalQuestions: number;
  correctCount: number;
  timeSpentSeconds: number;
  timestamp: string;
  answers: {
    questionId: string;
    studentAnswer: string;
    isCorrect: boolean;
  }[];
  synced: boolean;
}

export interface TopicMastery {
  topicId: string;
  topicTitle: string;
  subjectId: string;
  masteryPercentage: number;
  status: 'needs_practice' | 'improving' | 'strong';
  attemptsCount: number;
  lastScore: number;
  recommendedSpeed: LearningSpeed;
  recommendedDifficulty: LearningLevel;
  identifiedGaps: string[];
  lastPracticed: string;
}

export interface LearnerProfile {
  studentId: string;
  overallLevel: LearningLevel;
  currentSpeed: LearningSpeed;
  streakDays: number;
  xpPoints: number;
  completedLessons: string[];
  topicMasteries: Record<string, TopicMastery>;
  lastAssessmentDate?: string;
  badges: Badge[];
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
}

export interface AIRecommendation {
  id: string;
  studentId: string;
  subjectId: string;
  topicId: string;
  topicTitle: string;
  lessonId?: string;
  title: string;
  reason: string;
  recommendedLevel: LearningLevel;
  recommendedSpeed: LearningSpeed;
  practiceCount: number;
  actionText: string;
  isRevision: boolean;
  timestamp: string;
}

export type TutorMode = 'explain' | 'step_by_step' | 'quiz_me' | 'rural_analogy' | 'quick_summary';

export interface ChatMessage {
  id: string;
  sender: 'student' | 'ai';
  text: string;
  timestamp: string;
  voiceUrl?: string;
  provider: 'local_engine' | 'cloud_gemini';
  mode?: TutorMode;
  transport?: TransportType;
  rawSmsPayload?: string;
  smsReplyPayload?: string;
  charCount?: number;
  suggestedAction?: {
    type: 'open_lesson' | 'start_quiz' | 'practice';
    payload: string;
    label: string;
  };
  followUps?: string[];
  practiceQuestion?: {
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  };
  status?: 'sending' | 'failed' | 'queued' | 'sent';
}

export interface SyncRecord {
  id: string;
  type: 'quiz_attempt' | 'lesson_progress' | 'profile_update' | 'diagnostic';
  data: any;
  timestamp: string;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  retries: number;
}

export interface SolarHubStatus {
  hubId: string;
  hubName: string;
  location: string;
  status: 'CONNECTED' | 'SYNCING' | 'OFFLINE';
  batteryPercentage: number;
  solarInputWatts: number;
  storageRemainingGb: number;
  connectedTabletsCount: number;
  lastCloudSync: string;
  pendingSyncCount: number;
}

export interface TeacherStudentView {
  id: string;
  name: string;
  grade: number;
  avatar: string;
  learningLevel: LearningLevel;
  overallProgress: number; // 0-100%
  averageScore: number;
  subjectProgress: Record<string, number>;
  weakTopics: string[];
  strongTopics: string[];
  lastSync: string;
  lastActive: string;
  needsSupport: boolean;
  learningSpeed: LearningSpeed;
  recommendedIntervention: string;
}

export interface ClassInsight {
  subjectId: string;
  subjectName: string;
  topicId: string;
  topicName: string;
  strugglingCount: number;
  improvingCount: number;
  strongCount: number;
  recommendedAction: string;
}
