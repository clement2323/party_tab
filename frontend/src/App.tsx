import { useEffect, useState } from "react";
import type { Song, SongDetail, Tag } from "./types/song";
import { getSongs, getSong } from "./api/songs";
import { getTags } from "./api/tags";
import { ScrapeForm } from "./components/ScrapeForm";
import { Sidebar } from "./components/Sidebar";
import { ChordSheet } from "./components/ChordSheet";

function App() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<SongDetail | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [activeTags, setActiveTags] = useState<number[]>([]);
  const [mobileView, setMobileView] = useState<"list" | "detail">("list");

  async function loadSongs() {
    const cached = localStorage.getItem("partoche_songs");
    if (cached && songs.length === 0) {
      try { setSongs(JSON.parse(cached)); } catch { /* ignore bad cache */ }
    }
    const list = await getSongs();
    setSongs(list);
    localStorage.setItem("partoche_songs", JSON.stringify(list));
  }

  async function loadTags() {
    const cached = localStorage.getItem("partoche_tags");
    if (cached && tags.length === 0) {
      try { setTags(JSON.parse(cached)); } catch { /* ignore */ }
    }
    const list = await getTags();
    setTags(list);
    localStorage.setItem("partoche_tags", JSON.stringify(list));
  }

  useEffect(() => { loadSongs(); loadTags(); }, []);

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

  function toggleTag(id: number) {
    setActiveTags((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  }

  function handleTagsChanged() {
    if (selectedId != null) getSong(selectedId).then(setDetail);
    loadTags();
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
          onSongChanged={() => {
            if (selectedId != null) getSong(selectedId).then(setDetail);
            loadSongs();
          }}
          tags={tags}
          activeTags={activeTags}
          onToggleTag={toggleTag}
          onTagsChanged={handleTagsChanged}
        />
      </aside>

      <main className={`content${mobileView === "list" ? " mobile-hidden" : ""}`}>
        {detail ? (
          <>
            <button className="back-btn" onClick={() => setMobileView("list")}>
              ← Liste
            </button>
            <ChordSheet
              song={detail}
              allTags={tags}
              onTagsChanged={handleTagsChanged}
              onSongChanged={() => {
                if (selectedId != null) getSong(selectedId).then(setDetail);
                loadSongs();
              }}
            />
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
