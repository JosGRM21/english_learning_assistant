export interface IAudioService {
  speak(text: string, rate?: number): Promise<void>;
  playFeedback(isCorrect: boolean): void;
  stop(): void;
}

export class AudioService implements IAudioService {
  private audioCtx: AudioContext | null = null;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    return this.audioCtx;
  }

  /**
   * Speaks the provided text using the Web Speech API TTS engine.
   * @param text The sentence or word in English.
   * @param rate Playback rate: 1.0 (normal) or 0.75 (slowed down for phonetics).
   */
  public async speak(text: string, rate = 1.0): Promise<void> {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    return new Promise((resolve) => {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = Math.max(0.5, Math.min(2.0, rate));

      // Attempt to pick a natural General American English voice
      const voices = window.speechSynthesis.getVoices();
      const englishVoice =
        voices.find((v) => v.lang.startsWith('en-US') && (v.name.includes('Natural') || v.name.includes('Neural') || v.name.includes('Google'))) ||
        voices.find((v) => v.lang.startsWith('en'));

      if (englishVoice) {
        utterance.voice = englishVoice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

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
      gain.connect(ctx.destination);

      if (isCorrect) {
        // High harmonic double-tone chime (587 Hz -> 880 Hz)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.exponentialRampToValueAtTime(880.0, now + 0.12); // A5

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.start(now);
        osc.stop(now + 0.35);
      } else {
        // Low soft thud (220 Hz -> 140 Hz)
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

  public stop(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}
