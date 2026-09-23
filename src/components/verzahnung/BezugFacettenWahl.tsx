// ─── B4: Facetten-STEUERUNG der Bezüge — eigenständig und umziehbar ─────────
//
// W2·7-BEZUG/B4. Die Bedien-Oberfläche der Bezugs-Facetten: Instanz-Klassen und
// (innerhalb der kantonalen Klasse) Kantone.
//
// ── WARUM DAS EINE EIGENE DATEI IST UND KEIN TEIL DES «ANSICHT ▾» ───────────
// Präzisierung David 28.7.2026: B5 baut ein EIGENES Header-Dropdown für die
// Ansichtsauswahl (Facetten + Zeitstrahl + Von-Bis-Datum); die Entscheide selbst
// bleiben unter den Artikeln. Damit dieser Umzug später NUR ein Verschieben des
// Mount-Punkts ist und kein Umbau, ist diese Komponente:
//   · VOLLSTÄNDIG GESTEUERT — sie liest keinen Store und schreibt in keinen; sie
//     bekommt den Zustand als Props und meldet Änderungen über `onKlassen`/
//     `onKantone`. Wer sie mountet, entscheidet, woher der Zustand kommt.
//   · OHNE KENNTNIS IHRER UMGEBUNG — kein Bezug auf Kopfzeile, Menü, Panel oder
//     Reader. Sie rendert einen Streifen und sonst nichts.
// Heute mountet sie `v3/PanelFilterZeile.tsx` hinter der Klappe «Instanzen»
// im Leser-Panel (H3, Kap. 4d) — bis H5 (21.8.2026) ausserdem
// `LeserAnsichtMenu` der Ist-Hülle (die vorhandene Persistenz- und
// Pre-Paint-Mechanik lag dort).
//
// STRIKT GETRENNT von der ANZEIGE-Schicht: die Kantenliste am Artikelfuss
// (`gesetz-leser/parts/BezuegeZeile.tsx`) weiss nichts von dieser Steuerung und
// umgekehrt. Sie berühren sich nur über den Zustand, den der Mount-Punkt hält.
//
// A11y wie die übrigen Streifen im Ansicht-Menü: `role="group"` +
// `aria-pressed`, KEIN `role=radiogroup`/`menu` — die versprächen eine
// Pfeiltasten-Bedienung, die es nicht gibt (Ehrlichkeits-Lehre des Dropdowns).

import { BEDIENBARE_KLASSEN, KLASSE_SCHALTER, istEingegrenzt, schalteKlasse, schalteKanton } from '../../pages/gesetz-leser/bezugAuswahl';
import { STATUS_LABEL, type BezugStatus } from '../../lib/verzahnung/facetten';
import type { BezugsBilanz, KlassenZahlen } from '../../lib/rechtsprechung/bezuege';
import { ZeichenLegende } from './ZeichenLegende';

/** Klasse ohne eine einzige Kante am gezählten Ort (seit S6-W1b: am ARTIKEL,
 *  vorher im Erlass) — bedienbar, aber sichtbar leer.
 *
 *  ── W2·19-DESIGN-KONSISTENZ · D-2: DIE SCHALTER-OPTIK IST HIER WEG ──────────
 *  Bis hierher standen drei Konstanten (`KNOPF`/`AKTIV`/`RUHIG`) mit einer
 *  eigenen Knopf-Optik. Sie sind GELÖSCHT, nicht angeglichen: die Streifen
 *  tragen jetzt die hausweite Chip-Familie `.lc-chip`/`.lc-chip-selected` in
 *  einer `.lc-chip-zeile` (§5/§10 — Konsumenten auf EINEN Baustein ziehen).
 *  Der Befund: dieselben drei Zeilen standen byte-gleich auch in
 *  `pages/gesetz-leser/v3/PanelSachgebiet.tsx` — zwei Kopien EINER Optik, und
 *  beide zeigten die Auswahl allein über eine Farbfläche, ohne das ✓-Präfix,
 *  das `.lc-chip-selected` seit LM-040/F4 trägt (F2: «Farbe nie allein»).
 *
 *  KORREKTUR EINES IRRTUMS AM SELBEN ORT: der Kommentar behauptete, die Optik
 *  «steht seither allein hier». Das war schon beim Schreiben falsch —
 *  `PanelSachgebiet` führte dieselben Zeilen unter der ausdrücklichen Ansage
 *  «wörtlich wie BezugFacettenWahl». Der Satz ist mit den Konstanten
 *  weggefallen; die Optik steht jetzt tatsächlich an EINEM Ort: `src/index.css`.
 *
 *  Die Leer-Kennzeichnung bleibt als ZUSÄTZLICHE Dämpfung auf dem Chip (nicht
 *  `disabled` — Begründung bei `schalterTitel`). Tragend ist unverändert die
 *  Zahl «0» am Schalter und der Titel, nicht die Opazität. */
