from .database import get_client
from .scraper.parser import SongData

COLS_LIST = (
    "id,title,artist,key,capo,source_url,scraped_at,"
    "song_tags(tags(id,name,color))"
)
COLS_DETAIL = (
    "id,title,artist,key,capo,content,source_url,scraped_at,"
    "song_tags(tags(id,name,color))"
)


def _flatten_tags(song: dict) -> dict:
    song["tags"] = [
        st["tags"] for st in song.pop("song_tags", []) if st.get("tags")
    ]
    return song


def get_songs() -> list[dict]:
    res = (
        get_client()
        .table("songs")
        .select(COLS_LIST)
        .order("scraped_at", desc=True)
        .execute()
    )
    return [_flatten_tags(s) for s in res.data]


def get_song(song_id: int) -> dict | None:
    res = (
        get_client()
        .table("songs")
        .select(COLS_DETAIL)
        .eq("id", song_id)
        .execute()
    )
    return _flatten_tags(res.data[0]) if res.data else None


def get_song_by_url(url: str) -> dict | None:
    res = (
        get_client()
        .table("songs")
        .select(COLS_DETAIL)
        .eq("source_url", url)
        .execute()
    )
    return _flatten_tags(res.data[0]) if res.data else None


def create_song(data: SongData) -> dict:
    res = (
        get_client()
        .table("songs")
        .insert({
            "title": data.title,
            "artist": data.artist,
            "key": data.key,
            "capo": data.capo,
            "content": data.content,
            "source_url": data.source_url,
        })
        .execute()
    )
    song = res.data[0]
    song["tags"] = []
    return song


def delete_song(song_id: int) -> bool:
    res = get_client().table("songs").delete().eq("id", song_id).execute()
    return len(res.data) > 0


# ── Tags ──────────────────────────────────────────────────────────────

def get_tags() -> list[dict]:
    res = get_client().table("tags").select("id,name,color,song_tags(song_id)").execute()
    tags = []
    for t in res.data:
        t["song_count"] = len(t.pop("song_tags", []))
        tags.append(t)
    return tags


def create_tag(name: str, color: str) -> dict:
    res = get_client().table("tags").insert({"name": name, "color": color}).execute()
    t = res.data[0]
    t["song_count"] = 0
    return t


def delete_tag(tag_id: int) -> bool:
    res = get_client().table("tags").delete().eq("id", tag_id).execute()
    return len(res.data) > 0


def set_song_tags(song_id: int, tag_ids: list[int]) -> dict | None:
    client = get_client()
    client.table("song_tags").delete().eq("song_id", song_id).execute()
    if tag_ids:
        client.table("song_tags").insert(
            [{"song_id": song_id, "tag_id": tid} for tid in tag_ids]
        ).execute()
    return get_song(song_id)
