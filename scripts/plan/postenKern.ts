// scripts/plan/postenKern.ts — «ein Nebenfund = eine kleine Datei»
//
// ANLASS (Messung 20.9.2026, QS-EFFIZIENZ). ROADMAP.md riss ihren 120-KiB-Deckel
// alle 8–15 Tage. Treiber war NICHT der Schritt-Bestand, sondern die Gewohnheit,
// jeden Nebenfund als eingerückte Checklisten-Zeile in einen OFFENEN Schritt-Block
// zu schreiben: 144 offene Unterzeilen = 43,6 KiB von 110 KiB. Dieselbe Gewohnheit
// machte die Datei zum Konflikt-Hotspot Nr. 1 der Merge-Queue (in 50 % der letzten
// 60 PRs berührt; 4 von 10 Queue-Rauswürfen `merge_conflict`, teuerster Fall
// 219 min) — zwei PRs, die am selben Blockende eine Zeile anhängen, kollidieren
// sicher, und die Queue kennt keine lokalen Merge-Treiber.
//
// MODELL. Ein Posten (Nebenfund, Unterposten, Wartet-auf-David-Punkt) ist eine
// eigene kleine Datei unter `plan/posten/`. Zwei Sessions, die gleichzeitig je
// einen Posten anlegen, erzeugen zwei verschiedene Dateien — ein Merge-Konflikt
// ist dann strukturell unmöglich, und der Deckel wächst nicht mit. ROADMAP.md
// trägt nur noch Schritte: Kopfzeile, `@meta`, Ziel-Prosa, `**Detail:**`-Zeiger
// und die Etappen-Kennungszeilen, die `check:plan` Regel 14 liest.
//
// KEINE MEHRARBEIT (Vorgabe David 20.9.2026). Das Anlegen ist billiger als
// vorher: `npm run plan:posten -- neu --dach <ID> --titel "…"` statt Suchen und
// Editieren in einer 110-KiB-Datei. Sichtbar bleiben die Posten maschinell —
// `plan:next` zählt sie, das Lagebild führt sie je Schritt (F17: kein Posten
// darf unsichtbar werden).
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parseRoadmap } from './parse';

export const POSTEN_ORDNER = 'plan/posten';
export const POSTEN_ARCHIV = 'archiv/posten';
export const CHRONIK = 'ROADMAP-CHRONIK.md';

/** Eingerückte Checklisten-Zeile (der Posten-Kandidat). */
export const UNTERZEILE_RE = /^([ \t]+)[-*+] \[([ xX~Dd])\][ \t]/;
/** Etappen-Kennungszeile — WORTGLEICH zu `ZEILE` in etappenBuchung.ts (Regel 14).
 *  Diese Zeilen bleiben in ROADMAP.md: Regel 14 liest sie gegen den Fahrplan,
 *  und ein Posten-Umzug nähme ihr die Grundlage. */
export const ETAPPEN_RE = /^\s+- \[( |x)\] \*\*([A-ZÄÖÜ]{1,3}-?\d{0,2}[a-z]?)\s·\s/;

// ─── Kopf ────────────────────────────────────────────────────────────────────
//
// Hausstil des `@blockers`-Blocks in ROADMAP.md: HTML-Kommentar, je Zeile
// `schlüssel: wert`. Bewusst kein YAML-Frontmatter — dann wäre das Format eine
// zweite Grammatik neben `@meta`/`@blockers`/`@queue` (§5), und GitHub zeigte
// den Kopf als Tabelle statt ihn zu verbergen.
export interface PostenKopf {
  dach: string;
  titel: string;
  anlass: string | null;
  wartetAuf: string | null;
}
export interface Posten {
  pfad: string;
  datum: string;
  kopf: PostenKopf;
  rumpf: string;
}

const KOPF_RE = /^<!--[ \t]*@posten[ \t]*\r?\n([\s\S]*?)\r?\n-->[ \t]*\r?\n?/;
const SCHLUESSEL = new Set(['dach', 'titel', 'anlass', 'wartet-auf']);

