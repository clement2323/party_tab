import json
import re
from bs4 import BeautifulSoup
from .exceptions import ParseError
from .parser import SongData, _normalize_chord


def _ug_to_chordpro(raw: str) -> str:
    lines = raw.replace("\r\n", "\n").split("\n")
    out = []
    for line in lines:
        # Section headers: [Verse], [Chorus], [Bridge 1] etc.
        section = re.match(r"^\[([A-Z][^\]]*)\]$", line.strip())
        if section:
            out.append(f"{{{section.group(1)}}}")
            continue

        # Replace [ch]Am[/ch] with [Am]
        converted = re.sub(
            r"\[ch\]([^\[]+)\[/ch\]",
            lambda m: f"[{_normalize_chord(m.group(1).strip())}]",
            line,
        )

        # Strip [tab] / [/tab] markers but keep tablature content
        converted = re.sub(r"\[/?tab\]", "", converted)

        out.append(converted)

    return "\n".join(out)


def parse_ug_api_song(data: dict, source_url: str) -> SongData:
    """Parse UG mobile API response (no HTML parsing needed)."""
    try:
        tab = data["tab"]
        tab_view = data["tab_view"]
        title = tab.get("song_name", "Titre inconnu").strip().title()
        artist = tab.get("artist_name", "Artiste inconnu").strip().title()
        meta = tab_view.get("meta", {})
        capo_raw = meta.get("capo", 0)
        capo = int(capo_raw) if capo_raw else 0
        key = tab.get("tonality_name") or None
        raw_content = tab_view["wiki_tab"].get("content", "")
    except (KeyError, TypeError, ValueError) as e:
        raise ParseError(f"Données API UG invalides : {e}") from e

    return SongData(
        title=title,
        artist=artist,
        key=key,
        capo=capo,
        content=_ug_to_chordpro(raw_content),
        source_url=source_url,
    )


def parse_ug_song(html: str, source_url: str) -> SongData:
    soup = BeautifulSoup(html, "html.parser")

    store_div = soup.find("div", class_="js-store")
    if not store_div or not store_div.get("data-content"):
        raise ParseError("Structure UG introuvable (js-store manquant)")

    try:
        data = json.loads(store_div["data-content"])
        page_data = data["store"]["page"]["data"]
        tab = page_data["tab"]
        tab_view = page_data["tab_view"]
    except (KeyError, json.JSONDecodeError) as e:
        raise ParseError(f"JSON UG invalide : {e}") from e

    title = tab.get("song_name", "Titre inconnu").strip().title()
    artist = tab.get("artist_name", "Artiste inconnu").strip().title()

    meta = tab_view.get("meta", {})
    capo_raw = meta.get("capo", 0)
    try:
        capo = int(capo_raw) if capo_raw else 0
    except (ValueError, TypeError):
        capo = 0

    key = meta.get("tonality") or None

    raw_content = tab_view.get("wiki_tab", {}).get("content", "")
    content = _ug_to_chordpro(raw_content)

    return SongData(
        title=title,
        artist=artist,
        key=key,
        capo=capo,
        content=content,
        source_url=source_url,
    )
