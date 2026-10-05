// scripts/materialien/check-vernehmlassungen-netz.ts
// Paket 3 (W3·11, FAHRPLAN-FEDLEX-PORTFOLIO): Live-Currency-Arbiter der Vernehmlassungen gegen
// den amtlichen Fedlex-Gesetzgebungs-Graphen. Verdrahtet in `check:netz` (NICHT im Default-gate).
//
// Vernehmlassungen sind MUTABEL (consultationStatus wechselt, Fristen verlängern sich). Für eine
// stratifizierte Erlass-Stichprobe die Consultation-Kette live nachfahren (dieselbe reine parse-
// Funktion wie der Generator) und je Erlass die Verfahrens-Key-Menge + die intrinsische Signatur
// (Status/Frist/Titel/Link) gegen das committete vernehmlassungen.generated.ts vergleichen. Drift
// (neues/verschwundenes Verfahren, Statuswechsel, Fristverlängerung) ⇒ ROT = «Generator neu laufen»
// (nie Auto-Fix, §7). Zusätzlich Referenzfall-UNTERGRENZEN (OR≥34, DSG≥3, MWSTG≥14; s. MINDEST).
// Exit 0 OK · 1 Drift · 2 Netzfehler.

import {
  grundmenge, holeBindings, baueVernehmlassungen,
} from './vernehmlassungen-generieren.ts';
import type { ErlassMeta } from './botschaften-generieren.ts';
import { VERNEHMLASSUNGEN } from '../../src/lib/materialien/vernehmlassungen.generated.ts';
import type { MaterialRegistereintrag } from '../../src/lib/materialien/typen.ts';

/** Intrinsische Signatur = Felder am Consultation-Knoten selbst (view-unabhängig): Titel DE/FR/IT,
 *  Status, Frist, Live-Link. BEWUSST AUSGENOMMEN: normKeys/rechtsgebiet/rang (SR-Join- bzw.
 *  Stichproben-abhängig) — die deckt der Offline-Tor check:materialien intern ab. `stand`
 *  (Abfragedatum) ist ausgenommen, weil es im committeten Stand fix, im Live-Lauf aber der
 *  Prüftag ist → sonst Dauer-Fehlalarm; Currency zählt über Status/Frist, nicht über stand. */
function intrinsischeSig(e: MaterialRegistereintrag): string {
  const v = e.vernehmlassung;
  return [e.titel, e.titelFr ?? '', e.titelIt ?? '', v?.status ?? '', v?.fristStart ?? '', v?.fristEnde ?? '', e.quelleUrl].join('');
}

// Stratifiziert: Referenzfälle (OR/DSG/MWSTG) + Legacy-6xxx-Reichweite + Verordnung (Mantel-Treffer).
const STICHPROBE_KEYS = ['OR', 'DSG', 'MWSTG', 'ZGB', 'STGB', 'AHVG', 'AIG', 'VRV'];
// Referenzfälle (POC 10.7.2026 live reproduziert): distinkte Consultations je Erlass als
// UNTERGRENZE, nicht als Gleichheit. Zweck = Parser-/Query-Verlust-Schutz, der auch dann trägt,
// wenn der Generator mit dem Verlust neu gelaufen und dieser mit-committet wurde (der
// Committet-vs-Live-Mengenvergleich in main() sähe dann keinen Unterschied). Vernehmlassungen
// wachsen aber mit jedem neuen Verfahren (OR: 33 am 10.7.2026, 34 am 5.10.2026 — die
// frühere Gleichheit kippte mit jedem neuen OR-Verfahren, Normen-Monitor rot ab 21.9.2026,
// Alarm-Issue #956). Wartungsweg: kein laufendes Nachführen nötig; anheben nur, wenn der
// Verlust-Schutz enger greifen soll, senken nie ohne amtlichen Beleg (Fedlex-Graph, Verfahren
// wirklich entfallen).
// Ratsche (Rot-Probe 5.10.2026 an diesem Tor): mit OR=33 blieb ein mit-committeter Verlust von
// genau einem OR-Verfahren (34→33) unentdeckt; deshalb OR=34 (Stand 5.10.2026) — DSG/MWSTG stehen
// schon auf ihrem Live-Wert. Anheben nur nach oben.
const MINDEST: Record<string, number> = { OR: 34, DSG: 3, MWSTG: 14 };