export function kopfText(k: PostenKopf): string {
  const z = ['<!-- @posten', `dach: ${k.dach}`, `titel: ${k.titel}`];
  if (k.anlass) z.push(`anlass: ${k.anlass}`);
  if (k.wartetAuf) z.push(`wartet-auf: ${k.wartetAuf}`);
  z.push('-->');
  return z.join('\n');
}

export function postenInhalt(k: PostenKopf, rumpf: string): string {
  return `${kopfText(k)}\n\n${rumpf.replace(/\s*$/, '')}\n`;
}

/** Datum aus dem Dateinamen — die EINE Quelle (§5), damit Kopf und Name nie
 *  auseinanderlaufen können. */
export function datumAusPfad(pfad: string): string | null {
  return /(?:^|\/)(\d{4}-\d{2}-\d{2})-[^/]+\.md$/.exec(pfad)?.[1] ?? null;
}

export function parsePosten(pfad: string, inhalt: string): Posten | { pfad: string; fehler: string } {
  const m = KOPF_RE.exec(inhalt);
  if (!m) return { pfad, fehler: 'kein `<!-- @posten … -->`-Kopf am Dateianfang' };
  const felder = new Map<string, string>();
  for (const z of m[1].split(/\r?\n/)) {
    if (z.trim() === '') continue;
    const f = /^([a-zäöü-]+):\s*(.*)$/.exec(z.trim());
    if (!f) return { pfad, fehler: `Kopfzeile «${z.trim().slice(0, 40)}» ist kein «schlüssel: wert»` };
    if (!SCHLUESSEL.has(f[1])) return { pfad, fehler: `unbekannter Kopf-Schlüssel «${f[1]}» (erlaubt: ${[...SCHLUESSEL].join(', ')})` };
    felder.set(f[1], f[2].trim());
  }
  const dach = felder.get('dach');
  const titel = felder.get('titel');
  if (!dach) return { pfad, fehler: 'Kopf ohne `dach:` — jeder Posten hängt an genau einem Schritt' };
  if (!titel) return { pfad, fehler: 'Kopf ohne `titel:`' };
  const datum = datumAusPfad(pfad);
  if (!datum) return { pfad, fehler: 'Dateiname ohne führendes `<YYYY-MM-DD>-`' };
  return {
    pfad,
    datum,
    kopf: { dach, titel, anlass: felder.get('anlass') || null, wartetAuf: felder.get('wartet-auf') || null },
    rumpf: inhalt.slice(m[0].length),
  };
}

// ─── Dateiname ───────────────────────────────────────────────────────────────
const UMLAUT: Record<string, string> = { ä: 'ae', ö: 'oe', ü: 'ue', Ä: 'ae', Ö: 'oe', Ü: 'ue', ß: 'ss' };

export function slugVon(titel: string): string {
  const s = titel
    .replace(/[äöüÄÖÜß]/g, (c) => UMLAUT[c])
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');
  return s || 'posten';
}

/** Pfad eines Postens; `belegt` macht die Vergabe bei Namensgleichheit
 *  deterministisch (`-2`, `-3` …) statt zufällig. */
export function postenPfad(datum: string, titel: string, belegt: ReadonlySet<string>): string {
  const basis = `${POSTEN_ORDNER}/${datum}-${slugVon(titel)}`;
  if (!belegt.has(`${basis}.md`)) return `${basis}.md`;
  for (let n = 2; ; n++) if (!belegt.has(`${basis}-${n}.md`)) return `${basis}-${n}.md`;
}

// ─── Lesen ───────────────────────────────────────────────────────────────────
export interface PostenDatei { pfad: string; inhalt: string }

export function postenScan(dir: string = POSTEN_ORDNER): PostenDatei[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .sort()
    .map((f) => ({ pfad: `${dir}/${f}`, inhalt: readFileSync(join(dir, f), 'utf8') }));
}

