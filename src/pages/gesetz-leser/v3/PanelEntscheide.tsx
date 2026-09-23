import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { datumAnzeige } from '../../../components/rechtsprechung/format';
import { KanteMitVorschau } from '../../../components/verzahnung/KanteMitVorschau';
import { GruppenKopf } from '../../../components/ui/GruppenKopf';
import {
  entscheidDatum, klassifiziereFassungsBezug, revisionFuerToken,
  type ArtikelRevision, type RevisionShard,
} from '../../../lib/verzahnung/artikel-revisionen';
import { STATUS_LABEL, type BezugStatus } from '../../../lib/verzahnung/facetten';
import type { Bezug } from '../../../lib/rechtsprechung/bezuege';
import type { Histogramm, Zeitbereich } from '../bezugZeit';
import { bestimmungDativ, type BestimmungsWort } from './erlassAnsicht';
import {
  ERSTE_PORTION, datumInZitierung, klassenZahlenAmArtikel, naechsteMenge, ordneEntscheide, regesteTeil,
  weitereText, type EntscheidGruppe,
} from './entscheideOrdnung';
import { PanelFilterZeile } from './PanelFilterZeile';
import { WEITERZUG_ERKLAERUNG, traegtWeiterzugHinweis } from './PanelEntscheideKontext';

// Befund 6b (Cowork 21.8.2026): Weiterzug-Klammerzusatz-Erklärung — Muster,
// Text und Prüf-Funktion stehen in `PanelEntscheideKontext.ts`
// (react-refresh/only-export-components, Muster wie `InhaltsKopfKontext.ts`).

// ─── Reiter «Entscheide» (FAHRPLAN-LESER-V3 Kap. 4d, H3) ─────────────────────
//
// WAS HIER AN DIE STELLE VON WAS TRITT: bis H2 stand unter JEDEM Artikel eine
// `BezuegeZeile` — je Instanz eine waagrecht scrollbare Chip-Linie (277 Z.,
// Pos. 12: «verlässt den Lesekörper»). In V3 steht der Lesetext allein, und die
// Entscheide stehen hier: an EINEM Ort, mit ihren Filtern daneben, als LISTE
// statt als Scroll-Linie.
//
// ── NACHWEISDATENBANK, NICHT VOLLTEXTSAMMLUNG (Leitsatz H3, Kap. 14) ────────
// Vorbild dejure.org (David 16.8.2026): die Zeile nennt Instanz · Datum ·
// Zitierung · Regeste-Kurzzeile und VERLINKT auf den Entscheid; sie hält keinen
// Volltext vor. Das ist für ein kleines Projekt der einzig tragfähige Weg und
// lizenzrechtlich der saubere (Blocker `§4-lizenz`).
//
// ── WARUM EINE LISTE UND KEINE CHIP-LINIE ───────────────────────────────────
// Die Linie war die richtige Form für einen Artikelfuss: sie durfte den Text
// nicht nach unten schieben, also wuchs sie nach rechts. Im Panel ist die
// senkrechte Achse frei — dort ist eine Liste ohne verstecktes Scrollen die
// ehrlichere Form (Design-Grundlage Kap. 8: «Hover/Scroll verbirgt nie
// Funktion»). Die Regeste-Kurzzeile, die in der Linie nur als Tooltip lebte,
// steht hier sichtbar.
//
// ── GRUPPIERT NACH INSTANZ, WIE AM ARTIKELFUSS ──────────────────────────────
// `facetten.ts`: «Wer die drei in EINE Liste kippt und nur nach Datum sortiert,
// behauptet stillschweigend Gleichrang.» Die Gruppierung ist darum dieselbe
// (`gruppiereKanten`, `STATUS_RANG`) — sie ist eine fachliche Aussage über
// Rangordnung, keine Layout-Vorliebe (§1).
//
// S6-W1b (Entscheid David 23.9.2026): die Gruppen sind seither feiner und
// anders gereiht — BGE, dann JE kantonales Gericht, dann der Rest (übrige BGer,
// eidg. Gerichte); gemischt wird weiterhin nie. Ordnung und Portion:
// `./entscheideOrdnung`.
//
// ── DIE FILTER STEHEN, WO IHR ERGEBNIS STEHT (Kap. 4d) ──────────────────────
// `BezugFacettenWahl` und `BezugZeitWahl` sind UNVERÄNDERT dieselben
// vollständig gesteuerten Komponenten, die in der Ist-Hülle im Dropdown
// «Rechtsprechung ▾» hängen. H3 verschiebt ihren MOUNT-PUNKT — genau das, was
// ihr Dateikopf seit B4 verspricht («B5 mountet dieselbe Datei im Header»). Kein
// Umbau, keine Kopie, ein Zustand (§5).
//
// Ä54 (H3-Nachzug): der Mount-Punkt ist jetzt `./PanelFilterZeile` — EINE Zeile
// mit zwei benannten Klappen statt vier gestapelter Steuer-Blöcke (348 px
// gemessen). Die geteilten Bausteine selbst sind dabei nicht angefasst worden.

