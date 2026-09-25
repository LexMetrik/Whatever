// ─── BS-Delta: nur neue und aktualisierte Dokumente holen und parsen ─────────
//
// WARUM (Posten 25.9.2026, Gegenprüfung PR #1099): `daten/bs-fiw/raw/` und
// `checkpoint.json` sind nicht eingecheckt. Der frühere `--delta`-Lauf reichte das
// GANZE Inventar an Fetch und Parse weiter — ohne lokalen Roh-Store holte und
// parste er alle ~3950 Dokumente neu und stempelte jeden Bestands-Snapshot um
// (`abgerufen` = Laufdatum, §6-Drift ohne Quellenänderung).
//
// REGEL: Soll = frisches Portal-Inventar, Ist = committeter Korpus auf der Platte.
// Je Scope-Eintrag (nF30_KEY, technische Identität):
//  · kein BS-Snapshot mit diesem Key              → neu (holen + parsen)
//  · Snapshot da, Listen-Metadaten weichen ab     → aktualisiert (holen, parsen, ersetzen)
//  · sonst                                        → unverändert (byte-treu von der Platte)
// BS-Snapshots, deren Key nicht mehr im Inventar steht → Takedown: entfernt und im
// Report ausgewiesen (Takedown-Respekt §2/§5.4; die Bestandszahl-Sperre in
// `schreibeKorpus` bleibt der Stolperstein gegen Massen-Abgänge).
// Verglichen werden die Felder, die Inventar-Zeile und Snapshot GEMEINSAM tragen:
// GN, Sekundär-GN, Entscheiddatum, Erstpublikations-/Aktualisierungsdatum, Titel.
// Messung 25.9.2026: 3765/3765 Bestands-Snapshots deckungsgleich mit dem
// committeten inventar.json vom 20.7.2026 — der Vergleich trennt also sauber.
// Gegen die Platte statt gegen das alte inventar.json verglichen, damit der Plan
// wiederaufnehmbar ist (`--delta --parse-only` nach einem Fetch-Abbruch rechnet
// denselben Plan) und ein fehlender Snapshot nie als «unverändert» durchrutscht.
//
// GRENZE (ehrlich, §8): ändert das Portal einen Dokumenttext, OHNE eines dieser
// Listenfelder zu ändern (auch: entzieht es einem Dokument das Entscheiddatum),
// sieht das Delta das nicht — dafür bleibt der Vollimport.

import { ladeBestandSnapshots, schreibeKorpus } from '../normtext/entscheide-schreiben';
import type { EntscheidSnapshot } from '../../src/lib/rechtsprechung/typen';
import type { Inventar, InventarZeile } from './bs-inventar';
import type { ParseErgebnis } from './bs-parse';

export const BS_QUELLE = 'gerichte-bs';

/** nF30_KEY eines BS-Snapshots (aus der amtlichen quelleUrl); null, wenn keiner. */
export function bsKeyVon(s: Pick<EntscheidSnapshot, 'quelleUrl'>): number | null {
  const m = /[?&]nF30_KEY=(\d+)/.exec(s.quelleUrl ?? '');
  return m ? Number(m[1]) : null;
}

/** Abweichende Listenfelder zwischen Inventar-Zeile und Bestands-Snapshot (leer = gleich). */
export function abweichungen(z: InventarZeile, s: EntscheidSnapshot): string[] {
  const g: string[] = [];
  if (s.nummer !== z.gn) g.push(`gn ${s.nummer}→${z.gn}`);
  if ((s.nummerSekundaer ?? null) !== z.gnSekundaer) g.push(`gnSekundaer ${s.nummerSekundaer ?? '–'}→${z.gnSekundaer ?? '–'}`);
  // Datumlose Zeilen (Portal ohne Entscheiddatum) tragen im Snapshot den
  // Platzhalter oder ein Kopf-Datum (B-1) — dort ist kein Listenwert zu vergleichen
  // (Grenze: entzieht das Portal ein Datum, ohne `aktualisiert` zu setzen, bleibt
  // das unbemerkt; siehe Kopf).
  if (z.datum !== null && s.datum !== z.datum) g.push(`datum ${s.datum}→${z.datum}`);
  if ((s.erstpublikation ?? null) !== z.erstpublikation) g.push(`erstpublikation ${s.erstpublikation ?? '–'}→${z.erstpublikation ?? '–'}`);
  if ((s.aktualisiert ?? null) !== z.aktualisiert) g.push(`aktualisiert ${s.aktualisiert ?? '–'}→${z.aktualisiert ?? '–'}`);
  if ((s.rubrum?.gegenstand ?? '') !== z.titel) g.push('titel');
  return g;
}

