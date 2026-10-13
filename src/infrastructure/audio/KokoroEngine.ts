import type { WorkerInMessage, WorkerOutMessage } from './kokoro.worker';

export interface KokoroAudioChunk {
  samples: Float32Array;
  sampleRate: number;
}

export type ChunkCallback = (chunk: KokoroAudioChunk) => void;

/**
 * KokoroEngine manages the lifetime of the off-thread Kokoro Web Worker.
 * All neural network evaluations, ONNX runtime execution and tensor operations
 * run strictly off the UI thread to ensure 60fps responsiveness.
 */
export class KokoroEngine {
  private static worker: Worker | null = null;
  private static activeDevice: 'webgpu' | 'wasm' = 'wasm';
  private static isInitialized = false;
  private static initPromise: Promise<boolean> | null = null;
  private static nextRequestId = 1;
  private static idleTimer: ReturnType<typeof setTimeout> | null = null;

  // Automatically unload worker model after 10 minutes of inactivity to free RAM/VRAM
  private static readonly IDLE_UNLOAD_MS = 10 * 60 * 1000;

  // Callbacks mapped by request id
  private static activeCallbacks: Map<
    string,
    {
      onChunk: ChunkCallback;
      onDone: () => void;
      onError: (err: Error) => void;
    }
  > = new Map();

