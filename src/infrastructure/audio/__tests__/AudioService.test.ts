import { describe, it, expect, vi, beforeEach } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { AudioService } from '../AudioService';
import { splitTextForFastTTFA, applyAntiClickEnvelopeJS } from '../kokoro.worker';

vi.mock('@tauri-apps/api/core', () => {
  class MockChannel<T = any> {
    public onmessage: ((data: T) => void) | null = null;
    constructor() { }
  }
  return {
    invoke: vi.fn(),
    Channel: MockChannel,
  };
});

describe('AudioService', () => {
  let audioService: AudioService;
  const mockInvoke = vi.mocked(invoke);

  beforeEach(() => {
    vi.clearAllMocks();
    audioService = new AudioService();
  });

  it('instantiates correctly and detects environment', () => {
    expect(audioService).toBeDefined();
    expect(typeof audioService.isTauri).toBe('function');
    // In vitest jsdom, isTauri should be false by default
    expect(audioService.isTauri()).toBe(false);
  });

  it('returns empty voices and not ready when outside Tauri', async () => {
    const ready = await audioService.isBackendAvailable();
    const voices = await audioService.getBackendVoices();
    expect(ready).toBe(false);
    expect(voices).toEqual([]);
  });

  it('reports web build target when outside Tauri', async () => {
    const target = await audioService.getBuildTarget?.();
    expect(target).toBe('web');
  });

  it('reports active engine as webspeech or wasm/webgpu when backend is not ready', async () => {
    const engine = await audioService.getActiveEngine?.();
    expect(['webspeech', 'wasm', 'webgpu']).toContain(engine);
  });

  it('falls back to Web Speech API when not running in Tauri', async () => {
    const cancelMock = vi.fn();
    const speakMock = vi.fn((utterance: SpeechSynthesisUtterance) => {
      if (utterance.onend) utterance.onend(new Event('end') as SpeechSynthesisEvent);
    });

    class MockSpeechSynthesisUtterance {
      public text: string;
      public lang = '';
      public rate = 1.0;
      public voice: any = null;
      public onend: ((ev: any) => any) | null = null;
      public onerror: ((ev: any) => any) | null = null;
      constructor(text: string) {
        this.text = text;
      }
    }

    // @ts-expect-error test mock
    window.SpeechSynthesisUtterance = MockSpeechSynthesisUtterance;
    Object.defineProperty(window, 'speechSynthesis', {
      writable: true,
      value: {
        cancel: cancelMock,
        speak: speakMock,
        getVoices: () => [],
      },
    });

    await audioService.speak('test word', 1.0);
    expect(cancelMock).toHaveBeenCalled();
    expect(speakMock).toHaveBeenCalled();
  });

  it('stops speech synthesis without errors and invokes kokoro_stop in Tauri', () => {
    (window as any).__TAURI_INTERNALS__ = {};
    const cancelMock = vi.fn();
    Object.defineProperty(window, 'speechSynthesis', {
      writable: true,
      value: {
        cancel: cancelMock,
        speak: vi.fn(),
        getVoices: () => [],
      },
    });

    audioService.stop();
    expect(cancelMock).toHaveBeenCalled();
    expect(mockInvoke).toHaveBeenCalledWith('kokoro_stop');

    delete (window as any).__TAURI_INTERNALS__;
  });

  it('exposes active device (wasm or webgpu)', () => {
    const device = audioService.getActiveDevice();
    expect(['wasm', 'webgpu']).toContain(device);
  });

  it('handles stop gracefully even when multiple invocations occur', () => {
    expect(() => {
      audioService.stop();
      audioService.stop();
    }).not.toThrow();
  });

  it('synthesizes via native backend streaming with binary samples_bytes (Uint8Array zero-copy)', async () => {
    (window as any).__TAURI_INTERNALS__ = {};

    // Prepare raw Float32 samples converted to Uint8Array bytes (Little-Endian)
    const floatSamples = new Float32Array([0.1, -0.1, 0.2, -0.2]);
    const byteView = new Uint8Array(floatSamples.buffer, floatSamples.byteOffset, floatSamples.byteLength);

    mockInvoke.mockImplementation(async (cmd: string, args?: any) => {
      if (cmd === 'kokoro_is_ready') return true;
      if (cmd === 'get_build_target') return 'avx2-native';
      if (cmd === 'kokoro_synthesize_stream') {
        if (args?.onChunk?.onmessage) {
          args.onChunk.onmessage({
            samples_bytes: byteView,
            sample_rate: 24000,
            chunk_index: 0,
            is_final: true,
          });
        }
        return undefined;
      }
      return null;
    });

    const mockChannelData = new Float32Array(4);
    const copyToChannelMock = vi.fn();
    const mockAudioBuffer = {
      length: 4,
      numberOfChannels: 1,
      sampleRate: 24000,
      duration: 0.1,
      getChannelData: vi.fn().mockReturnValue(mockChannelData),
      copyToChannel: copyToChannelMock,
    } as unknown as AudioBuffer;

    const mockSource = {
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(function (this: any) {
        if (this.onended) this.onended();
      }),
      stop: vi.fn(),
      buffer: null,
      onended: null,
    };

    class MockAudioContext {
      state = 'running';
      currentTime = 0;
      destination = {};
      resume = vi.fn().mockResolvedValue(undefined);
      createBuffer = vi.fn().mockReturnValue(mockAudioBuffer);
      createBufferSource = vi.fn().mockReturnValue(mockSource);
    }

    // @ts-expect-error test mock
    window.AudioContext = MockAudioContext;

    expect(await audioService.isBackendAvailable()).toBe(true);
    expect(await audioService.getBuildTarget?.()).toBe('avx2-native');
    expect(await audioService.getActiveEngine?.()).toBe('native-avx2');

    await audioService.speak('Hello binary zero-copy stream', 1.0);

    expect(copyToChannelMock).toHaveBeenCalled();
    expect(mockInvoke).toHaveBeenCalledWith(
      'kokoro_synthesize_stream',
      expect.objectContaining({
        text: 'Hello binary zero-copy stream',
      }),
    );

    delete (window as any).__TAURI_INTERNALS__;
  });

  it('detects avx-native tier correctly for Sandy/Ivy Bridge CPUs', async () => {
    (window as any).__TAURI_INTERNALS__ = {};

    mockInvoke.mockImplementation(async (cmd: string) => {
      if (cmd === 'kokoro_is_ready') return true;
      if (cmd === 'get_build_target') return 'avx-native';
      return null;
    });

    expect(await audioService.isBackendAvailable()).toBe(true);
    expect(await audioService.getBuildTarget?.()).toBe('avx-native');
    expect(await audioService.getActiveEngine?.()).toBe('native-avx');

    delete (window as any).__TAURI_INTERNALS__;
  });

  it('prefetches audio into cache and plays cached buffer with zero synthesis calls on speak()', async () => {
    (window as any).__TAURI_INTERNALS__ = {};

    mockInvoke.mockImplementation(async (cmd: string, args?: any) => {
      if (cmd === 'kokoro_is_ready') return true;
      if (cmd === 'kokoro_synthesize_stream') {
        if (args?.onChunk?.onmessage) {
          args.onChunk.onmessage({
            samples: new Float32Array([0.05, -0.05, 0.1, -0.1]),
            sample_rate: 24000,
            chunk_index: 0,
            is_final: true,
          });
        }
        return undefined;
      }
      return null;
    });

    const mockChannelData = new Float32Array(4);
    const mockAudioBuffer = {
      length: 4,
      numberOfChannels: 1,
      sampleRate: 24000,
      duration: 0.1,
      getChannelData: vi.fn().mockReturnValue(mockChannelData),
      copyToChannel: vi.fn(),
    } as unknown as AudioBuffer;

    const mockSource = {
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(function (this: any) {
        if (this.onended) this.onended();
      }),
      stop: vi.fn(),
      buffer: null,
      onended: null,
    };

    class MockAudioContext {
      state = 'running';
      currentTime = 0;
      destination = {};
      resume = vi.fn().mockResolvedValue(undefined);
      createBuffer = vi.fn().mockReturnValue(mockAudioBuffer);
      createBufferSource = vi.fn().mockReturnValue(mockSource);
    }

    // @ts-expect-error test mock
    window.AudioContext = MockAudioContext;

    await audioService.prefetch('resilient', 1.0, 'af_heart');
    expect(mockSource.start).not.toHaveBeenCalled();

    // Clear invoke history and now speak the prefetched word
    mockInvoke.mockClear();
    await audioService.speak('resilient', 1.0, 'af_heart');

    // Should play from AudioBuffer cache without invoking kokoro_synthesize_stream again
    expect(mockInvoke).not.toHaveBeenCalledWith('kokoro_synthesize_stream', expect.anything());
    expect(mockSource.start).toHaveBeenCalledTimes(1);

    delete (window as any).__TAURI_INTERNALS__;
  });

  it('splits long first sentences into shorter clauses for fast TTFA', () => {
    const longSentence =
      'Although the international conference was postponed due to severe weather conditions, the research team continued working on the presentation.';
    const segments = splitTextForFastTTFA(longSentence);
    expect(segments.length).toBeGreaterThan(1);
    expect(segments[0]).toContain('Although the international conference was postponed');
  });

  it('applies anti-click envelope smoothing to audio samples', () => {
    const samples = new Float32Array(2400).fill(1.0);
    applyAntiClickEnvelopeJS(samples);
    expect(samples[0]).toBeLessThan(0.01);
    expect(samples[samples.length - 1]).toBeLessThan(0.01);
    // Middle samples should remain unaffected
    expect(samples[1200]).toBeCloseTo(1.0, 2);
  });
});
