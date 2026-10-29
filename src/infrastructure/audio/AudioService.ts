import { invoke, Channel } from '@tauri-apps/api/core';
import { isTauri } from '@/shared/utils/platform';
import { KokoroEngine } from './KokoroEngine';

export type AudioAccent = 'US' | 'UK';

export const ACCENT_VOICES: Record<AudioAccent, string> = {
  US: 'af_heart',
  UK: 'bf_emma',
} as const;

export function getVoiceForAccent(accent?: AudioAccent): string {
  if (accent === 'UK') return ACCENT_VOICES.UK;
  return ACCENT_VOICES.US;
}

export interface NativeAudioChunkPayload {
  samples_bytes?: Uint8Array | number[];
  samples?: Float32Array | Uint8Array | number[];
  sample_rate: number;
  chunk_index: number;
  is_final: boolean;
}

export interface IAudioService {
  speak(text: string, rate?: number, voice?: string): Promise<void>;
  prefetch?(text: string, rate?: number, voice?: string): Promise<void>;
  playFeedback(isCorrect: boolean): void;
  stop(): void;
  isBackendAvailable(): Promise<boolean>;
  getBackendVoices(): Promise<string[]>;
  getActiveDevice?(): 'webgpu' | 'wasm';
  getActiveEngine?(): Promise<'native-avx2' | 'native-avx' | 'webgpu' | 'wasm' | 'webspeech'>;
  getBuildTarget?(): Promise<'avx2-native' | 'avx-native' | 'legacy-universal' | 'web'>;
}

export class AudioService implements IAudioService {
  private audioCtx: AudioContext | null = null;
  private masterGainNode: GainNode | null = null;
  private activeSources: Set<AudioBufferSourceNode> = new Set();
  private audioBufferCache: Map<string, AudioBuffer> = new Map();
  private currentCacheSamples = 0;

  private currentAbortController: AbortController | null = null;
  private prefetchAbortController: AbortController | null = null;
  private backendInitPromise: Promise<boolean> | null = null;
  private isNativeBackendReady: boolean | null = null;
  private cachedBuildTarget: 'avx2-native' | 'avx-native' | 'legacy-universal' | null = null;

  private static readonly MAX_CACHE_ENTRIES = 60;
  // Maximum ~3 minutes of 24kHz mono Float32 audio (~17.2 MB RAM cap)
  private static readonly MAX_CACHE_SAMPLES = 24000 * 180;
  // Do not cache long paragraphs (e.g., full essay evaluations or stories)
  private static readonly MAX_CACHEABLE_TEXT_LENGTH = 300;

  constructor() {
    this.scheduleStartupWarmup();
    this.setupVisibilityLifecycle();
  }

  /**
   * Defers TTS engine initialization to idle time so it does not compete with
   * SQLite migrations and corpus seeding. Prevents loading the Web Worker model
   * when the native Rust SIMD backend is active.
   */
  private scheduleStartupWarmup(): void {
    if (typeof window === 'undefined' || import.meta.env?.MODE === 'test') {
      return;
    }

    const startTask = async () => {
      if (this.isTauri()) {
        const nativeReady = await this.initBackend().catch(() => false);
        if (!nativeReady) {
          KokoroEngine.warmup();
        }
      } else {
        KokoroEngine.warmup();
      }
    };

    if (typeof (window as any).requestIdleCallback === 'function') {
      (window as any).requestIdleCallback(
        () => {
          startTask();
        },
        { timeout: 2000 },
      );
    } else {
      setTimeout(() => {
        startTask();
      }, 800);
    }
  }

  /**
   * Suspends AudioContext when window is hidden/minimized to tray to save CPU and battery.
   */
  private setupVisibilityLifecycle(): void {
    if (typeof document === 'undefined' || import.meta.env?.MODE === 'test') {
      return;
    }
    document.addEventListener('visibilitychange', () => {
      if (
        document.visibilityState === 'hidden' &&
        this.activeSources.size === 0 &&
        this.audioCtx &&
        this.audioCtx.state === 'running'
      ) {
        this.audioCtx.suspend().catch(() => { });
      }
    });
  }

