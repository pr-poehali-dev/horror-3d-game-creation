import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/icon";

interface Props {
  onMenu: () => void;
  onSave: () => void;
}

export default function GameScreen({ onMenu, onSave }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [showHud, setShowHud] = useState(true);
  const [health, setHealth] = useState(78);
  const [sanity, setSanity] = useState(55);
  const [showPauseMenu, setShowPauseMenu] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let time = 0;
    const W = canvas.width;
    const H = canvas.height;

    function drawScene() {
      if (!ctx) return;
      time += 0.008;

      ctx.fillStyle = "#020101";
      ctx.fillRect(0, 0, W, H);

      const flicker = Math.sin(time * 7) * 0.05 + 0.95;

      const ambient = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.6);
      ambient.addColorStop(0, `rgba(30,15,5,${0.5 * flicker})`);
      ambient.addColorStop(0.4, `rgba(10,5,2,0.7)`);
      ambient.addColorStop(1, `rgba(0,0,0,0.95)`);
      ctx.fillStyle = ambient;
      ctx.fillRect(0, 0, W, H);

      for (let z = 10; z > 0; z--) {
        const d = z / 10;
        const corridorW = W * 0.1 + (W * 0.7 * (1 - d));
        const corridorH = H * 0.1 + (H * 0.6 * (1 - d));
        const x = (W - corridorW) / 2;
        const y = (H - corridorH) / 2;

        const brightness = d * 20 * flicker;
        ctx.strokeStyle = `rgba(${brightness * 2},${brightness},${brightness * 0.5},${0.4 * d})`;
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, corridorW, corridorH);

        if (z < 8) {
          ctx.fillStyle = `rgba(${brightness * 0.5},${brightness * 0.3},${brightness * 0.1},${0.03 * d})`;
          ctx.fillRect(x, y, corridorW, corridorH);
        }
      }

      const lampX = W / 2;
      const lampY = H * 0.15;
      const lampFlicker = Math.sin(time * 13) * 0.2 + 0.8;
      const lampGrad = ctx.createRadialGradient(lampX, lampY, 0, lampX, lampY, 180 * lampFlicker);
      lampGrad.addColorStop(0, `rgba(255,200,80,${0.25 * lampFlicker})`);
      lampGrad.addColorStop(0.3, `rgba(200,100,20,${0.1 * lampFlicker})`);
      lampGrad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = lampGrad;
      ctx.fillRect(0, 0, W, H);

      for (let i = 0; i < 8; i++) {
        const px = W * 0.3 + Math.sin(time * 0.5 + i * 1.2) * W * 0.2;
        const py = H * 0.4 + Math.cos(time * 0.3 + i * 0.8) * H * 0.2;
        const alpha = (Math.sin(time + i) * 0.5 + 0.5) * 0.06;
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200,60,60,${alpha})`;
        ctx.fill();
      }

      const vignette = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.8);
      vignette.addColorStop(0, "rgba(0,0,0,0)");
      vignette.addColorStop(1, "rgba(0,0,0,0.85)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, W, H);

      if (sanity < 60) {
        const insanity = ((60 - sanity) / 60) * 0.15;
        ctx.fillStyle = `rgba(100,0,0,${insanity * Math.sin(time * 3)})`;
        ctx.fillRect(0, 0, W, H);
      }

      animRef.current = requestAnimationFrame(drawScene);
    }

    drawScene();
    return () => cancelAnimationFrame(animRef.current);
  }, [sanity]);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0" />

      {showHud && !showPauseMenu && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-8 left-8 flex flex-col gap-3 pointer-events-auto">
            <div className="flex items-center gap-3">
              <Icon name="Heart" size={12} style={{ color: "rgba(180,30,30,0.8)" }} />
              <div className="relative" style={{ width: "140px", height: "3px", background: "rgba(255,255,255,0.08)" }}>
                <div
                  style={{
                    width: `${health}%`,
                    height: "100%",
                    background: "linear-gradient(to right, rgba(180,30,30,0.9), rgba(220,60,60,0.7))",
                    boxShadow: "0 0 8px rgba(180,30,30,0.5)",
                    transition: "width 0.5s ease",
                  }}
                />
              </div>
              <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: "0.65rem", letterSpacing: "0.2em", color: "rgba(200,150,120,0.6)", fontWeight: 200 }}>
                {health}%
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Icon name="Brain" size={12} style={{ color: "rgba(100,80,180,0.7)" }} />
              <div className="relative" style={{ width: "140px", height: "3px", background: "rgba(255,255,255,0.08)" }}>
                <div
                  style={{
                    width: `${sanity}%`,
                    height: "100%",
                    background: "linear-gradient(to right, rgba(80,40,180,0.9), rgba(140,80,220,0.7))",
                    boxShadow: "0 0 8px rgba(100,60,180,0.5)",
                    transition: "width 0.5s ease",
                  }}
                />
              </div>
              <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: "0.65rem", letterSpacing: "0.2em", color: "rgba(200,150,120,0.6)", fontWeight: 200 }}>
                {sanity}%
              </span>
            </div>
          </div>

          <div className="absolute top-6 left-1/2 -translate-x-1/2">
            <div
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "0.85rem",
                fontStyle: "italic",
                color: "rgba(200,160,120,0.45)",
                letterSpacing: "0.15em",
                textShadow: "0 0 20px rgba(0,0,0,0.8)",
              }}
            >
              Глава II: Подвал
            </div>
          </div>

          <div className="absolute top-5 right-6 flex items-center gap-2 pointer-events-auto">
            <button
              onClick={() => setShowPauseMenu(true)}
              className="p-2 transition-all duration-200 hover:opacity-80"
              style={{
                background: "rgba(0,0,0,0.4)",
                border: "1px solid rgba(180,60,60,0.15)",
                color: "rgba(200,150,120,0.5)",
              }}
            >
              <Icon name="Menu" size={16} />
            </button>
          </div>
        </div>
      )}

      {showPauseMenu && (
        <div className="absolute inset-0 z-20 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(3px)" }}>
          <div
            className="flex flex-col items-center gap-1 w-64"
            style={{
              background: "linear-gradient(135deg, rgba(10,3,3,0.97), rgba(5,1,1,0.97))",
              border: "1px solid rgba(180,60,60,0.2)",
              padding: "32px 24px",
              boxShadow: "0 0 60px rgba(80,0,0,0.4)",
            }}
          >
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.5rem", fontStyle: "italic", color: "rgba(220,190,160,0.8)", marginBottom: "4px" }}>
              Пауза
            </div>
            <div style={{ width: "40px", height: "1px", background: "rgba(180,60,60,0.3)", marginBottom: "20px" }} />

            {[
              { label: "Продолжить", icon: "Play", action: () => setShowPauseMenu(false) },
              { label: "Сохранить", icon: "Save", action: () => { setShowPauseMenu(false); onSave(); } },
              { label: "Главное меню", icon: "Home", action: onMenu },
            ].map((item) => (
              <button
                key={item.label}
                onClick={item.action}
                className="w-full flex items-center justify-center gap-3 py-3 px-6 transition-all duration-200 group hover:bg-red-950/20"
                style={{
                  fontFamily: "'Oswald', sans-serif",
                  fontWeight: 300,
                  fontSize: "0.75rem",
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  color: "rgba(200,150,120,0.7)",
                  border: "1px solid transparent",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(180,60,60,0.2)"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(220,190,160,0.9)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(200,150,120,0.7)"; }}
              >
                <Icon name={item.icon} size={13} />
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {!showPauseMenu && (
        <div className="absolute bottom-8 right-8 pointer-events-none">
          <div style={{
            fontFamily: "'Oswald', sans-serif",
            fontWeight: 200,
            fontSize: "0.6rem",
            letterSpacing: "0.25em",
            color: "rgba(150,100,80,0.3)",
            textTransform: "uppercase",
          }}>
            [ESC] Пауза
          </div>
        </div>
      )}
    </div>
  );
}
