/**
 * Rehber Low-Bandwidth / Cellular SMS Communication Protocol.
 * Standard Format: [StudentID]#[ActionCode]#[PayloadData]
 */

export enum SmsActionCode {
  REG = 'REG',
  QZ = 'QZ',
  ASK = 'ASK',
  PGR = 'PGR',
  ACK = 'ACK',
  RES = 'RES',
  ANS = 'ANS',
  ERR = 'ERR',
}

export interface ParsedSmsMessage {
  studentId: string;
  actionCode: SmsActionCode;
  rawPayload: string;
  parsedPayload: Record<string, any>;
  isValid: boolean;
  errorMessage?: string;
}

export class SmsProtocol {
  static readonly SEGMENT_DELIMITER = '#';
  static readonly FIELD_DELIMITER = '|';
  static readonly SUBFIELD_DELIMITER = ':';

  private static readonly MESSAGE_REGEX = /^([A-Za-z0-9_-]+)#([A-Z]{2,4})#(.*)$/s;

  static escapeText(text: string): string {
    return text.replace(/\\/g, '\\\\').replace(/#/g, '\\#').replace(/\|/g, '\\|');
  }

  static unescapeText(text: string): string {
    return text.replace(/\\#/g, '#').replace(/\\\|/g, '|').replace(/\\\\/g, '\\');
  }

  static serializeRegistration(studentId: string, name: string, grade: string | number, language: string): string {
    const payload = `${this.escapeText(name)}|${grade}|${this.escapeText(language)}`;
    return `${studentId}#${SmsActionCode.REG}#${payload}`;
  }

  static serializeQuiz(studentId: string, quizId: string, answers: Record<string, string>): string {
    const ansList = Object.entries(answers).map(([k, v]) => `${k}:${v}`).join(',');
    return `${studentId}#${SmsActionCode.QZ}#${quizId}|${ansList}`;
  }

  static serializeAsk(studentId: string, query: string): string {
    return `${studentId}#${SmsActionCode.ASK}#${this.escapeText(query.trim())}`;
  }

  static serializeProgress(studentId: string, moduleId: string, score: number, timeSeconds: number): string {
    return `${studentId}#${SmsActionCode.PGR}#${moduleId}|${score}|${timeSeconds}`;
  }

  static buildAck(studentId: string, status: string, syncCode: string, details?: string): string {
    return `${studentId}#${SmsActionCode.ACK}#${status}|${syncCode}${details ? `|${this.escapeText(details)}` : ''}`;
  }

  static buildQuizResult(studentId: string, score: number, masteryDelta: number, nextModule: string): string {
    const deltaSign = masteryDelta >= 0 ? '+' : '';
    return `${studentId}#${SmsActionCode.RES}#QZ|Score:${Math.round(score)}%|Mastery:${deltaSign}${masteryDelta.toFixed(2)}|Next:${nextModule}`;
  }

  static buildAnswer(studentId: string, answerText: string): string {
    // Truncate cleanly if exceeds maximum SMS multi-segment length (e.g. 320 chars)
    const cleanAnswer = answerText.replace(/[*#_`]/g, '').trim();
    const truncated = cleanAnswer.length > 320 ? cleanAnswer.slice(0, 317) + '...' : cleanAnswer;
    return `${studentId}#${SmsActionCode.ANS}#${this.escapeText(truncated)}`;
  }

  static buildError(studentId: string, code: string, message: string): string {
    return `${studentId}#${SmsActionCode.ERR}#${code}|${this.escapeText(message)}`;
  }

  static parse(rawMessage: string): ParsedSmsMessage {
    const trimmed = (rawMessage || '').trim();
    if (!trimmed) {
      throw new Error('Message is empty');
    }

    const match = this.MESSAGE_REGEX.exec(trimmed);
    if (!match) {
      throw new Error('Invalid format. Expected [StudentID]#[ActionCode]#[PayloadData]');
    }

    const [, studentId, actionStr, rawPayload] = match;
    const actionCode = actionStr as SmsActionCode;

    if (!Object.values(SmsActionCode).includes(actionCode)) {
      throw new Error(`Unsupported action code: ${actionStr}`);
    }

    let parsedPayload: Record<string, any> = {};

    switch (actionCode) {
      case SmsActionCode.REG: {
        const parts = rawPayload.split(this.FIELD_DELIMITER).map((p) => this.unescapeText(p));
        if (parts.length < 3) throw new Error('REG requires Name|Grade|Language');
        parsedPayload = { name: parts[0], grade: parts[1], language: parts[2] };
        break;
      }
      case SmsActionCode.QZ: {
        const parts = rawPayload.split(this.FIELD_DELIMITER);
        if (parts.length < 2) throw new Error('QZ requires QuizID|AnsString');
        const answers: Record<string, string> = {};
        if (parts[1]) {
          parts[1].split(',').forEach((pair) => {
            const [qId, ans] = pair.split(this.SUBFIELD_DELIMITER);
            if (qId && ans) answers[qId.trim()] = ans.trim();
          });
        }
        parsedPayload = { quizId: parts[0], answers, rawAnswers: parts[1] };
        break;
      }
      case SmsActionCode.ASK: {
        const query = this.unescapeText(rawPayload);
        if (!query) throw new Error('ASK query text is required');
        parsedPayload = { query };
        break;
      }
      case SmsActionCode.PGR: {
        const parts = rawPayload.split(this.FIELD_DELIMITER);
        if (parts.length < 3) throw new Error('PGR requires ModuleID|Score|Time');
        parsedPayload = {
          moduleId: parts[0],
          score: parseFloat(parts[1]) || 0,
          timeSeconds: parseInt(parts[2], 10) || 0,
        };
        break;
      }
      case SmsActionCode.ANS: {
        parsedPayload = { answer: this.unescapeText(rawPayload) };
        break;
      }
      case SmsActionCode.RES: {
        const parts = rawPayload.split(this.FIELD_DELIMITER);
        parsedPayload = { raw: parts };
        break;
      }
      default:
        parsedPayload = { raw: rawPayload };
        break;
    }

    return {
      studentId,
      actionCode,
      rawPayload,
      parsedPayload,
      isValid: true,
    };
  }
}
