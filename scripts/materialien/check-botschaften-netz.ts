// scripts/materialien/check-botschaften-netz.ts
// Paket 2 (W2·6, FAHRPLAN-FEDLEX-PORTFOLIO): Live-Drift-Arbiter der Botschaften-Zuordnung
// gegen den amtlichen Fedlex-Projekt-Graphen. Verdrahtet in `check:netz`.
//
// Struktur: für die GESAMTE Grundmenge (alle Bund-Volltext-Erlasse mit SR) die Reverse-Kette
// live nachfahren (dieselbe reine parse-Funktion wie der Generator, dieselben VALUES-Batches)
// und die Botschafts-Key-Menge je Erlass gegen das committete botschaften.generated.ts
// vergleichen. Drift (neue/verschwundene Botschaft, Datums-/Curia-Abweichung) ⇒ ROT = «Generator
// neu laufen lassen» (nie Auto-Fix, §7). Zusätzlich Referenzfall-Assertion (DSG→2).
// Exit 0 OK · 1 Drift · 2 Netzfehler.
//
// VOLLABGLEICH statt Stichprobe seit 1.9.2026 (Befund (d), QS-MONITOR-ROT): die frühere
// Stichprobe von 8 festen Keys war blind für Register-Zuwachs — #581 fand am 30.8. zwei
// amtliche Botschaften (BOTSCHAFT-2025-1528 EOG, BOTSCHAFT-2024-2448 ELG), die monatelang
// fehlten, während das Tor grün war. Kosten: 227 SR in 5 VALUES-Batches (= ein Generator-Lauf,
// ~2 s), kein Mehrpreis gegenüber der Stichprobe (die dieselbe Batch-Mechanik nutzte).
// Rot-Beweis 1.9.2026: committete Botschaft ausserhalb der 8 Keys entfernt → alt grün, neu rot.

import {
  grundmenge, holeBindings, baueBotschaften, filtereBotschaftsKanten, type BotschaftEintrag, type ErlassMeta,
} from './botschaften-generieren.ts';
import { auswirkungsIndex, ladeAuswirkungsQuellen } from './botschaften-auswirkungen.ts';
import { holeEreignisBindings, baueEreignisse } from './verfahrens-ereignisse.ts';
import type { VerfahrensEreignis } from '../../src/lib/materialien/verfahren.ts';
import { BOTSCHAFTEN } from '../../src/lib/materialien/botschaften.generated.ts';

/** Intrinsische Signatur = NUR Felder am Botschafts-/Expression-Knoten selbst, die NICHT
 *  davon abhängen, welche SR abgefragt wurden. BEWUSST AUSGENOMMEN (korpus-/view-abhängig,
 *  sonst Fehlalarm bei Stichprobe): `normKeys`/`rechtsgebiet` (SR-Join) UND `projEli`/`nummer`
 *  (aus dem kleinsten proj über die abgefragten SR — bei Mantelerlassen sample-abhängig).
 *  Diese Felder deckt der Offline-Tor check:materialien intern ab; hier zählt Existenz/Titel/
 *  Datum/Link-Treue je Botschaft + die Mengen-Zugehörigkeit je Erlass. */
//  E1 (§11.7, Kritik A12): die VERFAHRENSKETTE gehört in die Signatur — sonst bliebe ein
//  neuer amtlicher Verfahrensschritt (Beschluss des Parlaments, Referendumsfrist,
//  Abstimmung) drift-unsichtbar, dasselbe Loch wie die frühere 8-Key-Stichprobe.
//  Vergleich JE FGA (nicht je proj): die Ereignisse ALLER Projekt-Knoten einer Botschaft
//  sind vereinigt (ereignisseJeBotschaft) — sonst meldete jeder Mantelerlass Fehlalarm.
function ereignisSig(ev: readonly VerfahrensEreignis[] | undefined): string {
  return (ev ?? []).map((e) => `${e.code}:${e.datum ?? ''}:${e.res ?? ''}`).join(';');
}

function intrinsischeSig(b: {
  titel: string; titelFr?: string; titelIt?: string; stand: string; quelleUrl: string;
  ereignisse?: VerfahrensEreignis[];
}): string {
  return [b.titel, b.titelFr ?? '', b.titelIt ?? '', b.stand, b.quelleUrl, ereignisSig(b.ereignisse)].join('');
}

// Referenzfall (DoD, seit Paket 2): DSG → genau 2 Botschaften.
const REFERENZ_DSG = 2;

function keysProErlass(eintraege: { key: string; normKeys: string[] }[]): Map<string, Set<string>> {
  const m = new Map<string, Set<string>>();
  for (const e of eintraege) for (const nk of e.normKeys) {
    if (!m.has(nk)) m.set(nk, new Set());
    m.get(nk)!.add(e.key);
  }
  return m;
}

