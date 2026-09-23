import { QuellLink } from './QuellLink';

// ═══ «… konnte nicht geladen werden» — EIN Baustein (F2-4) ═══════════════════
//
// GEMESSEN (Design-Konsistenz Runde 2, Finder-Welle F2, 31.8.2026): dieselbe
// Auskunft — «der Abruf ist fehlgeschlagen, hier ist die amtliche Quelle» —
// stand in VIER Fundstellen und in ZWEI Optiken:
//   · `v3/PanelMaterialien:52`   «Materialien konnten nicht geladen werden.»
//     in `text-ink-500`, Link «Amtliche Fassung ↗» auf die Quelle DES ERLASSES
//   · `kontext/KontextPanel:395` «Entstehungsgeschichte konnte nicht …»
//   · `kontext/KontextPanel:446` «Änderungsverlauf konnte nicht …»
//   · `kontext/KontextPanel:521` «Gesetzgebung in Arbeit konnte nicht …»
//     je in `text-warn-700`, Link «Fedlex» (klein, ohne Pfeil) plus Schlusspunkt
//
// KANON, dreiteilig:
//   1. TON `warn-700` (3:1 im Register) — ein fehlgeschlagener Abruf ist eine
//      Störung und keine Nebenbemerkung; `ink-500` ist der Ton des ruhigen
//      Leerzustands (`ui/Leerzustand`) und sagte hier das Falsche (§8: der
//      Unterschied zwischen «nichts erfasst» und «nicht erreichbar» ist genau
//      der, den `PanelMaterialien` zwei Zeilen weiter oben selbst betont).
//   2. LINK über `ui/QuellLink` — Kanon-Name «Amtliche Fassung ↗» (Ä110,
//      Befund B-1/B-2). «Fedlex» war der Name des ANBIETERS, nicht des Ziels,
//      und trug den Pfeil nicht; der Schlusspunkt nach «↗» entfällt mit ihm.
//   3. SATZBAU «<Gegenstand> konnte(n) nicht geladen werden. Amtliche Quelle: …»
//      — wörtlich der Bestand, an allen vier Stellen identisch (§8: nichts
//      abgeschwächt, nur vereinheitlicht).
//
// Die MEHRZAHL ist eine Angabe des Aufrufers, keine Ableitung: eine Heuristik
// auf dem Gegenstandswort («endet auf -en → Plural») wäre genau die Art
// Schätzung, die §2 aus dem Haus hält — und sie läge bei «Änderungen» richtig
// und bei «Entstehungsgeschichte» falsch.
//
// Reine Darstellungsschicht (§1/§3): der Baustein weiss nicht, WARUM der Abruf
// fehlschlug, und entscheidet nichts.
export function AbrufFehler({ gegenstand, mehrzahl = false, href, linkName, onErneut, className, daten }: {
  /** Was nicht geladen werden konnte, im Nominativ und so, wie die Fläche es
   *  überschreibt («Materialien», «Änderungsverlauf»). */
  gegenstand: string;
  /** `true` = «konnten», Vorgabe «konnte». Ausdrücklich, nicht geraten. */
  mehrzahl?: boolean;
  /** Amtliche Quelle, auf die stattdessen verwiesen wird — so genau, wie der
   *  Aufrufer sie kennt (die Fassung des Erlasses, sonst das Portal).
   *  S6 (M-8/AN-4, 23.9.2026): OPTIONAL. Wo es keine EINE amtliche Quelle
   *  gibt (behördliche Erläuterungen von neun Behörden), ist ein Link auf die
   *  Fassung des Erlasses kein Ausweg, sondern ein falsches Ziel — dann endet
   *  der Satz ohne Quellenangabe. */
  href?: string;
  /** S6 · Name des Links, wenn das Ziel NICHT «die amtliche Fassung dieses
   *  Dokuments» ist (Befund M-8: «Amtliche Fassung ↗» führte am Reiter
   *  «Materialien» zum Gesetz statt zu den Materialien). Ohne Angabe der Kanon. */
  linkName?: string;
  /** S6 · «Erneut laden»: die Lader cachen einen Fehlschlag nicht; der Griff
   *  stösst sie noch einmal an. Ohne Angabe kein Knopf. */
  onErneut?: () => void;
  /** Zusätzliche Klassen des Absatzes (Polsterung, Marker-Attribute der
   *  Fläche); Ton und Schriftgrad gehören dem Baustein. */
  className?: string;
  /** Marker-Attribute der Fläche (`data-…`), an denen bestehende Sonden hängen.
   *  Sie gehören dem Aufrufer, nicht dem Baustein. */
  daten?: Record<string, string>;
}) {
  const verb = mehrzahl ? 'konnten' : 'konnte';
  return (
    <p {...daten} className={`text-body-s text-warn-700${className ? ` ${className}` : ''}`}>
      {/* EINE Zeichenkette und nicht «{gegenstand} konnte …»: `renderToString`
          setzt zwischen zwei Textknoten ein `<!-- -->`, und der Satz landet so
          zerschnitten in jeder SSR-Zeichenketten-Sonde (dieselbe Falle notiert
          `ui/QuellLink` für den Kanon-Namen). */}
      {href
        ? <>{`${gegenstand} ${verb} nicht geladen werden. Amtliche Quelle: `}<QuellLink href={href}>{linkName}</QuellLink></>
        : `${gegenstand} ${verb} nicht geladen werden.`}
      {onErneut && (
        <>{' '}<button type="button" onClick={onErneut} data-abruf-erneut
          className="lc-btn-mini text-body-s">Erneut laden</button></>
      )}
    </p>
  );
}
