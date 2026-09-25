// ─── Kantonales Entscheiddatum aus dem amtlichen Urteilskopf (QS-KORPUS) ─────
//
// Auszug aus adapter-entscheide.ts (§6.6, 25.9.2026). Regel-Kern:
// entscheid-kopfdatum.ts; hier die Anwendung auf einen OCL-Entscheid und der
// Netz-Rückfall auf das amtliche PDF. Angewandt in `mappeEntscheidOCL`.

import { kopfEntscheiddatum, pdfKopfNormalisieren, aktenzeichenRe, type Kopfdatum } from './entscheid-kopfdatum';
import { RECHTSPRECHUNG_UA } from './clir-regeste';

/** Die genutzten Felder eines OCL-Entscheids (strukturell, ohne Import-Zyklus). */
interface OclKopfFelder { full_text?: unknown; docket_number?: unknown; decision_date?: unknown; canton?: unknown; pdf_url?: unknown; source_url?: unknown }

/** Herkunft des übernommenen Kantons-Entscheiddatums (Bericht/Log, kein Snapshot-Feld). */
export type KantonsDatumQuelle = 'kopf-ocl-volltext' | 'kopf-amtliches-pdf' | 'ocl-decision_date';

/**
 * Entscheiddatum eines KANTONALEN Entscheids (QS-KORPUS, Entscheid David 25.9.2026):
 * der amtliche Urteilskopf gewinnt, das OCL-`decision_date` ist nur Rückfall.
 * Reihenfolge: (1) eigener Titel im OCL-Volltext-Kopf; (2) eigener Titel im Kopf
 * einer Seite des amtlichen PDF (SG-Deckblatt-Fall); (3) Plattform-Angabe im
 * OCL-Kopf («Entscheiddatum:», SG-Kopfzeile); (4) OCL-`decision_date`. Rein (§2).
 * Das PDF zählt nur, wenn eine seiner Seiten das EIGENE Aktenzeichen trägt
 * (Identität, `aktenzeichenRe`: auch BE-Punktform «100.2025.363U»). Ein
 * `widerspruch` im OCL-Kopf setzt KEIN Kopfdatum (OCL-Wert, gemeldet über
 * `kopfdatumRueckfallMeldung`; der Bestands-Refresh bricht ab).
 * Der Bund-Pfad (canton 'CH') ruft das NICHT auf — dort stimmt decision_date
 * (Stichprobe 25.9.2026: 13/13 bger/bvger/bstger mit Kopf identisch).
 */
export function kantonsEntscheiddatum(
  det: OclKopfFelder,
  amtlicheKopfSeiten?: string[] | null,
): { datum: string; quelle: KantonsDatumQuelle; kopf: Kopfdatum; grund?: string } {
  const docket = String(det.docket_number ?? '');
  const ocl = kopfEntscheiddatum(typeof det.full_text === 'string' ? det.full_text : null, docket);
  const rueckfall = (grund: string) => ({ datum: String(det.decision_date ?? ''), quelle: 'ocl-decision_date' as const, kopf: ocl, grund });
  if (ocl.status === 'ok' && ocl.regel === 'titel-vom') return { datum: ocl.datum, quelle: 'kopf-ocl-volltext', kopf: ocl };
  if (ocl.status === 'widerspruch') return rueckfall(`Widerspruch im Kopf (${ocl.kandidaten.map((k) => `${k.regel}=${k.datum}`).join(', ')})`);
  const seiten = (amtlicheKopfSeiten ?? []).map(pdfKopfNormalisieren);
  const az = aktenzeichenRe(docket);
  const pdfEigen = !!az && seiten.some((s) => az.test(s));
  for (const seite of pdfEigen ? seiten : []) {
    const k = kopfEntscheiddatum(seite, docket);
    if (k.status === 'ok' && k.regel === 'titel-vom') {
      const abw = ocl.status === 'ok' && ocl.datum !== k.datum ? [{ datum: ocl.datum, regel: ocl.regel, beleg: ocl.beleg }] : [];
      return { datum: k.datum, quelle: 'kopf-amtliches-pdf', kopf: { ...k, abweichung: [...k.abweichung, ...abw] } };
    }
  }
  if (ocl.status === 'ok') return { datum: ocl.datum, quelle: 'kopf-ocl-volltext', kopf: ocl };
  const pdf = !seiten.length ? 'amtliches PDF nicht verfügbar' : !pdfEigen ? 'amtliches PDF ohne eigenes Aktenzeichen' : 'amtliches PDF ohne eigenen Titel';
  return rueckfall(`kein eigenes Kopfdatum im OCL-Kopf; ${pdf}`);
}

/**
 * Log-Zeile, wenn ein kantonaler Entscheid auf das (bekannt unzuverlässige)
 * OCL-`decision_date` zurückfällt — sonst null. Deterministisch (§2); für den
 * Live-Import (`holeEntscheid`), damit der Rückfall nicht still bleibt.
 */
export function kopfdatumRueckfallMeldung(
  det: OclKopfFelder & { court?: unknown },
  r: ReturnType<typeof kantonsEntscheiddatum>,
): string | null {
  if (r.quelle !== 'ocl-decision_date') return null;
  return `[kopfdatum] Rückfall auf OCL decision_date ${r.datum || '—'}: ${String(det.court ?? '?')} ${String(det.docket_number ?? '?')} — ${r.grund ?? r.kopf.status}`;
}

/**
 * Seiten 1…`seiten` des amtlichen PDF als Text (pdfjs), oder null (kein PDF,
 * Netzfehler). Nur für den kantonalen Kopfdatum-Rückfall; Netz-Zweig, darum
 * NICHT in `mappeEntscheidOCL` (bleibt rein).
 */
export async function holeAmtlicheKopfSeiten(url: string, seiten = 3, timeoutMs = 30000): Promise<string[] | null> {
  if (!/^https:\/\//.test(url)) return null;
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ac.signal, headers: { 'User-Agent': RECHTSPRECHUNG_UA }, redirect: 'follow' });
    if (!res.ok) return null;
    const bytes = new Uint8Array(await res.arrayBuffer());
    if (String.fromCharCode(...bytes.slice(0, 5)) !== '%PDF-') return null;
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
  } finally {
    clearTimeout(t);
  }
}

/**
 * Kantonal und ohne eigenen Titel im OCL-Kopf (SG-Deckblatt): Seiten des amtlichen
 * PDF holen; sonst (Bund, Kopf vorhanden oder Kopf-Widerspruch) null — kein Zusatzabruf.
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