/** Offene Posten je Dach-ID, in Pfad-Reihenfolge (= Datum, dann Slug). */
export function postenJeDach(dateien: PostenDatei[]): Map<string, Posten[]> {
  const out = new Map<string, Posten[]>();
  for (const d of dateien) {
    const p = parsePosten(d.pfad, d.inhalt);
    if ('fehler' in p) continue; // Formfehler meldet check:plan Regel 16, nicht die Anzeige
    const liste = out.get(p.kopf.dach) ?? [];
    liste.push(p);
    out.set(p.kopf.dach, liste);
  }
  return out;
}

/** Titel der offenen Posten je Dach — die Form, die das Lagebild (bildDaten.ts)
 *  dort einsetzt, wo es bis zum 20.9.2026 die eingerückten `- [ ]`-Zeilen las. */
export function postenTitelJeDach(dir: string = POSTEN_ORDNER): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const [id, liste] of postenJeDach(postenScan(dir))) out.set(id, liste.map((p) => p.kopf.titel));
  return out;
}

/** Die Zeile, die `plan:next` anhängt — ohne Datum/Zufall, damit die Ausgabe
 *  byte-stabil bleibt. Null Posten ⇒ keine Zeile (§17-Gegengewicht: ein
 *  Werkzeug, das immer etwas sagt, wird überlesen). */
export function postenZeile(jeDach: Map<string, Posten[]>): string | null {
  let n = 0;
  let david = 0;
  for (const liste of jeDach.values()) {
    n += liste.length;
    david += liste.filter((p) => p.kopf.wartetAuf).length;
  }
  if (n === 0) return null;
  return `📌 Offene Posten: ${n} in ${jeDach.size} Schritten (davon ${david} wartet-auf-David) — \`npm run plan:posten -- <ID>\``;
}

// ─── Unterzeilen-Blöcke der ROADMAP ──────────────────────────────────────────
export interface Unterblock {
  /** ID des Dach-Schritts (nächstes `@meta` oberhalb, im selben Top-Level-Block). */
  dach: string;
  start: number;
  ende: number;
  box: string;
  zeilen: string[];
}

/**
 * Alle eingerückten Checklisten-Blöcke, je gebunden an ihren Dach-Schritt.
 *
 * FORTSETZUNGSZEILEN. Zum Block gehört nur, was STRENGER eingerückt ist als die
 * Bullet selbst. Gemessen 20.9.2026 an `QS-PERF`: dort folgt auf eine Unterzeile
 * (Einzug 2) der `**Detail:**`-Block des DACHS auf demselben Einzug 2 — eine
 * Regel «alles bis zur nächsten Bullet» hätte ihn mitgenommen und den Zeiger aus
 * der ROADMAP gelöscht. Eine Leerzeile beendet den Block ebenfalls.
 */
