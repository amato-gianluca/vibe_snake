export interface Track {
  id: string;
  title: string;
  artist: string;
  genre: string;
  bpm: number;
  duration: number; // in seconds
  description: string;
  accentColor: string;
  glowClass: string;
  synths: {
    scale: number[]; // MIDI notes or base frequencies
    bassNotes: number[];
    tempo: number;
    mood: string;
  };
}

export type Point = {
  x: number;
  y: number;
};

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export type FoodType = 'regular' | 'cyber' | 'multiplier';

export interface FoodItem {
  x: number;
  y: number;
  type: FoodType;
  points: number;
  color: string;
  glowColor: string;
  spawnTime: number;
  duration?: number; // expiry in ms if temporary
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
}

export type GameSpeed = 'chill' | 'cyber' | 'overdrive' | 'beat-sync';

export interface GameTheme {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  gridLine: string;
  glow: string;
}
