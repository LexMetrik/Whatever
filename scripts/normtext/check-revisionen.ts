// scripts/normtext/check-revisionen.ts
// Paket 5 (W2·6-REV) Verifikations-Tor für die Revisions-Timeline-Sidecars.
//
// OFFLINE (`check:revisionen`, in der check-Kette):
//   (1) Determinismus — Sidecar aus store-raw neu gebaut == committetes Sidecar (byte-gleich, §2).
//   (2) Schema-Validität — dateEntryInForce ISO, quelleUrl http/s, erlassKey ∈ Register,
//       art ∈ {aenderung, sammelerlass-marker}, sha stimmt.
//   (3) Cross-Link-Integrität — jeder botschaftKey verweist auf einen existierenden
//       Paket-2-Botschaftseintrag (kein toter Link, §8; Cross-Package-Key-Stabilität, Finding 9).
//   (4) Sortierung — Datum absteigend.
//   (5) Regressionsanker. BIS 22.9.2026: «DSG-Timeline SR 235.1 enthält Einträge VOR und NACH
//       der Totalrevision 2020» — FALSIFIZIERT 23.9.2026 (S6-D1, AE-3): Einträge vor 2020
//       waren Änderungen des VORGÄNGER-DSG 1992 (anderes Abstract, gleiche SR), der Anker
//       hat genau die Fehlerklasse festgeschrieben. Seither vier Anker aus der amtlichen
//       Rechtsanalyse (live 23.9.2026): DSG ohne Eintrag vor 2023-09-01 und ohne Stammerlass
//       AS 2022 491; ZPO ohne GestG AS 2000 2355; OR mit dem Sammelerlass AS 2022 732 (AE-4)
//       und der Aktienrechtsrevision AS 2020 4005 an 2021-01-01 UND 2023-01-01 (AE-5).
//   (6) nichtKonsolidiert-Marker gesetzt gdw. dateEntryInForce > Korpus-Stand (Finding 4).
//   (7) Coverage — je Bund-Volltext-Erlass genau ein Sidecar (kein Drift Grundmenge↔Dateien).
//   (8) §8-Marker (§703, Semantik zweimal korrigiert — Gegenprüfung PR #827 Auflagen a+f — s.
//       `RevisionEintrag.plausibilitaet`): plausibilitaetsGrund gdw. plausibilitaet gesetzt,
//       einziger bekannter Wert 'berichtigung-fremdes-as-dokument'; UND (8b, Auflage d
//       Gegenprüfung PR #827) der Marker ist NUR zulässig, wenn raw unabhängig — ohne
//       `baueRevisionen` erneut aufzurufen — dieselbe Fremd-SR belegt (raw.bBindings trägt
//       für den oc eine `rectifies`-Bindung UND raw.rectifiesInfoProOc löst sie auf eine von
//       `sidecar.sr` abweichende SR auf). Rot-Beweis (§6.7): manuell ein `plausibilitaet`
//       ohne Rückhalt in raw eingefügt → dieser Ast schlägt fehl (s. ROADMAP-CHRONIK.md).
//   (9)-(12) Pfad (c), S6-D1 23.9.2026 (Befunde AE-2..AE-5) — direkt aus raw.kontext, OHNE
//       baueRevisionen: (9) kein Eintrag ist der Stammerlass (`kontext.basicAct`); (10) jeder
//       Marker verlinkt die Fassung seines Datums (`/eli/<abstract>/<YYYYMMDD>/de`) und das
//       Datum ist ein Pfad-(a)-Stand (Rot-Beleg: der Alt-Link `/eli/cc/<SR>` fällt hier durch);
//       (11) Einträge ohne `wirkungen` (nur Pfad b) liegen im Geltungsfenster
//       [inkrafttreten, aufhebung]; (12) `etappen` ≥ 2, aufsteigend, enthält das eigene Datum,
//       und jede Etappe steht als Eintrag desselben ocUri da; `wirkungen` nur bekannte Werte.
//       Jeder Bund-Volltext-Erlass mit Pin trägt raw.kontext.
//
// NETZ (`check:revisionen-netz`, in check:netz, --netz): Stichproben-Nachfahrt Pfad (b) +
// Cross-Check (a)vs(b) gegen den amtlichen Endpunkt; Treffermenge/shas vs. committet, Drift=Exit 1.
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import {
  grundmenge, holeBindingsB, holeStaendeA, baueRevisionen, serialisiere, botschaftIndex,
  ermittleBelegteOcs, holeRectifiesSr, baueOcZuRectifiesSr, holeAbstractStamm, holeAuswirkungen, holeOcStamm,
  fassungsUrl, WIRKUNGEN, type RevisionSidecar, type RectifiesInfo, type RevisionsKontext, type OcStamm,
} from './revisionen-generieren.ts';
import { ERLASS_REGISTER } from '../../src/lib/normtext/register.ts';
import { BOTSCHAFTEN } from '../../src/lib/materialien/botschaften.generated.ts';
import type { SparqlBinding } from '../fedlex-sparql.ts';

