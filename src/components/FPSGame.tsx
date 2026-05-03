import { useEffect, useRef, useState, useCallback } from "react";
import { GameState, UiState, isWall, spawnZombie } from "./fps/fpsTypes";
import { renderFrame } from "./fps/fpsRenderer";
import FpsHud from "./fps/FpsHud";

interface Props {
  onMenu: () => void;
  onSave: () => void;
}

const W = 800;
const H = 500;

export default function FPSGame({ onMenu, onSave }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>({
    px: 7.5, py: 7.5, pangle: 0,
    health: 100,
    ammo: 30,
    maxAmmo: 30,
    wave: 1,
    score: 0,
    zombies: [],
    particles: [],
    bulletHoles: [],
    keys: {},
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
  const [ui, setUi] = useState<UiState>({ health: 100, ammo: 30, maxAmmo: 30, wave: 1, score: 0, gameOver: false, reloading: false, waveClear: false, waveStarting: true });
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

  // Keyboard input
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

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    canvas.width = W;
    canvas.height = H;

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
            s.particles.push({ x: z.x, y: z.y, vx: (Math.random()-0.5)*0.08, vy: (Math.random()-0.5)*0.08, life: 20+Math.random()*20, color: "#cc0000" });
          }
          if (z.hp <= 0) {
            z.state = "dead";
            s.score += 100;
            for (let i = 0; i < 15; i++) {
              s.particles.push({ x: z.x, y: z.y, vx: (Math.random()-0.5)*0.12, vy: (Math.random()-0.5)*0.12, life: 40, color: "#880000" });
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

    function loop() {
      update();
      renderFrame(ctx, stateRef.current);
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

  const handleResume = () => { pausedRef.current = false; setPaused(false); };
  const handleSave = () => { pausedRef.current = false; setPaused(false); onSave(); };

  return (
    <div className="relative w-full h-screen bg-black flex items-center justify-center overflow-hidden">
      <div className="relative" style={{ width: W, height: H }}>
        <canvas
          ref={canvasRef}
          className="block"
          style={{ cursor: "none", imageRendering: "pixelated" }}
        />
        <FpsHud
          ui={ui}
          paused={paused}
          onResume={handleResume}
          onSave={handleSave}
          onMenu={onMenu}
        />
      </div>
    </div>
  );
}
