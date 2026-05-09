import type { SongDetail } from "../types/song";
import { ChordLine } from "./ChordLine";

interface Props {
  song: SongDetail;
}

export function ChordSheet({ song }: Props) {
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
