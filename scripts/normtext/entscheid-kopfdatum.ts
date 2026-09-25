// ─── Entscheiddatum aus dem amtlichen Urteilskopf (QS-KORPUS, 25.9.2026) ──────
//
// Anlass: das OCL-`decision_date` ist bei kantonalen Gerichten oft NICHT das
// Entscheiddatum (Messung 25.9.2026, 20 von 24 Bestandsurteilen falsch): GR
// Mitteilungs-/Publikationsdatum (+6 … +62 Tage), BE +23 … +29, SG Datum des
// nachfolgenden BGer-Urteils bzw. Publikationsdatum, AG −2 … +61. Massgeblich
// ist das Datum, das das Gericht selbst in den Urteilskopf schreibt (§7/§8).
//
// Regel (deterministisch, §2): NUR der Kopf-Bereich — die ersten
// `KOPF_FENSTER_ZEICHEN` Zeichen, abgeschnitten vor dem ersten Stopp-Marker
// («in Sachen», «betreffend», «Gegenstand», «Parteien», «Besetzung», …). Danach
// beginnen Parteien/Vorinstanz, und dort stehen die typischen Fallen
// («betreffend Verfügung vom …», «Einspracheentscheid vom …»). Drei Formen:
//   1. Feld «Entscheiddatum: TT.MM.JJJJ» (SG-Publikationsplattform, BS-Portal)
//   2. «<Ort> <Gericht> TT.MM.JJJJ <Aktenzeichen>» — nur wenn das Aktenzeichen
//      des Entscheids selbst unmittelbar folgt (SG-Kopfzeile, Identitätsbeleg)
//   3. Titel + «vom T. Monat JJJJ» mit geschlossener Titel-Liste («Urteil»,
//      «Entscheid», «Beschluss», «Beschluss und Urteil», «Urteil des
//      Einzelrichters» …; ZH/BE/AG/GR/BS). Fremde Titel («Entscheid des
//      Versicherungsgerichts … vom», «Urteil des Bundesgerichts vom») greifen
//      bewusst NICHT — das sind Zitate, nicht der eigene Kopf.
// Liefern mehrere Formen VERSCHIEDENE Daten, gilt das Ergebnis als Widerspruch
// (nie raten, §1) — der Aufrufer behält dann den Quellwert und meldet es.
// Ein Titel schlägt ein abweichendes Plattform-Datum im selben Kopf NUR mit
// Identitätsbeleg (eigenes Aktenzeichen, `titelBelegt`) — Gegenprüfung #1126:
// sonst gewänne ein Fremd-Zitat («…; Urteil vom 22. Dezember 2025», BGer).
// Aktenzeichen-Identität (`aktenzeichenRe`): Leerzeichen/Punkt gleichwertig
// (BE-PDF «100.2025.363U» = «100 2025 363»), verbundene Verfahren, eng.
// Nicht erfasst (im Bestand 25.9.2026 nicht vorhanden): fr./it. Kopfformen —
// sie fallen ehrlich auf «fehlt» zurück.

export const KOPF_FENSTER_ZEICHEN = 1500;

const MONATE: Record<string, string> = {
  Januar: '01', Februar: '02', März: '03', April: '04', Mai: '05', Juni: '06',
  Juli: '07', August: '08', September: '09', Oktober: '10', November: '11', Dezember: '12',
};
const MONAT_ALT = Object.keys(MONATE).join('|');

/** Stopp-Marker: ab hier Parteien, Vorinstanz, Gegenstand, Sachverhalt (nicht mehr Kopf). */
const STOPP_RE = /(?<![\p{L}])(?:in Sachen|betreffend|Gegenstand|Parteien|Besetzung|Beteiligte|Sachverhalt|Erwägungen?|Anfechtungsobj)(?![\p{L}])/u;

/**
 * Geschlossene Titel-Liste des EIGENEN Entscheids (Gross- und Versalform).
 * «Verfügung» fehlt bewusst: im Kopf ist sie fast immer das Anfechtungsobjekt
 * (BS IV.2021.50, Portal-Titel «IVG Verfügung vom 22. März 2021» vor «URTEIL vom
 * 3. Februar 2022», Messung 25.9.2026); kein Bestandsurteil trägt sie als Titel.
 * Lieber ehrlich «fehlt» (Rückfall) als ein Vorinstanz-Datum.
 */
