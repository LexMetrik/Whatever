import { useId, useState, type ReactNode } from 'react';

// ═══ W2·5m · DAS DOSSIER UNTER DEM EINZELARTIKEL (Kap. 15.5) ════════════════
//
// D-E4 (David 14.9.2026, wörtlich): «blöcke unter dem artikel, panel im
// einzelmodus weg». Diese Datei ist die zweite GESTALT der Rubriken, die am
// Artikelende schon stehen — nicht ihre zweite Quelle.
//
// ── §5 · DIESELBEN MARKEN, EIN ANDERES BILD ────────────────────────────────
// Die Rubriken (Fassung `f` · Entscheide `r` · Materialien `m` · Verweise `g` ·
// Rechner `w`) werden an GENAU EINER Stelle gerechnet: in
// `./ArtikelLeser.bezuegeFuss.tsx`. Von dort kommen Zahl, Inhalt, Etikett und
// Ladebedarf fertig herein — diese Datei zählt nichts, lädt nichts und kennt
// keinen Shard. Sie ist zur `./Funktionszeile.tsx` das, was eine Landkarte zum
// Stadtplan ist: derselbe Bestand, anderer Massstab.
//
// WER HIER EINE `EinzelBlockEntscheide.tsx` ANLEGT, HAT DEN SCHRITT VERFEHLT
// (Kap. 15.5 wörtlich). Der Wächter dazu steht in
// `src/tests/leser-einzel-dossier-quelle.test.ts`: er liest die Importe dieser
// Datei und schlägt fehl, sobald hier ein Datenlader auftaucht.
//
// ── WARUM AKKORDEON UND NICHT «ALLES OFFEN» (B6, §15) ──────────────────────
// Die Zeile am Artikelende ist seit W2·26/Z4 ein Akkordeon: genau eine Rubrik
// offen oder keine. Das bleibt hier so, aus beiden Gründen von damals — fünf
// offene Blöcke lassen den Leser die Bestimmung aus dem Blick verlieren, und
// jeder offene Block ist eine Ladung, die niemand bestellt hat. Der Zustand ist
// darum EIN Buchstabe oder `null`: «höchstens einer offen» kann in dieser Form
// nicht verletzt werden (§6.7-Denkart).
//
// ── EINE SPALTE, NICHT ZWEI (Korrektur zu Kap. 15.3, 14.9.2026) ────────────
// Das Konzept sah «Handy eine Spalte, Desktop zwei» vor. Gebaut ist EINE Spalte
// auf jeder Breite, und der Grund liegt im Akkordeon: bei genau einem offenen
// Block bekäme der Inhalt in einem Zweispalter entweder die halbe Lesebreite
// (die Entscheid-Liste mit Regesten wird dort unlesbar) oder er bräche über
// beide Spalten — ein Sprung im Layout bei jedem Klick. Die Korrektur steht im
// Kapitel; sie ist eine Darstellungsfrage, keine Änderung am Bestand.
//
// ── WAS EIN BLOCK OHNE ZAHL TUT (B5 gegen B7, §8) ──────────────────────────
// Kap. 15.5 nennt je Block einen Klartext-Leerzustand, Kap. 15.4/B5 verlangt
// zugleich, dass ein Block ohne Inhalt NICHT als leere Karte erscheint. Beides
// zusammen geht nur, wenn man unterscheidet, WORAUS die Null kommt:
//
//   · `g` (Verweise) und `w` (Rechner) stehen aus der Struktur des Artikels
//     sofort fest. Eine Null heisst hier sicher «es gibt keine» — und genau
//     dann ist ein Satz die bessere Auskunft als ein fehlender Block
//     (`leer` an der Marke, gesetzt in `./ArtikelLeser.bezuegeFuss.tsx`).
//   · `f`, `r` und `m` hängen an Shards, die idle nachgeladen werden. Ihre
//     Null heisst VOR dem Eintreffen «ich weiss es noch nicht». Ein Satz «für
//     diesen Artikel ist keine Änderung erfasst» wäre dort eine Behauptung über
//     Daten, die noch unterwegs sind (§8) — sie erscheinen darum weiterhin erst
//     mit ihrer Zahl, wie in der Funktionszeile auch.
//
// Das ist eine offengelegte Abweichung von Kap. 15.5 und im Kapitel korrigiert.

