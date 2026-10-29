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
  userAgent?: string;
}

let ttsInstance: any = null;
let activeDevice: 'webgpu' | 'wasm' = 'wasm';
let initPromise: Promise<boolean> | null = null;
let isWarmupCompleted = false;

// Concurrency & cancellation state
let activeRequestId: string | null = null;
const abortedRequestIds = new Set<string>();
let synthesisChain: Promise<void> = Promise.resolve();

/**
 * Applies an in-place vectorized anti-click cosine envelope to raw float32 samples.
 * Eliminates vocoder attack clicks and DC offset transients without allocating new memory.
 */
export function applyAntiClickEnvelopeJS(samples: Float32Array): void {
  const len = samples.length;
  if (len < 32) return;
  const ramp = Math.min(60, len >> 2);
  const invRamp = Math.PI / ramp;
  for (let i = 0; i < ramp; i++) {
    const env = 0.5 * (1.0 - Math.cos(i * invRamp));
    samples[i] = Math.max(-1.0, Math.min(1.0, (samples[i] || 0) * env));
    const endIdx = len - 1 - i;
    samples[endIdx] = Math.max(-1.0, Math.min(1.0, (samples[endIdx] || 0) * env));
  }
}

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
    }
    isWarmupCompleted = true;
  } catch {
    // Non-fatal if warmup inference fails
  }
}

// Guardamos la referencia original de fetch en el contexto del Worker
const originalWorkerFetch = self.fetch.bind(self);
let isFetchPatched = false;

function patchWorkerFetchForSpaFallback(useLocalModels: boolean): void {
  if (isFetchPatched) return;
  isFetchPatched = true;

  self.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const urlStr =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.href
          : (input && typeof (input as any).url === 'string')
            ? (input as any).url
            : String(input);

    // 1. Si los modelos locales están desactivados, bloquear cualquier intento de transformers.js
    // de buscar en rutas locales (/models/... o localhost) para que salte directo a HuggingFace Hub.
    const isLocalOrigin =
      urlStr.startsWith('/') ||
      urlStr.includes('localhost:') ||
      urlStr.includes('127.0.0.1:') ||
      urlStr.includes('tauri.localhost');

    if (!useLocalModels && isLocalOrigin && urlStr.includes('onnx-community/Kokoro')) {
      return new Response(null, { status: 404, statusText: 'Local Models Disabled' });
    }

    const response = await originalWorkerFetch(input, init);

    // 2. Protección contra el SPA Fallback de Vite:
    // Si pedimos un archivo del modelo (.json, .onnx, .bin) y el servidor devuelve text/html (<!doctype html>),
    // lo convertimos en un 404 para que transformers.js haga fallback limpio al Hub remoto y no corrompa JSON.parse.
    const contentType = response.headers.get('content-type') || '';
    if (
      response.ok &&
      contentType.includes('text/html') &&
      (urlStr.endsWith('.json') ||
        urlStr.endsWith('.onnx') ||
        urlStr.endsWith('.bin') ||
        /\.(json|onnx|bin)($|\?)/.test(urlStr))
    ) {
      return new Response(null, {
        status: 404,
        statusText: 'SPA HTML Fallback Intercepted',
      });
    }

    return response;
  };
}

async function initKokoro(): Promise<boolean> {
  if (ttsInstance) return true;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const useLocalModels =
        typeof import.meta !== 'undefined' &&
        (import.meta as any).env?.VITE_USE_LOCAL_MODELS === 'true';

      // Aplicamos el escudo contra el SPA fallback de Vite ANTES de importar o inicializar kokoro-js
      patchWorkerFetchForSpaFallback(useLocalModels);

      // Limpiar entradas corruptas previas en CacheStorage (si Vite guardó index.html como config.json)
      if (typeof self !== 'undefined' && 'caches' in self) {
        try {
          const cache = await self.caches.open('transformers-cache');
          const keys = await cache.keys();
          for (const req of keys) {
            if (
              req.url.includes('localhost') ||
              req.url.includes('tauri.localhost')
            ) {
              await cache.delete(req);
            } else {
              const res = await cache.match(req);
              if (res) {
                const ct = res.headers.get('content-type') || '';
                if (ct.includes('text/html')) {
                  await cache.delete(req);
                }
              }
            }
          }
        } catch {
          // Ignorar si la caché no existe aún
        }
      }

      const kokoroModule = await import('kokoro-js');
      const { KokoroTTS } = kokoroModule;

      const canUseWebGPU = await checkWebGPUSupport();

      try {
        const { env } = await import('@huggingface/transformers');
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

      // Use 'q8' by default on desktop for superior SIMD execution speed on both AVX2 and legacy AVX CPUs.
      // Reserve 'q4' only for severe memory constraints (<= 2 GB RAM) or mobile environments,
      // avoiding the software nibble unpacking overhead of q4 on non-VNNI CPUs.
      const nav =
        typeof navigator !== 'undefined' ? (navigator as unknown as NavigatorWithGPU) : undefined;
      const deviceMemory = nav?.deviceMemory || 8;
      const isMobile =
        typeof navigator !== 'undefined' &&
        /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '');
      const wasmDtype = deviceMemory <= 2 || isMobile ? 'q4' : 'q8';

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
    if (!isReady || !ttsInstance) {
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

    const segments = splitTextForFastTTFA(text);
    for (const segment of segments) {
      if (abortedRequestIds.has(id) || activeRequestId !== id) {
        abortedRequestIds.delete(id);
        break;
      }

      const result = await ttsInstance.generate(segment, {
        voice: (voice as any) || 'af_heart',
        speed: speed || 1.0,
      });

      if (abortedRequestIds.has(id) || activeRequestId !== id) {
        abortedRequestIds.delete(id);
        break;
      }

      if (result) {
        const rawSamples: Float32Array | null =
          result.audio instanceof Float32Array
            ? result.audio
            : (result.audio?.audio as Float32Array | undefined) ||
              (result instanceof Float32Array ? result : null);

        if (rawSamples && rawSamples.length > 0) {
          const ownsBuffer =
            rawSamples.buffer instanceof ArrayBuffer &&
            rawSamples.byteOffset === 0 &&
            rawSamples.byteLength === rawSamples.buffer.byteLength;
          const samples = ownsBuffer ? rawSamples : new Float32Array(rawSamples);

          applyAntiClickEnvelopeJS(samples);

          const sampleRate = result.sampling_rate || result.audio?.sampling_rate || 24000;
          const chunkRes: WorkerOutMessage = {
            type: 'AUDIO_CHUNK',
            id,
            samples,
            sampleRate,
          };
          (self.postMessage as any)(chunkRes, [samples.buffer]);
        }
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
