import { Fragment, useState } from 'react';
import { SUCH_META } from '../suchHighlight';
import { badgesFuer, type ArtikelFundstelle, type Ausschnitt, type LeserTreffer, type SuchBereich } from '../leserSuche';
import { TrefferLeiste } from './TrefferLeiste';
import { useAnfangSlot } from './anfangSlot';
import { zaehlform, type BestimmungsWort } from './erlassAnsicht';

// ═══ Trefferliste V3 — Verzeichnis in Erlass-Reihenfolge (H2, Kap. 4b Pos. 5) ═
//
// NACHFOLGER von `parts/TrefferListe.tsx`. Der Unterschied ist nicht das
// Aussehen, sondern was die Liste IST:
//
//  V1: eine nach Relevanz gereihte Kandidatenliste. Ein Artikel = eine Zeile mit
//      EINEM Ausschnitt, egal wie oft er trifft. Die ↑↓-Navigation lief über
//      Fundstellen, die in der Liste gar nicht sichtbar waren — der Leser sah
//      «7/34» und hatte keine Möglichkeit zu wissen, was 8 sein würde.
//  V3: ein VERZEICHNIS in Erlass-Reihenfolge (S4). Jeder Artikel ist ein Kopf,
//      darunter steht JEDE seiner Fundstellen mit eigenem Kontext-Schnipsel, und
//      die laufende Stelle der ↑↓-Navigation ist genau die hervorgehobene Zeile.
//      Die Navigation ist damit nicht mehr blind: man sieht, wo man ist und was
//      als Nächstes kommt.
//
// SIE RECHNET NICHTS (§3). Reihenfolge, Zahlen, Ausschnitte und Badges kommen
// fertig aus `leserSuche.ts` (rein, unit-getestet); die Fundstellen eines
// Artikels holt sie über `fundstellenFuer` und auch das nur für aufgeklappte
// Artikel. Der Zähler bleibt DATENSEITIG (§4.4 Ziff. 1) — er zählt den Erlass,
// nicht den gemalten DOM.
//
// `data-such-meta` an der Wurzel (SUCH_META): diese Liste ist BEDIENUNG, kein
// Gesetzestext. Der Highlight-Walker überspringt solche Teilbäume vollständig,
// sonst zählte ein Begriff seine eigenen Ausschnitte mit (Bug-Check 4.8.2026).

/** Wie viele ARTIKEL-Köpfe auf einmal gemalt werden (Erbe B10, Herleitung dort). */
const TREFFER_DECKEL = 200;

/**
 * Wie viele Fundstellen-Zeilen ein aufgeklappter Artikel höchstens zeigt.
 *
 * Der Deckel je Artikel ist nötig, weil einzelne Artikel im Korpus dreistellige
 * Fundstellenzahlen tragen (OR Art. 1 auf «der»). Er ist BEWUSST klein: wer in
 * EINEM Artikel 40 Stellen hat, sucht dort nicht mehr über die Liste, sondern
 * liest. Der Kopf nennt weiter die volle Zahl, und die ↑↓-Navigation läuft
 * unverändert über alle — es verschwindet keine Information (§8).
 */
const STELLEN_DECKEL = 40;

export interface LeserTrefferListeProps {
  treffer: LeserTreffer[];
  begriff: string;
  fundstellen: number;
  /** Ä23 (H2b) · Zähl-Substantiv aus dem Datenmodell: kantonale Erlasse zählen
   *  «Paragraphen», nicht «Artikel». Es stand hier an ZWEI Stellen als Literal —
   *  gemessen 17.8.2026 an ZH-211.11: «9 Artikel · 15 Fundstellen» in einem
   *  Erlass, der durchweg «§» führt. Kein Vorgabewert: ein stiller Rückfall auf
   *  «Artikel» wäre genau der Bund-Standard, den die Erlass-Neutralität
   *  ausschliesst (Fundament-Auflage 2) — der Aufrufer MUSS sich äussern.
   *  B8 (H2b-Nachzug): Typ und Zählform kommen aus `./erlassAnsicht`, nicht mehr
   *  als Literal-Union je Datei. */
  bestimmungsWort: BestimmungsWort;
  aenderungenAus: boolean;
  /** 0-basierte laufende Fundstelle der ↑↓-Navigation; -1 = noch keine. */
  position: number;
  /** Artikel + Rang der laufenden Fundstelle — hebt GENAU EINE Zeile hervor. */
  aktivStelle: { token: string; rang: number } | null;
  bereich: SuchBereich;
  setzeBereich: (b: SuchBereich) => void;
  /** Fundstellen EINES Artikels, auf Abruf (nur für aufgeklappte Artikel). */
  fundstellenFuer: (token: string) => ArtikelFundstelle[];
  onZurueck: () => void;
  onVor: () => void;
  /** Klick auf den Artikelkopf: zur ersten Fundstelle dieses Artikels. */
  onSprung: (token: string) => void;
  /** Klick auf eine Fundstellen-Zeile: zu genau dieser Stelle. */
  onSprungStelle: (token: string, rang: number) => void;
}

