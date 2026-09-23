// ─── Normrevisions-Extrakt: reine Parser-Schicht (V1c) ──────────────────────
//
// FAHRPLAN-VERZAHNUNG-UI §V1c (David-Input 3.7.2026): «da gesetze immer wieder
// revision haben kann ein alter entscheid nicht unbesehen an die norm angehängt
// werden sofern sich die norm revidiert hat.» Aus den amtlichen Revisions-
// Fussnoten der Struktur-Sidecars (`public/normtext/struktur/bund/*.json`) ist je
// Artikel das Datum der LETZTEN Textänderung deterministisch ableitbar — quell-
// belegt über das AS-Zitat, ohne Heuristik (§2/§7).
//
// Reine, deterministische Datenschicht (§2/§3): kein `new Date(string)` (Zeitzonen-
// Falle, CLAUDE-Lektion), keine Netz-/Laufzeit-Abhängigkeit — nur String-Parsing.
// Dieselben Funktionen speisen den Build-Generator (scripts/verzahnung/…) UND die
// Unit-Tests (EIN Ort, §5).

/**
 * Artikel-Token kanonisieren. Die Struktur-Sidecars und `NormSnapshot.artikel`
 * nutzen die eId-nahe Unterstrich-Form (`216_c`, `663_b_bis`, `226_a_226_d`),
 * die Zitat-Extraktion/`passus.artikelToken` die kompakte Form (`216c`). Diese
 * Kanonisierung (Kleinschrift, ohne Whitespace UND Unterstriche) bringt BEIDE
 * Konventionen auf EINEN Schlüssel, sodass der GesetzLeser (`216_c`) und der
 * EntscheidLeser (`216c`) denselben Revisions-Eintrag treffen.
 */
export function kanonArtikelToken(s: string): string {
  return String(s).toLowerCase().replace(/[\s_]+/g, '');
}

// Deutsche Monatsnamen → Monatszahl. Deckt die im Bestand belegten amtlichen
// Fedlex-Abkürzungen (Jan./Febr./März/April/Mai/Juni/Juli/Aug./Sept./Okt./Nov./
// Dez.) UND die ausgeschriebenen Formen ab (defensiv, deterministisch).
const MONATE: Readonly<Record<string, string>> = {
  jan: '01', januar: '01',
  feb: '02', febr: '02', februar: '02',
  märz: '03', maerz: '03', mrz: '03',
  apr: '04', april: '04',
  mai: '05',
  jun: '06', juni: '06',
  jul: '07', juli: '07',
  aug: '08', august: '08',
  sep: '09', sept: '09', september: '09',
  okt: '10', oktober: '10',
  nov: '11', november: '11',
  dez: '12', dezember: '12',
};

/**
 * «1. Jan. 2017» → «2017-01-01». Rein lokale ISO-Konstruktion (kein `new Date`),
 * damit ISO-String-Vergleiche stimmen und keine Zeitzone reinspielt. Ungültiger
 * Monatsname / Tag / Jahr → null (kein Rateversuch).
 */
export function parseDeutschesRevisionsdatum(tag: string, monat: string, jahr: string): string | null {
  const mm = MONATE[monat.toLowerCase().replace(/\.$/, '')];
  if (!mm) return null;
  const t = Number(tag);
  const y = Number(jahr);
  if (!Number.isInteger(t) || t < 1 || t > 31) return null;
  if (!Number.isInteger(y) || y < 1848 || y > 2100) return null;   // Bundesstaat 1848 → Puffer
  return `${String(y).padStart(4, '0')}-${mm}-${String(t).padStart(2, '0')}`;
}

/** Ein datierter Textänderungs-Beleg: Inkraft-/Wirkungsdatum + AS-Fundstelle. */
export interface ArtikelRevision {
  /** ISO-Datum der Inkraftsetzung der letzten Textänderung (max über alle Fussnoten). */
  iso: string;
  /** Amtliche Fundstelle («AS 2016 4651»), leer wenn im Fussnotentext nicht auffindbar. */
  as: string;
}

