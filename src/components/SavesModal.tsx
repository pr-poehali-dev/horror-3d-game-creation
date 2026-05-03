import { useState } from "react";
import Icon from "@/components/ui/icon";
import { SaveSlot } from "@/pages/Index";

interface Props {
  mode: "load" | "save";
  saves: SaveSlot[];
  onClose: () => void;
  onLoad: (slot: SaveSlot) => void;
  onSave: (slotId: number) => void;
  onDelete: (slotId: number) => void;
}

export default function SavesModal({ mode, saves, onClose, onLoad, onSave, onDelete }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const handleAction = (slot: SaveSlot) => {
    if (mode === "load") {
      if (!slot.empty) onLoad(slot);
    } else {
      onSave(slot.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      />

      <div
        className="relative z-10 w-full max-w-2xl mx-4 animate-fade-in"
        style={{
          background: "linear-gradient(135deg, rgba(15,5,5,0.98), rgba(8,2,2,0.98))",
          border: "1px solid rgba(180,60,60,0.2)",
          boxShadow: "0 0 80px rgba(100,10,10,0.4), inset 0 0 40px rgba(0,0,0,0.5)",
        }}
      >
        <div
          className="flex items-center justify-between px-8 py-5"
          style={{ borderBottom: "1px solid rgba(180,60,60,0.15)" }}
        >
          <div className="flex items-center gap-3">
            <div style={{ width: "3px", height: "20px", background: "rgba(180,30,30,0.8)" }} />
            <h2
              style={{
                fontFamily: "'Oswald', sans-serif",
                fontWeight: 300,
                fontSize: "0.8rem",
                letterSpacing: "0.4em",
                textTransform: "uppercase",
                color: "rgba(200,160,120,0.8)",
              }}
            >
              {mode === "load" ? "Загрузить игру" : "Сохранить игру"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="transition-all duration-200 hover:opacity-100"
            style={{ color: "rgba(180,60,60,0.5)" }}
          >
            <Icon name="X" size={18} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-3">
          {saves.map((slot) => (
            <div
              key={slot.id}
              onClick={() => setSelected(slot.id)}
              className="relative group cursor-pointer transition-all duration-300"
              style={{
                background: selected === slot.id
                  ? "rgba(180,30,30,0.08)"
                  : "rgba(255,255,255,0.02)",
                border: selected === slot.id
                  ? "1px solid rgba(180,60,60,0.35)"
                  : "1px solid rgba(180,60,60,0.08)",
                padding: "16px 20px",
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className="flex items-center justify-center w-8 h-8 flex-shrink-0"
                    style={{
                      background: slot.empty ? "rgba(255,255,255,0.03)" : "rgba(180,30,30,0.15)",
                      border: "1px solid rgba(180,60,60,0.2)",
                    }}
                  >
                    <Icon
                      name={slot.empty ? "Plus" : "BookOpen"}
                      size={14}
                      style={{ color: slot.empty ? "rgba(150,100,80,0.3)" : "rgba(180,60,60,0.7)" }}
                    />
                  </div>

                  <div>
                    <div
                      style={{
                        fontFamily: "'Oswald', sans-serif",
                        fontWeight: 300,
                        fontSize: "0.72rem",
                        letterSpacing: "0.3em",
                        textTransform: "uppercase",
                        color: slot.empty ? "rgba(150,100,80,0.35)" : "rgba(200,160,120,0.7)",
                      }}
                    >
                      {slot.name}
                    </div>
                    {!slot.empty && (
                      <div
                        style={{
                          fontFamily: "'Cormorant Garamond', serif",
                          fontSize: "1rem",
                          fontStyle: "italic",
                          color: "rgba(220,190,160,0.9)",
                          marginTop: "2px",
                        }}
                      >
                        {slot.chapter}
                      </div>
                    )}
                    {slot.empty && (
                      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "0.9rem", fontStyle: "italic", color: "rgba(150,100,80,0.3)", marginTop: "2px" }}>
                        — пусто —
                      </div>
                    )}
                  </div>
                </div>

                {!slot.empty && (
                  <div className="text-right flex-shrink-0 ml-4">
                    <div style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 200, fontSize: "0.65rem", letterSpacing: "0.2em", color: "rgba(150,100,80,0.5)" }}>
                      {slot.date}
                    </div>
                    <div style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 200, fontSize: "0.65rem", letterSpacing: "0.2em", color: "rgba(150,100,80,0.35)", marginTop: "2px" }}>
                      {slot.playtime}
                    </div>
                  </div>
                )}
              </div>

              {selected === slot.id && (
                <div className="flex items-center gap-2 mt-4 pt-4" style={{ borderTop: "1px solid rgba(180,60,60,0.12)" }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleAction(slot); }}
                    className="flex items-center gap-2 px-5 py-2 transition-all duration-200 hover:brightness-110"
                    style={{
                      background: slot.empty && mode === "load" ? "rgba(100,50,30,0.3)" : "rgba(180,30,30,0.7)",
                      fontFamily: "'Oswald', sans-serif",
                      fontWeight: 300,
                      fontSize: "0.7rem",
                      letterSpacing: "0.3em",
                      textTransform: "uppercase",
                      color: slot.empty && mode === "load" ? "rgba(150,100,80,0.4)" : "#e8d5c0",
                      cursor: slot.empty && mode === "load" ? "not-allowed" : "pointer",
                    }}
                  >
                    <Icon name={mode === "load" ? "Play" : "Save"} size={12} />
                    {mode === "load" ? "Загрузить" : "Сохранить"}
                  </button>

                  {!slot.empty && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirmDelete === slot.id) {
                          onDelete(slot.id);
                          setConfirmDelete(null);
                          setSelected(null);
                        } else {
                          setConfirmDelete(slot.id);
                        }
                      }}
                      className="flex items-center gap-2 px-4 py-2 transition-all duration-200"
                      style={{
                        background: confirmDelete === slot.id ? "rgba(180,30,30,0.4)" : "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(180,60,60,0.2)",
                        fontFamily: "'Oswald', sans-serif",
                        fontWeight: 300,
                        fontSize: "0.7rem",
                        letterSpacing: "0.3em",
                        textTransform: "uppercase",
                        color: confirmDelete === slot.id ? "#e8d5c0" : "rgba(180,60,60,0.5)",
                      }}
                    >
                      <Icon name="Trash2" size={12} />
                      {confirmDelete === slot.id ? "Подтвердить" : "Удалить"}
                    </button>
                  )}

                  {confirmDelete === slot.id && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmDelete(null); }}
                      className="px-3 py-2 transition-all duration-200"
                      style={{
                        fontFamily: "'Oswald', sans-serif",
                        fontSize: "0.65rem",
                        letterSpacing: "0.25em",
                        color: "rgba(150,100,80,0.5)",
                      }}
                    >
                      Отмена
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <div
          className="px-8 py-4 flex justify-end"
          style={{ borderTop: "1px solid rgba(180,60,60,0.1)" }}
        >
          <button
            onClick={onClose}
            className="flex items-center gap-2 transition-all duration-200 hover:opacity-100"
            style={{
              fontFamily: "'Oswald', sans-serif",
              fontWeight: 300,
              fontSize: "0.7rem",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "rgba(150,100,80,0.5)",
            }}
          >
            <Icon name="ArrowLeft" size={12} />
            Назад
          </button>
        </div>
      </div>
    </div>
  );
}
