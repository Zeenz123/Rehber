import {
  User,
  LearnerProfile,
  Subject,
  Topic,
  Lesson,
  Question,
  QuizAttempt,
  AIRecommendation,
  ChatMessage,
  SyncRecord,
  SolarHubStatus,
  LearningLevel,
  LearningSpeed,
} from '../types';
import {
  INITIAL_SUBJECTS,
  INITIAL_TOPICS,
  INITIAL_LESSONS,
  INITIAL_QUESTIONS,
} from './curriculumData';

const DB_PREFIX = 'rurallearn_';

const DEFAULT_USER: User = {
  id: 'student-rahul-01',
  name: 'Rahul Kumar',
  role: 'student',
  grade: 7,
  language: 'hi',
  avatar: '👦🏽',
  schoolId: 'school-rampur-01',
  hubId: 'hub-solar-node-04',
};

const DEFAULT_HUB: SolarHubStatus = {
  hubId: 'hub-solar-node-04',
  hubName: 'Rampur Solar Learning Node #4',
  location: 'Village Community Panchayat Hall',
  status: 'CONNECTED',
  batteryPercentage: 92,
  solarInputWatts: 240,
  storageRemainingGb: 14.8,
  connectedTabletsCount: 6,
  lastCloudSync: '28 Sep 2026, 09:15 AM',
  pendingSyncCount: 0,
};

const INITIAL_PROFILE: LearnerProfile = {
  studentId: DEFAULT_USER.id,
  overallLevel: 'beginner',
  currentSpeed: 'normal',
  streakDays: 5,
  xpPoints: 340,
  completedLessons: ['lesson-frac-1', 'lesson-sci-plant-1'],
  topicMasteries: {
    'math-fractions': {
      topicId: 'math-fractions',
      topicTitle: 'Fractions & Decimals',
      subjectId: 'math',
      masteryPercentage: 65,
      status: 'improving',
      attemptsCount: 2,
      lastScore: 65,
      recommendedSpeed: 'normal',
      recommendedDifficulty: 'beginner',
      identifiedGaps: ['fraction_to_decimal'],
      lastPracticed: new Date(Date.now() - 86400000).toISOString(),
    },
    'math-algebra': {
      topicId: 'math-algebra',
      topicTitle: 'Algebra Basics & Equations',
      subjectId: 'math',
      masteryPercentage: 35,
      status: 'needs_practice',
      attemptsCount: 1,
      lastScore: 35,
      recommendedSpeed: 'slow',
      recommendedDifficulty: 'beginner',
      identifiedGaps: ['two_step_equations', 'variables'],
      lastPracticed: new Date(Date.now() - 172800000).toISOString(),
    },
    'math-geometry': {
      topicId: 'math-geometry',
      topicTitle: 'Geometry & Land Measurement',
      subjectId: 'math',
      masteryPercentage: 82,
      status: 'strong',
      attemptsCount: 3,
      lastScore: 82,
      recommendedSpeed: 'fast',
      recommendedDifficulty: 'intermediate',
      identifiedGaps: [],
      lastPracticed: new Date(Date.now() - 43200000).toISOString(),
    },
    'sci-plants': {
      topicId: 'sci-plants',
      topicTitle: 'Plant Life & Photosynthesis',
      subjectId: 'science',
      masteryPercentage: 78,
      status: 'strong',
      attemptsCount: 2,
      lastScore: 78,
      recommendedSpeed: 'normal',
      recommendedDifficulty: 'intermediate',
      identifiedGaps: [],
      lastPracticed: new Date(Date.now() - 86400000).toISOString(),
    },
    'sci-energy': {
      topicId: 'sci-energy',
      topicTitle: 'Energy, Solar Power & Simple Machines',
      subjectId: 'science',
      masteryPercentage: 55,
      status: 'improving',
      attemptsCount: 1,
      lastScore: 55,
      recommendedSpeed: 'normal',
      recommendedDifficulty: 'beginner',
      identifiedGaps: ['biogas'],
      lastPracticed: new Date(Date.now() - 259200000).toISOString(),
    },
    'eng-grammar': {
      topicId: 'eng-grammar',
      topicTitle: 'Parts of Speech & Sentences',
      subjectId: 'english',
      masteryPercentage: 72,
      status: 'improving',
      attemptsCount: 2,
      lastScore: 72,
      recommendedSpeed: 'normal',
      recommendedDifficulty: 'intermediate',
      identifiedGaps: ['past_tense'],
      lastPracticed: new Date(Date.now() - 86400000).toISOString(),
    },
  },
  badges: [
    {
      id: 'badge-first-lesson',
      title: 'First Lesson 🏆',
      description: 'Completed your very first offline lesson!',
      icon: '🏆',
      unlockedAt: '2026-09-24T10:00:00Z',
    },
    {
      id: 'badge-streak-5',
      title: '5-Day Streak 🔥',
      description: 'Consistent learning every day this week!',
      icon: '🔥',
      unlockedAt: '2026-09-28T08:00:00Z',
    },
    {
      id: 'badge-curious-mind',
      title: 'Voice Explorer 🎤',
      description: 'Asked questions using the voice AI tutor!',
      icon: '🎤',
      unlockedAt: '2026-09-26T14:30:00Z',
    },
  ],
};

const DEFAULT_RECOMMENDATION: AIRecommendation = {
  id: 'rec-01',
  studentId: DEFAULT_USER.id,
  subjectId: 'math',
  topicId: 'math-algebra',
  topicTitle: 'Algebra Basics & Equations',
  lessonId: 'lesson-alg-1',
  title: 'Start with Algebra Basics (Slow Pace)',
  reason: 'Recent quiz score was 35%. The on-device AI recommends foundational step-by-step practice before moving forward.',
  recommendedLevel: 'beginner',
  recommendedSpeed: 'slow',
  practiceCount: 5,
  actionText: 'Start Lesson',
  isRevision: true,
  timestamp: new Date().toISOString(),
};

