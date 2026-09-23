import type { CSSProperties, MouseEvent, ReactNode } from 'react';
import { Link } from 'react-router-dom';

// ─── ListenTabelle: EINE tabellarische Erlass-/Eintrags-Liste ────────────────
//
// D24 (David 6.9.2026, Kantons-Erlassliste BS): «das hier soll tabellarisch
// aufgebaut sein sodass beide spalten jeweils zeile auf selber höhe haben».
// GEMESSEN vorher (6.9.2026, `dist`, 859 Erlasse): zwei CSS-`columns`-Fragmente,
// Zeile i links gegen rechts bis 105 px (@1440) bzw. 126 px (@1280) versetzt.
// Darum EIN Raster über beide Spalten, spaltenweise gefüllt (Leserichtung
// LM-141); `--tb-zeilen` = ceil(n/2). `<ul>` statt `<table>`: eine flache,
// leserichtige DOM-Ordnung für jede Breite, die Umschaltung ist reines CSS.
//
// W2·29-WERKBANK-KATALOGE K2 (23.9.2026, Board «Unter-Gesetze-Katalog»): die
// Tabelle trägt jetzt ALLE Erlasslisten von /gesetze — auch die früheren
// Erlass-Karten (Leitgesetze, Relevanz, Treffer, International) als Dichte
// `voll`: Kürzel in der Lesestimme mit Registermarke, Meta darf umbrechen.
// Eine Zeilen-Anatomie statt Karte + Zeile (§5/§10). CSS: `.tb-*` in index.css.
//
// Reine Darstellung (§3): kein Datenwissen, keine Logik, keine Sortierung.

/** Eine Zeile: Nummer/Kürzel · Titel · Meta. Der Aufrufer bestimmt, WAS in die
 *  Nummern-Spalte gehört (kantonal die systematische Nummer, beim Bund das
 *  Kürzel) — der Baustein setzt nur die Spur. */
export type ListenZeileDaten = {
  id: string;
  /** Erste Spalte: systematische Nummer, SR-Nr. oder Kürzel. */
  nummer?: string | null;
  /** Zweite Spalte: der volle Titel. Wird auf zwei Zeilen gekappt und steht
   *  vollständig im `title` (§8: nichts ist unerreichbar). */
  titel: string;
  /** Dritte Spalte (Artikelzahl, Jahr, SR, Stand …). */
  meta?: ReactNode;
  /** Badges vor dem Titel (aufgehoben, Sprache) — bleiben im Textfluss. */
  marken?: ReactNode;
  /** Interner Pfad; mit `extern` ein amtlicher Fremd-Link (§8). */
  href: string;
  extern?: boolean;
  onClick?: (ev: MouseEvent) => void;
};

export function ListenTabelle({
  zeilen, spaltig = true, voll = false, nrBreite, beschriftung,
}: {
  zeilen: ListenZeileDaten[];
  /** `false` = immer einspaltig (schmale Flächen, kurze Listen). */
  spaltig?: boolean;
  /** Volle Dichte (frühere Erlass-Karte): Kürzel gross mit Registermarke,
   *  Meta mit allen Angaben, immer einspaltig. */
  voll?: boolean;
  /** Breite der Nummern-Spur (CSS-Länge). Default 5.5rem trägt die
   *  systematischen Nummern; Kürzel-Listen setzen mehr. */
  nrBreite?: string;
  /** a11y-Name der Liste — nennt zugleich, was die Spalten bedeuten. */
  beschriftung: string;
}) {
  if (zeilen.length === 0) return null;
  const zweispaltig = spaltig && !voll;
  // Bei ungerader Zahl bekommt die linke Spalte die eine mehr.
  const stil = {
    '--tb-zeilen': zweispaltig ? Math.ceil(zeilen.length / 2) : zeilen.length,
    ...(nrBreite ? { '--tb-nr': nrBreite } : {}),
  } as CSSProperties;
  return (
    <div className={`tb-huelle${voll ? ' tb-voll' : ''}`}>
      <ul className={`tb-raster${zweispaltig ? ' tb-raster-2' : ''}`} style={stil} aria-label={beschriftung}>
        {zeilen.map((z) => <ListenZeile key={z.id} z={z} />)}
      </ul>
    </div>
  );
}

function ListenZeile({ z }: { z: ListenZeileDaten }) {
  const inhalt = (
    <>
      {z.nummer && <span className="tb-nr num">{z.nummer}</span>}
      <span className="tb-titel" title={z.titel}>
        {z.marken}
        {z.titel}
      </span>
      {z.meta && <span className="tb-meta num">{z.meta}</span>}
    </>
  );
  return (
    <li className="tb-zeile">
      {z.extern ? (
        <a href={z.href} target="_blank" rel="noopener noreferrer" className="tb-link">{inhalt}</a>
      ) : (
        <Link to={z.href} onClick={z.onClick} className="tb-link">{inhalt}</Link>
      )}
    </li>
  );
}
