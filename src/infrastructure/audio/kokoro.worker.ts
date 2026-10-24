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
  }
  | {
    type: 'UNLOAD';
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

interface WebGPUAdapterInfo {
  vendor?: string;
  description?: string;
  architecture?: string;
}

interface WebGPUAdapter {
  info?: WebGPUAdapterInfo;
  requestAdapterInfo?: () => Promise<WebGPUAdapterInfo>;
}

interface NavigatorWithGPU {
  gpu?: {
    requestAdapter?: (options?: { powerPreference?: string }) => Promise<WebGPUAdapter | null>;
  };
  hardwareConcurrency?: number;
  deviceMemory?: number;
}

let ttsInstance: any = null;
let TextSplitterStreamClass: any = null;
let activeDevice: 'webgpu' | 'wasm' = 'wasm';
let initPromise: Promise<boolean> | null = null;
let isWarmupCompleted = false;

// Concurrency & cancellation state
let activeRequestId: string | null = null;
const abortedRequestIds = new Set<string>();
let synthesisChain: Promise<void> = Promise.resolve();

async function checkWebGPUSupport(): Promise<boolean> {
  if (typeof navigator === 'undefined') {
    return false;
  }
  const nav = navigator as unknown as NavigatorWithGPU;
  if (!nav.gpu || typeof nav.gpu.requestAdapter !== 'function') {
    return false;
  }

  try {
    const adapter = await nav.gpu.requestAdapter({
      powerPreference: 'high-performance',
    });
    if (!adapter) return false;

    // Intel GPUs (Iris Xe / UHD / Arc) suffer from FP16 WGSL matrix multiplication
    // precision bugs in ONNX Runtime WebGPU. Bypass WebGPU to WASM SIMD on Intel.
    const info =
      adapter.info ||
      (typeof adapter.requestAdapterInfo === 'function'
        ? await adapter.requestAdapterInfo()
        : {}) ||
      {};
    const vendorStr = `${info.vendor || ''} ${info.description || ''} ${info.architecture || ''}`.toLowerCase();
    if (vendorStr.includes('intel')) {
      console.warn(
        `[KokoroWorker] Intel GPU adapter detected (${vendorStr.trim() || 'Intel'}). Bypassing WebGPU in favor of WASM SIMD for pristine audio fidelity.`,
      );
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Splits long opening sentences into shorter clauses so the first audio chunk
 * is emitted with minimal latency (First-Chunk Fast-Track).
 */
export function splitTextForFastTTFA(text: string): string[] {
  const normalized = text.trim().replace(/\s+/g, ' ');
  if (!normalized) return [];

  // Split by sentence terminators first
  const rawSentences = normalized.split(/(?<=[.!?])\s+/);
  const segments: string[] = [];

  for (let i = 0; i < rawSentences.length; i++) {
    const sentence = rawSentences[i].trim();
    if (!sentence) continue;

    const wordCount = sentence.split(' ').length;
    // Fast-track the first sentence if it is long (> 10 words) by splitting on clause delimiters
    if (i === 0 && wordCount > 10) {
      const clauses = sentence
        .split(/(?<=[,;:\u2014-])\s+|\s+(?=(?:and|but|because|although|however|while|whereas)\b)/i)
        .map((c) => c.trim())
        .filter(Boolean);

      if (clauses.length > 1) {
        segments.push(...clauses);
        continue;
      }
    }
    segments.push(sentence);
  }

  return segments.length > 0 ? segments : [normalized];
}

/**
 * Runs a minimal silent inference pass to pre-compile WebGPU WGSL shaders / WASM JIT
 * and preload the default voice embedding ('af_heart').
 */
async function runSilentShaderWarmup(tts: any): Promise<void> {
  if (isWarmupCompleted || !tts) return;
  try {
    if (typeof tts.generate === 'function') {
      await tts.generate('a', { voice: 'af_heart', speed: 1.0 });
    } else if (TextSplitterStreamClass && typeof tts.stream === 'function') {
      const warmSplitter = new TextSplitterStreamClass();
      warmSplitter.push('a');
      warmSplitter.close();
      for await (const _chunk of tts.stream(warmSplitter, { voice: 'af_heart', speed: 1.0 })) {
        break;
      }
    }
    isWarmupCompleted = true;
  } catch {
    // Non-fatal if warmup inference fails
  }
}

async function initKokoro(): Promise<boolean> {
  if (ttsInstance && TextSplitterStreamClass) return true;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const kokoroModule = await import('kokoro-js');
      const { KokoroTTS, TextSplitterStream } = kokoroModule;
      TextSplitterStreamClass = TextSplitterStream;

      const canUseWebGPU = await checkWebGPUSupport();

      try {
        const { env } = await import('@huggingface/transformers');
        const useLocalModels =
          typeof import.meta !== 'undefined' &&
          (import.meta as any).env?.VITE_USE_LOCAL_MODELS === 'true';
        env.allowLocalModels = useLocalModels;
        env.allowRemoteModels = true;

        // Lightweight Cache API availability check without disk I/O probe
        env.useBrowserCache =
          typeof self !== 'undefined' && 'caches' in self && Boolean(self.caches);

        if (env?.backends?.onnx?.wasm) {
          const hasSharedArrayBuffer =
            typeof SharedArrayBuffer !== 'undefined' &&
            (typeof self === 'undefined' || (self as any).crossOriginIsolated === true);
          const logicalCores =
            typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4;
          // Cap threads to estimated physical cores (max 4) to prevent WASM spin-lock CPU saturation
          const physicalCoresEstimate = Math.max(1, Math.min(Math.floor(logicalCores / 2) || 1, 4));
          const threads = hasSharedArrayBuffer ? physicalCoresEstimate : 1;

          (env.backends.onnx.wasm as any).numThreads = threads;
          (env.backends.onnx.wasm as any).simd = true;
          (env.backends.onnx.wasm as any).proxy = false;

          if (!(env.backends.onnx.wasm as any).wasmPaths) {
            const baseUrl =
              (typeof import.meta !== 'undefined' && (import.meta as any).env?.BASE_URL) || '/';
            const hasLocalWasmFlag =
              typeof import.meta !== 'undefined' &&
              (import.meta as any).env?.VITE_USE_LOCAL_ONNX_WASM === 'true';

            (env.backends.onnx.wasm as any).wasmPaths = hasLocalWasmFlag
              ? `${baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`}wasm/`
              : `https://cdn.jsdelivr.net/npm/@huggingface/transformers@${env.version || '3.5.1'}/dist/`;
          }
        }
      } catch {
        // Ignore env configuration if unavailable
      }

      if (canUseWebGPU) {
        try {
          const tts = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-ONNX', {
            dtype: 'fp16',
            device: 'webgpu',
          });
          ttsInstance = tts;
          activeDevice = 'webgpu';
          await runSilentShaderWarmup(tts);
          return true;
        } catch {
          // WebGPU fallback to WASM
        }
      }

      // Use q4 quantization on memory-constrained devices (<= 4 GB RAM), q8 otherwise
      const nav =
        typeof navigator !== 'undefined' ? (navigator as unknown as NavigatorWithGPU) : undefined;
      const deviceMemory = nav?.deviceMemory || 8;
      const wasmDtype = deviceMemory <= 4 ? 'q4' : 'q8';

      const tts = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-ONNX', {
        dtype: wasmDtype,
        device: 'wasm',
      });
      ttsInstance = tts;
      activeDevice = 'wasm';
      await runSilentShaderWarmup(tts);
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