const LEER = 'opacity-60';

/**
 * Der Titel eines Instanz-Schalters — die ganze Auskunft in einem Satz (B7/c, §8).
 *
 * ── DER BEFUND, DEN DAS BEHEBT ─────────────────────────────────────────────
 * David 28.7.2026 zum Schalter «Eidg.»: «das scheint keine funktion zu haben?»
 * Diagnose (reproduziert, siehe `klassenImShard` in bezuege.ts): das Prädikat
 * ist korrekt verdrahtet — die Klasse hat an fast jedem Artikel schlicht keine
 * Fundstelle. Korpusweit 164 von 75'365, an 93 von 6'217 Artikeln, in 18 von 311
 * Erlassen; an Art. 41 OR null. Es war also KEIN Bug, sondern eine
 * Bestandslage, die die Bedienfläche verschwiegen hat.
 *
 * ── ZWEI ZAHLEN, ZWEI WÖRTER (Gegenprüfung Runde 1/I1) ─────────────────────
 * Der Schalter zeigt die ENTSCHEIDE (verschiedene Dokumente), weil das die Zahl
 * ist, die man liest, wenn «Entscheide» dasteht. Die FUNDSTELLEN (Kanten) sind
 * fast immer mehr — ein BGE kann zwanzig Artikel desselben Erlasses auslegen —
 * und stehen im Titel daneben. Beides mit seinem eigenen Wort zu benennen ist
 * die Alternative dazu, eine der beiden Zahlen falsch zu beschriften: die erste
 * Fassung zeigte 10'559 «Entscheide» am BGG-bge-Schalter, während der ganze
 * Korpus 1'259 BGE führt (§8).
 *
 * NICHT DEAKTIVIERT, nur gedämpft: ein `disabled`-Schalter liesse sich nicht
 * mehr fokussieren, verschwände für Screenreader-Nutzer aus der Bedienreihe und
 * machte die 0 damit unlesbar. Wer eine leere Klasse zuschaltet, sieht am
 * Artikel dasselbe wie vorher — das ist kein Schaden, sondern die Bestätigung
 * der Auskunft.
 */
/*
 * ── S6-W1b (23.9.2026, D-9) · DIE ZAHL GILT DEM ARTIKEL ──────────────────
 * Der Absatz darüber beschreibt den Stand, an dem der Schalter die Zahl des
 * ERLASSES trug (§0 Ziff. 2b). Der Audit vom 23.9.2026 hat daran eine zweite
 * Bezugsgrösse in derselben Zeile gemessen: Schalter erlassweit, Liste darunter
 * artikelweise. Der einzige Mount-Punkt (`v3/PanelFilterZeile`) reicht seither
 * die Zahlen AM ARTIKEL herein und nennt den Ort (`zahlOrt`, «an Art. 41»). Am
 * Artikel steht jedes Dokument genau einmal — Entscheide und Fundstellen sind
 * dort dieselbe Zahl, und der Titel nennt sie darum nur einmal.
 */
function schalterTitel(k: BezugStatus, z: KlassenZahlen | undefined, bilanz: BezugsBilanz | null, zahlOrt: string): string {
  const name = STATUS_LABEL[k];
  if (!z) return name;
  if (z.dokumente > 0) return `${name} — ${z.dokumente} Entscheid(e) ${zahlOrt}`;
  const korpus = bilanz?.kantenJeStatus[k];
  const artikel = bilanz?.artikelJeStatus[k];
  if (korpus === undefined) return `${name} — keine Entscheide dieser Instanz ${zahlOrt}`;
  return `${name} — keine ${zahlOrt}. Korpusweit ${korpus} Fundstelle(n) an ${artikel ?? 0} von `
    + `${bilanz?.artikelGesamt ?? 0} Artikeln: diese Instanz trägt selten.`;
}

