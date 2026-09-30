import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AudioService } from '../AudioService';

describe('AudioService', () => {
  let audioService: AudioService;

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
});
