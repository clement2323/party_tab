from urllib.parse import urlparse
from fastapi import APIRouter, HTTPException, status
from ..schemas import (
    ScrapeRequest, PasteRequest, ScrapeResponse,
    SetTagsRequest, SongDetail, SongOut,
)
from ..crud import (
    get_songs, get_song, get_song_by_url, create_song,
    delete_song, set_song_tags,
)
from ..scraper.fetcher import fetch_page, fetch_ug_page
from ..scraper.parser import parse_song
from ..scraper.ug_parser import parse_ug_song
from ..scraper.exceptions import ScrapeError, ParseError

router = APIRouter()

ALLOWED_DOMAINS = {"boiteachansons.net", "ultimate-guitar.com", "tabs.ultimate-guitar.com"}


def _get_host(url: str) -> str:
    return urlparse(url).netloc.replace("www.", "")


def _validate_url(url: str) -> str:
    host = _get_host(url)
    if not any(host == d or host.endswith("." + d) for d in ALLOWED_DOMAINS):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Domaine non supporté : {host}. Utilise boiteachansons.net ou ultimate-guitar.com",
        )
    return host


@router.post("/scrape", response_model=ScrapeResponse, status_code=status.HTTP_201_CREATED)
def scrape_song(body: ScrapeRequest):
    host = _validate_url(body.url)
    is_ug = "ultimate-guitar" in host

    existing = get_song_by_url(body.url)
    if existing:
        return ScrapeResponse(song=SongDetail.model_validate(existing), already_existed=True)

    try:
        if is_ug:
            html, canonical_url = fetch_ug_page(body.url)
        else:
            html, canonical_url = fetch_page(body.url)
    except ScrapeError as e:
        err_msg = str(e)
        if "cloudflare" in err_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={"code": "ug_blocked", "message": err_msg},
            )
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=err_msg)

    existing = get_song_by_url(canonical_url)
    if existing:
        return ScrapeResponse(song=SongDetail.model_validate(existing), already_existed=True)

    try:
        data = parse_ug_song(html, canonical_url) if is_ug else parse_song(html, canonical_url)
    except ParseError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))

    song = create_song(data)
    return ScrapeResponse(song=SongDetail.model_validate(song))


@router.post("/from-text", response_model=ScrapeResponse, status_code=status.HTTP_201_CREATED)
def song_from_text(body: PasteRequest):
    """Fallback : importer un tab collé manuellement (format UG ou texte libre)."""
    from ..scraper.ug_parser import _ug_to_chordpro
    from ..scraper.parser import SongData

    text = body.text.strip()
    if not text:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Texte vide")

    # Detect UG format by presence of [ch] tags
    if "[ch]" in text:
        content = _ug_to_chordpro(text)
    else:
        content = text  # assume already ChordPro or plain text

    # Extract title/artist from first lines if they look like metadata
    lines = text.splitlines()
    title = "Titre inconnu"
    artist = "Artiste inconnu"
    for line in lines[:5]:
        if line.lower().startswith("title:"):
            title = line.split(":", 1)[1].strip().title()
        elif line.lower().startswith("artist:"):
            artist = line.split(":", 1)[1].strip().title()

    if body.source_url:
        existing = get_song_by_url(body.source_url)
        if existing:
            return ScrapeResponse(song=SongDetail.model_validate(existing), already_existed=True)

    data = SongData(
        title=title, artist=artist, key=None, capo=0,
        content=content, source_url=body.source_url or f"paste://{hash(text)}",
    )
    song = create_song(data)
    return ScrapeResponse(song=SongDetail.model_validate(song))


@router.get("", response_model=list[SongOut])
def list_songs():
    return [SongOut.model_validate(s) for s in get_songs()]


@router.get("/{song_id}", response_model=SongDetail)
def get_song_detail(song_id: int):
    song = get_song(song_id)
    if not song:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chanson introuvable")
    return SongDetail.model_validate(song)


@router.put("/{song_id}/tags", response_model=SongDetail)
def update_song_tags(song_id: int, body: SetTagsRequest):
    song = set_song_tags(song_id, body.tag_ids)
    if not song:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chanson introuvable")
    return SongDetail.model_validate(song)


@router.delete("/{song_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_song(song_id: int):
    if not delete_song(song_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chanson introuvable")
