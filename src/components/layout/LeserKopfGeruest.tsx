import type { ReactNode } from 'react';

// ─── B-4 (W2·19-DESIGN-KONSISTENZ, Runde 2, 31.8.2026) · EIN LESER-KOPF ──────
//
// BEFUND der Finder-Welle (Runde 1, B-4/B-7): die drei Leser der Website —
// Erlass (`gesetz-leser/parts/ErlassLeserKopf`), Entscheid (`pages/EntscheidLeser`)
// und Material (`pages/MaterialLeser`) — zeigen dieselbe Inhaltsklasse
// («ein amtliches Dokument, das ich gleich lese») und bauten ihren Kopf je
// selbst. Der Erlass-Kopf war seit S3 (Skizze Kap. 4e, Ästhetik-Urteil Ä6) nach
// ROLLE in Bänder getrennt; die beiden anderen nicht:
//
//   · EntscheidLeser trug EINE Misch-Zeile, in der Fakten (Urteilsdatum,
//     BGE-Referenz), §8-Status-Badges und vier Aktionen (Quell-Link,
//     Schriftgrösse, Zitat kopieren, Lesemodus) nebeneinander standen — genau
//     die Vermengung, die Ä6 im Erlass-Kopf aufgelöst hat.
//   · MaterialLeser lieh sich den Kopf der STATISCHEN Seiten (`layout/SeitenKopf`,
//     mit Ablesekante/`scale-rule`) — der Marker der Sekundärseiten an einem
//     Dokument-Leser.
//
// DIESES GERÜST IST DIE EINE FORM (§5/§10 — Konsumenten ziehen um, Kopien
// werden gelöscht, nicht angeglichen). Es ist die Herleitung aus dem
// Erlass-Kopf, unverändert übernommen; seine Bänder sind ROLLEN, nicht Plätze:
//
//   1  Overline    — wo kommt das her (Herkunft · Art · Sachgebiet, `KopfOverline`)
//   2  Titel       — was ist das (H1 aus `ui/SeitenTitel`, Stimme beim Aufrufer)
//   3  Fakten      — die nüchternen Identitäts-Angaben, «·»-gefügt
//   4  Stand/Ehrlichkeit — wie aktuell/belastbar ist es, und was fehlt (§8)
//   5  Aktionen    — wohin kann ich (ruhige Text-Links, keine Kästen)
//
// Reine Darstellung (§3), kein Zustand, keine Rechtslogik. Das Gerüst rendert
// den `<header>` SELBST (nicht nur Klassenzeichenketten): sonst bliebe die
// Dopplung «welches Element, welche Abstände, welche Trennlinie» an drei
// Stellen stehen und nur die Idee wäre geteilt — dieselbe Herleitung wie in
// `ui/SeitenTitel`.
//
// BYTE-BEWEIS: der Erlass-Kopf war der Kanon und rendert nach dem Umzug
// Zeichen für Zeichen dieselbe Ausgabe (gemessen 31.8.2026 über fünf Varianten
// — Bund/Kanton/aufgehoben/nicht-konsolidiert/Anhang-Dominanz; Sonde
// `src/tests/kopf-geruest-b4.test.tsx`).

/**
 * Die «·»-Fügung eines Bandes. Fehlende Glieder sind vom Aufrufer schon
 * ausgesiebt — so kann kein führender oder doppelter Trenner entstehen, wenn
 * ein Wert fehlt (Kanton ohne SR, VD-Erlasse mit leerem Stand, Entscheid ohne
 * Abteilung). Der Trenner ist `aria-hidden`: er ist Satzzeichen, keine Aussage.
 */
function Segmente({ teile }: { teile: ReactNode[] }) {
  return (
    <>
      {teile.map((t, i) => (
        <span key={i}>{i > 0 && <span className="text-ink-300" aria-hidden> · </span>}{t}</span>
      ))}
    </>
  );
}

// ─── B-7 · DIE OVERLINE-ORDNUNG ──────────────────────────────────────────────
//
// BEFUND: die Overline sagte an jedem Leser etwas anderes über dieselbe Frage
// («woher kommt das Dokument?»). Der Entscheid-Leser hatte die vollständige
// Ordnung — Gericht · Abteilung · Sachgebiet — samt Ton-Hierarchie; der
// Erlass-Kopf VERWARF sein Sachgebiet, sobald eine Art bekannt war
// (`kopfOverline`, Kanton-Zweig: `typ ?? overlineGebiet`), und zeigte damit
// ausgerechnet bei den 1'231 kantonalen Erlassen nie ihr Sachgebiet.
//
// DIE ORDNUNG IST EBENEN-NEUTRAL und hat drei Glieder in fester Reihenfolge:
//
//   herkunft    — wer/welche Ebene: «Bundesgesetz», «Kanton BS», ein Gerichtsname
//   art         — welche Sorte/Abteilung: «Gesetz», «II. zivilrechtliche Abteilung»
//   sachgebiet  — welches Rechtsgebiet
//
// UNBEKANNTE GLIEDER ENTFALLEN ERSATZLOS (§8): kein «Bereich N», kein leerer
// Platzhalter — wer nichts weiss, sagt nichts, statt etwas zu behaupten.
//
// DER TON trägt die Ordnung mit und ist die Form des Entscheid-Lesers (die
// reichere der beiden): Herkunft in der Overline-Farbe, Art gedämpft,
// Sachgebiet in Brass. Farbe trägt hier NIE allein — die Reihenfolge steht
// fest, und jedes Glied ist ausgeschriebenes Wort (DESIGN-REGLEMENT B3/F2).
type OverlineRolle = 'herkunft' | 'art' | 'sachgebiet';

