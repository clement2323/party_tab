import { useState, useRef, useEffect } from "react";
import type { Tag } from "../types/song";
import { setSongTags } from "../api/tags";

interface Props {
  songId: number;
  songTags: Tag[];
  allTags: Tag[];
  onChange: () => void;
}

export function TagEditor({ songId, songTags, allTags, onChange }: Props) {
  const [localTags, setLocalTags] = useState<Tag[]>(songTags);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Sync if parent reloads (background refresh)
  useEffect(() => { setLocalTags(songTags); }, [songTags]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function toggle(tagId: number) {
    const currentIds = localTags.map((t) => t.id);
    const nextIds = currentIds.includes(tagId)
      ? currentIds.filter((id) => id !== tagId)
      : [...currentIds, tagId];

    // Update UI immediately
    setLocalTags(allTags.filter((t) => nextIds.includes(t.id)));

    // Send request in background, then refresh sidebar counts
    setSongTags(songId, nextIds).then(() => onChange());
  }

  return (
    <div className="tag-editor" ref={ref}>
      <div className="tag-editor-pills">
        {localTags.map((tag) => (
          <span
            key={tag.id}
            className="tag-pill"
            style={{
              background: tag.color + "22",
              color: tag.color,
              borderColor: tag.color + "66",
            }}
          >
            <span className="tag-pill-dot" style={{ background: tag.color }} />
            {tag.name}
            <button className="tag-pill-remove" onClick={() => toggle(tag.id)}>
              ✕
            </button>
          </span>
        ))}

        <div className="tag-editor-dropdown-wrap">
          <button className="tag-editor-add-btn" onClick={() => setOpen(!open)}>
            + Tag
          </button>
          {open && (
            <div className="tag-editor-dropdown">
              {allTags.length === 0 ? (
                <p className="tag-dropdown-empty">Crée d'abord un tag dans la sidebar.</p>
              ) : (
                allTags.map((tag) => {
                  const active = localTags.some((t) => t.id === tag.id);
                  return (
                    <label key={tag.id} className={`tag-dropdown-item${active ? " checked" : ""}`}>
                      <input
                        type="checkbox"
                        checked={active}
                        onChange={() => toggle(tag.id)}
                      />
                      <span className="tag-dot" style={{ background: tag.color }} />
                      {tag.name}
                    </label>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
