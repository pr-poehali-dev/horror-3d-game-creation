export const MAP_W = 16;
export const MAP_H = 16;
export const MAP: number[] = [
  1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
  1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
  1,0,1,1,0,1,1,1,0,1,1,0,1,1,0,1,
  1,0,1,0,0,0,0,0,0,0,0,0,0,1,0,1,
  1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1,
  1,0,1,0,1,0,0,0,0,0,0,1,0,1,0,1,
  1,0,1,0,1,1,1,0,0,1,1,1,0,1,0,1,
  1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
  1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
  1,0,1,0,1,1,1,0,0,1,1,1,0,1,0,1,
  1,0,1,0,1,0,0,0,0,0,0,1,0,1,0,1,
  1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1,
  1,0,1,0,0,0,0,0,0,0,0,0,0,1,0,1,
  1,0,1,1,0,1,1,1,0,1,1,0,1,1,0,1,
  1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
  1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
];

export interface Zombie {
  id: number;
  x: number;
  y: number;
  angle: number;
  hp: number;
  maxHp: number;
  state: "idle" | "chase" | "attack" | "dead";
  dist: number;
  hitFlash: number;
}

export interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number;
  color: string;
}

export interface BulletHole {
  x: number; screenX: number; screenY: number; life: number;
}

export interface GameState {
  px: number; py: number; pangle: number;
  health: number;
  ammo: number;
  maxAmmo: number;
  wave: number;
  score: number;
  zombies: Zombie[];
  particles: Particle[];
  bulletHoles: BulletHole[];
  keys: Record<string, boolean>;
  shooting: boolean;
  shootCooldown: number;
  reloading: boolean;
  reloadTimer: number;
  muzzleFlash: number;
  screenShake: number;
  gameOver: boolean;
  waveClear: boolean;
  waveClearTimer: number;
  waveStartTimer: number;
  waveStarting: boolean;
  bobTime: number;
  damageFlash: number;
  zbuf: number[];
}

export interface UiState {
  health: number;
  ammo: number;
  maxAmmo: number;
  wave: number;
  score: number;
  gameOver: boolean;
  reloading: boolean;
  waveClear: boolean;
  waveStarting: boolean;
}

let zombieIdCounter = 0;

export function isWall(x: number, y: number): boolean {
  const mx = Math.floor(x);
  const my = Math.floor(y);
  if (mx < 0 || mx >= MAP_W || my < 0 || my >= MAP_H) return true;
  return MAP[my * MAP_W + mx] === 1;
}

export function spawnZombie(wave: number): Zombie {
  const spawnPoints = [
    {x:1.5,y:1.5},{x:14.5,y:1.5},{x:1.5,y:14.5},{x:14.5,y:14.5},
    {x:7.5,y:1.5},{x:7.5,y:14.5},{x:1.5,y:7.5},{x:14.5,y:7.5},
  ];
  const sp = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
  return {
    id: zombieIdCounter++,
    x: sp.x + (Math.random()-0.5)*0.5,
    y: sp.y + (Math.random()-0.5)*0.5,
    angle: Math.random() * Math.PI * 2,
    hp: 3 + wave,
    maxHp: 3 + wave,
    state: "idle",
    dist: 999,
    hitFlash: 0,
  };
}
