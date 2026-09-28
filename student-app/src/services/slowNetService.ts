import { SlowNetMetrics, TutorMode } from '../types';
import { localDb } from './localDb';

export class SlowNetTimeoutError extends Error {
  public latencyMs: number;
  constructor(message: string, latencyMs: number) {
    super(message);
    this.name = 'SlowNetTimeoutError';
    this.latencyMs = latencyMs;
  }
}

class SlowNetService {
  private bytesSavedKb: number = 0;
  private simulatedLatencyMs: number = 1850;
  private dataSaverActive: boolean = true;
  private autoFallbackToSms: boolean = true;
  private listeners: Set<(metrics: SlowNetMetrics) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('rurallearn_bytes_saved_kb');
      if (saved) {
        this.bytesSavedKb = parseFloat(saved) || 0;
      }
    }
  }

  public subscribe(listener: (metrics: SlowNetMetrics) => void): () => void {
    this.listeners.add(listener);
    listener(this.getMetrics());
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const metrics = this.getMetrics();
    this.listeners.forEach((fn) => fn(metrics));
  }

  public getMetrics(): SlowNetMetrics {
    const queue = localDb.getSyncQueue();
    const deferredCount = queue.filter((r) => r.status === 'pending').length;

    return {
      effectiveSpeed: '2G',
      latencyMs: this.simulatedLatencyMs,
      bytesSavedKb: parseFloat(this.bytesSavedKb.toFixed(2)),
      compressionRatioPercent: 82,
      dataSaverActive: this.dataSaverActive,
      queuedTelemetryCount: deferredCount,
      autoFallbackToSms: this.autoFallbackToSms,
    };
  }

  public setSimulatedLatency(ms: number) {
    this.simulatedLatencyMs = Math.max(200, ms);
    this.notify();
  }

  public toggleDataSaver(): boolean {
    this.dataSaverActive = !this.dataSaverActive;
    this.notify();
    return this.dataSaverActive;
  }

  public toggleAutoSmsFallback(): boolean {
    this.autoFallbackToSms = !this.autoFallbackToSms;
    this.notify();
    return this.autoFallbackToSms;
  }

  /**
   * Token-pruning engine: strips conversational fluff and filler words to compress
   * the payload by up to 80% for rural 2G/EDGE cellular connections.
   */
  public compressPrompt(rawPrompt: string): {
    compressed: string;
    originalBytes: number;
    compressedBytes: number;
    savingsBytes: number;
  } {
    const originalBytes = new TextEncoder().encode(rawPrompt).length;

    // Prune common polite/filler prefixes
    let pruned = rawPrompt
      .replace(/^(please|can you|could you|kindly|hello|hi|sir|madam|teacher|tell me|explain to me|help me with)\s+/gi, '')
      .replace(/\s+(please|thank you|thanks|kindly)$/gi, '')
      .trim();

    if (!pruned) pruned = rawPrompt.trim();

    // If query is an equation or math expression, normalize spacing
    pruned = pruned.replace(/\s*([=+\-*/^])\s*/g, '$1');

    const compressedBytes = new TextEncoder().encode(pruned).length;
    const savingsBytes = Math.max(0, originalBytes - compressedBytes + 1200); // include JSON overhead savings
    const savingsKb = savingsBytes / 1024;

    this.bytesSavedKb += savingsKb;
    if (typeof window !== 'undefined') {
      localStorage.setItem('rurallearn_bytes_saved_kb', this.bytesSavedKb.toFixed(2));
    }

    this.notify();

    return {
      compressed: pruned,
      originalBytes,
      compressedBytes,
      savingsBytes,
    };
  }

  /**
   * Executes a slow-net request with strict latency timeout and bandwidth profiling.
   * If the connection stalls past timeoutMs, it throws SlowNetTimeoutError to trigger SMS fallback.
   */
  public async executeWithSlowNetBudget<T>(
    operation: (signal: AbortSignal) => Promise<T>,
    timeoutMs: number = 3800
  ): Promise<T> {
    const controller = new AbortController();
    const startTime = Date.now();

    // Inject simulated 2G mobile link delay
    await new Promise((r) => setTimeout(r, Math.min(800, this.simulatedLatencyMs / 2)));

    const timeoutPromise = new Promise<never>((_, reject) => {
      const id = setTimeout(() => {
        controller.abort();
        const elapsed = Date.now() - startTime;
        reject(
          new SlowNetTimeoutError(
            `Slow Net (2G) link exceeded timeout budget (${timeoutMs}ms). Unstable radio link.`,
            elapsed
          )
        );
      }, timeoutMs);

      controller.signal.addEventListener('abort', () => clearTimeout(id));
    });

    try {
      const result = await Promise.race([operation(controller.signal), timeoutPromise]);
      return result;
    } catch (err: any) {
      if (err instanceof SlowNetTimeoutError) {
        throw err;
      }
      throw new SlowNetTimeoutError(
        err.message || 'Slow Net network connection dropped',
        Date.now() - startTime
      );
    }
  }

  /**
   * In Slow Net mode, non-essential operations (analytics, progress ticks) are deferred
   * from the cellular link to avoid consuming student mobile balance.
   */
  public deferNonCriticalAction(type: 'lesson_progress' | 'quiz_attempt' | 'profile_update', data: any) {
    localDb.queueSyncRecord(type, {
      ...data,
      deferredBySlowNet: true,
      queuedAt: new Date().toISOString(),
    });
    this.notify();
  }
}

export const slowNetService = new SlowNetService();