// Die DREI amtlichen Formulierungen einer DATIERTEN Textänderung: «Fassung
// gemäss …, in Kraft seit <Datum>» (Neufassung/Einfügung), «Aufgehoben durch …,
// mit Wirkung seit <Datum>» (Absatz-Aufhebung = ebenfalls Textänderung) und
// «…, in Kraft vom <Datum> bis zum <Datum>» (BEFRISTETE Inkraftsetzung, z. B.
// AHVG Art. 34bis, VTS Art. 95; H1-Gegenprüfung W2·5i 26.7.2026). Alle tragen
// eine AS-Fundstelle. Massgeblich ist bei der befristeten Form das ANFANGS-
// Datum (= Datum der Textänderung). «der V vom <Datum>» (Erlass-Datum) triggert
// bewusst NICHT — nur die wörtliche Wendung «in Kraft vom».
const TRIGGER_RE = /in Kraft seit|mit Wirkung seit|in Kraft vom/g;
// Datum irgendwo am KLAUSEL-Anfang (nicht starr direkt nach «seit»): Fedlex trägt
// belegte Tippfehler «… seit seit 1. Jan. 2017» (BVG Art. 34a) und «… seit. 1. Jan.
// 2001» (AVIV Art. 99) — das Datum sitzt dann ein paar Zeichen hinter dem Trigger.
const DATUM_RE = /(\d{1,2})\.\s*([A-Za-zäöü]+)\.?\s*(\d{4})/;
// Jahr-Ellipse der befristeten Form: «in Kraft vom 21. März bis zum 20. Sept.
// 2020» (AHVV Art. 41bis) — das Jahr steht amtlich nur beim END-Datum und gilt
// für beide. Tag/Monat kommen vom ANFANGS-Datum (Gruppen 1+2), das Jahr vom
// END-Datum (Gruppe 3). Diese Form MUSS vor DATUM_RE geprüft werden, sonst
// griffe DATUM_RE das einzige Voll-Datum — das Ablauf-Datum — als Revisions-
// datum (falsche Chronologie, §1).
const DATUM_ELLIPSE_RE = /(\d{1,2})\.\s*([A-Za-zäöü]+)\.?\s+bis\s+(?:längstens\s+)?(?:zum\s+)?\d{1,2}\.\s*[A-Za-zäöü]+\.?\s*(\d{4})/;
// AS-Fundstelle tolerant gegen Bold/Italic-Umschliessung UND fehlendes Leerzeichen
// nach «AS» (belegt: «AS<b> 2007</b> 5259», AHVG Art. 92a).
const AS_RE = /AS\s*(?:<[^>]*>\s*)*(\d{4})(?:\s*<[^>]*>)*\s+(\d+)/;
// Wie weit hinter dem Trigger das Klausel-Datum noch als «zu diesem Trigger gehörig»
// gilt (deckt «seit »/«seit. »/«dem »-Präfixe, verhindert das Greifen eines fernen
// Datums aus einer anderen Klausel).
const DATUM_FENSTER = 24;
// Fremd-adressierte Klausel (Gegenprüfungs-Befund F1, Opus 26.7.2026): In
// Gliederungstitel-Fussnoten adressiert der Gesetzgeber einzelne Klauseln an
// einen ANDEREN Artikel — «…, in Kraft seit 1. Jan. 2024, Art. 40c in Kraft vom
// 1. Jan. 2025 …» (AHVG, Host des Sidecars: Art. 39) bzw. «…, Art. 734f in
// Kraft seit 1. Jan. 2021 …» (OR, Host: Art. 732; korpusweit die einzigen zwei
// Fälle, Zensus 26.7.2026). Eine Klausel, der unmittelbar «Art. <Nr>» vorangeht,
// datiert NUR den genannten Artikel: sie zählt für den Host allein bei
// Token-Gleichheit; ohne bekannten Host konservativ nie (§1: lieber kein
// Datum aus der Klausel als ein fremdes).
const ART_PRAEFIX_RE = /Art\.\s*(\d+\s*(?:<[^>]+>|[a-zäöü])*)\s*$/;
// Bewusste Grenze des Wächters (Gegenprüfung R2, B1): Er greift nur bei «Art.
// <Nr>» UNMITTELBAR (nur Whitespace) vor dem Trigger und innerhalb 40 Zeichen.
// Intra-artikuläre Zusätze («Art. 40c Abs. 2 … in Kraft vom»), Bereichs-/
// Plural-Nennungen («Art. 40c–40e», «Art. 40c und 40d») oder grösserer Abstand
// blieben Scope-Lecks — korpusweit unbesetzt (Zensus 26.7.2026, 7 Vorkommen
// alle abgedeckt; «Fassung gemäss Art. 127 hiernach, in Kraft seit» im AIG ist
// KEINE Fremd-Adressierung und darf nicht feuern). Bei künftigen Fedlex-
// Wortlauten dieser Form: Zensus in bibliothek/normtext/artikel-revisionen-
// fussnotenformen-2026-07-26.md wiederholen.
const PRAEFIX_FENSTER = 40;

