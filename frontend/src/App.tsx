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

  async function loadSongs() {
    const list = await getSongs();
    setSongs(list);
  }

  useEffect(() => {
    loadSongs();
  }, []);

  useEffect(() => {
    if (selectedId == null) {
      setDetail(null);
      return;
    }
    getSong(selectedId).then(setDetail);
  }, [selectedId]);

  function handleDelete() {
    if (selectedId != null) {
      setSelectedId(null);
      setDetail(null);
    }
    loadSongs();
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Partoche</h2>
        </div>
        <ScrapeForm onSuccess={loadSongs} />
        <Sidebar
          songs={songs}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onDelete={handleDelete}
        />
      </aside>
      <main className="content">
        {detail ? (
          <ChordSheet song={detail} />
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
