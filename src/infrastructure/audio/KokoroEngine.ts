import type { KokoroTTS } from 'kokoro-js';

export class KokoroEngine {
  private static instance: KokoroTTS | null = null;
  private static loadingPromise: Promise<KokoroTTS | null> | null = null;
  private static isInitialized = false;

  /**
   * Initializes and returns the singleton KokoroTTS instance.
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
        console.info('[KokoroEngine] Initializing Kokoro-82M ONNX model (quantized q8, WebAssembly)...');
        const { KokoroTTS } = await import('kokoro-js');
        const tts = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-ONNX', {
          dtype: 'q8',
          device: 'wasm',
        });
        this.instance = tts;
        this.isInitialized = true;
        console.info('[KokoroEngine] Kokoro-ONNX neural speech engine is ready!');
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
   * Warms up the model in the background without blocking the UI.
   */
  public static warmup(): void {
    if (
      typeof window !== 'undefined' &&
      typeof DecompressionStream !== 'undefined' &&
      import.meta.env?.MODE !== 'test' &&
      !this.instance &&
      !this.loadingPromise
    ) {
      this.getInstance().catch(() => {});
    }
  }
}