/** Eine Rubrik: Zahl, Wort, Registerfarbe — und was sie aufklappt.
 *
 *  RÜCKBAU 2.10.2026 (W2·17-UI-BEFUNDE, Entscheid David 2.10.2026): die Rubrik
 *  `r` (Entscheide) samt `titel` und `nebenGriff` ist weg — das Dossier filterte
 *  sie seit M3 per Konstante aus, der «im Erlass-Blatt öffnen ›»-Griff war im
 *  Einzelmodus nie erreichbar (dort gibt es kein Blatt). Die Entscheide stehen im
 *  Erlass-Blatt (`../v3/PanelEntscheide.tsx`).
 *
 *  S6 W1f (24.9.2026): der Typ stand bis hierher in `./Funktionszeile.tsx`, der
 *  Zeile am Artikelende. Die Zeile ist gefallen (Entscheid David 24.9.2026,
 *  «die zeile soll ganz weg»); ihr einziger verbliebener Leser ist dieses
 *  Dossier (Einzelmodus, D-E4 unverändert) — der Typ zieht darum hierher.
 *  Die Feldkommentare unten sind Belege ihres Datums (§0 Ziff. 2b). */
export interface BezugsMarke {
  /** Registerbuchstabe: m = Materialien, g = Gesetze, w = Werkzeuge;
   *  D40 · `f` = Fassung (Farbe der Gesetze, eigener Buchstabe:
   *  er ist Schlüssel des Aufklapp-Zustands und der Menü-Wahl `data-fuss-aus` —
   *  `g` doppelt hiesse, «Verweise» abwählen nähme die Fassung mit). */
  reg: 'f' | 'm' | 'g' | 'w';
  /** Anzahl — nur echte, gezählte Werte (§8: nie geschätzt, nie erfunden). */
  anzahl: number;
  /** Einzahl/Mehrzahl des Rubriknamens. */
  wort: [einzahl: string, mehrzahl: string];
  /** W2·26/Z2 · Was die Marke ZUGEKLAPPT liest statt «n Wort» — nur die Fassung
   *  («Gilt seit 1.1.2023»); aufgeklappt steht die Zahl. Der Text kommt fertig
   *  vom Aufrufer (`../fassungsEtikett`), diese Datei formuliert nichts (§3). */
  etikett?: string;
  /** W2·5m · Klartext-Leerzustand bei `anzahl === 0`, nur wo die Null gesichert
   *  ist (Verweise, Rechner). Die Zeile hier wertet das Feld NICHT aus — sie
   *  filtert `anzahl > 0`; gelesen wird es vom Dossier (`./ArtikelDossier.tsx`). */
  leer?: string;
  /** Was beim Aufklappen GENAU DIESER Rubrik erscheint. */
  inhalt: ReactNode;
  /** Hängt der Inhalt an einem nachzuladenden Shard? Dann fragt das Aufklappen
   *  danach (`onOeffnen`) und zeigt bis dahin das Skelett. */
  brauchtDaten?: boolean;
}

/**
 * Die Reihenfolge der Blöcke — F-E1, entschieden David 14.9.2026 («ja zu allen
 * drei»): Fassung · Verweise · Entscheide · Materialien · Rechner
 * (die Entscheide sind seit dem Rückbau 2.10.2026 nicht mehr Teil des Dossiers).
 *
 * Sie folgt der juristischen Prüffolge: Was gilt seit wann · Was hängt daran ·
 * Wie wurde es angewendet · Warum steht es so da · Womit rechne ich. Sie
 * weicht bewusst von der Reihenfolge der ZEILE ab (dort `f r m g w`): die Zeile
 * ist eine Chip-Leiste, in der Zahl und Farbe führen; das Dossier ist ein
 * Prüfweg.
 */
const BLOCK_ORDNUNG: ReadonlyArray<BezugsMarke['reg']> = ['f', 'g', 'm', 'w'];

/** Registerkante des Rubrik-Griffs — dieselbe Farbe wie die Marke in der Zeile
 *  (Fassungen tragen das Gesetzes-Register). Volle Literale für Tailwind. */
