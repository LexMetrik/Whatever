// ─── Tor: BS-Rechtsprechungs-Import (offline, CI-fähig — Bauplan §8.3) ───────
//
// Prüft das committete Inventar (daten/bs-fiw/inventar.json) gegen die
// committete Projektion (public/rechtsprechung/kanton/BS/** + register.json):
//  · Fehlerliste leer · jeder Scope-Eintrag hat genau einen Snapshot (GN-Multiset
//    beidseitig gleich, keine Waisen) · Jahres-Counts == Portal-Anker ·
//    datumlose Einträge tragen datumUnbekannt + Platzhalter <GN-Jahr>-01-01 oder
//    ein plausibles Kopf-Datum (B-1) · Datum == Inventar-Metadaten ·
//    docketSafe-Kollisionsregel (§3.2) · statische Fidelity-Assertions
//    (kein U+FFFD, kein Entity-/Tag-Rest, NBSP-Präsenzquote) · §7-Provenienz.
// Kein Netz. Harte Verstösse → exit 1.

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { EntscheidManifest } from '../../src/lib/rechtsprechung/register';
import type { EntscheidSnapshotDatei } from '../../src/lib/rechtsprechung/typen';
import type { Inventar } from './bs-inventar';
import { gnJahr } from './bs-inventar';

const ROOT = process.cwd();
const PUB = join(ROOT, 'public', 'rechtsprechung');
const BS_DIR = join(PUB, 'kanton', 'BS');
const INVENTAR = join(ROOT, 'daten', 'bs-fiw', 'inventar.json');
const FEHLERLISTE = join(ROOT, 'daten', 'bs-fiw', 'fehlerliste.json');

// NBSP-Präsenzquote: Anteil BS-Dokumente mit ≥1 NBSP im Text. Ist beim
// Vollimport 19.7.2026 ≈ 99 % (Word-Typographie des Portals); Schwelle
// konservativ — bricht, wenn eine künftige Parser-Änderung NBSP global foldet.
const NBSP_QUOTE_MIN = 0.5;

const fehler: string[] = [];