export function unterbloecke(md: string): Unterblock[] {
  const z = md.split('\n');
  const out: Unterblock[] = [];
  let dach: string | null = null;
  for (let i = 0; i < z.length; i++) {
    const w = z[i];
    if (/^#{1,6}\s/.test(w)) { dach = null; continue; }
    if (w.includes('<!-- @meta')) {
      dach = /@meta id:\s*(\S+)/.exec(w)?.[1] ?? dach;
      continue;
    }
    if (/^[-*+] /.test(w)) { dach = null; continue; } // neuer Top-Level-Eintrag
    const m = UNTERZEILE_RE.exec(w);
    if (!m || dach === null) continue;
    const einzug = m[1].length;
    let ende = i;
    for (let j = i + 1; j < z.length; j++) {
      const y = z[j];
      if (y.trim() === '') break;
      if (y.includes('<!-- @meta')) break;
      if ((y.match(/^[ \t]*/) ?? [''])[0].length <= einzug) break;
      ende = j;
    }
    out.push({ dach, start: i, ende, box: m[2].toLowerCase(), zeilen: z.slice(i, ende + 1) });
    i = ende;
  }
  return out;
}

/** Trägt der Block ein eigenes `@meta`? Dann ist er ein etikettierter
 *  UNTERSCHRITT, kein Posten — und bleibt unangetastet. */
export function hatEigenesMeta(md: string, b: Unterblock): boolean {
  const z = md.split('\n');
  const einzug = (z[b.start].match(/^[ \t]*/) ?? [''])[0].length;
  for (let j = b.start + 1; j < z.length; j++) {
    const y = z[j];
    if (y.trim() === '') return false;
    if ((y.match(/^[ \t]*/) ?? [''])[0].length <= einzug) return false;
    if (y.includes('<!-- @meta')) return true;
  }
  return false;
}

// ─── Titel, Anlass, Datum aus einer Bestandszeile ────────────────────────────
export function titelAus(zeile: string): string | null {
  const m = /\*\*(.+?)\*\*/.exec(zeile);
  if (!m) return null;
  return m[1].replace(/[`*]/g, '').replace(/[:\s]+$/, '').trim() || null;
}

export function anlassAus(zeile: string): string | null {
  const m = /\*\(([^)]*(?:\([^)]*\)[^)]*)*)\)\*/.exec(zeile);
  return m ? m[1].trim() : null;
}

/** `18.9.2026` / `2026-09-18` → `2026-09-18`. */
export function datumAus(text: string | null): string | null {
  if (!text) return null;
  const iso = /(\d{4})-(\d{2})-(\d{2})/.exec(text);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const de = /(\d{1,2})\.(\d{1,2})\.(\d{4})/.exec(text);
  if (!de) return null;
  return `${de[3]}-${de[2].padStart(2, '0')}-${de[1].padStart(2, '0')}`;
}

/** Stabiler Schlüssel einer Bestandszeile — Brücke zur Titel-Eingabedatei der
 *  Migration (Zeilen ohne `**Titel**` bekommen ihren Titel von Hand). */
export function zeilenHash(zeile: string): string {
  return createHash('sha1').update(zeile, 'utf8').digest('hex').slice(0, 12);
}

/**
 * Reiner Chronik-Zeiger? Solche `[x]`-Stubs sagen nur «der Wortlaut steht in
 * ROADMAP-CHRONIK.md» — sie in die Chronik zu kopieren hiesse, einen Zeiger auf
 * die Datei zu legen, in der er liegt. Mechanisch geprüft, nicht geraten: nach
 * Abzug von Checkbox, Titel, `*(Anlass)*`, ✅/Datum/PR-/SHA-Marken und der
 * Zeiger-Wendung selbst muss der Rest LEER sein.
 *
 * Die Schwelle ist bewusst Null und nicht «kurz genug» (erste Fassung
 * 20.9.2026: 40 Zeichen). Bei 40 fiel `**KKV-Label …** — ✅ … Rest: `__N`-
 * Deep-Link, Label-Drift-Tor` heraus — eine Zeile, die OFFENE Folgearbeit
 * nennt. Ein Stub-Erkenner, der einmal zu viel greift, löscht Wortlaut, den
 * niemand vermisst, weil niemand mehr weiss, dass er da war (§8). Ein
 * Aufzählungs-Rest wie «Z1 · Z2 · Z3» ist darum Substanz und wandert mit.
 */
export function istZeigerStub(zeilen: string[]): boolean {
  const text = zeilen.join(' ');
  if (!/ROADMAP-CHRONIK\.md/.test(text)) return false;
  const rest = text
    .replace(/^\s*[-*+] \[[ xX~Dd]\]\s*/, '')
    .replace(/\*\*(.+?)\*\*/g, '')
    .replace(/\*\([^)]*\)\*/g, '')
    .replace(/\[?ROADMAP-CHRONIK\.md\]?(\([^)]*\))?/g, '')
    .replace(/Wortlaut:|Umschichtung|erledigt|Erledigt|✅|Landung/g, '')
    .replace(/\(?(PR )?#\d+\)?/g, '')
    .replace(/`[0-9a-f]{7,40}`/g, '')
    .replace(/\d{1,2}\.\d{1,2}\.\d{4}|\d{4}-\d{2}-\d{2}/g, '')
    .replace(/[\s.,;:·—–\-()[\]{}*`]/g, '');
  return rest.length === 0;
}

// ─── Migration ───────────────────────────────────────────────────────────────
export interface MigrationsErgebnis {
  neuesMd: string;
  chronikBlock: string;
  dateien: { pfad: string; inhalt: string; dach: string; titel: string }[];
  entfallen: { zeile: number; text: string }[];
  ohneTitel: { hash: string; text: string }[];
}

/**
 * Einmalige, mechanische Überführung des Bestands.
 *
 * Reproduzierbar: gleiche ROADMAP + gleiche Titel-Datei + gleiches `heute`
 * ⇒ byte-gleiches Ergebnis (§2). Die Haupt-Session erzeugt den Migrations-Commit
 * damit nach fremden Landungen auf frischem `main` neu, statt ihn zu rebasen.
 *
 * WORTLAUT-ERHALT: Der Rumpf einer Posten-Datei ist der Block BYTE-GENAU, samt
 * Einzug und Checkbox. Nichts wird umformuliert — was hier verlorenginge,
 * merkte niemand mehr.
 */
export function migrationsPlan(
  md: string,
  titelVonHand: ReadonlyMap<string, string>,
  heute: string,
): MigrationsErgebnis {
  const zeilen = md.split('\n');
  const lebend = new Map(parseRoadmap(md).einheiten.map((e) => [e.id, e.etikett.status]));
  const zuEntfernen = new Set<number>();
  const dateien: MigrationsErgebnis['dateien'] = [];
  const entfallen: MigrationsErgebnis['entfallen'] = [];
  const ohneTitel: MigrationsErgebnis['ohneTitel'] = [];
  const chronik = new Map<string, string[]>();
  const belegt = new Set<string>();

  for (const b of unterbloecke(md)) {
    if (ETAPPEN_RE.test(zeilen[b.start])) continue;
    if (hatEigenesMeta(md, b)) continue;
    if (!lebend.has(b.dach)) continue; // Dach nicht (mehr) in ROADMAP.md
    if (b.box === 'x') {
      if (istZeigerStub(b.zeilen)) {
        entfallen.push({ zeile: b.start + 1, text: zeilen[b.start].trim() });
      } else {
        const liste = chronik.get(b.dach) ?? [];
        liste.push(...b.zeilen);
        chronik.set(b.dach, liste);
      }
      for (let i = b.start; i <= b.ende; i++) zuEntfernen.add(i);
      continue;
    }
    const hash = zeilenHash(zeilen[b.start]);
    // Der Hand-Titel GEWINNT. Erste Fassung 20.9.2026 las ihn nur als Notnagel
    // für Zeilen ohne `**…**` — dann bekamen zwölf Posten den ersten Fettdruck
    // der Zeile als Namen, und der ist nicht immer der Titel: «geparkt», «M2»,
    // «Vorbestand», dreimal «WARTET AUF DAVID». Ein Posten, der «geparkt»
    // heisst, ist in `plan:posten` und im Lagebild so gut wie unsichtbar —
    // genau die Sichtbarkeit, für die das Modell gebaut ist (F17).
    const titel = titelVonHand.get(hash) ?? titelAus(zeilen[b.start]) ?? null;
    if (!titel) {
      ohneTitel.push({ hash, text: zeilen[b.start].trim() });
      continue; // ohne Titel wird NICHT migriert — raten wäre schlimmer als stehen lassen
    }
    const anlass = anlassAus(zeilen[b.start]);
    const datum = datumAus(anlass) ?? heute;
    const pfad = postenPfad(datum, titel, belegt);
    belegt.add(pfad);
    dateien.push({
      pfad,
      dach: b.dach,
      titel,
      inhalt: postenInhalt(
        { dach: b.dach, titel, anlass, wartetAuf: /WARTET AUF DAVID|wartet auf dich/i.test(zeilen[b.start]) ? 'david' : null },
        b.zeilen.join('\n'),
      ),
    });
    for (let i = b.start; i <= b.ende; i++) zuEntfernen.add(i);
  }

  const chronikBlock = chronik.size
    ? [
        '',
        `# Umschichtung ${heute} — erledigte Unterpunkte (mechanisch)`,
        '',
        'Wörtlich aus ROADMAP.md herausgelöst (`npm run plan:posten -- migrieren`, QS-EFFIZIENZ,',
        'Posten-Modell). Kein Satz ist umformuliert; reine Zeiger-Stubs auf diese Datei sind',
        'ersatzlos entfallen und im PR einzeln aufgeführt.',
        '',
        ...[...chronik.entries()].flatMap(([id, z]) => [`## ${id}`, '', ...z, '']),
      ].join('\n')
    : '';

  return {
    neuesMd: zeilen.filter((_, i) => !zuEntfernen.has(i)).join('\n'),
    chronikBlock,
    dateien,
    entfallen,
    ohneTitel,
  };
}

// ─── Session-Notizen ─────────────────────────────────────────────────────────
const NOTIZ_ABSCHNITT = /^#{1,6}\s*.*(Nebenfund|Wartet auf David)/i;
const NOTIZ_ZEILE = /^([ \t]*[-*+] )\[ \]\s*\[([^\]]+)\]\s*(.+)$/;
const NOTIZ_OHNE_ID = /^[ \t]*[-*+] \[ \]\s*(.+)$/;