const GRIFF_REGISTER: Readonly<Record<BezugsMarke['reg'], string>> = {
  f: 'border-l-reg-g', g: 'border-l-reg-g', m: 'border-l-reg-m', w: 'border-l-reg-w',
};

/** Kante des AUFGEKLAPPTEN Blocks (W2·29-WERKBANK-REST S2, 25.9.2026): die
 *  Regeln `.lr7-bez-block[data-reg…]` aus `src/index.css` stehen jetzt hier,
 *  Wert für Wert — 2 px links, 0.625 rem Einzug, Kante im Register der Rubrik;
 *  die Fassung (`f`) trug dort keine eigene Regel und bleibt `rule-soft`. Der
 *  Klassenname `lr7-bez-block` bleibt als Anker (`v3/LeserLesespalte`, Sonden). */
const BLOCK_KANTE: Readonly<Record<BezugsMarke['reg'], string>> = {
  f: 'border-l-rule-soft', g: 'border-l-reg-g', m: 'border-l-reg-m', w: 'border-l-reg-w',
};

/** Was ein Block im Titel trägt: «3 Fassungen», «6 Verweise», «1 Rechner». */
function blockTitel(m: BezugsMarke): string {
  const name = m.anzahl === 1 ? m.wort[0] : m.wort[1];
  // B5 · DIE ZAHL STEHT IM TITEL, auch bei der Fassung — dort zeigt die Zeile
  // am Artikelende zugeklappt das Etikett («Gilt seit 1.1.2023»), im Dossier
  // steht beides: die Zahl sagt, wie lang die Liste ist, das Etikett den Stand.
  // `\u00A0` (geschütztes Leerzeichen) als ESCAPE, nicht als Zeichen: ein rohes
  // U+00A0 im Quelltext ist unsichtbar und von `no-irregular-whitespace` zu
  // Recht verboten — dieselbe Schreibweise wie in `./Funktionszeile.tsx`.
  // «11» und «Entscheide» dürfen nicht umbrechen.
  return `${m.anzahl}\u00A0${name}`;
}

/** Welche Marken überhaupt einen Block bekommen — in der Prüf-Reihenfolge. */
function bloeckeAus(marken: readonly BezugsMarke[]): BezugsMarke[] {
  const nachReg = new Map(marken.map((m) => [m.reg, m]));
  const raus: BezugsMarke[] = [];
  for (const reg of BLOCK_ORDNUNG) {
    const m = nachReg.get(reg);
    if (!m) continue;
    // Eine Marke ohne Zahl steht nur, wenn ihre Null gesichert ist (s. Kopf).
    if (m.anzahl > 0 || m.leer) raus.push(m);
  }
  return raus;
}