const TITEL = [
  'Beschluss und Urteil', 'Urteil und Beschluss', 'Zwischenentscheid', 'Teilentscheid',
  'Endentscheid', 'Zirkulationsbeschluss', 'Urteil', 'Entscheid', 'Beschluss',
  'URTEIL', 'ENTSCHEID', 'BESCHLUSS',
].join('|');
/** Zulässiger Zusatz zwischen Titel und «vom» (Spruchkörper des eigenen Gerichts). */
const ZUSATZ = '(?: (?:des|der) (?:Einzelrichters|Einzelrichterin|Präsidenten|Präsidentin|Vizepräsidenten|Vizepräsidentin|Instruktionsrichters|Instruktionsrichterin|Abteilungspräsidenten|Abteilungspräsidentin|Kammerpräsidenten|Kammerpräsidentin))?';
const TITEL_VOM_RE = new RegExp(
  `(?<![\\p{L}])(?:${TITEL})${ZUSATZ} ?vom ?(\\d{1,2})\\. ?(${MONAT_ALT}) (\\d{4})(?![\\d])`, 'u',
);
const FELD_RE = /Entscheiddatum ?: ?(\d{1,2})\.(\d{1,2})\.(\d{4})(?!\d)/;

export type KopfdatumRegel = 'feld-entscheiddatum' | 'kopfzeile-datum-az' | 'titel-vom';

export interface KopfKandidat { datum: string; regel: KopfdatumRegel; beleg: string }

export type Kopfdatum =
  | (KopfKandidat & { status: 'ok'; /** abweichende Plattform-Angaben (nur Bericht) */ abweichung: KopfKandidat[] })
  | { status: 'fehlt' }
  | { status: 'widerspruch'; kandidaten: KopfKandidat[] };

/**
 * Wörter, nach denen ein «Urteil/Entscheid … vom» ein ZITAT ist, nicht der
 * eigene Titel: «wurde mit Urteil vom 22. Dezember 2025 abgewiesen» (SG-
 * Publikationsdeckblatt, BGer-Nachgang), «(Urteil vom …», «gegen den Entscheid
 * vom …». Der eigene Titel steht im Kopf nach Kammer/Aktenzeichen/Namen.
 * Kleingeschriebene Vorwörter gelten auch mit grossem Anfangsbuchstaben am
 * Satzanfang: BE-PDF 200 2026 230, Seite 3 (Kopfzeile mit eigenem
 * Aktenzeichen), «Mit Entscheid vom 5. März 2026 (act. II 11)» ist die
 * Vorinstanz, amtlich ist das Urteil vom 20. Mai 2026 (Messung 25.9.2026).
 * Nur der Anfangsbuchstabe, keine Versalien; Eigennamen bleiben exakt.
 */
const ZITAT_VORWOERTER = ['mit', 'durch', 'dem', 'den', 'das', 'die', 'der', 'des', 'im', 'in', 'zum', 'zur', 'gegen', 'ans', 'an', 'laut', 'gemäss', 'vgl.', 'dieses', 'diesem', 'diesen', 'einem', 'einen', 'ein', 'eine', 'seinem', 'ihrem', 'sein', 'ihr', 'und', 'oder', 'sowie', 'bzw.', 'Bundesgericht', 'Bundesgerichts', 'BGer'];

/** Whitespace (inkl. NBSP/U+202F) kollabieren. */
const flach = (s: string): string => s.replace(/[\u00a0\u202f]/g, ' ').replace(/\s+/g, ' ').trim();

const escRe = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const satzanfang = (w: string): string =>
  /^\p{Ll}/u.test(w) ? `[${w[0]}${w[0].toUpperCase()}]${escRe(w.slice(1))}` : escRe(w);
const ZITAT_VORWORT_RE = new RegExp(`(?:^|[\\s(])(?:${ZITAT_VORWOERTER.map(satzanfang).join('|')})[:,]?\\s?$|[(;]\\s?$`, 'u');

/**
 * Aktenzeichen-Muster (eng, §1): Leerzeichen und Punkt als Trenner gleichwertig
 * (BE-PDF «100.2025.363U» = OCL «100 2025 363», Messung 25.9.2026); rein
 * numerische Aktenzeichen zusätzlich mit belegtem BE-Suffix («…363U», nur U) und
 * verbundenen Verfahren («100.2026.142/143» deckt 142 und 143). Mehrere
 * Aktenzeichen («B 2024/58, B 2024/59») einzeln; eine Jahres-Gruppe vor der
 * laufenden Nummer auch zweistellig (GR «SBK 26 38»). Kein Präfix-/Suffix-Treffer:
 * davor/danach keine Ziffer/kein Buchstabe, danach auch kein «.<Ziffer>».
 * Leer ⇒ null. Exportiert für Tests.
 */