export function BezugFacettenWahl({ klassen, kantone, kantoneVerfuegbar, klassenZahlen, zahlOrt, bilanz = null, onKlassen, onKantone }: {
  /** Gewählte Instanz-Klassen (leer = nichts gewählt, siehe bezugAuswahl.ts). */
  klassen: readonly BezugStatus[];
  /** Gewählte Kantone; leer = keine Einschränkung. */
  kantone: readonly string[];
  /** Kantone, zu denen der GELADENE Erlass wirklich Kanten hat. Aus den Daten,
   *  nicht aus einer Kantonstabelle: ein Schalter für einen Kanton ohne Kante
   *  fände garantiert nichts (§13 F4) und behauptete, dort gäbe es Praxis, die
   *  wir bloss ausblenden (§8). Leer ⇒ kein Kanton-Streifen. */
  kantoneVerfuegbar: readonly string[];
  /** B7/c: Entscheide UND Fundstellen je Klasse am gezählten Ort (seit S6-W1b
   *  der gelesene Artikel). Leeres Objekt = Shard noch nicht geladen ⇒ es steht
   *  gar keine Zahl da, statt einer erfundenen 0. */
  klassenZahlen?: Partial<Record<BezugStatus, KlassenZahlen>>;
  /** Wo die Zahlen gelten, als Wortlaut für Titel und Hinweis («an Art. 41»). */
  zahlOrt: string;
  /** B7/c: korpusweite Bilanz für die Erklärung leerer Klassen. Optional —
   *  fehlt sie, entfällt nur der Zusatzsatz, nie die Zahl des Erlasses. */
  bilanz?: BezugsBilanz | null;
  onKlassen: (neu: BezugStatus[]) => void;
  onKantone: (neu: string[]) => void;
}) {
  const eingegrenzt = istEingegrenzt(klassen);
  const alleKantone = kantone.length === 0;
  // Solange kein Shard geladen ist, ist das Objekt leer und JEDE Klasse
  // `undefined` — dann steht keine Zahl da. Eine 0 zu zeigen, weil man noch
  // nichts weiss, wäre eine Behauptung über den Bestand (§8).
  const gezaehlt = klassenZahlen && Object.keys(klassenZahlen).length > 0;

  return (
    <>
      <div role="group" aria-label="Instanzen der Bezüge" className="lc-chip-zeile flex flex-wrap items-center gap-x-2 gap-y-1.5 px-2.5 pt-1.5 pb-0.5">
        <span className="lc-overline mr-1">Instanzen</span>
        {BEDIENBARE_KLASSEN.map((k) => {
          const aktiv = klassen.includes(k);
          const z = gezaehlt ? (klassenZahlen?.[k] ?? { dokumente: 0, kanten: 0 }) : undefined;
          const n = z?.dokumente;
          const titel = schalterTitel(k, z, bilanz, zahlOrt);
          return (
            <button key={k} type="button" aria-pressed={aktiv} aria-label={titel}
              data-bezug-klasse={k} data-bezug-klasse-zahl={n} title={titel}
              onClick={() => onKlassen(schalteKlasse(klassen, k))}
              className={`lc-chip ${aktiv ? 'lc-chip-selected' : n === 0 ? LEER : ''}`}>
              {KLASSE_SCHALTER[k]}
              {n !== undefined && (
                /* LM-051: Trenner als eigener Textknoten (sonst «BGE164» beim
                   Kopieren). ink-600 statt ink-500 — 12px-Ziffer auf --well
                   ≥4.5:1 (R4); der aktive Chip erbt brass-800. */
                <>{' '}<span className={`num ml-1 font-normal ${aktiv ? '' : 'text-ink-600'}`}>{n}</span></>
              )}
            </button>
          );
        })}
      </div>

      {/* Kantons-Feinschnitt nur, wenn die kantonale Klasse überhaupt AN ist —
          sonst wirkungslos (§13 F4, gleiches Muster wie ZeitraumWahl). */}
      {klassen.includes('kantonal') && kantoneVerfuegbar.length > 0 && (
        <div role="group" aria-label="Kantone der kantonalen Entscheide" className="lc-chip-zeile flex flex-wrap items-center gap-x-2 gap-y-1.5 px-2.5 pt-1.5 pb-0.5">
          <span className="lc-overline mr-1">Kantone</span>
          <button type="button" aria-pressed={alleKantone} onClick={() => onKantone([])}
            title="Kantonale Entscheide aus allen erfassten Kantonen zeigen"
            className={`lc-chip ${alleKantone ? 'lc-chip-selected' : ''}`}>
            alle
          </button>
          {kantoneVerfuegbar.map((k) => {
            const aktiv = kantone.includes(k);
            /* `num` entfällt: `.lc-chip` setzt die Mono-Stimme bereits (§13 e —
               Kantonskürzel sind ein Struktur-Etikett), die Zusatzklasse wäre
               eine zweite Wahrheit über dieselbe Schrift. */
            return (
              <button key={k} type="button" aria-pressed={aktiv} data-bezug-kanton={k}
                title={`Nur kantonale Entscheide aus ${k} zeigen`}
                onClick={() => onKantone(schalteKanton(kantone, k))}
                className={`lc-chip ${aktiv ? 'lc-chip-selected' : ''}`}>
                {k}
              </button>
            );
          })}
        </div>
      )}

      {/* §8: was der Grundzustand zeigt und was das Zuschalten bedeutet, steht
          da — nicht als Kleingedrucktes anderswo.

          ── W2·7-VZUI (31.8.2026): DIESER TEXT BESCHRIEB EINE OBERFLÄCHE, DIE ES
          NICHT MEHR GIBT ──────────────────────────────────────────────────────
          Bis hierher stand hier «Jede zugeschaltete Instanz steht am Artikel als
          eigene Linie … gezeigt werden fünf, ein Klick lädt die nächsten fünf»
          bzw. «Weitere Instanzen laden zusätzliche Daten nach». Beides war am
          Ist-Stand falsch, in drei Punkten, jeder einzeln nachgemessen:

           (1) AM ARTIKEL STEHT NICHTS. Die `BezuegeZeile` am Artikelfuss ist mit
               H3 aus der Lesespalte verschwunden — `LeserLesespalte.tsx:84–88`
               reicht `bezuege` nicht mehr durch («POS. 12 · KEIN `bezuege` MEHR
               AM ARTIKEL»), und seit dem H4-Flip ist die V3-Hülle die einzige
               (`GesetzLeser.tsx:83` mountet ausschliesslich `LeserRahmenV3`).
               Die Entscheide stehen im PANEL, nach Instanz gruppiert.
           (2) ES GIBT KEINE FÜNFERPORTION MEHR. `PanelEntscheide.tsx:214–218`
               listet je Gruppe vollständig; die Kappung war eine Folge der
               festen Zeilenhöhe am Artikelfuss und ist mit ihr weggefallen.
           (3) ZUSCHALTEN LÄDT NICHTS NACH. Wer diese Steuerung sieht, hat das
               Panel offen — und damit ist der Bezugs-Shard bereits geholt
               (`panelModell.usePanelBezuege`, Gate `jeGeoeffnet`). Das Umschalten
               filtert die vorhandenen Kanten, es kostet kein Byte.

          Ein Hinweistext, der dem Nutzer eine Ladefolge und einen Anzeigeort
          verspricht, die es beide nicht gibt, ist genau die Unehrlichkeit, gegen
          die §8 steht. Was der Text NICHT tut: eine Zahl nennen, die wir nicht
          haben — die Zahl am Schalter bleibt unverändert die des Erlasses.

          S6-W1b (23.9.2026): beide Sätze beschrieben den Grundzustand «nur
          Leitentscheide», die Vollliste «ohne Kappung» und die Erlass-Zahl —
          alle drei sind seit Davids Entscheid vom 23.9.2026 abgelöst (alle
          Instanzen, fünf je Gruppe, Zahl am Artikel). Neu gefasst, nicht
          ergänzt: ein Hinweis, der die Bedienung falsch beschreibt, ist kein
          Beleg, sondern ein Fehler im Produkt. */}
      <p className="px-2.5 pb-1 pt-1 text-micro leading-snug text-ink-500">
        {eingegrenzt
          ? `Eingegrenzt: nur die eingeschalteten Instanzen stehen in der Liste, jede als eigene Gruppe. Die Zahl am Schalter nennt alle Entscheide dieser Instanz ${zahlOrt} — auch ausgeblendete.`
          : `Grundeinstellung: alle Instanzen — zuerst die Leitentscheide, dann je kantonales Gericht, dann die übrigen; je Gruppe die fünf neusten, der Rest aufklappbar. Die Zahl am Schalter nennt die Entscheide dieser Instanz ${zahlOrt}.`}
      </p>

      {/* LM-050-Nachzug (W2·17-UI-BEFUNDE-B1, David-Entscheid 2.8.2026 «mach es
          still»): die Zeichenerklärung für ★/↻/⧉ stand bis hierher JE
          Bezüge-Linie am Artikel — auf /gesetze/bund/OR dadurch ~376×. Sie
          erklärt Chips, die es nur zu sehen gibt, wenn hier eine Instanz
          zugeschaltet ist — darum EIN Ort statt vieler: am Ende genau der
          Steuerung, die diese Chips überhaupt erst zuschaltet. Die Komponente
          selbst bleibt unverändert (Toggletip-Muster, Begründung dort); nur
          der Mount-Punkt hat sich verschoben. */}
      <div className="px-2.5 pb-1">
        <ZeichenLegende />
      </div>
    </>
  );
}
