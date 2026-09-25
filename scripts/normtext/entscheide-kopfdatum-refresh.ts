// ─── --kopfdatum-refresh: Entscheiddatum des kantonalen BESTANDS aus dem Kopf ──
//
// QS-KORPUS, Entscheid David 25.9.2026 («Variante A»): die kantonalen OCL-
// Snapshots tragen das ungeprüfte OCL-`decision_date` (20/24 Bestandsurteile
// falsch, Messung 25.9.2026). Die Snapshots selbst enthalten den Urteilskopf
// NICHT (der Adapter schneidet Sachverhalt/Erwägungen/Dispositiv) — eine
// Offline-Neuableitung ist darum unmöglich. Dieser Lauf holt je kantonalem
// Snapshot den OCL-Volltext (und nur falls nötig den Kopf des amtlichen PDF),
// bildet ihn mit DEMSELBEN `mappeEntscheidOCL` wie der Live-Import ab (§5) und
// übernimmt daraus AUSSCHLIESSLICH `datum` + `zitierung` — und damit das daraus
// abgeleitete ECLI-Jahr (minteEcli liest das Jahr aus `datum`, ecli.ts).
// `abschnitte`/`sha`/`abgerufen`/`fassungsToken` bleiben unberührt (§7).
//
// Tore (§1): exakte Identität court + Aktenzeichen und gleiche Snapshot-id
// (OCL-Suche ist präfixunscharf, Quirk 8); ein nicht auflösbarer Snapshot
// bricht den GANZEN Lauf ab (nie ein halb korrigierter Korpus) — ebenso ein
// Kopf-Widerspruch (Titel ≠ Plattform ohne Identitätsbeleg, Gegenprüfung #1126).
// Bund (canton CH) und BS (eigener Import, quelle 'gerichte-bs') sind ausgenommen.

import type { EntscheidSnapshot } from '../../src/lib/rechtsprechung/typen';
import { mappeEntscheidOCL, jget, API, type OclDecision } from './adapter-entscheide';
import { kantonsEntscheiddatum, kopfSeitenFallsNoetig, type KantonsDatumQuelle } from './entscheid-kantonsdatum';
import { schreibeKorpus, ladeBestandSnapshots } from './entscheide-schreiben';

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
  /** OCL-Entscheid (fields=full) zum Snapshot — oder null. */
  holeDecision: (s: EntscheidSnapshot) => Promise<OclDecision | null>;
  /** Seitentexte des amtlichen PDF, falls der OCL-Kopf keinen eigenen Titel trägt — sonst null. */
  holeSeiten: (det: OclDecision) => Promise<string[] | null>;
}

const normNr = (s: unknown) => String(s ?? '').replace(/\s+/g, ' ').trim();

/** Betroffen: kantonale OCL-Snapshots (nicht Bund, nicht BS-Eigenimport). */
export const istKantonalOcl = (s: EntscheidSnapshot): boolean => s.kanton !== 'CH' && s.quelle === 'opencaselaw';

