import { ChatMessage, LearnerProfile, AIRecommendation, TutorMode, NetworkStatus, TransportType } from '../types';
import { localAiEngine } from './localAiEngine';
import { localDb } from './localDb';
import { messageService } from './messageService';
import { slowNetService } from './slowNetService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface AIResponse {
  text: string;
  provider: 'local_engine' | 'cloud_gemini';
  transport?: TransportType;
  rawSmsPayload?: string;
  smsReplyPayload?: string;
  charCount?: number;
  mode?: TutorMode;
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
}

class AIService {
  /**
   * Primary entry point for tutoring chat queries across all 4 network transports
   */
  public async askTutor(
    query: string,
    profile: LearnerProfile,
    networkStatus: NetworkStatus = 'online',
    mode: TutorMode = 'explain',
    history: ChatMessage[] = []
  ): Promise<AIResponse> {
    const user = localDb.getUser();
    const studentId = user?.id || 'student-rahul-01';
    const studentGrade = user?.grade || 7;
    const studentLang = user?.language || 'en';

    // 1. CELLULAR SMS / MESSAGE FALLBACK TRANSPORT
    if (networkStatus === 'message_fallback') {
      const { replyText, rawOutbound, rawInbound } = await messageService.sendAskQuery(studentId, query);
      return {
        text: replyText,
        provider: 'local_engine',
        transport: 'SMS_FALLBACK',
        rawSmsPayload: rawOutbound,
        smsReplyPayload: rawInbound,
        charCount: rawOutbound.length,
        mode,
        suggestedAction: {
          type: 'practice',
          payload: 'math-fractions',
          label: 'Practice Math Challenge',
        },
        followUps: [
          'Can you show another example?',
          'How does this work in real life?',
          'Give me a practice question.',
        ],
      };
    }

    // 2. 100% OFFLINE ON-DEVICE AI ENGINE
    if (networkStatus === 'offline') {
      const localResult = localAiEngine.generateOfflineResponse(query, profile, mode);
      return {
        text: localResult.text,
        provider: 'local_engine',
        transport: 'LOCAL_RULES',
        mode,
        suggestedAction: localResult.action,
        followUps: localResult.followUps,
        practiceQuestion: localResult.practiceQuestion,
      };
    }

    // 3. LOW BANDWIDTH / SLOW NET TRANSPORT (<500B token-compressed, timeout failover to SMS)
    if (networkStatus === 'low_bandwidth') {
      const { compressed } = slowNetService.compressPrompt(query);

      try {
        const result = await slowNetService.executeWithSlowNetBudget(async (signal) => {
          const res = await fetch(`${API_URL}/api/ai/chat`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-SlowNet-Compression': 'active',
            },
            body: JSON.stringify({
              query: compressed,
              mode: 'quick_summary',
              history: [], // Omit history to minimize bandwidth
              learnerContext: {
                grade: studentGrade,
                language: studentLang,
                level: profile.overallLevel,
                speed: profile.currentSpeed,
              },
            }),
            signal,
          });

          if (!res.ok) throw new Error(`Server returned HTTP ${res.status}`);
          return await res.json();
        }, 3400);

        if (result?.text) {
          return {
            text: result.text,
            provider: 'cloud_gemini',
            transport: 'LOW_BW_COMPACT',
            mode: 'quick_summary',
            suggestedAction: result.suggestedAction,
            followUps: (result.followUps || []).slice(0, 2),
          };
        }
      } catch (err: any) {
        console.warn('[Slow Net Pipeline] 2G link stalled or timed out. Triggering fallback...', err.message);

        // Auto-Degradation to Cellular SMS Fallback if enabled
        if (slowNetService.getMetrics().autoFallbackToSms) {
          const { replyText, rawOutbound, rawInbound } = await messageService.sendAskQuery(studentId, query);
          return {
            text: `[Slow Net 2G Stalled → Auto SMS Fallback]\n\n${replyText}`,
            provider: 'local_engine',
            transport: 'SMS_FALLBACK',
            rawSmsPayload: rawOutbound,
            smsReplyPayload: rawInbound,
            charCount: rawOutbound.length,
            mode: 'quick_summary',
            suggestedAction: {
              type: 'practice',
              payload: 'math-fractions',
              label: 'Practice Math Challenge',
            },
            followUps: ['Show another example', 'Solve step by step'],
          };
        }
      }

      // Final on-device local engine fallback
      const localResult = localAiEngine.generateOfflineResponse(query, profile, 'quick_summary');
      return {
        text: localResult.text,
        provider: 'local_engine',
        transport: 'LOW_BW_COMPACT',
        mode: 'quick_summary',
        suggestedAction: localResult.action,
        followUps: localResult.followUps?.slice(0, 2),
      };
    }


    // 4. FULL ONLINE HTTPS (Gemini 3.8 Flash Cloud + Local Fallback)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(`${API_URL}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          mode,
          history: history.slice(-4).map((m) => ({ sender: m.sender, text: m.text })),
          learnerContext: {
            grade: studentGrade,
            language: studentLang,
            level: profile.overallLevel,
            speed: profile.currentSpeed,
            weakTopics: Object.values(profile.topicMasteries)
              .filter((m) => m.status === 'needs_practice')
              .map((m) => m.topicTitle),
            strongTopics: Object.values(profile.topicMasteries)
              .filter((m) => m.status === 'strong')
              .map((m) => m.topicTitle),
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data.text) {
          return {
            text: data.text,
            provider: 'cloud_gemini',
            transport: 'ONLINE_HTTPS',
            mode,
            suggestedAction: data.suggestedAction,
            followUps: data.followUps,
            practiceQuestion: data.practiceQuestion,
          };
        }
      }
    } catch (e) {
      console.warn('Cloud AI endpoint unreachable or timed out. Falling back to On-Device AI Engine.', e);
    }

    // Fallback to Local AI Engine seamlessly
    const localResult = localAiEngine.generateOfflineResponse(query, profile, mode);
    return {
      text: localResult.text,
      provider: 'local_engine',
      transport: 'ONLINE_HTTPS',
      mode,
      suggestedAction: localResult.action,
      followUps: localResult.followUps,
      practiceQuestion: localResult.practiceQuestion,
    };
  }

  /**
   * Get personalized recommendation
   */
  public getNextRecommendation(): AIRecommendation {
    return localDb.getCurrentRecommendation();
  }
}

export const aiService = new AIService();