/** Belegte BE-Aktenzeichen-Suffixe (Verwaltungsgericht «100.2025.363U»); erweitern nur mit Beleg. */
const BE_SUFFIX = '(?:U)';

export function aktenzeichenRe(docket: string | null | undefined): RegExp | null {
  const alts = flach(String(docket ?? '')).split(/\s*,\s*/).map((az) => {
    const g = az.split(/[ .]+/).filter(Boolean);
    if (!g.length) return '';
    const numerisch = g.every((x) => /^\d+$/.test(x));
    const letzte = escRe(g[g.length - 1]);
    // Suffix nur die belegte BE-Form «U» (Bestand 25.9.2026: 12× «…U», kein anderer
    // Buchstabe) — «100.2025.363V» ist nicht als identisch belegt (Nachprüfung 25.9.2026);
    // verbundene Verfahren ganz gelesen, damit «142/143V» nicht über «142» durchrutscht.
    const ende = numerisch ? `(?:\\d+/)*${letzte}(?:/\\d+)*${BE_SUFFIX}?(?!/\\d)` : letzte;
    // GR-Referenz mit Kurzjahr: «SBK 26 38» = «SBK 2026 38» (PDF-Kopf, Messung 25.9.2026).
    const jahr = (x: string) => (/^(?:19|20)\d{2}$/.test(x) ? `(?:${x.slice(0, 2)})?${x.slice(2)}` : escRe(x));
    return [...g.slice(0, -1).map(jahr), ende].join('[ .]');
  }).filter(Boolean);
  return alts.length ? new RegExp(`(?<![\\p{L}\\d.])(?:${alts.join('|')})(?![\\p{L}\\d]|\\.\\d)`, 'u') : null;
}

/**
 * Identitätsbeleg für einen Titel (nur nötig, wenn im selben Kopf ein
 * abweichendes Plattform-Datum steht): (a) der Kopf zitiert den Entscheid selbst
 * mit DIESEM Datum und dem EIGENEN Aktenzeichen («vom 4. August 2025, BV 2024/21»,
 * SG-Regeste; «vom 20.08.2026, Nr. 100.2025.363U», BE-Fusszeile), oder (b) das
 * eigene Aktenzeichen steht unmittelbar vor dem Titel, ohne Satzzeichen dazwischen
 * und nicht als Teil einer Plattform-Kopfzeile «TT.MM.JJJJ Az(, Az)*» (an keiner
 * Stelle der Liste) (AG «XBE.2025.10 Entscheid vom», BS «AK.2022.32 ENTSCHEID vom»).
 */
function titelBelegt(kopf: string, titelIndex: number, datum: string, az: RegExp | null): boolean {
  if (!az) return false;
  const zitat = new RegExp(`vom ?(?:(\\d{1,2})\\. ?(${MONAT_ALT}) (\\d{4})|(\\d{1,2})\\.(\\d{1,2})\\.(\\d{4})),? (?:Nr\\. ?)?(?:${az.source})`, 'gu');
  for (const m of kopf.matchAll(zitat)) {
    const d = m[1] ? iso(m[3], MONATE[m[2]], m[1]) : iso(m[6], m[5], m[4]);
    if (d === datum) return true;
  }
  // Kein Aktenzeichen einer Plattform-Kopfzeile «TT.MM.JJJJ Az(, Az)*» — auch nicht
  // das zweite, dem nur «, » vorangeht (Gegenprüfung 25.9.2026, SG «03.02.2025
  // B 2024/58, B 2024/59 Entscheid vom 14. Januar 2026 des Bundesgerichts»).
  // Die ganze Kopfzeile wird darum vor der Prüfung durch einen Stopp ersetzt.
  const kopfzeile = new RegExp(`(?<![\\d.])\\d{2}\\.\\d{2}\\.\\d{4} (?:${az.source})(?:(?:, ?| und )(?:${az.source}))*`, 'gu');
  const vor = kopf.slice(0, titelIndex).replace(kopfzeile, ';');
  return new RegExp(`(?:${az.source})[^.;:()«»]{0,30}$`, 'u').test(vor);
}