/** Ein Kontext-Schnipsel mit markiertem Begriff — aus den QUELL-Strings.
 *  Nimmt den `Ausschnitt` selbst, nicht die Fundstelle drumherum: Ä17 zeigt
 *  denselben Baustein auch für den Artikel-Ausschnitt (`LeserTreffer.ausschnitt`),
 *  der zu keiner einzelnen `ArtikelFundstelle` gehört. */
function Schnipsel({ a, einzeilig = false }: { a: Ausschnitt; einzeilig?: boolean }) {
  return (
    // `[overflow-wrap:anywhere]`: echter Fliesstext-Auszug, kein kontrolliertes
    // Label — ein unbrechbares Lauftext-Fragment sprengte sonst den Scroller.
    //
    // ── Ä96 (H4-Nachzug 18.8.2026) · DER SCHNIPSEL DARF GEKÜRZT WERDEN ────────
    // `einzeilig` gilt am ARTIKELKOPF (Herleitung dort). In der aufgeklappten
    // Fundstellen-Liste NICHT: dort ist der Schnipsel die einzige Auskunft der
    // Zeile — was hier wegfiele, wäre nicht Kontext, sondern der Inhalt.
    <span className={`lc-such-ausschnitt min-w-0 flex-1 text-micro leading-snug text-ink-600 [overflow-wrap:anywhere] ${
      einzeilig ? 'line-clamp-1' : ''}`}>
      {a.vor}<mark>{a.treffer}</mark>{a.nach}
    </span>
  );
}

