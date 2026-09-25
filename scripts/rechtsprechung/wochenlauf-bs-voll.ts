// ─── BS-Vollabgleich (Monatslauf des Wochenlauf-Workflows, Modus bs-vollabgleich) ─
//
//   vite-node scripts/rechtsprechung/wochenlauf-bs-voll.ts -- --datum=YYYY-MM-DD
//
// Inventar neu → ALLE Scope-Dokumente frisch holen (bs-fetch, 700 ms Abstand,
// ~56 min) → alle parsen → Listenfeld-Plan (planeBsDelta) um Inhalts-
// Abweichungen ergänzen (ergaenzeInhaltsAbweichungen, bs-delta.ts) → derselbe
// Delta-Schreibpfad (parseUndSchreibeDelta). Nur BS, sonst nichts.
// Bilanzzeile für den Bericht: «[bs-voll] geprüft: n · Inhalt geändert: m · …»
// (leseBsVoll, wochenlauf-kern.ts).
//
// Frische Rohdateien sind Pflicht: bs-fetch überspringt vorhandene Rohdateien
// (Idempotenz). Im Runner ist daten/bs-fiw/raw/ leer; lokal mit gefülltem
// Roh-Store bricht der Lauf ab, statt gegen alte Bytes zu vergleichen.
import { existsSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { baueInventar } from './bs-inventar';
import { fetcheAlle, BS_DATEN, RAW_DIR } from './bs-fetch';
import { planeBsDelta, berichteBsDelta, ergaenzeInhaltsAbweichungen, parseUndSchreibeDelta } from './bs-delta';
import { ladeBestandSnapshots } from '../normtext/entscheide-schreiben';
import { sha256EntscheidBloecke } from '../normtext/sha-entscheide';

async function main(): Promise<void> {
  const datum = process.argv.find((a) => a.startsWith('--datum='))?.slice(8) ?? '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datum)) throw new Error('--datum=YYYY-MM-DD fehlt (§2: kein stilles Heute)');
  if (existsSync(RAW_DIR) && readdirSync(RAW_DIR).length) {
    throw new Error(`[bs-voll] ABBRUCH: ${RAW_DIR} ist nicht leer — der Vollabgleich braucht frische Rohdateien (bs-fetch überspringt vorhandene).`);
  }
  mkdirSync(BS_DATEN, { recursive: true });
  const inv = await baueInventar(datum);
  writeFileSync(join(BS_DATEN, 'inventar.json'), JSON.stringify(inv, null, 1) + '\n', 'utf8');
  const bestand = ladeBestandSnapshots();
  const plan = planeBsDelta(inv, bestand);
  berichteBsDelta(plan);
  const f = await fetcheAlle(inv, datum);
  if (f.fehler.length) {
    console.error(`[bs-voll] AUSFALL: ${f.fehler.length} Fetch-Fehler — nichts geschrieben.`);
    process.exitCode = 1;
    return;
  }
  const { parseRohdateien } = await import('./bs-parse');
  const frisch = parseRohdateien(inv.eintraege);
  const { plan: voll, inhalt } = ergaenzeInhaltsAbweichungen(plan, frisch, bestand, (p) => sha256EntscheidBloecke(p.abschnitte));
  console.log(`[bs-voll] geprüft: ${frisch.length} · Inhalt geändert: ${inhalt} · Listenfelder geändert: ${plan.aktualisiert.length} · neu: ${plan.neu.length} · Takedown: ${plan.takedown.length}`);
  await parseUndSchreibeDelta(inv, datum, voll);
}

main().catch((e) => { console.error(e); process.exit(1); });