  private static resetIdleTimer(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
    }
    if (typeof window === 'undefined' || import.meta.env?.MODE === 'test') {
      return;
    }
    this.idleTimer = setTimeout(() => {
      if (this.activeCallbacks.size === 0) {
        this.unload();
      }
    }, this.IDLE_UNLOAD_MS);
  }

  /**
   * Initializes or retrieves the dedicated Web Worker instance.
   */
  private static getWorker(): Worker | null {
    if (typeof window === 'undefined' || typeof Worker === 'undefined') {
      return null;
    }
    if (import.meta.env?.MODE === 'test') {
      return null;
    }
    if (!this.worker) {
      try {
        this.worker = new Worker(new URL('./kokoro.worker.ts', import.meta.url), {
          type: 'module',
        });

        this.worker.onmessage = (event: MessageEvent<WorkerOutMessage>) => {
          const msg = event.data;
          if (!msg) return;

          if (msg.type === 'INIT_RESULT') {
            this.isInitialized = msg.success;
            this.activeDevice = msg.device;
            return;
          }

          if (msg.type === 'AUDIO_CHUNK') {
            const cbs = this.activeCallbacks.get(msg.id);
            if (cbs) {
              cbs.onChunk({
                samples: msg.samples,
                sampleRate: msg.sampleRate,
              });
            }
            return;
          }

          if (msg.type === 'SYNTHESIS_DONE') {
            const cbs = this.activeCallbacks.get(msg.id);
            if (cbs) {
              this.activeCallbacks.delete(msg.id);
              cbs.onDone();
            }
            this.resetIdleTimer();
            return;
          }

          if (msg.type === 'SYNTHESIS_ERROR') {
            const cbs = this.activeCallbacks.get(msg.id);
            if (cbs) {
              this.activeCallbacks.delete(msg.id);
              cbs.onError(new Error(msg.error));
            }
            this.resetIdleTimer();
            return;
          }
        };

        this.worker.onerror = (err) => {
          console.warn('[KokoroEngine] Worker error event:', err);
        };
      } catch (e) {
        console.warn('[KokoroEngine] Could not instantiate Web Worker:', e);
        return null;
      }
    }
    return this.worker;
  }

  /**
   * Returns current active device ('webgpu' or 'wasm').
   */
  public static getActiveDevice(): 'webgpu' | 'wasm' {
    return this.activeDevice;
  }

  /**
   * Returns whether the engine is ready.
   */
  public static isReady(): boolean {
    return this.isInitialized && this.worker !== null;
  }

  /**
   * Ensures the worker is spawned and model initialization is triggered.
   */
  public static async init(): Promise<boolean> {
    if (
      typeof window === 'undefined' ||
      typeof DecompressionStream === 'undefined' ||
      import.meta.env?.MODE === 'test'
    ) {
      return false;
    }

    if (this.isInitialized && this.worker) {
      this.resetIdleTimer();
      return true;
    }
    if (this.initPromise) return this.initPromise;

    const worker = this.getWorker();
    if (!worker) return false;

    this.initPromise = new Promise<boolean>((resolve) => {
      const timeout = setTimeout(() => {
        worker.removeEventListener('message', handler);
        resolve(false);
      }, 30000);

      const handler = (event: MessageEvent<WorkerOutMessage>) => {
        if (event.data?.type === 'INIT_RESULT') {
          clearTimeout(timeout);
          worker.removeEventListener('message', handler);
          this.resetIdleTimer();
          resolve(event.data.success);
        }
      };

      worker.addEventListener('message', handler);
      const msg: WorkerInMessage = { type: 'INIT' };
      worker.postMessage(msg);
    }).finally(() => {
      this.initPromise = null;
    });

    return this.initPromise;
  }

  /**
   * Synthesizes text by streaming audio chunks from the dedicated worker thread.
   */
  public static async synthesizeStream(
    text: string,
    options: {
      voice?: string;
      speed?: number;
      signal?: AbortSignal;
      onChunk: ChunkCallback;
    },
  ): Promise<void> {
    const ready = await this.init();
    if (!ready) {
      throw new Error('Kokoro Web Worker is not available');
    }

    const worker = this.getWorker();
    if (!worker) {
      throw new Error('Web Worker instance not available');
    }

    this.resetIdleTimer();
    const id = `req_${++this.nextRequestId}_${Date.now()}`;

    return new Promise<void>((resolve, reject) => {
      if (options.signal?.aborted) {
        return resolve();
      }

      const onAbort = () => {
        this.activeCallbacks.delete(id);
        const abortMsg: WorkerInMessage = { type: 'ABORT', id };
        worker.postMessage(abortMsg);
        resolve();
      };

      if (options.signal) {
        options.signal.addEventListener('abort', onAbort, { once: true });
      }

      this.activeCallbacks.set(id, {
        onChunk: options.onChunk,
        onDone: () => {
          if (options.signal) {
            options.signal.removeEventListener('abort', onAbort);
          }
          resolve();
        },
        onError: (err) => {
          if (options.signal) {
            options.signal.removeEventListener('abort', onAbort);
          }
          reject(err);
        },
      });

      const synthMsg: WorkerInMessage = {
        type: 'SYNTHESIZE',
        id,
        text,
        voice: options.voice || 'af_heart',
        speed: options.speed || 1.0,
      };
      worker.postMessage(synthMsg);
    });
  }

  /**
   * Warms up the model in the background worker thread during browser idle periods
   * so startup database migrations and UI rendering are never delayed.
   */
  public static warmup(): void {
    if (
      typeof window === 'undefined' ||
      typeof DecompressionStream === 'undefined' ||
      import.meta.env?.MODE === 'test'
    ) {
      return;
    }

    const runWarmup = () => {
      this.init().catch(() => { });
    };

    if (typeof (window as any).requestIdleCallback === 'function') {
      (window as any).requestIdleCallback(runWarmup, { timeout: 2500 });
    } else {
      setTimeout(runWarmup, 1200);
    }
  }

  /**
   * Releases the ONNX model inside the worker without destroying the worker instance.
   */
  public static unload(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
    this.isInitialized = false;
    this.initPromise = null;
    if (this.worker) {
      const msg: WorkerInMessage = { type: 'UNLOAD' };
      this.worker.postMessage(msg);
    }
  }

  /**
   * Terminates the Web Worker completely and frees all associated memory.
   */
  public static terminate(): void {
    this.unload();
    for (const [, cbs] of this.activeCallbacks) {
      cbs.onDone();
    }
    this.activeCallbacks.clear();
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}