function main() {
  if (!existsSync(INVENTAR)) {
    console.error('[check:bs-entscheide] daten/bs-fiw/inventar.json fehlt.');
    process.exit(1);
  }
  const inv = JSON.parse(readFileSync(INVENTAR, 'utf8')) as Inventar;
  if (existsSync(FEHLERLISTE)) {
    const fl = JSON.parse(readFileSync(FEHLERLISTE, 'utf8')) as unknown[];
    if (fl.length) fehler.push(`Fehlerliste nicht leer: ${fl.length} Einträge (Crawl unvollständig)`);
  }

  const manifest = JSON.parse(readFileSync(join(PUB, 'register.json'), 'utf8')) as EntscheidManifest;
  const bs = manifest.entscheide.filter((e) => e.kanton === 'BS' && e.quelle === 'gerichte-bs');

  // ── Count-Gate: Inventar-GN-Multiset == Register-GN-Multiset (keine Waisen) ──
  const zaehle = (xs: string[]): Map<string, number> => {
    const m = new Map<string, number>();
    for (const x of xs) m.set(x, (m.get(x) ?? 0) + 1);
    return m;
  };
  const invGn = zaehle(inv.eintraege.map((z) => z.gn));
  const regGn = zaehle(bs.map((e) => e.nummer));
  for (const [gn, n] of invGn) {
    const r = regGn.get(gn) ?? 0;
    if (r !== n) fehler.push(`GN ${gn}: Inventar ${n} Dokument(e) ≠ Register ${r}`);
  }
  for (const gn of regGn.keys()) {
    if (!invGn.has(gn)) fehler.push(`Register-Waise: ${gn} nicht im Inventar (Takedown §5.4 verpasst?)`);
  }
  if (bs.length !== inv.eintraege.length) {
    fehler.push(`BS-Register ${bs.length} Einträge ≠ Inventar ${inv.eintraege.length}`);
  }

  // ── Jahres-Counts gegen die beim Crawl festgeschriebenen Portal-Anker ──
  const invJahr = new Map<string, number>();
  let invDatumlos = 0;
  for (const z of inv.eintraege) {
    if (z.datum) invJahr.set(z.datum.slice(0, 4), (invJahr.get(z.datum.slice(0, 4)) ?? 0) + 1);
    else invDatumlos++;
  }
  // Jahres-/Datumlos-Zählung erfolgt je Snapshot in der Datei-Schleife unten: seit
  // dem Kopf-Datum-Nachtrag (B-1, W2·29-WERKBANK-LESER D2) trägt ein Dokument ohne
  // Metadaten-Datum im Portal-Inventar ein ECHTES Datum aus seinem Deckblatt. Es
  // gehört darum nicht in die Jahres-Anker des Inventars (die zählen nur Metadaten-
  // Daten), sondern in die Datumlos-Menge — die Zuordnung braucht den nF30_KEY aus
  // der Snapshot-URL und damit die Snapshot-Datei.
  const regJahr = new Map<string, number>();
  let regDatumlos = 0;
  let regKopfdatiert = 0;
  const invProKey = new Map(inv.eintraege.map((z) => [z.key, z] as const));
  // Portal-Anker (nur Scope-Jahre ≥2022; ältere Jahres-Anteile stammen aus GN-Jahr-Scope).
  for (const [j, n] of Object.entries(inv.portal.jahre)) {
    const invN = inv.eintraege.filter((z) => z.datum?.startsWith(`${j}-`)).length;
    // Der Portal-Anker zählt ALLE Entscheide des Jahres; Scope-Filter ist Datum ≥ 2022 →
    // für Jahre ≥ 2022 muss der Scope-Anteil dem Anker entsprechen.
    if (Number(j) >= 2022 && invN !== n) fehler.push(`Portal-Anker Jahr ${j}: ${n} ≠ Inventar ${invN}`);
  }

  // ── Dateien: Waisen unter kanton/BS/**, docketSafe-Regel, Fidelity ──
  const bsKeys = new Set(bs.map((e) => e.datei));
  const dateien: string[] = [];
  if (existsSync(BS_DIR)) {
    const stack = [BS_DIR];
    while (stack.length) {
      const d = stack.pop()!;
      for (const e of readdirSync(d, { withFileTypes: true })) {
        const p = join(d, e.name);
        if (e.isDirectory()) stack.push(p);
        else if (e.name.endsWith('.json')) dateien.push(p);
      }
    }
  }
  for (const p of dateien) {
    const rel = p.slice(PUB.length + 1);
    if (!bsKeys.has(rel)) fehler.push(`Datei-Waise ohne Register-Eintrag: ${rel}`);
  }

  let mitNbsp = 0;
  let geprueft = 0;
  for (const e of bs) {
    if (!e.datei) { fehler.push(`${e.key}: BS-Eintrag ohne datei`); continue; }
    const fp = join(PUB, e.datei);
    if (!existsSync(fp)) { fehler.push(`${e.key}: Datei fehlt`); continue; }
    const d = JSON.parse(readFileSync(fp, 'utf8')) as EntscheidSnapshotDatei;
    const snap = d.eintraege?.[0];
    if (!snap) { fehler.push(`${e.key}: leere Snapshot-Datei`); continue; }
    geprueft++;

    // docketSafe-Kollisionsregel (§3.2): Stamm = GN | GN-YYYYMMDD | GN-<key> | GN-YYYYMMDD-<key>.
    const stamm = e.datei.split('/').pop()!.replace(/\.json$/, '');
    const gn = snap.nummer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (!new RegExp(`^${gn}(-\\d{8})?(-\\d+)?$`).test(stamm)) {
      fehler.push(`${e.key}: docketSafe «${stamm}» verletzt Kollisionsregel zu GN «${snap.nummer}»`);
    }

    // Datum gegen das Inventar (über den nF30_KEY der amtlichen URL, eindeutig je Dokument).
    const nf = /nF30_KEY=(\d+)/.exec(snap.quelleUrl);
    const z = nf ? invProKey.get(Number(nf[1])) : undefined;
    if (!z) {
      fehler.push(`${e.key}: kein Inventar-Eintrag zum nF30_KEY der Quelle`);
    } else if (z.datum) {
      if (snap.datum !== z.datum || e.datum !== z.datum) fehler.push(`${e.key}: Datum ${snap.datum} ≠ Inventar-Metadaten ${z.datum}`);
      if (snap.datumUnbekannt) fehler.push(`${e.key}: datumUnbekannt trotz Metadaten-Datum`);
      regJahr.set(z.datum.slice(0, 4), (regJahr.get(z.datum.slice(0, 4)) ?? 0) + 1);
    } else {
      regDatumlos++;
      if (!snap.datumUnbekannt) {
        // Kopf-datiert (B-1): plausibel = nicht vor dem GN-Jahr, nicht nach der
        // Erstpublikation, und die Zitierung nennt genau dieses Datum.
        regKopfdatiert++;
        const j = gnJahr(snap.nummer);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(snap.datum)) fehler.push(`${e.key}: Kopf-Datum kein ISO-Tag: ${snap.datum}`);
        if (j !== null && Number(snap.datum.slice(0, 4)) < j) fehler.push(`${e.key}: Kopf-Datum ${snap.datum} vor GN-Jahr ${j}`);
        if (snap.erstpublikation && snap.datum > snap.erstpublikation) fehler.push(`${e.key}: Kopf-Datum ${snap.datum} nach Erstpublikation ${snap.erstpublikation}`);
        const [y, m, d] = snap.datum.split('-');
        if (!snap.zitierung.endsWith(` vom ${d}.${m}.${y}`)) fehler.push(`${e.key}: Zitierung «${snap.zitierung}» nennt das Kopf-Datum nicht`);
      }
    }

    // datumlos: Platzhalter == <GN-Jahr>-01-01 + datumUnbekannt beidseitig konsistent.
    if (snap.datumUnbekannt) {
      const j = gnJahr(snap.nummer);
      if (snap.datum !== `${j}-01-01`) fehler.push(`${e.key}: datumUnbekannt, aber Platzhalter ${snap.datum} ≠ ${j}-01-01`);
      if (!e.datumUnbekannt) fehler.push(`${e.key}: Snapshot datumUnbekannt, Register-Eintrag nicht`);
    } else if (e.datumUnbekannt) {
      fehler.push(`${e.key}: Register datumUnbekannt, Snapshot nicht`);
    }

    // §7-Provenienz (BS-spezifisch): amtliche Portal-URL mit nF30_KEY.
    if (!/^https:\/\/rechtsprechung\.gerichte\.bs\.ch\/cgi-bin\/nph-omniscgi\.exe\?/.test(snap.quelleUrl)
      || !/nF30_KEY=\d+/.test(snap.quelleUrl)) {
      fehler.push(`${e.key}: quelleUrl keine amtliche Portal-Dokument-URL`);
    }

    // Statische Fidelity-Assertions (§3.6/§8.3).
    const text = snap.abschnitte.flatMap((a) => a.bloecke.map((b) => b.text)).join('\n');
    if (text.includes('�')) fehler.push(`${e.key}: U+FFFD im Text`);
    if (/&(nbsp|auml|ouml|uuml|amp|szlig);/.test(text)) fehler.push(`${e.key}: HTML-Entity-Literal im Text`);
    if (/<\/?(p|b|i|em|strong|span|div|td|tr|th|table|br|hr|h[1-6]|img|a|ul|ol|li)\b[^>]*>/i.test(text)) fehler.push(`${e.key}: HTML-Tag-Rest im Text`);
    if (/[\u0080-\u009f]/.test(text)) fehler.push(`${e.key}: C1-Steuerzeichen im Text (Windows-1252-Dekodierfehler)`);
    // C0-Debris (NUL/STX/…): kommt verbatim aus defekten Portal-Dokumenten und wird
    // vom Parser bereinigt (bereinigeQuellDebris) — darf publizierte JSONs nie
    // erreichen (Rendering-/Such-Risiko, Fidelity-Befund 19.7.2026).
    // eslint-disable-next-line no-control-regex -- C0-Steuerzeichen sind der Prüfgegenstand
    if (/[\u0000-\u0008\u000b\u000e-\u001f]/.test(text)) fehler.push(`${e.key}: C0-Steuerzeichen im Text (Quell-Debris nicht bereinigt)`);
    if (text.includes('\u00a0')) mitNbsp++;
    if (!snap.abschnitte.length || !text.replace(/\s+/g, '')) fehler.push(`${e.key}: leerer Entscheidtext`);
  }

  for (const [j, n] of invJahr) {
    if ((regJahr.get(j) ?? 0) !== n) fehler.push(`Jahr ${j}: Inventar ${n} ≠ Register ${regJahr.get(j) ?? 0}`);
  }
  if (invDatumlos !== regDatumlos) fehler.push(`Datumlos: Inventar ${invDatumlos} ≠ Register ${regDatumlos}`);

  if (geprueft > 0) {
    const quote = mitNbsp / geprueft;
    if (quote < NBSP_QUOTE_MIN) {
      fehler.push(`NBSP-Präsenzquote ${(quote * 100).toFixed(1)} % < ${NBSP_QUOTE_MIN * 100} % (Typographie-Foldung?)`);
    }
  }

  if (fehler.length) {
    for (const f of fehler.slice(0, 60)) console.error(`[check:bs-entscheide] FEHLER ${f}`);
    if (fehler.length > 60) console.error(`[check:bs-entscheide] … und ${fehler.length - 60} weitere`);
    process.exit(1);
  }
  console.log(`[check:bs-entscheide] OK — ${bs.length} BS-Entscheide (Inventar ${inv.eintraege.length}, Inventar-datumlos ${regDatumlos}, davon Kopf-datiert ${regKopfdatiert}, NBSP-Quote ${geprueft ? ((mitNbsp / geprueft) * 100).toFixed(1) : '–'} %).`);
}

main();
