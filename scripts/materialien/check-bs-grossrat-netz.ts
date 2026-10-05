// scripts/materialien/check-bs-grossrat-netz.ts
// K-16 (W2·13-KANTONE-DATEN): Live-Drift-Arbiter der BS-Materialien gegen data.bs.ch.
// Verdrahtet in `check:netz:bericht` (seit 5.10.2026 Bericht, kein Rot), NIE in der Offline-Gate-Kette (§9: Netz gehört nicht
// zwischen Merge und Deploy). Exit 0 OK · 1 Drift · 2 Netzfehler.
//
// VOLLABGLEICH statt Stichprobe (Lehre aus dem Botschaften-Tor, Befund (d) 1.9.2026: eine
// feste Stichprobe ist blind für Zuwachs). Gefahren wird derselbe Weg wie im Generator —
// Vollexport holen, reine Funktionen rechnen — und das Ergebnis gegen das committete
// Generat gestellt. Drift heisst: Generator neu laufen lassen, nie Auto-Fix (§7).
//
// Was Drift bedeutet und warum sie hier auffliegen MUSS:
//   · neue Ratschläge/Kommissionsberichte (die Quelle wächst wöchentlich);
//   · ein Geschäftstitel, der nachträglich korrigiert wird — er trägt bei uns die
//     Zuordnung (Datum/SG-Nummer im Titel), eine Titelkorrektur kann also eine Kante
//     entstehen oder verschwinden lassen;
//   · eine Fussnote der Gesetzessammlung, die neu ein Geschäft nennt (amtlicher Weg).
//
//   npm run check:bs-grossrat-netz

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  BS_DATENSATZ, FELDER_GESCHAEFT, FELDER_DOKUMENT, FELDER_ERLASS, holeExport,
  type BsGeschaeft, type BsDokument, type BsErlassMeta,
} from './adapter-bs-grossrat.ts';
import {
  baueKanten, baueEreignisse, baueBsEintraege, fussnotenGeschaefte, cu, type BsErlassStamm, type BsEintrag,
} from './bs-materialien.ts';
import { BS_MATERIALIEN } from '../../src/lib/materialien/bs-grossrat.generated.ts';
import type { VerfahrensEreignis } from '../../src/lib/materialien/verfahren.ts';

const KANTON_DIR = join('public', 'normtext', 'kanton');
const STRUKTUR_DIR = join('public', 'normtext', 'struktur', 'kanton');

/** Signatur eines Eintrags: alles, was fachlich drift-relevant ist. Bewusst OHNE `rang`
 *  (reine Anzeigefolge) — ein neuer Ratschlag verschiebt sonst alle Ränge und erzeugt
 *  117 Meldungen statt einer. */
function signatur(e: {
  titel: string; stand: string; quelleUrl: string; doktyp: string;
  normKeys?: readonly string[]; ereignisse?: readonly VerfahrensEreignis[];
  bsKanten?: readonly { erlass: string; quelle: string; regel: string; beleg: string }[];
}): string {
  return [
    e.titel, e.stand, e.quelleUrl, e.doktyp,
    [...(e.normKeys ?? [])].join(','),
    (e.ereignisse ?? []).map((v) => `${v.code}:${v.datum ?? ''}:${v.res ?? ''}:${v.bez ?? ''}`).join(';'),
    (e.bsKanten ?? []).map((k) => `${k.erlass}:${k.quelle}:${k.regel}:${k.beleg}`).join(';'),
  ].join('|');
}