export interface BsDeltaPlan {
  neu: InventarZeile[];
  aktualisiert: Array<{ z: InventarZeile; alt: EntscheidSnapshot; gruende: string[] }>;
  unveraendert: number;
  takedown: EntscheidSnapshot[];
}

/** Soll (Inventar) gegen Ist (Korpus) — rein, deterministisch (Inventar-Reihenfolge). */
export function planeBsDelta(inventar: Inventar, bestand: EntscheidSnapshot[]): BsDeltaPlan {
  const proKey = new Map<number, EntscheidSnapshot>();
  for (const s of bestand) {
    if (s.quelle !== BS_QUELLE) continue;
    const k = bsKeyVon(s);
    if (k === null) throw new Error(`[bs-delta] ${s.id}: kein nF30_KEY in quelleUrl`);
    if (proKey.has(k)) throw new Error(`[bs-delta] nF30_KEY ${k} doppelt im Bestand (${proKey.get(k)!.id}, ${s.id})`);
    proKey.set(k, s);
  }
  const plan: BsDeltaPlan = { neu: [], aktualisiert: [], unveraendert: 0, takedown: [] };
  const imInventar = new Set<number>();
  for (const z of inventar.eintraege) {
    imInventar.add(z.key);
    const alt = proKey.get(z.key);
    if (!alt) { plan.neu.push(z); continue; }
    const gruende = abweichungen(z, alt);
    if (gruende.length) plan.aktualisiert.push({ z, alt, gruende });
    else plan.unveraendert++;
  }
  for (const [k, s] of proKey) if (!imInventar.has(k)) plan.takedown.push(s);
  return plan;
}

/** Die Inventar-Zeilen, die das Delta holen und parsen muss (neu + aktualisiert). */
export function zuHolen(plan: BsDeltaPlan): InventarZeile[] {
  return [...plan.neu, ...plan.aktualisiert.map((a) => a.z)];
}

/**
 * docketSafe-Vergabe im Delta (Kollisionsregel §3.2 über die VOLLE Gruppe): die
 * Gruppe (court, GN) umfasst die frisch geparsten UND die unverändert bleibenden
 * Bestands-Snapshots — sonst bekäme ein neues Dokument mit bereits vorhandener GN
 * die blanke GN und kollidierte mit der Bestands-id. Verschöbe die Regel die id
 * eines UNVERÄNDERTEN Snapshots (neues Dokument mit früherem Datum in derselben
 * Gruppe), bricht der Lauf ab: dieser Snapshot müsste neu gebaut werden, und das
 * entscheidet kein Delta still (fail-closed, Vollimport).
 */
