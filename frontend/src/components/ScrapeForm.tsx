import { useState } from "react";
import { scrapeSong, songFromText } from "../api/songs";

interface Props {
  onSuccess: () => void;
}

export function ScrapeForm({ onSuccess }: Props) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [showPaste, setShowPaste] = useState(false);
  const [pasteText, setPasteText] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    setShowPaste(false);
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
      const e = err as Error & { code?: string };
      if (e.code === "ug_blocked") {
        setShowPaste(true);
        setError("Ultimate Guitar bloqué. Colle le texte de l'onglet ci-dessous :");
      } else {
        setError(e.message ?? "Erreur inconnue");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handlePaste(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const res = await songFromText(pasteText, url.trim());
      setInfo(`"${res.song.title}" ajoutée !`);
      setUrl("");
      setPasteText("");
      setShowPaste(false);
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="scrape-form">
      <form onSubmit={handleSubmit} style={{ display: "contents" }}>
        <input
          type="url"
          placeholder="boiteachansons.net ou ultimate-guitar.com…"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          disabled={loading}
        />
        <button type="submit" disabled={loading || !url.trim()}>
          {loading ? "…" : "Ajouter"}
        </button>
      </form>

      {showPaste && (
        <form onSubmit={handlePaste} style={{ display: "contents" }}>
          <textarea
            className="paste-area"
            placeholder="Colle ici le texte complet de la tab UG…"
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            rows={5}
            disabled={loading}
          />
          <button type="submit" disabled={loading || !pasteText.trim()}>
            {loading ? "…" : "Importer le texte"}
          </button>
        </form>
      )}

      {error && <p className="form-error">{error}</p>}
      {info && <p className="form-info">{info}</p>}
    </div>
  );
}