/** ISO-Datum mit Kalender-Gegenprobe («31. April» ist kein Datum) und Jahres-Rahmen. */
function iso(jahr: string, monat: string, tag: string): string | null {
  const s = `${jahr}-${monat.padStart(2, '0')}-${tag.padStart(2, '0')}`;
  const d = new Date(`${s}T00:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s) return null;
  const j = Number(jahr);
  if (j < 1875 || j > 2100) return null;
  return s;
}

/** Der Kopf-Bereich: Fensteranfang bis vor den ersten Stopp-Marker. Exportiert für Tests. */
export function kopfBereich(fullText: string): string {
  const t = flach(fullText).slice(0, KOPF_FENSTER_ZEICHEN);
  const m = STOPP_RE.exec(t);
  return m ? t.slice(0, m.index) : t;
}

/**
 * pdfjs zerlegt gesperrt gesetzte Tagesziffern in Einzel-Items («Entscheid vom
 * 2 1 . August 2025», AG-PDF 25.9.2026). Nur diese Form wird zusammengeführt —
 * Ziffern unmittelbar vor «. <Monat>» —, sonst nichts (kein allgemeines
 * Ziffern-Kleben, das Aktenzeichen verfälschen könnte). Rein (§2).
 */
export function pdfKopfNormalisieren(text: string): string {
  return flach(text)
    .replace(new RegExp(`(?<=\\d) (?=\\d ?\\. ?(?:${MONAT_ALT}) \\d{4})`, 'gu'), '')
    .replace(new RegExp(`(?<=\\d) \\.(?= ?(?:${MONAT_ALT}) \\d{4})`, 'gu'), '.');
}

/**
 * Entscheiddatum aus dem amtlichen Urteilskopf. Rein (§2). `docket` ist das
 * Aktenzeichen des Entscheids selbst (nur für Form 2 gebraucht).
 *
 * Vorrang: der EIGENE Titel im Kopf («Entscheid vom 4. August 2025») schlägt
 * die Plattform-Angaben (Feld «Entscheiddatum:», Kopfzeile «TT.MM.JJJJ Az»):
 * Beleg SG BV 2024/21 und UV 2025/14 (25.9.2026) — Plattform 04.07.2025 bzw.
 * 23.10.2025, der Urteilskopf selbst 4. August bzw. 21. Oktober 2025. Die
 * abweichende Plattform-Angabe wird als `abweichung` mitgegeben (Bericht).
 * Das gilt nur mit Identitätsbeleg (`titelBelegt`; BV 2024/21: «vom 4. August
 * 2025, BV 2024/21» im Kopf); ohne ihn ⇒ `widerspruch` (Gegenprüfung #1126).
 * Widersprechen sich ohne eigenen Titel die Plattform-Angaben untereinander,
 * ist das Ergebnis `widerspruch` (nie raten, §1).
 */
export function kopfEntscheiddatum(fullText: string | null | undefined, docket?: string | null): Kopfdatum {
  if (typeof fullText !== 'string' || !fullText.trim()) return { status: 'fehlt' };
  const kopf = kopfBereich(fullText);
  const plattform: KopfKandidat[] = [];

  const f = FELD_RE.exec(kopf);
  if (f) {
    const d = iso(f[3], f[2], f[1]);
    if (d) plattform.push({ datum: d, regel: 'feld-entscheiddatum', beleg: f[0] });
  }
  const az = aktenzeichenRe(docket);
  if (az) {
    const re = new RegExp(`(?<![\\d.])(\\d{2})\\.(\\d{2})\\.(\\d{4}) (?:${az.source})`, 'u');
    const k = re.exec(kopf);
    if (k) {
      const d = iso(k[3], k[2], k[1]);
      if (d) plattform.push({ datum: d, regel: 'kopfzeile-datum-az', beleg: k[0] });
    }
  }
  let titel: KopfKandidat | null = null;
  let titelIndex = 0;
  for (const t of kopf.matchAll(new RegExp(TITEL_VOM_RE.source, 'gu'))) {
    if (ZITAT_VORWORT_RE.test(kopf.slice(Math.max(0, (t.index ?? 0) - 16), t.index))) continue;
    const d = iso(t[3], MONATE[t[2]], t[1]);
    if (d) { titel = { datum: d, regel: 'titel-vom', beleg: t[0] }; titelIndex = t.index ?? 0; break; }
  }

  if (titel) {
    const abweichung = plattform.filter((p) => p.datum !== titel.datum);
    // Abweichendes Plattform-Datum im selben Kopf: Titel nur mit Identitätsbeleg (§1).
    if (abweichung.length && !titelBelegt(kopf, titelIndex, titel.datum, az)) return { status: 'widerspruch', kandidaten: [titel, ...plattform] };
    return { status: 'ok', ...titel, abweichung };
  }
  if (!plattform.length) return { status: 'fehlt' };
  if (new Set(plattform.map((k) => k.datum)).size > 1) return { status: 'widerspruch', kandidaten: plattform };
  return { status: 'ok', ...plattform[0], abweichung: [] };
}
