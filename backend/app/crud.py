from sqlalchemy.orm import Session
from .models import Song
from .scraper.parser import SongData


def get_songs(db: Session) -> list[Song]:
    return db.query(Song).order_by(Song.scraped_at.desc()).all()


def get_song(db: Session, song_id: int) -> Song | None:
    return db.query(Song).filter(Song.id == song_id).first()


def get_song_by_url(db: Session, url: str) -> Song | None:
    return db.query(Song).filter(Song.source_url == url).first()


def create_song(db: Session, data: SongData) -> Song:
    song = Song(
        title=data.title,
        artist=data.artist,
        key=data.key,
        capo=data.capo,
        content=data.content,
        source_url=data.source_url,
    )
    db.add(song)
    db.commit()
    db.refresh(song)
    return song


def delete_song(db: Session, song_id: int) -> bool:
    song = get_song(db, song_id)
    if not song:
        return False
    db.delete(song)
    db.commit()
    return True