/**
 * Eine Fundstelle: Zitierung · Datum · Regeste-Kurzzeile, verlinkt auf den
 * Entscheid. `?norm=` trägt die Fundstellen-Absicht — das Ziel springt zur
 * ersten Erwägung, die diese Norm zitiert (dieselbe Zusage wie am Artikelfuss).
 *
 * ── Ä106 (Live-Ästhetik-Prüfung 18.8.2026) · DAS ★ IST GESTRICHEN ───────────
 *
 * GEMESSEN am Live-Stand (StPO Art. 429, Reiter «Entscheide»): unter der
 * Overline «LEITENTSCHEIDE 25» trugen ALLE 25 Zeilen ein ★ — fünfundzwanzig
 * Zeichen für eine Auskunft, die der Gruppenkopf zwei Zeilen darüber einmal
 * gibt. Die Marke war als Auszeichnung IN einer gemischten Liste gedacht
 * («und nur als EIN Zusatz», Dichte-Regel); gemischte Listen gibt es hier aber
 * nicht: `gruppiereKanten` (`./panelModell`) legt je Status eine eigene Gruppe
 * an — innerhalb einer Gruppe haben ausnahmslos alle Einträge denselben Status.
 * Das ★ konnte also NIE etwas unterscheiden. Design-Grundlage Kap. 6 nennt
 * genau das die Icon-Flut: ein Zeichen, das an jedem Element steht, trägt keine
 * Information mehr.
 *
 * Die Auskunft bleibt vollständig (§8): der Gruppenkopf nennt die Klasse im
 * Wort («Leitentscheide») UND die Zahl — eine Marke, eine Zahl, wie es der
 * Prüfbefund verlangt.
 *
 * WÄRE die Gruppierung je aufgehoben (eine Liste über alle Instanzen), gehörte
 * die Marke zurück — dann trüge sie wieder einen Unterschied. Sie steht in der
 * Historie dieser Datei, nicht in einer toten Bedingung (§17: gestrichen statt
 * bewacht).
 *
 * ── §7b-DECKUNGSLÜCKE GESCHLOSSEN (21.8.2026, Kontaktbogen H4 §7b Pos. 3/5,
 *    Optik-Entscheid David 21.8.2026 nach Drei-Varianten-Vergleich) ─────────
 *
 * Bis hierhin war die Zeile ein blosser `<Link>` — kein Kurztext-Popover, kein
 * ⧉-Einstieg, kein ↻. Alle drei trägt bereits `KanteMitVorschau` (`W2·10-UI-NAV`,
 * bisher nur an der V1a-Leitfall-Zeile und den B4/B7-Bezüge-Linien gemountet,
 * §5: EIN Bauteil statt einer dritten Kopie):
 *   · Kurztext-Popover auf Hover/Fokus/↓, Esc schliesst (deckt
 *     `leitfaelle-chips.e2e.ts` Fall (d), s. `leser-v3-panel-kurztext.e2e.ts`).
 *   · ⧉ «nebeneinander öffnen» am Chip (Pane-Gating via `usePaneSteuerung`) —
 *     derselbe Einstieg, den `druck-fundstellen-z2.e2e.ts` für den
 *     Split-Ausdruck braucht (V3-Fall in derselben Datei).
 *   · ↻-Badge («Norm seit dem Entscheid revidiert») via `revidiertFuer` unten
 *     (deckt `normrevision-badge.e2e.ts`, s. `leser-v3-panel-revision-badge.e2e.ts`).
 * Das Datum wandert in den `sublabel`-Slot des Chips (`KantenChip` kennt genau
 * diesen Platz bereits, §5 — kein zweiter Anzeige-Pfad).
 *
 * DAVID-VORGABE 21.8.2026 (wörtlich, nach Vorlage dreier Varianten): «man soll
 * regeste direkt lesen können, damit man weiss um was der entscheid geht» —
 * die Regeste steht darum ZUSÄTZLICH zum Chip als eigene, lesbare Zeile
 * (`text-body-s`/14px, NICHT `text-micro` — Davids ausdrücklicher Einwand
 * gegen eine Kompakt-Variante mit Mikroschrift) direkt darunter, zweizeilig
 * gedeckelt (`line-clamp-2`). Das Popover bleibt VERTIEFUNG für den
 * ungekürzten Text, nie der einzige Zugang. Quelle ausschliesslich
 * `regesteKurz` aus dem Shard — nichts generiert (§2).
 */
