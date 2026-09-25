// ─── Kantonales Entscheiddatum aus dem amtlichen Urteilskopf (QS-KORPUS) ─────
//
// Auszug aus adapter-entscheide.ts (§6.6, 25.9.2026). Regel-Kern:
// entscheid-kopfdatum.ts; hier die Anwendung auf einen OCL-Entscheid und der
// Netz-Rückfall auf das amtliche PDF. Angewandt in `mappeEntscheidOCL`.

import { kopfEntscheiddatum, kopfBereich, pdfKopfNormalisieren, aktenzeichenRe, type Kopfdatum } from './entscheid-kopfdatum';
import { RECHTSPRECHUNG_UA } from './clir-regeste';

/** Die genutzten Felder eines OCL-Entscheids (strukturell, ohne Import-Zyklus). */
interface OclKopfFelder { full_text?: unknown; docket_number?: unknown; decision_date?: unknown; canton?: unknown; pdf_url?: unknown; source_url?: unknown }

/**
 * Herkunft des übernommenen Kantons-Entscheiddatums (Bericht/Log, kein Snapshot-Feld).
 * `plattform-ohne-kopf`: Plattform-Angabe im OCL-Kopf (SG-Kopfzeile, «Entscheiddatum:»)
 * ohne eigenen Titel, und das amtliche PDF, das den Kopf trüge, kam nicht (Befund
 * 25.9.2026: SG-PDF von UV 2025/14 nach 43 s, Plattform 23.10. statt Kopf 21.10.2025).
 */
export type KantonsDatumQuelle = 'kopf-ocl-volltext' | 'kopf-amtliches-pdf' | 'plattform-ohne-kopf' | 'ocl-decision_date';

/**
 * Seitenkopf für das Sicherheitsnetz (Zeichen ab Seitenanfang, flach): der
 * eigene Titel steht im Bestand 25.9.2026 an Stelle 47 … 329 (42 PDF-Köpfe,
 * ZH am weitesten); Zitate im Fliesstext der Folgeseiten stehen dahinter.
 */
const SEITENKOPF_ZEICHEN = 400;
/** Titel steht im Seitenkopf (gilt für Seiten mit UND ohne erkanntes eigenes Aktenzeichen). */
const imSeitenkopf = (seite: string, beleg: string): boolean => kopfBereich(seite).indexOf(beleg) < SEITENKOPF_ZEICHEN;

/**
 * Entscheiddatum eines KANTONALEN Entscheids (QS-KORPUS, Entscheid David 25.9.2026):
 * der amtliche Urteilskopf gewinnt, das OCL-`decision_date` ist nur Rückfall.
 * Reihenfolge: (1) eigener Titel im OCL-Volltext-Kopf; (2) eigener Titel im Kopf
 * einer Seite des amtlichen PDF (SG-Deckblatt-Fall); (3) Plattform-Angabe im
 * OCL-Kopf («Entscheiddatum:», SG-Kopfzeile); (4) OCL-`decision_date`. Rein (§2).
 * Eine PDF-Seite zählt nur, wenn SIE SELBST das EIGENE Aktenzeichen trägt
 * (Identität, `aktenzeichenRe`: auch BE-Punktform «100.2025.363U»). Ein
 * `widerspruch` im OCL-Kopf setzt KEIN Kopfdatum (OCL-Wert, gemeldet über
 * `kopfdatumRueckfallMeldung`; der Bestands-Refresh bricht ab).
 * Sicherheitsnetz (Gegenprüfung 25.9.2026): trägt eine andere Seite das eigene
 * Aktenzeichen, steht aber ein ABWEICHENDER Titel im Seitenkopf einer Seite, auf
 * der es nicht erkannt wird (pdfjs-Zerlegung, die `aktenzeichenRe` nicht kennt),
 * gewinnt nie still das Plattformdatum: `widerspruch` wie im OCL-Kopf.
 * Der Bund-Pfad (canton 'CH') ruft das NICHT auf — dort stimmt decision_date
 * (Stichprobe 25.9.2026: 13/13 bger/bvger/bstger mit Kopf identisch).
 */
