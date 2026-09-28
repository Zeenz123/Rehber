import { SmsProtocol, SmsActionCode } from './smsProtocol';
import { SmsMessageLog } from '../types';
import { solveStudentQuery } from './exactSolver';
import { localDb } from './localDb';
import { ecosystemBridge } from './ecosystemBridge';


const SMS_STORAGE_KEY = 'rehber_sms_message_logs_v1';

class MessageService {
  private logs: SmsMessageLog[] = [];
  private listeners: Array<(logs: SmsMessageLog[]) => void> = [];

  constructor() {
    this.loadLogs();
  }

  private loadLogs(): void {
    try {
      const stored = localStorage.getItem(SMS_STORAGE_KEY);
      if (stored) {
        this.logs = JSON.parse(stored);
      } else {
        // Seed initial demo messages
        this.logs = [
          {
            id: 'sms-demo-1',
            studentId: 'STU101',
            actionCode: 'ASK',
            direction: 'inbound',
            rawPayload: 'STU101#ASK#Why is 1/2 bigger than 1/4?',
            decodedText: 'Why is 1/2 bigger than 1/4?',
            status: 'sent',
            timestamp: new Date(Date.now() - 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            charCount: 38,
            segments: 1,
          },
          {
            id: 'sms-demo-2',
            studentId: 'STU101',
            actionCode: 'ANS',
            direction: 'outbound',
            rawPayload: 'STU101#ANS#Half a roti (1/2) is larger because you share among 2 people instead of 4.',
            decodedText: 'Half a roti (1/2) is larger because you share among 2 people instead of 4.',
            status: 'received',
            timestamp: new Date(Date.now() - 3590000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            charCount: 78,
            segments: 1,
          },
        ];
        this.persist();
      }
    } catch {
      this.logs = [];
    }
  }

  private persist(): void {
    try {
      localStorage.setItem(SMS_STORAGE_KEY, JSON.stringify(this.logs.slice(0, 100)));
      this.notify();
    } catch (e) {
      console.warn('Failed to persist SMS logs', e);
    }
  }

  public subscribe(callback: (logs: SmsMessageLog[]) => void): () => void {
    this.listeners.push(callback);
    callback(this.logs);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn(this.logs));
    window.dispatchEvent(new CustomEvent('rehber_sms_updated'));
  }

  public getLogs(): SmsMessageLog[] {
    return [...this.logs];
  }

  public clearLogs(): void {
    this.logs = [];
    this.persist();
  }

  public calculateMetrics(text: string): { chars: number; segments: number; maxCharsPerSegment: number } {
    const chars = text.length;
    const maxCharsPerSegment = 160;
    const segments = Math.max(1, Math.ceil(chars / 160));
    return { chars, segments, maxCharsPerSegment };
  }

  private logMessage(
    studentId: string,
    actionCode: string,
    direction: 'inbound' | 'outbound',
    rawPayload: string,
    decodedText?: string,
    status: 'sent' | 'received' | 'simulated' = 'sent'
  ): SmsMessageLog {
    const metrics = this.calculateMetrics(rawPayload);
    const entry: SmsMessageLog = {
      id: `sms-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      studentId,
      actionCode,
      direction,
      rawPayload,
      decodedText,
      status,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      charCount: metrics.chars,
      segments: metrics.segments,
    };
    this.logs.unshift(entry);
    this.persist();
    ecosystemBridge.emitSms(entry, direction === 'inbound' ? 'student_app' : 'sms_gateway');
    return entry;
  }


  /**
   * Dispatches an SMS payload to backend webhook, falling back to on-device logic
   */
  public async dispatchSms(rawPayload: string): Promise<string> {
    try {
      const parsed = SmsProtocol.parse(rawPayload);

      // Attempt sending to FastAPI backend or local server webhook
      const endpoints = [
        'http://localhost:8000/api/sms/webhook',
        '/api/sms/webhook',
      ];

      for (const endpoint of endpoints) {
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 2500);
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              from_number: '+923001234567',
              body: rawPayload,
            }),
            signal: controller.signal,
          });
          clearTimeout(timer);

          if (res.ok) {
            const data = await res.json();
            if (data.reply_sms) {
              return data.reply_sms;
            }
          }
        } catch {
          // Try next endpoint or local simulation
        }
      }

      // On-Device Deterministic Simulation Fallback
      return this.simulateLocalSmsResponse(parsed);
    } catch (e: any) {
      return SmsProtocol.buildError('UNKNOWN', 'ERR_PARSE', e.message || 'Malformed message');
    }
  }

  /**
   * On-device local SMS simulation matching Rehber SMS router logic
   */
  private simulateLocalSmsResponse(parsed: ReturnType<typeof SmsProtocol.parse>): string {
    const { studentId, actionCode, parsedPayload } = parsed;

    switch (actionCode) {
      case SmsActionCode.ASK: {
        const query = parsedPayload.query || '';
        const exact = solveStudentQuery(query, 'explain', 7);
        const cleanAnswer = exact.text.replace(/[*#_`]/g, '').trim();
        return SmsProtocol.buildAnswer(studentId, cleanAnswer);
      }
      case SmsActionCode.QZ: {
        const answers = parsedPayload.answers || {};
        const count = Object.keys(answers).length;
        // Deterministic simulated calculation
        const score = 80;
        const delta = 0.15;
        return SmsProtocol.buildQuizResult(studentId, score, delta, 'MOD_MATH_02');
      }
      case SmsActionCode.REG: {
        const name = parsedPayload.name || 'Student';
        return SmsProtocol.buildAck(studentId, 'OK', 'REG_SUCCESS', name);
      }
      case SmsActionCode.PGR: {
        const modId = parsedPayload.moduleId || 'MOD_01';
        return SmsProtocol.buildAck(studentId, 'OK', 'PGR_SAVED', modId);
      }
      default:
        return SmsProtocol.buildAck(studentId, 'OK', 'MSG_RECEIVED');
    }
  }

  /**
   * Student asks question via Cellular SMS
   */
  public async sendAskQuery(
    studentId: string,
    query: string
  ): Promise<{ replyText: string; rawOutbound: string; rawInbound: string }> {
    const rawOutbound = SmsProtocol.serializeAsk(studentId, query);
    this.logMessage(studentId, 'ASK', 'inbound', rawOutbound, query, 'sent');

    const rawInbound = await this.dispatchSms(rawOutbound);

    let replyText = rawInbound;
    try {
      const parsedReply = SmsProtocol.parse(rawInbound);
      replyText = parsedReply.parsedPayload.answer || rawInbound;
      this.logMessage(studentId, parsedReply.actionCode, 'outbound', rawInbound, replyText, 'received');
    } catch {
      this.logMessage(studentId, 'ANS', 'outbound', rawInbound, replyText, 'received');
    }

    return { replyText, rawOutbound, rawInbound };
  }

  /**
   * Student submits quiz via Cellular SMS
   */
  public async sendQuizSubmission(
    studentId: string,
    quizId: string,
    answers: Record<string, string>
  ): Promise<{ resultText: string; rawOutbound: string; rawInbound: string }> {
    const rawOutbound = SmsProtocol.serializeQuiz(studentId, quizId, answers);
    this.logMessage(studentId, 'QZ', 'inbound', rawOutbound, `Quiz: ${quizId}`, 'sent');

    const rawInbound = await this.dispatchSms(rawOutbound);
    this.logMessage(studentId, 'RES', 'outbound', rawInbound, `Result: ${rawInbound}`, 'received');

    return { resultText: rawInbound, rawOutbound, rawInbound };
  }

  /**
   * Student registers or synchronizes profile via Cellular SMS
   */
  public async sendRegistration(
    studentId: string,
    name: string,
    grade: number,
    language: string
  ): Promise<{ ackText: string; rawOutbound: string; rawInbound: string }> {
    const rawOutbound = SmsProtocol.serializeRegistration(studentId, name, grade, language);
    this.logMessage(studentId, 'REG', 'inbound', rawOutbound, `Reg: ${name}, Gr: ${grade}`, 'sent');

    const rawInbound = await this.dispatchSms(rawOutbound);
    this.logMessage(studentId, 'ACK', 'outbound', rawInbound, `Ack: ${rawInbound}`, 'received');

    return { ackText: rawInbound, rawOutbound, rawInbound };
  }
}

export const messageService = new MessageService();
