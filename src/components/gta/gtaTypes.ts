export const TILE = 64;
export const MAP_COLS = 32;
export const MAP_ROWS = 32;

// Tile types
export const T_ROAD_H = 1;
export const T_ROAD_V = 2;
export const T_INTERSECT = 3;
export const T_BLOCK = 4;
export const T_PARK = 5;
export const T_WATER = 6;
export const T_ROAD_TL = 7;
export const T_ROAD_TR = 8;
export const T_ROAD_BL = 9;
export const T_ROAD_BR = 10;

// prettier-ignore
export const CITY_MAP: number[] = [
  6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,
  6,4,4,4,1,4,4,4,4,4,1,4,4,4,4,4,1,4,4,4,4,4,1,4,4,4,4,4,4,4,4,6,
  6,4,4,4,1,4,4,4,4,4,1,4,4,4,4,4,1,4,4,4,4,4,1,4,4,4,4,4,4,4,4,6,
  6,4,4,4,1,4,4,4,4,4,1,4,4,4,4,4,1,4,4,4,4,4,1,4,5,5,5,4,4,4,4,6,
  6,2,2,2,3,2,2,2,2,2,3,2,2,2,2,2,3,2,2,2,2,2,3,2,2,2,2,2,2,2,2,6,
  6,4,4,4,1,4,4,4,4,4,1,5,5,5,5,5,1,4,4,4,4,4,1,4,4,4,4,4,4,4,4,6,
  6,4,4,4,1,4,4,4,4,4,1,5,5,5,5,5,1,4,4,4,4,4,1,4,4,4,4,4,4,4,4,6,
  6,4,4,4,1,4,4,4,4,4,1,5,5,5,5,5,1,4,4,4,4,4,1,4,4,4,4,4,4,4,4,6,
  6,2,2,2,3,2,2,2,2,2,3,2,2,2,2,2,3,2,2,2,2,2,3,2,2,2,2,2,2,2,2,6,
  6,4,4,4,1,4,4,4,4,4,1,4,4,4,4,4,1,4,4,4,4,4,1,4,4,4,4,4,4,4,4,6,
  6,4,4,4,1,4,4,4,4,4,1,4,4,4,4,4,1,4,4,4,4,4,1,4,4,4,4,4,4,4,4,6,
  6,4,4,4,1,4,4,4,4,4,1,4,4,4,4,4,1,4,4,4,4,4,1,4,4,4,4,4,4,4,4,6,
  6,2,2,2,3,2,2,2,2,2,3,2,2,2,2,2,3,2,2,2,2,2,3,2,2,2,2,2,2,2,2,6,
  6,4,4,4,1,4,4,4,4,4,1,4,4,4,4,4,1,4,4,4,4,4,1,4,4,4,4,4,4,4,4,6,
  6,4,4,4,1,4,4,4,4,4,1,4,4,4,4,4,1,4,4,4,4,4,1,4,4,4,4,4,4,4,4,6,
  6,4,4,4,1,4,4,4,4,4,1,4,4,4,4,4,1,4,4,4,4,4,1,4,4,4,4,4,4,4,4,6,
  6,2,2,2,3,2,2,2,2,2,3,2,2,2,2,2,3,2,2,2,2,2,3,2,2,2,2,2,2,2,2,6,
  6,4,4,4,1,4,4,4,4,4,1,4,4,4,4,4,1,4,4,4,4,4,1,4,4,4,4,4,4,4,4,6,
  6,4,4,4,1,4,4,4,4,4,1,4,4,4,4,4,1,4,4,4,4,4,1,4,4,4,4,4,4,4,4,6,
  6,4,4,4,1,4,4,4,4,4,1,4,4,4,4,4,1,4,4,4,4,4,1,4,4,4,4,4,4,4,4,6,
  6,2,2,2,3,2,2,2,2,2,3,2,2,2,2,2,3,2,2,2,2,2,3,2,2,2,2,2,2,2,2,6,
  6,4,4,4,1,4,4,4,4,4,1,4,4,4,4,4,1,4,4,4,4,4,1,4,4,4,4,4,4,4,4,6,
  6,4,4,4,1,4,4,4,4,4,1,4,4,4,4,4,1,4,4,4,4,4,1,4,4,4,4,4,4,4,4,6,
  6,4,4,4,1,4,4,4,4,4,1,4,4,4,4,4,1,4,4,4,4,4,1,4,4,4,4,4,4,4,4,6,
  6,2,2,2,3,2,2,2,2,2,3,2,2,2,2,2,3,2,2,2,2,2,3,2,2,2,2,2,2,2,2,6,
  6,4,4,4,1,4,4,4,4,4,1,4,4,4,4,4,1,4,4,4,4,4,1,4,4,4,4,4,4,4,4,6,
  6,4,4,4,1,4,4,4,4,4,1,4,4,4,4,4,1,4,4,4,4,4,1,4,4,4,4,4,4,4,4,6,
  6,4,4,4,1,4,4,4,4,4,1,4,4,4,4,4,1,4,4,4,4,4,1,4,4,4,4,4,4,4,4,6,
  6,2,2,2,3,2,2,2,2,2,3,2,2,2,2,2,3,2,2,2,2,2,3,2,2,2,2,2,2,2,2,6,
  6,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,6,
  6,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,6,
  6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,
];

export function isRoad(tile: number) {
  return tile === T_ROAD_H || tile === T_ROAD_V || tile === T_INTERSECT;
}
export function isSolid(tile: number) {
  return tile === T_BLOCK || tile === T_WATER;
}

export interface Vec2 { x: number; y: number; }

export interface Player {
  x: number; y: number;
  angle: number;
  speed: number;
  inCar: boolean;
  carIndex: number;
  health: number;
  wanted: number;
  money: number;
  onFoot: boolean;
}

export interface Car {
  x: number; y: number;
  angle: number;
  speed: number;
  color: string;
  hp: number;
  isPolice: boolean;
  ai: boolean;
  aiTimer: number;
  aiTarget: Vec2 | null;
}

export interface Bullet {
  x: number; y: number;
  vx: number; vy: number;
  life: number;
  fromPlayer: boolean;
}

export interface Npc {
  x: number; y: number;
  angle: number;
  speed: number;
  flee: boolean;
  fleeTimer: number;
}

export interface Explosion {
  x: number; y: number;
  radius: number;
  maxRadius: number;
  life: number;
}

export interface MissionMarker {
  x: number; y: number;
  id: string;
  label: string;
  color: string;
  active: boolean;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  state: "inactive" | "active" | "complete" | "failed";
  markerStart: Vec2;
  markerEnd: Vec2 | null;
  reward: number;
  step: number;
}

export interface GTAState {
  player: Player;
  cars: Car[];
  bullets: Bullet[];
  npcs: Npc[];
  explosions: Explosion[];
  missions: Mission[];
  activeMission: string | null;
  keys: Record<string, boolean>;
  mouseAngle: number;
  shooting: boolean;
  shootTimer: number;
  time: number;
  wantedTimer: number;
  policeCars: number;
}

export interface UiState {
  health: number;
  money: number;
  wanted: number;
  speed: number;
  inCar: boolean;
  missionTitle: string;
  missionDesc: string;
  missionActive: boolean;
  missionComplete: boolean;
  missionFailed: boolean;
  gameOver: boolean;
}
