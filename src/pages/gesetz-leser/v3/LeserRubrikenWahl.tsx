import { FUSS_RUBRIKEN, setzeFussRubriken, type FussRubrik } from '../leserOptionen';
import { MenueGruppe, MenueSchalter, MenueTitel, MenueZeile } from '../../../components/ui/Menue';
import { bestimmungDativ, type BestimmungsWort } from './erlassAnsicht';

// ═══ W2·24-D35-F2 · «AM ARTIKEL ZEIGEN» — DIE RUBRIKEN-WAHL ═════════════════
//
// Davids Nachtrag zum Variante-A-Entscheid (7.9.2026), wörtlich: «man soll
// mittels ansicht alles einzelne abwählen können». Gemeint ist die
// Funktionszeile am Artikelende (D35-F1, `parts/Funktionszeile.tsx`): sie trägt
// links die vier Rubriken dieses Artikels mit ihren Zahlen und rechts seine
// Aktionen. Wer eine davon nicht braucht, wählt sie hier ab — Zähler UND
// Inhalt verschwinden, nicht nur der Inhalt.
//
// D40 (David 7.9.2026, «und wieso ist fassung nicht auch unten am artikel?»):
// die Liste ist um «Fassung» gewachsen — sechs Zeilen statt fünf. Herleitung an
// der Rubrik selbst, unten in `RUBRIKEN`.
//
// ── WARUM CSS UND NICHT REACT (§15) ────────────────────────────────────────
// Die Wahl landet als EIN Attribut am <html> (`data-fuss-aus`, gesetzt in
// `../leserOptionen`), und `src/index.css` blendet danach aus. Ein Abo je
// Artikel wären im OR 1686 Abonnenten und 1686 Neu-Renderings je Klick —
// dieselbe Rechnung, die schon den gemerkten Aufklapp-Zustand der Zeile
// gekippt hat (`parts/Funktionszeile.tsx`, D35-F1). Diese Datei rendert also nur
// die Schalter; sie kennt die Zeile nicht, und die Zeile kennt sie nicht.
//
// ── WARUM DAS ATTRIBUT DIE ABGEWÄHLTEN TRÄGT, NICHT DIE GEWÄHLTEN ──────────
// Der Grundzustand ist «alles steht». Trüge das Attribut die GEWÄHLTEN, müsste
// die Regel `html:not([data-fuss-an*="r"])` lauten — und die greift auch, solange
// es das Attribut noch gar nicht gibt: im prerenderten HTML, das VOR dem
// Bündel im Bild steht. Der Leser sähe für einen Moment einen Artikel ganz ohne
// Funktionszeile. Mit den ABGEWÄHLTEN ist der Grundzustand die leere
// Zeichenkette, `[data-fuss-aus*="r"]` trifft nichts, und das ausgelieferte
// Markup bleibt unberührt (R6/§6, `check:golden-normtext`).
//
// ── DIE ROLLEN SETZT DER AUFRUFER (`ui/Menue`-Vertrag) ─────────────────────
// `MenueSchalter` bringt `role="switch"` mit; hier wird daraus
// `menuitemcheckbox` — sechs unabhängige Ja/Nein-Fragen, also die Marke `kasten`
// (Vorgabe), nicht der `punkt` der Radiogruppe eine Gruppe weiter oben.

/**
 * Die sechs Rubriken in der Reihenfolge, in der sie am Artikelende stehen (§5:
 * dieselbe Ordnung wie `FUSS_RUBRIKEN` und dasselbe `data-reg` wie die
 * Funktionszeile — eine Rubrik, ein Buchstabe).
 *
 * DAS ZÄHL-SUBSTANTIV KOMMT AUS `./erlassAnsicht` (B8/C1): an einem §-Erlass
 * (BS-640.100) heisst es «zu diesem Paragraphen», und ein hier hingeschriebenes
 * «Artikel» wäre fünfmal falsch. Darum sind die Titel eine FUNKTION des Wortes
 * und keine Konstante — dieselbe Bauform wie `panelModell.reiterTitel`.
 */
const RUBRIKEN: ReadonlyArray<{ id: FussRubrik; label: string; titel: (dativ: string) => string }> = [
  {
    // ── W2·24-D40 (David 7.9.2026) · «wieso ist fassung nicht auch unten am
    // artikel?». Sie steht ZUERST, weil sie in der Zeile zuerst steht (§5:
    // dieselbe Ordnung wie `FUSS_RUBRIKEN` und die Marken) — und weil sie als
    // einzige den Artikel SELBST beschreibt, statt von ihm wegzuzeigen.
    //
    // DIESER SCHALTER ERSETZT DIE ÄNDERUNGS-WAHL NICHT. Eine Gruppe weiter oben
    // entscheidet «Fassung | Fussnoten | aus», OB es eine Fassungs-Auskunft
    // gibt; hier wird gewählt, ob sie AM ARTIKEL steht. Steht die Wahl oben auf
    // «Fussnoten» oder «aus», ist dieser Schalter wirkungslos — und das ist
    // richtig so, nicht versteckt: er sagt «am Artikel zeigen», nicht
    // «Änderungen führen» (§5/§8; die Weiche steht in `src/index.css`).
    id: 'f',
    label: 'Fassung',
    titel: (d) => `Fassungsstand und Zeitleiste zu ${d} in der Zeile am Ende zeigen`,
  },
  { id: 'r', label: 'Entscheide', titel: (d) => `Gerichtsentscheide zu ${d} in der Zeile am Ende zeigen` },
  // S6 (AN-10): der Titel versprach Botschaften — die Rubrik zeigt aber
  // Kreisschreiben, Wegleitungen und Leitfäden; Name wie der Blatt-Reiter.
  { id: 'm', label: 'Erläuterungen', titel: (d) => `Behördliche Erläuterungen (Kreisschreiben, Wegleitungen) zu ${d} in der Zeile am Ende zeigen` },
  { id: 'g', label: 'Verweise', titel: (d) => `Die in ${d} genannten Normverweise in der Zeile am Ende zeigen` },
  { id: 'w', label: 'Werkzeuge', titel: (d) => `Rechner und Vorlagen zu ${d} in der Zeile am Ende zeigen` },
  {
    id: 'a',
    label: 'Aktionen',
    // D44 (David 7.9.2026): die Zeile trug testweise einen vierten Griff
    // («⧉ Artikel daneben», Verbform «daneben stellen» in `title`/`aria-label`
    // von `../parts/ArtikelAktionen.tsx`) — ersatzlos gestrichen. Diese Gruppe
    // schaltet seither nur noch die drei verbliebenen Aktionen.
    titel: () => '«Zitat», «Link» und «Amtliche Fassung ↗» in der Zeile am Ende zeigen',
  },
];

