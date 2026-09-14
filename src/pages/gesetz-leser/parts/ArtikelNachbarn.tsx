import { SUCH_META } from '../suchHighlight';
import type { ArtikelNachbarn, NachbarZiel } from '../v3/nachbarArtikel';

// ═══ W2·5m · DIE NACHBAR-PFEILE IM ARTIKELKOPF ══════════════════════════════
//
// «‹ Art. 89» links, «Art. 90a ›» rechts, beide in der Kopfzeile des Artikels,
// rechtsbündig als eine Einheit. Reine Darstellung (§3): WELCHE Artikel die
// Nachbarn sind, entscheidet `../v3/nachbarArtikel.ts`; diese Datei entscheidet
// nur, wie sie aussehen.
//
// ─── ECHTE `<a href>`, KEIN KNOPF ───────────────────────────────────────────
// Der Leser soll den Nachbarn in einem neuen Reiter öffnen, seine Adresse
// kopieren und ihn im zweiten Fenster aufschlagen können (`onClickCapture` der
// Lesespalte greift nur in `.lr-notiz`/`.lr7-bez-block[data-reg="r"]`, hier also
// nicht — der Klick blättert im selben Dokument, wie der Anker an der
// Artikelnummer daneben). Ein `<button>` mit `scrollIntoView` könnte nichts
// davon und bräuchte dafür eigenen Zustand.
//
// ─── DER LEERE NACHBAR IST EIN LEERES ELEMENT, KEIN GRAUER PFEIL ────────────
// Am ersten und am letzten Eintrag des Erlasses steht auf der betroffenen Seite
// NICHTS — kein ausgegrautes «‹», kein `href="#"`, kein `aria-disabled`. Ein
// Bedienelement, das nicht bedient werden kann, ist eine Einladung ins Leere
// (Design-Grundlage Kap. 6). Gleiche Auflösung wie die Erlass-Navigation am
// Fuss der Lesespalte, die dort seit jeher `<span />` statt eines toten Links
// setzt (`../v3/LeserLesespalte.tsx`, `<nav aria-label="Weitere Erlasse">`) —
// und derselbe Grund, warum ein Erlass mit genau EINEM Eintrag gar keine
// Nachbarzeile bekommt.
//
// ─── `data-such-meta` IST PFLICHT, NICHT ZIERDE ─────────────────────────────
// B1 (Bug-Check 4.8.2026): der Such-Walker malt Treffer über JEDEN Textknoten
// der Lesespalte, den er nicht ausdrücklich überspringt. «Art. 89» in dieser
// Zeile ist aber keine Fundstelle im Wortlaut, sondern Bedienung — eine Suche
// nach «89» zählte sonst an jedem Nachbarn eine Stelle mehr, als der Zähler
// nennt, und «gemalte ≤ gezählte» wäre nicht mehr haltbar. Das Attribut lässt
// den Walker den ganzen Teilbaum verwerfen (`../suchHighlight.ts`, Z. 225) —
// dieselbe Kennung, die «· aufgehoben» eine Zeile weiter oben schon trägt.
// Genau darum ist die Zeile auch KEINE Wiederholung der 2026 gelöschten
// Aktionen-Kopfzeile (D35-F1): sie trägt keine Bedienwörter, sondern zwei
// Artikelnamen, und sie steht dauerhaft da statt unter `opacity-0`.

function Pfeil({ ziel, richtung }: { ziel: NachbarZiel; richtung: 'vor' | 'nach' }) {
  const wort = richtung === 'vor' ? 'Voriger Artikel' : 'Nächster Artikel';
  return (
    <a
      href={`#art-${ziel.token}`}
      data-nachbar={richtung}
      // WCAG 4.1.2 · der zugängliche Name benennt Richtung UND Ziel, nicht das
      // Zeichen. Der Aufhebungs-Zustand steht darin, weil er vor dem Sprung
      // bekannt sein muss (§8) — im Bild sagt ihn der Artikel selbst an.
      aria-label={`${wort}: ${ziel.label}${ziel.aufgehoben ? ' (aufgehoben)' : ''}`}
      className={`num inline-flex items-baseline gap-1 whitespace-nowrap text-micro no-underline hover:text-brass-700 ${
        ziel.aufgehoben ? 'text-ink-400' : 'text-ink-500'}`}>
      {richtung === 'vor' && <span aria-hidden>‹</span>}
      <span aria-hidden>{ziel.label}</span>
      {richtung === 'nach' && <span aria-hidden>›</span>}
    </a>
  );
}

/** Die Zeile selbst. Ohne beide Nachbarn (Erlass mit einem Eintrag) fällt sie weg. */
export function ArtikelNachbarn({ nachbarn }: { nachbarn: ArtikelNachbarn }) {
  if (!nachbarn.vor && !nachbarn.nach) return null;
  return (
    <span
      {...{ [SUCH_META]: '' }}
      data-artikel-nachbarn
      // `ml-auto` schiebt die Einheit an das rechte Ende der Kopfzeile, die als
      // `flex flex-wrap` gesetzt ist: auf schmalen Fenstern rutscht sie auf eine
      // eigene Zeile unter die Artikelnummer statt sie zu quetschen.
      className="ml-auto inline-flex shrink-0 items-baseline gap-3">
      {nachbarn.vor && <Pfeil ziel={nachbarn.vor} richtung="vor" />}
      {nachbarn.nach && <Pfeil ziel={nachbarn.nach} richtung="nach" />}
    </span>
  );
}
