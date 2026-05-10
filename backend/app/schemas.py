from datetime import datetime
from pydantic import BaseModel, ConfigDict


class TagOut(BaseModel):
    id: int
    name: str
    color: str
    song_count: int = 0
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class TagCreate(BaseModel):
    name: str
    color: str = "#89b4fa"


class TagUpdate(BaseModel):
    name: str | None = None
    color: str | None = None


class SongBase(BaseModel):
    title: str
    artist: str
    key: str | None
    capo: int = 0


class SongOut(SongBase):
    id: int
    source_url: str
    scraped_at: datetime
    tags: list[TagOut] = []
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class SongDetail(SongOut):
    content: str


class ScrapeRequest(BaseModel):
    url: str


class PasteRequest(BaseModel):
    text: str
    source_url: str = ""
    title: str | None = None
    artist: str | None = None


class ScrapeResponse(BaseModel):
    song: SongDetail
    already_existed: bool = False


class SetTagsRequest(BaseModel):
    tag_ids: list[int]
