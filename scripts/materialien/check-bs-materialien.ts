// scripts/materialien/check-bs-materialien.ts
// K-16 (W2·13-KANTONE-DATEN): das Tor für die Basel-Städter Materialien.
//
// Was hier fachlich falsch werden KANN (§6.7) — und darum geprüft wird:
//   1. PERSONENDATEN. Die Quelle führt Namen, Vornamen und Parteien von Ratsmitgliedern.
//      Der Adapter holt sie nicht (Positivliste); dieses Tor prüft das Ergebnis noch
//      einmal gegen eine Verbotsliste von Feldnamen UND gegen die Titelform der
//      Vorstösse («Anzug <Vorname> <Name> und Konsorten …»). Zwei Zäune, weil ein
//      einziger Feldname im `select=` genügt hätte, um Personendaten auszuliefern.
//   2. HERKUNFT. Jede Erlass-Verknüpfung muss ihren Beleg tragen, und 'amtlich' darf
//      NUR aus der Fussnote der Gesetzessammlung stammen. Sonst sähe eine maschinelle
//      Vermutung aus wie ein amtlicher Nachweis (§8) — der teuerste denkbare Fehler
//      dieser Pipeline.
//   3. REPRODUZIERBARKEIT. Das generierte Modul wird aus der committeten Roh-Ablage
//      neu gerechnet und BYTE-GLEICH verglichen. Damit ist zugleich bewiesen, dass
//      keine Zeile von Hand hineingeraten ist (§2/§6).
//   4. EXISTENZ. Jeder normKey zeigt auf eine committete Korpus-Datei; jeder Ereignis-
//      Code steht in der BS-Klassen-Tabelle.
//   5. DECKEL. Bestand und Register-Grösse mit Ist-Wert-Ausgabe (§11.6-Muster).
//   6. ORDNUNG DER ROH-ABLAGE. `dokumente.json` muss nach `vergleicheBsDokumente`
//      sortiert sein — sonst erzeugt ein Export mit anderer (arbiträrer) Reihenfolge
//      einen reinen Positionstausch identischer Zeilen, der wie ein fachlicher Diff
//      aussieht (Automatik-PR #913, 18.9.2026, §17-Wurzelfix).
//
// Offline, ohne Netz, ohne Date.now in der Rechnung: --datum nur für die Zukunftsprobe.
//   npm run check:bs-materialien

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { BS_MATERIALIEN } from '../../src/lib/materialien/bs-grossrat.generated.ts';
import { BS_GROSSRAT, bsCodeVonBezeichnung } from '../../src/lib/materialien/verfahren.ts';
import type { MaterialManifest } from '../../src/lib/materialien/typen.ts';
import {
  baueKanten, baueEreignisse, baueBsEintraege, serialisiere, fussnotenGeschaefte, cu,
  datumsAngaben, normTitel, erlassDatum, GESCHAEFTSARTEN, GESCHAEFTSART_DOKTYP,
  VERBOTENE_FELDER, VORSTOSS_TITEL, vergleicheBsDokumente, type BsErlassStamm,
} from './bs-materialien.ts';

import { FELDER_GESCHAEFT, FELDER_DOKUMENT, type BsGeschaeft, type BsDokument, type BsErlassMeta } from './adapter-bs-grossrat.ts';

/** Monatsnamen in derselben Reihenfolge wie im Generator (ISO-Umrechnung des Belegs). */
const MONATE_ISO = [
  'januar', 'februar', 'märz', 'april', 'mai', 'juni',
  'juli', 'august', 'september', 'oktober', 'november', 'dezember',
];

const GENERAT = join('src', 'lib', 'materialien', 'bs-grossrat.generated.ts');
const ROH_DIR = join('bibliothek', 'materialien', 'bs-grossrat-raw');
const KANTON_DIR = join('public', 'normtext', 'kanton');
const STRUKTUR_DIR = join('public', 'normtext', 'struktur', 'kanton');
const REGISTER = join('public', 'materialien', 'register.json');

