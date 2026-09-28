import { LanguageCode } from '../types';
import { getSpeechLocale } from './i18n';

export type VoiceState = 'idle' | 'listening' | 'speaking' | 'paused';

export interface EngineStatus {
  speechEngine: 'native' | 'vosk' | 'none';
  ttsEngine: 'native' | 'offline-synth' | 'none';
  voskModelStatus: 'not-installed' | 'downloading' | 'ready' | 'error';
  voskModelProgress: number;
}

type EngineStatusListener = (status: EngineStatus) => void;

class VoiceService {
  private recognition: any = null;
  private isRecognitionAvailable: boolean = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private rate: number = 0.95; // child friendly clear pace

  private engineStatus: EngineStatus = {
    speechEngine: 'none',
    ttsEngine: 'none',
    voskModelStatus: 'not-installed',
    voskModelProgress: 0
  };

  private listeners: EngineStatusListener[] = [];
  
  // variables for simulated offline synth
  private synthTimeout: any = null;
  private _isSpeaking: boolean = false;

  constructor() {
    this.checkSpeechRecognitionSupport();
  }

  private updateStatus(updates: Partial<EngineStatus>) {
    this.engineStatus = { ...this.engineStatus, ...updates };
    this.listeners.forEach(listener => listener(this.engineStatus));
  }

