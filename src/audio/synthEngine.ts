import { Track, FoodType } from '../types';

export const TRACKS: Track[] = [
  {
    id: 'ai-track-1',
    title: 'NEXUS_OVERDRIVE // 0x01',
    artist: 'SYS_SYNAPSE_01',
    genre: 'GLITCH_SYNTH // ACID',
    bpm: 124,
    duration: 168,
    description: 'HARDWIRE PULSE // 16-BIT ANALOG DRUMS // BASSLINE SUB_ROUTINE ENGAGED.',
    accentColor: '#00f0ff',
    glowClass: 'border-cyan-glitch',
    synths: {
      scale: [261.63, 311.13, 349.23, 392.00, 466.16, 523.25, 622.25, 783.99],
      bassNotes: [65.41, 77.78, 87.31, 98.00],
      tempo: 124,
      mood: 'OVERDRIVE',
    },
  },
  {
    id: 'ai-track-2',
    title: 'CIRCUIT_STATIC // 0x02',
    artist: 'NEURAL_CORE_NULL',
    genre: 'CHILL_GLITCH // LO-RES',
    bpm: 104,
    duration: 195,
    description: 'LO-PASS VOID DRIFT // SHIMMERING BIT-CRUSH ARPS // STATIC NOISE FLOOR.',
    accentColor: '#ff0055',
    glowClass: 'border-magenta-glitch',
    synths: {
      scale: [207.65, 233.08, 261.63, 311.13, 349.23, 415.30, 466.16, 523.25],
      bassNotes: [51.91, 58.27, 65.41, 77.78],
      tempo: 104,
      mood: 'STATIC',
    },
  },
  {
    id: 'ai-track-3',
    title: 'GRID_ACCELERATOR // 0x03',
    artist: 'VECTOR_MATRIX_909',
    genre: 'TERMINAL_RUSH // 136BPM',
    bpm: 136,
    duration: 152,
    description: 'RESONANT ACID 303 // FAST TICK CLOCK // HIGH-VOLTAGE MACHINE DISCHARGE.',
    accentColor: '#00f0ff',
    glowClass: 'border-cyan-glitch',
    synths: {
      scale: [293.66, 329.63, 349.23, 392.00, 440.00, 523.25, 587.33, 659.25],
      bassNotes: [73.42, 82.41, 87.31, 98.00],
      tempo: 136,
      mood: 'RUSH',
    },
  },
];

class NeonSynthAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;

  private isPlaying = false;
  private isMuted = false;
  private volume = 0.75;
  private sfxVolume = 0.8;
  private sfxEnabled = true;

  private currentTrackIndex = 0;
  private playbackTime = 0; // seconds
  private lastTickTime = 0;
  private animationFrameId: number | null = null;

  // Step sequencer clock
  private nextStepTime = 0;
  private currentStep = 0;
  private timerId: number | null = null;
  private lookaheadMs = 25;
  private scheduleAheadTimeSec = 0.1;

  // Custom audio element support (if user uploads a custom song)
  private customAudio: HTMLAudioElement | null = null;
  private customSourceNode: MediaElementAudioSourceNode | null = null;
  private isCustomTrack = false;
  private customTrackMeta: Track | null = null;

  // Listeners
  private onStateChange: (() => void) | null = null;

  constructor() {
    // AudioContext will be initialized on user gesture
  }

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();

      // Master output
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);

      // Analyser for real-time visualizers
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;

      // Music sub-gain
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(1, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      // SFX sub-gain
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      // Connect master to analyser and then destination
      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  }

  public ensureContextRunning() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public subscribe(callback: () => void) {
    this.onStateChange = callback;
  }

  private notify() {
    if (this.onStateChange) {
      this.onStateChange();
    }
  }

  public getCurrentTrack(): Track {
    if (this.isCustomTrack && this.customTrackMeta) {
      return this.customTrackMeta;
    }
    return TRACKS[this.currentTrackIndex];
  }

  public getCurrentTrackIndex(): number {
    return this.currentTrackIndex;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getVolume(): number {
    return this.volume;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public getIsSfxEnabled(): boolean {
    return this.sfxEnabled;
  }

  public getPlaybackTime(): number {
    return this.playbackTime;
  }

  public play() {
    this.ensureContextRunning();
    if (this.isPlaying) return;

    this.isPlaying = true;

    if (this.isCustomTrack && this.customAudio) {
      this.customAudio.play().catch(() => {});
    } else {
      if (this.ctx) {
        this.nextStepTime = this.ctx.currentTime + 0.05;
        this.startScheduler();
      }
    }

    this.lastTickTime = performance.now();
    this.startPlaybackTimer();
    this.notify();
  }

  public pause() {
    if (!this.isPlaying) return;
    this.isPlaying = false;

    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }

    if (this.animationFrameId !== null) {
      window.cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.customAudio) {
      this.customAudio.pause();
    }

    this.notify();
  }

  public togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  public selectTrack(index: number) {
    if (index < 0 || index >= TRACKS.length) return;
    const wasPlaying = this.isPlaying;
    if (this.isPlaying) {
      this.pause();
    }

    if (this.isCustomTrack && this.customAudio) {
      this.customAudio.pause();
      this.isCustomTrack = false;
    }

    this.currentTrackIndex = index;
    this.playbackTime = 0;
    this.currentStep = 0;

    if (wasPlaying) {
      this.play();
    } else {
      this.notify();
    }
  }

  public nextTrack() {
    const nextIdx = (this.currentTrackIndex + 1) % TRACKS.length;
    this.selectTrack(nextIdx);
  }

  public prevTrack() {
    const prevIdx = (this.currentTrackIndex - 1 + TRACKS.length) % TRACKS.length;
    this.selectTrack(prevIdx);
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
    }
    if (this.customAudio) {
      this.customAudio.volume = this.volume;
    }
    this.notify();
  }

  public toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
    }
    this.notify();
  }

  public toggleSfx() {
    this.sfxEnabled = !this.sfxEnabled;
    this.notify();
  }

  public seekTo(seconds: number) {
    const track = this.getCurrentTrack();
    this.playbackTime = Math.max(0, Math.min(track.duration, seconds));
    if (this.isCustomTrack && this.customAudio) {
      this.customAudio.currentTime = this.playbackTime;
    }
    this.notify();
  }

  public loadCustomAudioFile(file: File) {
    this.ensureContextRunning();
    if (!this.ctx || !this.musicGain) return;

    if (this.isPlaying) {
      this.pause();
    }

    const url = URL.createObjectURL(file);
    if (this.customAudio) {
      this.customAudio.pause();
      this.customAudio.src = '';
    }

    const audio = new Audio(url);
    audio.crossOrigin = 'anonymous';
    audio.loop = true;

    // Connect custom audio to Web Audio graph so visualizer and effects work
    try {
      if (!this.customSourceNode && this.ctx) {
        this.customSourceNode = this.ctx.createMediaElementSource(audio);
        this.customSourceNode.connect(this.musicGain);
      }
    } catch {
      // already connected or fallback
    }

    audio.onloadedmetadata = () => {
      this.isCustomTrack = true;
      this.customAudio = audio;
      this.customTrackMeta = {
        id: 'user-custom-track',
        title: file.name.replace(/\.[^/.]+$/, ''),
        artist: 'User Imported Audio',
        genre: 'Custom Audio',
        bpm: 120,
        duration: Math.floor(audio.duration) || 180,
        description: 'Uploaded user audio stream synced with the cyberpunk arcade engine.',
        accentColor: '#10b981',
        glowClass: 'neon-glow-lime',
        synths: {
          scale: [261.63, 329.63, 392.00],
          bassNotes: [65.41, 82.41],
          tempo: 120,
          mood: 'custom',
        },
      };
      this.playbackTime = 0;
      this.play();
    };
  }

  // Visualizer analysis helpers
  public getFrequencyData(array: Uint8Array): void {
    if (this.analyser) {
      (this.analyser as unknown as { getByteFrequencyData: (arr: Uint8Array) => void }).getByteFrequencyData(array);
    } else {
      array.fill(0);
    }
  }

  public getTimeDomainData(array: Uint8Array): void {
    if (this.analyser) {
      (this.analyser as unknown as { getByteTimeDomainData: (arr: Uint8Array) => void }).getByteTimeDomainData(array);
    } else {
      array.fill(128);
    }
  }

  public getBeatEnergy(): number {
    if (!this.analyser) return 0;
    const freqData = new Uint8Array(32);
    (this.analyser as unknown as { getByteFrequencyData: (arr: Uint8Array) => void }).getByteFrequencyData(freqData);
    // Sub-bass and bass energy (bins 1 to 6)
    let sum = 0;
    for (let i = 1; i <= 6; i++) {
      sum += freqData[i];
    }
    return sum / (6 * 255); // 0 to 1
  }

  // Step sequencer logic for procedural generative music
  private startScheduler() {
    if (this.timerId !== null) clearInterval(this.timerId);
    this.timerId = window.setInterval(() => {
      this.scheduleNotes();
    }, this.lookaheadMs);
  }

  private scheduleNotes() {
    if (!this.ctx || !this.isPlaying || this.isCustomTrack) return;

    const track = TRACKS[this.currentTrackIndex];
    const secondsPerBeat = 60.0 / track.bpm;
    const stepDuration = secondsPerBeat / 4; // 16th note steps

    while (this.nextStepTime < this.ctx.currentTime + this.scheduleAheadTimeSec) {
      this.playSynthStep(this.currentStep, this.nextStepTime, track);
      this.nextStepTime += stepDuration;
      this.currentStep = (this.currentStep + 1) % 64; // 4-bar loop
    }
  }

  private playSynthStep(step: number, time: number, track: Track) {
    if (!this.ctx || !this.musicGain) return;

    const isBeat = step % 4 === 0;
    const isHalfBeat = step % 2 === 0;
    const bar = Math.floor(step / 16);

    // 1. Kick Drum
    let playKick = false;
    if (track.id === 'ai-track-1') {
      // 4-on-the-floor kick
      playKick = isBeat;
    } else if (track.id === 'ai-track-2') {
      // Chillwave kick on 0, 6, 10
      const beatInBar = step % 16;
      playKick = beatInBar === 0 || beatInBar === 7 || beatInBar === 10;
    } else if (track.id === 'ai-track-3') {
      // Pumping arcade rush
      playKick = isBeat || (bar === 3 && step % 16 >= 12 && isHalfBeat);
    }

    if (playKick) {
      this.synthKick(time, track.id === 'ai-track-2' ? 0.7 : 1.0);
    }

    // 2. Snare / Clap
    let playSnare = false;
    if (track.id === 'ai-track-1') {
      playSnare = (step % 16 === 4) || (step % 16 === 12);
    } else if (track.id === 'ai-track-2') {
      playSnare = (step % 16 === 8);
    } else if (track.id === 'ai-track-3') {
      playSnare = (step % 16 === 4) || (step % 16 === 12) || (bar === 3 && step % 16 === 15);
    }

    if (playSnare) {
      this.synthSnare(time, track.id === 'ai-track-2' ? 0.5 : 0.8);
    }

    // 3. Hi-Hat
    if (track.id === 'ai-track-1') {
      // Offbeat open hat and 16th closed hats
      const isOpen = (step % 4 === 2);
      this.synthHiHat(time, isOpen, 0.4);
    } else if (track.id === 'ai-track-2') {
      if (isHalfBeat && step % 4 !== 0) {
        this.synthHiHat(time, false, 0.25);
      }
    } else if (track.id === 'ai-track-3') {
      // Fast ticking cyber hats
      this.synthHiHat(time, step % 4 === 2, 0.45);
    }

    // 4. Bassline
    this.synthBassStep(step, time, track);

    // 5. Melodic Arp / Lead
    this.synthLeadStep(step, time, track);

    // 6. Atmospheric Pad (at start of each bar)
    if (step % 16 === 0) {
      this.synthPadChord(time, track, bar);
    }
  }

  private synthKick(time: number, power: number = 1.0) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    // Punchy pitch drop: from 140Hz down to 45Hz
    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(45, time + 0.08);

    gain.gain.setValueAtTime(0.8 * power, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.28);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + 0.3);
  }

  private synthSnare(time: number, volume: number = 0.8) {
    if (!this.ctx || !this.musicGain) return;

    // Noise buffer for snap
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.setValueAtTime(1000, time);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.5 * volume, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.14);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.musicGain);

    // Body tone
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, time);
    osc.frequency.exponentialRampToValueAtTime(70, time + 0.08);

    oscGain.gain.setValueAtTime(0.4 * volume, time);
    oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.09);

    osc.connect(oscGain);
    oscGain.connect(this.musicGain);

    noise.start(time);
    noise.stop(time + 0.15);
    osc.start(time);
    osc.stop(time + 0.1);
  }

  private synthHiHat(time: number, isOpen: boolean, volume: number = 0.35) {
    if (!this.ctx || !this.musicGain) return;

    const bufferSize = this.ctx.sampleRate * (isOpen ? 0.2 : 0.04);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(8000, time);
    filter.Q.setValueAtTime(2.5, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.005, time + (isOpen ? 0.18 : 0.035));

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    noise.start(time);
    noise.stop(time + (isOpen ? 0.2 : 0.04));
  }

  private synthBassStep(step: number, time: number, track: Track) {
    if (!this.ctx || !this.musicGain) return;

    const bar = Math.floor(step / 16);
    const bassRoot = track.synths.bassNotes[bar % track.synths.bassNotes.length];

    // Determine bass note pitch for this step
    let freq = bassRoot;
    let shouldPlay = false;

    if (track.id === 'ai-track-1') {
      // 16th note rolling synthwave bass
      shouldPlay = true;
      const octaveMod = (step % 2 === 1) ? 2 : 1; // Octave alternation
      freq = bassRoot * octaveMod;
    } else if (track.id === 'ai-track-2') {
      // Laid back chill bass on beats
      shouldPlay = (step % 4 === 0) || (step % 16 === 6);
      freq = bassRoot;
    } else if (track.id === 'ai-track-3') {
      // Resonant 303 acid line
      shouldPlay = (step % 2 === 0) || (step % 8 === 5);
      const mod = [1, 1.25, 1, 1.5, 1, 2, 1.25, 0.75][step % 8];
      freq = bassRoot * mod;
    }

    if (!shouldPlay) return;

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = track.id === 'ai-track-3' ? 'sawtooth' : 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    const cutoff = track.id === 'ai-track-3' ? 1200 : 600;
    filter.frequency.setValueAtTime(cutoff, time);
    filter.frequency.exponentialRampToValueAtTime(140, time + 0.12);
    filter.Q.setValueAtTime(track.id === 'ai-track-3' ? 8 : 3, time);

    gain.gain.setValueAtTime(0.35, time);
    gain.gain.exponentialRampToValueAtTime(0.005, time + 0.14);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + 0.15);
  }

  private synthLeadStep(step: number, time: number, track: Track) {
    if (!this.ctx || !this.musicGain) return;

    // Arp patterns
    const scale = track.synths.scale;
    let noteIdx = -1;

    if (track.id === 'ai-track-1') {
      // Cyber Arpeggio: 8th or 16th notes
      const pattern = [0, 2, 4, 7, 5, 4, 2, 1, 0, 3, 5, 7, 6, 5, 3, 2];
      noteIdx = pattern[step % pattern.length];
    } else if (track.id === 'ai-track-2') {
      // Chill pentatonic bell chords
      const pattern = [0, -1, 3, -1, 5, -1, 2, -1, 4, -1, 6, -1, 3, -1, 1, -1];
      noteIdx = pattern[step % pattern.length];
    } else if (track.id === 'ai-track-3') {
      // High energy arcade run
      const pattern = [0, 4, 7, 11, 7, 4, 2, 5, 0, 7, 4, 9, 7, 5, 3, 2];
      noteIdx = pattern[step % pattern.length];
    }

    if (noteIdx < 0 || noteIdx >= scale.length) return;

    const freq = scale[noteIdx];
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = track.id === 'ai-track-2' ? 'sine' : 'square';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2400, time);
    filter.frequency.exponentialRampToValueAtTime(600, time + 0.18);

    gain.gain.setValueAtTime(0.18, time);
    gain.gain.exponentialRampToValueAtTime(0.002, time + 0.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + 0.22);
  }

  private synthPadChord(time: number, track: Track, bar: number) {
    if (!this.ctx || !this.musicGain) return;

    // Cyber minor 7th pad chord
    const root = track.synths.bassNotes[bar % track.synths.bassNotes.length] * 2;
    const chordPitches = [root, root * 1.2, root * 1.5, root * 1.8]; // minor 7th approx

    chordPitches.forEach((freq) => {
      if (!this.ctx || !this.musicGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1000, time);

      // Slow attack & release pad
      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(0.04, time + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 2.4);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);

      osc.start(time);
      osc.stop(time + 2.5);
    });
  }

  // Playback timer ticker to update progress bar and track loop
  private startPlaybackTimer() {
    const updateTime = () => {
      if (!this.isPlaying) return;

      const now = performance.now();
      const dt = (now - this.lastTickTime) / 1000;
      this.lastTickTime = now;

      if (this.isCustomTrack && this.customAudio) {
        this.playbackTime = this.customAudio.currentTime;
      } else {
        const track = this.getCurrentTrack();
        this.playbackTime += dt;
        if (this.playbackTime >= track.duration) {
          this.playbackTime = 0; // loop track seamlessly
        }
      }

      this.animationFrameId = requestAnimationFrame(updateTime);
    };

    this.animationFrameId = requestAnimationFrame(updateTime);
  }

  // GAME SFX
  public playEatSound(type: FoodType = 'regular') {
    if (!this.sfxEnabled) return;
    this.ensureContextRunning();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (type === 'cyber') {
      // Dual high chime
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, t);
      osc.frequency.setValueAtTime(1320, t + 0.06);
      osc.frequency.exponentialRampToValueAtTime(1760, t + 0.14);

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.005, t + 0.22);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.24);
    } else if (type === 'multiplier') {
      // Ascending triumphant cyber triad
      const notes = [587.33, 739.99, 880, 1174.66];
      notes.forEach((freq, i) => {
        if (!this.ctx || !this.sfxGain) return;
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(freq, t + i * 0.04);
        g.gain.setValueAtTime(0.25, t + i * 0.04);
        g.gain.exponentialRampToValueAtTime(0.005, t + i * 0.04 + 0.15);
        o.connect(g);
        g.connect(this.sfxGain);
        o.start(t + i * 0.04);
        o.stop(t + i * 0.04 + 0.16);
      });
    } else {
      // Regular neon blip
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, t);
      osc.frequency.exponentialRampToValueAtTime(880, t + 0.07);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.005, t + 0.1);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.12);
    }
  }

  public playGameOverSound() {
    if (!this.sfxEnabled) return;
    this.ensureContextRunning();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(280, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.45);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.48);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.5);
  }

  public playStartSound() {
    if (!this.sfxEnabled) return;
    this.ensureContextRunning();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.25);

    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.3, t + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.005, t + 0.35);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.38);
  }

  public playTurnSound() {
    if (!this.sfxEnabled) return;
    // Extremely subtle tick
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, t);
    gain.gain.setValueAtTime(0.03, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.025);
  }
}

export const audioEngine = new NeonSynthAudioEngine();