async function handleSynthesize(
  msg: Extract<WorkerInMessage, { type: 'SYNTHESIZE' }>,
): Promise<void> {
  const { id, text, voice, speed } = msg;

  if (abortedRequestIds.has(id) || activeRequestId !== id) {
    abortedRequestIds.delete(id);
    return;
  }

  try {
    const isReady = await initKokoro();
    if (!isReady || !ttsInstance || !TextSplitterStreamClass) {
      const errorRes: WorkerOutMessage = {
        type: 'SYNTHESIS_ERROR',
        id,
        error: 'Kokoro model failed to initialize in worker thread',
      };
      self.postMessage(errorRes);
      return;
    }

    if (abortedRequestIds.has(id) || activeRequestId !== id) {
      abortedRequestIds.delete(id);
      return;
    }

    const splitter = new TextSplitterStreamClass();
    const segments = splitTextForFastTTFA(text);
    for (const segment of segments) {
      splitter.push(segment);
    }
    splitter.close();

    for await (const chunk of ttsInstance.stream(splitter, {
      voice: (voice as any) || 'af_heart',
      speed: speed || 1.0,
    })) {
      if (abortedRequestIds.has(id) || activeRequestId !== id) {
        abortedRequestIds.delete(id);
        break;
      }

      if (chunk?.audio?.audio) {
        const rawSamples = chunk.audio.audio as Float32Array;
        // Zero-copy transfer when the Float32Array owns its exact ArrayBuffer
        const ownsBuffer =
          rawSamples.buffer instanceof ArrayBuffer &&
          rawSamples.byteOffset === 0 &&
          rawSamples.byteLength === rawSamples.buffer.byteLength;
        const samples = ownsBuffer ? rawSamples : new Float32Array(rawSamples);
        const sampleRate = chunk.audio.sampling_rate || 24000;

        const chunkRes: WorkerOutMessage = {
          type: 'AUDIO_CHUNK',
          id,
          samples,
          sampleRate,
        };
        (self.postMessage as any)(chunkRes, [samples.buffer]);
      }
    }

    if (!abortedRequestIds.has(id) && activeRequestId === id) {
      const doneRes: WorkerOutMessage = {
        type: 'SYNTHESIS_DONE',
        id,
      };
      self.postMessage(doneRes);
    } else {
      abortedRequestIds.delete(id);
    }
  } catch (err: any) {
    if (!abortedRequestIds.has(id) && activeRequestId === id) {
      const errorRes: WorkerOutMessage = {
        type: 'SYNTHESIS_ERROR',
        id,
        error: err?.message || String(err),
      };
      self.postMessage(errorRes);
    } else {
      abortedRequestIds.delete(id);
    }
  }
}

self.addEventListener('message', (event: MessageEvent<WorkerInMessage>) => {
  const msg = event.data;
  if (!msg) return;

  if (msg.type === 'INIT') {
    initKokoro().then((success) => {
      const res: WorkerOutMessage = {
        type: 'INIT_RESULT',
        success,
        device: activeDevice,
      };
      self.postMessage(res);
    });
    return;
  }

  if (msg.type === 'ABORT') {
    if (msg.id) {
      abortedRequestIds.add(msg.id);
      if (activeRequestId === msg.id) {
        activeRequestId = null;
      }
    }
    return;
  }

  if (msg.type === 'UNLOAD') {
    activeRequestId = null;
    ttsInstance = null;
    isWarmupCompleted = false;
    return;
  }

  if (msg.type === 'SYNTHESIZE') {
    // Supersede any previous in-flight synthesis immediately
    if (activeRequestId && activeRequestId !== msg.id) {
      abortedRequestIds.add(activeRequestId);
    }
    activeRequestId = msg.id;

    // Serialize ONNX session execution so two streams never overlap concurrently
    synthesisChain = synthesisChain.then(() => handleSynthesize(msg)).catch(() => { });
  }
});