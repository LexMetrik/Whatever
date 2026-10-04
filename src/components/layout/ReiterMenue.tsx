import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { MenueTitel, MenueZeile } from '../ui/Menue';
import { useDialogFokus } from './useDialogFokus';

// ═══ M4 · DAS KONTEXTMENÜ EINES REITERS (Prüfbefund R11 #35, 6.9.2026) ══════
//
// GEMESSEN am Stand `2a18f97bb`: Rechtsklick auf einen Reiter ergab
// `[role=menu]` = 0, vorher wie nachher; am Reiter hing kein `oncontextmenu`.
// Für die Kanzlei-Praxis ist das der teuerste der zehn Befunde: nach einer
// halben Stunde Recherche stehen neun Reiter, davon sechs Sackgassen — und der
// einzige Weg dahin war neun einzelne ✕ oder «Alle schliessen», also alles
// oder nichts.
//
// DIESE DATEI IST NUR DIE FLÄCHE. Was die Einträge TUN, entscheidet die
// Reiterleiste und rechnet `lib/tabs` aus (§3: keine Reiter-Mechanik in der
// Darstellung, §5: eine Quelle für die Liste). Hier stehen Position,
// Fokus-Verhalten und die ARIA-Rollen.
//
// WARUM HIER `role="menu"` STEHT, in `ui/Menue.tsx` aber nicht: der Baustein
// erklärt es selbst — «die Rollen setzt der Aufrufer, passend zu dem, was er
// wirklich einlöst». `role=menu` verspricht Pfeiltasten-Bedienung. Dieses Menü
// löst das Versprechen ein (↑/↓, Home/End unten), die Popover des Lesers tun
// es nicht; darum trägt es die Rolle und jene nicht.

export interface ReiterMenueEintrag {
  id: string;
  label: string;
  /** Kleine Zusatzangabe am Zeilenende (Kürzel wie «Alt+Shift+T»). */
  rechts?: string;
  onKlick: () => void;
}

/** Abstand, den das Menü zum Fensterrand hält, wenn es dort anstösst. */
const RAND = 8;

export function ReiterMenue({ x, y, name, eintraege, onSchliessen }: {
  /** Zeigerposition des Rechtsklicks (bzw. linke obere Ecke des Reiters bei
   *  Tastatur-Aufruf über Shift+F10 / die Menü-Taste). */
  x: number;
  y: number;
  /** Kurzform des Reiters — Titelzeile des Menüs, damit bei mehreren Reitern
   *  klar ist, WELCHER gemeint ist. */
  name: string;
  eintraege: ReiterMenueEintrag[];
  onSchliessen: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x, y });

  // Fokus-Falle, Escape und Fokus-Rückgabe an den Reiter: dieselbe Verdrahtung
  // wie beim Überlauf-Blatt (§5 — ein Verhalten, eine Quelle).
  useDialogFokus(true, ref, onSchliessen);

  // Ins Bild rücken, BEVOR gezeichnet wird (useLayoutEffect): ein Menü, das
  // erst rechts aus dem Fenster ragt und dann springt, ist zweimal falsch.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const k = el.getBoundingClientRect();
    const maxX = window.innerWidth - k.width - RAND;
    const maxY = window.innerHeight - k.height - RAND;
    setPos({ x: Math.max(RAND, Math.min(x, maxX)), y: Math.max(RAND, Math.min(y, maxY)) });
  }, [x, y]);

  // Klick ausserhalb schliesst (mousedown, wie beim Blatt — sonst schlüge der
  // Klick zuerst auf den Reiter darunter durch).
  useEffect(() => {
    const zu = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) onSchliessen(); };
    document.addEventListener('mousedown', zu);
    return () => document.removeEventListener('mousedown', zu);
  }, [onSchliessen]);

  // ↑/↓/Home/End — das eingelöste Versprechen von `role="menu"`. Tab bleibt
  // beim Dialog-Muster (Fokus-Falle in `useDialogFokus`), Escape ebenso.
  const onKey = (e: KeyboardEvent) => {
    const zeilen = Array.from(ref.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
    if (zeilen.length === 0) return;
    const i = zeilen.indexOf(document.activeElement as HTMLElement);
    let ziel = -1;
    if (e.key === 'ArrowDown') ziel = i < 0 ? 0 : (i + 1) % zeilen.length;
    else if (e.key === 'ArrowUp') ziel = i <= 0 ? zeilen.length - 1 : i - 1;
    else if (e.key === 'Home') ziel = 0;
    else if (e.key === 'End') ziel = zeilen.length - 1;
    if (ziel < 0) return;
    e.preventDefault();
    zeilen[ziel].focus();
  };

  return createPortal(
    <div ref={ref} tabIndex={-1} role="menu" data-menue-flaeche aria-label={`Reiter «${name}»`} onKeyDown={onKey}
      style={{ left: pos.x, top: pos.y }}
      // GEMESSEN 6.9.2026 (Screen `r11-kontextmenue-1440-hell`, erster Lauf): bei
      // `w-56` (14 rem) brach «Rechts davon schliessen» auf «Rechts davon
      // schlies…» ab — die längste Zeile plus Marken-Spalte plus Zähler passt
      // nicht in 224 px. `w-64` (16 rem) trägt sie ganz; die Fläche bleibt
      // schmaler als das Überlauf-Blatt (22 rem), das eine Liste führt.
      className="lc-schwebeflaeche fixed z-overlay w-64 max-w-[calc(100vw-1rem)] p-1 focus:outline-none">
      <MenueTitel>{name}</MenueTitel>
      {eintraege.map((e) => (
        <MenueZeile key={e.id} label={e.label} rechts={e.rechts}
          attrs={{ role: 'menuitem', 'data-reiter-menue': e.id }}
          onKlick={() => { e.onKlick(); onSchliessen(); }} />
      ))}
    </div>,
    document.body,
  );
}