function Fundstelle({ b, normZitat, statusLabel, revidiert }: {
  b: Bezug; normZitat: string; statusLabel: string; revidiert: ArtikelRevision | null;
}) {
  // S6-W1b · E-8: trägt die Zitierung ihr Datum schon («… vom 12.12.2025»),
  // steht es nicht noch einmal als Unterzeile. B-2/E-6: ein führendes
  // Teil-Kennzeichen wird benannt statt nackt gesetzt (Herleitung an den
  // Funktionen in `./entscheideOrdnung`).
  const regeste = b.regesteKurz ? regesteTeil(b.regesteKurz) : null;
  return (
    <li data-v3-panel-entscheid={b.key} className="border-l-2 border-t border-line border-l-reg-r py-2 pl-2.5">
      <KanteMitVorschau
        ziel={`/rechtsprechung/${encodeURIComponent(b.key)}?norm=${encodeURIComponent(normZitat)}`}
        zitierung={b.zitierung}
        sublabel={datumInZitierung(b.zitierung) ? undefined : datumAnzeige(b.datum)}
        kurztext={b.regesteKurz}
        statusLabel={statusLabel}
        revidiert={revidiert} />
      {regeste && (
        <p className="mt-1 text-body-s leading-snug text-ink-700 line-clamp-2">
          {regeste.teil && <span data-v3-panel-regeste-teil={regeste.teil} className="text-ink-600">{`Regeste ${regeste.teil}: `}</span>}
          {regeste.rest}
        </p>
      )}
    </li>
  );
}

/**
 * EINE Gruppe des Reiters mit ihrer Portion (S6-W1b, Entscheid David 23.9.2026
 * und D-4). Der Stand «wie viele sichtbar» ist Blick-Zustand, kein gemerkter
 * (Begründung in `bezugPortion.ts`, «WARUM DER STAND NICHT PERSISTIERT WIRD»);
 * der Aufrufer setzt ihn per `key` beim Artikelwechsel zurück.
 *
 * FOKUS (WCAG 2.4.3): nach dem Klick springt der Fokus auf den ersten neu
 * sichtbaren Eintrag — beim letzten Schritt verschwindet der Knopf, und der
 * Fokus fiele sonst ins Nichts.
 */
function Gruppe({ g, artikelLabel, bestimmungsWort, normZitat, aktArtikel, revisionShard }: {
  g: EntscheidGruppe; artikelLabel: string | null; bestimmungsWort: BestimmungsWort; normZitat: string;
  aktArtikel: string | null; revisionShard: RevisionShard | null;
}) {
  const [sichtbar, setSichtbar] = useState(Math.min(ERSTE_PORTION, g.liste.length));
  const listeRef = useRef<HTMLUListElement>(null);
  const fokusAb = useRef<number | null>(null);
  useEffect(() => {
    const ab = fokusAb.current;
    if (ab == null) return;
    fokusAb.current = null;
    listeRef.current?.children[ab]?.querySelector<HTMLElement>('a[href]')?.focus();
  }, [sichtbar]);
  const offen = g.liste.length - sichtbar;
  const statusLabel = STATUS_LABEL[g.status];
  return (
    <section data-v3-panel-gruppe={g.status} data-v3-panel-gericht={g.gericht ?? undefined} className="pt-2 first:pt-1">
      {/* B3-1 (R3-β): dichte Gestalt des EINEN Gruppenkopfs
          (`ui/GruppenKopf`). Der Weiterzugs-Hinweis ist die `marke` am
          ZEILENENDE — Befund 6b: EIN Hinweis je Gruppe, nicht je Zeile
          (Ä106). Sein `normal-case` bleibt (anders als am Zähler ist es
          dort NICHT tot: `text-transform: uppercase` bildet «ⓘ»
          U+24D8 auf «Ⓘ» U+24BE ab). Die Zahl ist die GANZE Gruppe — was
          davon noch aussteht, sagt der Knopf am Ende (eine Zahl je Aussage). */}
      <GruppenKopf
        als="p" dicht
        title={`${g.gericht ? g.titel : statusLabel} — ${g.liste.length} Fundstelle(n) an ${artikelLabel ?? bestimmungDativ(bestimmungsWort)}`}
        titel={g.titel}
        zahl={g.liste.length}
        markeStellung="rechts"
        marke={traegtWeiterzugHinweis(g.liste) ? (
          <span aria-label={WEITERZUG_ERKLAERUNG} title={WEITERZUG_ERKLAERUNG}
            className="ml-1 normal-case font-normal text-ink-400">ⓘ</span>
        ) : undefined}
      />
      <ul ref={listeRef} className="mt-0.5">
        {g.liste.slice(0, sichtbar).map((b) => (
          <Fundstelle key={b.key} b={b} normZitat={normZitat} statusLabel={statusLabel}
            revidiert={revidiertFuer(b, aktArtikel, revisionShard)} />
        ))}
      </ul>
      {offen > 0 && (
        <button type="button" data-v3-panel-weitere={g.id}
          onClick={() => { fokusAb.current = sichtbar; setSichtbar(naechsteMenge(sichtbar, g.liste.length)); }}
          aria-label={`${weitereText(sichtbar, g.liste.length)} — ${g.titel} anzeigen`}
          className="lc-btn-ghost lc-btn-sm mt-1 min-h-11 text-ink-700">
          {weitereText(sichtbar, g.liste.length)}
        </button>
      )}
    </section>
  );
}

