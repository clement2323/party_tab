import type { Song } from "../types/song";
import { deleteSong } from "../api/songs";

interface Props {
  songs: Song[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onDelete: () => void;
}

export function Sidebar({ songs, selectedId, onSelect, onDelete }: Props) {
  async function handleDelete(e: React.MouseEvent, id: number) {
    e.stopPropagation();
    if (!confirm("Supprimer cette chanson ?")) return;
    await deleteSong(id);
    onDelete();
  }

  if (songs.length === 0) {
    return <p className="sidebar-empty">Aucune chanson — colle une URL ci-dessus.</p>;
  }

  return (
    <ul className="song-list">
      {songs.map((song) => (
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
  );
}
