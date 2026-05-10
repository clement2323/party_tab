import { useState } from "react";
import type { SongDetail, Tag } from "../types/song";
import { updateSong } from "../api/songs";
import { ChordLine } from "./ChordLine";
import { TagEditor } from "./TagEditor";

interface Props {
  song: SongDetail;
  allTags: Tag[];
  onTagsChanged: () => void;
  onSongChanged: () => void;
}

export function ChordSheet({ song, allTags, onTagsChanged, onSongChanged }: Props) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editArtist, setEditArtist] = useState("");

  function startEdit() {
    setEditTitle(song.title);
    setEditArtist(song.artist);
    setEditing(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editTitle.trim()) return;
    await updateSong(song.id, editTitle.trim(), editArtist.trim() || song.artist);
    setEditing(false);
    onSongChanged();
  }

  const lines = song.content.split("\n");

  return (
    <div className="chord-sheet">
      <header className="song-header">
        {editing ? (
          <form className="song-edit-form" onSubmit={handleSave}>
            <input
              className="song-edit-title"
              autoFocus
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Titre"
            />
            <input
              className="song-edit-artist"
              value={editArtist}
              onChange={(e) => setEditArtist(e.target.value)}
              placeholder="Artiste"
            />
            <div className="song-edit-actions">
              <button type="submit" disabled={!editTitle.trim()}>Enregistrer</button>
              <button type="button" onClick={() => setEditing(false)}>Annuler</button>
            </div>
          </form>
        ) : (
          <div className="song-title-row">
            <div>
              <h1>{song.title}</h1>
              <p className="song-artist">{song.artist}</p>
            </div>
            <button className="song-edit-btn" onClick={startEdit} title="Modifier titre/artiste">✎</button>
          </div>
        )}
        <div className="song-badges">
          {song.key && <span className="badge">Tonalité : {song.key}</span>}
          {song.capo > 0 && <span className="badge">Capo {song.capo}</span>}
        </div>
        <TagEditor
          songId={song.id}
          songTags={song.tags}
          allTags={allTags}
          onChange={onTagsChanged}
        />
        <a
          href={song.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="source-link"
        >
          Source
        </a>
      </header>
      <div className="partition">
        {lines.map((line, i) => (
          <ChordLine key={i} line={line} />
        ))}
      </div>
    </div>
  );
}
