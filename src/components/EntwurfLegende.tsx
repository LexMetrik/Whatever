import { useEffect, useId, useRef, useState } from 'react';
import { ENTWURF_ERKLAERUNG, ENTWURF_KURZ, ENTWURF_MARKE } from './entwurfWortlaut';

// ─── W2·10-UI-NAV/N0d·W3: Ein-Zeilen-Legende «Entwurf» am Katalog-Kopf ────────
//
// Die «Entwurf»-Badges an den Karten tragen ihre Erklärung bisher nur im
// `title` — auf Touch tot. Diese Legende steht EINMAL am Katalog-Kopf (ausserhalb
// jedes Karten-Links, darum als echter <button> zulässig) und macht die Bedeutung
// touch- UND tastaturtauglich zugänglich (Begriff.tsx-Muster: Klick/Enter-Toggle,
// Escape + Aussenklick schliessen). KEIN Status-Upgrade (Zeitsperre 1.12., §8) —
// nur die vorhandene Aussage sichtbar gemacht. Reine Darstellung (§3), nur
// existierende Tokens (§13).
export function EntwurfLegende() {
  const [offen, setOffen] = useState(false);
  const id = useId();
  const wrapRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!offen) return;
    const aufTaste = (e: KeyboardEvent) => { if (e.key === 'Escape') setOffen(false); };
    const aufKlick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOffen(false);
    };
    window.addEventListener('keydown', aufTaste);
    window.addEventListener('mousedown', aufKlick);
    return () => {
      window.removeEventListener('keydown', aufTaste);
      window.removeEventListener('mousedown', aufKlick);
    };
  }, [offen]);

  return (
    <span ref={wrapRef} className="relative inline-flex items-center gap-1.5 text-body-s text-ink-500">
      <span className="lc-badge-entwurf">{ENTWURF_MARKE}</span>
      <button
        type="button"
        aria-describedby={offen ? id : undefined}
        aria-expanded={offen}
        onClick={() => setOffen((v) => !v)}
        className="cursor-help underline decoration-dotted decoration-ink-300 underline-offset-2 hover:decoration-ink-500"
      >
        {ENTWURF_KURZ}
      </button>
      {offen && (
        <span
          role="tooltip"
          id={id}
          className="lc-popover absolute left-0 top-full z-dropdown mt-1 block w-72 max-w-[80vw] p-3 text-left text-body-s font-normal normal-case tracking-normal text-ink-700"
        >
          <span className="lc-overline mb-1 block text-warn-700">{ENTWURF_MARKE}</span>
          {ENTWURF_ERKLAERUNG}
        </span>
      )}
    </span>
  );
}

// ─── RL-12 PR 2 (R3-06): die Marke am Werkzeug-Kopf ─────────────────────────
//
// Dieselbe Aussage wie die Legende, aber STATISCH (kein Knopf, kein Popover):
// im Titelblatt-Band steht sie ausgeschrieben, damit sie auch ohne Antippen
// lesbar ist und die Knopf-Inventare der Werkzeug-Seiten (Flächen-Ratschen,
// R9-Knopf-Zählung) nicht verändert. Wortlaut aus `entwurfWortlaut` (§5).
// `flex-wrap`: bei 320 px bricht der Kurzsatz unter die Marke statt
// überzulaufen. Nur existierende Tokens (§13).
export function EntwurfHinweis() {
  return (
    <span className="inline-flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-body-s text-ink-600">
      <span className="lc-badge-entwurf">{ENTWURF_MARKE}</span>
      <span>{ENTWURF_KURZ}</span>
    </span>
  );
}