export function ArtikelDossier({ marken, zitat, onOeffnen, laedt = false }: {
  /** Die Rubriken dieses Artikels — DIESELBEN, die die Zeile am Artikelende
   *  trägt (`./ArtikelLeser.bezuegeFuss.tsx`, §5). */
  marken: readonly BezugsMarke[];
  /** Normzitat («Art. 336c OR») für die zugänglichen Namen (WCAG 4.1.2). */
  zitat: string;
  /** Aufklappen einer Rubrik, die einen Shard braucht ⇒ Ladepfad armieren —
   *  DERSELBE Weg wie in der Zeile (`../v3/panelModell.weckeDaten`, §5/§15). */
  onOeffnen?: () => void;
  /** Der Apparat ist unterwegs ⇒ Skelett statt Leere. */
  laedt?: boolean;
}) {
  const bloecke = bloeckeAus(marken);
  // B6 · «standardmässig eingeklappt bis auf den ersten» — der erste ist die
  // Fassung, die Angabe, die ein Jurist am Artikel zuerst braucht. Solange ihr
  // Shard nicht da ist, steht sie nicht in der Liste und es ist NICHTS offen:
  // ein ersatzweise aufgeklappter anderer Block wäre eine Wahl, die niemand
  // getroffen hat. Der Zustand wird beim Artikelwechsel zurückgesetzt — die
  // Einzelansicht mountet das Dossier je Artikel neu (`key`).
  const [offen, setOffen] = useState<BezugsMarke['reg'] | null>('f');
  const blockId = useId();
  // Kein leeres Dossier (§8/B5): trägt der Artikel keine einzige Rubrik mit
  // gesicherter Auskunft, steht hier nichts — die Nachbarn-Vorschau und die
  // Pfeile stehen ohnehin ausserhalb (`../v3/LeserEinzelAnsicht.tsx`).
  if (bloecke.length === 0) return null;

  const schalte = (m: BezugsMarke) => {
    const jetzt = offen !== m.reg;
    setOffen(jetzt ? m.reg : null);
    if (jetzt && m.brauchtDaten) onOeffnen?.();
  };

  return (
    // `print:hidden`: auf dem Papier trägt der Artikel seinen Wortlaut, das
    // Dossier ist Bedienung — dieselbe Regel wie an der Funktionszeile.
    <section className="grid gap-1 border-t border-line pt-3.5 print:hidden" data-artikel-dossier
      aria-label={`Kontext zu ${zitat}`}>
      {bloecke.map((m) => {
        const auf = offen === m.reg;
        return (
          <div key={m.reg} data-dossier-reg={m.reg}>
            {/* Eine Überschrift, kein blosser Knopf: das Dossier ist eine
                gegliederte Fläche, und ein Screenreader soll sie überspringen
                und anspringen können. `h3`, weil der Artikel-Titel darüber die
                zweite Stufe ist. */}
            <h3 className="[font-size:inherit] [font-weight:inherit]">
              {/* B-K1/§5/§10 · DERSELBE KNOPF-BAUSTEIN wie die Rubrik-Griffe
                  der Funktionszeile (`lc-btn-mini`): es ist dieselbe Rolle —
                  ein Griff, der eine Rubrik dieses Artikels aufklappt. Nur die
                  Anordnung ist eine andere (volle Breite statt Chip, Komfort-
                  Tap-Höhe, Registerkante links — seit W2·29 S5 als Utilities). */}
              <button type="button" className={`lc-btn-mini min-h-[var(--tap-ziel-komfort)] w-full justify-start border-l-[3px] px-2 text-left text-body-s ${GRIFF_REGISTER[m.reg]} ${auf ? 'text-ink-900' : 'text-ink-700'} hover:text-ink-900`} data-reg={m.reg}
                aria-expanded={auf} aria-controls={auf ? `${blockId}-${m.reg}` : undefined}
                /* WCAG 4.1.2 · der Name nennt Rubrik UND Bestimmung — «3
                   Fassungen» allein ist in der Knopfliste nicht auffindbar.
                   Den Zustand trägt `aria-expanded`, nie das Wort
                   (ARIA_ZUSTANDSNAME, eslint.config.js). */
                aria-label={`${blockTitel(m)} zu ${zitat}`}
                onClick={() => schalte(m)}>
                <span aria-hidden className="inline-flex w-3 justify-center text-ink-600">{auf ? '▾' : '▸'}</span>
                <span>{blockTitel(m)}</span>
                {/* Der Stand der Fassung als ruhiger Beisatz — dieselbe
                    Zeichenkette wie an der Marke der Zeile (`../fassungsEtikett`,
                    §5), nicht eine zweite Formulierung desselben Datums. */}
                {m.etikett && <span className="text-micro text-ink-600">{m.etikett}</span>}
              </button>
            </h3>
            {auf && (
              <div id={`${blockId}-${m.reg}`} className={`lr7-bez-block mb-2 ml-3 min-w-0 border-l-2 pl-2.5 ${BLOCK_KANTE[m.reg]}`} data-reg={m.reg}>
                {m.anzahl === 0 && m.leer
                  ? <p className="text-body-s text-ink-600">{m.leer}</p>
                  : (m.brauchtDaten && laedt && !m.inhalt
                      ? (
                        <span className="lr7-bez-skelett block min-h-bez-skelett">
                          <span className="lc-overline mr-1"><span className="lc-punkt" aria-hidden />{m.wort[1]}</span>
                          <span className="text-body-s text-ink-500">lädt …</span>
                        </span>
                      )
                      : m.inhalt)}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
