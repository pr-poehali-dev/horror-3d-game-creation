import { useState } from "react";
import MainMenu from "@/components/MainMenu";
import SavesModal from "@/components/SavesModal";
import GameScreen from "@/components/GameScreen";

export type GameView = "menu" | "game" | "saves";

export interface SaveSlot {
  id: number;
  name: string;
  chapter: string;
  date: string;
  playtime: string;
  empty: boolean;
}

const INITIAL_SAVES: SaveSlot[] = [
  { id: 1, name: "Сохранение 1", chapter: "Глава I: Прибытие", date: "03.05.2026 — 14:22", playtime: "1ч 24м", empty: false },
  { id: 2, name: "Сохранение 2", chapter: "Глава II: Подвал", date: "02.05.2026 — 22:10", playtime: "3ч 07м", empty: false },
  { id: 3, name: "Сохранение 3", chapter: "", date: "", playtime: "", empty: true },
  { id: 4, name: "Сохранение 4", chapter: "", date: "", playtime: "", empty: true },
];

export default function Index() {
  const [view, setView] = useState<GameView>("menu");
  const [saves, setSaves] = useState<SaveSlot[]>(INITIAL_SAVES);
  const [savesMode, setSavesMode] = useState<"load" | "save">("load");

  const openLoad = () => { setSavesMode("load"); setView("saves"); };
  const openSave = () => { setSavesMode("save"); setView("saves"); };

  const handleLoadSave = (slot: SaveSlot) => {
    if (!slot.empty) setView("game");
  };

  const handleSave = (slotId: number) => {
    setSaves(prev => prev.map(s =>
      s.id === slotId
        ? { ...s, empty: false, chapter: "Глава II: Подвал", date: "03.05.2026 — 15:00", playtime: "2ч 00м" }
        : s
    ));
    setView("game");
  };

  const handleDelete = (slotId: number) => {
    setSaves(prev => prev.map(s =>
      s.id === slotId
        ? { ...s, empty: true, chapter: "", date: "", playtime: "" }
        : s
    ));
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {view === "menu" && (
        <MainMenu onNewGame={() => setView("game")} onLoad={openLoad} onQuit={() => {}} />
      )}
      {view === "game" && (
        <GameScreen onMenu={() => setView("menu")} onSave={openSave} />
      )}
      {view === "saves" && (
        <SavesModal
          mode={savesMode}
          saves={saves}
          onClose={() => setView(savesMode === "load" ? "menu" : "game")}
          onLoad={handleLoadSave}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
