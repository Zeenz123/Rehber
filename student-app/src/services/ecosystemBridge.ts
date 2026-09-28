import { EcosystemEvent, EcosystemEventType, SmsMessageLog } from '../types';

type EventHandler = (event: EcosystemEvent) => void;

class EcosystemBridge {
  private channel: BroadcastChannel | null = null;
  private handlers: Set<EventHandler> = new Set();
  private eventHistory: EcosystemEvent[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        if ('BroadcastChannel' in window) {
          this.channel = new BroadcastChannel('rehber_ecosystem_bus');
          this.channel.onmessage = (msg: MessageEvent) => {
            if (msg.data && msg.data.type) {
              this.handleIncomingEvent(msg.data as EcosystemEvent);
            }
          };
        }
      } catch (e) {
        console.warn('BroadcastChannel unavailable, falling back to storage events');
      }

      window.addEventListener('storage', (e: StorageEvent) => {
        if (e.key === 'rehber_ecosystem_event' && e.newValue) {
          try {
            const ev = JSON.parse(e.newValue) as EcosystemEvent;
            this.handleIncomingEvent(ev);
          } catch {}
        }
      });

      // Load initial history from localStorage
      try {
        const stored = localStorage.getItem('rehber_ecosystem_history');
        if (stored) {
          this.eventHistory = JSON.parse(stored).slice(-30);
        }
      } catch {}
    }
  }

  private handleIncomingEvent(event: EcosystemEvent) {
    this.eventHistory.push(event);
    if (this.eventHistory.length > 50) this.eventHistory.shift();

    this.handlers.forEach((h) => {
      try {
        h(event);
      } catch (err) {
        console.error('Error in ecosystem event handler:', err);
      }
    });
  }

  public subscribe(handler: EventHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  public emit(
    type: EcosystemEventType,
    studentId: string,
    payload: any,
    source: EcosystemEvent['source'] = 'student_app'
  ): EcosystemEvent {
    const event: EcosystemEvent = {
      id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      studentId,
      payload,
      timestamp: new Date().toISOString(),
      source,
    };

    this.eventHistory.push(event);
    if (this.eventHistory.length > 50) this.eventHistory.shift();

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('rehber_ecosystem_history', JSON.stringify(this.eventHistory));
        localStorage.setItem('rehber_ecosystem_event', JSON.stringify(event));
      } catch {}

      if (this.channel) {
        try {
          this.channel.postMessage(event);
        } catch {}
      }
    }

    // Trigger local listeners too
    this.handlers.forEach((h) => h(event));

    return event;
  }

  public emitSms(smsLog: SmsMessageLog, source: EcosystemEvent['source'] = 'student_app') {
    return this.emit('SMS_DISPATCHED', smsLog.studentId, smsLog, source);
  }

  public emitSyncBatch(studentId: string, records: any[], status: string) {
    return this.emit('SYNC_BATCH_PUSHED', studentId, { recordsCount: records.length, status, records });
  }

  public emitNetworkChange(studentId: string, networkStatus: string) {
    return this.emit('NETWORK_MODE_CHANGED', studentId, { networkStatus });
  }

  public getHistory(): EcosystemEvent[] {
    return [...this.eventHistory];
  }
}

export const ecosystemBridge = new EcosystemBridge();
