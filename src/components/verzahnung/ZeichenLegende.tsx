import { useEffect, useId, useRef, useState } from 'react';
import { usePaneSteuerung } from '../layout/usePaneLayout';
import { GLYPH_LEGENDE, REZEPT } from './statusRezept';

// ─── ZeichenLegende — sichtbare Erklärung der Chip-Glyphen (LM-050) ──────────
//
// W2·17-UI-BEFUNDE-B1. An den Entscheid-Chips der Bezüge-Zeile stehen bis zu
// drei unbeschriftete Zeichen (★ hinter der Zitierung, ↻ dahinter, ⧉ daneben).
// aria-label/title tragen die Erklärung zwar bereits — aber `title` ist auf
// Touch tot und nirgends SICHTBAR (Prod-Befund: das Wort «Legende» kommt auf
// /gesetze/bund/OR nicht vor). Dieses Element schliesst genau diese Lücke nach
// dem verbindlichen Muster von FAHRPLAN-VERZAHNUNG-UI §1.7: NICHT nur `title`,
// sondern ein fokussierbarer <button> mit aria-describedby + Klick/Enter-
// Toggle, Escape und Aussenklick schliessen (Mechanik identisch zu Begriff.tsx
// — nicht Begriff selbst, weil das Glossar EINEN Begriff erklärt, hier aber
// eine Zeichen-LISTE steht).
//
// Die Texte kommen aus GLYPH_LEGENDE (statusRezept.ts) — dieselbe Quelle wie
// die aria-label/title der Glyphen selbst (§5, Magic Moment 4: textgleich).
// Der ⧉-Eintrag erscheint NUR, wenn die Nebeneinander-Buttons überhaupt
// gerendert werden (kannOeffnen, ≥lg + freie Pane-Kapazität) — eine Erklärung
// für ein unsichtbares Element wäre eine Fehlversprechung (§8).
//
// Reine Darstellung (§3), nur bestehende Tokens (§13). Kein Listener, solange
// zu (gleiches Sparsamkeits-Muster wie Begriff.tsx, §15.4).
//
// ── WARUM TOGGLETIP (role="status") UND NICHT aria-expanded ─────────────────
// Der B4-Wächter (bezuege-zeile-b4.test.tsx, David-Vorgabe 28.7.2026: die
// Auflistung steht DIREKT da, ohne Aufklapp-Zwischenzustand) verbietet JEDES
// `aria-expanded` im data-bezuege-zeile-Container — der Test bleibt unangetastet
// (§6.3). Die Legende nutzt darum das Toggletip-Muster: Button ohne
// expanded-Zustand + stets vorhandene role="status"-Live-Region, in die der
// Erklärtext beim Öffnen eingesetzt wird. Screenreader bekommen den Inhalt über
// die Live-Region angesagt (a11y-gleichwertig zur describedby-Variante); Touch
// und Tastatur bedienen denselben Button, Escape/Aussenklick schliessen.

export function ZeichenLegende({ ohneLeitentscheid = false }: {
  /** W2·17-UI-BEFUNDE (E4-B05, 1.10.2026): den ★-Eintrag weglassen, wo der
   *  Mount-Ort kein ★ zeigt. Das Panel «Entscheide» trägt es nicht (Ä106 in
   *  `v3/PanelEntscheide.tsx`: eine Marke an jeder Zeile einer Gruppe, in der
   *  alle denselben Status haben, trägt keine Auskunft) — die Legende erklärte
   *  dort ein Zeichen ohne Fundort (§8, §13 F4). Der Eintrag selbst bleibt in
   *  `GLYPH_LEGENDE`, damit ein Mount-Ort, der das ★ zeigt, ihn bekommt. */
  ohneLeitentscheid?: boolean;
} = {}) {
  const { kannOeffnen } = usePaneSteuerung();
  const [offen, setOffen] = useState(false);
  const id = useId();
  const wrapRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!offen) return;
    // E4-B04/D02 (1.10.2026): Escape schliesst ZUERST nur das Toggletip. Das Panel
    // hängt seinen Esc-Hörer ebenfalls ans window (`usePopoverAutoZu`,
    // `useDialogFokus`) — beide bedienten dasselbe Escape, und das ganze Panel
    // samt Klappen-Zustand war weg (gemessen 1280×900 und 1024×800). Der
    // Capture-Zug am window läuft VOR jedem Bubble-Hörer; `stopPropagation`
    // hält ihn davon ab. Ein zweites Escape erreicht das Panel dann normal.
    const aufTaste = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' && e.key !== 'Esc') return;
      e.stopPropagation();
      setOffen(false);
    };
    const aufKlick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOffen(false);
    };
    window.addEventListener('keydown', aufTaste, true);
    window.addEventListener('mousedown', aufKlick);
    return () => {
      window.removeEventListener('keydown', aufTaste, true);
      window.removeEventListener('mousedown', aufKlick);
    };
  }, [offen]);

  const eintraege = [
    ...GLYPH_LEGENDE.filter((e) => !(ohneLeitentscheid && e.glyph === REZEPT.leitentscheid?.glyph)),
    // ⧉ ist KEIN Kopiersymbol (Befundtext-Korrektur): es öffnet den Entscheid
    // in einer zweiten Spalte — Wortlaut wie der Button-title in BezuegeZeile.
    ...(kannOeffnen
      ? [{ glyph: '⧉', ton: 'text-ink-500', label: 'Nebeneinander öffnen', erklaerung: 'Öffnet den Entscheid in einer zweiten Spalte neben dem Gesetzestext.' }]
      : []),
  ];

  return (
    <span ref={wrapRef} className="relative inline-block self-start">
      <button
        type="button"
        aria-controls={id}
        onClick={() => setOffen((v) => !v)}
        className="relative cursor-help text-micro text-ink-500 underline decoration-dotted decoration-ink-300 underline-offset-2 hover:text-brass-700 hover:decoration-brass-500 after:absolute after:inset-x-0 after:top-1/2 after:h-[var(--tap-ziel)] after:-translate-y-1/2 after:content-['']"
      >
        Zeichenerklärung
      </button>
      {/* Live-Region IMMER im DOM (Toggletip-Muster): leer, bis geöffnet wird —
          erst dann trägt sie Karte + Inhalt und wird von Screenreadern angesagt. */}
      <span
        role="status"
        id={id}
        className={offen
          ? 'lc-popover absolute left-0 top-full z-dropdown mt-1 block w-72 max-w-[80vw] p-3 text-left text-body-s font-normal normal-case tracking-normal text-ink-700'
          : undefined}
      >
        {offen && (
          <>
            <span className="lc-overline mb-1 block text-brass-700">Zeichen an den Entscheid-Verweisen</span>
            {eintraege.map((e) => (
              <span key={e.glyph} className="mt-1 block leading-snug">
                <span aria-hidden className={`mr-1.5 ${e.ton}`}>{e.glyph}</span>
                <span className="font-medium">{e.label}</span>
                <span className="block text-ink-600">{e.erklaerung}</span>
              </span>
            ))}
          </>
        )}
      </span>
    </span>
  );
}