export function kantonsEntscheiddatum(
  det: OclKopfFelder,
  amtlicheKopfSeiten?: string[] | null,
): { datum: string; quelle: KantonsDatumQuelle; kopf: Kopfdatum; grund?: string; pdfFehlt?: true } {
  const docket = String(det.docket_number ?? '');
  const ocl = kopfEntscheiddatum(typeof det.full_text === 'string' ? det.full_text : null, docket);
  const rueckfall = (grund: string) => ({ datum: String(det.decision_date ?? ''), quelle: 'ocl-decision_date' as const, kopf: ocl, grund });
  if (ocl.status === 'ok' && ocl.regel === 'titel-vom') return { datum: ocl.datum, quelle: 'kopf-ocl-volltext', kopf: ocl };
  if (ocl.status === 'widerspruch') return rueckfall(`Widerspruch im Kopf (${ocl.kandidaten.map((k) => `${k.regel}=${k.datum}`).join(', ')})`);
  const seiten = (amtlicheKopfSeiten ?? []).map(pdfKopfNormalisieren);
  const az = aktenzeichenRe(docket);
  const pdfEigen = !!az && seiten.some((s) => az.test(s));
  // Identität je Seite: der Titel zählt nur, wenn DIESELBE Seite das eigene
  // Aktenzeichen trägt (Nachprüfung 25.9.2026: Deckblatt mit Az auf S. 1 machte
  // sonst ein Vorinstanz-«Urteil vom …» auf S. 2 zum Kopfdatum). Beleg: alle
  // sechs SG-Titelseiten im Bestand tragen es («Geschäftsnr. UV 2025/14»).
  for (const seite of az ? seiten.filter((s) => az.test(s)) : []) {
    const k = kopfEntscheiddatum(seite, docket);
    // Kopf-Grenze auch hier: «UV 2025/14 2/16 … Urteil vom …» mitten im Text ist ein Zitat.
    if (k.status === 'ok' && k.regel === 'titel-vom' && imSeitenkopf(seite, k.beleg)) {
      const abw = ocl.status === 'ok' && ocl.datum !== k.datum ? [{ datum: ocl.datum, regel: ocl.regel, beleg: ocl.beleg }] : [];
      return { datum: k.datum, quelle: 'kopf-amtliches-pdf', kopf: { ...k, abweichung: [...k.abweichung, ...abw] } };
    }
  }
  const netz = pdfEigen ? kopfOhneAktenzeichen(seiten, docket, az, ocl.status === 'ok' ? ocl.datum : String(det.decision_date ?? '')) : null;
  if (netz) {
    const plattform = ocl.status === 'ok' ? [{ datum: ocl.datum, regel: ocl.regel, beleg: ocl.beleg }] : [];
    return { ...rueckfall(`Widerspruch PDF-Seite ${netz.seite} ohne erkanntes eigenes Aktenzeichen (titel-vom=${netz.k.datum}) gegen ${ocl.status === 'ok' ? `${ocl.regel}=${ocl.datum}` : `decision_date=${String(det.decision_date ?? '—')}`}`), kopf: { status: 'widerspruch', kandidaten: [{ datum: netz.k.datum, regel: netz.k.regel, beleg: netz.k.beleg }, ...plattform] } };
  }
  // `pdfFehlt`: das PDF war nötig (kein eigener Titel im OCL-Kopf, kein Widerspruch), kam aber nicht.
  if (ocl.status === 'ok' && !seiten.length) return { datum: ocl.datum, quelle: 'plattform-ohne-kopf', kopf: ocl, grund: `${ocl.regel}=${ocl.datum} im OCL-Kopf ohne eigenen Titel; amtliches PDF nicht verfügbar`, pdfFehlt: true };
  if (ocl.status === 'ok') return { datum: ocl.datum, quelle: 'kopf-ocl-volltext', kopf: ocl };
  if (!seiten.length) return { ...rueckfall('kein eigenes Kopfdatum im OCL-Kopf; amtliches PDF nicht verfügbar'), pdfFehlt: true };
  return rueckfall(`kein eigenes Kopfdatum im OCL-Kopf; amtliches PDF ${!pdfEigen ? 'ohne eigenes Aktenzeichen' : 'ohne eigenen Titel'}`);
}

/** Erste Seite OHNE erkanntes eigenes Aktenzeichen mit abweichendem Titel im Seitenkopf (Sicherheitsnetz). */
function kopfOhneAktenzeichen(seiten: string[], docket: string, az: RegExp | null, bisher: string) {
  for (const [i, seite] of seiten.entries()) {
    if (az?.test(seite)) continue;
    const k = kopfEntscheiddatum(seite, docket);
    if (k.status === 'ok' && k.regel === 'titel-vom' && k.datum !== bisher && imSeitenkopf(seite, k.beleg)) return { seite: i + 1, k };
  }
  return null;
}

/**
 * Log-Zeile, wenn ein kantonaler Entscheid auf das (bekannt unzuverlässige)
 * OCL-`decision_date` oder ein Plattformdatum ohne amtlichen Kopf zurückfällt — sonst null. Deterministisch (§2); für den
 * Live-Import (`holeEntscheid`), damit der Rückfall nicht still bleibt.
 */
export function kopfdatumRueckfallMeldung(
  det: OclKopfFelder & { court?: unknown },
  r: ReturnType<typeof kantonsEntscheiddatum>,
): string | null {
  if (r.quelle !== 'ocl-decision_date' && r.quelle !== 'plattform-ohne-kopf') return null;
  return `[kopfdatum] Rückfall auf ${r.quelle === 'plattform-ohne-kopf' ? 'Plattformdatum' : 'OCL decision_date'} ${r.datum || '—'}: ${String(det.court ?? '?')} ${String(det.docket_number ?? '?')} — ${r.grund ?? r.kopf.status}`;
}

/** Optionen des PDF-Abrufs (Tests setzen `pauseMs: 0`). */
export interface KopfPdfOpts { seiten?: number; timeoutMs?: number; versuche?: number; pauseMs?: number }

