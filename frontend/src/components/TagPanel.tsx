import { useState } from "react";
import type { Tag } from "../types/song";
import { createTag, updateTag, deleteTag } from "../api/tags";

const PALETTE = [
  "#89b4fa", "#cba6f7", "#f38ba8", "#fab387",
  "#a6e3a1", "#94e2d5", "#f9e2af", "#74c7ec",
];

interface Props {
  tags: Tag[];
  activeTags: number[];
  onToggle: (id: number) => void;
  onTagsChanged: () => void;
}

export function TagPanel({ tags, activeTags, onToggle, onTagsChanged }: Props) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(PALETTE[0]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState(PALETTE[0]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await createTag(name.trim(), color);
    setName("");
    setAdding(false);
    onTagsChanged();
  }

  function startEdit(e: React.MouseEvent, tag: Tag) {
    e.stopPropagation();
    setEditingId(tag.id);
    setEditName(tag.name);
    setEditColor(tag.color);
    setAdding(false);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editName.trim() || editingId === null) return;
    await updateTag(editingId, editName.trim(), editColor);
    setEditingId(null);
    onTagsChanged();
  }

  async function handleDelete(e: React.MouseEvent, id: number) {
    e.stopPropagation();
    if (!confirm("Supprimer ce tag de toutes les chansons ?")) return;
    await deleteTag(id);
    onTagsChanged();
  }

  return (
    <div className="tag-panel">
      <div className="tag-panel-header">
        <span>Tags</span>
        <button
          className="tag-add-btn"
          onClick={() => { setAdding(!adding); setEditingId(null); }}
          title="Nouveau tag"
        >
          {adding ? "✕" : "+"}
        </button>
      </div>

      {adding && (
        <form className="tag-create-form" onSubmit={handleCreate}>
          <input
            autoFocus
            placeholder="Nom du tag…"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="color-palette">
            {PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                className={`color-swatch${color === c ? " selected" : ""}`}
                style={{ background: c }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
          <button type="submit" disabled={!name.trim()}>Créer</button>
        </form>
      )}

      {tags.length === 0 && !adding ? (
        <p className="tag-empty">Aucun tag — crée-en un !</p>
      ) : (
        <ul className="tag-list">
          {tags.map((tag) => (
            <li key={tag.id}>
              {editingId === tag.id ? (
                <form className="tag-edit-form" onSubmit={handleEdit}>
                  <input
                    autoFocus
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                  <div className="color-palette">
                    {PALETTE.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={`color-swatch${editColor === c ? " selected" : ""}`}
                        style={{ background: c }}
                        onClick={() => setEditColor(c)}
                      />
                    ))}
                  </div>
                  <div className="tag-edit-actions">
                    <button type="submit" disabled={!editName.trim()} title="Enregistrer">✓</button>
                    <button type="button" onClick={() => setEditingId(null)} title="Annuler">✕</button>
                  </div>
                </form>
              ) : (
                <div
                  className={`tag-item${activeTags.includes(tag.id) ? " active" : ""}`}
                  onClick={() => onToggle(tag.id)}
                >
                  <span className="tag-dot" style={{ background: tag.color }} />
                  <span className="tag-name">{tag.name}</span>
                  <span className="tag-count">{tag.song_count ?? 0}</span>
                  <button className="tag-edit-btn" onClick={(e) => startEdit(e, tag)} title="Modifier">✎</button>
                  <button className="tag-delete-btn" onClick={(e) => handleDelete(e, tag.id)} title="Supprimer">✕</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
