import type { Song, SongDetail, ScrapeResponse } from "../types/song";

// En prod (Vercel monorepo) : même domaine, routePrefix "/_/backend"
// En dev local : http://localhost:8000 via VITE_API_URL dans .env.local
const BASE = import.meta.env.VITE_API_URL ?? "/_/backend";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Erreur inconnue");
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

export const deleteSong = (id: number) =>
  request<void>(`/songs/${id}`, { method: "DELETE" });