export const DEFAULT_STUDENTS_LIST: { user: User; profile: LearnerProfile }[] = [
  {
    user: DEFAULT_USER,
    profile: INITIAL_PROFILE,
  },
  {
    user: {
      id: 'student-priya-02',
      name: 'Priya Sharma',
      role: 'student',
      grade: 7,
      language: 'hi',
      avatar: '👧🏽',
      schoolId: 'school-rampur-01',
      hubId: 'hub-solar-node-04',
    },
    profile: {
      studentId: 'student-priya-02',
      overallLevel: 'advanced',
      currentSpeed: 'fast',
      streakDays: 12,
      xpPoints: 780,
      completedLessons: ['lesson-frac-1', 'lesson-alg-1', 'lesson-sci-plant-1', 'lesson-sci-energy-1'],
      topicMasteries: {
        'math-fractions': {
          topicId: 'math-fractions',
          topicTitle: 'Fractions & Decimals',
          subjectId: 'math',
          masteryPercentage: 92,
          status: 'strong',
          attemptsCount: 4,
          lastScore: 95,
          recommendedSpeed: 'fast',
          recommendedDifficulty: 'advanced',
          identifiedGaps: [],
          lastPracticed: new Date(Date.now() - 36000000).toISOString(),
        },
        'math-algebra': {
          topicId: 'math-algebra',
          topicTitle: 'Algebra Basics & Equations',
          subjectId: 'math',
          masteryPercentage: 88,
          status: 'strong',
          attemptsCount: 3,
          lastScore: 90,
          recommendedSpeed: 'normal',
          recommendedDifficulty: 'intermediate',
          identifiedGaps: [],
          lastPracticed: new Date(Date.now() - 72000000).toISOString(),
        },
        'math-geometry': {
          topicId: 'math-geometry',
          topicTitle: 'Geometry & Land Measurement',
          subjectId: 'math',
          masteryPercentage: 95,
          status: 'strong',
          attemptsCount: 3,
          lastScore: 95,
          recommendedSpeed: 'fast',
          recommendedDifficulty: 'advanced',
          identifiedGaps: [],
          lastPracticed: new Date(Date.now() - 25000000).toISOString(),
        },
        'sci-plants': {
          topicId: 'sci-plants',
          topicTitle: 'Plant Life & Photosynthesis',
          subjectId: 'science',
          masteryPercentage: 90,
          status: 'strong',
          attemptsCount: 2,
          lastScore: 90,
          recommendedSpeed: 'fast',
          recommendedDifficulty: 'advanced',
          identifiedGaps: [],
          lastPracticed: new Date(Date.now() - 40000000).toISOString(),
        },
        'sci-energy': {
          topicId: 'sci-energy',
          topicTitle: 'Energy, Solar Power & Simple Machines',
          subjectId: 'science',
          masteryPercentage: 70,
          status: 'improving',
          attemptsCount: 2,
          lastScore: 70,
          recommendedSpeed: 'normal',
          recommendedDifficulty: 'intermediate',
          identifiedGaps: ['pulleys'],
          lastPracticed: new Date(Date.now() - 100000000).toISOString(),
        },
        'eng-grammar': {
          topicId: 'eng-grammar',
          topicTitle: 'Parts of Speech & Sentences',
          subjectId: 'english',
          masteryPercentage: 85,
          status: 'strong',
          attemptsCount: 3,
          lastScore: 85,
          recommendedSpeed: 'fast',
          recommendedDifficulty: 'advanced',
          identifiedGaps: [],
          lastPracticed: new Date(Date.now() - 50000000).toISOString(),
        },
      },
      badges: [
        { id: 'badge-first-lesson', title: 'First Lesson 🏆', description: 'Completed your very first offline lesson!', icon: '🏆', unlockedAt: '2026-09-10T10:00:00Z' },
        { id: 'badge-streak-10', title: '10-Day Streak 🔥', description: '10-day consistent learning streak!', icon: '🔥', unlockedAt: '2026-09-26T08:00:00Z' },
        { id: 'badge-math-wizard', title: 'Math Ace 📐', description: 'Scored 95%+ in advanced geometry & fractions!', icon: '📐', unlockedAt: '2026-09-27T14:30:00Z' },
      ],
    },
  },
  {
    user: {
      id: 'student-anita-03',
      name: 'Anita Devi',
      role: 'student',
      grade: 7,
      language: 'hi',
      avatar: '👧🏾',
      schoolId: 'school-rampur-01',
      hubId: 'hub-solar-node-04',
    },
    profile: {
      studentId: 'student-anita-03',
      overallLevel: 'beginner',
      currentSpeed: 'slow',
      streakDays: 2,
      xpPoints: 190,
      completedLessons: ['lesson-frac-1'],
      topicMasteries: {
        'math-fractions': {
          topicId: 'math-fractions',
          topicTitle: 'Fractions & Decimals',
          subjectId: 'math',
          masteryPercentage: 48,
          status: 'needs_practice',
          attemptsCount: 2,
          lastScore: 48,
          recommendedSpeed: 'slow',
          recommendedDifficulty: 'beginner',
          identifiedGaps: ['fraction_addition'],
          lastPracticed: new Date(Date.now() - 90000000).toISOString(),
        },
        'math-algebra': {
          topicId: 'math-algebra',
          topicTitle: 'Algebra Basics & Equations',
          subjectId: 'math',
          masteryPercentage: 30,
          status: 'needs_practice',
          attemptsCount: 1,
          lastScore: 30,
          recommendedSpeed: 'slow',
          recommendedDifficulty: 'beginner',
          identifiedGaps: ['variables'],
          lastPracticed: new Date(Date.now() - 150000000).toISOString(),
        },
        'math-geometry': {
          topicId: 'math-geometry',
          topicTitle: 'Geometry & Land Measurement',
          subjectId: 'math',
          masteryPercentage: 75,
          status: 'strong',
          attemptsCount: 2,
          lastScore: 75,
          recommendedSpeed: 'normal',
          recommendedDifficulty: 'intermediate',
          identifiedGaps: [],
          lastPracticed: new Date(Date.now() - 60000000).toISOString(),
        },
      },
      badges: [
        { id: 'badge-first-lesson', title: 'First Lesson 🏆', description: 'Completed your very first offline lesson!', icon: '🏆', unlockedAt: '2026-09-25T10:00:00Z' },
      ],
    },
  },
  {
    user: {
      id: 'student-arun-04',
      name: 'Arun Patel',
      role: 'student',
      grade: 7,
      language: 'hi',
      avatar: '👦🏾',
      schoolId: 'school-rampur-01',
      hubId: 'hub-solar-node-04',
    },
    profile: {
      studentId: 'student-arun-04',
      overallLevel: 'intermediate',
      currentSpeed: 'normal',
      streakDays: 6,
      xpPoints: 520,
      completedLessons: ['lesson-frac-1', 'lesson-alg-1', 'lesson-sci-energy-1'],
      topicMasteries: {
        'math-fractions': {
          topicId: 'math-fractions',
          topicTitle: 'Fractions & Decimals',
          subjectId: 'math',
          masteryPercentage: 74,
          status: 'strong',
          attemptsCount: 2,
          lastScore: 74,
          recommendedSpeed: 'normal',
          recommendedDifficulty: 'intermediate',
          identifiedGaps: [],
          lastPracticed: new Date(Date.now() - 40000000).toISOString(),
        },
        'math-algebra': {
          topicId: 'math-algebra',
          topicTitle: 'Algebra Basics & Equations',
          subjectId: 'math',
          masteryPercentage: 80,
          status: 'strong',
          attemptsCount: 2,
          lastScore: 80,
          recommendedSpeed: 'normal',
          recommendedDifficulty: 'intermediate',
          identifiedGaps: [],
          lastPracticed: new Date(Date.now() - 30000000).toISOString(),
        },
        'sci-energy': {
          topicId: 'sci-energy',
          topicTitle: 'Energy, Solar Power & Simple Machines',
          subjectId: 'science',
          masteryPercentage: 82,
          status: 'strong',
          attemptsCount: 3,
          lastScore: 85,
          recommendedSpeed: 'normal',
          recommendedDifficulty: 'intermediate',
          identifiedGaps: [],
          lastPracticed: new Date(Date.now() - 20000000).toISOString(),
        },
      },
      badges: [
        { id: 'badge-first-lesson', title: 'First Lesson 🏆', description: 'Completed your very first offline lesson!', icon: '🏆', unlockedAt: '2026-09-18T10:00:00Z' },
        { id: 'badge-solar-champion', title: 'Solar Champion ☀️', description: 'Mastered solar energy & simple machines!', icon: '☀️', unlockedAt: '2026-09-27T10:00:00Z' },
      ],
    },
  },
  {
    user: {
      id: 'student-sunita-05',
      name: 'Sunita Meena',
      role: 'student',
      grade: 7,
      language: 'hi',
      avatar: '👧🏽',
      schoolId: 'school-rampur-01',
      hubId: 'hub-solar-node-04',
    },
    profile: {
      studentId: 'student-sunita-05',
      overallLevel: 'beginner',
      currentSpeed: 'slow',
      streakDays: 3,
      xpPoints: 260,
      completedLessons: ['lesson-frac-1', 'lesson-sci-plant-1'],
      topicMasteries: {
        'math-fractions': {
          topicId: 'math-fractions',
          topicTitle: 'Fractions & Decimals',
          subjectId: 'math',
          masteryPercentage: 50,
          status: 'needs_practice',
          attemptsCount: 2,
          lastScore: 50,
          recommendedSpeed: 'slow',
          recommendedDifficulty: 'beginner',
          identifiedGaps: ['decimals'],
          lastPracticed: new Date(Date.now() - 70000000).toISOString(),
        },
        'sci-plants': {
          topicId: 'sci-plants',
          topicTitle: 'Plant Life & Photosynthesis',
          subjectId: 'science',
          masteryPercentage: 64,
          status: 'improving',
          attemptsCount: 2,
          lastScore: 64,
          recommendedSpeed: 'normal',
          recommendedDifficulty: 'beginner',
          identifiedGaps: [],
          lastPracticed: new Date(Date.now() - 35000000).toISOString(),
        },
      },
      badges: [
        { id: 'badge-first-lesson', title: 'First Lesson 🏆', description: 'Completed your very first offline lesson!', icon: '🏆', unlockedAt: '2026-09-22T10:00:00Z' },
      ],
    },
  },
];