async function main(): Promise<void> {
  const meta: ErlassMeta[] = grundmenge();
  if (meta.length < 200 || !meta.some((m) => m.key === 'DSG')) {
    console.error(`check:botschaften-netz ROT: Grundmenge unplausibel (${meta.length} Erlasse, DSG ${meta.some((m) => m.key === 'DSG') ? 'da' : 'fehlt'}) — Register-Bruch?`);
    process.exit(1);
  }

  // M-5: derselbe Auswirkungs-Index wie im Generator (committeter Revisionen-store-raw).
  const auswirkungen = auswirkungsIndex(ladeAuswirkungsQuellen(meta.map((m) => m.key)));
  let bindings;
  let ereignisseProProj;
  try {
    bindings = filtereBotschaftsKanten(await holeBindings(meta)); // kein store-raw im Tor
    // E1: zweiter Durchgang (derselbe Endpunkt) für die Verfahrenskette je Projekt-Knoten.
    const projUris = [...new Set(bindings.map((b) => b.proj?.value).filter((v): v is string => !!v))].sort();
    ereignisseProProj = baueEreignisse(await holeEreignisBindings(projUris));
  } catch (e) {
    console.error(`check:botschaften-netz: Netzfehler — ${(e as Error).message}`);
    process.exit(2);
  }
  const live = baueBotschaften(bindings, meta, ereignisseProProj, auswirkungen);

  // committet: ALLE Botschaften (Vollabgleich) — die Grundmenge ist dieselbe wie im Generator.
  const committetRelevant = BOTSCHAFTEN;
  const sigCommittet = new Map(committetRelevant.map((b) => [b.key, intrinsischeSig(b)]));
  const sigLive = new Map(live.map((b: BotschaftEintrag) => [b.key, intrinsischeSig(b)]));

  const liveProErlass = keysProErlass(live);
  const commProErlass = keysProErlass(committetRelevant.map((b) => ({ key: b.key, normKeys: b.normKeys ?? [] })));

  const fehler: string[] = [];
  for (const key of meta.map((m) => m.key)) {
    const l = liveProErlass.get(key) ?? new Set<string>();
    const c = commProErlass.get(key) ?? new Set<string>();
    for (const k of l) if (!c.has(k)) fehler.push(`${key}: Botschaft '${k}' live vorhanden, fehlt committet (Generator neu laufen).`);
    for (const k of c) if (!l.has(k)) fehler.push(`${key}: Botschaft '${k}' committet, live nicht mehr (Generator neu laufen).`);
  }
  // Intrinsische Drift (Datum/Curia/Titel/projEli/Link geändert) über die gemeinsamen Keys.
  for (const [k, s] of sigLive) {
    const sc = sigCommittet.get(k);
    if (sc && sc !== s) fehler.push(`${k}: Inhalts-Drift (Datum/Titel/Link/Verfahrenskette geändert) — Generator neu laufen.`);
  }

  // Referenzfall-Assertion (DoD): DSG → genau 2 Botschaften.
  const dsg = liveProErlass.get('DSG') ?? new Set();
  if (dsg.size !== REFERENZ_DSG) fehler.push(`Referenzfall DSG: erwartet ${REFERENZ_DSG} Botschaften, live ${dsg.size}.`);
  // Mengen-Gate: Botschaften ohne Bezug zur Grundmenge dürfen weder live noch committet auftauchen.
  const liveKeys = new Set(live.map((b: BotschaftEintrag) => b.key));
  for (const b of committetRelevant) if (!liveKeys.has(b.key)) fehler.push(`Botschaft '${b.key}' committet, live in keinem Erlass der Grundmenge mehr (Generator neu laufen).`);

  if (fehler.length) {
    for (const f of fehler) console.error(`ROT   botschaften-netz: ${f}`);
    console.error(`\ncheck:botschaften-netz — ${fehler.length} Drift-Befund(e). 'npm run materialien:botschaften -- --datum=$(date +%F)' + 'npm run materialien -- …' neu laufen (nie Auto-Fix).`);
    process.exit(1);
  }
  const evZahl = live.reduce((n: number, b: BotschaftEintrag) => n + (b.ereignisse?.length ?? 0), 0);
  console.log(`check:botschaften-netz OK — Vollabgleich ${meta.length} Erlasse, ${committetRelevant.length} Botschaften, ${evZahl} Verfahrens-Ereignisse drift-frei gegen den Fedlex-Projekt-Graphen (DSG-Referenz: ${REFERENZ_DSG}).`);
}

main().catch((e) => {
  console.error(`check:botschaften-netz ROT: ${(e as Error).message}`);
  process.exit(2);
});