  /**
   * Initializes or returns the singleton AudioContext configured to native 24000 Hz Kokoro sample rate
   * with a dedicated master GainNode connected to hardware destination.
   */
  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        try {
          this.audioCtx = new AudioCtxClass({ sampleRate: 24000, latencyHint: 'interactive' });
        } catch {
          this.audioCtx = new AudioCtxClass();
        }

        if (this.audioCtx && typeof this.audioCtx.createGain === 'function') {
          try {
            this.masterGainNode = this.audioCtx.createGain();
            if (this.masterGainNode?.gain) {
              if (typeof this.masterGainNode.gain.setValueAtTime === 'function') {
                this.masterGainNode.gain.setValueAtTime(1.0, this.audioCtx.currentTime || 0);
              } else {
                this.masterGainNode.gain.value = 1.0;
              }
            }
            this.masterGainNode.connect?.(this.audioCtx.destination);
          } catch {
            this.masterGainNode = null;
          }
        }
      }
    }
    return this.audioCtx;
  }

  /**
   * Checks whether the application is running inside the Tauri native runtime.
   */
  public isTauri(): boolean {
    return isTauri();
  }

  /**
   * Checks if the Rust Kokoro-ONNX backend engine is ready, caching the positive state
   * to avoid redundant IPC calls before every synthesis.
   */
  public async isBackendAvailable(): Promise<boolean> {
    if (!this.isTauri()) {
      this.isNativeBackendReady = false;
      return false;
    }
    if (this.isNativeBackendReady === true) {
      return true;
    }
    try {
      const ready = await invoke<boolean>('kokoro_is_ready');
      if (ready) {
        this.isNativeBackendReady = true;
      }
      return ready;
    } catch {
      return false;
    }
  }

  /**
   * Warms up or initializes the Kokoro-ONNX engine in the backend.
   */
  public async initBackend(): Promise<boolean> {
    if (!this.isTauri()) return false;
    if (this.isNativeBackendReady === true) return true;
    if (this.backendInitPromise) return this.backendInitPromise;

    this.backendInitPromise = (async () => {
      try {
        const ready = await invoke<boolean>('kokoro_init');
        if (ready) {
          this.isNativeBackendReady = true;
        }
        return ready;
      } catch (e) {
        console.warn('Failed to initialize Kokoro backend:', e);
        return false;
      } finally {
        this.backendInitPromise = null;
      }
    })();

    return this.backendInitPromise;
  }

  /**
   * Returns whether Kokoro is running on WebGPU or WebAssembly.
   */
  public getActiveDevice(): 'webgpu' | 'wasm' {
    return KokoroEngine.getActiveDevice();
  }

  /**
   * Returns the current application build target (native SIMD tier, legacy universal, or web).
   */
  public async getBuildTarget(): Promise<'avx2-native' | 'avx-native' | 'legacy-universal' | 'web'> {
    if (!this.isTauri()) return 'web';
    if (this.cachedBuildTarget) return this.cachedBuildTarget;
    try {
      const target = await invoke<string>('get_build_target');
      if (target === 'avx2-native' || target.includes('avx2') || target.includes('avx512')) {
        this.cachedBuildTarget = 'avx2-native';
      } else if (target === 'avx-native' || target.includes('avx')) {
        this.cachedBuildTarget = 'avx-native';
      } else {
        this.cachedBuildTarget = 'legacy-universal';
      }
      return this.cachedBuildTarget;
    } catch {
      return 'legacy-universal';
    }
  }

  /**
   * Returns the active TTS synthesis engine being utilized.
   */
  public async getActiveEngine(): Promise<'native-avx2' | 'native-avx' | 'webgpu' | 'wasm' | 'webspeech'> {
    let isNativeReady = await this.isBackendAvailable();
    if (!isNativeReady && this.isTauri()) {
      isNativeReady = await this.initBackend();
    }
    if (isNativeReady) {
      const target = await this.getBuildTarget();
      return target === 'avx-native' ? 'native-avx' : 'native-avx2';
    }

    if (KokoroEngine.isReady()) {
      return KokoroEngine.getActiveDevice();
    }
    return 'webspeech';
  }

  /**
   * Retrieves available voices from Kokoro.
   */
  public async getBackendVoices(): Promise<string[]> {
    if (!this.isTauri()) return [];
    try {
      const voices = await invoke<string[]>('kokoro_get_voices');
      if (voices && voices.length > 0) return voices;
    } catch {
      // ignore fallback
    }
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

  private buildCacheKey(text: string, voice: string, rate: number): string {
    const normalizedText = text.trim().replace(/\s+/g, ' ');
    return `${normalizedText}::${voice}::${rate.toFixed(2)}`;
  }

  /**
   * Converts incoming binary IPC or Worker sample payloads into a Float32Array<ArrayBuffer>
   * compatible with Web Audio's AudioBuffer.copyToChannel().
   * Provides true O(1) zero-copy conversion when raw bytes are 4-byte aligned.
   */
  private toFloat32Samples(
    raw: Float32Array | Uint8Array | number[],
  ): Float32Array<ArrayBuffer> {
    if (raw instanceof Float32Array) {
      if (raw.buffer instanceof ArrayBuffer) {
        return raw as Float32Array<ArrayBuffer>;
      }
      const copy = new Float32Array(raw.length);
      copy.set(raw);
      return copy;
    }
    if (raw instanceof Uint8Array) {
      // True zero-copy: if 4-byte aligned, create a direct Float32Array view over the ArrayBuffer
      if (
        raw.buffer instanceof ArrayBuffer &&
        raw.byteOffset % 4 === 0 &&
        raw.byteLength % 4 === 0
      ) {
        return new Float32Array(raw.buffer, raw.byteOffset, raw.byteLength / 4);
      }
      const aligned = new Uint8Array(raw.byteLength);
      aligned.set(raw);
      return new Float32Array(aligned.buffer);
    }
    const len = raw?.length || 0;
    const out = new Float32Array(len);
    for (let i = 0; i < len; i++) {
      const s = raw[i];
      out[i] = Number.isFinite(s) ? Math.max(-1.0, Math.min(1.0, s)) : 0;
    }
    return out;
  }

  /**
   * Creates a Web Audio AudioBuffer from Float32 samples using fast bulk memory copy.
   */
  private createAudioBufferFromSamples(
    ctx: AudioContext,
    samples: Float32Array | Uint8Array | number[],
    sampleRate: number,
  ): AudioBuffer | null {
    const floatSamples = this.toFloat32Samples(samples);
    const sampleCount = floatSamples.length;
    if (sampleCount === 0) return null;

    const audioBuffer = ctx.createBuffer(1, sampleCount, sampleRate || 24000);
    if (typeof audioBuffer.copyToChannel === 'function') {
      audioBuffer.copyToChannel(floatSamples, 0);
    } else {
      const channelData = audioBuffer.getChannelData(0);
      channelData.set(floatSamples);
    }
    return audioBuffer;
  }

  /**
   * Speaks the provided text using Kokoro-ONNX with gapless sentence streaming and overlapping
   * synthesis, with automatic fallback to Web Speech API if Kokoro is unavailable.
   *
   * @param text The sentence or word in English.
   * @param rate Playback rate: 1.0 (normal) or 0.75 (slowed down for phonetics).
   * @param voice Optional voice identifier (default: "af_heart" for General American English).
   */
  public async speak(text: string, rate = 1.0, voice = 'af_heart'): Promise<void> {
    const trimmed = text.trim().replace(/\s+/g, ' ');
    if (!trimmed) return;

    // Abort any low-priority prefetch and ongoing playback
    if (this.prefetchAbortController) {
      this.prefetchAbortController.abort();
      this.prefetchAbortController = null;
    }
    if (this.currentAbortController) {
      this.currentAbortController.abort();
      this.currentAbortController = null;
    }
    this.stopCurrentPlayback();

    const abortController = new AbortController();
    this.currentAbortController = abortController;
    const { signal } = abortController;

    const cacheKey = this.buildCacheKey(trimmed, voice, rate);
    const cachedBuffer = this.audioBufferCache.get(cacheKey);
    if (cachedBuffer) {
      // LRU refresh: move to most recent position
      this.audioBufferCache.delete(cacheKey);
      this.audioBufferCache.set(cacheKey, cachedBuffer);
      await this.playAudioBuffer(cachedBuffer, signal);
      return;
    }

    const canCacheText = trimmed.length <= AudioService.MAX_CACHEABLE_TEXT_LENGTH;

    // 1. Primary: Native Multi-SIMD Streaming Engine in Rust backend (AVX-512 / AVX2 / AVX)
    try {
      let isNativeReady = await this.isBackendAvailable();
      if (!isNativeReady && this.isTauri()) {
        isNativeReady = await this.initBackend();
      }

      if (isNativeReady) {
        const ctx = this.getAudioContext();
        if (ctx) {
          await this.consumeAudioStream({
            ctx,
            signal,
            startProducer: ({ pushChunk, markDone, setError }) => {
              const onChunkChannel = new Channel<NativeAudioChunkPayload>();
              onChunkChannel.onmessage = (payload: NativeAudioChunkPayload) => {
                if (signal.aborted) return;
                const rawBytes = payload.samples_bytes;
                const rawSamples = payload.samples;
                const target =
                  rawBytes instanceof Uint8Array
                    ? rawBytes
                    : Array.isArray(rawBytes)
                      ? new Uint8Array(rawBytes)
                      : (rawSamples || new Uint8Array(0));
                const sampleCount = target?.length || 0;
                if (sampleCount === 0) return;
                pushChunk(target, payload.sample_rate || 24000);
              };

              invoke<void>('kokoro_synthesize_stream', {
                text: trimmed,
                voice,
                speed: rate,
                onChunk: onChunkChannel,
              })
                .catch((err) => {
                  setError(err);
                })
                .finally(() => {
                  markDone();
                });
            },
            onComplete: (collectedBuffers) => {
              if (canCacheText && collectedBuffers.length > 0) {
                const mergedBuffer = this.mergeAudioBuffers(ctx, collectedBuffers);
                if (mergedBuffer) {
                  this.setCacheEntry(cacheKey, mergedBuffer);
                }
              }
            },
          });
          return;
        }
      }
    } catch (nativeErr) {
      console.warn(
        '[AudioService] Native SIMD streaming synthesis unavailable, falling back to client engine:',
        nativeErr,
      );
    }

    if (signal.aborted) return;

    // 2. Secondary (Legacy build or Web): High-fidelity Kokoro-ONNX off-thread with Worker Streaming
    const ctx = this.getAudioContext();
    if (ctx) {
      try {
        if (!KokoroEngine.isReady()) {
          KokoroEngine.warmup();
          let timeoutId: ReturnType<typeof setTimeout> | null = null;
          const quickReady = await Promise.race([
            KokoroEngine.init(),
            new Promise<boolean>((resolve) => {
              timeoutId = setTimeout(() => resolve(false), 15000);
            }),
          ]).finally(() => {
            if (timeoutId) clearTimeout(timeoutId);
          });

          if (!quickReady) {
            throw new Error(
              'Kokoro client worker initializing; falling back to instant Web Speech',
            );
          }
        }

        await this.consumeAudioStream({
          ctx,
          signal,
          startProducer: ({ pushChunk, markDone, setError }) => {
            KokoroEngine.synthesizeStream(trimmed, {
              voice,
              speed: rate,
              signal,
              onChunk: (chunk) => {
                if (signal.aborted) return;
                const sampleCount = chunk.samples?.length || 0;
                if (sampleCount === 0) return;
                pushChunk(chunk.samples, chunk.sampleRate || 24000);
              },
            })
              .catch((err) => {
                setError(err);
              })
              .finally(() => {
                markDone();
              });
          },
          onComplete: (collectedBuffers) => {
            if (canCacheText && collectedBuffers.length > 0) {
              const mergedBuffer = this.mergeAudioBuffers(ctx, collectedBuffers);
              if (mergedBuffer) {
                this.setCacheEntry(cacheKey, mergedBuffer);
              }
            }
          },
        });
        return;
      } catch (err) {
        console.warn(
          '[AudioService] Kokoro-ONNX worker synthesis unavailable, falling back to Web Speech:',
          err,
        );
      }
    }

    if (signal.aborted) return;

    // 3. Fallback: Web Speech API
    await this.speakWebSpeech(trimmed, rate, signal, voice);
  }

  /**
   * Pre-synthesizes and caches audio in the background without playing it out loud.
   * Ideal for prefetching the next SRS flashcard to achieve 0ms Time-to-First-Audio.
   */
  public async prefetch(text: string, rate = 1.0, voice = 'af_heart'): Promise<void> {
    const trimmed = text.trim().replace(/\s+/g, ' ');
    if (!trimmed || trimmed.length > AudioService.MAX_CACHEABLE_TEXT_LENGTH) return;

    const cacheKey = this.buildCacheKey(trimmed, voice, rate);
    if (this.audioBufferCache.has(cacheKey)) return;

    // Do not contend with active speech playback
    if (this.activeSources.size > 0) return;

    const ctx = this.getAudioContext();
    if (!ctx) return;

    if (this.prefetchAbortController) {
      this.prefetchAbortController.abort();
    }
    const controller = new AbortController();
    this.prefetchAbortController = controller;
    const { signal } = controller;

    const collectedBuffers: AudioBuffer[] = [];

    try {
      const isNativeReady = await this.isBackendAvailable();
      if (isNativeReady) {
        await new Promise<void>((resolve, reject) => {
          const onChunkChannel = new Channel<NativeAudioChunkPayload>();
          onChunkChannel.onmessage = (payload: NativeAudioChunkPayload) => {
            if (signal.aborted) return;
            const rawBytes = payload.samples_bytes;
            const rawSamples = payload.samples;
            const target =
              rawBytes instanceof Uint8Array
                ? rawBytes
                : Array.isArray(rawBytes)
                  ? new Uint8Array(rawBytes)
                  : (rawSamples || new Uint8Array(0));
            const buf = this.createAudioBufferFromSamples(
              ctx,
              target,
              payload.sample_rate || 24000,
            );
            if (buf) collectedBuffers.push(buf);
          };

          invoke<void>('kokoro_synthesize_stream', {
            text: trimmed,
            voice,
            speed: rate,
            onChunk: onChunkChannel,
          })
            .then(() => resolve())
            .catch(reject);
        });
      } else if (KokoroEngine.isReady()) {
        await KokoroEngine.synthesizeStream(trimmed, {
          voice,
          speed: rate,
          signal,
          onChunk: (chunk) => {
            if (signal.aborted) return;
            const buf = this.createAudioBufferFromSamples(
              ctx,
              chunk.samples,
              chunk.sampleRate || 24000,
            );
            if (buf) collectedBuffers.push(buf);
          },
        });
      }

      if (!signal.aborted && collectedBuffers.length > 0) {
        const merged = this.mergeAudioBuffers(ctx, collectedBuffers);
        if (merged) {
          this.setCacheEntry(cacheKey, merged);
        }
      }
    } catch {
      // Prefetch errors are silent
    } finally {
      if (this.prefetchAbortController === controller) {
        this.prefetchAbortController = null;
      }
    }
  }

  /**
   * Sets a cache entry maintaining both entry count and total sample memory limits (LRU eviction).
   */
  private setCacheEntry(key: string, buffer: AudioBuffer): void {
    const existing = this.audioBufferCache.get(key);
    if (existing) {
      this.currentCacheSamples = Math.max(0, this.currentCacheSamples - existing.length);
      this.audioBufferCache.delete(key);
    }

    // Do not cache single buffers that exceed half the entire sample budget
    if (buffer.length > AudioService.MAX_CACHE_SAMPLES / 2) {
      return;
    }

    while (
      this.audioBufferCache.size > 0 &&
      (this.audioBufferCache.size >= AudioService.MAX_CACHE_ENTRIES ||
        this.currentCacheSamples + buffer.length > AudioService.MAX_CACHE_SAMPLES)
    ) {
      const oldestKey = this.audioBufferCache.keys().next().value;
      if (!oldestKey) break;
      const oldestBuf = this.audioBufferCache.get(oldestKey);
      if (oldestBuf) {
        this.currentCacheSamples = Math.max(0, this.currentCacheSamples - oldestBuf.length);
      }
      this.audioBufferCache.delete(oldestKey);
    }

    this.audioBufferCache.set(key, buffer);
    this.currentCacheSamples += buffer.length;
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
   * Consumes an audio chunk stream concurrently and schedules chunks gaplessly on the
   * Web Audio hardware clock (`ctx.currentTime`), overlapping playback of chunk N
   * with synthesis of chunk N+1 without JS event-loop gaps.
   */
  private async consumeAudioStream(options: {
    ctx: AudioContext;
    signal: AbortSignal;
    startProducer: (controllers: {
      pushChunk: (samples: Float32Array | Uint8Array | number[], sampleRate: number) => void;
      markDone: () => void;
      setError: (err: unknown) => void;
    }) => void;
    onComplete?: (collectedBuffers: AudioBuffer[]) => void;
  }): Promise<void> {
    const { ctx, signal, startProducer, onComplete } = options;

    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    if (signal.aborted) return;

    const collectedBuffers: AudioBuffer[] = [];
    let isProducerDone = false;
    let producerError: unknown = null;
    let inFlightCount = 0;
    let nextStartTime = ctx.currentTime || 0;

    let resolveStreamCompletion: (() => void) | null = null;
    const checkStreamFinished = () => {
      if ((isProducerDone && inFlightCount === 0) || signal.aborted) {
        if (resolveStreamCompletion) {
          const cb = resolveStreamCompletion;
          resolveStreamCompletion = null;
          cb();
        }
      }
    };

    const scheduleBufferGapless = (audioBuffer: AudioBuffer) => {
      if (signal.aborted) return;

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;

      // Route all audio sources through persistent master GainNode to avoid GC pressure
      if (this.masterGainNode) {
        source.connect(this.masterGainNode);
      } else {
        source.connect(ctx.destination);
      }

      this.activeSources.add(source);
      inFlightCount++;

      let cleaned = false;
      const cleanupNode = () => {
        if (cleaned) return;
        cleaned = true;
        this.activeSources.delete(source);
        source.disconnect?.();
        inFlightCount = Math.max(0, inFlightCount - 1);
        checkStreamFinished();
      };

      source.onended = cleanupNode;

      const now = ctx.currentTime || 0;
      const startAt = Math.max(now, nextStartTime);
      const duration =
        audioBuffer.duration || audioBuffer.length / (audioBuffer.sampleRate || 24000);
      nextStartTime = startAt + duration;

      try {
        source.start(startAt);
      } catch {
        cleanupNode();
      }
    };

    const onAbort = () => {
      this.stopCurrentPlayback();
      checkStreamFinished();
    };
    signal.addEventListener('abort', onAbort, { once: true });

    const pushChunk = (samples: Float32Array | Uint8Array | number[], sampleRate: number) => {
      if (signal.aborted) return;
      const audioBuffer = this.createAudioBufferFromSamples(ctx, samples, sampleRate);
      if (!audioBuffer) return;

      collectedBuffers.push(audioBuffer);
      scheduleBufferGapless(audioBuffer);
    };

    const markDone = () => {
      isProducerDone = true;
      checkStreamFinished();
    };

    const setError = (err: unknown) => {
      producerError = err;
    };

    startProducer({ pushChunk, markDone, setError });

    if (!(isProducerDone && inFlightCount === 0) && !signal.aborted) {
      await new Promise<void>((resolve) => {
        resolveStreamCompletion = resolve;
        checkStreamFinished();
      });
    }

    signal.removeEventListener('abort', onAbort);

    if (signal.aborted) return;

    if (producerError && collectedBuffers.length === 0) {
      throw producerError;
    }

    onComplete?.(collectedBuffers);
  }

  /**
   * Plays a single AudioBuffer with precise promise completion when playback ends,
   * abortable via AbortSignal.
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

      if (this.masterGainNode) {
        source.connect(this.masterGainNode);
      } else {
        source.connect(ctx.destination);
      }

      this.activeSources.add(source);

      let cleanedUp = false;
      const cleanup = () => {
        if (cleanedUp) return;
        cleanedUp = true;
        this.activeSources.delete(source);
        source.disconnect?.();
        resolve();
      };

      const onAbort = () => {
        this.stopCurrentPlayback();
        cleanup();
      };

      if (signal) {
        signal.addEventListener('abort', onAbort, { once: true });
      }

      source.onended = () => {
        if (signal) {
          signal.removeEventListener('abort', onAbort);
        }
        cleanup();
      };

      try {
        source.start(0);
      } catch {
        cleanup();
      }
    });
  }

  /**
   * Fallback TTS using browser's speechSynthesis.
   */
  private async speakWebSpeech(
    text: string,
    rate: number,
    signal?: AbortSignal,
    voice?: string,
  ): Promise<void> {
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
      const isUk = Boolean(
        voice &&
        (voice.startsWith('bf_') ||
          voice.startsWith('bm_') ||
          voice.toLowerCase().includes('uk') ||
          voice.toLowerCase().includes('gb')),
      );
      utterance.lang = isUk ? 'en-GB' : 'en-US';
      utterance.rate = Math.max(0.5, Math.min(2.0, rate));

      const voices = window.speechSynthesis.getVoices();
      const targetLang = isUk ? 'en-GB' : 'en-US';
      const englishVoice =
        voices.find(
          (v) =>
            v.lang.startsWith(targetLang) &&
            (v.name.includes('Natural') || v.name.includes('Neural') || v.name.includes('Google')),
        ) ||
        voices.find((v) => v.lang.startsWith(targetLang)) ||
        voices.find((v) => v.lang.startsWith('en'));

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
      if (this.masterGainNode) {
        gain.connect(this.masterGainNode);
      } else {
        gain.connect(ctx.destination);
      }

      if (isCorrect) {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now);
        osc.frequency.exponentialRampToValueAtTime(880.0, now + 0.12);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.start(now);
        osc.stop(now + 0.35);
      } else {
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
    if (this.audioCtx && this.audioCtx.state !== 'closed' && this.masterGainNode) {
      const now = this.audioCtx.currentTime || 0;
      try {
        const gainParam = this.masterGainNode.gain;
        if (gainParam) {
          gainParam.cancelScheduledValues?.(now);
          gainParam.setValueAtTime?.(gainParam.value ?? 1.0, now);
          gainParam.linearRampToValueAtTime?.(0.0001, now + 0.008);
          // Restore master gain to 1.0 slightly after the ramp so subsequent playback starts cleanly
          gainParam.setValueAtTime?.(1.0, now + 0.01);
        }
      } catch {
        // ignore
      }
    }

    for (const source of this.activeSources) {
      try {
        source.stop();
      } catch {
        // ignore if already stopped
      }
      try {
        source.disconnect?.();
      } catch {
        // ignore
      }
    }
    this.activeSources.clear();

    // Immediately signal native backend to stop ongoing sentence synthesis in flight (< 5ms abort)
    if (this.isTauri()) {
      try {
        const res = invoke('kokoro_stop');
        if (res && typeof (res as any).catch === 'function') {
          (res as any).catch(() => {});
        }
      } catch {
        // ignore
      }
    }
  }

  public stop(): void {
    if (this.prefetchAbortController) {
      this.prefetchAbortController.abort();
      this.prefetchAbortController = null;
    }
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
