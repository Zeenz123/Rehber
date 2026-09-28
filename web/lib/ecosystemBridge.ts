'use client';

export interface EcosystemEvent {
  id: string;
  type:
    | 'SMS_DISPATCHED'
    | 'SMS_RECEIVED'
    | 'SYNC_BATCH_QUEUED'
    | 'SYNC_BATCH_PUSHED'
    | 'TEACHER_INTERVENTION'
    | 'NETWORK_MODE_CHANGED'
    | 'SLOW_NET_TELEMETRY';
  studentId: string;
  payload: any;
  timestamp: string;
  source: 'student_app' | 'web_portal' | 'sms_gateway' | 'fastapi_backend';
}

type EventHandler = (event: EcosystemEvent) => void;

class WebEcosystemBridge {
  private channel: BroadcastChannel | null = null;
  private handlers: Set<EventHandler> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        if ('BroadcastChannel' in window) {
          this.channel = new BroadcastChannel('rehber_ecosystem_bus');
          this.channel.onmessage = (msg: MessageEvent) => {
            if (msg.data && msg.data.type) {
              this.dispatch(msg.data as EcosystemEvent);
            }
          };
        }
      } catch (e) {
        console.warn('BroadcastChannel unavailable in browser environment');
      }

      window.addEventListener('storage', (e: StorageEvent) => {
        if (e.key === 'rehber_ecosystem_event' && e.newValue) {
          try {
            const ev = JSON.parse(e.newValue) as EcosystemEvent;
            this.dispatch(ev);
          } catch {}
        }
      });
    }
  }

  private dispatch(event: EcosystemEvent) {
    this.handlers.forEach((h) => {
      try {
        h(event);
      } catch (err) {
        console.error('Error handling ecosystem event in Web:', err);
      }
    });
  }

  public subscribe(handler: EventHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  public emit(
    type: EcosystemEvent['type'],
    studentId: string,
    payload: any,
    source: EcosystemEvent['source'] = 'web_portal'
  ): EcosystemEvent {
    const event: EcosystemEvent = {
      id: `ev-web-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      studentId,
      payload,
      timestamp: new Date().toISOString(),
      source,
    };

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('rehber_ecosystem_event', JSON.stringify(event));
      } catch {}

      if (this.channel) {
        try {
          this.channel.postMessage(event);
        } catch {}
      }
    }

    this.dispatch(event);
    return event;
  }
}

export const webEcosystemBridge = new WebEcosystemBridge();
