export class SoundService {
  private static ctx: AudioContext | null = null;

  private static getContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Play synthesized positive sound
  public static playCorrect() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      
      const playTone = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        
        gain.gain.setValueAtTime(0.15, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + duration);
      };

      // Arpeggio
      playTone(523.25, now, 0.12); // C5
      playTone(659.25, now + 0.1, 0.12); // E5
      playTone(783.99, now + 0.2, 0.25); // G5
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  }

  // Play synthesized encouraging neutral/incorrect sound
  public static playIncorrect() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      
      const playTone = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);
        
        gain.gain.setValueAtTime(0.12, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + duration);
      };

      playTone(293.66, now, 0.15); // D4
      playTone(220.00, now + 0.15, 0.3); // A3
    } catch (e) {
      console.warn(e);
    }
  }

  // Play celebration chord on finish
  public static playTriumph() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      const playTone = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.1, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + duration);
      };

      playTone(261.63, now, 0.4); // C4
      playTone(329.63, now + 0.08, 0.4); // E4
      playTone(392.00, now + 0.16, 0.4); // G4
      playTone(523.25, now + 0.24, 0.6); // C5
    } catch (e) {
      console.warn(e);
    }
  }

  // Native Web Speech API Text-to-Speech (TTS) reading question in Vietnamese
  public static speak(text: string) {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported in this browser.');
      return;
    }

    try {
      // Cancel previous speaking first
      window.speechSynthesis.cancel();

      // Clean the text from symbols like [____] or question marks
      const cleanText = text
        .replace(/\[____\]/g, 'chỗ trống')
        .replace(/\?/g, 'hỏi chấm')
        .replace(/\+/g, ' cộng ')
        .replace(/-/g, ' trừ ')
        .replace(/x/g, ' nhân ')
        .replace(/:/g, ' chia ');

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'vi-VN';
      utterance.rate = 0.9; // Slightly slower for kids to hear clearly
      utterance.pitch = 1.1; // Friendly higher pitch
      
      // Try to find a Vietnamese voice if available
      const voices = window.speechSynthesis.getVoices();
      const viVoice = voices.find(v => v.lang.startsWith('vi'));
      if (viVoice) {
        utterance.voice = viVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('Speech synthesis error:', err);
    }
  }

  public static stopSpeaking() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}
