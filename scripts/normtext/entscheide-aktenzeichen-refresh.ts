// ─── Bestandsnachführung: Aktenzeichen verbundener Verfahren (U-25) ──────────────────
//
// `npm run entscheide -- --datum=… --aktenzeichen-refresh`: zieht für die BStGer-Snapshots des
// Bestands den OCL-Entscheid (fields=full) und übernimmt `nummer` + `zitierung` aus dem Urteilskopf,
// wo dieser ein erweitertes Aktenzeichen ausweist (`verbundenesAktenzeichen`, «RR.2025.198-199»).
// NETZ-Lauf (der Kopf steht nur im OCL-Volltext, nicht im Snapshot); `id`/Dateiname, `sha`, Text bleiben.
// Wie `--kopfdatum-refresh`: ein betroffener Snapshot, der sich nicht exakt auflösen lässt, bricht den
// ganzen Lauf ab, bevor etwas geschrieben wird (fail-closed, §6).

import type { EntscheidSnapshot } from '../../src/lib/rechtsprechung/typen';
import { erstesAktenzeichen, verbundenesAktenzeichen, zitierungMitVerbundenemAz } from '../../src/lib/rechtsprechung/verbundene-verfahren';
import { jget, API, type OclDecision } from './adapter-entscheide';
import { schreibeKorpus, ladeBestandSnapshots } from './entscheide-schreiben';

export interface AktenzeichenZeile { id: string; alt: string; neu: string }

export const istBstger = (s: EntscheidSnapshot): boolean => s.kanton === 'CH' && s.gericht === 'bstger' && s.quelle === 'opencaselaw';

/** Korrigiert `nummer`/`zitierung` IN PLACE. Wirft vor jeder Änderung, wenn ein Snapshot nicht aufgelöst werden kann. */
export async function aktenzeichenRefresh(
  basis: EntscheidSnapshot[],
  deps: { holeDecision: (s: EntscheidSnapshot) => Promise<OclDecision | null> },
): Promise<AktenzeichenZeile[]> {
  const ungeloest: string[] = [];
  const plan: Array<{ s: EntscheidSnapshot; neu: string }> = [];
  for (const s of basis.filter(istBstger).sort((a, b) => a.id.localeCompare(b.id))) {
    const det = await deps.holeDecision(s);
    const erste = erstesAktenzeichen(s.nummer);
    if (!det || String(det.court ?? '') !== s.gericht || String(det.docket_number ?? '').trim() !== erste) {
      ungeloest.push(s.id);
      continue;
    }
    plan.push({ s, neu: verbundenesAktenzeichen(erste, det.full_text) });
  }
  if (ungeloest.length) throw new Error(`[aktenzeichen-refresh] ABBRUCH, nichts geändert — ${ungeloest.length} Snapshot(s) ungelöst: ${ungeloest.join(', ')}`);
  const zeilen: AktenzeichenZeile[] = [];
  for (const { s, neu } of plan) {
    if (neu === s.nummer) continue;
    zeilen.push({ id: s.id, alt: s.nummer, neu });
    s.zitierung = zitierungMitVerbundenemAz(s.zitierung, s.nummer, neu);
    s.nummer = neu;
  }
  return zeilen;
}

/** CLI-Lauf: Netz (ein GET je BStGer-Snapshot), Log, ein Schreibvorgang. */
export async function aktenzeichenRefreshLauf(datum: string): Promise<void> {
  const basis = ladeBestandSnapshots();
  const zeilen = await aktenzeichenRefresh(basis, {
    holeDecision: (s) => jget<OclDecision>(`${API}/decisions/${encodeURIComponent(`${s.gericht}_${erstesAktenzeichen(s.nummer)}`)}?fields=full`),
  });
  for (const z of zeilen) console.log(`[aktenzeichen] ${z.id}\t${z.alt} → ${z.neu}`);
  console.log(`[aktenzeichen] ${basis.filter(istBstger).length} BStGer-Snapshots geprüft · Aktenzeichen erweitert: ${zeilen.length}`);
  const res = schreibeKorpus(basis, datum);
  console.log(`[aktenzeichen] geschrieben: ${res.anzahl} Manifest-Einträge, ${res.normBuckets} Norm-Buckets.`);
}
