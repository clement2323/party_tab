interface Segment {
  chord: string | null;
  lyric: string;
}

function parseChordPro(line: string): Segment[] {
  // Split on [Chord] markers, keeping the delimiters
  const parts = line.split(/(\[[^\]]+\])/);
  const segments: Segment[] = [];
  let pendingChord: string | null = null;

  for (const part of parts) {
    const chordMatch = part.match(/^\[([^\]]+)\]$/);
    if (chordMatch) {
      // Flush previous chord with empty lyric if another chord follows immediately
      if (pendingChord !== null) {
        segments.push({ chord: pendingChord, lyric: "" });
      }
      pendingChord = chordMatch[1];
    } else {
      segments.push({ chord: pendingChord, lyric: part });
      pendingChord = null;
    }
  }
  if (pendingChord !== null) {
    segments.push({ chord: pendingChord, lyric: "" });
  }
  return segments;
}

interface Props {
  line: string;
}

export function ChordLine({ line }: Props) {
  // Empty line → spacer
  if (line.trim() === "") {
    return <div className="line-spacer" />;
  }

  // Section label: {Couplet}, {Refrain}, etc.
  const sectionMatch = line.match(/^\{(.+)\}$/);
  if (sectionMatch) {
    return <div className="section-label">{sectionMatch[1]}</div>;
  }

  // Instrumental line: / [E] [B7] …
  const isInstrumental = line.startsWith("/ ");
  const content = isInstrumental ? line.slice(2) : line;

  const segments = parseChordPro(content);
  const hasChords = segments.some((s) => s.chord !== null);

  return (
    <div className={`chord-line${isInstrumental ? " instrumental" : ""}`}>
      {hasChords && (
        <div className="chord-row">
          {segments.map((seg, i) => (
            <span key={i} className="chord-cell">
              <span className="chord">{seg.chord ?? " "}</span>
            </span>
          ))}
        </div>
      )}
      {!isInstrumental && (
        <div className="lyric-row">
          {segments.map((seg, i) => (
            <span key={i} className="chord-cell">
              <span className="lyric">{seg.lyric || " "}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
