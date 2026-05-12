import { useState } from "react";
import type { Song, Tag } from "../types/song";
import { setSongTags } from "../api/tags";

interface Props {
  song: Song;
  allTags: Tag[];
  onClose: () => void;
  onChanged: () => void;
}

export function SongTagSheet({ song, allTags, onClose, onChanged }: Props) {
  const [localTagIds, setLocalTagIds] = useState<number[]>(song.tags.map((t) => t.id));

  function toggle(tagId: number) {
    const next = localTagIds.includes(tagId)
      ? localTagIds.filter((id) => id !== tagId)
      : [...localTagIds, tagId];
    setLocalTagIds(next);
    setSongTags(song.id, next).then(() => onChanged());
  }

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet-panel">
        <div className="sheet-handle" />
        <div className="sheet-header">
          <span className="sheet-title">{song.title}</span>
          <button className="sheet-close" onClick={onClose}>✕</button>
        </div>
        {allTags.length === 0 ? (
          <p className="sheet-empty">Crée d'abord des tags dans la sidebar.</p>
        ) : (
          <ul className="sheet-tag-list">
            {allTags.map((tag) => {
              const active = localTagIds.includes(tag.id);
              return (
                <li
                  key={tag.id}
                  className={`sheet-tag-item${active ? " active" : ""}`}
                  onClick={() => toggle(tag.id)}
                >
                  <span className="sheet-tag-dot" style={{ background: tag.color, boxShadow: `0 0 6px ${tag.color}` }} />
                  <span className="sheet-tag-name">{tag.name}</span>
                  <span className={`sheet-tag-check${active ? " visible" : ""}`}>✓</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
