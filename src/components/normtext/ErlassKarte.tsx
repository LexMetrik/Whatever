import type { MouseEvent, ReactNode } from 'react';
import { istLesbar, type BrowseErlass } from '../../lib/normtext/browse-typen';
import { useErlassOeffnen, istErlassOffen } from '../../lib/useErlassOeffnen';
import { werkzeugeFuerNorm } from '../../lib/normtext/werkzeuge';
import { erlassPfad } from '../../lib/normtext/erlassAdresse';
import { StandChip } from '../ui/StandChip';
import { ListenTabelle, type ListenZeileDaten } from '../ui/ListenTabelle';

// Klick-Handler für eine Erlass-Verlinkung (Punkt G): der <Link> trägt weiter den
// nackten Basispfad (SEO/Mittelklick/Cmd-Klick/Copy-Link). Nur der EINFACHE
// Linksklick wird abgefangen — und auch nur, wenn das Gesetz schon offen ist:
// dann öffnet der Hook eine neue Instanz (?r). Sonst läuft der normale
// Link-Navigate, der ohnehin den Basispfad öffnet.
function macheOeffnenHandler(
  e: BrowseErlass,
  basePath: string,
  oeffne: (ebene: string, key: string, kuerzel?: string) => void,
) {
  return (ev: MouseEvent) => {
    if (ev.defaultPrevented || ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
    if (!istErlassOffen(basePath)) return;
    ev.preventDefault();
    oeffne(e.ebene, e.key, e.kuerzel);
  };
}

// ─── Die Erlassliste von /gesetze — EINE Zeilen-Anatomie ─────────────────────
//
// D24 (David 6.9.2026) zog `ErlassZeile` und `SysZeile` auf `ui/ListenTabelle`;
// W2·29-WERKBANK-KATALOGE K2 (23.9.2026, Board «Unter-Gesetze-Katalog») zieht
// auch die Erlass-KARTE dorthin (Dichte `voll`). Was dabei fachlich bleibt:
// Verlinkung samt Zweit-Instanz-Handler, der amtliche Aussen-Link für
// `nur-live-link` (§8, «↗»), «aufgehoben»- und Sprach-Marke, SR-Nummer,
// Artikelzahl (nur > 0: kein «0 Artikel» ohne Snapshot, §8), Format-Marke
// (amtliches PDF / nur Live-Link, Wortlaut FAHRPLAN-GESETZES-UX §2 ⑦/⑧),
// Stand und die Zahl passender Werkzeuge (nur verfügbare, §8).
//
// Nummern-Spalte: kantonale «kuerzel» sind oft der ganze (bis 276 Zeichen
// lange) Titel — dort trägt die systematische Nummer die Spalte; beim Bund
// (und International) ist das Kürzel der Identitäts-Anker.

// Stand-Jahr (ISO «YYYY-…») — reine Anzeige. Sehr alte Stände (vor 1990) werden
// dezent markiert: fixe Schwelle, kein Date.now() (§2 — reine Darstellung).
const standJahr = (stand: string): string | null =>
  stand.slice(0, 4).match(/^\d{4}$/)?.[0] ?? null;

// D24: «Klammer-Nummer im Titel entfällt, da eigene Spalte». GEMESSEN 6.9.2026:
// 587 Titel enden auf eine Klammer-Zahl, in ALLEN 587 Fällen zeichengleich mit
// der SR-/Systematik-Nummer derselben Zeile. Nur dieser bewiesene
// Identitätsfall fällt — das Datum selbst bleibt (Korpus-Werkstatt, §5).
const KLAMMER_NUMMER = /\s*\(([0-9][0-9.]*)\)\s*$/;
function ohneDoppelteNummer(titel: string, nummer: string | null | undefined): string {
  const m = KLAMMER_NUMMER.exec(titel);
  if (!m || !nummer) return titel;
  const imTitel = m[1].replace(/\D/g, '');
  const inSpalte = nummer.replace(/\D/g, '');
  return imTitel && imTitel === inSpalte ? titel.slice(0, m.index) : titel;
}

function vollMeta(e: BrowseErlass, lesbar: boolean): ReactNode {
  const werkzeuge = werkzeugeFuerNorm(e.key).length;
  return (
    <>
      {e.ebene !== 'kanton' && e.sr && <span>SR {e.sr}</span>}
      {e.artikelAnzahl > 0 && <span>{e.artikelAnzahl} Artikel</span>}
      {e.status === 'pdf-embed' && <span className="lc-badge lc-badge-soft"
        title="Kein Volltext-Snapshot — die amtliche PDF-Fassung wird in der Leseansicht eingebettet.">amtliches PDF</span>}
      {e.status === 'nur-live-link' && <span className="lc-badge lc-badge-soft"
        title="Kein Volltext in LexMetrik — der Eintrag führt direkt zur amtlichen Fassung.">nur Live-Link</span>}
      <StandChip stand={e.stand} />
      {werkzeuge > 0 && (
        <span className="text-reg-w">{werkzeuge} {werkzeuge === 1 ? 'passendes Werkzeug' : 'passende Werkzeuge'}</span>
      )}
      {!lesbar && <span className="tb-extern">amtliche Fassung ↗</span>}
    </>
  );
}

function knappMeta(e: BrowseErlass, lesbar: boolean): ReactNode {
  const jahr = standJahr(e.stand);
  return (
    <>
      {e.ebene === 'kanton' ? (
        <>
          {e.artikelAnzahl > 0 && <span>{e.artikelAnzahl} Art.</span>}
          {/* Sehr alte Stände dezent (italic) statt blass — Kontrast (S10/WCAG) bleibt gewahrt. */}
          {jahr && <span className={Number(jahr) < 1990 ? 'italic' : undefined}>{jahr}</span>}
        </>
      ) : (
        e.sr && <span>SR {e.sr}</span>
      )}
      {!lesbar && <span aria-hidden className="tb-extern">↗</span>}
    </>
  );
}

/** Die Erlassliste als EINE Tabelle: Nummer/Kürzel · Titel · Meta. `voll` =
 *  alle Angaben der früheren Erlass-Karte, einspaltig. */
export function ErlassTabelle({ erlasse, voll = false, spaltig = true, beschriftung }: {
  erlasse: BrowseErlass[];
  voll?: boolean;
  /** `false` erzwingt eine Spalte (kurze Listen, enge Flächen). */
  spaltig?: boolean;
  beschriftung: string;
}) {
  // Ein Hook-Aufruf für die ganze Liste (Rules of Hooks).
  const oeffne = useErlassOeffnen();
  const zeilen: ListenZeileDaten[] = erlasse.map((e) => {
    const kanton = e.ebene === 'kanton';
    const nummer = kanton ? (e.sr ?? null) : e.kuerzel;
    const lesbar = istLesbar(e);
    let titel = ohneDoppelteNummer(e.titel, nummer);
    // Die Karte zeigte das kantonale Kürzel als Kopf; in der vollen Zeile steht
    // es in Klammern hinter dem Titel (Schreibweise wie A–Z-Register, B13).
    if (voll && kanton && e.kuerzel && e.kuerzel !== e.titel && !e.titel.includes(e.kuerzel)) titel += ` (${e.kuerzel})`;
    const basePath = erlassPfad(e);
    return {
      id: e.key,
      nummer,
      titel,
      marken: (e.aufgehoben || (voll && e.sprache !== 'de')) ? (
        <>
          {/* §8: ganz aufgehobener Erlass bleibt auffindbar, ist aber sichtbar markiert. */}
          {e.aufgehoben && <span className="lc-badge lc-badge-danger mr-1.5">aufgehoben</span>}
          {voll && e.sprache !== 'de' && <span className="lc-badge lc-badge-soft mr-1.5">{e.sprache}</span>}
        </>
      ) : undefined,
      meta: voll ? vollMeta(e, lesbar) : knappMeta(e, lesbar),
      href: lesbar ? basePath : e.quelleUrl,
      extern: !lesbar,
      onClick: lesbar ? macheOeffnenHandler(e, basePath, oeffne) : undefined,
    };
  });
  return (
    <ListenTabelle
      zeilen={zeilen}
      voll={voll}
      spaltig={spaltig}
      nrBreite={voll ? '7.5rem' : erlasse[0]?.ebene === 'kanton' ? '6.5rem' : '7rem'}
      beschriftung={beschriftung}
    />
  );
}