export function docketSafeDelta(
  geparst: Array<{ p: ParseErgebnis; z: InventarZeile }>,
  bestand: EntscheidSnapshot[],
  inventar: Inventar,
  vergabe: (g: Array<{ p: Pick<ParseErgebnis, 'gn' | 'datum'>; z: Pick<InventarZeile, 'key'> }>) => Map<number, string>,
): Map<number, string> {
  const neuKeys = new Set(geparst.map((g) => g.z.key));
  const zeileVon = new Map(inventar.eintraege.map((z) => [z.key, z]));
  type Glied = { p: Pick<ParseErgebnis, 'gn' | 'datum'>; z: Pick<InventarZeile, 'key'>; altId?: string };
  const gruppen = new Map<string, Glied[]>();
  const rein = (k: string, g: Glied) => (gruppen.get(k) ?? (gruppen.set(k, []), gruppen.get(k)!)).push(g);
  for (const { p, z } of geparst) rein(`${p.court}/${p.gn}`, { p, z });
  for (const s of bestand) {
    if (s.quelle !== BS_QUELLE) continue;
    const key = bsKeyVon(s)!;
    const z = zeileVon.get(key);
    if (neuKeys.has(key) || !z) continue;   // ersetzt bzw. Takedown
    // Metadaten-Datum = Inventar-Datum (Parser-Gegenprobe «Datums-Drift»), NICHT
    // snap.datum (kann Platzhalter/Kopf-Datum sein) — genau wie im Vollimport.
    rein(`${s.gericht}/${s.nummer}`, { p: { gn: s.nummer, datum: z.datum }, z: { key }, altId: s.id });
  }
  const out = new Map<number, string>();
  for (const [k, gruppe] of gruppen) {
    if (!gruppe.some((g) => neuKeys.has(g.z.key))) continue;   // rein Bestand: unberührt
    const safes = vergabe(gruppe);
    const court = k.slice(0, k.indexOf('/'));
    for (const g of gruppe) {
      const safe = safes.get(g.z.key)!;
      if (g.altId !== undefined) {
        if (g.altId !== `kanton/BS/${court}/${safe}`) {
          throw new Error(`[bs-delta] id-Verschiebung im Bestand: ${g.altId} → kanton/BS/${court}/${safe} (key ${g.z.key}) — Vollimport statt Delta.`);
        }
      } else out.set(g.z.key, safe);
    }
  }
  return out;
}

/**
 * Bestand + Delta zusammenführen, REGISTER-REIHENFOLGE bewahrend: unveränderte
 * Snapshots bleiben dasselbe Objekt an derselben Stelle (byte-treu, §6),
 * aktualisierte werden an ihrer Stelle ersetzt, Takedowns fallen weg, neue kommen
 * (nach id sortiert, §2) ans Ende. Die Reihenfolge zählt: der Writer sortiert das
 * Register stabil nach Datum, Gleichstände behalten die Eingabe-Folge.
 */
export function fuehreBsDeltaZusammen(bestand: EntscheidSnapshot[], plan: BsDeltaPlan, gebaut: EntscheidSnapshot[]): EntscheidSnapshot[] {
  const ersatz = new Map<number, EntscheidSnapshot>();
  for (const s of gebaut) ersatz.set(bsKeyVon(s)!, s);
  const weg = new Set(plan.takedown.map((s) => bsKeyVon(s)));
  const out: EntscheidSnapshot[] = [];
  for (const s of bestand) {
    if (s.quelle !== BS_QUELLE) { out.push(s); continue; }
    const k = bsKeyVon(s)!;
    if (weg.has(k)) continue;
    const e = ersatz.get(k);
    if (e) { out.push(e); ersatz.delete(k); } else out.push(s);
  }
  const neu = [...ersatz.values()].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  out.push(...neu);
  const ids = new Set<string>();
  for (const s of out) {
    if (ids.has(s.id)) throw new Error(`[bs-delta] id doppelt nach Zusammenführung: ${s.id}`);
    ids.add(s.id);
  }
  return out;
}

export function berichteBsDelta(plan: BsDeltaPlan): void {
  console.log(`[bs-delta] Plan: +${plan.neu.length} neu · ${plan.aktualisiert.length} aktualisiert · ${plan.unveraendert} unverändert (byte-treu) · −${plan.takedown.length} Takedown`);
  for (const a of plan.aktualisiert) console.log(`[bs-delta]   aktualisiert: ${a.alt.id} (key ${a.z.key}): ${a.gruende.join('; ')}`);
  for (const s of plan.takedown) console.log(`[bs-delta]   Takedown (aus dem Portal verschwunden, wird entfernt): ${s.id}`);
}

/**
 * Delta-Parse + Korpus schreiben: nur die Plan-Zeilen parsen, Rest von der Platte.
 * `planVorgabe` (optional, Vollabgleich): ein schon um Inhalts-Abweichungen
 * ergänzter Plan (ergaenzeInhaltsAbweichungen) statt des Listenfeld-Plans.
 */
