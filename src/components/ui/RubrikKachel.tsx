import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Register } from '../layout/bereiche';

// ─── RubrikKachel: DIE eine Einstiegs-Kachel (C-5 31.8.2026 · W2·29 K1) ──────
//
// Einstieg in eine Rubrik mit Umfangszahl und Unterzeile. C-5 (W2·19, Runde 2)
// hat zwei Bauformen hierher gezogen (Startseiten-Landkarte und /gesetze-
// Einstieg; Herleitung und aufgelöste Divergenzen: Git-Historie dieser Datei);
// G8 (6.9.2026) hat die «Öffnen →»-Zeile gestrichen — der ganze Baustein ist
// Link bzw. Knopf, eine Zier-Zeile sagte nichts dazu.
//
// W2·29-WERKBANK-KATALOGE K1 (23.9.2026, Board «Main», vier Kacheln): die
// Kachel trägt ihr Register als FLÄCHE (`--reg-*-flaeche`, F0.2 i. d. F.
// 22.9.2026) mit 2-px-Registerstrich oben — dieselbe Anatomie wie das
// Titelblatt-Band (`SeitenKopf`, Leser-S2). Auf der Fläche steht nur Tinte,
// nie die Registerfarbe als Text (F0.2: `reg-m` 4.10 / `reg-w` 4.30:1 auf der
// eigenen Fläche). Messing-Akzente (Icon-Slot, `text-brass-*`, die
// Zähler-Marke in Routenfarbe) sind entfallen.
//
// Die Kachel kennt keine Zahl (§5): Zahl, Einheit und Unterzeile kommen als
// Props vom Aufrufer (aus `STARTSEITE_ZAEHLER`). Das Register ist Pflicht —
// eine Kachel trägt nie eine geratene Farbe (§8). Reine Darstellung (§3).

/** Fläche + Strich je Register — volle Klassennamen, damit Tailwind sie findet. */
const REGISTER_KLASSE: Record<Register, string> = {
  g: 'bg-reg-g-flaeche border-reg-g',
  r: 'bg-reg-r-flaeche border-reg-r',
  m: 'bg-reg-m-flaeche border-reg-m',
  w: 'bg-reg-w-flaeche border-reg-w',
};

export function RubrikKachel({ reg, ziel, onWahl, zahl, einheit, titel, nutzen, extra }: {
  /** Register der Rubrik: Fläche und Strich (`g` Gesetze · `r` Rechtsprechung
   *  · `m` Materialien · `w` Werkzeuge). */
  reg: Register;
  /** Link-Ziel (`<Link>`). Genau eines von `ziel`/`onWahl`. */
  ziel?: string;
  /** Auswahl ohne Ortswechsel (`<button>`), z. B. die Ebenen-Wahl auf /gesetze. */
  onWahl?: () => void;
  /** Umfangszahl — nackte Zahl (C-7), bereits landesüblich formatiert. */
  zahl?: ReactNode;
  /** Was gezählt wird, im Wortlaut der Fläche («Erlasse», «Kantone», …). */
  einheit?: string;
  titel: ReactNode;
  /** Unterzeile: EIN konkreter Satz (§8: kein «geprüft», keine Floskel). */
  nutzen?: ReactNode;
  /** Zusatz unter der Unterzeile (z. B. Erfassungsgrad-Legende). */
  extra?: ReactNode;
}) {
  // `[&_.text-ink-500]:text-ink-600`: Zusatz-Tinte im `extra`-Slot hebt auf der
  // Fläche eine Stufe (ink-500 4.22:1 auf `reg-g-flaeche` < AA; S2 ③b).
  const klasse = `group flex flex-col gap-1.5 border-t-2 p-5 text-left no-underline [&_.text-ink-500]:text-ink-600 ${REGISTER_KLASSE[reg]}`;
  const inhalt = (
    <>
      {zahl !== undefined && (
        // `flex-wrap`: lange Einheiten rutschen unter die Zahl, statt die
        // Kachel zu sprengen — kurze bleiben daneben.
        <span className="flex flex-wrap items-baseline gap-2">
          <span className="num font-serif text-h1 leading-none text-ink-900">{zahl}</span>
          {einheit && <span className="text-body-s text-ink-700">{einheit}</span>}
        </span>
      )}
      <span className="font-sans font-semibold text-ink-900 text-h3 tracking-tight underline-offset-4 group-hover:underline">{titel}</span>
      {nutzen && <span className="text-body-s leading-snug text-ink-700">{nutzen}</span>}
      {extra}
    </>
  );
  return ziel !== undefined
    ? <Link to={ziel} className={klasse}>{inhalt}</Link>
    : <button type="button" onClick={onWahl} className={klasse}>{inhalt}</button>;
}