function leseErlassStamm(meta: readonly BsErlassMeta[]): BsErlassStamm[] {
  const metaNachSg = new Map(meta.map((m) => [m.systematic_number, m]));
  const stamm: BsErlassStamm[] = [];
  for (const datei of readdirSync(KANTON_DIR).filter((f) => f.startsWith('BS-') && f.endsWith('.json')).sort(cu)) {
    const key = datei.slice(0, -'.json'.length);
    const sidecar = join(STRUKTUR_DIR, datei);
    if (!existsSync(sidecar)) continue;
    const roh = readFileSync(sidecar, 'utf8');
    const obj = JSON.parse(roh) as { kopf?: { titel?: string; erlassdatum?: string } };
    const m = metaNachSg.get(key.slice('BS-'.length));
    stamm.push({
      key,
      sg: key.slice('BS-'.length),
      titel: obj.kopf?.titel ?? '',
      erlassdatum: obj.kopf?.erlassdatum ?? '',
      stichworte: (m?.keywords_de ?? []).filter((w) => typeof w === 'string'),
      kategorie: m?.category_name ?? '',
      fussnotenGeschaefte: fussnotenGeschaefte(roh),
    });
  }
  return stamm;
}

async function main(): Promise<void> {
  let live: BsEintrag[];
  try {
    const geschaefte = await holeExport<BsGeschaeft>(BS_DATENSATZ.geschaefte, FELDER_GESCHAEFT);
    const erlassMeta = await holeExport<BsErlassMeta>(BS_DATENSATZ.erlasse, FELDER_ERLASS, fetch, 'is_active="True"');
    const dokumente = await holeExport<BsDokument>(BS_DATENSATZ.dokumente, FELDER_DOKUMENT);
    const stamm = leseErlassStamm(erlassMeta);
    const kanten = baueKanten(geschaefte, stamm);
    const gebraucht = new Set(kanten.map((k) => k.geschaeft));
    const { jeGeschaeft } = baueEreignisse(dokumente.filter((d) => d.signatur_ges && gebraucht.has(d.signatur_ges)));
    live = baueBsEintraege(geschaefte.filter((g) => gebraucht.has(g.signatur_ges)), kanten, jeGeschaeft);
    console.log(
      `check:bs-grossrat-netz: live ${geschaefte.length} Geschäfte / ${dokumente.length} Dokumente `
      + `→ ${live.length} Einträge · ${kanten.length} Kanten.`,
    );
  } catch (e) {
    console.error(`check:bs-grossrat-netz NETZFEHLER: ${(e as Error).message}`);
    process.exitCode = 2;
    return;
  }

  const committet = new Map(BS_MATERIALIEN.map((e) => [e.key, e]));
  const liveMap = new Map(live.map((e) => [e.key, e]));
  const abweichungen: string[] = [];
  for (const [key, l] of [...liveMap].sort((a, b) => cu(a[0], b[0]))) {
    const c = committet.get(key);
    if (!c) { abweichungen.push(`NEU live, fehlt committet: ${key} — ${l.titel.slice(0, 70)}`); continue; }
    const sl = signatur(l);
    const sc = signatur({ ...c, doktyp: c.doktyp, normKeys: c.normKeys, ereignisse: c.ereignisse, bsKanten: c.bsKanten });
    if (sl !== sc) abweichungen.push(`ABWEICHUNG ${key}:\n  committet ${sc}\n  live      ${sl}`);
  }
  for (const key of [...committet.keys()].sort(cu)) {
    if (!liveMap.has(key)) abweichungen.push(`committet, live VERSCHWUNDEN: ${key}`);
  }

  if (abweichungen.length > 0) {
    for (const a of abweichungen) console.error(`ROT   bs-grossrat-netz: ${a}`);
    console.error(
      `\ncheck:bs-grossrat-netz — ${abweichungen.length} Abweichung(en) gegenüber data.bs.ch. `
      + 'Generator neu laufen lassen: npm run materialien:bs -- --datum=$(date +%F), '
      + 'dann npm run materialien -- --datum=$(date +%F) && npm run gen:zaehler (nie von Hand, §7).',
    );
    process.exitCode = 1;
    return;
  }
  console.log(`check:bs-grossrat-netz OK — ${live.length} Einträge deckungsgleich mit data.bs.ch.`);
}

await main();
