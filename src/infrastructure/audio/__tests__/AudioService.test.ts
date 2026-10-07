import { describe, it, expect, vi, beforeEach } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { AudioService } from '../AudioService';

vi.mock('@tauri-apps/api/core', () => {
  class MockChannel<T = any> {
    public onmessage: ((data: T) => void) | null = null;
    constructor() {}
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
      // Simulate speech finishing
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

  it('stops speech synthesis without errors', () => {
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

  it('synthesizes via native backend streaming when running in Tauri and backend is available', async () => {
    // Simulate Tauri runtime
    (window as any).__TAURI_INTERNALS__ = {};

    mockInvoke.mockImplementation(async (cmd: string, args?: any) => {
      if (cmd === 'kokoro_is_ready') return true;
      if (cmd === 'get_build_target') return 'avx2-native';
      if (cmd === 'kokoro_synthesize_stream') {
        // Trigger simulated stream chunk to verify channel
        if (args?.onChunk?.onmessage) {
          args.onChunk.onmessage({
            samples: [0.1, -0.1, 0.2, -0.2],
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
    } as unknown as AudioBuffer;

    const mockSource = {
      connect: vi.fn(),
      start: vi.fn(function (this: any) {
        if (this.onended) this.onended();
      }),
      stop: vi.fn(),
      buffer: null,
      onended: null,
    };

    class MockAudioContext {
      state = 'running';
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

    await audioService.speak('Hello world', 1.0);

    expect(mockInvoke).toHaveBeenCalledWith('kokoro_synthesize_stream', expect.objectContaining({
      text: 'Hello world',
    }));

    delete (window as any).__TAURI_INTERNALS__;
  });
});
