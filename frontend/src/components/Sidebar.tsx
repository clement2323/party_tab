import { useState, useRef } from "react";
import type { Song, Tag } from "../types/song";
import { deleteSong, updateSong } from "../api/songs";
import { TagPanel } from "./TagPanel";
import { SongTagSheet } from "./SongTagSheet";

interface Props {
  songs: Song[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onDelete: () => void;
  onSongChanged: () => void;
  tags: Tag[];
  activeTags: number[];
  onToggleTag: (id: number) => void;
  onTagsChanged: () => void;
}

export function Sidebar({
  songs, selectedId, onSelect, onDelete, onSongChanged,
  tags, activeTags, onToggleTag, onTagsChanged,
}: Props) {
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editArtist, setEditArtist] = useState("");
  const [tagSheetId, setTagSheetId] = useState<number | null>(null);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasLongPress = useRef(false);

  const tagSheetSong = tagSheetId != null ? songs.find((s) => s.id === tagSheetId) ?? null : null;

  async function handleDelete(e: React.MouseEvent, id: number) {
    e.stopPropagation();
    if (!confirm("Supprimer cette chanson ?")) return;
    await deleteSong(id);
    onDelete();
  }

  function startEdit(e: React.MouseEvent, song: Song) {
    e.stopPropagation();
    setEditingId(song.id);
    setEditTitle(song.title);
    setEditArtist(song.artist);
  }

  async function handleSaveEdit(e: React.FormEvent, id: number) {
    e.preventDefault();
    if (!editTitle.trim()) return;
    await updateSong(id, editTitle.trim(), editArtist.trim());
    setEditingId(null);
    onSongChanged();
  }

  function onTouchStart(song: Song) {
    wasLongPress.current = false;
    pressTimer.current = setTimeout(() => {
      wasLongPress.current = true;
      setTagSheetId(song.id);
    }, 500);
  }

  function onTouchEnd() {
    if (pressTimer.current) { clearTimeout(pressTimer.current); pressTimer.current = null; }
  }

  function handleSongClick(song: Song) {
    if (wasLongPress.current) { wasLongPress.current = false; return; }
    onSelect(song.id);
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
            <li key={song.id}>
              {editingId === song.id ? (
                <form
                  className="song-inline-edit"
                  onSubmit={(e) => handleSaveEdit(e, song.id)}
                >
                  <input
                    className="song-inline-title"
                    autoFocus
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Titre"
                  />
                  <input
                    className="song-inline-artist"
                    value={editArtist}
                    onChange={(e) => setEditArtist(e.target.value)}
                    placeholder="Artiste"
                  />
                  <div className="song-inline-actions">
                    <button type="submit" disabled={!editTitle.trim()}>✓</button>
                    <button type="button" onClick={() => setEditingId(null)}>✕</button>
                  </div>
                </form>
              ) : (
                <div
                  className={`song-item${song.id === selectedId ? " selected" : ""}`}
                  onClick={() => handleSongClick(song)}
                  onTouchStart={() => onTouchStart(song)}
                  onTouchEnd={onTouchEnd}
                  onTouchMove={onTouchEnd}
                >
                  <div className="song-item-text">
                    <span className="song-item-title">{song.title}</span>
                    <span className="song-item-artist">{song.artist}</span>
                  </div>
                  <div
                    className="song-tag-area"
                    onClick={(e) => { e.stopPropagation(); setTagSheetId(song.id); }}
                  >
                    {song.tags.length > 0 ? (
                      song.tags.slice(0, 5).map((t) => (
                        <span
                          key={t.id}
                          className="song-tag-dot"
                          style={{ background: t.color, boxShadow: `0 0 4px ${t.color}` }}
                        />
                      ))
                    ) : (
                      <span className="song-tag-add-hint">#</span>
                    )}
                  </div>
                  <button
                    className="song-rename-btn"
                    onClick={(e) => startEdit(e, song)}
                    title="Renommer"
                  >
                    ✎
                  </button>
                  <button
                    className="delete-btn"
                    onClick={(e) => handleDelete(e, song.id)}
                    title="Supprimer"
                  >
                    ✕
                  </button>
                </div>
              )}
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

      {tagSheetSong && (
        <SongTagSheet
          song={tagSheetSong}
          allTags={tags}
          onClose={() => setTagSheetId(null)}
          onChanged={onTagsChanged}
        />
      )}
    </div>
  );
}
