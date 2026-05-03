import { MAP, MAP_W, Zombie, GameState } from "./fpsTypes";

const W = 800;
const H = 500;
const FOV = Math.PI / 2.5;

export function castRay(angle: number, px: number, py: number): { dist: number; side: number; wallX: number } {
  const cos = Math.cos(angle), sin = Math.sin(angle);
  let x = px, y = py;
  let dist = 0;
  let side = 0;
  let wallX = 0;
  for (let step = 0; step < 64; step++) {
    const mx = Math.floor(x), my = Math.floor(y);
    if (MAP[my * MAP_W + mx] === 1) {
      wallX = side === 0 ? y - Math.floor(y) : x - Math.floor(x);
      break;
    }
    const tMaxX = cos === 0 ? 999 : (cos > 0 ? Math.ceil(x+0.001)-x : x-Math.floor(x-0.001)) / Math.abs(cos);
    const tMaxY = sin === 0 ? 999 : (sin > 0 ? Math.ceil(y+0.001)-y : y-Math.floor(y-0.001)) / Math.abs(sin);
    if (tMaxX < tMaxY) { dist += tMaxX; x += cos*tMaxX; y += sin*tMaxX; side = 0; }
    else { dist += tMaxY; x += cos*tMaxY; y += sin*tMaxY; side = 1; }
  }
  return { dist: dist || 0.01, side, wallX };
}

export function drawFloor(ctx: CanvasRenderingContext2D, _px: number, _py: number, pangle: number) {
  for (let y = H / 2; y < H; y++) {
    const rowDist = H / (2 * y - H) || 0.01;
    const stepX = 2 * rowDist * Math.cos(pangle) / W;
    const stepY = 2 * rowDist * Math.sin(pangle) / W;
    let fx = _px + rowDist * (Math.cos(pangle) - Math.sin(pangle)) * (H / W * 1.2);
    let fy = _py + rowDist * (Math.sin(pangle) + Math.cos(pangle)) * (H / W * 1.2);
    const bright = Math.min(1, rowDist * 0.4);
    for (let x = 0; x < W; x++) {
      fx += stepX; fy += stepY;
    }
    const d = Math.max(0, 1 - (y - H/2) / (H/2) * 1.2);
    ctx.fillStyle = `rgba(${20 + d*10},${10 + d*5},${5 + d*3},1)`;
    ctx.fillRect(0, y, W, 1);
    void bright;
  }
}

