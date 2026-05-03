import {
  TILE, MAP_COLS, CITY_MAP,
  T_ROAD_H, T_ROAD_V, T_INTERSECT, T_BLOCK, T_PARK, T_WATER,
  GTAState, Car, Npc, Explosion,
} from "./gtaTypes";

const BUILDING_COLORS = [
  ["#2a3a2a","#1e2e1e"],["#3a2a1a","#2e1e0e"],["#1a2a3a","#0e1e2e"],
  ["#2a1a3a","#1e0e2e"],["#3a3a1a","#2e2e0e"],["#1a3a3a","#0e2e2e"],
];

const BUILDING_SEED: Record<number, number> = {};
function bldColor(idx: number): string[] {
  if (!BUILDING_SEED[idx]) BUILDING_SEED[idx] = Math.floor(Math.random() * BUILDING_COLORS.length);
  return BUILDING_COLORS[BUILDING_SEED[idx]];
}

export function renderWorld(
  ctx: CanvasRenderingContext2D,
  s: GTAState,
  W: number,
  H: number,
) {
  const p = s.player;
  const camX = p.inCar ? s.cars[p.carIndex].x : p.x;
  const camY = p.inCar ? s.cars[p.carIndex].y : p.y;

  const offX = W / 2 - camX;
  const offY = H / 2 - camY;

  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, W, H);

  // Draw tiles
  const startCol = Math.max(0, Math.floor(-offX / TILE) - 1);
  const endCol = Math.min(MAP_COLS, Math.ceil((W - offX) / TILE) + 1);
  const startRow = Math.max(0, Math.floor(-offY / TILE) - 1);
  const endRow = Math.min(MAP_COLS, Math.ceil((H - offY) / TILE) + 1);

  for (let row = startRow; row < endRow; row++) {
    for (let col = startCol; col < endCol; col++) {
      const tile = CITY_MAP[row * MAP_COLS + col];
      const tx = col * TILE + offX;
      const ty = row * TILE + offY;

      if (tile === T_WATER) {
        ctx.fillStyle = "#0a1a2e";
        ctx.fillRect(tx, ty, TILE, TILE);
        ctx.fillStyle = "rgba(30,80,140,0.3)";
        const wave = Math.sin(s.time * 0.02 + col * 0.5 + row * 0.3) * 3;
        ctx.fillRect(tx + 4, ty + TILE / 2 + wave, TILE - 8, 2);
        ctx.fillRect(tx + 8, ty + TILE / 2 + 10 + wave, TILE - 16, 2);
      } else if (tile === T_PARK) {
        ctx.fillStyle = "#1a3a12";
        ctx.fillRect(tx, ty, TILE, TILE);
        ctx.fillStyle = "#224a16";
        for (let t = 0; t < 3; t++) {
          const tx2 = tx + 10 + t * 18;
          const ty2 = ty + 10 + (t % 2) * 14;
          ctx.beginPath();
          ctx.arc(tx2, ty2, 8, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (tile === T_ROAD_H || tile === T_ROAD_V || tile === T_INTERSECT) {
        ctx.fillStyle = "#2a2a2a";
        ctx.fillRect(tx, ty, TILE, TILE);
        ctx.strokeStyle = "#ffdd00";
        ctx.lineWidth = 1;
        ctx.setLineDash([8, 8]);

        if (tile === T_ROAD_H || tile === T_INTERSECT) {
          ctx.beginPath();
          ctx.moveTo(tx, ty + TILE / 2);
          ctx.lineTo(tx + TILE, ty + TILE / 2);
          ctx.stroke();
        }
        if (tile === T_ROAD_V || tile === T_INTERSECT) {
          ctx.beginPath();
          ctx.moveTo(tx + TILE / 2, ty);
          ctx.lineTo(tx + TILE / 2, ty + TILE);
          ctx.stroke();
        }
        ctx.setLineDash([]);

        // Road edges
        ctx.strokeStyle = "#444";
        ctx.lineWidth = 1;
        if (tile === T_ROAD_H) {
          ctx.strokeRect(tx, ty, TILE, TILE);
        }
        if (tile === T_INTERSECT) {
          ctx.fillStyle = "#333";
          ctx.fillRect(tx + TILE/2 - 4, ty + TILE/2 - 4, 8, 8);
        }
      } else if (tile === T_BLOCK) {
        const colors = bldColor(row * MAP_COLS + col);
        ctx.fillStyle = colors[0];
        ctx.fillRect(tx, ty, TILE, TILE);

        // Building details
        const floors = 2 + ((row * 7 + col * 3) % 4);
        ctx.fillStyle = colors[1];
        ctx.fillRect(tx + 4, ty + 4, TILE - 8, TILE - 8);

        // Windows
        ctx.fillStyle = "rgba(255,220,100,0.6)";
        const wCols = 2 + (col % 2);
        const wRows = floors;
        const wW = Math.floor((TILE - 16) / (wCols * 2));
        const wH = Math.floor((TILE - 16) / (wRows * 2));
        for (let wr = 0; wr < wRows; wr++) {
          for (let wc = 0; wc < wCols; wc++) {
            const lit = Math.sin(row * 13 + col * 7 + wr * 3 + wc * 5) > -0.3;
            if (lit) {
              ctx.fillRect(
                tx + 8 + wc * (wW * 2 + 2),
                ty + 8 + wr * (wH * 2 + 2),
                wW, wH
              );
            }
          }
        }

        // Roof
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.fillRect(tx, ty, TILE, 4);
        ctx.fillRect(tx, ty, 4, TILE);
      }
    }
  }

  // Shadows for buildings
  for (let row = startRow; row < endRow; row++) {
    for (let col = startCol; col < endCol; col++) {
      const tile = CITY_MAP[row * MAP_COLS + col];
      if (tile !== T_BLOCK) continue;
      const tx = col * TILE + offX;
      const ty = row * TILE + offY;
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fillRect(tx + TILE, ty + 6, 6, TILE);
      ctx.fillRect(tx + 6, ty + TILE, TILE, 6);
    }
  }

  // NPCs
  s.npcs.forEach(npc => drawNpc(ctx, npc, offX, offY));

  // Cars
  s.cars.forEach((car, i) => {
    const isPlayerCar = s.player.inCar && s.player.carIndex === i;
    drawCar(ctx, car, offX, offY, isPlayerCar, false);
  });

  // Bullets
  s.bullets.forEach(b => {
    ctx.fillStyle = b.fromPlayer ? "#ffee44" : "#ff4444";
    ctx.beginPath();
    ctx.arc(b.x + offX, b.y + offY, 3, 0, Math.PI * 2);
    ctx.fill();
  });

  // Explosions
  s.explosions.forEach(ex => drawExplosion(ctx, ex, offX, offY));

  // Player on foot
  if (!s.player.inCar) {
    drawPlayer(ctx, s.player, offX, offY);
  }

  // Mission markers
  s.missions.forEach(m => {
    if (m.state === "inactive") drawMarker(ctx, m.markerStart.x, m.markerStart.y, offX, offY, m.title[0], "#ffdd00", s.time);
    if (m.state === "active" && m.markerEnd) drawMarker(ctx, m.markerEnd.x, m.markerEnd.y, offX, offY, "★", "#ff4444", s.time);
    if (m.state === "active") drawMarker(ctx, m.markerStart.x, m.markerStart.y, offX, offY, "!", "#ff8800", s.time);
  });
}

function drawPlayer(ctx: CanvasRenderingContext2D, p: { x: number; y: number; angle: number }, offX: number, offY: number) {
  const sx = p.x + offX;
  const sy = p.y + offY;
  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(p.angle);

  ctx.fillStyle = "#22aaff";
  ctx.beginPath();
  ctx.arc(0, 0, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(-3, -12, 6, 10);

  ctx.fillStyle = "#ffddaa";
  ctx.beginPath();
  ctx.arc(0, -16, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#0088ff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 13, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

function drawCar(
  ctx: CanvasRenderingContext2D,
  car: Car,
  offX: number,
  offY: number,
  isPlayer: boolean,
  _small: boolean
) {
  const sx = car.x + offX;
  const sy = car.y + offY;
  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(car.angle);

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.fillRect(-18, -10, 36, 20);

  // Body
  ctx.fillStyle = car.isPolice ? "#1a1aaa" : car.color;
  ctx.fillRect(-16, -9, 32, 18);

  // Roof
  ctx.fillStyle = car.isPolice ? "#2222cc" : shadeColor(car.color, -30);
  ctx.fillRect(-10, -7, 20, 14);

  // Windows
  ctx.fillStyle = "rgba(150,220,255,0.6)";
  ctx.fillRect(-8, -6, 8, 12);
  ctx.fillRect(2, -6, 8, 12);

  // Headlights
  ctx.fillStyle = "#ffffaa";
  ctx.fillRect(14, -8, 4, 4);
  ctx.fillRect(14, 4, 4, 4);

  // Taillights
  ctx.fillStyle = "#ff2222";
  ctx.fillRect(-18, -8, 4, 4);
  ctx.fillRect(-18, 4, 4, 4);

  if (car.isPolice) {
    const flashOn = Math.floor(Date.now() / 200) % 2 === 0;
    ctx.fillStyle = flashOn ? "#ff2222" : "#2222ff";
    ctx.fillRect(-6, -12, 6, 4);
    ctx.fillRect(0, -12, 6, 4);
  }

  if (isPlayer) {
    ctx.strokeStyle = "#00ffff";
    ctx.lineWidth = 2;
    ctx.strokeRect(-18, -10, 36, 20);
  }

  // Damage smoke
  if (car.hp < 50) {
    ctx.fillStyle = `rgba(80,80,80,${(50 - car.hp) / 100})`;
    ctx.beginPath();
    ctx.arc(-8, -4, 8 + Math.sin(Date.now() * 0.01) * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawNpc(ctx: CanvasRenderingContext2D, npc: Npc, offX: number, offY: number) {
  const sx = npc.x + offX;
  const sy = npc.y + offY;
  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(npc.angle);

  ctx.fillStyle = npc.flee ? "#ff8800" : "#cc8844";
  ctx.beginPath();
  ctx.arc(0, 0, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffddaa";
  ctx.beginPath();
  ctx.arc(0, -9, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawExplosion(ctx: CanvasRenderingContext2D, ex: Explosion, offX: number, offY: number) {
  const t = 1 - ex.life / 60;
  const r = ex.radius;
  const grad = ctx.createRadialGradient(ex.x + offX, ex.y + offY, 0, ex.x + offX, ex.y + offY, r);
  grad.addColorStop(0, `rgba(255,255,200,${1 - t})`);
  grad.addColorStop(0.3, `rgba(255,140,0,${0.8 * (1 - t)})`);
  grad.addColorStop(0.7, `rgba(180,30,0,${0.5 * (1 - t)})`);
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(ex.x + offX, ex.y + offY, r, 0, Math.PI * 2);
  ctx.fill();
}

function drawMarker(
  ctx: CanvasRenderingContext2D,
  wx: number, wy: number,
  offX: number, offY: number,
  label: string,
  color: string,
  time: number
) {
  const sx = wx + offX;
  const sy = wy + offY;
  const pulse = Math.sin(time * 0.08) * 4;

  ctx.save();
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(sx, sy, 16 + pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.3;
  ctx.beginPath();
  ctx.arc(sx, sy, 24 + pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.fillStyle = "#000";
  ctx.font = "bold 14px 'Oswald', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, sx, sy);
  ctx.restore();
}

export function renderMinimap(ctx: CanvasRenderingContext2D, s: GTAState, x: number, y: number, size: number) {
  const scale = size / (MAP_COLS * TILE);
  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.fillRect(0, 0, size, size);

  for (let row = 0; row < MAP_COLS; row++) {
    for (let col = 0; col < MAP_COLS; col++) {
      const tile = CITY_MAP[row * MAP_COLS + col];
      const tx = col * TILE * scale;
      const ty = row * TILE * scale;
      const ts = TILE * scale;
      if (tile === T_ROAD_H || tile === T_ROAD_V || tile === T_INTERSECT) ctx.fillStyle = "#555";
      else if (tile === T_PARK) ctx.fillStyle = "#1a3a12";
      else if (tile === T_WATER) ctx.fillStyle = "#0a1a2e";
      else ctx.fillStyle = "#333";
      ctx.fillRect(tx, ty, ts, ts);
    }
  }

  // Player dot
  const p = s.player;
  const px = (p.inCar ? s.cars[p.carIndex].x : p.x) * scale;
  const py = (p.inCar ? s.cars[p.carIndex].y : p.y) * scale;
  ctx.fillStyle = "#22aaff";
  ctx.beginPath();
  ctx.arc(px, py, 3, 0, Math.PI * 2);
  ctx.fill();

  // Mission markers on minimap
  s.missions.forEach(m => {
    if (m.state === "inactive") {
      ctx.fillStyle = "#ffdd00";
      ctx.beginPath();
      ctx.arc(m.markerStart.x * scale, m.markerStart.y * scale, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    if (m.state === "active" && m.markerEnd) {
      ctx.fillStyle = "#ff4444";
      ctx.beginPath();
      ctx.arc(m.markerEnd.x * scale, m.markerEnd.y * scale, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, size, size);
  ctx.restore();
}

function shadeColor(color: string, amount: number): string {
  const num = parseInt(color.slice(1), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
  return `rgb(${r},${g},${b})`;
}
