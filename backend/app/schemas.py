from datetime import datetime
from pydantic import BaseModel, ConfigDict


class SongBase(BaseModel):
    title: str
    artist: str
    key: str | None
    capo: int = 0


class SongOut(SongBase):
    id: int
    source_url: str
    scraped_at: datetime
    # from_attributes pour ORM ; populate_by_name pour dicts Supabase
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class SongDetail(SongOut):
    content: str


class ScrapeRequest(BaseModel):
    url: str


class ScrapeResponse(BaseModel):
    song: SongDetail
    already_existed: bool = False
