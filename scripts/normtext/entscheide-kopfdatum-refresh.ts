// ─── --kopfdatum-refresh: Entscheiddatum des kantonalen BESTANDS aus dem Kopf ──
//
// QS-KORPUS, Entscheid David 25.9.2026 («Variante A»): die kantonalen OCL-
// Snapshots tragen das ungeprüfte OCL-`decision_date` (20/24 Bestandsurteile
// falsch, Messung 25.9.2026). Die Snapshots selbst enthalten den Urteilskopf
// NICHT (der Adapter schneidet Sachverhalt/Erwägungen/Dispositiv) — eine
// Offline-Neuableitung ist darum unmöglich. Dieser Lauf holt je kantonalem
// Snapshot den OCL-Volltext (und nur falls nötig den Kopf des amtlichen PDF),
// bestimmt das Datum mit DERSELBEN Regel wie der Live-Adapter
// (`kantonsEntscheiddatum`, §5) und setzt AUSSCHLIESSLICH `datum` + `zitierung`.
// `abschnitte`/`sha`/`abgerufen`/`fassungsToken` bleiben unberührt (§7).
//
// Tore (§1): exakte Identität court+Aktenzeichen (OCL-Suche ist präfixunscharf,
// Quirk 8); ein nicht auflösbarer Snapshot bricht den GANZEN Lauf ab (nie ein
// halb korrigierter Korpus); ein Kopfdatum nach `abgerufen` wird nicht übernommen.
// Bund (canton CH) und BS (eigener Import, quelle 'gerichte-bs') sind ausgenommen.

import type { EntscheidSnapshot } from '../../src/lib/rechtsprechung/typen';
import {
  kantonsEntscheiddatum, zitierungKantonal, jget, OCL_API, type KantonsDatumQuelle, type OclDecision,
} from './adapter-entscheide';
import { kopfEntscheiddatum } from './entscheid-kopfdatum';

export interface KopfRefreshZeile {
  id: string;
  alt: string;
  neu: string;
  quelle: KantonsDatumQuelle;
  beleg: string;
  /** abweichende Plattform-Angabe (z. B. SG «Entscheiddatum:» ≠ Urteilskopf) */
  abweichung: string;
  /** OCL-Inhalt seit dem Abruf verändert (content_hash ≠ fassungsToken) — nur Hinweis */
  hashDrift: boolean;
}

export interface KopfRefreshDeps {
  /** OCL-Entscheid (fields=full) zum Snapshot, exakt aufgelöst — oder null. */
  holeDecision: (s: EntscheidSnapshot) => Promise<OclDecision | null>;
  /** Seitentexte des amtlichen PDF — oder null. */
  holeSeiten: (url: string) => Promise<string[] | null>;
}

const normNr = (s: unknown) => String(s ?? '').replace(/\s+/g, ' ').trim();

/** Betroffen: kantonale OCL-Snapshots (nicht Bund, nicht BS-Eigenimport). */
export const istKantonalOcl = (s: EntscheidSnapshot): boolean => s.kanton !== 'CH' && s.quelle === 'opencaselaw';

/**
 * Korrigiert `datum`/`zitierung` IN PLACE. Wirft, wenn ein betroffener Snapshot
 * nicht exakt aufgelöst werden kann (Aufrufer schreibt dann nichts).
 */
export async function kopfdatumRefresh(basis: EntscheidSnapshot[], deps: KopfRefreshDeps): Promise<KopfRefreshZeile[]> {
  const zeilen: KopfRefreshZeile[] = [];
  const ungeloest: string[] = [];
  const plan: Array<{ s: EntscheidSnapshot; datum: string; zitierung: string }> = [];
  for (const s of basis.filter(istKantonalOcl).sort((a, b) => a.id.localeCompare(b.id))) {
    const det = await deps.holeDecision(s);
    if (!det || String(det.court ?? '') !== s.gericht || normNr(det.docket_number) !== normNr(s.nummer)) {
      ungeloest.push(s.id);
      continue;
    }
    const ocl = kopfEntscheiddatum(typeof det.full_text === 'string' ? det.full_text : null, String(det.docket_number ?? ''));
    const url = String(det.pdf_url || det.source_url || s.quelleUrl || '');
    const seiten = ocl.status === 'ok' && ocl.regel === 'titel-vom' ? null : (url ? await deps.holeSeiten(url) : null);
    const r = kantonsEntscheiddatum(det, seiten);
    const zukunft = !!(r.datum && s.abgerufen && r.datum > s.abgerufen);
    const neu = r.quelle === 'ocl-decision_date' || zukunft ? s.datum : r.datum;
    zeilen.push({
      id: s.id, alt: s.datum, neu, quelle: zukunft ? 'ocl-decision_date' : r.quelle,
      beleg: r.kopf.status === 'ok' ? r.kopf.beleg : r.kopf.status,
      abweichung: r.kopf.status === 'ok' ? r.kopf.abweichung.map((a) => `${a.regel}=${a.datum}`).join(', ') : '',
      hashDrift: !!det.content_hash && String(det.content_hash) !== s.fassungsToken,
    });
    plan.push({ s, datum: neu, zitierung: zitierungKantonal(s.gerichtName, s.nummer, neu) });
  }
  if (ungeloest.length) {
    throw new Error(`[kopfdatum-refresh] ABBRUCH — ${ungeloest.length} kantonale Snapshot(s) nicht exakt in OCL auflösbar: ${ungeloest.join(', ')}`);
  }
  for (const p of plan) {
    // Zitierung nur neu bauen, wenn das Datum wechselt — sonst byte-treu (§6).
    if (p.datum === p.s.datum) continue;
    p.s.datum = p.datum;
    p.s.zitierung = p.zitierung;
  }
  return zeilen;
}

/**
 * Snapshot → OCL-Entscheid (fields=full). Die decision_id wird NICHT rekonstruiert
 * (mehrere ID-Schemata: «ag_gerichte_HOR.2024.19», «sg_gerichte_B_2024_58__B_2024_59»),
 * sondern per Suche gefunden und EXAKT auf court + Aktenzeichen gematcht.
 */
export async function holeKantonDecisionOcl(s: EntscheidSnapshot): Promise<OclDecision | null> {
  type Zeile = { decision_id?: string; court?: string; docket_number?: string };
  const d = await jget<{ results?: Zeile[]; decisions?: Zeile[] }>(
    `${OCL_API}/decisions?q=${encodeURIComponent(s.nummer)}&fields=compact&limit=15`);
  const hit = (d?.results ?? d?.decisions ?? []).find((r) => r.court === s.gericht && normNr(r.docket_number) === normNr(s.nummer));
  // Rückfall (die Suche findet nicht jedes Aktenzeichen, Lauf 25.9.2026: 6/30):
  // die beobachteten ID-Schemata durchprobieren; die Identität prüft der Aufrufer.
  const nr = normNr(s.nummer);
  const kandidaten = [...new Set([
    hit?.decision_id,
    `${s.gericht}_${nr}`,
    `${s.gericht}_${nr.replace(/[\s/]+/g, '_')}`,
    `${s.gericht}_${nr.replace(/,\s*/g, '__').replace(/[\s/]+/g, '_')}`,
  ].filter((x): x is string => !!x))];
  for (const id of kandidaten) {
    const det = await jget<OclDecision>(`${OCL_API}/decisions/${encodeURIComponent(id)}?fields=full`);
    if (det && det.court === s.gericht && normNr(det.docket_number) === nr) return det;
  }
  return null;
}
