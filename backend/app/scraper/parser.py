import re
from dataclasses import dataclass
from bs4 import BeautifulSoup, NavigableString, Tag
from .exceptions import ParseError


@dataclass
class SongData:
    title: str
    artist: str
    key: str | None
    capo: int
    content: str  # ChordPro format
    source_url: str


def _normalize_chord(chord: str) -> str:
    return chord.replace("♭", "b").replace("♯", "#")


def _parse_lyric_line(div) -> str:
    """Convert a div.pL to a ChordPro line: [Am]le coup de [G]soleil..."""
    parts = []
    for child in div.children:
        if isinstance(child, NavigableString):
            text = str(child).replace("\xa0", " ")
            parts.append(text)
        elif isinstance(child, Tag):
            # span.sI wraps an accord span
            chord_span = child.find("span", class_="a") if child.name == "span" else None
            if chord_span:
                raw = chord_span.get("data-aff") or chord_span.get("data-a") or ""
                if raw and raw != "undefined":
                    parts.append(f"[{_normalize_chord(raw)}]")
            else:
                # plain text inside other spans (e.g. span.sP for syllable)
                text = child.get_text().replace("\xa0", " ")
                parts.append(text)
    return "".join(parts).rstrip()


def _parse_instrumental_line(div) -> str:
    chords = []
    for span in div.find_all("span", class_="a"):
        raw = span.get("data-aff") or span.get("data-a") or ""
        if raw and raw != "undefined":
            chords.append(f"[{_normalize_chord(raw)}]")
    return "/ " + " ".join(chords) if chords else ""


def _build_chordpro(partition_div) -> str:
    lines = []
    for child in partition_div.children:
        if not isinstance(child, Tag):
            continue
        classes = child.get("class") or []
        if "pL" in classes:
            lines.append(_parse_lyric_line(child))
        elif "pLI" in classes:
            line = _parse_instrumental_line(child)
            if line:
                lines.append(line)
        elif "pLS" in classes:
            label = child.get_text(strip=True)
            if label:
                lines.append(f"{{{label}}}")
        elif "pLVV" in classes:
            lines.append("")
    return "\n".join(lines)


def parse_song(html: str, source_url: str) -> SongData:
    soup = BeautifulSoup(html, "html.parser")

    partition = soup.find(id="divPartition")
    if not partition:
        raise ParseError("divPartition introuvable")

    title_tag = soup.find(id="dTitreChanson")
    title = title_tag.get_text(strip=True).title() if title_tag else "Titre inconnu"

    artist = "Artiste inconnu"
    artist_container = soup.find(class_="dTitreNomArtiste")
    if artist_container:
        a_tag = artist_container.find("a")
        if a_tag:
            artist = a_tag.get_text(strip=True).title()

    key_input = soup.find(id="tonalite")
    key = key_input["value"].strip() if key_input and key_input.get("value") else None
    if not key:
        key = None

    capo_input = soup.find(id="capo")
    try:
        capo = int(capo_input["value"]) if capo_input and capo_input.get("value") else 0
    except (ValueError, TypeError):
        capo = 0

    content = _build_chordpro(partition)

    return SongData(
        title=title,
        artist=artist,
        key=key,
        capo=capo,
        content=content,
        source_url=source_url,
    )
