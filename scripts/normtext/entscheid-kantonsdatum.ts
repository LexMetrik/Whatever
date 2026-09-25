// ─── Kantonales Entscheiddatum aus dem amtlichen Urteilskopf (QS-KORPUS) ─────
//
// Auszug aus adapter-entscheide.ts (§6.6, 25.9.2026). Regel-Kern:
// entscheid-kopfdatum.ts; hier die Anwendung auf einen OCL-Entscheid und der
// Netz-Rückfall auf das amtliche PDF. Angewandt in `mappeEntscheidOCL`.

import { kopfEntscheiddatum, pdfKopfNormalisieren, type Kopfdatum } from './entscheid-kopfdatum';
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
 * Der Bund-Pfad (canton 'CH') ruft das NICHT auf — dort stimmt decision_date
 * (Stichprobe 25.9.2026: 13/13 bger/bvger/bstger mit Kopf identisch).
 */
export function kantonsEntscheiddatum(
  det: OclKopfFelder,
  amtlicheKopfSeiten?: string[] | null,
): { datum: string; quelle: KantonsDatumQuelle; kopf: Kopfdatum } {
  const docket = String(det.docket_number ?? '');
  const ocl = kopfEntscheiddatum(typeof det.full_text === 'string' ? det.full_text : null, docket);
  if (ocl.status === 'ok' && ocl.regel === 'titel-vom') return { datum: ocl.datum, quelle: 'kopf-ocl-volltext', kopf: ocl };
  for (const seite of amtlicheKopfSeiten ?? []) {
    const k = kopfEntscheiddatum(pdfKopfNormalisieren(seite), docket);
    if (k.status === 'ok' && k.regel === 'titel-vom') {
      const abw = ocl.status === 'ok' && ocl.datum !== k.datum ? [{ datum: ocl.datum, regel: ocl.regel, beleg: ocl.beleg }] : [];
      return { datum: k.datum, quelle: 'kopf-amtliches-pdf', kopf: { ...k, abweichung: [...k.abweichung, ...abw] } };
    }
  }
  if (ocl.status === 'ok') return { datum: ocl.datum, quelle: 'kopf-ocl-volltext', kopf: ocl };
  return { datum: String(det.decision_date ?? ''), quelle: 'ocl-decision_date', kopf: ocl };
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
 * PDF holen; sonst (Bund, oder Kopf vorhanden) null — kein Zusatzabruf.
 */
export async function kopfSeitenFallsNoetig(det: OclKopfFelder): Promise<string[] | null> {
  if (String(det.canton ?? 'CH') === 'CH') return null;
  const k = kopfEntscheiddatum(typeof det.full_text === 'string' ? det.full_text : null, String(det.docket_number ?? ''));
  const url = String(det.pdf_url || det.source_url || '');
  return (k.status === 'ok' && k.regel === 'titel-vom') || !url ? null : holeAmtlicheKopfSeiten(url);
}