export type OverlineGlied = {
  text: string;
  rolle: OverlineRolle;
  /** Erläuterung am Glied selbst (z. B. §8: «Sachgebiet maschinell zugeordnet»).
   *  NIE alleiniger Träger einer Tatsache — Touch erreicht keinen Tooltip. */
  title?: string;
};

const TON: Record<OverlineRolle, string | undefined> = {
  herkunft: undefined,
  art: 'text-ink-500',
  sachgebiet: 'text-brass-700',
};

/**
 * Der Inhalt des Overline-Bandes. Rendert die Glieder, NICHT das `<p>` —
 * das gehört dem Gerüst (sonst stünde `<p>` in `<p>`).
 */
export function KopfOverline({ glieder }: {
  glieder: ReadonlyArray<OverlineGlied | null | undefined | false>;
}) {
  const echte = glieder.filter(Boolean) as OverlineGlied[];
  return (
    <Segmente teile={echte.map((g) => (
      <span className={TON[g.rolle]} title={g.title}>{g.text}</span>
    ))} />
  );
}

export function LeserKopfGeruest({
  overline, titel, nachTitel, fakten = [], stand = [], standReserve = false,
  ehrlichkeit, aktionen, children, form = 'kopf',
}: {
  /** W2·29-WERKBANK-LESER S2 · `titelblatt` legt die Identität (Overline · Titel
   *  · Fakten) auf die Registerfläche `.lc-titelblatt-band` (index.css); Stand,
   *  Aktionen und Banner bleiben auf dem Papier. Vorgabe `kopf` = unverändert. */
  form?: 'kopf' | 'titelblatt';
  /** Band 1 — in aller Regel ein `<KopfOverline>`. */
  overline: ReactNode;
  /** Band 2 — die H1. Als Knoten, weil Stimme (Serif/Display), Umbruch-Regel und
   *  Höhen-Reservierung Aussagen des jeweiligen Lesers sind, nicht des Gerüsts. */
  titel: ReactNode;
  /** Zwischen Identität und Fakten: leserspezifische Inhalts-Bänder, die weder
   *  Fakt noch Status sind (Entscheid: Leitzeile, Herkunfts-Hinweis, Rubrum). */
  nachTitel?: ReactNode;
  /** Band 3 — nüchterne Identitäts-Angaben, «·»-gefügt. */
  fakten?: ReactNode[];
  /** Band 4a — Stand/Geltung, «·»-gefügt. Der Ziffernsatz sitzt an der ZEILE,
   *  damit er auch Daten trifft, die als fertiger String hereinkommen.
   *  R6-B (5.9.2026): als `.lc-ziffern` statt roher `tabular-nums`-Utility. */
  stand?: ReactNode[];
  /**
   * §15.2 — reservierte Höhe für Band 4. NUR dort setzen, wo die Zeilen NACH
   * dem ersten Paint wachsen (Erlass-Kopf: Currency- und Revisions-Sidecar).
   * Die Werte sind GEMESSEN kalibriert (Tokens `kopf-stand*` in
   * tailwind.config.js), nicht geschätzt; wer sie ohne asynchrone Zeile setzt,
   * reserviert Leerraum ohne Grund.
   */
  standReserve?: boolean;
  /** Band 4b — die Ehrlichkeits-Zeile (§8). Steht IMMER in derselben Zelle wie
   *  der Stand: beide beantworten «wie belastbar ist das hier?». */
  ehrlichkeit?: ReactNode;
  /** Band 5 — Aktionen. `.lc-kopf-aktionen` neutralisiert die Chip-Anatomie der
   *  Slot-Inhalte (index.css), damit Aufrufer ihre `.lc-chip`-Verträge behalten;
   *  das 44-px-Tap-Ziel bleibt dabei erhalten (F2b/a11y). */
  aktionen?: ReactNode;
  /** Nach den Bändern: Banner/Notizen am Kopfende (Aufhebungs-Banner, URL-Abdruck). */
  children?: ReactNode;
}) {
  const identitaet = (
    <>
      <p className="lc-overline">{overline}</p>
      {titel}
      {nachTitel}

      {fakten.length > 0 && (
        <p className="text-xs text-ink-500"><Segmente teile={fakten} /></p>
      )}
    </>
  );
  return (
    <header className="space-y-2 border-b border-line pb-5">
      {form === 'titelblatt'
        ? <div data-titelblatt-band className="lc-titelblatt-band space-y-2">{identitaet}</div>
        : identitaet}

      {(stand.length > 0 || ehrlichkeit) && (
        <div className={`${standReserve ? 'min-h-kopf-stand sm:min-h-kopf-stand-sm md:min-h-kopf-stand-md ' : ''}space-y-1`}>
          {stand.length > 0 && (
            <p className="text-xs leading-snug lc-ziffern text-ink-500"><Segmente teile={stand} /></p>
          )}
          {ehrlichkeit}
        </div>
      )}

      {aktionen && (
        <div className="lc-kopf-aktionen flex flex-wrap items-center gap-x-5 gap-y-0.5 text-xs">
          {aktionen}
        </div>
      )}

      {children}
    </header>
  );
}
