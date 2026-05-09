import { useEffect, useState } from "react";
import type { Song, SongDetail } from "./types/song";
import { getSongs, getSong } from "./api/songs";
import { ScrapeForm } from "./components/ScrapeForm";
import { Sidebar } from "./components/Sidebar";
import { ChordSheet } from "./components/ChordSheet";

function App() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<SongDetail | null>(null);
  // Sur mobile : "list" ou "detail"
  const [mobileView, setMobileView] = useState<"list" | "detail">("list");

  async function loadSongs() {
    const list = await getSongs();
    setSongs(list);
  }

  useEffect(() => { loadSongs(); }, []);

  useEffect(() => {
    if (selectedId == null) { setDetail(null); return; }
    getSong(selectedId).then(setDetail);
  }, [selectedId]);

  function handleSelect(id: number) {
    setSelectedId(id);
    setMobileView("detail");
  }

  function handleDelete() {
    if (selectedId != null) { setSelectedId(null); setDetail(null); }
    setMobileView("list");
    loadSongs();
  }

  return (
    <div className="app">
      <aside className={`sidebar${mobileView === "detail" ? " mobile-hidden" : ""}`}>
        <div className="sidebar-header">
          <h2>🎸 Partoche</h2>
        </div>
        <ScrapeForm onSuccess={loadSongs} />
        <Sidebar
          songs={songs}
          selectedId={selectedId}
          onSelect={handleSelect}
          onDelete={handleDelete}
        />
      </aside>

      <main className={`content${mobileView === "list" ? " mobile-hidden" : ""}`}>
        {detail ? (
          <>
            <button className="back-btn" onClick={() => setMobileView("list")}>
              ← Liste
            </button>
            <ChordSheet song={detail} />
          </>
        ) : (
          <div className="empty-state">
            <p>Sélectionne une chanson ou colle une URL Boîte à Chansons.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
