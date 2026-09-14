import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { CurrencyEintrag, KantonLueckeEintrag } from '../../../lib/normtext/browse';
import type { BrowseErlass } from '../../../lib/normtext/browse-typen';
import {
  GELTUNG_UNGEPRUEFT_SATZ, STAND_UNBEKANNT,
  nichtKonsolidiertSatz, standausweisSatz, zaehlWort,
} from '../../../lib/normtext/erlassKopfText';
import { MASSGEBLICH_HALBSATZ } from '../../../lib/benennung';
import { Datum } from '../../../components/ui/Datum';
import { QuellLink } from '../../../components/ui/QuellLink';
import { SeitenTitel } from '../../../components/ui/SeitenTitel';
import { LeserKopfGeruest } from '../../../components/layout/LeserKopfGeruest';
import { erlassKeyVonEli, erlassPfadVonKey } from '../../../lib/normtext/erlassAdresse';
import { kennungEtikett, titelOhneKlammerSuffix } from '../helpers';
import { zukunftsHinweis, type ZukunftsHinweis } from '../zukunftsfassungen';

// W2·5d G2b — EINE Leser-Kopf-Komponente für ALLE Grundarten (Kopf-Zusammen-
// führung, §3.3): Ersetzt die zwei früher duplizierten <header>-Blöcke (Snapshot
// vs. pdf-embed) durch EINE Quelle (§5). Reine Darstellung (§3).
//
// ─── W2·5m-LESER-V3 · S3 (Skizze Kap. 4e, Pos. 11 + 18) ──────────────────────
// Vorher standen hier bis zu NEUN gleich aussehende Mono-Chips mit Brass-Kante
// in einer einzigen umbrechenden Zeile — darunter drei grundverschiedene Dinge:
// externe Links, ein Knopf und reine Textangaben (Befund LM-045/046 und
// Ästhetik-Urteil Ä6). Der Kopf trennt sie jetzt nach ROLLE in vier Bänder:
//
//   1  Titel                 — was ist das (Serif, eine Farbe)
//   2  Fakten                — SR · Zahl der Bestimmungen
//   3  Stand + Status        — wie aktuell ist es, und was fehlt trotzdem
//   4  Aktionen              — wohin kann ich (ruhige Text-Links, keine Kästen)
//
// Die Chip-Optik ist damit weg; die Aktionen-Knöpfe kommen weiterhin als
// `aktionen`-Slot aus den Aufrufern und tragen dort `.lc-chip` — für DIESE Zeile
// wird die Chip-Anatomie in `.lc-kopf-aktionen` neutralisiert (index.css), damit
// der Slot-Vertrag unverändert bleibt und kein Aufrufer umgebaut werden muss.
// Das 44-px-Tap-Ziel der Chips bleibt dabei ausdrücklich erhalten (F2b/a11y).
//
// ─── B-4 (W2·19-DESIGN-KONSISTENZ, Runde 2, 31.8.2026) ───────────────────────
// Diese Bänder-Ordnung war site-weit die einzige ihrer Art — Entscheid- und
// Material-Leser bauten ihren Kopf je selbst. Sie ist jetzt der geteilte
// Baustein `components/layout/LeserKopfGeruest` (§5/§10: Konsumenten ziehen um,
// die Kopie wird gelöscht). DIESER Kopf ist der Kanon, aus dem das Gerüst
// hergeleitet wurde — er rendert darum Zeichen für Zeichen dieselbe Ausgabe wie
// vorher (Byte-Beweis: `src/tests/kopf-geruest-b4.test.tsx`, fünf Varianten).
// Was hier BLEIBT, sind die Aussagen ÜBER DEN ERLASS: welche Segmente Fakten
// und Stand tragen, welcher Satz die Ehrlichkeitszeile füllt, wann ein
// Aufhebungs-Banner steht. Was GEHT, ist das Gehäuse.
export function ErlassLeserKopf({
  erlass, overline, artikelAnzahl, bestimmungsWort = 'Artikel', kennzahlen = null,
  aktionen, hinweis, currency, nichtKonsolidiert = false, nichtKonsolidiertSeit = null,
  kennung = null, luecken, zukunft,
}: {
  erlass: BrowseErlass;
  /** §8-Nachzug (PR #614-Auflage): vom §-Parser bewusst ausgelassene Teile
   *  dieses (kantonalen) Erlasses — Anhänge, Übergangs-/Schlussbestimmungen.
   *  `undefined` = keine ausgewiesene Lücke (Bund trägt nie einen Eintrag,
   *  §15) → kein Hinweis (§8: Schweigen ist hier korrekt, nicht verschwiegen). */
  luecken?: KantonLueckeEintrag;
  /** ── W2·27 (BUND-FERTIG §4 b) · der Zukunftsfassungs-Hinweis ───────────────
   *  Fertig ausgerechnet vom Aufrufer (`v3/useZukunftsfassung`), weil zur Zahl
   *  der weiteren Fassungen ein Sidecar gehört und dieser Kopf reine Darstellung
   *  ist (§3). `undefined` = der Aufrufer rechnet nicht mit; dann leitet der Kopf
   *  den Hinweis selbst aus `currency` ab — ohne die Zahl, aber mit Satz und
   *  Link. So bleibt jeder bestehende Aufrufer wortgleich bedient (§6.3), und
   *  «kein Aufrufer-Wissen» heisst nie «kein Hinweis».
   *  `null` = ausgerechnet und: es gibt keinen. */
  zukunft?: ZukunftsHinweis | null;
  /** ── Ä-(d) aus S3 (LESER-V3 H2b) · Kennung VOR dem Titel ──────────────────
   *  `null` (Vorgabe) = die S3-Zitierform «Volltitel (Kürzel)» bleibt Zeichen für
   *  Zeichen, wie sie ist — die Ist-Hülle setzt die Prop nicht und ist damit
   *  unverändert (FL-4).
   *
   *  Ein Wert = der Kopf stellt die Kennung VOR den Titel und lässt das
   *  Klammer-Suffix weg. Anlass (gemessen 17.8.2026 am LugÜ): bei sehr langen
   *  Staatsvertrags-Titeln stand das Kürzel am Ende einer dreizeiligen, 147 px
   *  hohen H1 — wer den Erlass wiedererkennen will, sucht genau diese vier
   *  Zeichen und findet sie zuletzt. Dieselbe Information, andere Reihenfolge,
   *  nichts doppelt.
   *
   *  WER entscheidet, steht NICHT hier: die Regel ist erlassabhängig und liegt
   *  darum in der Hülle (`v3/erlassAnsicht.titelKennung`, rein und unit-geprüft).
   *  Dieser Kopf ist geteilte Darstellung (§3) und darf keine Erlass-Weiche
   *  tragen — und er darf auch nicht aus `v3/` importieren (Abhängigkeitsrichtung
   *  Hülle → geteilte Schicht, nie umgekehrt). */
  kennung?: string | null;
  overline: ReactNode;
  /** Artikelzahl (Snapshot); null = keine Zählung (pdf-embed). */
  artikelAnzahl: number | null;
  /** Zähl-Substantiv (W2·5d G3a/⑥): «Artikel» bzw. «Paragraphen» für §-Kantone
   *  (bestimmungsEtikett='paragraf'). NUR sichtbares Label — der Anker bleibt
   *  überall art-<token> (K2/R8). Entwurf-Etikett (K6), darum kein Zitat-Label. */
  bestimmungsWort?: 'Artikel' | 'Paragraphen';
  /** S3 (Fahrplan Kap. 14, «Anhang-Dominanz»): Kennzahlen des Gliederungs-Modells
   *  — EINE Quelle für «wie viel davon ist Anhang» (§5, dieselbe Zahl wie in der
   *  Erlass-Übersicht). Fehlt sie, bleibt es beim `bestimmungsWort`: lieber das
   *  gewohnte Etikett als ein aus Nichts abgeleitetes (§8). */
  kennzahlen?: { artikelAnzahl: number; anhangArtikel: number } | null;
  /** Grundart-spezifische Aktionen (Herunterladen/Reiter/Options bzw. PDF-Download). */
  aktionen?: ReactNode;
  hinweis: string;
  /** P1-d: maschineller Fedlex-Currency-Beweis (Standausweis / künftige Fassung). */
  currency?: CurrencyEintrag;
  /** W2·19-GLIEDERUNG/S6 + S3: mindestens eine in Kraft getretene Änderung ist
   *  NICHT in den gezeigten Text konsolidiert. PROMOTION, kein Neubau: dieselbe
   *  Tatsache steht je Revisions-Zeile im KontextPanel
   *  (`RevisionBezug.nichtKonsolidiert`) — sie wird hier aggregiert an die Stelle
   *  gehoben, an der man sie VOR dem Lesen sieht (§5: eine Datenquelle, zwei
   *  Auflösungsgrade). `false` = keine Aussage, kein Banner (§8).
   *
   *  Nur BEREITS GELTENDE Änderungen zählen — der Stichtagsfilter sitzt beim
   *  Erzeuger (`fruehestesInKraft`, lib/normtext/revisionen.ts), nicht hier:
   *  die Darstellung entscheidet nicht, was gilt (§3). */
  nichtKonsolidiert?: boolean;
  /** S3/F5: ISO-Datum des FRÜHESTEN nicht konsolidierten Inkrafttretens — der
   *  Zeitbezug des Klartextsatzes («eine seit 01.07.2025 geltende Änderung»).
   *  `null` = Tatsache belegt, Datum nicht bekannt: dann nennt der Satz keines,
   *  statt eines zu erfinden (§8).
   *
   *  Bewusst eine ZWEITE Prop und nicht `boolean | string` in einer: die
   *  Übergangsform trug zwei Aussagen («gibt es das?» / «seit wann?») in einem
   *  Wert und zwang jeden Aufrufer, sie über die Wahrheitswertigkeit eines
   *  Strings zu koppeln. Sie stammte aus der Bau-Reihenfolge (das V3-Modell
   *  pinnte das Feld auf `boolean`, während die V3-Hülle in fremder Bauhand
   *  lag); mit dem Nachzug ist der Grund weg — und mit ihm die Union. */
  nichtKonsolidiertSeit?: string | null;
}) {
  // Fedlex hängt das Kürzel als Klammer-Suffix an den Volltitel («… (Strafpro-
  // zessordnung, StPO)»). Bis S3 stand hier «StPO — Schweizerische Strafprozess-
  // ordnung» in ZWEI Farben; Skizze 4e dreht das auf die gewohnte Zitierform
  // «Volltitel (Kürzel)» in EINER Farbe — zweifarbige Titel lasen sich wie zwei
  // Angaben, obwohl es eine ist (Ä6).
  // B1 (H2b-Nachzug): die Regex lebt jetzt EINMAL in `helpers` — dieselbe
  // Zeichenkette, über die `v3/erlassAnsicht` Länge und Gleichheit entscheidet
  // (§5: gemessen wird, was gedruckt wird). Verhalten hier unverändert.
  const titelOhneSuffix = titelOhneKlammerSuffix(erlass.titel);
  const kuerzel = erlass.kuerzel.trim();
  const titelRedundant = titelOhneSuffix.toLowerCase() === kuerzel.toLowerCase();
  // Ä-(d): mit `kennung` trägt der Titel das Klammer-Suffix nicht mehr — die
  // Kennung steht als eigenes, vorangestelltes Element in derselben H1 (sie
  // bleibt damit Teil des zugänglichen Namens der Überschrift, wird nur zuerst
  // gelesen). Ohne `kennung` bleibt die Zeile Zeichen für Zeichen die von S3.
  const titelZeile = !kuerzel || titelRedundant || kennung
    ? (titelOhneSuffix || kuerzel)
    : `${titelOhneSuffix} (${kuerzel})`;

  const wort = zaehlWort(bestimmungsWort, kennzahlen);
  // §8: bei GANZ aufgehobenem Erlass ist die Aufhebung DIE Aussage — weder ein
  // Standausweis noch eine Konsolidierungs-Warnung daneben (beide wären
  // irreführend), und kein «geltende Fassung»-Link (er führte auf die
  // aufgehobene Konsolidierung; der amtliche Link liegt ehrlich beschriftet im
  // Aufhebungs-Banner unten).
  const lebt = !erlass.aufgehoben;
  const warnung = lebt && nichtKonsolidiert ? nichtKonsolidiertSatz(nichtKonsolidiertSeit) : null;

  // Fakten- und Stand-Segmente werden als Liste gebaut und mit einem Mittepunkt
  // gefügt — so kann kein führender/doppelter Trenner entstehen, wenn ein Wert
  // fehlt (Kanton ohne SR, VD-Erlasse mit leerem `stand`, pdf-embed ohne Zählung).
  // Ä75 (18.8.2026): das Etikett «SR» steht nur am BUNDESERLASS. Über kantonalen
  // Nummern war es eine falsche Fundstellenangabe (BS-640.100 steht nicht in der
  // SR des Bundes) — die Weiche und der Grund, warum kein Kantons-Kürzel an seine
  // Stelle tritt, stehen bei `kennungText` in `../helpers`. Die Mono-Auszeichnung
  // `.num` bleibt an der ZAHL: sie gilt der Nummer, nicht dem Etikett
  // (Design-Grundlage Kap. 2.1 «auf SR-Nr./Aktenzeichen begrenzt»).
  const fakten = [
    erlass.sr
      ? <>{kennungEtikett(erlass) ? `${kennungEtikett(erlass)} ` : ''}<span className="num">{erlass.sr}</span></>
      : null,
    artikelAnzahl != null ? <><span className="num">{artikelAnzahl}</span> {wort}</> : null,
  ].filter(Boolean) as ReactNode[];

  // S2 · Ä-(b) «Die Stand-Zeile mischt Datumsformen» (Nachtrag S3, Ästhetik-
  // Gegenprüfung 16.8.2026): `Stand 01.04.2025` lief in der Mono-Auszeichnung
  // `.num`, das Datum im Standausweis daneben proportional — gleiche Grösse, zwei
  // Anmutungen in EINEM Satz. Aufgelöst zu EINER Auszeichnung, und zwar in
  // Richtung der Design-Grundlage Kap. 2.1: die Mono-Stimme ist dort ausdrücklich
  // «auf SR-Nr./Aktenzeichen begrenzt» — Daten gehören nicht dazu. Beide Daten
  // laufen jetzt in der Kopf-Stimme mit `tabular-nums` (Grundlage Kap. 2.3:
  // «tabular-nums für Beträge/Daten/Artikelnummern»); die Auszeichnung sitzt am
  // <p> der Zeile, damit sie AUCH den Standausweis trifft, der als reiner String
  // aus `erlassKopfText.ts` kommt. Damit bleibt der Risikopfad
  // `src/lib/normtext/**` unberührt (§5: derselbe String steht im prerenderten
  // SEO-Kopf; ihn in ein Fragment zu zerlegen hätte beide Seiten und den
  // Gegenprüfungs-Hash angefasst — dieselbe Falle, die S3 bei `ANHANG_DOMINANZ`
  // schon notiert hat). Die SR-Nummer in der Fakten-Zeile darüber behält `.num`:
  // sie IST der Fall, für den die Mono-Stimme reserviert ist.
  // ── K-2a/F26 (W2·13-KANTONE, 31.8.2026) · ZWEITE STUFE DES STANDAUSWEISES ──
  // Die erste Stufe (`standausweisSatz`) braucht einen Currency-Beleg. Den hat
  // GEMESSEN kein einziger der 1231 kantonalen Erlasse (currency.json: 224
  // Einträge, davon 0 kantonale) — der Kantons-Kopf trug damit überhaupt keinen
  // Geltungs-Status, und das Schweigen las sich wie eine Unbedenklichkeits-
  // Bescheinigung. Die zweite Stufe sagt stattdessen, was zutrifft (§8).
  //
  // WARUM AN DER EBENE UND NICHT NUR AM FEHLENDEN BELEG: ein Bundeserlass ohne
  // Currency-Eintrag ist ein LÜCKENFALL im Sidecar (die Prüfung läuft für ihn,
  // ihr Ergebnis fehlt bloss gerade) — dort wäre «Geltung ungeprüft» eine
  // Aussage über unsere Pipeline, nicht über den Erlass. Beim Kanton ist die
  // Nicht-Prüfung der DAUERZUSTAND, solange es keinen kantonalen Currency-Lauf
  // gibt. Die Weiche hält damit das Bund-Verhalten Zeichen für Zeichen fest
  // (Beweis: `kanton-ehrlichkeit-k2`, «Bund-Verhalten byte-identisch»).
  //
  // `lebt` schliesst den aufgehobenen Erlass aus — dort ist die Aufhebung DIE
  // Aussage, genau wie beim Standausweis eine Zeile darüber.
  const geltungUngeprueft = lebt && erlass.ebene === 'kanton' && !currency?.geprueftAm;

  // §3: der Kopf RECHNET den Hinweis nicht, er nimmt ihn. Nur wenn kein
  // Aufrufer mitrechnet (`undefined`), leitet er die sidecar-freie Fassung
  // selbst ab — Satz und Link stehen bereits im Currency-Eintrag, den er hat.
  const hinweisZukunft = zukunft !== undefined ? zukunft : zukunftsHinweis(erlass, currency);

  const stand = [
    // K-2d/F27-Rest: leerer `stand` (VD-vd-106879, VD-vd-128150) liess das
    // Segment bis 31.8.2026 STILL weg. Eine verschwiegene Lücke ist die
    // unehrlichere Form als eine benannte (§8) — der Kopf sagt sie jetzt.
    erlass.stand ? <>Stand <Datum iso={erlass.stand} /></> : <>{STAND_UNBEKANNT}</>,
    // K-1: Ur-Inkrafttreten (Fedlex `dateEntryInForce`, build-time projiziert ⇒
    // CLS 0). Distinkt vom «Stand» (Konsolidierung) — nur Bund; Kanton trägt es
    // nicht (§8). «vom …» wird NICHT gedoppelt (steht im Ingress).
    erlass.inkraftSeit ? <>in Kraft seit <Datum iso={erlass.inkraftSeit} /></> : null,
    // F5-Standausweis. Prerender-stabil (Sidecar zur Bauzeit erhoben, keine
    // Client-Datums-Logik). Wortlaut aus `erlassKopfText` — derselbe String
    // steht im prerenderten SEO-Kopf (§5, `seo-detail.ts`).
    currency?.geprueftAm && lebt ? standausweisSatz(currency.geprueftAm) : null,
    // Zweite Stufe — steht an DERSELBEN Stelle wie der Standausweis, weil sie
    // dieselbe Frage beantwortet («wie belastbar ist dieser Stand?»). Beide
    // zugleich kann es nicht geben: die Weiche oben verlangt `!geprueftAm`.
    geltungUngeprueft ? GELTUNG_UNGEPRUEFT_SATZ : null,
    // ── W2·27 (BUND-FERTIG §4 b) · «ab <Datum> gilt eine neue Fassung» ───────
    // Bis hierher stand an dieser Stelle das blosse Wort «nächste Fassung ab
    // TT.MM.JJJJ» — ein Datum ohne Weg dorthin, ohne die Mehrzahl und ohne
    // Antwort auf den Fall, dass die angekündigte Fassung inzwischen GILT. Der
    // Satz ist unverändert derselbe (`erlassKopfText.naechsteFassungSatz`, über
    // `../zukunftsfassungen`, §5); dazugekommen sind der amtliche Link auf die
    // datierte Fedlex-Manifestation, die Zahl der weiteren Fassungen und die
    // ehrliche zweite Lesart. KEIN Umschalter, KEIN Diff — die gehören nach
    // Phase 3 (Entscheid David 14.9.2026, FAHRPLAN-BUND-FERTIG §4 b).
    //
    // Der Link trägt die WARN-Farbe der Zeile weiter statt der Brass-Linkfarbe:
    // er ist Teil dieser einen Aussage, nicht ein zweiter Weg neben ihr. Den
    // Strich (also die Erkennbarkeit als Link ohne Farbe, WCAG 1.4.1) bringt
    // `.lc-link` mit — dieselbe Opt-in-Klasse wie überall sonst (B-L1).
    // `text-warn-700` hat kein `…-800`-Geschwister in der Farbwelt; der Hover
    // arbeitet darum über den Strich, nicht über einen zweiten Ton.
    hinweisZukunft
      ? (
        <span className="text-warn-700">
          {hinweisZukunft.link
            ? (
              <QuellLink href={hinweisZukunft.link} className="lc-link text-warn-700">
                {hinweisZukunft.satz}
              </QuellLink>
            )
            : hinweisZukunft.satz}
          {/* «(+2 weitere)» statt einer zweiten Datumsliste: der Kopf sagt, DASS
              mehr bevorsteht; WELCHE Änderungen es sind, steht vollständig im
              Reiter «Änderungen» daneben. Ein zweiter Ruf an derselben Falz
              machte die Auskunft beiläufiger, nicht dringlicher (Ä81/Ä97). */}
          {hinweisZukunft.weitere > 0 ? ` (+${hinweisZukunft.weitere} weitere)` : ''}
        </span>
      )
      : null,
  ].filter(Boolean) as ReactNode[];

  // ── DIE BÄNDER DIESES KOPFES ───────────────────────────────────────────────
  // Gehäuse und Bänder-Ordnung kommen seit B-4 aus `layout/LeserKopfGeruest`;
  // was hier steht, sind die Aussagen ÜBER DEN ERLASS und ihre Herleitungen.

  /* Zwei-Stimmen-Regel (DESIGN-REGLEMENT §e): Serif trägt den zitierfähigen
     Quelltext einschliesslich Erlass-Kopf — bis S3 lief der Titel als einzige
     Stelle des Kopfs noch auf der Sans-Display-Stimme (h-Tag-Regel index.css).
     min-h-titel-2z (§15.2) reserviert unverändert die 2-Zeilen-Höhe gegen den
     font-display-Swap (CLS 0); nur Platz-Reservierung — der volle Titel steht
     immer (§15/2).
     ── Ä101 (Live-Ästhetik-Prüfung 18.8.2026) · KEINE SILBENTRENNUNG IM
     ERLASS-TITEL ───────────────────────────────────────────────────────────
     GEMESSEN @1440 und @390: `hyphens-auto` trennte die Überschrift mitten im
     Namen — «Aner-kennung» (LugÜ), «Strafprozess-ordnung» (StPO). Der Titel ist
     der NAME des Erlasses und die grösste Type der Seite; Design-Grundlage
     Kap. 8 Nr. 7 verbietet die automatische Trennung ausdrücklich für
     Überschriften (der Browser trennt nach Wörterbuch, nicht nach
     Kompositum-Fuge, und in einer 32-px-Serif sieht man jeden Fehlgriff).
     `[overflow-wrap:anywhere]` BLEIBT: es fängt den pathologischen Fall — ein
     einzelnes Wort, das breiter ist als die Spalte — und bricht dann ohne
     Trennstrich, statt die Zeile zu sprengen. Zwei Regeln, zwei Aufgaben: keine
     Kosmetik-Trennung, aber auch kein Überlauf.
     A-1 (31.8.2026): die GRÖSSEN-Kaskade kommt aus dem EINEN Titel-Baustein
     (`components/ui/SeitenTitel`) und misst im Split-View die Pane-Breite statt
     des Viewports (Herleitung dort). Stimme, Umbruch-Regel und
     Höhen-Reservierung bleiben Aussagen DIESES Kopfes — sie stehen darum
     weiterhin hier, samt ihren Messungen oben. */
  const titel = (
    <SeitenTitel stimme="serif" className="[overflow-wrap:anywhere] min-h-titel-2z">
      {/* Ä-(d): die Kennung als eigene, nicht umbrechende Marke VOR dem Titel.
          Kein zweites Element neben der H1 und kein `aria-label`-Ersatz — sie
          ist Teil desselben Namens und bleibt darum in der Überschrift; nur
          ihre Stelle wechselt. `whitespace-nowrap`, damit «LugÜ» nie über zwei
          Zeilen reisst; der Punkt-Trenner ist `aria-hidden`, weil er die
          Aussprache nur unterbrechen würde. */}
      {kennung && (
        <>
          <span data-kopf-kennung className="whitespace-nowrap">{kennung}</span>
          <span aria-hidden className="mx-2 font-normal text-ink-300">·</span>
        </>
      )}
      {titelZeile}
    </SeitenTitel>
  );

  /* §15.2 — WARUM STAND UND STATUS EINE HÖHENFESTE ZELLE TEILEN (`standReserve`).
     Beide Zeilen wachsen NACH dem ersten Paint: der Standausweis kommt aus dem
     Currency-Sidecar, die Warnung aus dem Revisions-Sidecar. Der erste
     Bauversuch der Warnung (9.8.2026) setzte einen `lc-notice-warn`-Block ans
     Kopfende und wurde GEMESSEN rot — CLS 0.0227, Quelle laut
     layout-shift-`sources` das um 72 px nach unten gerutschte 2-Spalten-Grid
     (e2e/leser-kontext-e4 hält den Sidecar per Route bis NACH dem Start des
     CLS-Beobachters zurück, der Shift ist also reproduzierbar). Die Lehre daraus
     war «feste Zeile statt eigener Banner»; S3 behält sie und verallgemeinert
     sie: eine Zelle mit reservierter Höhe für BEIDE asynchronen Aussagen. Eine
     gemeinsame Zelle statt zwei Einzel-Reservierungen, weil sich die Zeilen den
     Platz teilen können — der Warnfall (lang, 5 von 227 Erlassen) trifft fast
     immer auf einen Standausweis, der auf derselben Breite kürzer ausfällt.
     Die Höhe ist GEMESSEN kalibriert (Tokens `kopf-stand*` in
     tailwind.config.js — dort stehen die vier Fenster-Werte samt Messfall),
     nicht geschätzt: schmal brechen dieselben Sätze über mehr Zeilen.
     S2 · Ä-(b): `tabular-nums` sitzt an der Stand-ZEILE (im Gerüst) — eine
     Auszeichnung für beide Daten, auch für das im String steckende.
     F5-Warnzeile: Klartext, nicht Tooltip. Der ganze Positions-11-Befund war,
     dass die Einschränkung nur dort stand, wo man sie erst NACH dem Lesen
     findet. «⚠» ist redundante Verstärkung des Wortes, nie alleiniger
     Bedeutungsträger (DESIGN-REGLEMENT B3) ⇒ aria-hidden. Ohne Warnung trägt
     die Zeile den unveränderten Grundhinweis — §8: «keine Warnung» heisst hier
     auch «noch nicht bekannt», also wird nichts Beruhigendes behauptet. */
  const ehrlichkeit = (
    <p className={`text-xs leading-snug ${warnung ? 'text-warn-700' : 'text-ink-500'}`}>
      {warnung
        ? <><span aria-hidden>⚠ </span>{warnung}</>
        : hinweis}
    </p>
  );

  /* Aktionen-Zeile (Skizze 4e): Icon + Label als ruhige Text-Links, keine
     Chip-Kästen. Ist-Verhalten unverändert — dieselben URLs, dasselbe
     target/rel, derselbe `aktionen`-Slot in derselben Reihenfolge.
     ── Ä110 (Live-Ästhetik-Prüfung 18.8.2026) · EIN ZIEL, EIN NAME ──────────
     GEMESSEN hiess DERSELBE Fedlex-Link an drei Stellen dreierlei: hier
     «↗ geltende Fassung», am Artikel und am Sektionskopf «amtliche Fassung ↗»,
     in der Übersichtsbox «geltende Fassung». Und die Zeile mischte die
     Schreibung: ein klein beginnendes Label neben zwei gross beginnenden
     («⧉ In neuem Reiter», «⬇ Amtliches PDF»).
     JETZT, nach dem Benennungs-Glossar (Design-Grundlage, Abschnitt
     «Benennung»): der Link heisst überall «Amtliche Fassung ↗» — der Pfeil
     HINTEN, weil er das Verlassen der Seite ankündigt und darum ans Ende der
     Beschriftung gehört, nicht davor. «geltende» fällt weg: es doppelt die
     Aussage der Stand-Zeile darüber und ist am aufgehobenen Erlass gerade
     falsch (dieser Zweig läuft dort ohnehin nicht — `lebt`). Alle
     Beschriftungen der Zeile beginnen jetzt gross; das ist die eine Schreibung,
     die Ä110 verlangt.
     B-1 (31.8.2026): der Wortlaut ist nicht mehr Literal, sondern kommt aus dem
     geteilten `QuellLink` — dasselbe Ziel hiess an vier Stellen viererlei,
     obwohl Ä110 seit dem 18.8. feststand. `.lc-chip` bleibt: das Gerüst
     neutralisiert die Chip-Anatomie im Band selbst (index.css,
     `.lc-kopf-aktionen`), der Slot-Vertrag ist unverändert. */
  const aktionenBand = (
    <>
      {erlass.quelleUrl && lebt && (
        <QuellLink href={erlass.quelleUrl} className="lc-chip" />
      )}
      {aktionen}
    </>
  );

  return (
    <LeserKopfGeruest
      overline={overline}
      titel={titel}
      fakten={fakten}
      stand={stand}
      standReserve
      ehrlichkeit={ehrlichkeit}
      aktionen={aktionenBand}
    >
      {/* §8-Ehrlichkeit: GANZ aufgehobener Erlass (jolux:dateNoLongerInForce). Der
          Snapshot bleibt als historische Fassung lesbar, wird aber unmissverständlich
          als aufgehoben ausgewiesen — Status-Banner (Design-Token danger, §13, kein
          Ad-hoc-Rot) mit amtlichem Live-Link + Nachfolger-Link. */}
      {erlass.aufgehoben && (
        <div role="status" className="lc-notice-danger text-body-s leading-snug space-y-1.5">
          <p>
            <strong className="font-semibold">Aufgehoben per <Datum iso={erlass.aufgehoben.seit} />.</strong>{' '}
            Dieser Erlass ist nicht mehr in Kraft. Der Text bleibt als historische Fassung
            (Stand <Datum iso={erlass.stand} />) abrufbar — {MASSGEBLICH_HALBSATZ}.
          </p>
          {/* ── B-1/B-2 (31.8.2026) · DAS BANNER BRACH Ä110 ────────────────────
              GEMESSEN: beide Links dieses Banners trugen den Pfeil VORNE und
              begannen klein («↗ amtliche (aufgehobene) Fassung») — drei Zeilen
              unter dem Kopf-Link, der seit Ä110 «Amtliche Fassung ↗» heisst.
              Die Aussage «derselbe Link auf die aufgehobene Konsolidierung»
              steht jetzt im Baustein (`variante`), nicht in einem zweiten,
              handgeschriebenen Wortlaut. Der Nachfolge-Erlass ist KEIN
              «amtliche Fassung»-Link und behält darum seinen eigenen Namen —
              aber dieselbe Anatomie (Pfeil hinten, gross beginnend). */}
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {/* ── Gegenprüfungs-Auflage PR #823 (12.9.2026) · DER NACHFOLGER
                KANN JETZT BEI UNS LIEGEN ─────────────────────────────────────
                Bis zur BMV-Totalrevision führte dieser Link IMMER nach
                fedlex.admin.ch — richtig, solange wir den Nachfolge-Erlass
                selbst nicht hatten. Seit `BMV_2025` im Korpus liegt, schickte
                er den Leser hinaus, obwohl die geltende Fassung einen Klick
                entfernt ist (§8). `erlassKeyVonEli` beantwortet die Frage
                deterministisch aus Register + FEDLEX-Tabelle (§5, keine
                zweite Wahrheit, Mehrdeutigkeit ⇒ kein Treffer).
                §7 BLEIBT GEWAHRT: die amtliche Fassung des Nachfolgers steht
                als eigener Link daneben — massgeblich ist nie unser Artefakt.
                Ohne Korpus-Key ist alles wie zuvor: ein einziger, externer
                Link (nie ein Sprung ins Leere). */}
            {erlass.aufgehoben.nachfolger && (() => {
              const n = erlass.aufgehoben.nachfolger;
              const nachfolgerKey = erlassKeyVonEli(n.eli);
              const amtlich = `https://www.fedlex.admin.ch/eli/${n.eli}/de`;
              const bezeichnung = (
                // Gegenprüfung PR #826 (A2-Nachzug): Inkrafttreten des Nachfolgers
                // nur aus dem belegten SSoT-Feld `nachfolger.inKraftSeit`
                // (`aufhebungen.ts`), nie aus dem Aufhebungsdatum des alten
                // Erlasses abgeleitet; fehlt es, entfällt die Klammer.
                <>
                  Nachfolge-Erlass: SR <span className="num">{n.sr}</span>
                  {n.inKraftSeit && (<> (in Kraft seit <Datum iso={n.inKraftSeit} />)</>)}
                </>
              );
              if (!nachfolgerKey) {
                return (
                  <QuellLink href={amtlich} className="underline hover:no-underline">
                    {bezeichnung}
                  </QuellLink>
                );
              }
              return (
                <>
                  <Link to={erlassPfadVonKey(nachfolgerKey)} className="underline hover:no-underline">
                    {bezeichnung} — Nachfolge-Erlass im Korpus
                  </Link>
                  <QuellLink href={amtlich} className="underline hover:no-underline">
                    Amtliche Fassung des Nachfolge-Erlasses
                  </QuellLink>
                </>
              );
            })()}
            {erlass.quelleUrl && (
              <QuellLink href={erlass.quelleUrl} variante="aufgehoben" className="underline hover:no-underline" />
            )}
          </p>
        </div>
      )}
      {/* §8-Nachzug (PR #614-Auflage): ausgewiesene Erlass-Lücke. Getrennt vom
          `standReserve`-Feld oben (§15.2, kalibrierte Höhe der Stand+Status-Zelle,
          Design-Token — nicht angefasst) und darum HIER, in der ohnehin variablen
          Kind-Zone, wie schon das Aufhebungs-Banner. Neutraler Ton (`.lc-notice`,
          kein `-warn`/`-danger`): eine benannte Auslassung ist kein Fehler, nur
          eine Tatsache (§8). Wortlaut UNVERÄNDERT aus dem Generator (§7 —
          nichts umformuliert, nichts geraten); bei mehreren Einträgen als Liste.
          Link-Quelle F1 (Gegenprüfung Opus, PR #616): `luecken.quelleUrl` ist bei
          allen 15 heutigen Einträgen identisch zu `erlass.quelleUrl` (unabhängig
          gemessen) — GENAU das Ziel, das oben schon als «Amtliche Fassung ↗»
          verlinkt ist (Ä110, EIN ZIEL EIN NAME), darum derselbe Kanon-Name statt
          des vorherigen, meist toten `erlass.pdfUrl` («Amtliches PDF» — 0 von 15
          Einträgen trugen ein pdfUrl, der Link fehlte live). `pdfUrl` bleibt
          Fallback für den (heute unbelegten) Fall eines Sidecars ohne quelleUrl. */}
      {luecken && luecken.hinweise.length > 0 && (
        <div role="note" className="lc-notice text-body-s leading-snug space-y-1.5">
          <p className="font-semibold">
            Nicht vollständig erfasst
            {luecken.quelleUrl
              ? <> — <QuellLink href={luecken.quelleUrl} /></>
              : erlass.pdfUrl
                ? <> — <QuellLink href={erlass.pdfUrl}>Amtliches PDF</QuellLink></>
                : null}
          </p>
          {luecken.hinweise.length === 1 ? (
            <p>{luecken.hinweise[0]}</p>
          ) : (
            <ul className="list-disc pl-5 space-y-1">
              {luecken.hinweise.map((h) => <li key={h}>{h}</li>)}
            </ul>
          )}
        </div>
      )}
    </LeserKopfGeruest>
  );
}