export function renderZombie(
  ctx: CanvasRenderingContext2D,
  z: Zombie,
  px: number,
  py: number,
  pangle: number,
  bobY: number,
  zbuf: number[]
) {
  if (z.state === "dead") return;
  const dx = z.x - px, dy = z.y - py;
  z.dist = Math.sqrt(dx*dx+dy*dy);
  if (z.dist > 12) return;

  const angleToZ = Math.atan2(dy, dx);
  let relAngle = angleToZ - pangle;
  while (relAngle > Math.PI) relAngle -= Math.PI*2;
  while (relAngle < -Math.PI) relAngle += Math.PI*2;
  if (Math.abs(relAngle) > 1.0) return;

  const screenX = Math.floor((0.5 + relAngle / FOV) * W);
  const projH = Math.min(H * 1.5, H / z.dist * 1.2);
  const topY = (H - projH) / 2 + bobY * 0.3;

  if (z.dist < zbuf[Math.max(0, Math.min(W-1, screenX))]) return;

  const dark = Math.min(1, z.dist / 8);
  const flash = z.hitFlash > 0 ? 1 : 0;
  const zW = projH * 0.55;

  ctx.save();
  ctx.globalAlpha = Math.max(0.3, 1 - dark * 0.7);

  const bodyGrad = ctx.createLinearGradient(screenX - zW/2, topY, screenX + zW/2, topY);
  bodyGrad.addColorStop(0, flash ? "#ff6666" : "#2a1a0a");
  bodyGrad.addColorStop(0.4, flash ? "#ff9999" : "#3d2510");
  bodyGrad.addColorStop(1, flash ? "#ff6666" : "#1a0d05");
  ctx.fillStyle = bodyGrad;
  ctx.fillRect(screenX - zW/2, topY + projH*0.25, zW, projH*0.65);

  const headR = projH * 0.14;
  ctx.fillStyle = flash ? "#ffaaaa" : "#3d2a1a";
  ctx.beginPath();
  ctx.arc(screenX, topY + projH*0.18, headR, 0, Math.PI*2);
  ctx.fill();

  ctx.fillStyle = flash ? "#ff0000" : "#cc0000";
  ctx.beginPath();
  ctx.arc(screenX - headR*0.3, topY + projH*0.16, headR*0.2, 0, Math.PI*2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(screenX + headR*0.3, topY + projH*0.16, headR*0.2, 0, Math.PI*2);
  ctx.fill();

  if (projH > 60) {
    const armSway = Math.sin(Date.now()*0.003) * (z.state === "chase" ? 15 : 5);
    ctx.strokeStyle = flash ? "#ff9999" : "#2a1a0a";
    ctx.lineWidth = zW * 0.18;
    ctx.beginPath();
    ctx.moveTo(screenX - zW*0.5, topY + projH*0.32);
    ctx.lineTo(screenX - zW*0.75, topY + projH*0.55 + armSway);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(screenX + zW*0.5, topY + projH*0.32);
    ctx.lineTo(screenX + zW*0.75, topY + projH*0.55 - armSway);
    ctx.stroke();
  }

  const hpBarW = zW * 1.2;
  const hpBarX = screenX - hpBarW/2;
  const hpBarY = topY - 12;
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(hpBarX, hpBarY, hpBarW, 5);
  ctx.fillStyle = z.hp / z.maxHp > 0.5 ? "#22cc44" : z.hp / z.maxHp > 0.25 ? "#ddaa00" : "#cc2222";
  ctx.fillRect(hpBarX, hpBarY, hpBarW * (z.hp/z.maxHp), 5);

  ctx.restore();
  if (z.hitFlash > 0) z.hitFlash--;
}

export function drawGun(ctx: CanvasRenderingContext2D, muzzle: number, bob: number, reloading: boolean, reloadTimer: number) {
  const gx = W/2 + 60;
  const gy = H - 80 + bob * 3 + (reloading ? Math.sin((90-reloadTimer)/90*Math.PI)*40 : 0);

  ctx.save();
  ctx.shadowColor = muzzle > 0 ? "#ffaa00" : "transparent";
  ctx.shadowBlur = muzzle > 0 ? 20 : 0;

  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(gx - 8, gy - 30, 16, 50);
  ctx.fillStyle = "#2a2a2a";
  ctx.fillRect(gx - 12, gy - 10, 24, 20);
  ctx.fillStyle = "#111";
  ctx.fillRect(gx - 3, gy - 60, 6, 32);

  if (muzzle > 0) {
    ctx.fillStyle = `rgba(255,${180+muzzle*10},0,${muzzle/8})`;
    ctx.beginPath();
    ctx.arc(gx, gy - 62, 14, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = `rgba(255,255,200,${muzzle/8})`;
    ctx.beginPath();
    ctx.arc(gx, gy - 62, 6, 0, Math.PI*2);
    ctx.fill();
  }

  ctx.restore();
}

export function renderFrame(ctx: CanvasRenderingContext2D, s: GameState) {
  const shake = s.screenShake > 0 ? (Math.random()-0.5)*s.screenShake : 0;

  ctx.save();
  ctx.translate(shake, shake*0.5);

  const skyGrad = ctx.createLinearGradient(0, 0, 0, H/2);
  skyGrad.addColorStop(0, "#050202");
  skyGrad.addColorStop(1, "#120808");
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, H/2);

  drawFloor(ctx, s.px, s.py, s.pangle);

  s.zbuf.fill(0);
  const numRays = W;

  for (let i = 0; i < numRays; i++) {
    const rayAngle = s.pangle - FOV/2 + (i/numRays)*FOV;
    const { dist, side } = castRay(rayAngle, s.px, s.py);
    const corrected = dist * Math.cos(rayAngle - s.pangle);
    s.zbuf[i] = corrected;

    const lineH = Math.min(H*2, H / corrected);
    const lineTop = (H - lineH) / 2;

    const fogFactor = Math.min(1, corrected / 7);
    const bright = (1 - fogFactor) * (side === 1 ? 0.7 : 1);
    const r = Math.floor(80 * bright);
    const g = Math.floor(25 * bright);
    const b = Math.floor(15 * bright);

    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(i, lineTop, 1, lineH);
  }

  const bobY = Math.sin(s.bobTime) * 5;
  const sortedZ = [...s.zombies].sort((a, b) => b.dist - a.dist);
  sortedZ.forEach(z => renderZombie(ctx, z, s.px, s.py, s.pangle, bobY, s.zbuf));

  drawGun(ctx, s.muzzleFlash, bobY, s.reloading, s.reloadTimer);

  if (s.damageFlash > 0) {
    ctx.fillStyle = `rgba(180,0,0,${s.damageFlash/40})`;
    ctx.fillRect(0, 0, W, H);
    const edgeGrad = ctx.createRadialGradient(W/2, H/2, H*0.2, W/2, H/2, H*0.8);
    edgeGrad.addColorStop(0, "rgba(180,0,0,0)");
    edgeGrad.addColorStop(1, `rgba(180,0,0,${s.damageFlash/25})`);
    ctx.fillStyle = edgeGrad;
    ctx.fillRect(0, 0, W, H);
  }

  const vigGrad = ctx.createRadialGradient(W/2, H/2, H*0.25, W/2, H/2, H*0.75);
  vigGrad.addColorStop(0, "rgba(0,0,0,0)");
  vigGrad.addColorStop(1, "rgba(0,0,0,0.7)");
  ctx.fillStyle = vigGrad;
  ctx.fillRect(0, 0, W, H);

  ctx.restore();
}
