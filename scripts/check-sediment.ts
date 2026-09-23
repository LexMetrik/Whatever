/**
 * check:sediment — Wache gegen vier Sediment-Gattungen (W2·29-WERKBANK-TOR/-EXPORTE).
 *
 * Anlass (22.9.2026, FAHRPLAN-WERKBANK-UMBAU §3, Rats-Auflage 3): jede Umbau-Runde
 * hinterlässt Rückstand. KEINE Baseline, KEINE Ausnahmeliste, KEIN Warnung-statt-Fail —
 * was rot ist, wird im selben PR gefixt. Geschichte (Regex→postcss, 114 statt 115):
 * PRs #979 und #982.
 *
 * PRÜFUNGEN (je ≥ 1 Fund ⇒ Exit 1):
 *   (a) TOTE CSS-KLASSEN in `src/index.css`: Census per postcss über alle Regeln in
 *       allen Tiefen (`@layer`/`@media`/`@container`/`@supports`, `:is(…)`; `@apply`
 *       ist keine Definition). Verwender = Treffer MIT WORTGRENZE (§7, `lc-btn` zählt
 *       nicht in `lc-btn-sm`) in `src/**` ohne `src/tests/**`, in `scripts/**`
 *       (Generatoren emittieren Klassen) und `index.html`; `src/index.css` belegt
 *       sich nicht selbst. Alle Präfixe.
 *   (b) VERWAISTE MODULE — knip wird nicht nachgebaut (§17: keine Doppelwache);
 *       gewertet wird die geparste `files`-Liste, nicht knips Exit-Code.
 *   (c) DOPPELTE RECHNER-METADATEN — Katalog (`startseiteConfig` → KARTEN) ist die
 *       Quelle (§5). (c1) jeder Rechner aus `CALCULATORS` byte-gleich zu seiner
 *       Katalog-Karte (Titel, Kategorie, Kurzbeschrieb, Normen, Status); (c2) keine
 *       String-Literale in Metadaten-Position in `src/lib/calculators.ts` — der
 *       eigentliche Zaun. Mehrdeutige Slugs brauchen `KANON_KARTE_JE_SLUG`; fehlt
 *       der Eintrag oder zeigt er ins Leere, ist das ein Fund.
 *   (d) UNGENUTZTE EXPORTE — derselbe knip-Lauf (`--include files,exports,types`).
 *       Ein Test-Import eines Produktiv-Exports zählt als Verwendung; Exporte
 *       innerhalb `src/tests/**` zählt (d) nicht. Keine Fassaden-`entry` in
 *       knip.json (Gegenprüfung #982: pauschale Freistellung).
 *
 * DETERMINISMUS (§2): kein Netz, keine Uhr, kein Zufall; nur Arbeitsbaum + statische
 * Analyse. Lauf: `npm run check:sediment` (Teil von `check:seriell`, CI «Offline-Tore»).
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import postcss from 'postcss';
import { KARTEN } from '../src/lib/startseiteKarten';
import * as registry from '../src/lib/calculators';

const WURZEL = process.cwd();
const CSS_PFAD = join(WURZEL, 'src', 'index.css');
const REGISTRY_PFAD = join(WURZEL, 'src', 'lib', 'calculators.ts');

// ─── (a) Tote CSS-Klassen ───────────────────────────────────────────────────

/**
 * Alle Klassennamen, die `src/index.css` als Selektor DEFINIERT.
 *
 * postcss statt Regex (Gegenprüfung PR #979, 22.9.2026): eine `;`/`}`-Anker-
 * Regex kann nicht zwischen «Ende der vorigen Regel» und «Anfang eines neuen
 * Blocks» unterscheiden — die erste Regel direkt nach der öffnenden Klammer
 * eines `@layer`/`@media`/`@container`-Blocks folgt auf ein `{`, nicht auf
 * `;`/`}`, und blieb darum unsichtbar, sobald nur Kommentare/Whitespace
 * dazwischenlagen. `root.walkRules` läuft dagegen über ALLE Regeln in ALLEN
 * Verschachtelungstiefen, unabhängig davon, was ihnen vorausgeht — dasselbe
 * Vorbild wie `check-design-tokens.ts` und
 * `src/tests/scroll-rand-b8.test.ts`. `@apply`-Argumente sind KEINE
 * Definitionen; sie stehen als eigener AtRule-Knoten IN einer Regel und
 * werden von `walkRules` nicht als Regel besucht.
 */
