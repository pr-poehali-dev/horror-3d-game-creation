import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/icon";

interface Props {
  onNewGame: () => void;
  onLoad: () => void;
  onQuit: () => void;
}

export default function MainMenu({ onNewGame, onLoad, onQuit }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = window.innerWidth;
    let H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;

    const particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number; life: number; maxLife: number }[] = [];

    for (let i = 0; i < 120; i++) {
      particles.push(createParticle(W, H));
    }

    function createParticle(w: number, h: number) {
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -Math.random() * 0.5 - 0.1,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.6 + 0.1,
        life: Math.random() * 200,
        maxLife: 200 + Math.random() * 200,
      };
    }

    let time = 0;

    function draw() {
      if (!ctx || !canvas) return;
      W = canvas.width;
      H = canvas.height;
      time += 0.005;

      ctx.clearRect(0, 0, W, H);

      const grad = ctx.createRadialGradient(W * 0.5, H * 0.6, 0, W * 0.5, H * 0.5, W * 0.7);
      grad.addColorStop(0, "rgba(60,0,0,0.15)");
      grad.addColorStop(0.5, "rgba(10,0,0,0.05)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      const pulse = Math.sin(time * 1.5) * 0.3 + 0.7;
      const centerGrad = ctx.createRadialGradient(W * 0.5, H * 0.55, 0, W * 0.5, H * 0.55, 250);
      centerGrad.addColorStop(0, `rgba(180,20,20,${0.08 * pulse})`);
      centerGrad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = centerGrad;
      ctx.fillRect(0, 0, W, H);

      particles.forEach((p, i) => {
        p.x += p.vx + Math.sin(time + i * 0.5) * 0.15;
        p.y += p.vy;
        p.life++;

        if (p.life > p.maxLife || p.y < -10) {
          particles[i] = createParticle(W, H);
          particles[i].y = H + 10;
        }

        const fade = p.life < 30 ? p.life / 30 : p.life > p.maxLife - 30 ? (p.maxLife - p.life) / 30 : 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180, 60, 60, ${p.alpha * fade * 0.4})`;
        ctx.fill();
      });

      for (let i = 0; i < 3; i++) {
        const x = W * (0.2 + i * 0.3);
        const flickerGrad = ctx.createRadialGradient(x, H * 0.85, 0, x, H * 0.85, 80 + Math.sin(time * 3 + i) * 15);
        const flicker = Math.sin(time * 7 + i * 2) * 0.1 + 0.9;
        flickerGrad.addColorStop(0, `rgba(255,140,30,${0.15 * flicker})`);
        flickerGrad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = flickerGrad;
        ctx.fillRect(0, 0, W, H);
      }

      animRef.current = requestAnimationFrame(draw);
    }

    draw();

    const onResize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const menuItems = [
    { id: "new", label: "Новая игра", icon: "Play", action: onNewGame },
    { id: "load", label: "Загрузить", icon: "FolderOpen", action: onLoad },
    { id: "settings", label: "Настройки", icon: "Settings", action: () => {} },
    { id: "quit", label: "Выйти", icon: "LogOut", action: onQuit },
  ];

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(https://cdn.poehali.dev/projects/5e12e9c8-8c76-4621-b2f4-e57c0ab3b570/files/4cf1fae0-5782-40da-a225-804b12fe7cc8.jpg)`,
          filter: "brightness(0.65) saturate(0.75)",
        }}
      />

      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/10 to-black/70" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />

      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" style={{ mixBlendMode: "screen" }} />

      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
          opacity: 0.3,
          pointerEvents: "none",
        }}
      />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)",
        }}
      />

      <div
        className={`relative z-10 flex flex-col items-center justify-center h-full transition-all duration-1000 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      >
        <div className="mb-16 text-center" style={{ animationDelay: "0.2s" }}>
          <div
            className="text-xs tracking-[0.5em] uppercase mb-4"
            style={{ color: "rgba(220,100,100,1)", fontFamily: "'Oswald', sans-serif", fontWeight: 300 }}
          >
            ◆ &nbsp; 2026 &nbsp; ◆
          </div>

          <h1
            className="text-center leading-none mb-3"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(4rem, 10vw, 9rem)",
              fontWeight: 300,
              color: "#f5ede0",
              textShadow: "0 0 40px rgba(220,80,80,0.6), 0 2px 20px rgba(0,0,0,0.8)",
              letterSpacing: "0.15em",
            }}
          >
            DARK
          </h1>
          <h1
            className="text-center leading-none"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(4rem, 10vw, 9rem)",
              fontWeight: 600,
              fontStyle: "italic",
              color: "#e84040",
              textShadow: "0 0 30px rgba(220,50,50,0.9), 0 2px 20px rgba(0,0,0,0.8)",
              letterSpacing: "0.15em",
            }}
          >
            ABYSS
          </h1>

          <div className="flex items-center justify-center gap-4 mt-6">
            <div style={{ width: "60px", height: "1px", background: "linear-gradient(to right, transparent, rgba(180,60,60,0.6))" }} />
            <div
              className="text-xs tracking-[0.4em] uppercase"
              style={{ color: "rgba(230,200,160,0.9)", fontFamily: "'Oswald', sans-serif", fontWeight: 300 }}
            >
              Выживи в темноте
            </div>
            <div style={{ width: "60px", height: "1px", background: "linear-gradient(to left, transparent, rgba(180,60,60,0.6))" }} />
          </div>
        </div>

        <nav className="flex flex-col items-center gap-1 w-full max-w-xs">
          {menuItems.map((item, idx) => (
            <button
              key={item.id}
              onClick={item.action}
              onMouseEnter={() => setHovered(item.id)}
              onMouseLeave={() => setHovered(null)}
              className="group relative w-full flex items-center justify-center gap-3 py-4 px-8 transition-all duration-300"
              style={{
                animationDelay: `${0.4 + idx * 0.1}s`,
                opacity: visible ? 1 : 0,
                transform: visible ? "none" : "translateY(10px)",
                transition: `opacity 0.6s ease ${0.4 + idx * 0.1}s, transform 0.6s ease ${0.4 + idx * 0.1}s`,
              }}
            >
              <div
                className="absolute inset-0 transition-all duration-300"
                style={{
                  background: hovered === item.id
                    ? "linear-gradient(90deg, rgba(180,30,30,0.15), rgba(180,30,30,0.05), rgba(180,30,30,0.15))"
                    : "transparent",
                  borderTop: hovered === item.id ? "1px solid rgba(180,60,60,0.3)" : "1px solid transparent",
                  borderBottom: hovered === item.id ? "1px solid rgba(180,60,60,0.3)" : "1px solid transparent",
                }}
              />

              <div
                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 transition-all duration-300"
                style={{
                  height: hovered === item.id ? "100%" : "0%",
                  background: "linear-gradient(to bottom, transparent, rgba(180,30,30,0.8), transparent)",
                }}
              />

              <Icon
                name={item.icon}
                size={14}
                className="transition-all duration-300"
                style={{
                  color: hovered === item.id ? "#e84040" : "rgba(220,180,140,0.8)",
                  filter: hovered === item.id ? "drop-shadow(0 0 6px rgba(180,30,30,0.8))" : "none",
                }}
              />

              <span
                className="relative transition-all duration-300"
                style={{
                  fontFamily: "'Oswald', sans-serif",
                  fontWeight: 300,
                  fontSize: "0.85rem",
                  letterSpacing: "0.35em",
                  textTransform: "uppercase",
                  color: hovered === item.id ? "#ffffff" : "rgba(230,200,160,0.95)",
                  textShadow: hovered === item.id ? "0 0 20px rgba(180,30,30,0.6)" : "none",
                }}
              >
                {item.label}
              </span>
            </button>
          ))}
        </nav>

        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center"
          style={{ color: "rgba(200,160,120,0.7)", fontFamily: "'Oswald', sans-serif", fontWeight: 200, fontSize: "0.65rem", letterSpacing: "0.3em" }}
        >
          ВЕРСИЯ 0.1.0 &nbsp;|&nbsp; ОНЛАЙН-РЕЖИМ
        </div>
      </div>
    </div>
  );
}