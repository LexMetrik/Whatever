import { datumAnzeige } from '../../../components/rechtsprechung/format';
import { KanteMitVorschau } from '../../../components/verzahnung/KanteMitVorschau';
import { GruppenKopf } from '../../../components/ui/GruppenKopf';
import {
  entscheidDatum, klassifiziereFassungsBezug, revisionFuerToken,
  type ArtikelRevision, type RevisionShard,
} from '../../../lib/verzahnung/artikel-revisionen';
import { STATUS_LABEL, type BezugStatus } from '../../../lib/verzahnung/facetten';
import type { Bezug, KlassenZahlen } from '../../../lib/rechtsprechung/bezuege';
import { KLASSE_KURZ } from '../bezugAuswahl';
import type { Histogramm, Zeitbereich } from '../bezugZeit';
import { bestimmungDativ, type BestimmungsWort } from './erlassAnsicht';
import { gruppiereKanten } from './panelModell';
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
  return (
    <li data-v3-panel-entscheid={b.key} className="border-l-2 border-t border-line border-l-reg-r py-2 pl-2.5">
      <KanteMitVorschau
        ziel={`/rechtsprechung/${encodeURIComponent(b.key)}?norm=${encodeURIComponent(normZitat)}`}
        zitierung={b.zitierung}
        sublabel={datumAnzeige(b.datum)}
        kurztext={b.regesteKurz}
        statusLabel={statusLabel}
        revidiert={revidiert} />
      {b.regesteKurz && (
        <p className="mt-1 text-body-s leading-snug text-ink-700 line-clamp-2">{b.regesteKurz}</p>
      )}
    </li>
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

export function PanelEntscheide({
  kanten, aktArtikel, revisionShard, normZitat, artikelLabel, geladen, bestimmungsWort, klassen, kantone, kantoneVerfuegbar,
  klassenImErlass, histogramm, bereich, onKlassen, onKantone, onBereich, ebene,
}: {
  /** Ebene des gelesenen Erlasses — DURCHGEREICHT aus dem Modell
   *  (`leserV3Modell` → `LeserRahmenV3` → `LeserPanelZone`), nicht hier neu
   *  geladen: sie steht im Erlass-Datensatz, den die Hülle ohnehin hält (§5).
   *  Steuert ausschliesslich den Leerzustands-Satz (K-2b); `undefined` =
   *  keine Aussage, also der unveränderte Bund-Wortlaut. */
  ebene?: 'bund' | 'kanton';
  /** Kanten des GELESENEN Artikels nach Facetten-Filter; `undefined` = keine. */
  kanten?: readonly Bezug[];
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
  /** Zähl-Substantiv des Erlasses (C1) — «zu diesem Artikel» bzw. «zu diesem
   *  Paragraphen». Nie ein Bund-Vorgabewert, nie hier abgeleitet (§5). */
  bestimmungsWort: BestimmungsWort;
  klassen: readonly BezugStatus[];
  kantone: readonly string[];
  kantoneVerfuegbar: readonly string[];
  klassenImErlass: Partial<Record<BezugStatus, KlassenZahlen>>;
  histogramm: Histogramm;
  bereich: Zeitbereich;
  onKlassen: (neu: BezugStatus[]) => void;
  onKantone: (neu: string[]) => void;
  onBereich: (von: string, bis: string) => void;
}) {
  const gruppen = gruppiereKanten(kanten ?? []);

  return (
    <div data-v3-panel-reiter-inhalt="entscheide">
      {/* ── EINE Filterzeile (Ä54) · Herleitung in `./PanelFilterZeile` ──────── */}
      <PanelFilterZeile klassen={klassen} kantone={kantone} kantoneVerfuegbar={kantoneVerfuegbar}
        klassenImErlass={klassenImErlass} histogramm={histogramm} bereich={bereich}
        onKlassen={onKlassen} onKantone={onKantone} onBereich={onBereich} />

      {/* ── Fundstellen des gelesenen Artikels ────────────────────────────────
          §8, DREI ZUSTÄNDE, DREI SÄTZE — nie derselbe für zwei Lagen:
           · Facetten alle aus  → «Keine Instanz eingeschaltet» (Bedien-Zustand)
           · lädt              → «wird geladen» (Wissens-Zustand)
           · geladen und leer  → «keine erfasst» (Bestands-Zustand)
          Ein gemeinsames «keine Entscheide» hätte den Bedien- und den
          Bestands-Zustand vermischt: der Nutzer läse eine Aussage über den
          Korpus, wo eine über seinen eigenen Schalter stünde. */}
      {klassen.length === 0 ? (
        <p data-v3-panel-lage="bedienung" className="px-3 py-3 text-body-s text-ink-600">
          Keine Instanz eingeschaltet — oben zuschalten, dann erscheinen die Entscheide
          zu {bestimmungDativ(bestimmungsWort)}.
        </p>
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
          {gruppen.map(([status, liste]) => (
            <section key={status} data-v3-panel-gruppe={status} className="pt-2 first:pt-1">
              {/* B3-1 (R3-β): dichte Gestalt des EINEN Gruppenkopfs
                  (`ui/GruppenKopf`). Der Weiterzugs-Hinweis ist die `marke` am
                  ZEILENENDE — Befund 6b: EIN Hinweis je Gruppe, nicht je Zeile
                  (Ä106). Sein `normal-case` bleibt (anders als am Zähler ist es
                  dort NICHT tot: `text-transform: uppercase` bildet «ⓘ»
                  U+24D8 auf «Ⓘ» U+24BE ab). */}
              <GruppenKopf
                als="p" dicht
                title={`${STATUS_LABEL[status]} — ${liste.length} Fundstelle(n) an ${artikelLabel ?? bestimmungDativ(bestimmungsWort)}`}
                titel={KLASSE_KURZ[status]}
                zahl={liste.length}
                markeStellung="rechts"
                marke={traegtWeiterzugHinweis(liste) ? (
                  <span aria-label={WEITERZUG_ERKLAERUNG} title={WEITERZUG_ERKLAERUNG}
                    className="ml-1 normal-case font-normal text-ink-400">ⓘ</span>
                ) : undefined}
              />
              {/* KEINE Portionierung, kein «weitere 5»: die Liste im Panel darf
                  senkrecht wachsen, das Panel scrollt ohnehin. Die Kappung am
                  Artikelfuss war eine Folge der festen Zeilenhöhe (CLS), nicht
                  eine Aussage über die Daten — sie mitzuschleppen hiesse, eine
                  Einschränkung ohne ihren Grund zu übernehmen. */}
              <ul className="mt-0.5">
                {liste.map((b) => (
                  <Fundstelle key={b.key} b={b} normZitat={normZitat} statusLabel={STATUS_LABEL[status]}
                    revidiert={revidiertFuer(b, aktArtikel, revisionShard)} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
