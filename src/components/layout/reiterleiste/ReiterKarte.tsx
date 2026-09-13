import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ReiterKarteTeile } from '../../../lib/tabs';

// ═══ W2·18 WELLE 3 PUNKT 4 · DIE HOVER-KARTE EINES REITERS ══════════════════
//
// GEMESSEN am Vorstand (13.9.2026): die ganze Auskunft eines Reiters stand in
// EINEM `title` — «Obligationenrecht (OR) — Stand 02.09.2026 — gelesen bis
// Art. 336c». Der native Tooltip kann nur eine Zeile ohne Struktur: was Stand
// ist und was Lesestellung, muss man aus den «—»-Fugen erraten, und bei einer
// Vorlage steht dort zusätzlich ein ganzer Beschreibungssatz.
//
// DIESE KARTE ZEIGT DIESELBE AUSKUNFT, NUR BESCHRIFTET. Die Zerlegung kommt
// aus `lib/tabs.reiterKarteTeile` — derselben Quelle, aus der der Einzeiler
// sich zusammensetzt (§5; bewacht von `src/tests/reiter-karte.test.ts`). Hier
// stehen nur Lage, Rolle und Verhalten.
//
// WAS SIE NICHT TUT:
//  · Sie nimmt keine Klicks (`pointer-events: none`) — ein Tooltip, der den
//    Reiter darunter verdeckt, kostet mehr, als er erklärt.
//  · Sie verschiebt nichts: `position: fixed` in einem Portal am `body`, also
//    kein Platz im Fluss der Leiste (kein Layout-Shift, §15/CLS).
//  · Sie blendet nicht eigens ein: `src/index.css` setzt unter
//    `prefers-reduced-motion: reduce` global alle Übergänge auf ~0 (GEMESSEN
//    13.9.2026, §4.R2 Punkt 3). Eine zweite, karteneigene Regel wäre die
//    zweite Wahrheit (§5).
//  · Auf Touch erscheint sie gar nicht — dort gibt es kein «darüberfahren»;
//    die Entscheidung fällt am Reiter (`Reiter.tsx`, `pointerType`).

/** Abstand, den die Karte zum Fensterrand hält. Wie beim Reiter-Menü. */
const RAND = 8;

export function ReiterKarte({ x, y, teile, fenster, onSchliessen }: {
  /** Linke untere Ecke des Reiters — die Karte hängt unter ihm. */
  x: number;
  y: number;
  teile: ReiterKarteTeile;
  /** In welchem der beiden Panes der Reiter steht (§5a Ziff. 4); sonst `null`. */
  fenster: 'links' | 'rechts' | null;
  onSchliessen: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x, y });

  // Ins Bild rücken, BEVOR gezeichnet wird — dieselbe Begründung wie beim
  // Reiter-Menü: eine Karte, die erst rechts hinausragt und dann springt, ist
  // zweimal falsch.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const k = el.getBoundingClientRect();
    const maxX = window.innerWidth - k.width - RAND;
    const maxY = window.innerHeight - k.height - RAND;
    setPos({ x: Math.max(RAND, Math.min(x, maxX)), y: Math.max(RAND, Math.min(y, maxY)) });
  }, [x, y]);

  // Escape schliesst — auch dann, wenn die Karte über den Fokus gekommen ist
  // (dort gibt es kein «Zeiger verlassen»). WCAG 1.4.13 «Dismissible».
  useEffect(() => {
    const zu = (e: KeyboardEvent) => { if (e.key === 'Escape') onSchliessen(); };
    document.addEventListener('keydown', zu);
    return () => document.removeEventListener('keydown', zu);
  }, [onSchliessen]);

  const zeilen: { was: string; wert: string; num?: boolean }[] = [
    { was: 'Art', wert: `${teile.kategorie.pikto} ${teile.kategorie.label}` },
    ...(teile.stand ? [{ was: 'Stand', wert: teile.stand, num: true }] : []),
    ...(teile.datum ? [{ was: 'Entschieden', wert: teile.datum, num: true }] : []),
    ...(teile.gelesen ? [{ was: 'Gelesen bis', wert: teile.gelesen }] : []),
    ...(fenster ? [{ was: 'Fenster', wert: fenster === 'links' ? '◧ links' : '◨ rechts' }] : []),
  ];

  return createPortal(
    <div ref={ref} role="tooltip" data-reiter-karte
      style={{ left: pos.x, top: pos.y }}
      className="lc-schwebeflaeche pointer-events-none fixed z-overlay w-72 max-w-[calc(100vw-1rem)] p-2 text-body-s">
      {/* Der VOLLE Titel — genau das, was die Kurzform im Reiter weglässt.
          Bei einem Erlass ist der Verlaufstitel selbst schon ein Kürzel
          («OR»); dann steht hier der ausgeschriebene Titel aus dem Manifest,
          denn genau dieses Kürzel soll die Karte auflösen. */}
      <p className="font-medium text-ink-900">{teile.langtitel ?? teile.volltitel}</p>
      {/* Die Kurzform daneben: sie sagt, wofür das Kürzel im Reiter steht.
          Nur, wenn sie sich vom Volltitel unterscheidet — sonst stünde
          zweimal dasselbe (§8: keine Zeile ohne Auskunft). */}
      {teile.kurzform !== (teile.langtitel ?? teile.volltitel) && (
        <p className="text-ink-500">{teile.langtitel ? `${teile.volltitel} · ${teile.kurzform}` : teile.kurzform}</p>
      )}
      <dl className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-micro">
        {zeilen.map((z) => (
          <div key={z.was} className="col-span-2 grid grid-cols-subgrid">
            <dt className="text-ink-500">{z.was}</dt>
            <dd className={z.num ? 'num text-ink-900' : 'text-ink-900'}>{z.wert}</dd>
          </div>
        ))}
      </dl>
      {teile.beschreibung && (
        <p className="mt-1.5 border-t border-rule-soft pt-1.5 text-micro text-ink-600">{teile.beschreibung}</p>
      )}
    </div>,
    document.body,
  );
}