/** §V1c-Klassifikation EINER Kante, gegen den bereits feststehenden Artikel
 *  des Panels — kein `viaArtikel`-Aggregat nötig (Herleitung Kontaktbogen H4
 *  §7b): das V3-Panel ist ohnehin je EINEN Artikel gescopet (Dateikopf), der
 *  Artikel-Token steht also schon fest, bevor die Klassifikation beginnt. */
function revidiertFuer(b: Bezug, artikel: string | null, shard: RevisionShard | null): ArtikelRevision | null {
  if (!artikel) return null;
  const rev = revisionFuerToken(shard, artikel);
  const eingestuft = klassifiziereFassungsBezug(entscheidDatum(b.datum, b.facetten.status), rev);
  return eingestuft === 'revidiert' ? (rev ?? null) : null;
}

// ── K-2b/F37 (W2·13-KANTONE, 31.8.2026) · DIE ABDECKUNG GEHÖRT IN DEN SATZ ───
//
// «Zu § 5 ist kein Entscheid der eingeschalteten Instanzen erfasst» ist eine
// Aussage über den ERLASS. Beim Kantonserlass war sie irreführend, weil die
// wahre Ursache meist die Abdeckung ist: GEMESSEN am 31.8.2026 haben 147 von
// 1231 kantonalen Erlassen überhaupt einen Bezugs-Shard — und alle 147 gehören
// zu EINEM Kanton (BS).
//
// WARUM DER SATZ NICHT «für kantonale Erlasse noch nicht erfasst» LAUTET
// (Abweichung vom Spec-Wortlaut, §7 — der Auftrag nannte diese Formulierung,
// die Messung widerlegt sie): für die 147 BS-Erlasse wäre sie schlicht falsch,
// dort IST verknüpft, und ein leerer Paragraph heisst dann wirklich «kein
// Entscheid». Trennen kann das Panel die beiden Lagen heute nicht — `geladen`
// ist nach einem 404 ebenfalls `true` (s. Prop-Kommentar) —, also behauptet der
// Satz auch nicht, welche vorliegt. Er sagt, was in BEIDEN Lagen wahr ist: die
// Verknüpfung ist erst teilweise aufgebaut, das Fehlen ist darum kein Beleg.
// Ein trennschärferer Satz braucht zuerst ein «hat dieser Erlass einen Shard?»
// im Modell — Datenarbeit, nicht Wortwahl.
const KANTON_ABDECKUNG = 'Kantonale Erlasse sind erst teilweise verknüpft — das Fehlen'
  + ' belegt nicht, dass es keinen Entscheid gibt.';

