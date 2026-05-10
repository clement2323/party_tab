import type { Song, SongDetail, ScrapeResponse } from "../types/song";

const BASE = import.meta.env.VITE_API_URL ?? "/_/backend";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    // Preserve structured detail (e.g. {code, message}) as-is
    const detail = err.detail ?? "Erreur inconnue";
    const message = typeof detail === "object" ? detail.message : detail;
    const error = new Error(message) as Error & { code?: string };
    if (typeof detail === "object") error.code = detail.code;
    throw error;
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const getSongs = () => request<Song[]>("/songs");

export const getSong = (id: number) => request<SongDetail>(`/songs/${id}`);

export const scrapeSong = (url: string) =>
  request<ScrapeResponse>("/songs/scrape", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

export const songFromText = (
  text: string,
  sourceUrl: string,
  title?: string,
  artist?: string,
) =>
  request<ScrapeResponse>("/songs/from-text", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, source_url: sourceUrl, title, artist }),
  });

export const updateSong = (id: number, title: string, artist: string) =>
  request<SongDetail>(`/songs/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, artist }),
  });

export const deleteSong = (id: number) =>
  request<void>(`/songs/${id}`, { method: "DELETE" });