/**
 * Korrigiert `datum`/`zitierung` IN PLACE. Wirft, wenn ein betroffener Snapshot
 * nicht exakt aufgelöst werden kann (dann ist NICHTS geändert).
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
    const seiten = await deps.holeSeiten(det);
    const r = kantonsEntscheiddatum(det, seiten);
    if (r.kopf.status === 'widerspruch') {
      ungeloest.push(`${s.id} (${r.grund})`);
      continue;
    }
    // Derselbe Mapper wie der Live-Import (§5); abgerufen = Bestandswert (Zukunfts-Riegel).
    const m = mappeEntscheidOCL(det, null, s.abgerufen, { amtlicheKopfSeiten: seiten, sprache: null });
    if (!m || m.id !== s.id || m.gerichtName !== s.gerichtName) {
      ungeloest.push(`${s.id} (Abbildung ${m ? `id/Gericht ${m.id}/${m.gerichtName}` : 'null'})`);
      continue;
    }
    zeilen.push({
      id: s.id, alt: s.datum, neu: m.datum, quelle: r.quelle,
      beleg: r.kopf.status === 'ok' ? r.kopf.beleg : (r.grund ?? r.kopf.status),
      abweichung: r.kopf.status === 'ok' ? r.kopf.abweichung.map((a) => `${a.regel}=${a.datum}`).join(', ') : '',
      hashDrift: !!det.content_hash && String(det.content_hash) !== s.fassungsToken,
    });
    plan.push({ s, datum: m.datum, zitierung: m.zitierung });
  }
  if (ungeloest.length) {
    throw new Error(`[kopfdatum-refresh] ABBRUCH — ${ungeloest.length} kantonale Snapshot(s) nicht exakt auflösbar: ${ungeloest.join(', ')}`);
  }
  for (const p of plan) {
    // Nur bei Datumswechsel schreiben — sonst byte-treu (§6).
    if (p.datum === p.s.datum) continue;
    p.s.datum = p.datum;
    p.s.zitierung = p.zitierung;
  }
  return zeilen;
}

/**
 * Snapshot → OCL-Entscheid (fields=full). Die decision_id wird per Suche gefunden
 * (mehrere ID-Schemata: «ag_gerichte_HOR.2024.19», «sg_gerichte_B_2024_58__B_2024_59»)
 * und EXAKT auf court + Aktenzeichen gematcht; Rückfall (die Suche fand am 25.9.2026
 * 6/42 nicht): die beobachteten Schemata durchprobieren.
 */
export async function holeKantonDecisionOcl(s: EntscheidSnapshot): Promise<OclDecision | null> {
  type Zeile = { decision_id?: string; court?: string; docket_number?: string };
  const nr = normNr(s.nummer);
  const d = await jget<{ results?: Zeile[]; decisions?: Zeile[] }>(
    `${API}/decisions?q=${encodeURIComponent(s.nummer)}&fields=compact&limit=15`);
  const hit = (d?.results ?? d?.decisions ?? []).find((r) => r.court === s.gericht && normNr(r.docket_number) === nr);
  const kandidaten = [...new Set([
    hit?.decision_id,
    `${s.gericht}_${nr}`,
    `${s.gericht}_${nr.replace(/[\s/]+/g, '_')}`,
    `${s.gericht}_${nr.replace(/,\s*/g, '__').replace(/[\s/]+/g, '_')}`,
  ].filter((x): x is string => !!x))];
  for (const id of kandidaten) {
    const det = await jget<OclDecision>(`${API}/decisions/${encodeURIComponent(id)}?fields=full`);
    if (det && det.court === s.gericht && normNr(det.docket_number) === nr) return det;
  }
  return null;
}

/** Der CLI-Lauf (`npm run entscheide -- --datum=… --kopfdatum-refresh`): Netz, Log, ein Schreibvorgang. */
export async function kopfdatumRefreshLauf(datum: string): Promise<void> {
  const basis = ladeBestandSnapshots();
  const zeilen = await kopfdatumRefresh(basis, { holeDecision: holeKantonDecisionOcl, holeSeiten: kopfSeitenFallsNoetig });
  for (const z of zeilen) {
    console.log(`[kopfdatum] ${z.id}\t${z.alt} → ${z.neu}${z.alt === z.neu ? ' (=)' : ''}\t${z.quelle}\t«${z.beleg}»${z.abweichung ? `\tabweichend: ${z.abweichung}` : ''}${z.hashDrift ? '\t(OCL-Inhalt seit Abruf verändert)' : ''}`);
  }
  const geaendert = zeilen.filter((z) => z.alt !== z.neu).length;
  const ohneKopf = zeilen.filter((z) => z.quelle === 'ocl-decision_date').length;
  console.log(`[kopfdatum] ${zeilen.length} kantonale OCL-Snapshots · Datum korrigiert: ${geaendert} · ohne Kopfdatum (OCL-Wert behalten): ${ohneKopf}`);
  const res = schreibeKorpus(basis, datum);
  console.log(`[kopfdatum] geschrieben: ${res.anzahl} Manifest-Einträge, ${res.normBuckets} Norm-Buckets.`);
}