// ── S6-W1b · E-5 (Audit 23.9.2026) · WAS ERFASST IST, STEHT UNTER DEM FILTER ──
// Die Liste sagt nie, aus welchem Bestand sie schöpft: BGE nur jüngere Bände,
// übrige Bundesgerichtsurteile vereinzelt, kantonal erst wenige Gerichte. Wer
// eine lange Liste sieht, hält sie leicht für vollständig (§8). Die Zeile steht
// darum in JEDER Lage, nicht nur im Leerzustand.
//
// OHNE ZAHLEN, mit Absicht: der Leser lädt keine Korpus-Bilanz, die Bände,
// Gerichte und Kantone nennt (das Register ist 9,4 MB, die Bezugs-Bilanz führt
// nur Kanten je Status). Eine hier eingetippte Zahl wäre eine zweite Wahrheit
// neben `/abdeckung` (§5), die beim nächsten Korpus-Lauf still veraltet. Die
// Zahlen stehen auf der verlinkten Seite; hier steht, was in jeder Lage wahr ist.
const ABDECKUNG_SATZ = 'Erfasst sind die Leitentscheide (BGE) der jüngeren Bände; übrige'
  + ' Urteile des Bundesgerichts und der eidgenössischen Gerichte nur vereinzelt, kantonale'
  + ' Entscheide erst aus einzelnen Gerichten.';

