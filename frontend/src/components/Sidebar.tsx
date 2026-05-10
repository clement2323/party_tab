import { useState } from "react";
import type { Song, Tag } from "../types/song";
import { deleteSong } from "../api/songs";
import { TagPanel } from "./TagPanel";

interface Props {
  songs: Song[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onDelete: () => void;
  tags: Tag[];
  activeTags: number[];
  onToggleTag: (id: number) => void;
  onTagsChanged: () => void;
}

export function Sidebar({ songs, selectedId, onSelect, onDelete, tags, activeTags, onToggleTag, onTagsChanged }: Props) {
  const [query, setQuery] = useState("");

  async function handleDelete(e: React.MouseEvent, id: number) {
    e.stopPropagation();
    if (!confirm("Supprimer cette chanson ?")) return;
    await deleteSong(id);
    onDelete();
  }

  const filtered = songs.filter((s) => {
    const matchText =
      !query.trim() ||
      s.title.toLowerCase().includes(query.toLowerCase()) ||
      s.artist.toLowerCase().includes(query.toLowerCase());
    const matchTags = activeTags.every((tid) => s.tags.some((t) => t.id === tid));
    return matchText && matchTags;
  });

  return (
    <div className="sidebar-body">
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
          {query || activeTags.length > 0 ? "Aucun résultat." : "Aucune chanson — colle une URL ci-dessus."}
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
              {song.tags.length > 0 && (
                <div className="song-tag-dots">
                  {song.tags.slice(0, 6).map((t) => (
                    <span key={t.id} className="song-tag-dot" style={{ background: t.color }} />
                  ))}
                </div>
              )}
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

      <TagPanel
        tags={tags}
        activeTags={activeTags}
        onToggle={onToggleTag}
        onTagsChanged={onTagsChanged}
      />
    </div>
  );
}