// ── Deckel (Ist-Werte werden immer ausgegeben, nicht nur bei Überschreitung) ──
/** Bestandsdeckel: mehr Einträge heissen, dass die Zuordnung breiter geworden ist —
 *  das ist eine fachliche Änderung und gehört angeschaut, nicht durchgewinkt. */
export const DECKEL_EINTRAEGE = 400;
/** Register-Deckel (§15 Ladekosten): register.json ist eine lazy geladene Datei, aber
 *  sie wächst mit jedem Korpus. 3 MB bei heute 2,36 MB lässt Luft für ZH, ohne dass
 *  ein Vervielfachen unbemerkt bleibt. */
export const DECKEL_REGISTER_BYTES = 3 * 1024 * 1024;

const fehler: string[] = [];
const hinweise: string[] = [];

function leseRoh<T>(name: string): T[] {
  const p = join(ROH_DIR, `${name}.json`);
  if (!existsSync(p)) { fehler.push(`Roh-Ablage ${p} fehlt — Provenienz nicht prüfbar (§7).`); return []; }
  return JSON.parse(readFileSync(p, 'utf8')) as T[];
}

/** Erlass-Stammdaten wie im Generator — aus denselben committeten Artefakten (§5). */
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

function main(): void {
  const datumArg = process.argv.find((a) => a.startsWith('--datum='));
  const heute = datumArg?.slice('--datum='.length) ?? new Date().toISOString().slice(0, 10);

  const geschaefte = leseRoh<BsGeschaeft>('geschaefte');
  const dokumente = leseRoh<BsDokument>('dokumente');
  const erlassMeta = leseRoh<BsErlassMeta>('erlasse');

  // ── 0. Ordnung der Roh-Ablage (§17-Wurzelfix, Automatik-PR #913, 18.9.2026) ──
  // `dokumente.json` muss nach `vergleicheBsDokumente` sortiert sein — sonst schreibt
  // ein Export mit anderer (arbiträrer) OpenDataSoft-Reihenfolge einen reinen
  // Positionstausch identischer Zeilen in die Roh-Ablage, der aussieht wie ein
  // fachlicher Diff (genau der Fall in PR #913). Erste Verletzung melden, nicht nur
  // zählen — das genügt zum Beheben (§6.7).
  for (let i = 0; i < dokumente.length - 1; i++) {
    if (vergleicheBsDokumente(dokumente[i], dokumente[i + 1]) > 0) {
      fehler.push(
        `${join(ROH_DIR, 'dokumente.json')}: nicht nach vergleicheBsDokumente sortiert — `
        + `Index ${i}/${i + 1} (${JSON.stringify(dokumente[i])} vor ${JSON.stringify(dokumente[i + 1])}). `
        + 'npm run materialien:bs -- --datum=… (frischer Netzlauf, sortiert beim Schreiben) erneut ziehen.',
      );
      break;
    }
  }

  // ── 1. Personendaten ───────────────────────────────────────────────────────
  const artefakte: Array<[string, string]> = [
    [GENERAT, existsSync(GENERAT) ? readFileSync(GENERAT, 'utf8') : ''],
    ...(['geschaefte', 'dokumente', 'erlasse'] as const)
      .map((n) => [join(ROH_DIR, `${n}.json`), existsSync(join(ROH_DIR, `${n}.json`)) ? readFileSync(join(ROH_DIR, `${n}.json`), 'utf8') : ''] as [string, string]),
  ];
  for (const [pfad, inhalt] of artefakte) {
    for (const feld of VERBOTENE_FELDER) {
      // Blosse Zeichenkette, nicht `"feld"`: die Roh-Ablage ist JSON (Schlüssel in
      // Anführungszeichen), das Generat aber TypeScript (Schlüssel nackt). Ein Tor,
      // das nur die JSON-Form kennt, wäre für das ausgelieferte Modul blind — genau
      // dieser Fall ist beim Rot-Beweis am 12.9.2026 aufgefallen.
      if (inhalt.includes(feld)) fehler.push(`${pfad}: Personenfeld '${feld}' im Artefakt (Auflage K-16).`);
    }
  }
  for (const feld of VERBOTENE_FELDER) {
    if ((FELDER_GESCHAEFT as readonly string[]).includes(feld) || (FELDER_DOKUMENT as readonly string[]).includes(feld)) {
      fehler.push(`Adapter-Feldliste enthält das Personenfeld '${feld}' (Wurzel-Verstoss).`);
    }
  }
  for (const e of BS_MATERIALIEN) {
    if (VORSTOSS_TITEL.test(e.titel)) {
      fehler.push(`${e.key}: Titel beginnt wie ein Vorstoss ('${e.titel.slice(0, 40)}…') — Vorstösse tragen Personennamen im Titel.`);
    }
  }
  // Geschäftsart → Doktyp: jede Art muss in der Tabelle stehen. FEHLER, nicht Hinweis
  // (Gegenprüfung PR #799): eine unbekannte Art wurde vorher binär zum «Bericht», und
  // ein Hinweis, den niemand liest, hätte genau das nicht verhindert (§6.7). Arten
  // ausserhalb der drei Vorlage-Arten sind zulässig, aber NUR über den amtlichen
  // Fussnoten-Weg — auch das wird hier geprüft, nicht bloss vermerkt.
  const artJeGeschaeft = new Map(geschaefte.map((g) => [g.signatur_ges, g.ga_rr_gr ?? '']));
  for (const g of geschaefte) {
    const art = g.ga_rr_gr ?? '';
    if (!(art in GESCHAEFTSART_DOKTYP)) {
      fehler.push(
        `${g.signatur_ges}: Geschäftsart '${art}' fehlt in GESCHAEFTSART_DOKTYP — `
        + 'mit amtlicher Bezeichnung ergänzen, nie in einen bestehenden Doktyp einsortieren (§1).',
      );
    }
  }

  // ── 2. Herkunft jeder Kante ────────────────────────────────────────────────
  const korpusKeys = new Set(
    readdirSync(KANTON_DIR).filter((f) => f.endsWith('.json') && f !== 'index.json').map((f) => f.slice(0, -'.json'.length)),
  );
  const stammAlle = leseErlassStamm(erlassMeta);
  const fussnotenJeErlass = new Map(stammAlle.map((e) => [e.key, new Set(e.fussnotenGeschaefte)]));
  const erlassDatumIso = new Map(
    stammAlle.map((e) => {
      const d = erlassDatum(e.erlassdatum);
      return [e.key, d ? `${d.jahr}-${String(MONATE_ISO.indexOf(d.monat) + 1).padStart(2, '0')}-${String(d.tag).padStart(2, '0')}` : ''];
    }),
  );
  for (const e of BS_MATERIALIEN) {
    const kanten = e.bsKanten ?? [];
    if (kanten.length === 0) fehler.push(`${e.key}: Eintrag ohne bsKanten (Herkunft fehlt, §8).`);
    const ausKanten = [...new Set(kanten.map((k) => k.erlass))].sort(cu);
    if (JSON.stringify(ausKanten) !== JSON.stringify([...(e.normKeys ?? [])].sort(cu))) {
      fehler.push(`${e.key}: normKeys ${JSON.stringify(e.normKeys)} ≠ Erlasse der bsKanten ${JSON.stringify(ausKanten)}.`);
    }
    for (const k of kanten) {
      if (!korpusKeys.has(k.erlass)) fehler.push(`${e.key}: Kante auf ${k.erlass} — keine Korpus-Datei (§8).`);
      if (!k.beleg) fehler.push(`${e.key}→${k.erlass}: Kante ohne Beleg.`);
      if (k.quelle === 'amtlich' && k.regel !== 'fussnote') {
        fehler.push(`${e.key}→${k.erlass}: quelle 'amtlich' bei Regel '${k.regel}' — amtlich ist NUR die Fussnote der Gesetzessammlung (§8).`);
      }
      if (k.quelle === 'maschinell' && k.regel === 'fussnote') {
        fehler.push(`${e.key}→${k.erlass}: Fussnoten-Kante als 'maschinell' abgewertet — der amtliche Beleg ginge verloren.`);
      }
      if (k.regel === 'fussnote' && !fussnotenJeErlass.get(k.erlass)?.has(e.nummer ?? '')) {
        fehler.push(`${e.key}→${k.erlass}: als Fussnoten-Kante geführt, aber die Fussnoten von ${k.erlass} nennen ${e.nummer} nicht (§7).`);
      }
      if (k.regel === 'sg-nummer' && !e.titel.includes(k.beleg)) {
        fehler.push(`${e.key}→${k.erlass}: SG-Beleg '${k.beleg}' steht nicht im amtlichen Titel.`);
      }
      if (k.regel === 'datum-titel') {
        // Inhaltlich prüfen statt per Textsuche: der Beleg ist das Erlassdatum in ISO,
        // der amtliche Titel schreibt es in Prosa und uneinheitlich (belegt: «vom
        // 12.Oktober 1967»). Geprüft wird also, ob der Titel dieses Datum WIRKLICH nennt.
        const imTitel = datumsAngaben(normTitel(e.titel))
          .map((d) => `${d.jahr}-${String(MONATE_ISO.indexOf(d.monat) + 1).padStart(2, '0')}-${String(d.tag).padStart(2, '0')}`);
        if (!imTitel.includes(k.beleg)) {
          fehler.push(`${e.key}→${k.erlass}: Datums-Beleg ${k.beleg} nicht im amtlichen Titel (dort: ${imTitel.join(', ') || 'kein Datum'}).`);
        }
        const sidecarDatum = erlassDatumIso.get(k.erlass);
        if (sidecarDatum && sidecarDatum !== k.beleg) {
          fehler.push(`${e.key}→${k.erlass}: Beleg ${k.beleg} ≠ Erlassdatum ${sidecarDatum} des Korpus-Erlasses.`);
        }
      }
    }
    // Ereignisse
    for (const v of e.ereignisse ?? []) {
      if (v.vok !== 'bs-gr') fehler.push(`${e.key}: Ereignis ohne vok='bs-gr' (Code ${v.code} würde als Bundes-Code gelesen).`);
      if (!BS_GROSSRAT[v.code]) fehler.push(`${e.key}: Ereignis-Code ${v.code} nicht in BS_GROSSRAT.`);
      if (!v.bez) fehler.push(`${e.key}: Ereignis ohne amtliche Bezeichnung (bez).`);
      else if (bsCodeVonBezeichnung(v.bez) !== v.code) {
        fehler.push(`${e.key}: Bezeichnung '${v.bez}' ergibt Code ${bsCodeVonBezeichnung(v.bez)}, gespeichert ist ${v.code}.`);
      }
      if (!v.datum || !/^\d{4}-\d{2}-\d{2}$/.test(v.datum)) fehler.push(`${e.key}: Ereignis ohne ISO-Datum (${v.datum}).`);
      // `res` ist bei BS die amtliche URL, wörtlich — nie eine konstruierte (§7).
      if (v.res && !/^https:\/\/grosserrat\.bs\.ch\//.test(v.res)) {
        fehler.push(`${e.key}: Ereignis-Quelle '${v.res}' ist kein Live-Link des Grossen Rates.`);
      }
    }
    const art = artJeGeschaeft.get(e.nummer ?? '');
    if (art !== undefined) {
      const erwartet = GESCHAEFTSART_DOKTYP[art];
      if (erwartet && e.doktyp !== erwartet) {
        fehler.push(`${e.key}: amtliche Art '${art}' ⇒ Doktyp '${erwartet}', gespeichert ist '${e.doktyp}' (§1).`);
      }
      if (!(GESCHAEFTSARTEN as readonly string[]).includes(art)
        && !(e.bsKanten ?? []).some((k) => k.regel === 'fussnote')) {
        fehler.push(`${e.key}: Art '${art}' liegt ausserhalb der Vorlage-Arten und hat keine Fussnoten-Kante (§8).`);
      }
    }
    if (!/^BS-GR-\d{2}\.\d{4}$/.test(e.key)) fehler.push(`${e.key}: Schlüssel nicht in der Form BS-GR-NN.NNNN.`);
    if (e.stand > heute) fehler.push(`${e.key}: stand ${e.stand} liegt in der Zukunft (> ${heute}).`);
    if (!/^https:\/\/grosserrat\.bs\.ch\//.test(e.quelleUrl)) {
      fehler.push(`${e.key}: quelleUrl ist kein Live-Link des Grossen Rates: ${e.quelleUrl}`);
    }
  }

  // ── 3. Byte-gleiche Reproduktion aus der Roh-Ablage ────────────────────────
  if (geschaefte.length > 0 && existsSync(GENERAT)) {
    const committet = readFileSync(GENERAT, 'utf8');
    const abgerufen = /Quelle abgerufen: (\d{4}-\d{2}-\d{2})\./.exec(committet)?.[1];
    if (!abgerufen) {
      fehler.push(`${GENERAT}: Abrufdatum im Kopf fehlt (§7a) — Reproduktion nicht prüfbar.`);
    } else {
      const stamm = leseErlassStamm(erlassMeta);
      const kanten = baueKanten(geschaefte, stamm);
      const { jeGeschaeft } = baueEreignisse(dokumente);
      const frisch = serialisiere(baueBsEintraege(geschaefte, kanten, jeGeschaeft), abgerufen);
      if (frisch !== committet) {
        fehler.push(
          `${GENERAT}: Neurechnung aus ${ROH_DIR} weicht ab (${committet.length} vs. ${frisch.length} Bytes) — `
          + 'von Hand editiert oder Generator geändert ohne Lauf. npm run materialien:bs -- --datum=… --aus-roh',
        );
      }
    }
  }

  // ── 4. Deckel + Ist-Werte ──────────────────────────────────────────────────
  const registerBytes = existsSync(REGISTER) ? readFileSync(REGISTER).length : 0;
  const bsImRegister = existsSync(REGISTER)
    ? (JSON.parse(readFileSync(REGISTER, 'utf8')) as MaterialManifest).materialien.filter((m) => m.behoerde === 'BS-GR').length
    : 0;
  if (BS_MATERIALIEN.length > DECKEL_EINTRAEGE) {
    fehler.push(`Bestand ${BS_MATERIALIEN.length} > Deckel ${DECKEL_EINTRAEGE} — Zuwachs begründen (§11.6).`);
  }
  if (registerBytes > DECKEL_REGISTER_BYTES) {
    fehler.push(`register.json ${registerBytes} B > Deckel ${DECKEL_REGISTER_BYTES} B (§15).`);
  }
  if (bsImRegister !== BS_MATERIALIEN.length) {
    fehler.push(`register.json führt ${bsImRegister} BS-Einträge, das Generat ${BS_MATERIALIEN.length} — Projektion nachziehen (npm run materialien).`);
  }

  const kantenGesamt = BS_MATERIALIEN.reduce((n, e) => n + (e.bsKanten?.length ?? 0), 0);
  const amtlich = BS_MATERIALIEN.reduce((n, e) => n + (e.bsKanten ?? []).filter((k) => k.quelle === 'amtlich').length, 0);
  const erlasse = new Set(BS_MATERIALIEN.flatMap((e) => e.normKeys ?? []));
  const ereignisse = BS_MATERIALIEN.reduce((n, e) => n + (e.ereignisse?.length ?? 0), 0);

  for (const h of hinweise) console.log(`HINWEIS bs-materialien: ${h}`);
  for (const f of fehler) console.error(`ROT   bs-materialien: ${f}`);
  if (fehler.length > 0) {
    console.error(`\ncheck:bs-materialien — ${fehler.length} Verstoss/Verstösse.`);
    process.exitCode = 1;
    return;
  }
  console.log(
    `check:bs-materialien OK — ${BS_MATERIALIEN.length}/${DECKEL_EINTRAEGE} Einträge · ${kantenGesamt} Kanten `
    + `(${amtlich} amtlich · ${kantenGesamt - amtlich} maschinell) über ${erlasse.size} Erlasse · ${ereignisse} Ereignisse · `
    + `register.json ${(registerBytes / 1024 / 1024).toFixed(2)}/${(DECKEL_REGISTER_BYTES / 1024 / 1024).toFixed(2)} MB; `
    + 'keine Personendaten, Herkunft belegt, Generat aus der Roh-Ablage byte-gleich reproduziert.',
  );
}

main();
