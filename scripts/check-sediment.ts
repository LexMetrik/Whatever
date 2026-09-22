/**
 * check:sediment — Wache gegen drei Sediment-Gattungen (W2·29-WERKBANK-TOR).
 *
 * 22.9.2026 · ANLASS · FAHRPLAN-WERKBANK-UMBAU §3, Rats-Verdikt Auflage 3.
 * Der Werkbank-Umbau legt Rubrik für Rubrik ein neues Aussehen an Ort — und
 * jede solche Runde produziert Rückstand: eine CSS-Regel, deren Konsument
 * gelöscht wurde; ein Modul, das niemand mehr importiert; ein Metadaten-Feld,
 * das neben dem Katalog weiterlebt. Für keine der drei Gattungen gab es eine
 * Wache. Der Umbau darf nicht dieselbe Schicht neu ablagern, die er abträgt.
 *
 * Auflage 3 des Rats ist Teil dieses Tors: KEINE Baseline, KEINE Ausnahme-
 * liste, KEIN Warnung-statt-Fail. Was heute rot ist, wird im selben PR gefixt.
 * Ein Tor mit Bestandsschutz hätte genau das sedimentiert, was es misst.
 *
 * PRÜFUNGEN (alle drei ≥ 1 Fund ⇒ Exit 1):
 *   (a) TOTE CSS-KLASSEN in `src/index.css`. Census aller Klassenselektoren
 *       (Kommentare entfernt, `.name` im Selektortext vor `{`, auch
 *       verschachtelt und in `:is(…)`); `@apply`-Argumente sind KEINE
 *       Definitionen. Verwender = Treffer MIT WORTGRENZE (`lc-btn` zählt nicht
 *       in `lc-btn-sm`, §7 «Identitäts-Treffer, nie Substring-Präsenz») in
 *       `src/**` ohne `src/tests/**`, in `scripts/**` (Prerender/Generatoren
 *       emittieren Klassen in Artefakte) und in `index.html`. Ein Treffer nur
 *       in `src/index.css` selbst zählt nicht — eine Regel belegt sich nicht
 *       selbst. Umfang: ALLE Präfixe, nicht nur `lc-`/`lr7-` (gemessen
 *       22.9.2026: 206 Klassen, 7 tot, 0 dynamisch zusammengesetzte
 *       Klassennamen — die Voll-Messung ist tragbar, also wird sie gemacht).
 *   (b) VERWAISTE MODULE. knip wird NICHT nachgebaut (§17-Gegengewicht: keine
 *       Doppelwache) — das Tor ruft die vorhandene Installation auf und wertet
 *       ihre `files`-Liste. `report:tot` (knip --no-exit-code) bleibt daneben
 *       bestehen: es meldet auch tote Exporte und Abhängigkeiten, hat aber
 *       bauartbedingt keine Zaunwirkung. Der Exit-Code von knip ist hier NICHT
 *       die Wahrheit (knip endet bei Funden mit 1) — gewertet wird die
 *       geparste Liste.
 *   (c) DOPPELTE RECHNER-METADATEN. Der Katalog (`startseiteConfig` → KARTEN)
 *       ist Single Source of Truth (§5). Zwei Teile:
 *       (c1) Jeder Rechner aus `CALCULATORS` muss in Titel, Kategorie,
 *            Kurzbeschrieb, Normen und Status byte-gleich mit seiner
 *            kanonischen Katalog-Karte sein.
 *       (c2) `src/lib/calculators.ts` enthält keine String-Literale in
 *            Metadaten-Position. Das ist der eigentliche Zaun: nach dem Umbau
 *            ist (c1) per Konstruktion grün, (c2) bleibt der Wächter gegen ein
 *            erneut von Hand gepflegtes Zweitregister.
 *       Mehrdeutige Slugs (mehrere Karten teilen sich eine Rechner-Seite)
 *       brauchen einen Eintrag in `KANON_KARTE_JE_SLUG` (exportiert aus
 *       `src/lib/calculators.ts`); fehlt er oder zeigt er ins Leere, ist das
 *       ein Fund — so kann die Abbildung nicht still veralten.
 *
 * DETERMINISMUS (§2): kein Netz, keine Uhr, kein Zufall. Gelesen werden
 * ausschliesslich Dateien des Arbeitsbaums; knip ist statische Analyse.
 *
 * Lauf: `npm run check:sediment` (Teil von `check:seriell`; PR-Deckung in
 * `.github/workflows/ci.yml`, Job «Offline-Tore»).
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { KARTEN } from '../src/lib/startseiteKarten';
import * as registry from '../src/lib/calculators';

const WURZEL = process.cwd();
const CSS_PFAD = join(WURZEL, 'src', 'index.css');
const REGISTRY_PFAD = join(WURZEL, 'src', 'lib', 'calculators.ts');

// ─── (a) Tote CSS-Klassen ───────────────────────────────────────────────────

/** Alle Klassennamen, die `src/index.css` als Selektor DEFINIERT. */
function cssKlassenCensus(css: string): string[] {
  const ohneKommentare = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const namen = new Set<string>();
  // Selektortext = alles zwischen dem letzten Block-Ende und der nächsten `{`.
  // At-Regeln (`@media`, `@layer`, `@supports`, `@apply` …) fallen weg: ihr
  // Kopf ist keine Selektorliste.
  const bloecke = /(^|[};])([^{};]*)\{/g;
  let treffer: RegExpExecArray | null;
  while ((treffer = bloecke.exec(ohneKommentare))) {
    const selektor = treffer[2].trim();
    if (!selektor || selektor.startsWith('@')) continue;
    for (const k of selektor.matchAll(/\.(-?[A-Za-z_][\w-]*)/g)) namen.add(k[1]);
  }
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

function verwaisteModule(): string[] {
  const bin = knipBin();
  if (!bin) {
    console.error('check:sediment: knip nicht installiert (node_modules/.bin/knip) — Gattung (b) kann nicht gemessen werden.');
    process.exit(2);
  }
  const lauf = spawnSync(bin, ['--include', 'files', '--reporter', 'json', '--no-progress'], {
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
  let roh: { issues?: { file?: string; files?: { name?: string }[] }[] };
  try {
    roh = JSON.parse(lauf.stdout.trim());
  } catch {
    console.error(`check:sediment: knip-Ausgabe ist kein JSON.\n${lauf.stdout.slice(0, 500)}`);
    process.exit(2);
  }
  const dateien = new Set<string>();
  for (const eintrag of roh.issues ?? []) {
    for (const f of eintrag.files ?? []) if (f.name) dateien.add(f.name);
  }
  return [...dateien].sort();
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
  const kanon = (registry as unknown as { KANON_KARTE_JE_SLUG?: Record<string, string> }).KANON_KARTE_JE_SLUG;

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
const b = verwaisteModule();
const c = metadatenFunde();

const block = (titel: string, funde: string[]) => {
  console.log(`\n${titel}: ${funde.length}`);
  for (const f of funde) console.log(`  · ${f}`);
};

console.log('check:sediment — tote CSS-Klassen · verwaiste Module · doppelte Rechner-Metadaten');
block('(a) tote CSS-Klassen in src/index.css ohne Verwender', a);
block('(b) verwaiste Module (knip --include files)', b);
block('(c) doppelte Rechner-Metadaten (Registry ≠ Katalog · Handregister)', c);

const zaehler = `a ${a.length} · b ${b.length} · c ${c.length}`;
if (a.length + b.length + c.length > 0) {
  console.error(`\ncheck:sediment ROT (${zaehler}) — keine Baseline, keine Ausnahmeliste: im selben PR beheben.`);
  process.exit(1);
}
console.log(`\ncheck:sediment grün (${zaehler})`);
