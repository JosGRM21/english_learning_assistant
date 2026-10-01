import type { KokoroTTS } from 'kokoro-js';

export class KokoroEngine {
  private static instance: KokoroTTS | null = null;
  private static loadingPromise: Promise<KokoroTTS | null> | null = null;
  private static isInitialized = false;
  private static activeDevice: 'webgpu' | 'wasm' = 'wasm';

  /**
   * Checks whether the current runtime environment supports WebGPU.
   */
  public static async checkWebGPUSupport(): Promise<boolean> {
    if (
      typeof window === 'undefined' ||
      typeof navigator === 'undefined' ||
      !('gpu' in navigator) ||
      !navigator.gpu
    ) {
      return false;
    }
    try {
      const adapter = await navigator.gpu.requestAdapter({
        powerPreference: 'high-performance',
      });
      return adapter !== null;
    } catch {
      return false;
    }
  }

  /**
   * Returns the current active compute device ('webgpu' or 'wasm').
   */
  public static getActiveDevice(): 'webgpu' | 'wasm' {
    return this.activeDevice;
  }

  /**
   * Initializes and returns the singleton KokoroTTS instance.
   * Prioritizes WebGPU for hardware acceleration, with automatic fallback to optimized WASM SIMD.
   * Model weights are automatically cached in browser storage for 100% offline usage.
   */
  public static async getInstance(): Promise<KokoroTTS | null> {
    if (
      typeof window === 'undefined' ||
      typeof DecompressionStream === 'undefined' ||
      import.meta.env?.MODE === 'test'
    ) {
      return null;
    }

    if (this.instance) return this.instance;
    if (this.loadingPromise) return this.loadingPromise;

    this.loadingPromise = (async () => {
      try {
        const { KokoroTTS } = await import('kokoro-js');
        const canUseWebGPU = await this.checkWebGPUSupport();

        // 1. Primary: High-performance WebGPU compute shaders if available
        if (canUseWebGPU) {
          try {
            console.info('[KokoroEngine] WebGPU hardware acceleration detected! Initializing on GPU...');
            const tts = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-ONNX', {
              dtype: 'fp32',
              device: 'webgpu',
            });
            this.instance = tts;
            this.activeDevice = 'webgpu';
            this.isInitialized = true;
            console.info('[KokoroEngine] Kokoro-ONNX neural speech engine ready with WebGPU acceleration!');
            return tts;
          } catch (gpuErr) {
            console.warn('[KokoroEngine] WebGPU initialization failed, falling back to WebAssembly:', gpuErr);
          }
        }

        // 2. Secondary / Fallback: Quantized q8 WebAssembly with SIMD and multithreading
        console.info('[KokoroEngine] Initializing Kokoro-82M ONNX model (quantized q8, WebAssembly SIMD)...');
        try {
          const { env } = await import('@huggingface/transformers');
          if (env?.backends?.onnx?.wasm) {
            const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 2 : 2;
            const threads = Math.max(1, Math.min(4, cores));
            (env.backends.onnx.wasm as any).numThreads = threads;
            (env.backends.onnx.wasm as any).simd = true;
          }
        } catch {
          // ignore env configuration if unavailable
        }

        const tts = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-ONNX', {
          dtype: 'q8',
          device: 'wasm',
        });
        this.instance = tts;
        this.activeDevice = 'wasm';
        this.isInitialized = true;
        console.info('[KokoroEngine] Kokoro-ONNX WebAssembly neural engine is ready!');
        return tts;
      } catch (err) {
        console.warn('[KokoroEngine] Kokoro-ONNX initialization failed or unavailable:', err);
        return null;
      } finally {
        this.loadingPromise = null;
      }
    })();

    return this.loadingPromise;
  }

  public static isReady(): boolean {
    return this.isInitialized && this.instance !== null;
  }

  /**
   * Warms up the model and caches default voice in the background without blocking the UI.
   */
  public static warmup(): void {
    if (
      typeof window !== 'undefined' &&
      typeof DecompressionStream !== 'undefined' &&
      import.meta.env?.MODE !== 'test' &&
      !this.instance &&
      !this.loadingPromise
    ) {
      this.getInstance()
        .then((tts) => {
          if (tts) {
            // Pre-warm neural graph and cache default voice in background
            tts.generate('Hello', { voice: 'af_heart' as any, speed: 1.0 }).catch(() => {});
          }
        })
        .catch(() => {});
    }
  }
}
