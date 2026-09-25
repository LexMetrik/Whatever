// ─── OCL-Abruf: JSON-GET und Atom-IDs (aus adapter-entscheide.ts, §6.6) ──────
//
// Ausgelagert, weil adapter-entscheide.ts an der 800-Zeilen-Grenze steht
// (check:schlankheit). adapter-entscheide.ts re-exportiert beides, bestehende
// Importeure bleiben stabil.
//
// Probelauf Wochenlauf 25.9.2026 (#1129, Actions-Lauf 36170527404): «bvger:
// 6 IDs, aber 0 Details geholt». Zwei Ursachen, beide hier behoben:
//  1. Der Atom-Fallback schnitt IDs am «-» ab (bvger_A-1851_2026 → bvger_A,
//     sechs Kammer-Buchstaben A–F, jedes Detail 404).
//  2. jget schluckte jeden Fehler lautlos (null) — warum das Listing leer war,
//     stand nirgends. Jetzt eine Zeile mit eigenem Präfix am Zeilenanfang.
import { RECHTSPRECHUNG_UA } from './clir-regeste';

/**
 * Präfix der jget-Diagnosezeilen. Wer sie liest, verankert am ZEILENANFANG
 * (Lehre A1: die npm-Kopfzeile «> vite-node …» wiederholt die Argumente — ein
 * unverankertes Muster trifft sie). Die Zeilen tragen bewusst keines der
 * Ausfall-Wörter von erkenneAusfaelle (wochenlauf-kern.ts): ein 404 auf EIN
 * Detail ist kein Quellen-Ausfall.
 */
export const OCL_ABRUF = '[ocl-abruf]';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Robustes JSON-GET mit Timeout + Retry (OCL-Latenz ist sprunghaft). Semantik
 * unverändert: null bei 404/422 sofort, sonst null nach `tries` Versuchen —
 * aber nie mehr still: jede null-Antwort meldet Status bzw. Fehlerklasse.
 */
export async function jget<T = unknown>(url: string, tries = 3, timeoutMs = 45000): Promise<T | null> {
  let grund = '';
  for (let i = 0; i < tries; i++) {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), timeoutMs);
    try {
      const res = await fetch(url, { signal: ac.signal, headers: { 'User-Agent': RECHTSPRECHUNG_UA }, redirect: 'follow' });
      clearTimeout(t);
      if (res.status === 404 || res.status === 422) { console.warn(`${OCL_ABRUF} HTTP ${res.status} · ${url}`); return null; }
      if (!res.ok) { grund = `HTTP ${res.status}`; await sleep(800 * (i + 1)); continue; }
      return (await res.json()) as T;
    } catch (x) {
      clearTimeout(t);
      const f = x as { name?: string; cause?: { code?: string } };
      grund = f?.name === 'AbortError' ? `Zeitlimit ${timeoutMs / 1000} s` : `${f?.cause?.code ?? f?.name ?? 'Fehler'}`;
      await sleep(800 * (i + 1));
    }
  }
  console.warn(`${OCL_ABRUF} null nach ${tries} Versuchen (${grund}) · ${url}`);
  return null;
}

/**
 * Entscheid-IDs eines OCL-Atom-Feeds, aus dem strukturierten `<id>`-Element
 * (…/entscheid/<ID>) statt per Token-Regex — IDs tragen «-» (bvger_A-1851_2026)
 * und «.» (bstger_BB.2026.11). Nur IDs des angefragten Gerichts, in Feed-Reihenfolge.
 */
export function atomIds(xml: string, court: string): string[] {
  const ids = new Set<string>();
  for (const m of xml.matchAll(/<id>[^<]*\/entscheid\/([^<\s/]+)<\/id>/g)) {
    if (m[1].startsWith(`${court}_`)) ids.add(m[1]);
  }
  return [...ids];
}
