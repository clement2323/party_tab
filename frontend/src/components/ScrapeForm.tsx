import { useState } from "react";
import { scrapeSong } from "../api/songs";

interface Props {
  onSuccess: () => void;
}

export function ScrapeForm({ onSuccess }: Props) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const res = await scrapeSong(url.trim());
      if (res.already_existed) {
        setInfo(`"${res.song.title}" est déjà dans ta liste.`);
      } else {
        setInfo(`"${res.song.title}" ajoutée !`);
        setUrl("");
      }
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="scrape-form" onSubmit={handleSubmit}>
      <input
        type="url"
        placeholder="https://www.boiteachansons.net/partitions/..."
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        required
        disabled={loading}
      />
      <button type="submit" disabled={loading || !url.trim()}>
        {loading ? "..." : "Ajouter"}
      </button>
      {error && <p className="form-error">{error}</p>}
      {info && <p className="form-info">{info}</p>}
    </form>
  );
}