/**
 * Spätester datierter Textänderungs-Beleg in EINER Fussnote (+ AS-Fundstelle aus
 * derselben Klausel). Kein datierter Beleg → null.
 *
 * W2·5i: als eigene Funktion herausgezogen, weil die Chronologie-Ansicht des
 * Gesetz-Lesers das Datum JE FUSSNOTE braucht (Sortierschlüssel), nicht nur das
 * Maximum je Artikel. Ein zweiter Datums-Parser daneben wäre eine zweite Wahrheit
 * (§5) — die Trigger-/Datums-/AS-Muster, das Trigger-Fenster, die Jahr-Ellipse UND
 * der Fremd-Adressierungs-Wächter leben weiterhin genau hier.
 * `extrahiereArtikelRevision` ist danach das Maximum über die Fussnoten und
 * verhält sich unverändert (gleiche Vergleichs- und Tie-Break-Semantik: `>` behält
 * bei Gleichstand den ERSTEN Fund).
 *
 * `hostToken` = kanonischer Token des Artikels, dem die Fussnote gehört. Er ist
 * für den Fremd-Adressierungs-Wächter (ART_PRAEFIX_RE) nötig und MUSS von jedem
 * Aufrufer durchgereicht werden, der ihn kennt: fehlt er, verwirft der Wächter
 * jede fremd-adressierte Klausel konservativ (§1 — lieber kein Datum als ein
 * fremdes), was ohne Not Daten kostet.
 */
function extrahiereFussnotenRevision(text: string, hostToken?: string): ArtikelRevision | null {
  let best: ArtikelRevision | null = null;
  TRIGGER_RE.lastIndex = 0;
  let tm: RegExpExecArray | null;
  while ((tm = TRIGGER_RE.exec(text)) !== null) {
    const vorher = text.slice(Math.max(0, tm.index - PRAEFIX_FENSTER), tm.index);
    const ap = ART_PRAEFIX_RE.exec(vorher);
    if (ap && kanonArtikelToken(ap[1].replace(/<[^>]*>/g, '')) !== hostToken) continue;
    const nachTrigger = tm.index + tm[0].length;
    const rest = text.slice(nachTrigger);
    // Jahr-Ellipse ZUERST (spezifischere Form; Begründung bei DATUM_ELLIPSE_RE).
    let dm = DATUM_ELLIPSE_RE.exec(rest);
    if (dm && dm.index > DATUM_FENSTER) dm = null;
    if (!dm) {
      dm = DATUM_RE.exec(rest);
      if (!dm || dm.index > DATUM_FENSTER) continue; // Datum gehört nicht zu diesem Trigger
    }
    const iso = parseDeutschesRevisionsdatum(dm[1], dm[2], dm[3]);
    if (!iso) continue;
    if (!best || iso > best.iso) {
      // AS-Fundstelle NACH dem Datum, innerhalb DERSELBEN Fussnote: eine
      // Enactment-AS gilt für die ganze Fassung — auch wenn eine Fussnote
      // gestaffelte In-Kraft-Daten trägt (BVG Art. 64, OR Art. 732/927) und die
      // AS erst hinter dem zweiten Datum steht.
      const am = AS_RE.exec(rest.slice(dm.index + dm[0].length));
      best = { iso, as: am ? `AS ${am[1]} ${am[2]}` : '' };
    }
  }
  return best;
}

/**
 * Max Trigger-Datum («in Kraft seit» / «mit Wirkung seit» / «in Kraft vom») über
 * ALLE Fussnoten eines Artikels → das Datum der letzten Textänderung + zugehörige
 * AS-Fundstelle (aus DERSELBEN Klausel). Kein datierter Beleg (Urfassung / nur
 * SR-Verweis-Fussnote) → null. `hostToken` = kanonischer Token des Artikels, dem
 * die Fussnoten gehören (für den Fremd-Adressierungs-Wächter, s. ART_PRAEFIX_RE).
 */
export function extrahiereArtikelRevision(
  fussnoten: ReadonlyArray<{ text?: string }> | undefined,
  hostToken?: string,
): ArtikelRevision | null {
  let best: ArtikelRevision | null = null;
  for (const fn of fussnoten ?? []) {
    const kandidat = extrahiereFussnotenRevision(fn.text ?? '', hostToken);
    if (kandidat && (!best || kandidat.iso > best.iso)) best = kandidat;
  }
  return best;
}

/** Ein Struktur-Artikel-Knoten, soweit für den Revisions-Extrakt relevant. */
export interface StrukturArtikel {
  fussnoten?: { text?: string }[];
}

/**
 * Ein Erlass-Sidecar → `{ token → Revision }` (nur Artikel MIT datiertem Beleg).
 * Kanonische Token; bei Token-Kollision (mehrere Sidecar-Keys auf denselben
 * Token) gewinnt deterministisch das spätere Datum.
 */
export function baueRevisionProArtikel(
  artikel: Readonly<Record<string, StrukturArtikel>>,
): Record<string, ArtikelRevision> {
  const proArtikel: Record<string, ArtikelRevision> = {};
  for (const [key, node] of Object.entries(artikel)) {
    const token = kanonArtikelToken(key);
    const rev = extrahiereArtikelRevision(node?.fussnoten, token);
    if (!rev) continue;
    const vorhanden = proArtikel[token];
    if (!vorhanden || rev.iso > vorhanden.iso) proArtikel[token] = rev;
  }
  return proArtikel;
}
