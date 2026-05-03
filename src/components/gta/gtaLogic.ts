import {
  TILE, MAP_COLS, CITY_MAP,
  isSolid, isRoad,
  GTAState, Car, Npc, Mission,
} from "./gtaTypes";

const CAR_COLORS = ["#cc2222","#2255cc","#22aa44","#ccaa22","#aa22cc","#cc7722","#cccccc","#222222"];

export function createInitialState(): GTAState {
  const cars: Car[] = [];

  // Parked & AI cars on roads
  const roadPositions = [
    {x:5*TILE+32,y:4*TILE+20},{x:10*TILE+32,y:4*TILE+20},
    {x:5*TILE+32,y:8*TILE+20},{x:16*TILE+32,y:8*TILE+20},
    {x:10*TILE+32,y:12*TILE+20},{x:22*TILE+32,y:12*TILE+20},
    {x:5*TILE+32,y:16*TILE+20},{x:10*TILE+32,y:20*TILE+20},
    {x:17*TILE+32,y:4*TILE+20},{x:22*TILE+32,y:8*TILE+20},
  ];
  roadPositions.forEach((pos, i) => {
    cars.push({
      x: pos.x, y: pos.y,
      angle: (i % 2 === 0) ? 0 : Math.PI / 2,
      speed: 0,
      color: CAR_COLORS[i % CAR_COLORS.length],
      hp: 100,
      isPolice: false,
      ai: i > 5,
      aiTimer: 0,
      aiTarget: null,
    });
  });

  const npcs: Npc[] = [];
  for (let i = 0; i < 12; i++) {
    const col = 1 + (i * 3) % 28;
    const row = 1 + (i * 5) % 28;
    if (!isSolid(CITY_MAP[row * MAP_COLS + col])) {
      npcs.push({ x: col * TILE + 20, y: row * TILE + 20, angle: Math.random() * Math.PI * 2, speed: 0.4, flee: false, fleeTimer: 0 });
    }
  }

  const missions: Mission[] = [
    {
      id: "m1",
      title: "Забери посылку",
      description: "Подойди к жёлтому маркеру и забери посылку для Тони",
      state: "inactive",
      markerStart: { x: 4*TILE+32, y: 4*TILE+32 },
      markerEnd: { x: 22*TILE+32, y: 20*TILE+32 },
      reward: 500,
      step: 0,
    },
    {
      id: "m2",
      title: "Угони машину",
      description: "Угони красную машину и доставь её на склад",
      state: "inactive",
      markerStart: { x: 10*TILE+32, y: 8*TILE+32 },
      markerEnd: { x: 4*TILE+32, y: 20*TILE+32 },
      reward: 800,
      step: 0,
    },
    {
      id: "m3",
      title: "Уйди от полиции",
      description: "Тебя ищет полиция! Продержись 60 секунд",
      state: "inactive",
      markerStart: { x: 16*TILE+32, y: 16*TILE+32 },
      markerEnd: null,
      reward: 1200,
      step: 0,
    },
  ];

  return {
    player: {
      x: 7 * TILE + 32,
      y: 7 * TILE + 32,
      angle: 0,
      speed: 0,
      inCar: false,
      carIndex: -1,
      health: 100,
      wanted: 0,
      money: 0,
      onFoot: true,
    },
    cars,
    bullets: [],
    npcs,
    explosions: [],
    missions,
    activeMission: null,
    keys: {},
    mouseAngle: 0,
    shooting: false,
    shootTimer: 0,
    time: 0,
    wantedTimer: 0,
    policeCars: 0,
  };
}

function tileAt(wx: number, wy: number): number {
  const col = Math.floor(wx / TILE);
  const row = Math.floor(wy / TILE);
  if (col < 0 || col >= MAP_COLS || row < 0 || row >= MAP_COLS) return 6;
  return CITY_MAP[row * MAP_COLS + col];
}

function canMoveTo(wx: number, wy: number): boolean {
  return !isSolid(tileAt(wx, wy));
}