function cssKlassenCensus(css: string): string[] {
  const namen = new Set<string>();
  postcss.parse(css).walkRules((regel) => {
    for (const k of regel.selector.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) namen.add(k[1]);
  });
  return [...namen].sort();
}

/**
 * Dateien, in denen eine Klasse als Verwender zählen darf.
 *
 * AUSGENOMMEN ist diese Datei selbst: ein Tor darf sich nicht selbst als
 * Beleg dienen. Der Kopfkommentar nennt Klassennamen als Beispiel, und eine
 * Wortgrenzen-Suche kann ein Beispiel nicht von einem Konsumenten
 * unterscheiden — genau so stand `check:tor-paritaet` einst auf der eigenen
 * Allowlist und war rekursiv unsichtbar (20.7.2026).
 */
const SELBST = 'scripts/check-sediment.ts';

function verwenderDateien(): string[] {
  const aus: string[] = [];
  const lauf = (wurzel: string, endungen: string[]) => {
    const abs = join(WURZEL, wurzel);
    if (!existsSync(abs)) return;
    for (const eintrag of readdirSync(abs, { withFileTypes: true }).sort((x, y) => x.name.localeCompare(y.name))) {
      const rel = `${wurzel}/${eintrag.name}`;
      if (eintrag.isDirectory()) {
        if (rel === 'src/tests' || eintrag.name === 'node_modules') continue;
        lauf(rel, endungen);
      } else if (endungen.some((e) => eintrag.name.endsWith(e)) && rel !== SELBST) {
        aus.push(rel);
      }
    }
  };
  lauf('src', ['.ts', '.tsx']);
  lauf('scripts', ['.ts', '.tsx', '.mjs']);
  if (existsSync(join(WURZEL, 'index.html'))) aus.push('index.html');
  return aus;
}

function toteKlassen(): string[] {
  const klassen = cssKlassenCensus(readFileSync(CSS_PFAD, 'utf8'));
  const inhalte = verwenderDateien().map((p) => readFileSync(join(WURZEL, p), 'utf8'));
  // Wortgrenze bindestrich-sicher: weder davor noch danach darf ein Wort-
  // zeichen oder ein Bindestrich stehen. `\b` allein genügt NICHT — es trennt
  // an jedem Bindestrich und liesse `lc-btn` in `lc-btn-sm` als Treffer durch.
  return klassen.filter((name) => {
    const re = new RegExp(`(?<![\\w-])${name.replace(/[-]/g, '\\-')}(?![\\w-])`);
    return !inhalte.some((c) => re.test(c));
  });
}

// ─── (b) Verwaiste Module (knip) ────────────────────────────────────────────

/**
 * Pfad zur knip-Binärdatei. Gesucht wird wie npm selbst sucht: aufsteigend
 * über die Elternverzeichnisse. In CI liegt `node_modules` in der Repo-Wurzel
 * (= cwd), in einem git-Worktree dagegen im Haupt-Checkout darüber — ein
 * fester `cwd/node_modules`-Pfad wäre dort immer leer.
 */
function knipBin(): string | undefined {
  let dir = WURZEL;
  for (;;) {
    const kandidat = join(dir, 'node_modules', '.bin', 'knip');
    if (existsSync(kandidat)) return kandidat;
    const oben = dirname(dir);
    if (oben === dir) return undefined;
    dir = oben;
  }
}