export function LeserTrefferListe({
  treffer, begriff, fundstellen, bestimmungsWort, aenderungenAus, position, aktivStelle,
  bereich, setzeBereich, fundstellenFuer, onZurueck, onVor, onSprung, onSprungStelle,
}: LeserTrefferListeProps) {
  // Ä94: «↑ Anfang», wenn die Leiste ihn abgegeben hat — `null`, wo sie ihn
  // selbst zeigt (Spalte) oder wo gar keine Leiste steht (Blatt am Feld).
  // Herleitung, warum ein Slot und kein Prop: `./anfangSlot`.
  const onAnfang = useAnfangSlot();
  const hatSprung = fundstellen > 0;
  // ── Ä103 (18.8.2026) · «–/88» IST KEINE AUSKUNFT ──────────────────────────
  // GEMESSEN (StPO/«Entschädigung», @390/@1440): vor dem ersten ↑↓-Sprung stand
  // «–/88» — ein Bruch ohne Zähler, @390 zweizeilig im Kasten. JETZT
  // «Fundstelle 0 von 88»; der Wert bleibt DATENSEITIG (§4.4, `leserSuche.ts`).
  const laufend = position < 0 ? 0 : position + 1;

  // Deckel und Handauf-Zustand hängen am BEGRIFF (Gültigkeits-Schlüssel): eine
  // neue Anfrage fängt wieder bei 200 an und klappt alles zu, sonst bliebe eine
  // einmal geöffnete Riesenliste für den Rest der Sitzung stehen. Der Schlüssel
  // wird beim RENDER geprüft statt in einem Effekt zurückgesetzt — kein
  // Kaskaden-Render (react-hooks/set-state-in-effect), dasselbe Muster wie in V1.
  const [gemerkt, setGemerkt] = useState<{ begriff: string; n: number; auf: string[] }>(
    { begriff, n: TREFFER_DECKEL, auf: [] });
  const gueltig = gemerkt.begriff === begriff;
  const deckel = gueltig ? gemerkt.n : TREFFER_DECKEL;
  const handAuf = gueltig ? gemerkt.auf : [];

  const sichtbar = treffer.slice(0, deckel);
  const rest = treffer.length - sichtbar.length;
  const zeilen = sichtbar.map((t, i) => ({
    t, kopf: t.gruppe !== null && t.gruppe !== (sichtbar[i - 1]?.gruppe ?? null) ? t.gruppe : null,
  }));

  const klappe = (token: string) => setGemerkt((g) => {
    const basis = g.begriff === begriff ? g : { begriff, n: TREFFER_DECKEL, auf: [] };
    return {
      ...basis, begriff,
      auf: basis.auf.includes(token) ? basis.auf.filter((x) => x !== token) : [...basis.auf, token],
    };
  });

  return (
    <div {...{ [SUCH_META]: '' }} data-treffer-liste className="pb-2">
      {/* Die klebende Werkzeugzeile (Segment · «↑ Anfang» · Zähler · ↑↓).
          Eigene Datei seit Ä103 (§6.6): sie trägt fünf gemessene Befunde
          (Ä15/Ä30/Ä84/Ä94/Ä103) mit ihren Herleitungen, und die Liste darunter
          hat mit keinem davon zu tun. */}
      <TrefferLeiste
        anzahl={treffer.length} fundstellen={fundstellen} bestimmungsWort={bestimmungsWort}
        laufend={laufend} hatSprung={hatSprung} bereich={bereich} setzeBereich={setzeBereich}
        onAnfang={onAnfang} onZurueck={onZurueck} onVor={onVor} />

      {/* §8: ehrliche Leerzeile statt eines leeren Kastens — und sie nennt den
          Bereich mit, weil sonst «nichts gefunden» die halbe Wahrheit ist.
          ── P1-4 (Bug-Check 18.8.2026) · DIE ABSAGE WIRD ANGESAGT ──────────────
          `leser-r1-r2` hat den Verlust beim H4-Flip ausdrücklich als offenen
          Befund gemeldet: die V1-Absage war eine Live-Region und wurde
          vorgelesen, diese hier nicht. Für einen blinden Leser war die Absage
          damit genauso stumm wie eine leere Liste.
          `status`, nicht `alert`: eine Auskunft, keine Störung — `alert`
          unterbräche beim Tippen jede laufende Ansage. IMMER GEMOUNTET, damit die
          Region schon dasteht, bevor sich ihr Inhalt ändert (eine erst mit dem
          Text entstehende Region überliest ein Teil der Screenreader);
          `empty:hidden` hält sie ohne Inhalt aus dem Fluss — kein Leerraum, kein
          CLS. Gleiche Fassung in `../parts/TrefferListe.tsx` (§5). */}
      <p data-treffer-leer role="status" className="px-1 py-2 text-body-s text-ink-500 empty:hidden">
        {treffer.length === 0 && (
          <>
            {/* Ä23 · zweite Stelle, an der «Artikel» hart stand. B8: die Einzahl
                kommt aus derselben `zaehlform` wie oben — hier stand sonst eine
                dritte Schreibweise derselben Regel. */}
            Kein {zaehlform(1, bestimmungsWort)} gefunden für «{begriff}»
            {bereich !== 'alles' && <> im gewählten Suchbereich</>}.
          </>
        )}
      </p>

      <ul className="space-y-0.5">
        {zeilen.map(({ t, kopf }) => {
          const badges = badgesFuer(t, aenderungenAus);
          // Aufgeklappt ist ein Artikel, wenn die laufende Fundstelle in ihm
          // liegt ODER der Leser ihn selbst geöffnet hat. Der erste Teil ist der
          // wichtige: wer ↑↓ drückt, soll die Stelle SEHEN, zu der er springt —
          // ohne ihn wäre die Hervorhebung in einem zugeklappten Ast unsichtbar.
          const aktiv = aktivStelle?.token === t.token;
          const offen = aktiv || handAuf.includes(t.token);
          const stellen = offen ? fundstellenFuer(t.token).slice(0, STELLEN_DECKEL) : [];
          return (
            <Fragment key={t.token}>
              {kopf !== null && (
                // Seit S4 (Dokument-Reihenfolge) erscheint jedes Kapitel GENAU
                // EINMAL — der Zwischenkopf ist damit das, wonach er aussieht.
                // `lc-overline` trägt die kalibrierte ink-600-Basis; ein
                // Dimm-Override wäre bei 11 px ein AA-Fail (check:design-tokens).
                // ── Ä102 (18.8.2026) · DER GLIEDERUNGSORT WIRD NICHT
                //     ANGESCHNITTEN ────────────────────────────────────────────
                // GEMESSEN @1440 UND @390: «3. TITEL: PARTEIEN UND ANDERE…» —
                // `lc-overline` (Versalien + Sperrung) unter `line-clamp-1`.
                // Zwei Fehler: (1) die Ellipse traf eine KERNAUSKUNFT — wo eine
                // Fundstelle im Gesetz liegt, ist die halbe Antwort der Suche,
                // und §8 lässt sie umbrechen, nie anschneiden (so schon Ä15/Ä96
                // hier); (2) die Overline-Rolle ist für drei, vier Wörter da,
                // nicht für einen Gliederungstitel (DESIGN-REGLEMENT A2).
                // JETZT: Normalschreibung, zwei Zeilen, kein `title`-Ersatz;
                // `aria-hidden` bleibt (die Trefferzeile trägt ihre Fundstelle).
                // `data-treffer-gruppe` als Anker: die Sonden hingen bis Ä102
                // an der Klasse `lc-overline` — also am AUSSEHEN. Genau das
                // verbietet die H2-Lehre (`data-fn-ref`): ein Wächter sucht ein
                // Element über seine Identität, sonst nimmt ihn die nächste
                // Gestaltungsänderung mit.
                <li data-treffer-gruppe aria-hidden className="px-1 pb-0.5 pt-3 text-micro font-medium leading-snug text-ink-500">
                  <span className="line-clamp-2">{kopf}</span>
                </li>
              )}
              <li data-treffer-artikel={t.token} data-fundstellen-zahl={t.fundstellen}>
                <button type="button" onClick={() => { onSprung(t.token); klappe(t.token); }}
                  data-treffer-aktiv={aktiv ? '1' : undefined}
                  aria-current={aktiv ? 'location' : undefined}
                  aria-expanded={offen}
                  className={`w-full rounded px-1.5 py-1.5 text-left transition-colors ${aktiv ? 'bg-paper-sunken/70' : 'lc-hover-flaeche'}`}>
                  {/* ── Ä10/Ä26 (H2b-Nachzug) · DAS ETIKETT SPRENGT DIE LEISTE NICHT
                      Gemessen 17.8.2026 (LugÜ, Suche «Gericht»): `shrink-0` am
                      Etikett war für «Art. 47» richtig und für Anhänge falsch —
                      «Protokoll 1 über bestimmte Zuständigkeits-, Verfahrens- und
                      Vollstreckungsfragen» ist 80 Zeichen lang und trug den
                      Scroller auf `scrollWidth` **699 px in `clientWidth` 280 px**
                      (Blatt @390 ebenso: 699/366). Der Fundstellen-Zähler rechts
                      lag damit hunderte Pixel ausserhalb des Sichtfelds — die
                      Leiste hatte einen horizontalen Scroller, den sie ausdrücklich
                      nicht haben darf (`overflow-x-hidden`, S9-Zusage).
                      JETZT: das Etikett darf schrumpfen (`min-w-0 truncate`, voller
                      Wortlaut im `title` und im Erlass selbst), der ZÄHLER behält
                      `shrink-0` und bleibt sichtbar — er ist die Auskunft, die die
                      Zeile hier gibt. Der Randtitel gibt weiterhin zuerst nach:
                      er hat `flex-1`, das Etikett nicht. */}
                  {/* ── Ä96 (H4-Nachzug 18.8.2026) · DER RANDTITEL IST KEIN BEIWERK
                      Gemessen 18.8.2026 (StPO/«Kosten», D 1440, Spalte 280 px,
                      erste acht Trefferzeilen): DREI von acht Randtiteln liefen
                      in die Ellipse — «Entschädigung der amtlichen Verteidigung»
                      244 px in 178, «Entschädigung und Kostentragung» 198 in 178,
                      «Unberechtigte Zeugnisverweigerung» 206 in 178 —, während
                      der Kontext-Schnipsel darunter über zwei bis drei Zeilen
                      lief (30–45 px, nur einer der acht einzeilig).
                      Die Zeile gab also die Höhe dem Beiwerk und schnitt die
                      Kernauskunft: der Randtitel ist die amtliche Sachüberschrift
                      der Bestimmung — er sagt, WORUM es geht, und ist damit
                      dieselbe Klasse Auskunft wie der Zähler in Ä15, den §8
                      ausdrücklich umbrechen statt anschneiden lässt. Der
                      Schnipsel dagegen IST ein Ausschnitt; ihn zu kürzen ist sein
                      Wesen, nicht sein Verlust — und wer mehr will, klappt den
                      Artikel auf und bekommt jede Fundstelle voll.
                      JETZT: Randtitel bis zwei Zeilen ohne Ellipse
                      (`line-clamp-2` fängt nur den pathologischen Fall),
                      Schnipsel einzeilig. Rechnerisch am Fall Art. 135: Titel
                      17 → 34 px, Schnipsel 45 → 15 px, Zeile netto 13 px KÜRZER
                      bei vollständigem Titel. `title` bleibt als Ergänzung, nie
                      als Ersatz (S3 «KEIN title-ERSATZ»). */}
                  <span className="flex items-baseline gap-2">
                    <span className="num min-w-0 truncate text-body-s font-semibold text-ink-800" title={t.label}>{t.label}</span>
                    {t.randtitel && (
                      <span data-treffer-randtitel className="line-clamp-2 min-w-0 flex-1 font-serif text-xs text-ink-600" title={t.randtitel}>{t.randtitel}</span>
                    )}
                    <span className="ml-auto shrink-0 text-micro lc-ziffern text-ink-500">{t.fundstellen}</span>
                  </span>
                  {/* ── Ä17 (H2b) · DER SCHNIPSEL IST ZURÜCK ────────────────────
                      Gemessen 17.8.2026: im Ruhezustand zeigte die Liste NULL
                      Kontext-Ausschnitte («Art. 47 · Kosten · 4»), V1 zeigte je
                      Zeile einen. Damit war die Liste ein Verzeichnis von
                      Nummern: man musste jeden Artikel aufklappen, um zu sehen,
                      ob er die gesuchte Stelle trägt — 49 Klicks für eine
                      Sichtprüfung, die vorher ein Blick war.
                      Gezeigt wird der Ausschnitt, den `LeserTreffer` OHNEHIN
                      trägt (`ausschnitt`, erste bzw. stärkste Fundstelle,
                      leserSuche.ts) — kein zusätzlicher Lauf, keine zweite
                      Quelle, kein Preis (§15): `fundstellenFuer` bleibt dem
                      aufgeklappten Artikel vorbehalten.
                      NUR im zugeklappten Zustand: aufgeklappt steht dieselbe
                      Stelle als Zeile mit Rang 1 darunter, und zweimal derselbe
                      Ausschnitt wäre eine Dopplung (§5). */}
                  {!offen && t.ausschnitt && (
                    <span data-treffer-schnipsel className="mt-0.5 flex">
                      <Schnipsel a={t.ausschnitt} einzeilig />
                    </span>
                  )}
                  {badges.length > 0 && (
                    // Herkunfts-Badge: SICHTBARER Text, nie nur `title` — der
                    // Leser sieht, warum der Artikel trifft, auch wenn im
                    // Wortlaut nichts leuchtet (§8).
                    <span className="mt-1 flex flex-wrap gap-1">
                      {badges.map((b) => (
                        <span key={b} data-treffer-badge
                          className="rounded border border-line px-1 text-micro leading-4 text-ink-500">{b}</span>
                      ))}
                    </span>
                  )}
                </button>
                {offen && stellen.length > 0 && (
                  // Die Fundstellen als eigene Sprungziele. Einrückung + Linie
                  // statt eines Kastens: die Liste soll ruhig bleiben (Kap. 2),
                  // und eine Kante genügt, um Zugehörigkeit zu zeigen.
                  <ul data-treffer-stellen className="ml-2 border-l border-line pl-2">
                    {stellen.map((f) => {
                      const stelleAktiv = aktiv && aktivStelle?.rang === f.rang;
                      return (
                        <li key={f.rang}>
                          <button type="button" onClick={() => onSprungStelle(t.token, f.rang)}
                            data-treffer-stelle={f.rang}
                            data-treffer-stelle-aktiv={stelleAktiv ? '1' : undefined}
                            aria-current={stelleAktiv ? 'location' : undefined}
                            className={`flex w-full items-baseline gap-1.5 rounded px-1.5 py-1 text-left transition-colors ${
                              stelleAktiv ? 'bg-brass-100/60' : 'lc-hover-flaeche'}`}>
                            <span aria-hidden className="shrink-0 text-micro lc-ziffern text-ink-400">{f.rang + 1}</span>
                            <Schnipsel a={f.ausschnitt} />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            </Fragment>
          );
        })}
      </ul>

      {rest > 0 && (
        // §8: die Zahl steht dran — der Leser weiss, dass da noch etwas ist und
        // wie viel. 44-px-Tap-Ziel wie die Navigationsknöpfe (A9-DoD).
        <button type="button" data-treffer-mehr
          onClick={() => setGemerkt((g) => ({
            begriff, n: (g.begriff === begriff ? g.n : TREFFER_DECKEL) + TREFFER_DECKEL,
            auf: g.begriff === begriff ? g.auf : [],
          }))}
          className="mt-2 flex min-h-11 w-full items-center justify-center rounded-md px-2 text-body-s text-ink-600 transition-colors lc-hover-flaeche hover:text-brass-700">
          {rest} weitere anzeigen
        </button>
      )}
    </div>
  );
}
