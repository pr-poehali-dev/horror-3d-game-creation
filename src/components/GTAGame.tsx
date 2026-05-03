import { useEffect, useRef, useState, useCallback } from "react";
import { GTAState, UiState } from "./gta/gtaTypes";
import { createInitialState, updateGame } from "./gta/gtaLogic";
import { renderWorld, renderMinimap } from "./gta/gtaRenderer";

interface Props {
  onMenu: () => void;
}

const W = 900;
const H = 600;

export default function GTAGame({ onMenu }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GTAState>(createInitialState());
  const animRef = useRef<number>(0);
  const [ui, setUi] = useState<UiState>({
    health: 100, money: 0, wanted: 0, speed: 0, inCar: false,
    missionTitle: "", missionDesc: "", missionActive: false,
    missionComplete: false, missionFailed: false, gameOver: false,
  });
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const [notification, setNotification] = useState<{ text: string; color: string } | null>(null);
  const notifTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showNotif = useCallback((text: string, color = "#ffdd00") => {
    setNotification({ text, color });
    if (notifTimer.current) clearTimeout(notifTimer.current);
    notifTimer.current = setTimeout(() => setNotification(null), 3000);
  }, []);

  useEffect(() => {
    showNotif("Добро пожаловать в город! WASD — движение, F — войти/выйти из авто, ЛКМ — стрельба", "#22aaff");
  }, [showNotif]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent, down: boolean) => {
      stateRef.current.keys[e.code] = down;
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
    canvas.width = W; canvas.height = H;

    const onMouseDown = (e: MouseEvent) => { if (e.button === 0) stateRef.current.shooting = true; };
    const onMouseUp = (e: MouseEvent) => { if (e.button === 0) stateRef.current.shooting = false; };
    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left - W / 2;
      const my = e.clientY - rect.top - H / 2;
      stateRef.current.mouseAngle = Math.atan2(my, mx);
      if (!stateRef.current.player.inCar) {
        stateRef.current.player.angle = stateRef.current.mouseAngle;
      }
    };

    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("mousemove", onMouseMove);

    const prevMissions = stateRef.current.missions.map(m => m.state);

    function loop() {
      if (!pausedRef.current) {
        const s = stateRef.current;
        updateGame(s, (newUi) => setUi(newUi as UiState));

        // Mission notifications
        s.missions.forEach((m, i) => {
          if (m.state !== prevMissions[i]) {
            if (m.state === "active") showNotif(`Миссия: ${m.title} — ${m.description}`, "#ffdd00");
            if (m.state === "complete") showNotif(`✓ Миссия выполнена! +$${m.reward}`, "#22cc44");
            if (m.state === "failed") showNotif("✗ Миссия провалена!", "#cc2222");
            prevMissions[i] = m.state;
          }
        });

        renderWorld(ctx, s, W, H);
        renderMinimap(ctx, s, W - 145, H - 145, 140);
      }
      animRef.current = requestAnimationFrame(loop);
    }

    loop();

    return () => {
      cancelAnimationFrame(animRef.current);
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("mousemove", onMouseMove);
    };
  }, [showNotif]);

  const wantedStars = Math.min(5, Math.ceil(ui.wanted));

  return (
    <div className="relative w-full h-screen bg-black flex items-center justify-center overflow-hidden">
      <div className="relative" style={{ width: W, height: H }}>
        <canvas ref={canvasRef} className="block" style={{ cursor: "crosshair" }} />

        {/* HUD */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Health bar */}
          <div className="absolute bottom-4 left-4">
            <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:"0.55rem", letterSpacing:"0.3em", color:"rgba(200,150,120,0.7)", marginBottom:3 }}>ЗДОРОВЬЕ</div>
            <div style={{ width:120, height:8, background:"rgba(0,0,0,0.5)", border:"1px solid rgba(100,200,100,0.3)" }}>
              <div style={{ width:`${ui.health}%`, height:"100%", background: ui.health > 60 ? "linear-gradient(to right,#22aa44,#44cc66)" : ui.health > 30 ? "#cc8800" : "#cc2222", transition:"width 0.2s" }} />
            </div>
            <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:"0.7rem", color:"#e8d5c0", marginTop:2 }}>{ui.health}</div>
          </div>

          {/* Money */}
          <div className="absolute top-4 left-4">
            <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:"1.4rem", color:"#22cc44", fontWeight:400, textShadow:"0 0 10px rgba(34,200,68,0.5)" }}>
              ${ui.money.toLocaleString()}
            </div>
          </div>

          {/* Speed */}
          {ui.inCar && (
            <div className="absolute bottom-4" style={{ left:"50%", transform:"translateX(-50%)" }}>
              <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:"2rem", color:"#e8d5c0", fontWeight:300, textAlign:"center" }}>
                {ui.speed}
                <span style={{ fontSize:"0.7rem", marginLeft:4, color:"rgba(200,150,120,0.6)", letterSpacing:"0.2em" }}>КМ/Ч</span>
              </div>
            </div>
          )}

          {/* Wanted stars */}
          <div className="absolute top-4 right-4 flex gap-1 items-center">
            {[1,2,3,4,5].map(i => (
              <div
                key={i}
                style={{
                  fontSize:"1.2rem",
                  color: i <= wantedStars ? "#ffdd00" : "rgba(100,80,40,0.4)",
                  textShadow: i <= wantedStars ? "0 0 8px rgba(255,220,0,0.8)" : "none",
                  transition:"all 0.3s",
                }}
              >★</div>
            ))}
          </div>

          {/* Controls hint */}
          <div className="absolute bottom-4 right-[155px]">
            <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:"0.5rem", letterSpacing:"0.2em", color:"rgba(180,140,100,0.4)", textTransform:"uppercase", textAlign:"right", lineHeight:1.8 }}>
              WASD — движение<br/>
              F — войти / выйти из авто<br/>
              ЛКМ — стрельба &nbsp;|&nbsp; ESC — пауза
            </div>
          </div>

          {/* Notification */}
          {notification && (
            <div
              className="absolute animate-fade-in"
              style={{ top:60, left:"50%", transform:"translateX(-50%)", background:"rgba(0,0,0,0.85)", border:`1px solid ${notification.color}44`, padding:"10px 24px", maxWidth:500, textAlign:"center" }}
            >
              <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:"0.8rem", letterSpacing:"0.2em", color:notification.color }}>
                {notification.text}
              </div>
            </div>
          )}

          {/* Missions list */}
          <div className="absolute top-12 left-4">
            {stateRef.current.missions.map(m => (
              <div key={m.id} style={{ marginBottom:4 }}>
                {m.state === "inactive" && (
                  <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:"0.6rem", color:"rgba(255,220,0,0.6)", letterSpacing:"0.2em" }}>
                    ◆ {m.title}
                  </div>
                )}
                {m.state === "active" && (
                  <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:"0.65rem", color:"#ffdd00", letterSpacing:"0.2em" }}>
                    ▶ {m.title}
                  </div>
                )}
                {m.state === "complete" && (
                  <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:"0.6rem", color:"#22cc44", letterSpacing:"0.2em" }}>
                    ✓ {m.title}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Game Over */}
          {ui.gameOver && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-auto" style={{ background:"rgba(0,0,0,0.88)" }}>
              <div className="text-center">
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"5rem", fontStyle:"italic", color:"#cc0000", textShadow:"0 0 60px rgba(180,0,0,0.8)" }}>Вы погибли</div>
                <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:"1rem", letterSpacing:"0.3em", color:"rgba(200,150,120,0.7)", marginTop:8 }}>
                  ЗАРАБОТАНО: ${ui.money.toLocaleString()}
                </div>
                <div className="flex gap-4 justify-center mt-8">
                  <button
                    onClick={() => { stateRef.current = createInitialState(); setPaused(false); }}
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

        {/* Pause */}
        {paused && !ui.gameOver && (
          <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-auto" style={{ background:"rgba(0,0,0,0.75)", backdropFilter:"blur(3px)" }}>
            <div style={{ background:"linear-gradient(135deg,rgba(10,3,3,0.97),rgba(5,1,1,0.97))", border:"1px solid rgba(180,60,60,0.2)", padding:"32px 40px", boxShadow:"0 0 60px rgba(80,0,0,0.4)", minWidth:220 }}>
              <div className="text-center mb-6" style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"2rem", fontStyle:"italic", color:"rgba(220,190,160,0.9)" }}>Пауза</div>
              <div className="flex flex-col gap-1">
                {[
                  { label:"Продолжить", action:() => { pausedRef.current=false; setPaused(false); } },
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
      </div>
    </div>
  );
}
