import type { SongDetail, Tag } from "../types/song";
import { ChordLine } from "./ChordLine";
import { TagEditor } from "./TagEditor";

interface Props {
  song: SongDetail;
  allTags: Tag[];
  onTagsChanged: () => void;
}

export function ChordSheet({ song, allTags, onTagsChanged }: Props) {
  const lines = song.content.split("\n");

  return (
    <div className="chord-sheet">
      <header className="song-header">
        <h1>{song.title}</h1>
        <p className="song-artist">{song.artist}</p>
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
