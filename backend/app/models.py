from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime
from .database import Base


class Song(Base):
    __tablename__ = "songs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    artist = Column(String, nullable=False)
    key = Column(String, nullable=True)
    capo = Column(Integer, default=0)
    content = Column(Text, nullable=False)
    source_url = Column(String, unique=True, nullable=False)
    scraped_at = Column(DateTime, default=datetime.utcnow)
