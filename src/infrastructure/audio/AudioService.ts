import { invoke } from '@tauri-apps/api/core';
import { KokoroEngine } from './KokoroEngine';

export interface IAudioService {
  speak(text: string, rate?: number, voice?: string): Promise<void>;
  playFeedback(isCorrect: boolean): void;
  stop(): void;
  isBackendAvailable(): Promise<boolean>;
  getBackendVoices(): Promise<string[]>;
}

export class AudioService implements IAudioService {
  private audioCtx: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private audioBufferCache: Map<string, AudioBuffer> = new Map();
  private static readonly MAX_CACHE_ENTRIES = 60;

  constructor() {
    // Proactively warm up Kokoro-ONNX in the background
    KokoroEngine.warmup();
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    return this.audioCtx;
  }

  /**
   * Checks whether the application is running inside the Tauri native runtime.
   */
  public isTauri(): boolean {
    if (typeof window === 'undefined') return false;
    return Boolean(
      (window as unknown as { isTauri?: boolean }).isTauri ||
        '__TAURI_INTERNALS__' in window ||
        '__TAURI__' in window,
    );
  }

  /**
   * Checks if the Rust Kokoro-ONNX backend engine is ready.
   */
  public async isBackendAvailable(): Promise<boolean> {
    if (!this.isTauri()) return false;
    try {
      return await invoke<boolean>('kokoro_is_ready');
    } catch {
      return false;
    }
  }

  /**
   * Warms up or initializes the Kokoro-ONNX engine in the backend.
   */
  public async initBackend(): Promise<boolean> {
    if (!this.isTauri()) return false;
    try {
      return await invoke<boolean>('kokoro_init');
    } catch (e) {
      console.warn('Failed to initialize Kokoro backend:', e);
      return false;
    }
  }

  /**
   * Retrieves available voices from Kokoro.
   */
  public async getBackendVoices(): Promise<string[]> {
    if (!this.isTauri()) return [];
    return [
      'af_heart',
      'af_sky',
      'af_bella',
      'af_nicole',
      'af_sarah',
      'am_adam',
      'am_michael',
      'bf_emma',
      'bf_isabella',
      'bm_george',
      'bm_lewis',
    ];
  }

  /**
   * Speaks the provided text using Kokoro-ONNX (82M quantized neural speech),
   * with automatic fallback to Web Speech API if Kokoro is unavailable.
   *
   * @param text The sentence or word in English.
   * @param rate Playback rate: 1.0 (normal) or 0.75 (slowed down for phonetics).
   * @param voice Optional voice identifier (default: "af_heart" for General American English).
   */
  public async speak(text: string, rate = 1.0, voice = 'af_heart'): Promise<void> {
    const trimmed = text.trim();
    if (!trimmed) return;

    const cacheKey = `${trimmed}::${voice}::${rate.toFixed(2)}`;
    const cachedBuffer = this.audioBufferCache.get(cacheKey);
    if (cachedBuffer) {
      await this.playAudioBuffer(cachedBuffer);
      return;
    }

    // 1. Primary: High-fidelity Kokoro-ONNX
    try {
      const tts = await KokoroEngine.getInstance();
      if (tts) {
        const rawAudio = await tts.generate(trimmed, {
          voice: (voice as any) || 'af_heart',
          speed: rate,
        });

        const ctx = this.getAudioContext();
        if (ctx && rawAudio && rawAudio.audio) {
          const audioBuffer = ctx.createBuffer(1, rawAudio.audio.length, rawAudio.sampling_rate);
          audioBuffer.getChannelData(0).set(rawAudio.audio);

          if (this.audioBufferCache.size >= AudioService.MAX_CACHE_ENTRIES) {
            const firstKey = this.audioBufferCache.keys().next().value;
            if (firstKey) this.audioBufferCache.delete(firstKey);
          }
          this.audioBufferCache.set(cacheKey, audioBuffer);

          await this.playAudioBuffer(audioBuffer);
          return;
        }
      }
    } catch (err) {
      console.warn('[AudioService] Kokoro-ONNX synthesis unavailable, falling back to Web Speech:', err);
    }

    // 2. Fallback: Web Speech API
    await this.speakWebSpeech(trimmed, rate);
  }

  /**
   * Plays an AudioBuffer with precise promise completion when playback ends.
   */
  private async playAudioBuffer(buffer: AudioBuffer): Promise<void> {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    this.stopCurrentPlayback();

    return new Promise((resolve) => {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      this.currentSource = source;

      source.onended = () => {
        if (this.currentSource === source) {
          this.currentSource = null;
        }
        resolve();
      };

      source.start(0);
    });
  }

  /**
   * Fallback TTS using browser's speechSynthesis.
   */
  private async speakWebSpeech(text: string, rate: number): Promise<void> {
    if (
      typeof window === 'undefined' ||
      !('speechSynthesis' in window) ||
      typeof SpeechSynthesisUtterance === 'undefined'
    ) {
      return;
    }

    return new Promise((resolve) => {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = Math.max(0.5, Math.min(2.0, rate));

      const voices = window.speechSynthesis.getVoices();
      const englishVoice =
        voices.find(
          (v) =>
            v.lang.startsWith('en-US') &&
            (v.name.includes('Natural') || v.name.includes('Neural') || v.name.includes('Google')),
        ) || voices.find((v) => v.lang.startsWith('en'));

      if (englishVoice) {
        utterance.voice = englishVoice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      window.speechSynthesis.speak(utterance);
    });
  }

  /**
   * Synthesizes audio feedback chimes via the Web Audio API without needing external MP3 files.
   */
  public playFeedback(isCorrect: boolean): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (isCorrect) {
        // High harmonic double-tone chime (587 Hz -> 880 Hz)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.exponentialRampToValueAtTime(880.0, now + 0.12); // A5

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.start(now);
        osc.stop(now + 0.35);
      } else {
        // Low soft thud (220 Hz -> 140 Hz)
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220.0, now);
        osc.frequency.exponentialRampToValueAtTime(140.0, now + 0.2);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

        osc.start(now);
        osc.stop(now + 0.28);
      }
    } catch {
      // Audio autoplay policy or headless fallback
    }
  }

  private stopCurrentPlayback(): void {
    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch {
        // ignore if already stopped
      }
      this.currentSource = null;
    }
  }

  public stop(): void {
    this.stopCurrentPlayback();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}