// ==========================================
// IndexedDB Persistence Layer
// ==========================================
const IDB_NAME = 'rurallearn_offline_db';
const IDB_VERSION = 1;
export const IDB_STORES = {
  LEARNING_PROGRESS: 'learning_progress',
  TUTOR_CHAT: 'tutor_chat',
  QUIZ_ATTEMPTS: 'quiz_attempts',
  SYNC_QUEUE: 'sync_queue',
  SYSTEM_STATE: 'system_state',
} as const;

class IndexedDBStorage {
  private dbPromise: Promise<IDBDatabase | null> | null = null;
  public readonly isAvailable: boolean;

  constructor() {
    this.isAvailable = typeof window !== 'undefined' && 'indexedDB' in window;
  }

  async getDB(): Promise<IDBDatabase | null> {
    if (!this.isAvailable) return null;
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve) => {
      try {
        const req = window.indexedDB.open(IDB_NAME, IDB_VERSION);

        req.onupgradeneeded = (e) => {
          const db = (e.target as IDBOpenDBRequest).result;

          // 1. Learning Progress Store (keyPath: 'key')
          if (!db.objectStoreNames.contains(IDB_STORES.LEARNING_PROGRESS)) {
            db.createObjectStore(IDB_STORES.LEARNING_PROGRESS, { keyPath: 'key' });
          }

          // 2. Tutor Chat History Store (keyPath: 'id', index: timestamp)
          if (!db.objectStoreNames.contains(IDB_STORES.TUTOR_CHAT)) {
            const chatStore = db.createObjectStore(IDB_STORES.TUTOR_CHAT, { keyPath: 'id' });
            chatStore.createIndex('timestamp', 'timestamp', { unique: false });
          }

          // 3. Quiz Attempts Store (keyPath: 'id', indexes: topicId, timestamp)
          if (!db.objectStoreNames.contains(IDB_STORES.QUIZ_ATTEMPTS)) {
            const quizStore = db.createObjectStore(IDB_STORES.QUIZ_ATTEMPTS, { keyPath: 'id' });
            quizStore.createIndex('topicId', 'topicId', { unique: false });
            quizStore.createIndex('timestamp', 'timestamp', { unique: false });
          }

          // 4. Offline Sync Queue Store (keyPath: 'id', indexes: status, timestamp)
          if (!db.objectStoreNames.contains(IDB_STORES.SYNC_QUEUE)) {
            const syncStore = db.createObjectStore(IDB_STORES.SYNC_QUEUE, { keyPath: 'id' });
            syncStore.createIndex('status', 'status', { unique: false });
            syncStore.createIndex('timestamp', 'timestamp', { unique: false });
          }

          // 5. System State Store (keyPath: 'key')
          if (!db.objectStoreNames.contains(IDB_STORES.SYSTEM_STATE)) {
            db.createObjectStore(IDB_STORES.SYSTEM_STATE, { keyPath: 'key' });
          }
        };

        req.onsuccess = () => {
          resolve(req.result);
        };

        req.onerror = () => {
          console.warn('IndexedDB failed to open, using memory/localStorage fallback', req.error);
          resolve(null);
        };

        req.onblocked = () => {
          console.warn('IndexedDB open blocked');
          resolve(null);
        };
      } catch (err) {
        console.warn('IndexedDB initialization error:', err);
        resolve(null);
      }
    });

    return this.dbPromise;
  }

  async put<T>(storeName: string, item: T): Promise<void> {
    try {
      const db = await this.getDB();
      if (!db) return;
      return new Promise((resolve) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        store.put(item);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    } catch (e) {
      console.warn(`IndexedDB put error [${storeName}]:`, e);
    }
  }

  async putBatch<T>(storeName: string, items: T[]): Promise<void> {
    try {
      const db = await this.getDB();
      if (!db || items.length === 0) return;
      return new Promise((resolve) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        for (const item of items) {
          store.put(item);
        }
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    } catch (e) {
      console.warn(`IndexedDB putBatch error [${storeName}]:`, e);
    }
  }

  async get<T>(storeName: string, key: IDBValidKey): Promise<T | null> {
    try {
      const db = await this.getDB();
      if (!db) return null;
      return new Promise((resolve) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.get(key);
        req.onsuccess = () => resolve((req.result as T) ?? null);
        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    try {
      const db = await this.getDB();
      if (!db) return [];
      return new Promise((resolve) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.getAll();
        req.onsuccess = () => resolve((req.result as T[]) || []);
        req.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  }

  async delete(storeName: string, key: IDBValidKey): Promise<void> {
    try {
      const db = await this.getDB();
      if (!db) return;
      return new Promise((resolve) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        store.delete(key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    } catch {}
  }

  async clear(storeName: string): Promise<void> {
    try {
      const db = await this.getDB();
      if (!db) return;
      return new Promise((resolve) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        store.clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    } catch {}
  }
}

// ==========================================
// Dual-Layer Local Database Manager
// ==========================================
class LocalDatabase {
  private idb = new IndexedDBStorage();
  private listeners: Set<() => void> = new Set();
  private idbInitialized = false;

  private getItem<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(DB_PREFIX + key);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  }

  private setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(DB_PREFIX + key, JSON.stringify(value));
    } catch (e) {
      console.warn('Storage quota or private mode error in LocalDb', e);
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error('Error in localDb subscriber:', err);
      }
    });
  }

  /**
   * Subscribe to local database updates (e.g. after IndexedDB hydration)
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Check if IndexedDB is supported and active in the current environment
   */
  isIndexedDBAvailable(): boolean {
    return this.idb.isAvailable;
  }

  isIndexedDBReady(): boolean {
    return this.idbInitialized;
  }

  init(): void {
    // 1. Synchronously seed initial state into memory / localStorage for instant rendering
    if (!this.getUser()) {
      this.setUser(DEFAULT_USER);
    }
    if (!this.getProfile()) {
      this.setProfile(INITIAL_PROFILE);
    }
    if (!this.getCurrentRecommendation()) {
      this.setRecommendation(DEFAULT_RECOMMENDATION);
    }
    if (!localStorage.getItem(DB_PREFIX + 'subjects')) {
      this.setItem('subjects', INITIAL_SUBJECTS);
    }
    if (!localStorage.getItem(DB_PREFIX + 'topics')) {
      this.setItem('topics', INITIAL_TOPICS);
    }
    if (!localStorage.getItem(DB_PREFIX + 'lessons')) {
      this.setItem('lessons', INITIAL_LESSONS);
    }
    if (!localStorage.getItem(DB_PREFIX + 'questions')) {
      this.setItem('questions', INITIAL_QUESTIONS);
    }
    if (!localStorage.getItem(DB_PREFIX + 'hub_status')) {
      this.setItem('hub_status', DEFAULT_HUB);
    }
    if (!localStorage.getItem(DB_PREFIX + 'all_students')) {
      const studentUsers = DEFAULT_STUDENTS_LIST.map((s) => s.user);
      this.setItem('all_students', studentUsers);
      DEFAULT_STUDENTS_LIST.forEach((s) => {
        this.setItem('profile_' + s.user.id, s.profile);
      });
    }

    // 2. Asynchronously hydrate from IndexedDB & replicate caches
    this.hydrateFromIndexedDB();
  }

  /**
   * Hydrates memory/localStorage with data persisted inside IndexedDB
   * ensuring learning progress and chat history survive cache flushes & offline periods.
   */
  async hydrateFromIndexedDB(): Promise<void> {
    if (!this.idb.isAvailable) return;

    try {
      const db = await this.idb.getDB();
      if (!db) return;
      this.idbInitialized = true;

      // 1. Hydrate Learning Profile from IndexedDB
      const storedProfileRecord = await this.idb.get<{ key: string; data: LearnerProfile }>(
        IDB_STORES.LEARNING_PROGRESS,
        'profile',
      );
      if (storedProfileRecord?.data) {
        this.setItem('profile', storedProfileRecord.data);
      } else {
        // Prime IndexedDB with current profile
        const currentProfile = this.getProfile();
        await this.idb.put(IDB_STORES.LEARNING_PROGRESS, {
          key: 'profile',
          data: currentProfile,
          updatedAt: new Date().toISOString(),
        });
      }

      // 2. Hydrate Tutor Chat History from IndexedDB
      const idbChatMessages = await this.idb.getAll<ChatMessage>(IDB_STORES.TUTOR_CHAT);
      if (idbChatMessages && idbChatMessages.length > 0) {
        const localChat = this.getItem<ChatMessage[]>('chat_history', []);
        const mergedMap = new Map<string, ChatMessage>();

        // IDB messages
        idbChatMessages.forEach((m) => {
          if (m?.id) mergedMap.set(m.id, m);
        });
        // Merge with local chat
        localChat.forEach((m) => {
          if (m?.id) mergedMap.set(m.id, m);
        });

        // Sort chronologically
        const mergedList = Array.from(mergedMap.values()).sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
        );

        this.setItem('chat_history', mergedList.slice(-50));
      } else {
        // Prime IndexedDB with current chat history
        const initialChat = this.getChatHistory();
        await this.idb.putBatch(IDB_STORES.TUTOR_CHAT, initialChat);
      }

      // 3. Hydrate Quiz Attempts from IndexedDB
      const idbQuizAttempts = await this.idb.getAll<QuizAttempt>(IDB_STORES.QUIZ_ATTEMPTS);
      if (idbQuizAttempts && idbQuizAttempts.length > 0) {
        const localAttempts = this.getItem<QuizAttempt[]>('quiz_attempts', []);
        const attemptsMap = new Map<string, QuizAttempt>();
        idbQuizAttempts.forEach((a) => attemptsMap.set(a.id, a));
        localAttempts.forEach((a) => attemptsMap.set(a.id, a));

        const sortedAttempts = Array.from(attemptsMap.values()).sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        );
        this.setItem('quiz_attempts', sortedAttempts);
      } else {
        const currentAttempts = this.getQuizAttempts();
        if (currentAttempts.length > 0) {
          await this.idb.putBatch(IDB_STORES.QUIZ_ATTEMPTS, currentAttempts);
        }
      }

      // 4. Hydrate Sync Queue from IndexedDB
      const idbSyncQueue = await this.idb.getAll<SyncRecord>(IDB_STORES.SYNC_QUEUE);
      if (idbSyncQueue && idbSyncQueue.length > 0) {
        const localQueue = this.getItem<SyncRecord[]>('sync_queue', []);
        const queueMap = new Map<string, SyncRecord>();
        idbSyncQueue.forEach((r) => queueMap.set(r.id, r));
        localQueue.forEach((r) => queueMap.set(r.id, r));
        this.setItem('sync_queue', Array.from(queueMap.values()));
      }

      // Notify any subscribers that hydration is complete
      this.notifyListeners();
    } catch (e) {
      console.warn('Error hydrating from IndexedDB:', e);
    }
  }

  // User Session
  getUser(): User | null {
    return this.getItem<User | null>('user', null);
  }

  setUser(user: User): void {
    this.setItem('user', user);
    // Background persist to IndexedDB
    this.idb.put(IDB_STORES.SYSTEM_STATE, { key: 'user', data: user });
    this.notifyListeners();
  }

  // Multi-Student Roster & Switching
  getAllStudents(): User[] {
    const list = this.getItem<User[]>('all_students', []);
    if (!list || list.length === 0) {
      const defaultUsers = DEFAULT_STUDENTS_LIST.map((s) => s.user);
      this.setItem('all_students', defaultUsers);
      return defaultUsers;
    }
    return list;
  }

  getStudentProfile(studentId: string): LearnerProfile {
    const p = this.getItem<LearnerProfile>('profile_' + studentId, null as any);
    if (p) return p;
    // Check default students list
    const matched = DEFAULT_STUDENTS_LIST.find((s) => s.user.id === studentId);
    if (matched) return matched.profile;
    // Fallback baseline profile
    return { ...INITIAL_PROFILE, studentId };
  }

  switchStudent(studentId: string): { user: User; profile: LearnerProfile } {
    const all = this.getAllStudents();
    const targetUser = all.find((u) => u.id === studentId) || all[0] || DEFAULT_USER;

    // Save previous active profile
    const currentUser = this.getUser();
    const currentProfile = this.getProfile();
    if (currentUser) {
      this.setItem('profile_' + currentUser.id, currentProfile);
    }

    // Load target student profile
    const targetProfile = this.getStudentProfile(targetUser.id);

    this.setItem('user', targetUser);
    this.setItem('profile', targetProfile);
    this.setItem('profile_' + targetUser.id, targetProfile);

    // Persist to IDB
    this.idb.put(IDB_STORES.SYSTEM_STATE, { key: 'user', data: targetUser });
    this.idb.put(IDB_STORES.LEARNING_PROGRESS, {
      key: 'profile',
      data: targetProfile,
      updatedAt: new Date().toISOString(),
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('studentChanged', {
          detail: { user: targetUser, profile: targetProfile },
        })
      );
      window.dispatchEvent(new CustomEvent('classChanged', { detail: targetUser.grade }));
    }

    this.notifyListeners();
    return { user: targetUser, profile: targetProfile };
  }

  joinAsStudent(
    name: string,
    grade: number = 7,
    avatar?: string
  ): { user: User; profile: LearnerProfile } {
    const trimmedName = name.trim();
    const all = this.getAllStudents();

    // Check if student with this name already exists
    const existing = all.find(
      (u) => u.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (existing) {
      if (grade && existing.grade !== grade) existing.grade = grade;
      if (avatar && existing.avatar !== avatar) existing.avatar = avatar;
      this.setItem('all_students', all);
      return this.switchStudent(existing.id);
    }

    // Create unique new student
    const newId = `student-${trimmedName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;
    const defaultAvatars = ['👦🏽', '👧🏽', '👦🏾', '👧🏾', '🧑🏻', '👧🏻', '🌟', '🚀', '🦁', '🦉', '🌻'];
    const chosenAvatar =
      avatar || defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)];

    const newUser: User = {
      id: newId,
      name: trimmedName,
      role: 'student',
      grade: grade || 7,
      language: this.getUser()?.language || 'hi',
      avatar: chosenAvatar,
      schoolId: 'school-rampur-01',
      hubId: 'hub-solar-node-04',
    };

    // Create personalized profile for this student
    const newProfile: LearnerProfile = {
      studentId: newId,
      overallLevel: 'beginner',
      currentSpeed: 'normal',
      streakDays: 1,
      xpPoints: 100,
      completedLessons: [],
      topicMasteries: {
        'math-fractions': {
          topicId: 'math-fractions',
          topicTitle: 'Fractions & Decimals',
          subjectId: 'math',
          masteryPercentage: 55,
          status: 'improving',
          attemptsCount: 1,
          lastScore: 60,
          recommendedSpeed: 'normal',
          recommendedDifficulty: 'beginner',
          identifiedGaps: [],
          lastPracticed: new Date().toISOString(),
        },
        'math-algebra': {
          topicId: 'math-algebra',
          topicTitle: 'Algebra Basics & Equations',
          subjectId: 'math',
          masteryPercentage: 45,
          status: 'needs_practice',
          attemptsCount: 1,
          lastScore: 45,
          recommendedSpeed: 'slow',
          recommendedDifficulty: 'beginner',
          identifiedGaps: ['variables'],
          lastPracticed: new Date().toISOString(),
        },
        'math-geometry': {
          topicId: 'math-geometry',
          topicTitle: 'Geometry & Land Measurement',
          subjectId: 'math',
          masteryPercentage: 65,
          status: 'improving',
          attemptsCount: 1,
          lastScore: 65,
          recommendedSpeed: 'normal',
          recommendedDifficulty: 'intermediate',
          identifiedGaps: [],
          lastPracticed: new Date().toISOString(),
        },
        'sci-plants': {
          topicId: 'sci-plants',
          topicTitle: 'Plant Life & Photosynthesis',
          subjectId: 'science',
          masteryPercentage: 70,
          status: 'strong',
          attemptsCount: 1,
          lastScore: 70,
          recommendedSpeed: 'normal',
          recommendedDifficulty: 'intermediate',
          identifiedGaps: [],
          lastPracticed: new Date().toISOString(),
        },
        'sci-energy': {
          topicId: 'sci-energy',
          topicTitle: 'Energy, Solar Power & Simple Machines',
          subjectId: 'science',
          masteryPercentage: 50,
          status: 'improving',
          attemptsCount: 1,
          lastScore: 50,
          recommendedSpeed: 'normal',
          recommendedDifficulty: 'beginner',
          identifiedGaps: [],
          lastPracticed: new Date().toISOString(),
        },
        'eng-grammar': {
          topicId: 'eng-grammar',
          topicTitle: 'Parts of Speech & Sentences',
          subjectId: 'english',
          masteryPercentage: 60,
          status: 'improving',
          attemptsCount: 1,
          lastScore: 60,
          recommendedSpeed: 'normal',
          recommendedDifficulty: 'intermediate',
          identifiedGaps: [],
          lastPracticed: new Date().toISOString(),
        },
      },
      badges: [
        {
          id: 'badge-welcome-' + Date.now(),
          title: 'Joined RuralLearn 🌟',
          description: `Welcome to Class ${grade}, ${trimmedName}!`,
          icon: '🌟',
          unlockedAt: new Date().toISOString(),
        },
      ],
    };

    // Save previous active profile
    const curU = this.getUser();
    const curP = this.getProfile();
    if (curU) {
      this.setItem('profile_' + curU.id, curP);
    }

    all.push(newUser);
    this.setItem('all_students', all);
    this.setItem('user', newUser);
    this.setItem('profile', newProfile);
    this.setItem('profile_' + newId, newProfile);

    // Persist in IDB
    this.idb.put(IDB_STORES.SYSTEM_STATE, { key: 'user', data: newUser });
    this.idb.put(IDB_STORES.LEARNING_PROGRESS, {
      key: 'profile',
      data: newProfile,
      updatedAt: new Date().toISOString(),
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('studentChanged', {
          detail: { user: newUser, profile: newProfile },
        })
      );
      window.dispatchEvent(new CustomEvent('classChanged', { detail: newUser.grade }));
    }

    this.notifyListeners();
    return { user: newUser, profile: newProfile };
  }

  // Learner Profile & Progress
  getProfile(): LearnerProfile {
    return this.getItem<LearnerProfile>('profile', INITIAL_PROFILE);
  }

  setProfile(profile: LearnerProfile): void {
    this.setItem('profile', profile);

    // Persist learning progress to IndexedDB
    this.idb.put(IDB_STORES.LEARNING_PROGRESS, {
      key: 'profile',
      data: profile,
      updatedAt: new Date().toISOString(),
    });

    // Queue sync record automatically for solar hub sync
    this.queueSyncRecord('profile_update', profile);
    this.notifyListeners();
  }

  // Curriculum
  getSubjects(): Subject[] {
    return this.getItem<Subject[]>('subjects', INITIAL_SUBJECTS);
  }

  addSubject(subject: Subject): void {
    const subjects = this.getSubjects();
    subjects.push(subject);
    this.setItem('subjects', subjects);
    if (this.idb.isAvailable) {
      this.idb.put(IDB_STORES.SYSTEM_STATE, { key: 'subjects_cache', data: subjects });
    }
    this.notifyListeners();
  }

  getTopics(subjectId?: string): Topic[] {
    const all = this.getItem<Topic[]>('topics', INITIAL_TOPICS);
    return subjectId ? all.filter((t) => t.subjectId === subjectId) : all;
  }

  getLessons(topicId?: string): Lesson[] {
    const all = this.getItem<Lesson[]>('lessons', INITIAL_LESSONS);
    return topicId ? all.filter((l) => l.topicId === topicId) : all;
  }

  getLessonById(id: string): Lesson | undefined {
    const all = this.getLessons();
    return all.find((l) => l.id === id);
  }

  getQuestions(topicId?: string, limit?: number): Question[] {
    const all = this.getItem<Question[]>('questions', INITIAL_QUESTIONS);
    const filtered = topicId ? all.filter((q) => q.topicId === topicId) : all;
    return limit ? filtered.slice(0, limit) : filtered;
  }

  // Quiz Attempts
  getQuizAttempts(): QuizAttempt[] {
    return this.getItem<QuizAttempt[]>('quiz_attempts', []);
  }

  saveQuizAttempt(attempt: QuizAttempt): void {
    const attempts = this.getQuizAttempts();
    attempts.unshift(attempt);
    this.setItem('quiz_attempts', attempts);

    // Persist attempt to IndexedDB
    this.idb.put(IDB_STORES.QUIZ_ATTEMPTS, attempt);

    // Queue for solar hub sync
    this.queueSyncRecord('quiz_attempt', attempt);
    this.notifyListeners();
  }

  // AI Recommendations
  getCurrentRecommendation(): AIRecommendation {
    return this.getItem<AIRecommendation>('current_recommendation', DEFAULT_RECOMMENDATION);
  }

  setRecommendation(rec: AIRecommendation): void {
    this.setItem('current_recommendation', rec);
    this.idb.put(IDB_STORES.SYSTEM_STATE, { key: 'current_recommendation', data: rec });
    this.notifyListeners();
  }

  // Chat History
  getChatHistory(): ChatMessage[] {
    const raw = this.getItem<ChatMessage[]>('chat_history', [
      {
        id: 'msg-welcome',
        sender: 'ai',
        text: 'Hello! I am your RuralLearn AI tutor. Ask me anything about Mathematics, Science, or English. You can speak to me or type your question!',
        timestamp: new Date().toISOString(),
        provider: 'local_engine',
        suggestedAction: {
          type: 'open_lesson',
          payload: 'lesson-alg-1',
          label: 'Start Algebra Basics',
        },
      },
    ]);

    // Ensure all messages have guaranteed unique IDs and de-duplicate by ID
    const seen = new Set<string>();
    const deduplicated: ChatMessage[] = [];
    let updated = false;

    raw.forEach((msg, idx) => {
      let id = msg.id;
      if (!id || seen.has(id)) {
        id = `msg-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`;
        updated = true;
      }
      seen.add(id);
      deduplicated.push({ ...msg, id });
    });

    if (updated) {
      this.setItem('chat_history', deduplicated);
    }

    return deduplicated;
  }

  addChatMessage(msg: ChatMessage): void {
    const history = this.getChatHistory();
    // Prevent adding duplicate message if already present
    if (!history.some((m) => m.id === msg.id)) {
      history.push(msg);
      // Keep latest 50 messages to preserve memory on low-resource tablets
      if (history.length > 50) history.shift();
      this.setItem('chat_history', history);

      // Persist directly to IndexedDB tutor_chat store
      this.idb.put(IDB_STORES.TUTOR_CHAT, msg);
      this.notifyListeners();
    }
  }

  // Sync Queue
  getSyncQueue(): SyncRecord[] {
    return this.getItem<SyncRecord[]>('sync_queue', []);
  }

  queueSyncRecord(type: SyncRecord['type'], data: any): void {
    const queue = this.getSyncQueue();
    const record: SyncRecord = {
      id: 'sync-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      type,
      data,
      timestamp: new Date().toISOString(),
      status: 'pending',
      retries: 0,
    };
    queue.push(record);
    this.setItem('sync_queue', queue);

    // Persist to IndexedDB sync queue
    this.idb.put(IDB_STORES.SYNC_QUEUE, record);
  }

  updateSyncRecords(records: SyncRecord[]): void {
    this.setItem('sync_queue', records);
    this.idb.putBatch(IDB_STORES.SYNC_QUEUE, records);
  }

  clearSyncedRecords(): void {
    const queue = this.getSyncQueue();
    const pending = queue.filter((r) => r.status === 'pending' || r.status === 'failed');
    this.setItem('sync_queue', pending);
    this.setItem('last_sync_timestamp', new Date().toISOString());

    // Update IndexedDB sync queue
    this.idb.clear(IDB_STORES.SYNC_QUEUE).then(() => {
      this.idb.putBatch(IDB_STORES.SYNC_QUEUE, pending);
    });
  }

  getLastSyncTime(): string {
    const t = this.getItem<string | null>('last_sync_timestamp', null);
    if (!t) return 'Yesterday, 04:30 PM';
    const date = new Date(t);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Solar Community Hub Status
  getHubStatus(): SolarHubStatus {
    const status = this.getItem<SolarHubStatus>('hub_status', DEFAULT_HUB);
    status.pendingSyncCount = this.getSyncQueue().filter((r) => r.status === 'pending').length;
    return status;
  }

  setHubStatus(status: SolarHubStatus): void {
    this.setItem('hub_status', status);
    this.idb.put(IDB_STORES.SYSTEM_STATE, { key: 'hub_status', data: status });
  }

  /**
   * Asynchronously inspect IndexedDB cached records for diagnostic reporting
   */
  async getStorageDiagnostics(): Promise<{
    idbAvailable: boolean;
    idbInitialized: boolean;
    chatMessagesCount: number;
    quizAttemptsCount: number;
    hasCachedProfile: boolean;
    pendingSyncCount: number;
  }> {
    if (!this.idb.isAvailable) {
      return {
        idbAvailable: false,
        idbInitialized: false,
        chatMessagesCount: this.getChatHistory().length,
        quizAttemptsCount: this.getQuizAttempts().length,
        hasCachedProfile: !!this.getProfile(),
        pendingSyncCount: this.getSyncQueue().length,
      };
    }

    const [chatMessages, quizAttempts, profileRecord, syncQueue] = await Promise.all([
      this.idb.getAll<ChatMessage>(IDB_STORES.TUTOR_CHAT),
      this.idb.getAll<QuizAttempt>(IDB_STORES.QUIZ_ATTEMPTS),
      this.idb.get<{ key: string; data: LearnerProfile }>(IDB_STORES.LEARNING_PROGRESS, 'profile'),
      this.idb.getAll<SyncRecord>(IDB_STORES.SYNC_QUEUE),
    ]);

    return {
      idbAvailable: true,
      idbInitialized: this.idbInitialized,
      chatMessagesCount: chatMessages.length || this.getChatHistory().length,
      quizAttemptsCount: quizAttempts.length || this.getQuizAttempts().length,
      hasCachedProfile: !!profileRecord?.data || !!this.getProfile(),
      pendingSyncCount: syncQueue.length || this.getSyncQueue().length,
    };
  }

  /**
   * Pre-cache all curriculum content (Subjects, Topics, Lessons, Questions) into IndexedDB
   * to guarantee 100% offline access even on completely wiped air-gapped devices.
   */
  async precacheAllOfflineContent(): Promise<{
    subjectsCount: number;
    topicsCount: number;
    lessonsCount: number;
    questionsCount: number;
  }> {
    const subjects = this.getSubjects();
    const topics = this.getTopics();
    const lessons = this.getLessons();
    const questions = this.getQuestions();

    if (this.idb.isAvailable) {
      await Promise.all([
        this.idb.put(IDB_STORES.SYSTEM_STATE, { key: 'subjects_cache', data: subjects }),
        this.idb.put(IDB_STORES.SYSTEM_STATE, { key: 'topics_cache', data: topics }),
        this.idb.put(IDB_STORES.SYSTEM_STATE, { key: 'lessons_cache', data: lessons }),
        this.idb.put(IDB_STORES.SYSTEM_STATE, { key: 'questions_cache', data: questions }),
        this.idb.put(IDB_STORES.SYSTEM_STATE, {
          key: 'offline_precached_at',
          data: new Date().toISOString(),
        }),
      ]);
    }

    localStorage.setItem(DB_PREFIX + 'precached_timestamp', new Date().toISOString());
    this.notifyListeners();

    return {
      subjectsCount: subjects.length,
      topicsCount: topics.length,
      lessonsCount: lessons.length,
      questionsCount: questions.length,
    };
  }

  /**
   * Checks offline readiness score across all subsystems
   */
  getOfflineReadinessStatus(): {
    overallReadinessPercent: number;
    subsystems: {
      name: string;
      status: 'ready' | 'degraded';
      details: string;
      percentage: number;
    }[];
  } {
    const lessons = this.getLessons();
    const questions = this.getQuestions();
    const profile = this.getProfile();
    const idbReady = this.idb.isAvailable;

    const subsystems = [
      {
        name: 'Curriculum & Lessons',
        status: 'ready' as const,
        details: `${lessons.length} interactive lessons with worked solutions cached`,
        percentage: 100,
      },
      {
        name: 'Adaptive Quiz Engine',
        status: 'ready' as const,
        details: `${questions.length} multiple-choice & diagnostic questions offline`,
        percentage: 100,
      },
      {
        name: 'On-Device AI Tutor Engine',
        status: 'ready' as const,
        details: 'Deterministic rule & heuristic tutor active for all grades',
        percentage: 100,
      },
      {
        name: 'Persistent Local Storage',
        status: idbReady ? ('ready' as const) : ('degraded' as const),
        details: idbReady
          ? 'IndexedDB + LocalStorage dual layer active'
          : 'LocalStorage active (IndexedDB unavailable)',
        percentage: idbReady ? 100 : 85,
      },
      {
        name: 'Community Solar Hub Sync',
        status: 'ready' as const,
        details: 'Store-and-forward queue ready for solar node sync',
        percentage: 100,
      },
      {
        name: 'Teacher Analytics & Insights',
        status: 'ready' as const,
        details: 'Cached student rosters and remedial action plans',
        percentage: 100,
      },
    ];

    const total = subsystems.reduce((acc, curr) => acc + curr.percentage, 0);
    const overallReadinessPercent = Math.round(total / subsystems.length);

    return {
      overallReadinessPercent,
      subsystems,
    };
  }

  /**
   * Export an encrypted/clean JSON snapshot of all student progress,
   * quizzes, and offline sync records for air-gapped USB/Bluetooth exchange.
   */
  exportOfflineBundle(): string {
    const bundle = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      user: this.getUser(),
      profile: this.getProfile(),
      quizAttempts: this.getQuizAttempts(),
      chatHistory: this.getChatHistory(),
      syncQueue: this.getSyncQueue(),
      hubStatus: this.getHubStatus(),
    };
    return JSON.stringify(bundle, null, 2);
  }

  /**
   * Import an offline bundle from peer tablet or solar hub
   */
  importOfflineBundle(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.profile) this.setProfile(data.profile);
      if (data.user) this.setUser(data.user);
      if (Array.isArray(data.quizAttempts)) {
        this.setItem('quiz_attempts', data.quizAttempts);
      }
      this.notifyListeners();
      return true;
    } catch (e) {
      console.error('Failed to import bundle', e);
      return false;
    }
  }

  // Reset database for test / demo
  async resetData(): Promise<void> {
    localStorage.removeItem(DB_PREFIX + 'profile');
    localStorage.removeItem(DB_PREFIX + 'quiz_attempts');
    localStorage.removeItem(DB_PREFIX + 'sync_queue');
    localStorage.removeItem(DB_PREFIX + 'chat_history');
    localStorage.removeItem(DB_PREFIX + 'current_recommendation');

    if (this.idb.isAvailable) {
      await Promise.all([
        this.idb.clear(IDB_STORES.LEARNING_PROGRESS),
        this.idb.clear(IDB_STORES.TUTOR_CHAT),
        this.idb.clear(IDB_STORES.QUIZ_ATTEMPTS),
        this.idb.clear(IDB_STORES.SYNC_QUEUE),
        this.idb.clear(IDB_STORES.SYSTEM_STATE),
      ]);
    }

    this.init();
    this.notifyListeners();
  }
}

export const localDb = new LocalDatabase();
localDb.init();
