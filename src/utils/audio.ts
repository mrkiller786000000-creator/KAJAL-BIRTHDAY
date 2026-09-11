// Web Audio API pure synthesizer for birthday sound effects and celebratory music

class AudioManager {
  private ctx: AudioContext | null = null;
  private bgOscillators: OscillatorNode[] = [];
  private bgGain: GainNode | null = null;
  private isBgmPlaying = false;
  private bgmTimeoutId: number | null = null;
  public soundEnabled = true;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // Play musical chime for letter click
  playChime(index: number) {
    if (!this.soundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const frequencies = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5]; // C5, D5, E5, G5, A5, C6
    const freq = frequencies[index % frequencies.length];

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, ctx.currentTime + 0.08);
    osc.frequency.exponentialRampToValueAtTime(freq, ctx.currentTime + 0.3);

    // Harmonic sparkle
    const harm = ctx.createOscillator();
    const harmGain = ctx.createGain();
    harm.type = 'triangle';
    harm.frequency.setValueAtTime(freq * 2, ctx.currentTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3000, ctx.currentTime);

    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.28, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);

    harmGain.gain.setValueAtTime(0.001, ctx.currentTime);
    harmGain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.02);
    harmGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.8);

    osc.connect(gain);
    harm.connect(harmGain);
    harmGain.connect(gain);
    gain.connect(filter);
    filter.connect(ctx.destination);

    osc.start();
    harm.start();
    osc.stop(ctx.currentTime + 1.25);
    harm.stop(ctx.currentTime + 0.85);
  }

  // Balloon pop sound effect
  playPop() {
    if (!this.soundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    // White noise buffer for crisp rubber pop
    const bufferSize = ctx.sampleRate * 0.12;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(900, ctx.currentTime);
    filter.Q.setValueAtTime(1.5, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.45, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    // Deep thud component
    const thud = ctx.createOscillator();
    const thudGain = ctx.createGain();
    thud.type = 'sine';
    thud.frequency.setValueAtTime(160, ctx.currentTime);
    thud.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.1);
    thudGain.gain.setValueAtTime(0.4, ctx.currentTime);
    thudGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    thud.connect(thudGain);
    thudGain.connect(ctx.destination);

    noise.start();
    thud.start();
    noise.stop(ctx.currentTime + 0.13);
    thud.stop(ctx.currentTime + 0.11);
  }

  // Candle extinguish sound (gentle air puff + sizzle)
  playExtinguish() {
    if (!this.soundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    // Breath / air puff
    const bufferSize = ctx.sampleRate * 0.25;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.25);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

    // Soft high chime note to reward extinguishing
    const bell = ctx.createOscillator();
    const bellGain = ctx.createGain();
    bell.type = 'sine';
    bell.frequency.setValueAtTime(880 + Math.random() * 200, ctx.currentTime);
    bellGain.gain.setValueAtTime(0.12, ctx.currentTime);
    bellGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    bell.connect(bellGain);
    bellGain.connect(ctx.destination);

    noise.start();
    bell.start();
    noise.stop(ctx.currentTime + 0.26);
    bell.stop(ctx.currentTime + 0.51);
  }

  // Fanfare / Celebration when all candles are blown out
  playFanfare() {
    if (!this.soundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    // Happy Birthday opening melody notes in C major
    // G4, G4, A4, G4, C5, B4 -- G4, G4, A4, G4, D5, C5
    const notes = [
      { f: 392.0, d: 0.25, time: 0 },
      { f: 392.0, d: 0.25, time: 0.3 },
      { f: 440.0, d: 0.5, time: 0.6 },
      { f: 392.0, d: 0.5, time: 1.15 },
      { f: 523.25, d: 0.5, time: 1.7 },
      { f: 493.88, d: 0.9, time: 2.25 },
      // second phrase
      { f: 392.0, d: 0.25, time: 3.2 },
      { f: 392.0, d: 0.25, time: 3.5 },
      { f: 440.0, d: 0.5, time: 3.8 },
      { f: 392.0, d: 0.5, time: 4.35 },
      { f: 587.33, d: 0.5, time: 4.9 },
      { f: 523.25, d: 1.2, time: 5.45 },
    ];

    notes.forEach(n => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.f, ctx.currentTime + n.time);

      gain.gain.setValueAtTime(0.001, ctx.currentTime + n.time);
      gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + n.time + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + n.time + n.d);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + n.time);
      osc.stop(ctx.currentTime + n.time + n.d + 0.05);
    });
  }

  // Gift box magic ribbon unwrap & open sound
  playGiftUnwrap() {
    if (!this.soundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    // Ascending fairy magic chime glissando
    const freqs = [329.63, 415.3, 493.88, 659.25, 830.61, 987.77, 1318.51, 1661.22];
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = ctx.currentTime + i * 0.08;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.exponentialRampToValueAtTime(0.2, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.75);
    });

    // Sub bass bloom
    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(90, ctx.currentTime + 0.3);
    sub.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 1.2);
    subGain.gain.setValueAtTime(0.3, ctx.currentTime + 0.3);
    subGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
    sub.connect(subGain);
    subGain.connect(ctx.destination);
    sub.start(ctx.currentTime + 0.3);
    sub.stop(ctx.currentTime + 1.25);
  }

  // Gentle music-box style celebration loop
  toggleBgm(): boolean {
    if (this.isBgmPlaying) {
      this.stopBgm();
      return false;
    } else {
      this.startBgm();
      return true;
    }
  }

  getIsBgmPlaying(): boolean {
    return this.isBgmPlaying;
  }

  private startBgm() {
    const ctx = this.getContext();
    if (!ctx) return;
    this.isBgmPlaying = true;

    const playLoop = () => {
      if (!this.isBgmPlaying) return;
      const t = ctx.currentTime;
      const notes = [
        523.25, 523.25, 587.33, 523.25, 698.46, 659.25,
        523.25, 523.25, 587.33, 523.25, 783.99, 698.46,
        523.25, 523.25, 1046.5, 880.0, 698.46, 659.25, 587.33,
        932.33, 932.33, 880.0, 698.46, 783.99, 698.46
      ];
      const durations = [
        0.35, 0.35, 0.7, 0.7, 0.7, 1.2,
        0.35, 0.35, 0.7, 0.7, 0.7, 1.2,
        0.35, 0.35, 0.7, 0.7, 0.7, 0.7, 1.2,
        0.35, 0.35, 0.7, 0.7, 0.7, 1.4
      ];

      let elapsed = 0;
      for (let i = 0; i < notes.length; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(notes[i], t + elapsed);

        gain.gain.setValueAtTime(0.001, t + elapsed);
        gain.gain.exponentialRampToValueAtTime(0.04, t + elapsed + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + elapsed + durations[i] * 0.9);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t + elapsed);
        osc.stop(t + elapsed + durations[i]);

        elapsed += durations[i];
      }

      this.bgmTimeoutId = window.setTimeout(playLoop, (elapsed + 1.5) * 1000);
    };

    playLoop();
  }

  private stopBgm() {
    this.isBgmPlaying = false;
    if (this.bgmTimeoutId) {
      clearTimeout(this.bgmTimeoutId);
      this.bgmTimeoutId = null;
    }
  }
}

export const audio = new AudioManager();