const SIDECAR_DIR = 'public/normtext/revisionen';
const RAW_DIR = 'bibliothek/normtext/revisionen-raw';
const netz = process.argv.includes('--netz');
const fehler: string[] = [];

const registerKeys = new Set(ERLASS_REGISTER.map((e) => e.key));
const botschaftKeys = new Set(BOTSCHAFTEN.map((b) => b.key));
const ocZuBotschaft = botschaftIndex();
const meta = grundmenge();

function lade(key: string): RevisionSidecar | null {
  const p = `${SIDECAR_DIR}/${key}.json`;
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, 'utf8')) as RevisionSidecar;
}

// ── (7) Coverage: Grundmenge ↔ Sidecar-Dateien deckungsgleich ────────────────────
const dateien = existsSync(SIDECAR_DIR)
  ? new Set(readdirSync(SIDECAR_DIR).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5)))
  : new Set<string>();
for (const m of meta) if (!dateien.has(m.key)) fehler.push(`Coverage: Sidecar fehlt für ${m.key}.`);
const grundmengeKeys = new Set(meta.map((m) => m.key));
for (const d of dateien) if (!grundmengeKeys.has(d)) fehler.push(`Coverage: verwaistes Sidecar ${d}.json (nicht in Grundmenge).`);

// ── (1)-(6) je Sidecar ───────────────────────────────────────────────────────────
for (const m of meta) {
  const sidecar = lade(m.key);
  if (!sidecar) continue; // Coverage-Fehler oben
  const rawP = `${RAW_DIR}/${m.key}.json`;
  if (!existsSync(rawP)) { fehler.push(`Determinismus: store-raw fehlt für ${m.key}.`); continue; }
  const raw = JSON.parse(readFileSync(rawP, 'utf8')) as {
    korpusStand: string; bBindings: SparqlBinding[]; aStaende: string[]; belegteOcs?: string[];
    rectifiesInfoProOc?: Record<string, RectifiesInfo>; kontext?: RevisionsKontext | null;
  };
  const kontext = raw.kontext ?? undefined;
  if (!kontext) fehler.push(`${m.key}: store-raw ohne Pfad-(c)-Kontext (normtext:revisionen neu laufen lassen).`);
  const belegteOcsSet = new Set(raw.belegteOcs ?? []);
  const rectifiesInfoProOc = new Map(Object.entries(raw.rectifiesInfoProOc ?? {}));

  // (1) Determinismus: aus raw neu bauen (mit committetem abgerufen + raw.korpusStand).
  const neu = baueRevisionen(m, raw.bBindings, raw.aStaende, raw.korpusStand, ocZuBotschaft, sidecar.abgerufen, belegteOcsSet, rectifiesInfoProOc, kontext);
  if (serialisiere(neu) !== serialisiere(sidecar)) {
    fehler.push(`Determinismus: ${m.key} — Neubau aus raw ≠ committetes Sidecar (Nichtdeterminismus oder Handedit).`);
  }

  // (2)-(6) Invarianten auf dem committeten Sidecar.
  if (!registerKeys.has(sidecar.erlassKey)) fehler.push(`${m.key}: erlassKey nicht im Register.`);
  let vorher = '￿';
  for (const r of sidecar.revisionen) {
    if (r.art !== 'aenderung' && r.art !== 'sammelerlass-marker') fehler.push(`${m.key}: unbekannte art «${r.art}».`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(r.dateEntryInForce)) fehler.push(`${m.key}: dateEntryInForce «${r.dateEntryInForce}» nicht ISO.`);
    if (!/^https?:\/\//.test(r.quelleUrl)) fehler.push(`${m.key}: quelleUrl «${r.quelleUrl}» nicht http(s) (§7c).`);
    if (r.botschaftKey && !botschaftKeys.has(r.botschaftKey)) fehler.push(`${m.key}: toter botschaftKey «${r.botschaftKey}».`);
    if (r.art === 'aenderung' && !r.ocUri) fehler.push(`${m.key}: aenderung ohne ocUri.`);
    // (8) §8-Marker: Grund gdw. Marker, kein unbekannter Marker-Wert.
    if (r.plausibilitaet && r.plausibilitaet !== 'berichtigung-fremdes-as-dokument') {
      fehler.push(`${m.key}: unbekannter plausibilitaet-Wert «${r.plausibilitaet}».`);
    }
    if (!!r.plausibilitaet !== !!r.plausibilitaetsGrund) {
      fehler.push(`${m.key}: plausibilitaet/plausibilitaetsGrund inkonsistent bei ${r.dateEntryInForce}.`);
    }
    // Finding 4b, zweite Stufe (W2·18-FEHLERBUCH): dateInKraftFuerCh nur auf 'aenderung',
    // ISO, und ECHT früher als dateEntryInForce — sonst wäre «in Kraft seit … angewendet
    // ab …» widersinnig (§7). Determinismus (1) fängt jeden Whitelist-Handedit bereits ab;
    // dies ist die zusätzliche, lesbare Invariante (§6.7: ein Tor, das scheitern KANN).
    if (r.dateInKraftFuerCh) {
      if (r.art !== 'aenderung') fehler.push(`${m.key}: dateInKraftFuerCh auf einem ${r.art}-Eintrag (nur 'aenderung' zulässig).`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(r.dateInKraftFuerCh)) fehler.push(`${m.key}: dateInKraftFuerCh «${r.dateInKraftFuerCh}» nicht ISO.`);
      if (r.dateInKraftFuerCh >= r.dateEntryInForce) fehler.push(`${m.key}: dateInKraftFuerCh «${r.dateInKraftFuerCh}» nicht früher als dateEntryInForce «${r.dateEntryInForce}».`);
    }
    // (8b) Auflage d (Gegenprüfung PR #827, §6.7): unabhängige Rückhalt-Prüfung DIREKT aus
    // raw — kein erneuter Aufruf von baueRevisionen/baueOcZuRectifiesSr. Ein Marker ohne
    // passende rectifies-Bindung + abweichende Fremd-SR in raw ist unbelegt (Handedit oder
    // Regression) und macht diesen Ast rot (Rot-Beweis in ROADMAP-CHRONIK.md).
    if (r.plausibilitaet === 'berichtigung-fremdes-as-dokument') {
      const rawEintrag = raw.bBindings.find((b) => b.oc?.value === r.ocUri);
      const rectifiesZiel = rawEintrag?.rectifies?.value;
      const info = r.ocUri ? rectifiesInfoProOc.get(r.ocUri) : undefined;
      if (!rectifiesZiel || info === undefined || info.fremdeSr === sidecar.sr) {
        fehler.push(`${m.key}: plausibilitaet gesetzt ohne Rückhalt in raw (rectifies-Bindung/Fremd-SR) bei ${r.ocUri ?? r.dateEntryInForce}.`);
      }
    }
    // (6) nichtKonsolidiert korrekt gdw. dateEntryInForce > Korpus-Stand UND kein Finding-4b-
    // Text-Beleg (belegteOcs) vorliegt.
    const soll = r.dateEntryInForce > raw.korpusStand && !(r.ocUri && belegteOcsSet.has(r.ocUri));
    if (soll !== !!r.nichtKonsolidiert) fehler.push(`${m.key}: nichtKonsolidiert falsch bei ${r.dateEntryInForce} (Korpus-Stand ${raw.korpusStand}).`);
    // (9)-(12) Pfad (c), direkt aus raw (s. Kopf).
    if (kontext) {
      if (r.ocUri && r.ocUri === kontext.basicAct) fehler.push(`${m.key}: Stammerlass ${r.ocUri} als Eintrag (AE-3).`);
      if (r.art === 'sammelerlass-marker') {
        const soll = fassungsUrl(kontext.abstractEli, r.dateEntryInForce);
        if (r.quelleUrl !== soll) fehler.push(`${m.key}: Marker ${r.dateEntryInForce} verlinkt «${r.quelleUrl}» statt der Fassung «${soll}» (AE-2).`);
        if (!raw.aStaende.includes(r.dateEntryInForce)) fehler.push(`${m.key}: Marker ${r.dateEntryInForce} ist kein Pfad-(a)-Stand (Link ohne Fassung).`);
      }
      if (r.art === 'aenderung' && !r.wirkungen) {
        if (kontext.inkrafttreten && r.dateEntryInForce < kontext.inkrafttreten) fehler.push(`${m.key}: Pfad-(b)-Eintrag ${r.roFundstelle ?? r.ocUri} ${r.dateEntryInForce} vor Inkrafttreten ${kontext.inkrafttreten} (AE-3).`);
        if (kontext.aufhebung && r.dateEntryInForce > kontext.aufhebung) fehler.push(`${m.key}: Pfad-(b)-Eintrag ${r.roFundstelle ?? r.ocUri} ${r.dateEntryInForce} nach Aufhebung ${kontext.aufhebung}.`);
      }
    }
    if (r.wirkungen) {
      for (const w of r.wirkungen) if (!(WIRKUNGEN as readonly string[]).includes(w)) fehler.push(`${m.key}: unbekannte Wirkung «${w}».`);
      if (r.art !== 'aenderung') fehler.push(`${m.key}: wirkungen auf einem ${r.art}-Eintrag.`);
    }
    if (r.etappen) {
      const e = r.etappen;
      const sortiert = e.every((d, i) => i === 0 || e[i - 1] < d);
      if (e.length < 2 || !sortiert || !e.includes(r.dateEntryInForce)) fehler.push(`${m.key}: etappen ${e.join(',')} inkonsistent bei ${r.ocUri} ${r.dateEntryInForce}.`);
      for (const d of e) {
        if (!sidecar.revisionen.some((x) => x.ocUri === r.ocUri && x.dateEntryInForce === d)) fehler.push(`${m.key}: Etappe ${d} von ${r.ocUri} ohne eigenen Eintrag.`);
      }
    }
    // (4) Sortierung Datum absteigend.
    if (r.dateEntryInForce > vorher) fehler.push(`${m.key}: Sortierung verletzt bei ${r.dateEntryInForce} (> ${vorher}).`);
    vorher = r.dateEntryInForce;
  }

  // (5) Regressionsanker (s. Kopf; AE-3/AE-4/AE-5).
  const hat = (fund: string, datum?: string) => sidecar.revisionen.some((r) => r.roFundstelle === fund && (!datum || r.dateEntryInForce === datum));
  if (m.key === 'DSG' && (sidecar.revisionen.some((r) => r.dateEntryInForce < '2023-09-01') || hat('AS 2022 491'))) {
    fehler.push('DSG-Anker: Eintrag vor dem Inkrafttreten 2023-09-01 oder Stammerlass AS 2022 491 in der Timeline (AE-3).');
  }
  if (m.key === 'ZPO' && hat('AS 2000 2355')) fehler.push('ZPO-Anker: GestG AS 2000 2355 (Vorgänger gleicher SR) in der Timeline (AE-3).');
  if (m.key === 'OR' && !(hat('AS 2022 732') && hat('AS 2020 4005', '2021-01-01') && hat('AS 2020 4005', '2023-01-01'))) {
    fehler.push('OR-Anker: Sammelerlass AS 2022 732 oder eine Etappe von AS 2020 4005 (2021-01-01/2023-01-01) fehlt (AE-4/AE-5).');
  }
}

// ── Netz: Stichprobe gegen den amtlichen Endpunkt ─────────────────────────────────
if (netz) {
  // FZA IMMER dabei (§6.7-Auflage Gegenprüfung PR #820): einziger Erlass mit echtem
  // Finding-4b-Text-Beleg — ohne ihn bliebe der Drift-Check unten trivial (leere Mengen).
  const stichprobe = ['DSG', 'MWSTG', 'OR', 'DBG', 'FZA'].filter((k) => grundmengeKeys.has(k)).map((k) => meta.find((m) => m.key === k)!);
  try {
    const bindings = await holeBindingsB(stichprobe, fetch);
    const bNachSr = new Map<string, SparqlBinding[]>();
    for (const m of stichprobe) bNachSr.set(m.sr, []);
    for (const b of bindings) { const sr = b.sr?.value; if (sr && bNachSr.has(sr)) bNachSr.get(sr)!.push(b); }
    // §8-Marker: die jolux:rectifies-Ziele der Stichprobe frisch auflösen (sonst könnte
    // holeRectifiesSr/baueOcZuRectifiesSr beliebig kaputtgehen und check:revisionen-netz
    // bliebe grün, §6.7 «ein Tor, das nicht scheitern kann»).
    const rectifiesZieleFrisch = [...new Set(bindings.map((b) => b.rectifies?.value).filter((v): v is string => !!v))];
    const zielInfoProOcFrisch = await holeRectifiesSr(rectifiesZieleFrisch, fetch);
    // Pfad (c) frisch (S6-D1): sonst könnten holeAuswirkungen/holeAbstractStamm/holeOcStamm
    // beliebig kaputtgehen und dieses Netz-Tor bliebe grün (§6.7).
    const stichAbstracts = stichprobe.map((m) => liesAbstract(m.sr)).filter((a) => !!a);
    const stammFrisch = await holeAbstractStamm(stichAbstracts, fetch);
    const auswFrisch = await holeAuswirkungen(stichAbstracts, fetch);
    const bOcsFrisch = new Set(bindings.map((b) => b.oc?.value));
    const ocNurCFrisch = [...new Set([...auswFrisch.values()].flat().map((a) => a.oc))].filter((oc) => !bOcsFrisch.has(oc));
    const ocStammFrisch = await holeOcStamm(ocNurCFrisch, fetch);
    for (const m of stichprobe) {
      const committet = lade(m.key);
      const rawP = `${RAW_DIR}/${m.key}.json`;
      if (!committet || !existsSync(rawP)) { fehler.push(`Netz: ${m.key} Sidecar/raw fehlt.`); continue; }
      const raw = JSON.parse(readFileSync(rawP, 'utf8')) as { korpusStand: string; belegteOcs?: string[] };
      const abstractEli = raw.korpusStand ? liesAbstract(m.sr) : '';
      const aStaende = abstractEli ? await holeStaendeA(abstractEli, fetch) : [];
      const frischeBindings = bNachSr.get(m.sr) ?? [];

      // §6.7-Auflage (Gegenprüfung PR #820, 12.9.2026): OHNE diesen Fetch könnte
      // `belegtImXml`/`ermittleBelegteOcs` beliebig kaputtgehen und check:revisionen-netz
      // bliebe grün, weil hier nur der COMMITTETE Wert gespiegelt würde (dieselbe Quelle
      // wie das Offline-Tor, §6.7 «ein Tor, das nicht scheitern kann»). Deshalb: den
      // Text-Beleg für die ohnehin gezogene Stichprobe frisch gegen die amtliche
      // Konsolidierungs-XML nachfahren (1 XML-Fetch je Erlass mit Kandidaten) und gegen
      // `raw.belegteOcs` vergleichen — Drift = Rot.
      let kontextFrisch: RevisionsKontext | undefined;
      if (abstractEli) {
        const st = stammFrisch.get(abstractEli) ?? {};
        const ausw = auswFrisch.get(abstractEli) ?? [];
        const eigene = new Set(frischeBindings.map((b) => b.oc?.value));
        const ocStamm: Record<string, OcStamm> = {};
        for (const oc of [...new Set(ausw.map((a) => a.oc))].sort()) {
          if (eigene.has(oc)) continue;
          const bs = bindings.filter((b) => b.oc?.value === oc);
          const min = (w: (string | undefined)[]) => w.filter((v): v is string => !!v).sort()[0];
          const sB: OcStamm | undefined = bs.length ? {
            dateForce: min(bs.map((b) => b.dateForce?.value)), dateDoc: min(bs.map((b) => b.dateDoc?.value)),
            roId: min(bs.map((b) => b.roId?.value)), titelDe: min(bs.map((b) => b.titleDe?.value)),
            titelFr: min(bs.map((b) => b.titleFr?.value)), titelIt: min(bs.map((b) => b.titleIt?.value)),
          } : undefined;
          const st2 = sB ?? ocStammFrisch.get(oc);
          if (st2) ocStamm[oc] = Object.fromEntries(Object.entries(st2).filter(([, v]) => v !== undefined)) as OcStamm;
        }
        kontextFrisch = { abstractEli, basicAct: st.basicAct, inkrafttreten: st.inkrafttreten, aufhebung: st.aufhebung, auswirkungen: ausw, ocStamm };
      }
      const kandidatOcs = [...new Set([
        ...frischeBindings.filter((b) => (b.dateForce?.value ?? '') > raw.korpusStand).map((b) => b.oc?.value),
        ...(kontextFrisch?.auswirkungen ?? []).filter((a) => (a.datum ?? '') > raw.korpusStand).map((a) => a.oc),
      ].filter((v): v is string => !!v))].sort();
      const konsEli = abstractEli ? `${abstractEli}/${raw.korpusStand.replace(/-/g, '')}` : null;
      const belegteOcsFrisch = konsEli && kandidatOcs.length
        ? await ermittleBelegteOcs(konsEli, kandidatOcs, fetch) : new Set<string>();
      const belegteOcsCommittet = new Set(raw.belegteOcs ?? []);
      const nurFrisch = [...belegteOcsFrisch].filter((oc) => !belegteOcsCommittet.has(oc)).sort();
      const nurCommittet = [...belegteOcsCommittet].filter((oc) => !belegteOcsFrisch.has(oc)).sort();
      if (nurFrisch.length || nurCommittet.length) {
        fehler.push(
          `Netz-Drift (Finding 4b): ${m.key} — frischer Text-Beleg ≠ committet `
          + `(nur frisch: ${nurFrisch.join(', ') || '∅'}; nur committet: ${nurCommittet.join(', ') || '∅'}). Neu generieren.`,
        );
      }

      const rectifiesInfoProOcFrisch = baueOcZuRectifiesSr(frischeBindings, zielInfoProOcFrisch);
      const frisch = baueRevisionen(m, frischeBindings, aStaende, raw.korpusStand, ocZuBotschaft, committet.abgerufen, belegteOcsFrisch, rectifiesInfoProOcFrisch, kontextFrisch);
      if (frisch.sha !== committet.sha) {
        fehler.push(`Netz-Drift: ${m.key} — frische Query-sha ≠ committet (${frisch.revisionen.length} vs ${committet.revisionen.length} Einträge). Neu generieren.`);
      }
    }
  } catch (e) {
    console.error(`check:revisionen-netz: Netzfehler — ${(e as Error).message}`);
    process.exit(2);
  }
}

// cache.sh-Abstract je SR (für den Netz-Cross-Check).
function liesAbstract(sr: string): string {
  const sh = readFileSync('scripts/fedlex-cache.sh', 'utf8');
  for (const m of sh.matchAll(/^\s*"([a-z0-9_]+)\|([a-z0-9/_]+)\|(\d{8})\|[^|]*\|[^|]*\|([0-9.]+)"/gm)) {
    if (m[4] === sr) return m[2];
  }
  return '';
}

if (fehler.length) {
  console.error(`check:revisionen ROT: ${fehler.length} Befund(e):`);
  for (const f of fehler.slice(0, 30)) console.error(`  - ${f}`);
  if (fehler.length > 30) console.error(`  … und ${fehler.length - 30} weitere`);
  process.exit(1);
}
const total = meta.reduce((n, m) => n + (lade(m.key)?.revisionen.length ?? 0), 0);
console.log(`check:revisionen grün${netz ? ' (+netz)' : ''}: ${meta.length} Sidecars, ${total} Einträge, Determinismus + Schema + Cross-Link + Pfad (c) + Anker DSG/ZPO/OR ok.`);