function keysProErlass(eintraege: { key: string; normKeys?: string[] }[]): Map<string, Set<string>> {
  const m = new Map<string, Set<string>>();
  for (const e of eintraege) for (const nk of e.normKeys ?? []) {
    if (!m.has(nk)) m.set(nk, new Set());
    m.get(nk)!.add(e.key);
  }
  return m;
}

async function main(): Promise<void> {
  const alle = grundmenge();
  const meta: ErlassMeta[] = alle.filter((m) => STICHPROBE_KEYS.includes(m.key));
  const fehlend = STICHPROBE_KEYS.filter((k) => !meta.some((m) => m.key === k));
  if (fehlend.length) {
    console.error(`check:vernehmlassungen-netz ROT: Stichproben-Keys nicht in der Grundmenge: ${fehlend.join(', ')}.`);
    process.exit(1);
  }

  let bindings;
  try {
    bindings = await holeBindings(meta); // kein store-raw im Tor
  } catch (e) {
    console.error(`check:vernehmlassungen-netz: Netzfehler — ${(e as Error).message}`);
    process.exit(2);
  }
  // Datum für den Live-Bau ist irrelevant für die intrinsische Signatur (stand ausgenommen).
  const live = baueVernehmlassungen(bindings, meta, '2000-01-01');

  const stichKeys = new Set(STICHPROBE_KEYS);
  const committetRelevant = VERNEHMLASSUNGEN.filter((v) => (v.normKeys ?? []).some((k) => stichKeys.has(k)));
  const sigCommittet = new Map(committetRelevant.map((v) => [v.key, intrinsischeSig(v)]));
  const sigLive = new Map(live.map((v) => [v.key, intrinsischeSig(v)]));

  const liveProErlass = keysProErlass(live);
  const commProErlass = keysProErlass(committetRelevant);

  const fehler: string[] = [];
  for (const key of STICHPROBE_KEYS) {
    const l = liveProErlass.get(key) ?? new Set<string>();
    const c = commProErlass.get(key) ?? new Set<string>();
    for (const k of l) if (!c.has(k)) fehler.push(`${key}: Verfahren '${k}' live vorhanden, fehlt committet (Generator neu laufen).`);
    for (const k of c) if (!l.has(k)) fehler.push(`${key}: Verfahren '${k}' committet, live nicht mehr (Generator neu laufen).`);
  }
  // Intrinsische Drift (Status/Frist/Titel/Link geändert) über die gemeinsamen Keys — der
  // Currency-Kern: ein Statuswechsel laufend→abgeschlossen oder eine Fristverlängerung meldet hier.
  for (const [k, s] of sigLive) {
    const sc = sigCommittet.get(k);
    if (sc && sc !== s) fehler.push(`${k}: Currency-Drift (Status/Frist/Titel/Link geändert) — Generator neu laufen.`);
  }

  // Referenzfall-Untergrenzen (DoD): distinkte Verfahren je Erlass dürfen nie darunter fallen.
  for (const [key, mindest] of Object.entries(MINDEST)) {
    const n = (liveProErlass.get(key) ?? new Set()).size;
    if (n < mindest) fehler.push(`Referenzfall ${key}: mindestens ${mindest} Verfahren erwartet, live ${n} (Parser-/Query-Verlust?).`);
  }

  if (fehler.length) {
    for (const f of fehler) console.error(`ROT   vernehmlassungen-netz: ${f}`);
    console.error(`\ncheck:vernehmlassungen-netz — ${fehler.length} Drift-Befund(e). 'npm run materialien:vernehmlassungen -- --datum=$(date +%F)' + 'npm run materialien -- …' neu laufen (nie Auto-Fix).`);
    process.exit(1);
  }
  console.log(`check:vernehmlassungen-netz OK — ${STICHPROBE_KEYS.length} Erlasse stichprobenweise currency-frei gegen den Fedlex-Graphen (Untergrenzen eingehalten: ${Object.entries(MINDEST).map(([k, m]) => `${k}≥${m} live ${(liveProErlass.get(k) ?? new Set()).size}`).join(' · ')}).`);
}

main().catch((e) => {
  console.error(`check:vernehmlassungen-netz ROT: ${(e as Error).message}`);
  process.exit(2);
});
