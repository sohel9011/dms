/**
 * Procedural Web Audio Synthesizer for DMS RUN
 * Zero external audio files, 100% client-side synthesis.
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private soundEnabled = true;
  private musicEnabled = true;
  private musicGainNode: GainNode | null = null;
  private sfxGainNode: GainNode | null = null;
  private isBgmPlaying = false;
  private bgmIntervalId: number | null = null;
  private coinPitchIndex = 0;
  private coinResetTimer: number | null = null;

  constructor() {
    // AudioContext will be initialized on first user gesture
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();

      // SFX master gain
      this.sfxGainNode = this.ctx.createGain();
      this.sfxGainNode.gain.value = this.soundEnabled ? 0.6 : 0;
      this.sfxGainNode.connect(this.ctx.destination);

      // Music master gain
      this.musicGainNode = this.ctx.createGain();
      this.musicGainNode.gain.value = this.musicEnabled ? 0.28 : 0;
      this.musicGainNode.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    if (this.sfxGainNode && this.ctx) {
      this.sfxGainNode.gain.setTargetAtTime(enabled ? 0.6 : 0, this.ctx.currentTime, 0.05);
    }
  }

  public setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    if (this.musicGainNode && this.ctx) {
      this.musicGainNode.gain.setTargetAtTime(enabled ? 0.28 : 0, this.ctx.currentTime, 0.05);
    }
  }

  public isSoundOn() {
    return this.soundEnabled;
  }

  public isMusicOn() {
    return this.musicEnabled;
  }

  public playLaneChange() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGainNode) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.1);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.sfxGainNode);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  public playJump() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGainNode) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(560, now + 0.18);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGainNode);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  public playSlide() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGainNode) return;

    // Filtered noise swoosh for slide
    const bufferSize = this.ctx.sampleRate * 0.22;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.4;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    const now = this.ctx.currentTime;
    filter.frequency.setValueAtTime(900, now);
    filter.frequency.exponentialRampToValueAtTime(250, now + 0.22);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.22);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGainNode);

    noise.start(now);
  }

  public playCoin() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGainNode) return;

    const notes = [880, 987, 1174, 1318, 1567, 1760]; // Pentatonic bright chimes
    const freq = notes[this.coinPitchIndex % notes.length];
    this.coinPitchIndex = (this.coinPitchIndex + 1) % notes.length;

    if (this.coinResetTimer) window.clearTimeout(this.coinResetTimer);
    this.coinResetTimer = window.setTimeout(() => {
      this.coinPitchIndex = 0;
    }, 1200);

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, now);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2, now);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGainNode);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.16);
    osc2.stop(now + 0.16);
  }

  public playPowerUp() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGainNode) return;

    const chords = [523.25, 659.25, 783.99, 1046.5]; // C Major arpeggio
    const now = this.ctx.currentTime;

    chords.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGainNode) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = now + idx * 0.05;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.28, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.22);

      osc.connect(gain);
      gain.connect(this.sfxGainNode);

      osc.start(startTime);
      osc.stop(startTime + 0.22);
    });
  }

  public playShieldBreak() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGainNode) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.35);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.sfxGainNode);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  public playCrash() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGainNode) return;

    const now = this.ctx.currentTime;
    // Low punch
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.4);
    oscGain.gain.setValueAtTime(0.6, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc.connect(oscGain);
    oscGain.connect(this.sfxGainNode);
    osc.start(now);
    osc.stop(now + 0.4);

    // Noise crash burst
    const bufferSize = this.ctx.sampleRate * 0.35;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.6;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(100, now + 0.35);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.5, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGainNode);
    noise.start(now);
  }

  public playClick() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGainNode) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.sfxGainNode);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  public startBGM() {
    this.initContext();
    if (this.isBgmPlaying) return;
    this.isBgmPlaying = true;

    // Upbeat electronic runner groove (130 BPM)
    const bpm = 132;
    const sixteenth = (60 / bpm) / 4;
    let step = 0;

    // Bassline and upbeat melody pattern
    const bassNotes = [110, 110, 110, 146.83, 110, 110, 130.81, 164.81];
    const synthNotes = [
      440, 0, 523.25, 0, 659.25, 523.25, 440, 0,
      587.33, 0, 659.25, 0, 523.25, 0, 392, 440
    ];

    const playStep = () => {
      if (!this.isBgmPlaying || !this.ctx || !this.musicGainNode) return;
      const now = this.ctx.currentTime;

      // 1. Kick on beat 0, 4, 8, 12
      if (step % 4 === 0) {
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kickOsc.frequency.setValueAtTime(130, now);
        kickOsc.frequency.exponentialRampToValueAtTime(35, now + 0.08);
        kickGain.gain.setValueAtTime(0.45, now);
        kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        kickOsc.connect(kickGain);
        kickGain.connect(this.musicGainNode);
        kickOsc.start(now);
        kickOsc.stop(now + 0.09);
      }

      // 2. Snare / Hi-hat on step 4, 12 or every even step
      if (step % 8 === 4) {
        // Snare
        const snareNoise = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.06), this.ctx.sampleRate);
        const data = snareNoise.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.25;
        const src = this.ctx.createBufferSource();
        src.buffer = snareNoise;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        src.connect(gain);
        gain.connect(this.musicGainNode);
        src.start(now);
      } else if (step % 2 === 0) {
        // Subtle hi-hat tick
        const hatBuffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.02), this.ctx.sampleRate);
        const data = hatBuffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.12;
        const src = this.ctx.createBufferSource();
        src.buffer = hatBuffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 6000;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGainNode);
        src.start(now);
      }

      // 3. Bass synth
      if (step % 2 === 0) {
        const bassNote = bassNotes[(step / 2) % bassNotes.length];
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'sawtooth';
        bassOsc.frequency.setValueAtTime(bassNote / 2, now);
        bassGain.gain.setValueAtTime(0.18, now);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + sixteenth * 1.8);
        bassOsc.connect(bassGain);
        bassGain.connect(this.musicGainNode);
        bassOsc.start(now);
        bassOsc.stop(now + sixteenth * 1.8);
      }

      // 4. Arpeggiated melody synth
      const noteFreq = synthNotes[step % synthNotes.length];
      if (noteFreq > 0) {
        const noteOsc = this.ctx.createOscillator();
        const noteGain = this.ctx.createGain();
        noteOsc.type = 'sine';
        noteOsc.frequency.setValueAtTime(noteFreq, now);
        noteGain.gain.setValueAtTime(0.14, now);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + sixteenth * 1.5);
        noteOsc.connect(noteGain);
        noteGain.connect(this.musicGainNode);
        noteOsc.start(now);
        noteOsc.stop(now + sixteenth * 1.5);
      }

      step = (step + 1) % 16;
    };

    this.bgmIntervalId = window.setInterval(playStep, sixteenth * 1000);
  }

  public stopBGM() {
    this.isBgmPlaying = false;
    if (this.bgmIntervalId !== null) {
      clearInterval(this.bgmIntervalId);
      this.bgmIntervalId = null;
    }
  }
}

export const soundManager = new SoundManager();
