import { UiState } from "./fpsTypes";

interface Props {
  ui: UiState;
  paused: boolean;
  onResume: () => void;
  onSave: () => void;
  onMenu: () => void;
}

export default function FpsHud({ ui, paused, onResume, onSave, onMenu }: Props) {
  return (
    <>
      {/* Crosshair */}
      <div className="absolute pointer-events-none" style={{ left: "50%", top: "50%", transform: "translate(-50%,-50%)" }}>
        <div style={{ width: 2, height: 14, background: "rgba(255,255,255,0.8)", position: "absolute", left: 0, top: -7 }} />
        <div style={{ width: 14, height: 2, background: "rgba(255,255,255,0.8)", position: "absolute", left: -7, top: 0 }} />
      </div>

      {/* HUD overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Health */}
        <div className="absolute bottom-4 left-4 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span style={{ fontFamily: "'Oswald',sans-serif", fontSize: "0.6rem", letterSpacing: "0.3em", color: "rgba(200,150,120,0.7)", fontWeight: 200 }}>ЗДОРОВЬЕ</span>
          </div>
          <div className="flex items-center gap-2">
            <div style={{ width: 120, height: 6, background: "rgba(0,0,0,0.5)", border: "1px solid rgba(180,30,30,0.4)" }}>
              <div style={{
                width: `${ui.health}%`, height: "100%",
                background: ui.health > 60 ? "linear-gradient(to right,#cc2222,#ee4444)" : ui.health > 30 ? "linear-gradient(to right,#cc6600,#ee8800)" : "linear-gradient(to right,#880000,#cc0000)",
                boxShadow: "0 0 6px rgba(180,30,30,0.6)",
                transition: "width 0.2s",
              }} />
            </div>
            <span style={{ fontFamily: "'Oswald',sans-serif", fontSize: "0.75rem", color: "#e8d5c0", fontWeight: 300, minWidth: 30 }}>{ui.health}</span>
          </div>
        </div>

        {/* Ammo */}
        <div className="absolute bottom-4 right-4 text-right">
          <div style={{ fontFamily: "'Oswald',sans-serif", fontSize: "0.6rem", letterSpacing: "0.3em", color: "rgba(200,150,120,0.7)", fontWeight: 200 }}>ПАТРОНЫ</div>
          <div className="flex items-baseline justify-end gap-1 mt-1">
            {ui.reloading ? (
              <span style={{ fontFamily: "'Oswald',sans-serif", fontSize: "0.75rem", color: "#ddaa00", letterSpacing: "0.2em" }}>ПЕРЕЗАРЯДКА...</span>
            ) : (
              <>
                <span style={{ fontFamily: "'Oswald',sans-serif", fontSize: "1.4rem", color: "#e8d5c0", fontWeight: 400 }}>{ui.ammo}</span>
                <span style={{ fontFamily: "'Oswald',sans-serif", fontSize: "0.75rem", color: "rgba(200,150,120,0.5)" }}>/ {ui.maxAmmo}</span>
              </>
            )}
          </div>
        </div>

        {/* Wave */}
        <div className="absolute top-4 left-4">
          <div style={{ fontFamily: "'Oswald',sans-serif", fontSize: "0.6rem", letterSpacing: "0.3em", color: "rgba(200,150,120,0.6)", fontWeight: 200 }}>ВОЛНА</div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "2rem", fontStyle: "italic", color: "#e84040", lineHeight: 1 }}>{ui.wave}</div>
        </div>

        {/* Score */}
        <div className="absolute top-4 right-4 text-right">
          <div style={{ fontFamily: "'Oswald',sans-serif", fontSize: "0.6rem", letterSpacing: "0.3em", color: "rgba(200,150,120,0.6)", fontWeight: 200 }}>СЧЁТ</div>
          <div style={{ fontFamily: "'Oswald',sans-serif", fontSize: "1.2rem", color: "#e8d5c0", fontWeight: 300 }}>{ui.score}</div>
        </div>

        {/* Controls hint */}
        <div className="absolute bottom-4" style={{ left: "50%", transform: "translateX(-50%)" }}>
          <div style={{ fontFamily: "'Oswald',sans-serif", fontSize: "0.55rem", letterSpacing: "0.25em", color: "rgba(180,140,100,0.4)", textTransform: "uppercase" }}>
            WASD — движение &nbsp;|&nbsp; ЛКМ/ПРОБЕЛ — стрельба &nbsp;|&nbsp; R — перезарядка &nbsp;|&nbsp; ESC — пауза
          </div>
        </div>

        {/* Wave Clear */}
        {ui.waveClear && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center" style={{ animation: "fade-in 0.5s ease" }}>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "3rem", fontStyle: "italic", color: "#e8d5c0", textShadow: "0 0 40px rgba(220,180,60,0.8)" }}>
                Волна {ui.wave} пройдена!
              </div>
              <div style={{ fontFamily: "'Oswald',sans-serif", fontSize: "0.8rem", letterSpacing: "0.4em", color: "rgba(220,180,60,0.7)", marginTop: 8 }}>
                СЛЕДУЮЩАЯ ВОЛНА...
              </div>
            </div>
          </div>
        )}

        {/* Wave Starting */}
        {ui.waveStarting && !ui.waveClear && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div style={{ fontFamily: "'Oswald',sans-serif", fontSize: "0.7rem", letterSpacing: "0.5em", color: "rgba(200,150,120,0.6)", marginBottom: 8 }}>ПРИГОТОВЬСЯ</div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "4rem", fontStyle: "italic", color: "#e84040", textShadow: "0 0 40px rgba(220,50,50,0.8)" }}>
                Волна {ui.wave}
              </div>
            </div>
          </div>
        )}

        {/* Game Over */}
        {ui.gameOver && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-auto" style={{ background: "rgba(0,0,0,0.85)" }}>
            <div className="text-center">
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "5rem", fontStyle: "italic", color: "#cc0000", textShadow: "0 0 60px rgba(180,0,0,0.8)" }}>
                Вы мертвы
              </div>
              <div style={{ fontFamily: "'Oswald',sans-serif", fontSize: "1rem", letterSpacing: "0.3em", color: "rgba(200,150,120,0.7)", marginTop: 8 }}>
                СЧЁТ: {ui.score} &nbsp;|&nbsp; ВОЛНА: {ui.wave}
              </div>
              <div className="flex gap-4 justify-center mt-8">
                <button
                  onClick={() => window.location.reload()}
                  style={{ fontFamily: "'Oswald',sans-serif", fontSize: "0.75rem", letterSpacing: "0.3em", color: "#e8d5c0", background: "rgba(180,30,30,0.7)", border: "1px solid rgba(180,60,60,0.4)", padding: "12px 28px", cursor: "pointer" }}
                >
                  ЗАНОВО
                </button>
                <button
                  onClick={onMenu}
                  style={{ fontFamily: "'Oswald',sans-serif", fontSize: "0.75rem", letterSpacing: "0.3em", color: "rgba(200,150,120,0.8)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(180,60,60,0.2)", padding: "12px 28px", cursor: "pointer" }}
                >
                  МЕНЮ
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pause menu */}
      {paused && !ui.gameOver && (
        <div className="absolute inset-0 z-20 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(3px)" }}>
          <div style={{ background: "linear-gradient(135deg,rgba(10,3,3,0.97),rgba(5,1,1,0.97))", border: "1px solid rgba(180,60,60,0.2)", padding: "32px 40px", boxShadow: "0 0 60px rgba(80,0,0,0.4)", minWidth: 220 }}>
            <div className="text-center mb-6" style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "2rem", fontStyle: "italic", color: "rgba(220,190,160,0.9)" }}>Пауза</div>
            <div className="flex flex-col gap-1">
              {[
                { label: "Продолжить", action: onResume },
                { label: "Сохранить", action: onSave },
                { label: "Главное меню", action: onMenu },
              ].map(item => (
                <button
                  key={item.label}
                  onClick={item.action}
                  style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 300, fontSize: "0.75rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(200,150,120,0.8)", background: "transparent", border: "1px solid transparent", padding: "12px 20px", cursor: "pointer", transition: "all 0.2s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#e8d5c0"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(180,60,60,0.3)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(200,150,120,0.8)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "transparent"; }}
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
        <div style={{ fontFamily: "'Oswald',sans-serif", fontSize: "0.6rem", letterSpacing: "0.3em", color: "rgba(200,150,120,0.4)" }}>
          КЛИКНИ НА ЭКРАН ДЛЯ ЗАХВАТА МЫШИ
        </div>
      </div>
    </>
  );
}
