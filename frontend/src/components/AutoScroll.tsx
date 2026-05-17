import { useCallback, useEffect, useRef, useState } from "react";

const MIN_SPEED = 5;
const MAX_SPEED = 120;
const DEFAULT_SPEED = 30;
const STORAGE_KEY = "partoche_autoscroll_speed";

interface Props {
  resetKey: string | number;
}

export function AutoScroll({ resetKey }: Props) {
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<number>(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) && n >= MIN_SPEED && n <= MAX_SPEED ? n : DEFAULT_SPEED;
  });

  const speedRef = useRef(speed);
  const playingRef = useRef(playing);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const accRef = useRef(0);

  useEffect(() => { speedRef.current = speed; localStorage.setItem(STORAGE_KEY, String(speed)); }, [speed]);
  useEffect(() => { playingRef.current = playing; }, [playing]);

  const getContainer = useCallback((): HTMLElement | null => {
    return document.querySelector(".content");
  }, []);

  const stopLoop = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    lastTsRef.current = null;
    accRef.current = 0;
  }, []);

  const tick = useCallback((ts: number) => {
    if (!playingRef.current) { stopLoop(); return; }
    const container = getContainer();
    if (!container) { stopLoop(); return; }

    if (lastTsRef.current == null) lastTsRef.current = ts;
    const dt = (ts - lastTsRef.current) / 1000;
    lastTsRef.current = ts;

    accRef.current += dt * speedRef.current;
    const whole = Math.floor(accRef.current);
    if (whole > 0) {
      container.scrollTop += whole;
      accRef.current -= whole;
      const atBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 1;
      if (atBottom) {
        setPlaying(false);
        stopLoop();
        return;
      }
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [getContainer, stopLoop]);

  useEffect(() => {
    if (playing) {
      rafRef.current = requestAnimationFrame(tick);
      return () => stopLoop();
    }
    stopLoop();
  }, [playing, tick, stopLoop]);

  // Reset on song change
  useEffect(() => {
    setPlaying(false);
    stopLoop();
  }, [resetKey, stopLoop]);

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.code === "Space") {
        e.preventDefault();
        setPlaying((p) => !p);
      } else if (e.code === "ArrowUp") {
        e.preventDefault();
        setSpeed((s) => Math.min(MAX_SPEED, s + 5));
      } else if (e.code === "ArrowDown") {
        e.preventDefault();
        setSpeed((s) => Math.max(MIN_SPEED, s - 5));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className={`autoscroll${playing ? " playing" : ""}`}>
      <button
        className="autoscroll-btn"
        onClick={() => setPlaying((p) => !p)}
        title={playing ? "Pause (Espace)" : "Lecture (Espace)"}
        aria-label={playing ? "Pause" : "Lecture"}
      >
        {playing ? "❚❚" : "▶"}
      </button>
      <input
        className="autoscroll-slider"
        type="range"
        min={MIN_SPEED}
        max={MAX_SPEED}
        step={1}
        value={speed}
        onChange={(e) => setSpeed(Number(e.target.value))}
        title={`Vitesse : ${speed} px/s  (↑/↓ pour ajuster)`}
      />
      <span className="autoscroll-speed">{speed}</span>
    </div>
  );
}
