import { invoke } from '@tauri-apps/api/core';
import { KokoroEngine } from './KokoroEngine';

export interface IAudioService {
  speak(text: string, rate?: number, voice?: string): Promise<void>;
  playFeedback(isCorrect: boolean): void;
  stop(): void;
  isBackendAvailable(): Promise<boolean>;
  getBackendVoices(): Promise<string[]>;
  getActiveDevice?(): 'webgpu' | 'wasm';
}

export class AudioService implements IAudioService {
  private audioCtx: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private audioBufferCache: Map<string, AudioBuffer> = new Map();
  private currentAbortController: AbortController | null = null;
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
   * Returns whether Kokoro is running on WebGPU or WebAssembly.
   */
  public getActiveDevice(): 'webgpu' | 'wasm' {
    return KokoroEngine.getActiveDevice();
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
   * Speaks the provided text using Kokoro-ONNX with sentence streaming and overlapping synthesis,
   * with automatic fallback to Web Speech API if Kokoro is unavailable.
   *
   * @param text The sentence or word in English.
   * @param rate Playback rate: 1.0 (normal) or 0.75 (slowed down for phonetics).
   * @param voice Optional voice identifier (default: "af_heart" for General American English).
   */
  public async speak(text: string, rate = 1.0, voice = 'af_heart'): Promise<void> {
    const trimmed = text.trim();
    if (!trimmed) return;

    // Cancel any ongoing speech or synthesis
    if (this.currentAbortController) {
      this.currentAbortController.abort();
      this.currentAbortController = null;
    }
    this.stopCurrentPlayback();

    const abortController = new AbortController();
    this.currentAbortController = abortController;
    const { signal } = abortController;

    const cacheKey = `${trimmed}::${voice}::${rate.toFixed(2)}`;
    const cachedBuffer = this.audioBufferCache.get(cacheKey);
    if (cachedBuffer) {
      await this.playAudioBuffer(cachedBuffer, signal);
      return;
    }

    // 1. Primary: High-fidelity Kokoro-ONNX with Sentence Streaming
    try {
      const tts = await KokoroEngine.getInstance();
      if (signal.aborted) return;

      if (tts) {
        const { TextSplitterStream } = await import('kokoro-js');
        const splitter = new TextSplitterStream();
        splitter.push(trimmed);
        splitter.close();

        const ctx = this.getAudioContext();
        if (!ctx) return;

        const collectedBuffers: AudioBuffer[] = [];
        const playbackQueue: AudioBuffer[] = [];
        let isProducerDone = false;
        let producerError: unknown = null;
        const consumerRef: { notify: (() => void) | null } = { notify: null };

        const wakeConsumer = () => {
          if (consumerRef.notify) {
            const cb = consumerRef.notify;
            consumerRef.notify = null;
            cb();
          }
        };

        // Background producer generates audio chunks asynchronously
        const producerPromise = (async () => {
          try {
            for await (const chunk of tts.stream(splitter, {
              voice: (voice as any) || 'af_heart',
              speed: rate,
            })) {
              if (signal.aborted) break;
              if (chunk?.audio?.audio) {
                const audioBuffer = ctx.createBuffer(
                  1,
                  chunk.audio.audio.length,
                  chunk.audio.sampling_rate || 24000,
                );
                audioBuffer.getChannelData(0).set(chunk.audio.audio);
                collectedBuffers.push(audioBuffer);
                playbackQueue.push(audioBuffer);
                wakeConsumer();
              }
            }
          } catch (err) {
            producerError = err;
          } finally {
            isProducerDone = true;
            wakeConsumer();
          }
        })();

        // Consumer plays each audio chunk as soon as it arrives, overlapping with next chunk synthesis
        while (!signal.aborted) {
          if (playbackQueue.length > 0) {
            const nextBuffer = playbackQueue.shift()!;
            await this.playAudioBuffer(nextBuffer, signal);
          } else if (isProducerDone) {
            break;
          } else {
            await new Promise<void>((resolve) => {
              consumerRef.notify = resolve;
            });
          }
        }

        await producerPromise;

        if (signal.aborted) return;
        if (producerError && collectedBuffers.length === 0) {
          throw producerError;
        }

        // Cache the consolidated audio for instant future replays
        if (collectedBuffers.length > 0) {
          const mergedBuffer = this.mergeAudioBuffers(ctx, collectedBuffers);
          if (mergedBuffer) {
            if (this.audioBufferCache.size >= AudioService.MAX_CACHE_ENTRIES) {
              const firstKey = this.audioBufferCache.keys().next().value;
              if (firstKey) this.audioBufferCache.delete(firstKey);
            }
            this.audioBufferCache.set(cacheKey, mergedBuffer);
          }
        }

        return;
      }
    } catch (err) {
      console.warn('[AudioService] Kokoro-ONNX synthesis unavailable, falling back to Web Speech:', err);
    }

    if (signal.aborted) return;

    // 2. Fallback: Web Speech API
    await this.speakWebSpeech(trimmed, rate, signal);
  }

  /**
   * Merges multiple sequential AudioBuffers into a single consolidated AudioBuffer.
   */
  private mergeAudioBuffers(ctx: AudioContext, buffers: AudioBuffer[]): AudioBuffer | null {
    if (buffers.length === 0) return null;
    if (buffers.length === 1) return buffers[0];

    const totalLength = buffers.reduce((acc, b) => acc + b.length, 0);
    const sampleRate = buffers[0].sampleRate;
    const numberOfChannels = buffers[0].numberOfChannels;
    const merged = ctx.createBuffer(numberOfChannels, totalLength, sampleRate);

    for (let channel = 0; channel < numberOfChannels; channel++) {
      const channelData = merged.getChannelData(channel);
      let offset = 0;
      for (const b of buffers) {
        channelData.set(b.getChannelData(channel), offset);
        offset += b.length;
      }
    }
    return merged;
  }

  /**
   * Plays an AudioBuffer with precise promise completion when playback ends, abortable via AbortSignal.
   */
  private async playAudioBuffer(buffer: AudioBuffer, signal?: AbortSignal): Promise<void> {
    if (signal?.aborted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    if (signal?.aborted) return;

    this.stopCurrentPlayback();

    return new Promise((resolve) => {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      this.currentSource = source;

      const onAbort = () => {
        try {
          source.stop();
        } catch {
          // ignore if already stopped
        }
        if (this.currentSource === source) {
          this.currentSource = null;
        }
        resolve();
      };

      if (signal) {
        signal.addEventListener('abort', onAbort, { once: true });
      }

      source.onended = () => {
        if (signal) {
          signal.removeEventListener('abort', onAbort);
        }
        if (this.currentSource === source) {
          this.currentSource = null;
        }
        resolve();
      };

      try {
        source.start(0);
      } catch {
        resolve();
      }
    });
  }

  /**
   * Fallback TTS using browser's speechSynthesis.
   */
  private async speakWebSpeech(text: string, rate: number, signal?: AbortSignal): Promise<void> {
    if (
      typeof window === 'undefined' ||
      !('speechSynthesis' in window) ||
      typeof SpeechSynthesisUtterance === 'undefined' ||
      signal?.aborted
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

      let settled = false;
      const finish = () => {
        if (!settled) {
          settled = true;
          resolve();
        }
      };

      if (signal) {
        signal.addEventListener(
          'abort',
          () => {
            window.speechSynthesis.cancel();
            finish();
          },
          { once: true },
        );
      }

      utterance.onend = () => finish();
      utterance.onerror = () => finish();

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
    if (this.currentAbortController) {
      this.currentAbortController.abort();
      this.currentAbortController = null;
    }
    this.stopCurrentPlayback();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}
