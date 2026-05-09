from urllib.parse import urlparse
from fastapi import APIRouter, HTTPException, status
from ..schemas import ScrapeRequest, ScrapeResponse, SongDetail, SongOut
from ..crud import get_songs, get_song, get_song_by_url, create_song, delete_song
from ..scraper.fetcher import fetch_page
from ..scraper.parser import parse_song
from ..scraper.exceptions import ScrapeError, ParseError

router = APIRouter()


def _validate_url(url: str) -> None:
    parsed = urlparse(url)
    host = parsed.netloc.replace("www.", "")
    if host != "boiteachansons.net":
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="URL invalide — doit être depuis boiteachansons.net",
        )


@router.post("/scrape", response_model=ScrapeResponse, status_code=status.HTTP_201_CREATED)
def scrape_song(body: ScrapeRequest):
    _validate_url(body.url)

    existing = get_song_by_url(body.url)
    if existing:
        return ScrapeResponse(song=SongDetail.model_validate(existing), already_existed=True)

    try:
        html, canonical_url = fetch_page(body.url)
    except ScrapeError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))

    existing = get_song_by_url(canonical_url)
    if existing:
        return ScrapeResponse(song=SongDetail.model_validate(existing), already_existed=True)

    try:
        data = parse_song(html, canonical_url)
    except ParseError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))

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


@router.delete("/{song_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_song(song_id: int):
    if not delete_song(song_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chanson introuvable")