export function updateGame(s: GTAState, setUi: (u: Parameters<typeof setUi>[0]) => void) {
  s.time++;

  const p = s.player;
  const keys = s.keys;

  // ---- PLAYER ON FOOT ----
  if (!p.inCar) {
    const speed = 2.2;
    const turnSpeed = 0.07;

    if (keys["ArrowLeft"] || keys["KeyA"]) p.angle -= turnSpeed;
    if (keys["ArrowRight"] || keys["KeyD"]) p.angle += turnSpeed;

    let dx = 0, dy = 0;
    if (keys["ArrowUp"] || keys["KeyW"]) { dx = Math.cos(p.angle) * speed; dy = Math.sin(p.angle) * speed; }
    if (keys["ArrowDown"] || keys["KeyS"]) { dx = -Math.cos(p.angle) * speed * 0.5; dy = -Math.sin(p.angle) * speed * 0.5; }

    if (canMoveTo(p.x + dx, p.y)) p.x += dx;
    if (canMoveTo(p.x, p.y + dy)) p.y += dy;

    // Enter car
    if (keys["KeyF"]) {
      s.cars.forEach((car, i) => {
        const dist = Math.hypot(car.x - p.x, car.y - p.y);
        if (dist < 40 && !car.isPolice) {
          p.inCar = true;
          p.carIndex = i;
          car.ai = false;
        }
      });
    }

    // Shoot on foot
    if (s.shooting && s.shootTimer <= 0) {
      s.bullets.push({
        x: p.x, y: p.y,
        vx: Math.cos(p.angle) * 8,
        vy: Math.sin(p.angle) * 8,
        life: 40,
        fromPlayer: true,
      });
      s.shootTimer = 8;
      p.wanted = Math.min(5, p.wanted + 0.05);
    }
  }

  // ---- PLAYER IN CAR ----
  if (p.inCar && p.carIndex >= 0) {
    const car = s.cars[p.carIndex];
    const accel = 0.18;
    const brake = 0.12;
    const maxSpeed = 5.5;
    const turnSpeed = 0.045;
    const friction = 0.95;

    if (keys["ArrowUp"] || keys["KeyW"]) car.speed = Math.min(maxSpeed, car.speed + accel);
    else if (keys["ArrowDown"] || keys["KeyS"]) car.speed = Math.max(-2, car.speed - brake);
    else car.speed *= friction;

    if (Math.abs(car.speed) > 0.1) {
      const turn = turnSpeed * (car.speed / maxSpeed);
      if (keys["ArrowLeft"] || keys["KeyA"]) car.angle -= turn;
      if (keys["ArrowRight"] || keys["KeyD"]) car.angle += turn;
    }

    const nx = car.x + Math.cos(car.angle) * car.speed;
    const ny = car.y + Math.sin(car.angle) * car.speed;

    if (canMoveTo(nx, car.y)) car.x = nx; else { car.speed *= -0.4; }
    if (canMoveTo(car.x, ny)) car.y = ny; else { car.speed *= -0.4; }

    p.x = car.x; p.y = car.y;

    // Exit car
    if (keys["KeyF"] && Math.abs(car.speed) < 0.5) {
      p.inCar = false;
      p.x = car.x + Math.cos(car.angle + Math.PI / 2) * 30;
      p.y = car.y + Math.sin(car.angle + Math.PI / 2) * 30;
      p.carIndex = -1;
    }

    // Ram damage
    if (Math.abs(car.speed) > 3) {
      s.cars.forEach((other, i) => {
        if (i === p.carIndex) return;
        const dist = Math.hypot(other.x - car.x, other.y - car.y);
        if (dist < 38) {
          other.hp -= Math.abs(car.speed) * 4;
          car.hp -= Math.abs(car.speed) * 2;
          car.speed *= -0.5;
          p.wanted = Math.min(5, p.wanted + 0.3);
          if (other.hp <= 0) spawnExplosion(s, other.x, other.y);
        }
      });
    }
  }

  // ---- AI CARS ----
  s.cars.forEach((car, i) => {
    if (s.player.inCar && s.player.carIndex === i) return;
    if (!car.ai) return;

    car.aiTimer--;
    if (car.aiTimer <= 0) {
      car.aiTimer = 60 + Math.floor(Math.random() * 120);
      const col = 2 + Math.floor(Math.random() * (MAP_COLS - 4));
      const row = 2 + Math.floor(Math.random() * (MAP_COLS - 4));
      if (isRoad(CITY_MAP[row * MAP_COLS + col])) {
        car.aiTarget = { x: col * TILE + 32, y: row * TILE + 32 };
      }
    }

    if (car.aiTarget) {
      const dx = car.aiTarget.x - car.x;
      const dy = car.aiTarget.y - car.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 20) { car.aiTarget = null; car.speed = 0; return; }
      const targetAngle = Math.atan2(dy, dx);
      let da = targetAngle - car.angle;
      while (da > Math.PI) da -= Math.PI * 2;
      while (da < -Math.PI) da += Math.PI * 2;
      car.angle += da * 0.06;
      car.speed = Math.min(2.5, car.speed + 0.1);
      const nx = car.x + Math.cos(car.angle) * car.speed;
      const ny = car.y + Math.sin(car.angle) * car.speed;
      if (canMoveTo(nx, car.y)) car.x = nx; else car.speed = 0;
      if (canMoveTo(car.x, ny)) car.y = ny; else car.speed = 0;
    }
  });

  // ---- POLICE AI ----
  if (p.wanted >= 2) {
    s.cars.filter(c => c.isPolice).forEach(cop => {
      const tx = p.inCar ? s.cars[p.carIndex].x : p.x;
      const ty = p.inCar ? s.cars[p.carIndex].y : p.y;
      const dx = tx - cop.x, dy = ty - cop.y;
      const dist = Math.hypot(dx, dy);
      const targetAngle = Math.atan2(dy, dx);
      let da = targetAngle - cop.angle;
      while (da > Math.PI) da -= Math.PI * 2;
      while (da < -Math.PI) da += Math.PI * 2;
      cop.angle += da * 0.08;
      cop.speed = Math.min(4, cop.speed + 0.15);
      const nx = cop.x + Math.cos(cop.angle) * cop.speed;
      const ny = cop.y + Math.sin(cop.angle) * cop.speed;
      if (canMoveTo(nx, cop.y)) cop.x = nx; else cop.speed = 0;
      if (canMoveTo(cop.x, ny)) cop.y = ny; else cop.speed = 0;

      // Police ram
      if (dist < 36) {
        p.health -= 0.3;
        p.wanted = Math.max(0, p.wanted - 0.01);
      }

      // Police shoot
      if (dist < 200 && s.time % 40 === 0) {
        s.bullets.push({ x: cop.x, y: cop.y, vx: Math.cos(cop.angle)*6, vy: Math.sin(cop.angle)*6, life:50, fromPlayer:false });
      }
    });
  }

  // Spawn police if wanted
  if (p.wanted >= 2 && s.policeCars < Math.floor(p.wanted) && s.time % 300 === 0) {
    const spawnX = p.x + (Math.random() - 0.5) * 600;
    const spawnY = p.y + (Math.random() - 0.5) * 600;
    if (canMoveTo(spawnX, spawnY) && isRoad(tileAt(spawnX, spawnY))) {
      s.cars.push({ x: spawnX, y: spawnY, angle: 0, speed: 0, color: "#1a1aaa", hp: 150, isPolice: true, ai: true, aiTimer: 0, aiTarget: null });
      s.policeCars++;
    }
  }

  // Wanted decay
  if (p.wanted > 0 && s.time % 300 === 0) p.wanted = Math.max(0, p.wanted - 0.1);
  if (s.shootTimer > 0) s.shootTimer--;

  // ---- BULLETS ----
  s.bullets = s.bullets.filter(b => b.life > 0);
  s.bullets.forEach(b => {
    b.x += b.vx; b.y += b.vy; b.life--;
    if (!canMoveTo(b.x, b.y)) { b.life = 0; return; }

    if (b.fromPlayer) {
      s.cars.forEach(car => {
        if (Math.hypot(car.x - b.x, car.y - b.y) < 20) {
          car.hp -= 15; b.life = 0;
          if (car.hp <= 0) spawnExplosion(s, car.x, car.y);
          if (!car.isPolice) p.wanted = Math.min(5, p.wanted + 0.2);
        }
      });
      s.npcs.forEach(npc => {
        if (Math.hypot(npc.x - b.x, npc.y - b.y) < 12) {
          b.life = 0;
          npc.flee = true; npc.fleeTimer = 300;
          p.wanted = Math.min(5, p.wanted + 0.5);
        }
      });
    } else {
      const tx = p.inCar ? s.cars[p.carIndex]?.x ?? p.x : p.x;
      const ty = p.inCar ? s.cars[p.carIndex]?.y ?? p.y : p.y;
      if (Math.hypot(tx - b.x, ty - b.y) < 18) {
        p.health -= 8; b.life = 0;
      }
    }
  });

  // ---- NPCS ----
  s.npcs.forEach(npc => {
    if (npc.fleeTimer > 0) npc.fleeTimer--;
    else npc.flee = false;

    if (npc.flee) {
      const dx = npc.x - p.x, dy = npc.y - p.y;
      npc.angle = Math.atan2(dy, dx);
    } else {
      npc.angle += (Math.random() - 0.5) * 0.1;
    }
    const spd = npc.flee ? 1.8 : 0.5;
    const nx = npc.x + Math.cos(npc.angle) * spd;
    const ny = npc.y + Math.sin(npc.angle) * spd;
    if (canMoveTo(nx, npc.y)) npc.x = nx;
    if (canMoveTo(npc.x, ny)) npc.y = ny;
  });

  // ---- EXPLOSIONS ----
  s.explosions = s.explosions.filter(e => e.life > 0);
  s.explosions.forEach(e => {
    e.life--;
    e.radius = Math.min(e.maxRadius, e.radius + 3);
    const tx = p.inCar ? s.cars[p.carIndex]?.x ?? p.x : p.x;
    const ty = p.inCar ? s.cars[p.carIndex]?.y ?? p.y : p.y;
    if (Math.hypot(tx - e.x, ty - e.y) < e.radius) p.health -= 0.5;
  });

  s.cars = s.cars.filter(c => c.hp > 0 || (s.player.inCar && s.player.carIndex === s.cars.indexOf(c)));

  // ---- MISSIONS ----
  updateMissions(s);

  if (p.health <= 0) { p.health = 0; }

  setUi({
    health: Math.round(p.health),
    money: p.money,
    wanted: p.wanted,
    speed: p.inCar ? Math.abs(Math.round(s.cars[p.carIndex]?.speed * 20 || 0)) : 0,
    inCar: p.inCar,
    missionTitle: "",
    missionDesc: "",
    missionActive: false,
    missionComplete: false,
    missionFailed: false,
    gameOver: p.health <= 0,
  });
}