export function PanelEntscheide({
  kanten, alleKanten, aktArtikel, revisionShard, normZitat, artikelLabel, geladen, fehler = false, onNeuLaden,
  bestimmungsWort, klassen, kantone, kantoneVerfuegbar, histogramm, bereich, onKlassen, onKantone, onBereich, ebene,
}: {
  /** Ebene des gelesenen Erlasses — DURCHGEREICHT aus dem Modell
   *  (`leserV3Modell` → `LeserRahmenV3` → `LeserPanelZone`), nicht hier neu
   *  geladen: sie steht im Erlass-Datensatz, den die Hülle ohnehin hält (§5).
   *  Steuert ausschliesslich den Leerzustands-Satz (K-2b); `undefined` =
   *  keine Aussage, also der unveränderte Bund-Wortlaut. */
  ebene?: 'bund' | 'kanton';
  /** Kanten des GELESENEN Artikels nach Facetten-Filter; `undefined` = keine. */
  kanten?: readonly Bezug[];
  /** S6-W1b · D-9: dieselben Kanten OHNE Filter — die Bezugsgrösse der Zahlen
   *  am Instanz-Schalter (`klassenZahlenAmArtikel`). `undefined` = keine. */
  alleKanten?: readonly Bezug[];
  /** Artikel-Token des Panels (§7b: Grundlage der ↻-Klassifikation, s. o.). */
  aktArtikel: string | null;
  /** Erlass-lokaler Revisions-Shard, oder `null` = kein Beleg/noch nicht
   *  geladen — beide klassifizieren als 'unbekannt' (§8, `revisionFuerToken`). */
  revisionShard: RevisionShard | null;
  normZitat: string;
  artikelLabel: string | null;
  /** Ist der Lade-VERSUCH durch? Trennt «lädt noch» von «nichts erfasst» (§8).
   *  A1: kommt aus `useBezuege().geladen` — nach einem 404 ebenfalls `true`. */
  geladen: boolean;
  /** S6-W1b · E-3/D-3/B-8: der Ladeversuch ist gescheitert (Netz/5xx). Eigene
   *  Lage mit eigenem Satz — nie «kein Entscheid erfasst» (§8). */
  fehler?: boolean;
  /** Knopf «erneut laden» in der Fehler-Lage. */
  onNeuLaden?: () => void;
  /** Zähl-Substantiv des Erlasses (C1) — «zu diesem Artikel» bzw. «zu diesem
   *  Paragraphen». Nie ein Bund-Vorgabewert, nie hier abgeleitet (§5). */
  bestimmungsWort: BestimmungsWort;
  klassen: readonly BezugStatus[];
  kantone: readonly string[];
  kantoneVerfuegbar: readonly string[];
  histogramm: Histogramm;
  bereich: Zeitbereich;
  onKlassen: (neu: BezugStatus[]) => void;
  onKantone: (neu: string[]) => void;
  onBereich: (von: string, bis: string) => void;
}) {
  const gruppen = ordneEntscheide(kanten ?? []);
  const zahlOrt = artikelLabel ? `an ${artikelLabel}` : `an ${bestimmungDativ(bestimmungsWort)}`;

  return (
    <div data-v3-panel-reiter-inhalt="entscheide">
      {/* ── EINE Filterzeile (Ä54) · Herleitung in `./PanelFilterZeile` ────────
          S6-W1b · D-9: die Zahlen am Instanz-Schalter gelten dem ARTIKEL, wie
          die Liste darunter — nicht mehr dem ganzen Erlass. */}
      <PanelFilterZeile klassen={klassen} kantone={kantone} kantoneVerfuegbar={kantoneVerfuegbar}
        klassenZahlen={klassenZahlenAmArtikel(alleKanten, geladen)} zahlOrt={zahlOrt}
        histogramm={histogramm} bereich={bereich}
        onKlassen={onKlassen} onKantone={onKantone} onBereich={onBereich} />
      <p data-v3-panel-abdeckung-zeile className="border-b border-line px-3 py-1.5 text-micro leading-snug text-ink-600">
        {ABDECKUNG_SATZ}{' '}
        <Link to="/abdeckung" className="text-brass-700">Abdeckung ›</Link>
      </p>

      {/* ── Fundstellen des gelesenen Artikels ────────────────────────────────
          §8, VIER ZUSTÄNDE, VIER SÄTZE — nie derselbe für zwei Lagen:
           · Facetten alle aus  → «Keine Instanz eingeschaltet» (Bedien-Zustand)
           · Laden gescheitert  → «konnte nicht geladen werden» (Leitungs-Zustand, S6-W1b)
           · lädt              → «wird geladen» (Wissens-Zustand)
           · geladen und leer  → «keine erfasst» (Bestands-Zustand)
          Ein gemeinsames «keine Entscheide» hätte den Bedien- und den
          Bestands-Zustand vermischt: der Nutzer läse eine Aussage über den
          Korpus, wo eine über seinen eigenen Schalter stünde. Dasselbe galt
          bis S6-W1b für den Netzfehler, der als «kein Entscheid erfasst»
          erschien (Audit 23.9.2026, E-3/D-3/B-8). */}
      {klassen.length === 0 ? (
        <p data-v3-panel-lage="bedienung" className="px-3 py-3 text-body-s text-ink-600">
          Keine Instanz eingeschaltet — oben zuschalten, dann erscheinen die Entscheide
          zu {bestimmungDativ(bestimmungsWort)}.
        </p>
      ) : fehler ? (
        <div data-v3-panel-lage="fehler" role="status" className="px-3 py-3 text-body-s text-ink-600">
          <p>
            Die Entscheide konnten nicht geladen werden. Das sagt nichts über den Bestand —
            bei bestehender Verbindung wird es von selbst erneut versucht.
          </p>
          {onNeuLaden && (
            <button type="button" data-v3-panel-neu-laden onClick={onNeuLaden}
              className="lc-btn-outline lc-btn-sm mt-2 min-h-11">
              Erneut laden
            </button>
          )}
        </div>
      ) : !geladen ? (
        <p data-v3-panel-lage="laedt" className="px-3 py-3 text-body-s text-ink-600">Entscheide werden geladen …</p>
      ) : gruppen.length === 0 ? (
        <p data-v3-panel-lage="bestand" className="px-3 py-3 text-body-s text-ink-600">
          {artikelLabel
            ? `Zu ${artikelLabel} ist kein Entscheid der eingeschalteten Instanzen erfasst.`
            : 'Zu diesem Erlass ist kein Entscheid der eingeschalteten Instanzen erfasst.'}
          {/* K-2b: der Zusatz TRITT HINZU, er ersetzt die Bestandsaussage
              nicht — beide sind wahr, und die zweite erklärt die erste. */}
          {ebene === 'kanton' && (
            <span data-v3-panel-abdeckung="kanton" className="block text-ink-600">{KANTON_ABDECKUNG}</span>
          )}
        </p>
      ) : (
        <div className="px-3 py-1">
          {/* S6-W1b · Davids Ordnung (23.9.2026): BGE · je kantonales Gericht ·
              Rest — je Gruppe die fünf neusten, dann «weitere N». Ersetzt die
              frühere Vollliste ohne Portion («das Panel scrollt ohnehin»), die
              an BGG Art. 42 4144 Zeilen auf einmal baute (D-4). Der `key` mit
              Artikel setzt die Portion beim Artikelwechsel zurück. */}
          {gruppen.map((g) => (
            <Gruppe key={`${aktArtikel ?? ''}|${g.id}`} g={g} artikelLabel={artikelLabel}
              bestimmungsWort={bestimmungsWort} normZitat={normZitat}
              aktArtikel={aktArtikel} revisionShard={revisionShard} />
          ))}
        </div>
      )}
    </div>
  );
}
