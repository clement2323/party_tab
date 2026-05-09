from .database import get_client
from .scraper.parser import SongData

COLS_LIST = "id,title,artist,key,capo,source_url,scraped_at"
COLS_ALL = "*"


def get_songs() -> list[dict]:
    res = get_client().table("songs").select(COLS_LIST).order("scraped_at", desc=True).execute()
    return res.data


def get_song(song_id: int) -> dict | None:
    res = get_client().table("songs").select(COLS_ALL).eq("id", song_id).execute()
    return res.data[0] if res.data else None


def get_song_by_url(url: str) -> dict | None:
    res = get_client().table("songs").select(COLS_ALL).eq("source_url", url).execute()
    return res.data[0] if res.data else None


def create_song(data: SongData) -> dict:
    res = get_client().table("songs").insert({
        "title": data.title,
        "artist": data.artist,
        "key": data.key,
        "capo": data.capo,
        "content": data.content,
        "source_url": data.source_url,
    }).execute()
    return res.data[0]


def delete_song(song_id: int) -> bool:
    res = get_client().table("songs").delete().eq("id", song_id).execute()
    return len(res.data) > 0