function updateMissions(s: GTAState) {
  const p = s.player;

  s.missions.forEach(m => {
    if (m.state === "inactive") {
      const dist = Math.hypot(p.x - m.markerStart.x, p.y - m.markerStart.y);
      if (dist < 30) {
        m.state = "active";
        m.step = 1;
        s.activeMission = m.id;
      }
    }

    if (m.state === "active") {
      if (m.id === "m1") {
        if (m.step === 1 && m.markerEnd) {
          const dist = Math.hypot(p.x - m.markerEnd.x, p.y - m.markerEnd.y);
          if (dist < 35) { m.state = "complete"; p.money += m.reward; s.activeMission = null; }
        }
      }
      if (m.id === "m2") {
        if (m.step === 1 && p.inCar && m.markerEnd) {
          const dist = Math.hypot(p.x - m.markerEnd.x, p.y - m.markerEnd.y);
          if (dist < 35) { m.state = "complete"; p.money += m.reward; s.activeMission = null; }
        }
      }
      if (m.id === "m3") {
        if (m.step === 1) {
          p.wanted = Math.min(5, p.wanted + 0.02);
          m.step++;
        }
        m.step++;
        if (m.step > 3600) { m.state = "complete"; p.money += m.reward; p.wanted = 0; s.activeMission = null; }
        if (p.health <= 20) { m.state = "failed"; s.activeMission = null; }
      }
    }
  });
}

function spawnExplosion(s: GTAState, x: number, y: number) {
  s.explosions.push({ x, y, radius: 5, maxRadius: 80, life: 60 });
}