/** Ein knip-Lauf, gemeinsam ausgewertet für (b) verwaiste Module und (d) ungenutzte Exporte. */
function knipBefund(): { module: string[]; exporte: string[] } {
  const bin = knipBin();
  if (!bin) {
    console.error('check:sediment: knip nicht installiert (node_modules/.bin/knip) — Gattung (b)/(d) kann nicht gemessen werden.');
    process.exit(2);
  }
  const lauf = spawnSync(bin, ['--include', 'files,exports,types', '--reporter', 'json', '--no-progress'], {
    cwd: WURZEL, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024,
  });
  if (lauf.error) {
    console.error(`check:sediment: knip-Aufruf fehlgeschlagen — ${lauf.error.message}`);
    process.exit(2);
  }
  // Exit 1 = knip hat Funde; alles darüber ist ein echter Werkzeugfehler.
  if (lauf.status !== 0 && lauf.status !== 1) {
    console.error(`check:sediment: knip endete mit Exit ${lauf.status}.\n${lauf.stderr ?? ''}`);
    process.exit(2);
  }
  let roh: {
    issues?: {
      file?: string;
      files?: { name?: string }[];
      exports?: { name?: string; line?: number }[];
      types?: { name?: string; line?: number }[];
    }[];
  };
  try {
    roh = JSON.parse(lauf.stdout.trim());
  } catch {
    console.error(`check:sediment: knip-Ausgabe ist kein JSON.\n${lauf.stdout.slice(0, 500)}`);
    process.exit(2);
  }
  const dateien = new Set<string>();
  const exporte: string[] = [];
  for (const eintrag of roh.issues ?? []) {
    for (const f of eintrag.files ?? []) if (f.name) dateien.add(f.name);
    const datei = eintrag.file;
    // (d) klammert src/tests/** aus: Testhilfsdateien sind TABU für dieses
    // Tor (s. Kopfkommentar); (b) bleibt unbeschränkt, wie vor #979.
    if (!datei || datei.startsWith('src/tests/')) continue;
    for (const e of eintrag.exports ?? []) if (e.name) exporte.push(`${datei}:${e.line ?? '?'} · ${e.name}`);
    for (const t of eintrag.types ?? []) if (t.name) exporte.push(`${datei}:${t.line ?? '?'} · ${t.name} (Typ)`);
  }
  return { module: [...dateien].sort(), exporte: exporte.sort() };
}

// ─── (c) Doppelte Rechner-Metadaten ─────────────────────────────────────────

/** Aktive Katalog-Karten mit Rechner-Seite, je Slug gesammelt. */
function katalogJeSlug(): Map<string, { id: string; titel: string; kategorie: string; kurzbeschrieb: string; normen: string[]; status: string }[]> {
  const proSlug = new Map<string, { id: string; titel: string; kategorie: string; kurzbeschrieb: string; normen: string[]; status: string }[]>();
  for (const karte of Object.values(KARTEN)) {
    if (karte.modus !== 'rechner' || karte.status === 'geplant') continue;
    if (!karte.href?.startsWith('/rechner/')) continue;
    const slug = karte.href.slice('/rechner/'.length).split('#')[0];
    const eintrag = {
      id: karte.id,
      titel: karte.title,
      kategorie: karte.rechtsgebiet,
      kurzbeschrieb: karte.description,
      normen: karte.norms.map((n) => n.label),
      status: karte.status,
    };
    const liste = proSlug.get(slug);
    if (liste) liste.push(eintrag); else proSlug.set(slug, [eintrag]);
  }
  return proSlug;
}

const kuerzen = (w: string) => (w.length > 70 ? `${w.slice(0, 67)}…` : w);