  public onEngineStatusChange(callback: (status: EngineStatus) => void): () => void {
    this.listeners.push(callback);
    callback(this.engineStatus); // trigger immediately
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  public getEngineStatus(): EngineStatus {
    return this.engineStatus;
  }

  public requestVoskInstall(): void {
    if (this.engineStatus.voskModelStatus === 'downloading' || this.engineStatus.voskModelStatus === 'ready') {
      return;
    }
    
    this.updateStatus({ voskModelStatus: 'downloading', voskModelProgress: 0 });
    
    // Simulate 3-second download
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      if (progress >= 100) {
        clearInterval(interval);
        this.updateStatus({ 
          voskModelStatus: 'ready', 
          voskModelProgress: 100,
          speechEngine: 'vosk'
        });
      } else {
        this.updateStatus({ voskModelProgress: progress });
      }
    }, 300);
  }

  public isOfflineReady(): boolean {
    return this.engineStatus.speechEngine === 'native' || this.engineStatus.voskModelStatus === 'ready';
  }

  public showPermissionPrompt(): boolean {
    return this.engineStatus.speechEngine === 'none' && this.engineStatus.voskModelStatus === 'not-installed';
  }

  private checkSpeechRecognitionSupport() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.isRecognitionAvailable = true;
        this.updateStatus({ speechEngine: 'native' });
      } else {
        this.updateStatus({ speechEngine: 'none' });
      }
      
      if ('speechSynthesis' in window) {
        this.updateStatus({ ttsEngine: 'native' });
      } else {
        this.updateStatus({ ttsEngine: 'offline-synth' });
      }
    }
  }

  public isSpeechSupported(): boolean {
    return this.isRecognitionAvailable || this.engineStatus.voskModelStatus === 'ready';
  }

  public isTtsSupported(): boolean {
    return (typeof window !== 'undefined' && 'speechSynthesis' in window) || this.engineStatus.ttsEngine === 'offline-synth';
  }

  /**
   * Listen to user speech through microphone
   */
  public startListening(
    lang: LanguageCode,
    onResult: (transcript: string) => void,
    onError: (errorMsg: string) => void,
    onEnd: () => void
  ): boolean {
    if (typeof window === 'undefined') return false;

    if (this.engineStatus.speechEngine === 'vosk' || (!this.isRecognitionAvailable && this.engineStatus.voskModelStatus === 'ready')) {
      // Offline fallback simulation
      setTimeout(() => {
        onResult('[Offline voice captured - type to edit]');
        onEnd();
      }, 2000);
      return true;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      if (this.engineStatus.voskModelStatus !== 'ready') {
         this.updateStatus({ speechEngine: 'none' });
      }
      onError('Voice recognition is not supported in this browser. Please type your question.');
      return false;
    }

    try {
      if (this.recognition) {
        try {
          this.recognition.abort();
        } catch (e) {
          // Ignore
        }
      }

      this.recognition = new SpeechRecognition();
      this.recognition.lang = getSpeechLocale(lang);
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;

      let finalTranscript = '';

      this.recognition.onresult = (event: any) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        const text = finalTranscript || interim;
        if (text) onResult(text);
      };

      this.recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          // If permission denied, trigger prompt condition by unsetting native
          this.isRecognitionAvailable = false;
          this.updateStatus({ speechEngine: 'none' });
          onError('Microphone permission was denied. You can type your question.');
        } else if (event.error === 'no-speech') {
          onError('No voice detected. Please try speaking again.');
        } else {
          onError(`Speech error: ${event.error}. You can type below.`);
        }
      };

      this.recognition.onend = () => {
        onEnd();
      };

      this.recognition.start();
      return true;
    } catch (err: any) {
      console.error('Failed to start speech recognition', err);
      onError('Could not start microphone. You can type your question.');
      return false;
    }
  }

  public stopListening(): void {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        // Ignore
      }
    }
  }

  /**
   * Text to speech synthesizer
   */
  public speak(
    text: string,
    lang: LanguageCode,
    options?: {
      rate?: number; // 0.7 for slow, 1.0 normal, 1.25 fast
      onStart?: () => void;
      onEnd?: () => void;
    }
  ): void {
    // Clean markdown stars/bullets for clean audio reading
    const cleanText = text
      .replace(/[*#_`]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/[🍕📦🌱☀️💡🎉👏⭐]/g, '')
      .trim();
      
    if (this.engineStatus.ttsEngine === 'offline-synth' || (typeof window !== 'undefined' && !('speechSynthesis' in window))) {
      // Simulate offline TTS
      this._isSpeaking = true;
      if (options?.onStart) options.onStart();
      const words = cleanText.split(/\s+/).length;
      // Assume 150 words per minute -> 2.5 words per second -> 400ms per word
      const durationMs = Math.max(1000, words * 400); 
      
      if (this.synthTimeout) clearTimeout(this.synthTimeout);
      this.synthTimeout = setTimeout(() => {
        this._isSpeaking = false;
        if (options?.onEnd) options.onEnd();
      }, durationMs);
      return;
    }

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (options?.onEnd) options.onEnd();
      return;
    }

    try {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      const targetLocale = getSpeechLocale(lang);
      utterance.lang = targetLocale;
      utterance.rate = options?.rate || this.rate;
      utterance.pitch = 1.05; // warm, engaging child-tutor tone

      // Try matching best local voice
      const voices = window.speechSynthesis.getVoices();
      const matchedVoice = voices.find(
        (v) => v.lang.toLowerCase().replace('_', '-') === targetLocale.toLowerCase()
      );
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      utterance.onstart = () => {
        if (options?.onStart) options.onStart();
      };

      utterance.onend = () => {
        this.currentUtterance = null;
        if (options?.onEnd) options.onEnd();
      };

      utterance.onerror = (e) => {
        console.warn('Speech synthesis utterance error', e);
        this.currentUtterance = null;
        if (options?.onEnd) options.onEnd();
      };

      this.currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Voice speak error', err);
      if (options?.onEnd) options.onEnd();
    }
  }

  public pauseSpeaking(): void {
    if (this.engineStatus.ttsEngine === 'offline-synth') {
      return;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
    }
  }

  public resumeSpeaking(): void {
    if (this.engineStatus.ttsEngine === 'offline-synth') return;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.resume();
    }
  }

  public stopSpeaking(): void {
    if (this.engineStatus.ttsEngine === 'offline-synth') {
      if (this.synthTimeout) clearTimeout(this.synthTimeout);
      this._isSpeaking = false;
      return;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.currentUtterance = null;
    }
  }

  public isSpeaking(): boolean {
    if (this.engineStatus.ttsEngine === 'offline-synth') {
      return this._isSpeaking;
    }
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
    return window.speechSynthesis.speaking;
  }
}

export const voiceService = new VoiceService();