export async function parseUndSchreibeDelta(inventar: Inventar, datum: string, planVorgabe?: BsDeltaPlan): Promise<BsDeltaPlan> {
  const { parseRohdateien, ladeFetchCheckpoint, baueSnapshot, docketSafeVergabe } = await import('./bs-parse');
  const bestand = ladeBestandSnapshots();
  const plan = planVorgabe ?? planeBsDelta(inventar, bestand);
  berichteBsDelta(plan);
  if (!zuHolen(plan).length && !plan.takedown.length) {
    console.log('[bs-delta] nichts zu tun — Korpus unberührt.');
    return plan;
  }
  const geparst = parseRohdateien(zuHolen(plan));
  const safes = docketSafeDelta(geparst, bestand, inventar, docketSafeVergabe);
  const cp = ladeFetchCheckpoint();
  const gebaut = geparst.map(({ p, z }) => baueSnapshot(p, z, safes.get(z.key)!, cp[String(z.key)]?.abgerufen ?? datum));
  const res = schreibeKorpus(fuehreBsDeltaZusammen(bestand, plan, gebaut), datum);
  console.log(`[bs-delta] geschrieben: ${res.anzahl} Manifest-Einträge (${gebaut.length} BS-Snapshots neu gebaut, ${plan.takedown.length} entfernt).`);
  return plan;
}

// ── Vollabgleich (monatlich; schliesst die GRENZE im Kopf) ──────────────────
// Posten 25.9.2026 «bs-delta sieht Textänderung ohne Listenfeld-Änderung nicht»:
// das Portal bietet weder ETag noch Last-Modified (HEAD 405, GET ohne beides —
// ua-mess-B §8); ein Frische-Beleg geht nur über den Inhalt. Der Monatslauf
// (scripts/rechtsprechung/wochenlauf-bs-voll.ts) holt ALLE Scope-Dokumente frisch
// (~56 min bei 700 ms Abstand) und vergleicht je Listen-unverändertem Dokument
// den Inhalts-Hash `sha` (sha256EntscheidBloecke der Abschnitte, wie baueSnapshot
// ihn setzt), den Spruchkörper und das Dispositiv mit dem Bestand. Abweichungen
// werden «aktualisiert» (Grund «inhalt: …») und laufen durch denselben Delta-Pfad.

/** Mehr Inhalts-Abweichungen als das ist eher Parser-Drift als Portal-Änderung: fail-closed. */
export const VOLLABGLEICH_DECKEL = 200;

export function ergaenzeInhaltsAbweichungen(
  plan: BsDeltaPlan,
  frisch: Array<{ p: Pick<ParseErgebnis, 'abschnitte' | 'besetzung' | 'dispositivOrders'>; z: InventarZeile }>,
  bestand: EntscheidSnapshot[],
  sha: (p: Pick<ParseErgebnis, 'abschnitte'>) => string,
): { plan: BsDeltaPlan; inhalt: number } {
  const imPlan = new Set(zuHolen(plan).map((z) => z.key));
  const proKey = new Map<number, EntscheidSnapshot>();
  for (const s of bestand) if (s.quelle === BS_QUELLE) proKey.set(bsKeyVon(s)!, s);
  const dazu: BsDeltaPlan['aktualisiert'] = [];
  for (const { p, z } of frisch) {
    const alt = proKey.get(z.key);
    if (!alt || imPlan.has(z.key)) continue;
    const g: string[] = [];
    if (sha(p) !== alt.sha) g.push('inhalt: sha');
    if ((p.besetzung ?? null) !== (alt.rubrum?.besetzung ?? null)) g.push('inhalt: besetzung');
    if (JSON.stringify(p.dispositivOrders ?? []) !== JSON.stringify(alt.dispositivOrders ?? [])) g.push('inhalt: dispositiv');
    if (g.length) dazu.push({ z, alt, gruende: g });
  }
  if (dazu.length > VOLLABGLEICH_DECKEL) {
    throw new Error(`[bs-voll] ABBRUCH: ${dazu.length} Inhalts-Abweichungen > Deckel ${VOLLABGLEICH_DECKEL} — Parser-Drift? Vollimport prüfen, nichts geschrieben.`);
  }
  return { plan: { ...plan, aktualisiert: [...plan.aktualisiert, ...dazu], unveraendert: plan.unveraendert - dazu.length }, inhalt: dazu.length };
}
