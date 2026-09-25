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
 */
const ZITAT_VORWORT_RE = /(?:^|[\s(])(?:mit|durch|dem|den|das|die|der|des|im|in|zum|zur|gegen|ans|an|laut|gemäss|vgl\.|dieses|diesem|diesen|einem|einen|ein|eine|seinem|ihrem|sein|ihr|und|oder|sowie|bzw\.)\s?$|\(\s?$/;

/** Whitespace (inkl. NBSP/U+202F) kollabieren. */
const flach = (s: string): string => s.replace(/[  ]/g, ' ').replace(/\s+/g, ' ').trim();

const escRe = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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
  const az = flach(String(docket ?? ''));
  if (az) {
    const re = new RegExp(`(?<![\\d.])(\\d{2})\\.(\\d{2})\\.(\\d{4}) ${escRe(az)}(?![\\p{L}\\d])`, 'u');
    const k = re.exec(kopf);
    if (k) {
      const d = iso(k[3], k[2], k[1]);
      if (d) plattform.push({ datum: d, regel: 'kopfzeile-datum-az', beleg: k[0] });
    }
  }
  let titel: KopfKandidat | null = null;
  for (const t of kopf.matchAll(new RegExp(TITEL_VOM_RE.source, 'gu'))) {
    if (ZITAT_VORWORT_RE.test(kopf.slice(Math.max(0, (t.index ?? 0) - 12), t.index))) continue;
    const d = iso(t[3], MONATE[t[2]], t[1]);
    if (d) { titel = { datum: d, regel: 'titel-vom', beleg: t[0] }; break; }
  }

  if (titel) return { status: 'ok', ...titel, abweichung: plattform.filter((p) => p.datum !== titel.datum) };
  if (!plattform.length) return { status: 'fehlt' };
  if (new Set(plattform.map((k) => k.datum)).size > 1) return { status: 'widerspruch', kandidaten: plattform };
  return { status: 'ok', ...plattform[0], abweichung: [] };
}