function metadatenFunde(): string[] {
  const funde: string[] = [];
  const proSlug = katalogJeSlug();
  const kanon = registry.KANON_KARTE_JE_SLUG;

  // (c1) Registry-Werte gegen die kanonische Karte.
  for (const calc of registry.CALCULATORS) {
    if (calc.status === 'geplant') continue;
    const kandidaten = proSlug.get(calc.slug) ?? [];
    if (kandidaten.length === 0) {
      funde.push(`${calc.slug} · Karte · keine aktive Katalog-Karte mit href /rechner/${calc.slug}`);
      continue;
    }
    let karte = kandidaten[0];
    if (kandidaten.length > 1) {
      const gewaehlt = kanon?.[calc.slug];
      if (!gewaehlt) {
        funde.push(`${calc.slug} · Kanon · ${kandidaten.length} Karten teilen den Slug (${kandidaten.map((k) => k.id).join(', ')}), keine Abbildung in KANON_KARTE_JE_SLUG`);
        continue;
      }
      const gefunden = kandidaten.find((k) => k.id === gewaehlt);
      if (!gefunden) {
        funde.push(`${calc.slug} · Kanon · KANON_KARTE_JE_SLUG zeigt auf «${gewaehlt}» — keine solche Karte unter diesem Slug`);
        continue;
      }
      karte = gefunden;
    }
    const paare: [string, string, string][] = [
      ['titel', calc.titel, karte.titel],
      ['kategorie', calc.kategorie, karte.kategorie],
      ['kurzbeschrieb', calc.kurzbeschrieb, karte.kurzbeschrieb],
      ['normen', calc.normen.join(' | '), karte.normen.join(' | ')],
      ['status', calc.status, karte.status],
    ];
    for (const [feld, ausRegistry, ausKatalog] of paare) {
      if (ausRegistry !== ausKatalog) {
        funde.push(`${calc.slug} · ${feld} · Registry «${kuerzen(ausRegistry)}» ≠ Katalog «${kuerzen(ausKatalog)}»`);
      }
    }
  }

  // Ein Kanon-Eintrag für einen Slug, den es gar nicht (mehr) gibt, ist eine
  // still veraltende Abbildung — derselbe Defekt, nur andersherum.
  for (const slug of Object.keys(kanon ?? {})) {
    if (!proSlug.has(slug)) funde.push(`${slug} · Kanon · KANON_KARTE_JE_SLUG führt einen Slug ohne Katalog-Karte`);
  }

  // (c2) Keine Metadaten-String-Literale in der Registry-Quelle. Bewusst OHNE
  // Kommentar-Entfernung: ein auskommentiertes Handregister ist dasselbe
  // Sediment, nur schlafend.
  const quelle = readFileSync(REGISTRY_PFAD, 'utf8');
  for (const t of quelle.matchAll(/\b(titel|kurzbeschrieb|kategorie)\s*:\s*['"`]/g)) {
    const zeile = quelle.slice(0, t.index).split('\n').length;
    funde.push(`src/lib/calculators.ts:${zeile} · Handregister · Metadaten-Literal «${t[0].trim()}…»`);
  }
  for (const t of quelle.matchAll(/\bnormen\s*:\s*\[\s*['"]/g)) {
    const zeile = quelle.slice(0, t.index).split('\n').length;
    funde.push(`src/lib/calculators.ts:${zeile} · Handregister · Normen-Literalliste`);
  }
  return funde;
}

// ─── Bericht ────────────────────────────────────────────────────────────────

const a = toteKlassen();
const knip = knipBefund();
const b = knip.module;
const c = metadatenFunde();
const d = knip.exporte;

const block = (titel: string, funde: string[]) => {
  console.log(`\n${titel}: ${funde.length}`);
  for (const f of funde) console.log(`  · ${f}`);
};

console.log('check:sediment — tote CSS-Klassen · verwaiste Module · doppelte Rechner-Metadaten · ungenutzte Exporte');
block('(a) tote CSS-Klassen in src/index.css ohne Verwender', a);
block('(b) verwaiste Module (knip --include files)', b);
block('(c) doppelte Rechner-Metadaten (Registry ≠ Katalog · Handregister)', c);
block('(d) ungenutzte Exporte/Typen (knip --include exports,types)', d);

const zaehler = `a ${a.length} · b ${b.length} · c ${c.length} · d ${d.length}`;
if (a.length + b.length + c.length + d.length > 0) {
  console.error(`\ncheck:sediment ROT (${zaehler}) — keine Baseline, keine Ausnahmeliste: im selben PR beheben.`);
  process.exit(1);
}
console.log(`\ncheck:sediment grün (${zaehler})`);
