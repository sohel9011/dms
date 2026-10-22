import { PlayerSkin, PowerUpType } from '../types';

export const LANE_WIDTH = 2.6;
export const LANES: [number, number, number] = [-LANE_WIDTH, 0, LANE_WIDTH];

export const INITIAL_SPEED = 22.0; // Units per second
export const MAX_SPEED = 48.0;
export const SPEED_ACCELERATION = 0.35; // Speed increase per 100 meters

export const JUMP_VELOCITY = 14.5;
export const SUPER_JUMP_VELOCITY = 21.0;
export const GRAVITY = -38.0;

export const SLIDE_DURATION = 0.75; // seconds
export const LANE_CHANGE_DURATION = 0.18; // seconds

export const PLAYER_HEIGHT_NORMAL = 1.8;
export const PLAYER_HEIGHT_SLIDE = 0.8;
export const PLAYER_RADIUS = 0.55;

export const SEGMENT_LENGTH = 45;
export const NUM_TRACK_SEGMENTS = 6;
export const TRACK_SPAWN_Z = -SEGMENT_LENGTH * 3.5;
export const TRACK_DESPAWN_Z = SEGMENT_LENGTH * 1.5;

export const POWER_UP_CONFIG: Record<PowerUpType, {
  name: string;
  duration: number;
  color: string;
  iconBg: string;
  description: string;
}> = {
  MAGNET: {
    name: 'Coin Magnet',
    duration: 10,
    color: '#38bdf8', // Sky blue
    iconBg: 'from-sky-500 to-blue-600',
    description: 'Attracts all nearby coins into your pockets',
  },
  MULTIPLIER: {
    name: '2X Multiplier',
    duration: 12,
    color: '#f59e0b', // Amber / gold
    iconBg: 'from-amber-400 to-orange-500',
    description: 'Doubles score gains and coin values',
  },
  SHIELD: {
    name: 'Energy Shield',
    duration: 15,
    color: '#10b981', // Emerald
    iconBg: 'from-emerald-400 to-teal-600',
    description: 'Absorbs one lethal obstacle collision',
  },
  SUPER_JUMP: {
    name: 'Super Spring',
    duration: 10,
    color: '#a855f7', // Purple
    iconBg: 'from-purple-500 to-fuchsia-600',
    description: 'High-altitude jumps over massive trains',
  },
};

export const AVAILABLE_SKINS: PlayerSkin[] = [
  {
    id: 'cyber-runner',
    name: 'DMS Cyber Sprinter',
    primaryColor: '#0284c7', // Cyber blue
    secondaryColor: '#0f172a', // Dark graphite
    accentColor: '#38bdf8', // Neon cyan
    price: 0,
    unlocked: true,
    description: 'Standard issue high-velocity cybernetic track suit',
  },
  {
    id: 'sunset-blaze',
    name: 'Sunset Blaze',
    primaryColor: '#ea580c', // Bright orange
    secondaryColor: '#7c2d12', // Deep amber
    accentColor: '#facc15', // Solar yellow
    price: 150,
    unlocked: false,
    description: 'Supercharged with thermal propulsion exhausts',
  },
  {
    id: 'neon-toxic',
    name: 'Acid Volt',
    primaryColor: '#16a34a', // Toxic green
    secondaryColor: '#14532d', // Deep forest
    accentColor: '#4ade80', // Radioactive lime
    price: 300,
    unlocked: false,
    description: 'Bio-luminescent polymer fiber with reactive glow',
  },
  {
    id: 'golden-champion',
    name: 'Gold Monarch',
    primaryColor: '#eab308', // Radiant gold
    secondaryColor: '#713f12', // Bronze
    accentColor: '#fef08a', // Polished platinum
    price: 600,
    unlocked: false,
    description: 'Forged from championship victory alloy',
  },
];
