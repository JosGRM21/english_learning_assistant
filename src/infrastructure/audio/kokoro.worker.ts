// Dedicated Web Worker for off-thread Kokoro-JS neural TTS synthesis.
// Offloads heavy ONNX runtime operations and tensor transformations from the browser UI thread.

export type WorkerInMessage =
  | { type: 'INIT' }
  | {
      type: 'SYNTHESIZE';
      id: string;
      text: string;
      voice: string;
      speed: number;
    }
  | {
      type: 'ABORT';
      id: string;
    };

export type WorkerOutMessage =
  | {
      type: 'INIT_RESULT';
      success: boolean;
      device: 'webgpu' | 'wasm';
      error?: string;
    }
  | {
      type: 'AUDIO_CHUNK';
      id: string;
      samples: Float32Array;
      sampleRate: number;
    }
  | {
      type: 'SYNTHESIS_DONE';
      id: string;
    }
  | {
      type: 'SYNTHESIS_ERROR';
      id: string;
      error: string;
    };

let ttsInstance: any = null;
let activeDevice: 'webgpu' | 'wasm' = 'wasm';
let initPromise: Promise<boolean> | null = null;
let currentAbortedId: string | null = null;

async function checkWebGPUSupport(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !('gpu' in navigator) || !navigator.gpu) {
    return false;
  }
  try {
    const adapter = await navigator.gpu.requestAdapter({
      powerPreference: 'high-performance',
    });
    if (!adapter) return false;

    // Check adapter info: Intel GPUs (Iris Xe / UHD / Arc) suffer from severe FP16 WGSL
    // matrix multiplication precision bugs in ONNX Runtime WebGPU, resulting in loud metallic
    // screeching distortion in neural vocoders. For Intel systems, bypass WebGPU to WASM SIMD.
    const info = (adapter as any).info || (await (adapter as any).requestAdapterInfo?.()) || {};
    const vendorStr = `${info.vendor || ''} ${info.description || ''} ${info.architecture || ''}`.toLowerCase();
    if (vendorStr.includes('intel')) {
      console.warn(
        `[KokoroWorker] Intel GPU adapter detected (${vendorStr.trim() || 'Intel'}). Bypassing WebGPU in favor of WASM SIMD for pristine audio fidelity.`
      );
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

async function initKokoro(): Promise<boolean> {
  if (ttsInstance) return true;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const { KokoroTTS } = await import('kokoro-js');
      const canUseWebGPU = await checkWebGPUSupport();

      try {
        const { env } = await import('@huggingface/transformers');
        env.allowLocalModels = false;
        env.allowRemoteModels = true;
        try {
          if (typeof self !== 'undefined' && 'caches' in self && self.caches) {
            await self.caches.open('kokoro-test-probe').then(() => {
              self.caches.delete('kokoro-test-probe').catch(() => {});
            });
            env.useBrowserCache = true;
          } else {
            env.useBrowserCache = false;
          }
        } catch {
          env.useBrowserCache = false;
        }

        if (env?.backends?.onnx?.wasm) {
          const hasSharedArrayBuffer =
            typeof SharedArrayBuffer !== 'undefined' &&
            (typeof self === 'undefined' || (self as any).crossOriginIsolated === true);
          const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4;
          const threads = hasSharedArrayBuffer ? Math.max(1, Math.min(cores, 8)) : 1;
          (env.backends.onnx.wasm as any).numThreads = threads;
          (env.backends.onnx.wasm as any).simd = true;
          (env.backends.onnx.wasm as any).proxy = false;
          if (!(env.backends.onnx.wasm as any).wasmPaths) {
            (env.backends.onnx.wasm as any).wasmPaths =
              `https://cdn.jsdelivr.net/npm/@huggingface/transformers@${env.version || '3.5.1'}/dist/`;
          }
        }
      } catch {
        // ignore env configuration if unavailable
      }

      if (canUseWebGPU) {
        try {
          const tts = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-ONNX', {
            dtype: 'fp16',
            device: 'webgpu',
          });
          ttsInstance = tts;
          activeDevice = 'webgpu';
          return true;
        } catch {
          // WebGPU fallback to WASM
        }
      }

      const tts = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-ONNX', {
        dtype: 'q8',
        device: 'wasm',
      });
      ttsInstance = tts;
      activeDevice = 'wasm';
      return true;
    } catch (err) {
      console.warn('[KokoroWorker] Model initialization error:', err);
      return false;
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
}

self.addEventListener('message', async (event: MessageEvent<WorkerInMessage>) => {
  const msg = event.data;
  if (!msg) return;

  if (msg.type === 'INIT') {
    const success = await initKokoro();
    const res: WorkerOutMessage = {
      type: 'INIT_RESULT',
      success,
      device: activeDevice,
    };
    self.postMessage(res);
    return;
  }

  if (msg.type === 'ABORT') {
    if (msg.id) {
      currentAbortedId = msg.id;
    }
    return;
  }

  if (msg.type === 'SYNTHESIZE') {
    const { id, text, voice, speed } = msg;

    try {
      const isReady = await initKokoro();
      if (!isReady || !ttsInstance) {
        const errorRes: WorkerOutMessage = {
          type: 'SYNTHESIS_ERROR',
          id,
          error: 'Kokoro model failed to initialize in worker thread',
        };
        self.postMessage(errorRes);
        return;
      }

      if (currentAbortedId === id) {
        return;
      }

      const { TextSplitterStream } = await import('kokoro-js');
      const splitter = new TextSplitterStream();
      splitter.push(text);
      splitter.close();

      for await (const chunk of ttsInstance.stream(splitter, {
        voice: (voice as any) || 'af_heart',
        speed: speed || 1.0,
      })) {
        if (currentAbortedId === id) {
          break;
        }

        if (chunk?.audio?.audio) {
          const rawSamples = chunk.audio.audio as Float32Array;
          // Clone or transfer underlying buffer to avoid blocking
          const samples = new Float32Array(rawSamples);
          const sampleRate = chunk.audio.sampling_rate || 24000;

          const chunkRes: WorkerOutMessage = {
            type: 'AUDIO_CHUNK',
            id,
            samples,
            sampleRate,
          };

          // Transfer ArrayBuffer for zero-copy IPC
          (self.postMessage as any)(chunkRes, [samples.buffer]);
        }
      }

      if (currentAbortedId !== id) {
        const doneRes: WorkerOutMessage = {
          type: 'SYNTHESIS_DONE',
          id,
        };
        self.postMessage(doneRes);
      }
    } catch (err: any) {
      const errorRes: WorkerOutMessage = {
        type: 'SYNTHESIS_ERROR',
        id,
        error: err?.message || String(err),
      };
      self.postMessage(errorRes);
    }
  }
});