export interface NotizenErgebnis {
  dateien: { pfad: string; inhalt: string; dach: string; titel: string }[];
  brauchtDach: string[];
  neuerText: string;
}

/**
 * Wandelt die OFFENEN Zeilen der Abschnitte «Nebenfunde»/«Wartet auf David»
 * einer Session-Notizen-Datei in Posten-Dateien und hakt sie dort ab.
 *
 * Eine Zeile ohne `[<DACH-ID>]`-Marke wird NICHT geraten, sondern als «braucht
 * Dach» gemeldet: ein falsch einsortierter Posten ist unsichtbarer als ein
 * gemeldeter (F17).
 */
export function notizenPosten(text: string, heute: string, belegt: ReadonlySet<string> = new Set()): NotizenErgebnis {
  const zeilen = text.split('\n');
  const dateien: NotizenErgebnis['dateien'] = [];
  const brauchtDach: string[] = [];
  const vergeben = new Set(belegt);
  let imAbschnitt = false;
  let wartet = false;
  for (let i = 0; i < zeilen.length; i++) {
    const z = zeilen[i];
    if (/^#{1,6}\s/.test(z)) {
      imAbschnitt = NOTIZ_ABSCHNITT.test(z);
      wartet = imAbschnitt && /Wartet auf David/i.test(z);
      continue;
    }
    if (!imAbschnitt) continue;
    const m = NOTIZ_ZEILE.exec(z);
    if (!m) {
      const o = NOTIZ_OHNE_ID.exec(z);
      if (o) brauchtDach.push(o[1].trim());
      continue;
    }
    const rest = m[3].trim();
    const trenner = rest.indexOf(' — ');
    const titel = (trenner === -1 ? rest : rest.slice(0, trenner)).replace(/[`*]/g, '').trim();
    const rumpf = trenner === -1 ? rest : rest.slice(trenner + 3).trim();
    const pfad = postenPfad(heute, titel, vergeben);
    vergeben.add(pfad);
    dateien.push({
      pfad,
      dach: m[2].trim(),
      titel,
      inhalt: postenInhalt(
        { dach: m[2].trim(), titel, anlass: `Session-Notizen ${heute}`, wartetAuf: wartet ? 'david' : null },
        rumpf || titel,
      ),
    });
    zeilen[i] = `${m[1]}[x] [${m[2].trim()}] ${rest}`;
  }
  return { dateien, brauchtDach, neuerText: zeilen.join('\n') };
}
