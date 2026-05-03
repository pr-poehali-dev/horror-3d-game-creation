import { useEffect, useRef, useState, useCallback } from "react";

interface Props {
  onMenu: () => void;
  onSave: () => void;
}

// MAP: 0=empty, 1=wall
const MAP_W = 16;
const MAP_H = 16;
const MAP: number[] = [
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

function isWall(x: number, y: number) {
  const mx = Math.floor(x);
  const my = Math.floor(y);
  if (mx < 0 || mx >= MAP_W || my < 0 || my >= MAP_H) return true;
  return MAP[my * MAP_W + mx] === 1;
}

interface Zombie {
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

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number;
  color: string;
}

interface BulletHole {
  x: number; screenX: number; screenY: number; life: number;
}

let zombieIdCounter = 0;

function spawnZombie(wave: number): Zombie {
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

export default function FPSGame({ onMenu, onSave }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    px: 7.5, py: 7.5, pangle: 0,
    health: 100,
    ammo: 30,
    maxAmmo: 30,
    wave: 1,
    score: 0,
    zombies: [] as Zombie[],
    particles: [] as Particle[],
    bulletHoles: [] as BulletHole[],
    keys: {} as Record<string, boolean>,
    shooting: false,
    shootCooldown: 0,
    reloading: false,
    reloadTimer: 0,
    muzzleFlash: 0,
    screenShake: 0,
    gameOver: false,
    waveClear: false,
    waveClearTimer: 0,
    waveStartTimer: 0,
    waveStarting: true,
    bobTime: 0,
    damageFlash: 0,
    zbuf: new Array(800).fill(999),
  });
  const animRef = useRef<number>(0);
  const [ui, setUi] = useState({ health: 100, ammo: 30, maxAmmo: 30, wave: 1, score: 0, gameOver: false, reloading: false, waveClear: false, waveStarting: true });
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);

  const startWave = useCallback((wave: number) => {
    const s = stateRef.current;
    const count = 3 + wave * 2;
    s.zombies = [];
    for (let i = 0; i < count; i++) s.zombies.push(spawnZombie(wave));
    s.waveClear = false;
    s.waveStarting = false;
  }, []);

  useEffect(() => {
    const s = stateRef.current;
    s.waveStartTimer = 180;
    s.waveStarting = true;
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent, down: boolean) => {
      stateRef.current.keys[e.code] = down;
      if (e.code === "KeyR" && down && !stateRef.current.reloading) {
        const st = stateRef.current;
        if (st.ammo < st.maxAmmo) { st.reloading = true; st.reloadTimer = 90; }
      }
      if (e.code === "Escape" && down) {
        pausedRef.current = !pausedRef.current;
        setPaused(p => !p);
      }
      if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space","KeyW","KeyS","KeyA","KeyD"].includes(e.code)) {
        e.preventDefault();
      }
    };
    const kd = (e: KeyboardEvent) => onKey(e, true);
    const ku = (e: KeyboardEvent) => onKey(e, false);
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    return () => { window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku); };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const W = 800; const H = 500;
    canvas.width = W; canvas.height = H;

    function shoot() {
      const s = stateRef.current;
      if (s.shootCooldown > 0 || s.reloading || s.ammo <= 0 || s.gameOver) return;
      s.ammo--;
      s.shootCooldown = 15;
      s.muzzleFlash = 8;
      s.screenShake = 6;

      const rayAngle = s.pangle;
      const cos = Math.cos(rayAngle), sin = Math.sin(rayAngle);

      let hit = false;
      s.zombies.forEach(z => {
        if (z.state === "dead") return;
        const dx = z.x - s.px, dy = z.y - s.py;
        const dist = Math.sqrt(dx*dx+dy*dy);
        if (dist > 12) return;
        const dot = dx*cos + dy*sin;
        if (dot < 0.3) return;
        const cross = Math.abs(dx*sin - dy*cos);
        if (cross < 0.4) {
          z.hp--;
          z.hitFlash = 10;
          hit = true;
          for (let i = 0; i < 8; i++) {
            s.particles.push({ x: z.x, y: z.y, vx:(Math.random()-0.5)*0.08, vy:(Math.random()-0.5)*0.08, life:20+Math.random()*20, color:"#cc0000" });
          }
          if (z.hp <= 0) {
            z.state = "dead";
            s.score += 100;
            for (let i = 0; i < 15; i++) {
              s.particles.push({ x: z.x, y: z.y, vx:(Math.random()-0.5)*0.12, vy:(Math.random()-0.5)*0.12, life:40, color:"#880000" });
            }
          }
        }
      });

      if (!hit) {
        s.bulletHoles.push({ x: s.px + cos*8, screenX: W/2, screenY: H/2 + (Math.random()-0.5)*40, life: 300 });
      }

      if (s.ammo === 0) { s.reloading = true; s.reloadTimer = 90; }
    }

    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0) { stateRef.current.shooting = true; shoot(); }
    };
    const onMouseUp = (e: MouseEvent) => { if (e.button === 0) stateRef.current.shooting = false; };
    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement === canvas) {
        stateRef.current.pangle += e.movementX * 0.002;
      }
    };
    canvas.addEventListener("click", () => canvas.requestPointerLock());
    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("mousemove", onMouseMove);

    function castRay(angle: number, px: number, py: number): { dist: number; side: number; wallX: number } {
      const cos = Math.cos(angle), sin = Math.sin(angle);
      let x = px, y = py;
      let dist = 0;
      let side = 0;
      let wallX = 0;
      for (let step = 0; step < 64; step++) {
        const mx = Math.floor(x), my = Math.floor(y);
        if (MAP[my*MAP_W+mx] === 1) {
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

    function drawFloor(ctx: CanvasRenderingContext2D, px: number, py: number, pangle: number) {
      for (let y = H / 2; y < H; y++) {
        const rowDist = H / (2 * y - H) || 0.01;
        const stepX = 2 * rowDist * Math.cos(pangle) / W;
        const stepY = 2 * rowDist * Math.sin(pangle) / W;
        let fx = px + rowDist * (Math.cos(pangle) - Math.sin(pangle)) * (H / W * 1.2);
        let fy = py + rowDist * (Math.sin(pangle) + Math.cos(pangle)) * (H / W * 1.2);
        const bright = Math.min(1, rowDist * 0.4);
        const floorAlpha = 0.6 + bright * 0.2;
        for (let x = 0; x < W; x++) {
          fx += stepX; fy += stepY;
        }
        const d = Math.max(0, 1 - (y - H/2) / (H/2) * 1.2);
        ctx.fillStyle = `rgba(${20 + d*10},${10 + d*5},${5 + d*3},1)`;
        ctx.fillRect(0, y, W, 1);
      }
    }

    function renderZombie(ctx: CanvasRenderingContext2D, z: Zombie, px: number, py: number, pangle: number, bobY: number) {
      if (z.state === "dead") return;
      const dx = z.x - px, dy = z.y - py;
      z.dist = Math.sqrt(dx*dx+dy*dy);
      if (z.dist > 12) return;

      const angleToZ = Math.atan2(dy, dx);
      let relAngle = angleToZ - pangle;
      while (relAngle > Math.PI) relAngle -= Math.PI*2;
      while (relAngle < -Math.PI) relAngle += Math.PI*2;
      if (Math.abs(relAngle) > 1.0) return;

      const FOV = Math.PI / 2.5;
      const screenX = Math.floor((0.5 + relAngle / FOV) * W);
      const projH = Math.min(H * 1.5, H / z.dist * 1.2);
      const topY = (H - projH) / 2 + bobY * 0.3;

      if (z.dist < stateRef.current.zbuf[Math.max(0,Math.min(W-1,screenX))]) return;

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

    function drawGun(ctx: CanvasRenderingContext2D, muzzle: number, bob: number, reloading: boolean, reloadTimer: number) {
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

    function update() {
      const s = stateRef.current;
      if (pausedRef.current || s.gameOver) return;

      if (s.waveStarting) {
        s.waveStartTimer--;
        if (s.waveStartTimer <= 0) { s.waveStarting = false; startWave(s.wave); }
        return;
      }

      const speed = 0.06;
      const turnSpeed = 0.045;
      const cos = Math.cos(s.pangle), sin = Math.sin(s.pangle);

      if (s.keys["ArrowLeft"] || s.keys["KeyA"]) s.pangle -= turnSpeed;
      if (s.keys["ArrowRight"] || s.keys["KeyD"]) s.pangle += turnSpeed;

      let mx = 0, my = 0;
      if (s.keys["ArrowUp"] || s.keys["KeyW"]) { mx += cos*speed; my += sin*speed; }
      if (s.keys["ArrowDown"] || s.keys["KeyS"]) { mx -= cos*speed; my -= sin*speed; }

      if (!isWall(s.px + mx + Math.sign(mx)*0.2, s.py)) s.px += mx;
      if (!isWall(s.px, s.py + my + Math.sign(my)*0.2)) s.py += my;

      if (Math.abs(mx)+Math.abs(my) > 0) s.bobTime += 0.15;

      if (s.keys["Space"] && !s.reloading && s.ammo > 0) shoot();
      if (s.shootCooldown > 0) s.shootCooldown--;
      if (s.muzzleFlash > 0) s.muzzleFlash--;
      if (s.screenShake > 0) s.screenShake -= 0.5;
      if (s.damageFlash > 0) s.damageFlash--;

      if (s.reloading) {
        s.reloadTimer--;
        if (s.reloadTimer <= 0) { s.ammo = s.maxAmmo; s.reloading = false; }
      }

      s.zombies.forEach(z => {
        if (z.state === "dead") return;
        const dx = s.px - z.x, dy = s.py - z.y;
        z.dist = Math.sqrt(dx*dx+dy*dy);

        if (z.dist < 8) z.state = "chase";
        if (z.state === "chase") {
          const targetAngle = Math.atan2(dy, dx);
          let da = targetAngle - z.angle;
          while (da > Math.PI) da -= Math.PI*2;
          while (da < -Math.PI) da += Math.PI*2;
          z.angle += da * 0.05;

          const zspeed = 0.025 + s.wave * 0.003;
          const nzx = z.x + Math.cos(z.angle)*zspeed;
          const nzy = z.y + Math.sin(z.angle)*zspeed;
          if (!isWall(nzx, z.y)) z.x = nzx;
          if (!isWall(z.x, nzy)) z.y = nzy;

          if (z.dist < 0.8) {
            s.health -= 0.4;
            s.damageFlash = 20;
            if (s.health <= 0) { s.health = 0; s.gameOver = true; }
          }
        }
      });

      s.particles = s.particles.filter(p => p.life > 0);
      s.particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.life--; });
      s.bulletHoles = s.bulletHoles.filter(b => b.life > 0);
      s.bulletHoles.forEach(b => b.life--);

      const allDead = s.zombies.length > 0 && s.zombies.every(z => z.state === "dead");
      if (allDead && !s.waveClear) {
        s.waveClear = true;
        s.waveClearTimer = 180;
      }
      if (s.waveClear && s.waveClearTimer > 0) {
        s.waveClearTimer--;
        if (s.waveClearTimer === 0) {
          s.wave++;
          s.ammo = s.maxAmmo;
          s.health = Math.min(100, s.health + 30);
          s.waveStarting = true;
          s.waveStartTimer = 120;
        }
      }

      setUi({
        health: Math.round(s.health),
        ammo: s.ammo,
        maxAmmo: s.maxAmmo,
        wave: s.wave,
        score: s.score,
        gameOver: s.gameOver,
        reloading: s.reloading,
        waveClear: s.waveClear,
        waveStarting: s.waveStarting,
      });
    }

    function render() {
      const s = stateRef.current;
      const shake = s.screenShake > 0 ? (Math.random()-0.5)*s.screenShake : 0;

      ctx.save();
      ctx.translate(shake, shake*0.5);

      const skyGrad = ctx.createLinearGradient(0,0,0,H/2);
      skyGrad.addColorStop(0, "#050202");
      skyGrad.addColorStop(1, "#120808");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, H/2);

      drawFloor(ctx, s.px, s.py, s.pangle);

      s.zbuf.fill(0);
      const FOV = Math.PI / 2.5;
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

      const sortedZ = [...s.zombies].sort((a,b) => b.dist - a.dist);
      const bobY = Math.sin(s.bobTime) * 5;
      sortedZ.forEach(z => renderZombie(ctx, z, s.px, s.py, s.pangle, bobY));

      drawGun(ctx, s.muzzleFlash, bobY, s.reloading, s.reloadTimer);

      if (s.damageFlash > 0) {
        ctx.fillStyle = `rgba(180,0,0,${s.damageFlash/40})`;
        ctx.fillRect(0, 0, W, H);
        const edgeGrad = ctx.createRadialGradient(W/2,H/2,H*0.2,W/2,H/2,H*0.8);
        edgeGrad.addColorStop(0,"rgba(180,0,0,0)");
        edgeGrad.addColorStop(1,`rgba(180,0,0,${s.damageFlash/25})`);
        ctx.fillStyle = edgeGrad;
        ctx.fillRect(0,0,W,H);
      }

      const vigGrad = ctx.createRadialGradient(W/2,H/2,H*0.25,W/2,H/2,H*0.75);
      vigGrad.addColorStop(0,"rgba(0,0,0,0)");
      vigGrad.addColorStop(1,"rgba(0,0,0,0.7)");
      ctx.fillStyle = vigGrad;
      ctx.fillRect(0,0,W,H);

      ctx.restore();
    }

    function loop() {
      update();
      render();
      animRef.current = requestAnimationFrame(loop);
    }

    loop();

    return () => {
      cancelAnimationFrame(animRef.current);
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, [startWave]);

  const s = stateRef.current;

  return (
    <div className="relative w-full h-screen bg-black flex items-center justify-center overflow-hidden">
      <div className="relative" style={{ width: 800, height: 500 }}>
        <canvas
          ref={canvasRef}
          className="block"
          style={{ cursor: "none", imageRendering: "pixelated" }}
        />

        {/* Crosshair */}
        <div className="absolute pointer-events-none" style={{ left: "50%", top: "50%", transform: "translate(-50%,-50%)" }}>
          <div style={{ width: 2, height: 14, background: "rgba(255,255,255,0.8)", position:"absolute", left:0, top:-7 }} />
          <div style={{ width: 14, height: 2, background: "rgba(255,255,255,0.8)", position:"absolute", left:-7, top:0 }} />
        </div>

        {/* HUD */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Health */}
          <div className="absolute bottom-4 left-4 flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span style={{ fontFamily:"'Oswald',sans-serif", fontSize:"0.6rem", letterSpacing:"0.3em", color:"rgba(200,150,120,0.7)", fontWeight:200 }}>ЗДОРОВЬЕ</span>
            </div>
            <div className="flex items-center gap-2">
              <div style={{ width:120, height:6, background:"rgba(0,0,0,0.5)", border:"1px solid rgba(180,30,30,0.4)" }}>
                <div style={{
                  width:`${ui.health}%`, height:"100%",
                  background: ui.health > 60 ? "linear-gradient(to right,#cc2222,#ee4444)" : ui.health > 30 ? "linear-gradient(to right,#cc6600,#ee8800)" : "linear-gradient(to right,#880000,#cc0000)",
                  boxShadow:"0 0 6px rgba(180,30,30,0.6)",
                  transition:"width 0.2s"
                }} />
              </div>
              <span style={{ fontFamily:"'Oswald',sans-serif", fontSize:"0.75rem", color:"#e8d5c0", fontWeight:300, minWidth:30 }}>{ui.health}</span>
            </div>
          </div>

          {/* Ammo */}
          <div className="absolute bottom-4 right-4 text-right">
            <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:"0.6rem", letterSpacing:"0.3em", color:"rgba(200,150,120,0.7)", fontWeight:200 }}>ПАТРОНЫ</div>
            <div className="flex items-baseline justify-end gap-1 mt-1">
              {ui.reloading ? (
                <span style={{ fontFamily:"'Oswald',sans-serif", fontSize:"0.75rem", color:"#ddaa00", letterSpacing:"0.2em" }}>ПЕРЕЗАРЯДКА...</span>
              ) : (
                <>
                  <span style={{ fontFamily:"'Oswald',sans-serif", fontSize:"1.4rem", color:"#e8d5c0", fontWeight:400 }}>{ui.ammo}</span>
                  <span style={{ fontFamily:"'Oswald',sans-serif", fontSize:"0.75rem", color:"rgba(200,150,120,0.5)" }}>/ {ui.maxAmmo}</span>
                </>
              )}
            </div>
          </div>

          {/* Wave & Score */}
          <div className="absolute top-4 left-4">
            <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:"0.6rem", letterSpacing:"0.3em", color:"rgba(200,150,120,0.6)", fontWeight:200 }}>ВОЛНА</div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"2rem", fontStyle:"italic", color:"#e84040", lineHeight:1 }}>{ui.wave}</div>
          </div>
          <div className="absolute top-4 right-4 text-right">
            <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:"0.6rem", letterSpacing:"0.3em", color:"rgba(200,150,120,0.6)", fontWeight:200 }}>СЧЁТ</div>
            <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:"1.2rem", color:"#e8d5c0", fontWeight:300 }}>{ui.score}</div>
          </div>

          {/* Controls hint */}
          <div className="absolute bottom-4" style={{ left:"50%", transform:"translateX(-50%)" }}>
            <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:"0.55rem", letterSpacing:"0.25em", color:"rgba(180,140,100,0.4)", textTransform:"uppercase" }}>
              WASD — движение &nbsp;|&nbsp; ЛКМ/ПРОБЕЛ — стрельба &nbsp;|&nbsp; R — перезарядка &nbsp;|&nbsp; ESC — пауза
            </div>
          </div>

          {/* Wave Clear */}
          {ui.waveClear && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center" style={{ animation:"fade-in 0.5s ease" }}>
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"3rem", fontStyle:"italic", color:"#e8d5c0", textShadow:"0 0 40px rgba(220,180,60,0.8)" }}>
                  Волна {ui.wave} пройдена!
                </div>
                <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:"0.8rem", letterSpacing:"0.4em", color:"rgba(220,180,60,0.7)", marginTop:8 }}>
                  СЛЕДУЮЩАЯ ВОЛНА...
                </div>
              </div>
            </div>
          )}

          {/* Wave Starting */}
          {ui.waveStarting && !ui.waveClear && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:"0.7rem", letterSpacing:"0.5em", color:"rgba(200,150,120,0.6)", marginBottom:8 }}>ПРИГОТОВЬСЯ</div>
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"4rem", fontStyle:"italic", color:"#e84040", textShadow:"0 0 40px rgba(220,50,50,0.8)" }}>
                  Волна {ui.wave}
                </div>
              </div>
            </div>
          )}

          {/* Game Over */}
          {ui.gameOver && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-auto" style={{ background:"rgba(0,0,0,0.85)" }}>
              <div className="text-center">
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"5rem", fontStyle:"italic", color:"#cc0000", textShadow:"0 0 60px rgba(180,0,0,0.8)" }}>
                  Вы мертвы
                </div>
                <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:"1rem", letterSpacing:"0.3em", color:"rgba(200,150,120,0.7)", marginTop:8 }}>
                  СЧЁТ: {ui.score} &nbsp;|&nbsp; ВОЛНА: {ui.wave}
                </div>
                <div className="flex gap-4 justify-center mt-8">
                  <button
                    onClick={() => window.location.reload()}
                    style={{ fontFamily:"'Oswald',sans-serif", fontSize:"0.75rem", letterSpacing:"0.3em", color:"#e8d5c0", background:"rgba(180,30,30,0.7)", border:"1px solid rgba(180,60,60,0.4)", padding:"12px 28px", cursor:"pointer" }}
                  >
                    ЗАНОВО
                  </button>
                  <button
                    onClick={onMenu}
                    style={{ fontFamily:"'Oswald',sans-serif", fontSize:"0.75rem", letterSpacing:"0.3em", color:"rgba(200,150,120,0.8)", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(180,60,60,0.2)", padding:"12px 28px", cursor:"pointer" }}
                  >
                    МЕНЮ
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pause */}
      {paused && !ui.gameOver && (
        <div className="absolute inset-0 z-20 flex items-center justify-center" style={{ background:"rgba(0,0,0,0.75)", backdropFilter:"blur(3px)" }}>
          <div style={{ background:"linear-gradient(135deg,rgba(10,3,3,0.97),rgba(5,1,1,0.97))", border:"1px solid rgba(180,60,60,0.2)", padding:"32px 40px", boxShadow:"0 0 60px rgba(80,0,0,0.4)", minWidth:220 }}>
            <div className="text-center mb-6" style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"2rem", fontStyle:"italic", color:"rgba(220,190,160,0.9)" }}>Пауза</div>
            <div className="flex flex-col gap-1">
              {[
                { label:"Продолжить", action:() => { pausedRef.current=false; setPaused(false); } },
                { label:"Сохранить", action:() => { pausedRef.current=false; setPaused(false); onSave(); } },
                { label:"Главное меню", action:onMenu },
              ].map(item => (
                <button
                  key={item.label}
                  onClick={item.action}
                  style={{ fontFamily:"'Oswald',sans-serif", fontWeight:300, fontSize:"0.75rem", letterSpacing:"0.3em", textTransform:"uppercase", color:"rgba(200,150,120,0.8)", background:"transparent", border:"1px solid transparent", padding:"12px 20px", cursor:"pointer", transition:"all 0.2s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color="#e8d5c0"; (e.currentTarget as HTMLButtonElement).style.borderColor="rgba(180,60,60,0.3)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color="rgba(200,150,120,0.8)"; (e.currentTarget as HTMLButtonElement).style.borderColor="transparent"; }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Pointer lock hint */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 pointer-events-none">
        <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:"0.6rem", letterSpacing:"0.3em", color:"rgba(200,150,120,0.4)" }}>
          КЛИКНИ НА ЭКРАН ДЛЯ ЗАХВАТА МЫШИ
        </div>
      </div>
    </div>
  );
}