export function LeserRubrikenWahl({ gewaehlt, bestimmungsWort }: {
  /** Der aktuelle Stand aus dem geteilten Store (`../leserOptionen`). */
  gewaehlt: readonly FussRubrik[];
  /** «Artikel» oder «Paragraphen» — durchgereicht aus der EINEN Ableitung
   *  (`./erlassAnsicht.bestimmungsWort`), nicht hier abgeleitet (§5/B8). */
  bestimmungsWort: BestimmungsWort;
}) {
  const dativ = bestimmungDativ(bestimmungsWort);
  const menge = new Set(gewaehlt);
  const alleAus = menge.size === 0;
  const schalte = (id: FussRubrik) => {
    const neu = new Set(menge);
    if (neu.has(id)) neu.delete(id);
    else neu.add(id);
    setzeFussRubriken([...neu]);
  };
  return (
    <MenueGruppe attrs={{ role: 'group', 'aria-label': `An ${dativ} zeigen` }}>
      {/* Der Gruppenkopf sagt die BEZUGSGRÖSSE — genau die Auskunft, die der
          D35-Untersuchung zufolge überall fehlte (Dopplungen D-3/D-4: «Materialien»
          hiess im Erlass-Blatt erlassweit und an der Zeile artikelscharf, ohne
          dass es irgendwo dranstand). «Am Artikel» steht hier einmal und gilt
          für alle fünf Zeilen darunter (§8). */}
      <MenueTitel>{`An ${dativ} zeigen`}</MenueTitel>
      {RUBRIKEN.map((r) => (
        <MenueSchalter
          key={r.id}
          an={menge.has(r.id)}
          label={r.label}
          titel={r.titel(dativ)}
          onKlick={() => schalte(r.id)}
          attrs={{ role: 'menuitemcheckbox', 'data-v3-fussrubrik': r.id }}
        />
      ))}
      {/* ── DER RÜCKWEG IST DIESELBE ZEILE ────────────────────────────────────
          Sechs Zeilen einzeln abzuwählen ist sechs Klicks; die Zeile hier ist
          einer. Sie ist ein `menuitem` (eine HANDLUNG), kein Schalter: ein
          siebter Kasten neben sechs Kästen läse sich als siebte Rubrik, und
          eine Rubrik ist sie nicht. Ihre Beschriftung wechselt darum mit dem
          Stand — sie sagt, was der Klick TUT, und ist so zugleich der Weg
          zurück.

          SIE RÜHRT DIE ÄNDERUNGS-WAHL NICHT AN (§7-Abweichung, offengelegt).
          Der Auftrag verlangte hier «Nur Gesetzestext» = alle Rubriken aus UND
          Vermerke aus, an einem BESTEHENDEN Menü-Eintrag. Einen solchen Eintrag
          gibt es nicht: «Nur Gesetzestext» ist im selben Menü die sichtbare
          SCOPE-Angabe des Schriftreglers (Entscheid David 5B, 29.8.2026 — «‹Nur›
          ist kein Füllwort, es ist die Abgrenzung zu ‹Ganze Seite›»). Ein
          zweites Element mit demselben Wortlaut wäre Ä114 eine Ebene tiefer:
          dieselbe Sache im selben Menü unter zwei Namen — bzw. hier zwei Sachen
          unter einem. Und eine Zeile INNERHALB der Gruppe «An diesem …» (Gruppenkopf),
          die still eine Radiogruppe eine Gruppe weiter oben umlegt, wäre genau
          die versteckte Nebenwirkung, gegen die der Gruppenkopf steht (§8).
          Die Änderungs-Wahl trägt ihre eigene Stellung «aus» — «nur der
          Gesetzestext» kostet damit zwei Klicks statt einem. */}
      <MenueZeile
        label={alleAus ? 'Alles zeigen' : 'Alles ausblenden'}
        titel={alleAus
          ? 'Alle sechs Rubriken der Zeile am Ende wieder einblenden'
          : 'Alle sechs Rubriken der Zeile am Ende ausblenden — die Zeile verschwindet dann ganz'}
        onKlick={() => setzeFussRubriken(alleAus ? FUSS_RUBRIKEN : [])}
        attrs={{ role: 'menuitem', 'data-v3-fussrubriken-alle': alleAus ? 'an' : 'aus' }}
      />
    </MenueGruppe>
  );
}