/**
 * Seiten 1…`seiten` des amtlichen PDF als Text (pdfjs), oder null (kein PDF,
 * Netzfehler). Nur für den kantonalen Kopfdatum-Rückfall; Netz-Zweig, darum
 * NICHT in `mappeEntscheidOCL` (bleibt rein).
 * Grenze 60 s je Versuch, zwei Versuche: der SG-Server antwortete am 25.9.2026 für
 * UV 2025/14 erst nach 43 s (frühere Grenze 30 s ⇒ Plattformdatum statt Kopf). Ein
 * neuer Versuch nur bei Netzfehler, Zeitüberschreitung, HTTP 429/5xx — dieselbe
 * amtliche URL, nie ein anderer Host; 404/kein PDF/Parse-Fehler sind endgültig.
 */
export async function holeAmtlicheKopfSeiten(url: string, o: KopfPdfOpts = {}): Promise<string[] | null> {
  const { seiten = 3, timeoutMs = 60_000, versuche = 2, pauseMs = 1500 } = o;
  if (!/^https:\/\//.test(url)) return null;
  for (let v = 1; v <= versuche; v++) {
    const r = await kopfPdfVersuch(url, seiten, timeoutMs);
    if (r !== 'nochmal') return r;
    console.warn(`[kopfdatum] amtliches PDF: Versuch ${v}/${versuche} ohne Antwort (Netzfehler/Grenze ${timeoutMs / 1000} s): ${url}`);
    if (v < versuche) await new Promise((res) => setTimeout(res, pauseMs));
  }
  return null;
}

async function kopfPdfVersuch(url: string, seiten: number, timeoutMs: number): Promise<string[] | null | 'nochmal'> {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);
  let bytes: Uint8Array;
  try {
    const res = await fetch(url, { signal: ac.signal, headers: { 'User-Agent': RECHTSPRECHUNG_UA }, redirect: 'follow' });
    if (res.status === 429 || res.status >= 500) return 'nochmal';
    if (!res.ok) return null;
    bytes = new Uint8Array(await res.arrayBuffer());
  } catch {
    return 'nochmal';
  } finally {
    clearTimeout(t);
  }
  if (String.fromCharCode(...bytes.slice(0, 5)) !== '%PDF-') return null;
  try {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const doc = await pdfjs.getDocument({ data: bytes, verbosity: 0 }).promise;
    const out: string[] = [];
    for (let i = 1; i <= Math.min(seiten, doc.numPages); i++) {
      const inhalt = await (await doc.getPage(i)).getTextContent();
      out.push(inhalt.items.map((it) => ('str' in it ? it.str : '')).join(' '));
    }
    return out;
  } catch {
    return null;
  }
}

/**
 * Kantonal und ohne eigenen Titel im OCL-Kopf (SG-Deckblatt): Seiten des amtlichen
 * PDF holen (null, wenn es nicht kommt ⇒ `pdfFehlt` in `kantonsEntscheiddatum`); sonst (Bund, Kopf vorhanden oder Kopf-Widerspruch) null — kein Zusatzabruf.
 */
export async function kopfSeitenFallsNoetig(det: OclKopfFelder): Promise<string[] | null> {
  if (String(det.canton ?? 'CH') === 'CH') return null;
  const k = kopfEntscheiddatum(typeof det.full_text === 'string' ? det.full_text : null, String(det.docket_number ?? ''));
  const url = String(det.pdf_url || det.source_url || '');
  // Widerspruch: kein Kopfdatum, das PDF entschiede ihn nicht (kantonsEntscheiddatum).
  return (k.status === 'ok' && k.regel === 'titel-vom') || k.status === 'widerspruch' || !url ? null : holeAmtlicheKopfSeiten(url);
}

/**
 * Live-Import (`holeEntscheid`): Kopf-Seiten wie `kopfSeitenFallsNoetig` und —
 * kantonal — eine Log-Zeile, falls das Datum auf OCL-`decision_date` zurückfällt
 * (Gegenprüfung #1126: der Rückfall blieb sonst still). Kein Schema-/UI-Ausbau.
 */
export async function kopfSeitenMitRueckfallMeldung(det: OclKopfFelder & { court?: unknown }): Promise<string[] | null> {
  const seiten = await kopfSeitenFallsNoetig(det);
  const meldung = String(det.canton ?? 'CH') !== 'CH' ? kopfdatumRueckfallMeldung(det, kantonsEntscheiddatum(det, seiten)) : null;
  if (meldung) console.warn(meldung);
  return seiten;
}

/**
 * Schnittstelle für Aufrufer wie den Wochenlauf (`HoleOpts.nurMitAmtlichemKopf`):
 * true, wenn das Datum eines KANTONALEN Entscheids nur aus Plattform/OCL stammt,
 * weil das nötige amtliche PDF nicht kam (`pdfFehlt`). Rein (§2).
 */
export const kopfOhneAmtlichesPdf = (det: OclKopfFelder, seiten: string[] | null): boolean =>
  String(det.canton ?? 'CH') !== 'CH' && !!kantonsEntscheiddatum(det, seiten).pdfFehlt;
