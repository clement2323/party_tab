import type { Tag } from "../types/song";

const BASE = import.meta.env.VITE_API_URL ?? "/_/backend";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(
      typeof err.detail === "object" ? err.detail.message : (err.detail ?? "Erreur inconnue")
    );
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const getTags = () => request<Tag[]>("/tags");

export const createTag = (name: string, color: string) =>
  request<Tag>("/tags", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, color }),
  });

export const updateTag = (id: number, name: string, color: string) =>
  request<Tag>(`/tags/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, color }),
  });

export const deleteTag = (id: number) =>
  request<void>(`/tags/${id}`, { method: "DELETE" });

export const setSongTags = (songId: number, tagIds: number[]) =>
  request<void>(`/songs/${songId}/tags`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tag_ids: tagIds }),
  });
