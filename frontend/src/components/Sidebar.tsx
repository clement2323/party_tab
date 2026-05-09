import { useState } from "react";
import type { Song } from "../types/song";
import { deleteSong } from "../api/songs";

interface Props {
  songs: Song[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onDelete: () => void;
}

export function Sidebar({ songs, selectedId, onSelect, onDelete }: Props) {
  const [query, setQuery] = useState("");

  async function handleDelete(e: React.MouseEvent, id: number) {
    e.stopPropagation();
    if (!confirm("Supprimer cette chanson ?")) return;
    await deleteSong(id);
    onDelete();
  }

  const filtered = query.trim()
    ? songs.filter(
        (s) =>
          s.title.toLowerCase().includes(query.toLowerCase()) ||
          s.artist.toLowerCase().includes(query.toLowerCase())
      )
    : songs;

  return (
    <>
      <div className="search-wrapper">
        <span className="search-icon">🔍</span>
        <input
          className="search-input"
          type="search"
          placeholder="Rechercher…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <p className="sidebar-empty">
          {query ? "Aucun résultat." : "Aucune chanson — colle une URL ci-dessus."}
        </p>
      ) : (
        <ul className="song-list">
          {filtered.map((song) => (
            <li
              key={song.id}
              className={`song-item${song.id === selectedId ? " selected" : ""}`}
              onClick={() => onSelect(song.id)}
            >
              <div className="song-item-text">
                <span className="song-item-title">{song.title}</span>
                <span className="song-item-artist">{song.artist}</span>
              </div>
              <button
                className="delete-btn"
                onClick={(e) => handleDelete(e, song.id)}
                title="Supprimer"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
