export interface Tag {
  id: number;
  name: string;
  color: string;
  song_count?: number;
}

export interface Song {
  id: number;
  title: string;
  artist: string;
  key: string | null;
  capo: number;
  source_url: string;
  scraped_at: string;
  tags: Tag[];
}

export interface SongDetail extends Song {
  content: string;
}

export interface ScrapeResponse {
  song: SongDetail;
  already_existed: boolean;
}
