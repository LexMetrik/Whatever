// scripts/betrieb/prod-smoke.ts — B-11 Prod-Watchdog (Synthetic Smoke)
//
// FAHRPLAN-BASIS-AUSBAU §A5 (B-11): `normen-monitor.yml` überwacht die QUELLEN,
// niemand überwacht die eigene PROD. Dieser Smoke prüft die Kernrouten der
// Live-Site (200 + korrekter Inhalts-Typ), den ehrlichen JSON-503/200 der
// Edge-Suche, die Sitemap, statische Assets und die CSP-Kopfzeile. Läuft als
// GitHub-Cron (`.github/workflows/prod-smoke.yml`) — bei Rot ein sichtbarer
// Issue (Muster wie normen-monitor). Lokal: `npm run smoke:prod`.
//
// Abgrenzung (§14, nicht daneben bauen): `normen-monitor.yml` bleibt der
// QUELLEN-Wächter (Fedlex/LexWork/Materialien). Dieser Job ist der PROD-Wächter.
//
// WARN-MECHANIK ZURÜCKGEBAUT (15.8.2026, §17-Gegengewicht/§6.7). Zwei Prüfungen
// liefen als `weich()`-WARN, weil PR #244 (QS-OPT O-1.1 CSP-connect-src /
// O-1.4 Soft-404) bei ihrem Bau noch offen war. Ein WARN macht den Job per
// Konstruktion NIE rot — beide Prüfungen konnten also nicht scheitern, und ihr
// Anlass war seit dem Merge von #244 entfallen. Gemessen am 15.8.2026 gegen
// die Live-Site (nicht behauptet): `/normtext/existiert-nicht-*.json` → HTTP
// 404, und die CSP-Kopfzeile trägt `connect-src … https://entscheidsuche.ch`.
// Beide sind darum jetzt HART. Damit fällt die gesamte WARN-Maschinerie
// (`weich()`, `Befund.warn`, gelb-Zähler, WARN-Symbol) ersatzlos weg — was
// nicht scheitern kann, wird gestrichen statt bewacht.
//
// PROD-STAND-WÄCHTER ERGÄNZT (16.8.2026, QS-AUTOMATIK). Belegter Anlass: seit
// PR #519 (15.8.) war JEDES Prod-Deployment auf main CANCELED — sieben gemergte
// PRs (#520, #512, #521, #524, #529, #523, #530) waren nicht live. Der Vercel-
// «Ignored Build Step» sagte bei einem `fatal: bad object` fälschlich «skip».
// Dieser Smoke sah davon NICHTS: er prüfte HTTP 200 und Inhalts-Marker, und die
// alte, live stehende Fassung erfüllt beides — 24 h lang grün über einer toten
// Auslieferungskette. Die Lücke war strukturell: geprüft wurde, DASS etwas
// ausgeliefert wird, nie WELCHER Stand. `pruefeBuildStand()` schliesst sie.
//
// Reine Betriebs-Prüfung, kein Rechts-/Rechen-/Norm-Pfad. Kein Import aus src/.

import { execFileSync } from 'node:child_process';

const BASE = (process.env.SMOKE_BASE_URL || 'https://lexmetrik.vercel.app').replace(/\/$/, '');
const TIMEOUT_MS = Number(process.env.SMOKE_TIMEOUT_MS || 20000);

interface Befund {
  ok: boolean;
  name: string;
  detail: string;
}

const befunde: Befund[] = [];
function hart(ok: boolean, name: string, detail: string) {
  befunde.push({ ok, name, detail });
}

async function hole(pfad: string, init?: RequestInit): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await fetch(`${BASE}${pfad}`, {
      ...init,
      signal: ctrl.signal,
      headers: { 'user-agent': 'lexmetrik-prod-smoke', ...(init?.headers ?? {}) },
    });
  } finally {
    clearTimeout(t);
  }
}

/** HTML-Kernroute: 200 + text/html + trägt den App-Marker (nicht bloss eine leere Shell). */
async function pruefeHtmlRoute(pfad: string, marker = 'LexMetrik') {
  try {
    const res = await hole(pfad);
    const ct = res.headers.get('content-type') || '';
    if (res.status !== 200) return hart(false, `HTML ${pfad}`, `Status ${res.status} (erwartet 200)`);
    if (!ct.includes('text/html')) return hart(false, `HTML ${pfad}`, `Content-Type «${ct}» (erwartet text/html)`);
    const body = await res.text();
    if (!body.includes(marker)) return hart(false, `HTML ${pfad}`, `Marker «${marker}» fehlt im Body`);
    if (!body.includes('id="root"')) return hart(false, `HTML ${pfad}`, 'App-Root <div id="root"> fehlt');
    hart(true, `HTML ${pfad}`, `200 · ${ct.split(';')[0]} · Marker ok`);
  } catch (e) {
    hart(false, `HTML ${pfad}`, `Netz-/Timeout-Fehler: ${(e as Error).message}`);
  }
}

/** Alt-Route mit Link-Erbe: permanenter Redirect (308/301) auf das Ziel — nicht gefolgt,
 *  damit Status UND Location beweisbar sind (IA-6 Stufe 2, vercel.json). */
async function pruefeRedirect(pfad: string, ziel: string) {
  try {
    const res = await hole(pfad, { redirect: 'manual' });
    if (res.status !== 308 && res.status !== 301) {
      return hart(false, `Redirect ${pfad}`, `Status ${res.status} (erwartet 308/301)`);
    }
    const loc = res.headers.get('location') || '';
    if (new URL(loc, BASE).pathname + new URL(loc, BASE).search !== ziel) {
      return hart(false, `Redirect ${pfad}`, `Location «${loc}» (erwartet ${ziel})`);
    }
    hart(true, `Redirect ${pfad}`, `${res.status} → ${ziel}`);
  } catch (e) {
    hart(false, `Redirect ${pfad}`, `Netz-/Timeout-Fehler: ${(e as Error).message}`);
  }
}

async function pruefeApiSuche() {
  const pfad = '/api/suche?q=miete';
  try {
    const res = await hole(pfad);
    const ct = res.headers.get('content-type') || '';
    // Vertrag §8: 200 (Turso live) ODER 503 (Env-Vars fehlen) — NIE eine HTML-Soft-404-Shell.
    if (res.status !== 200 && res.status !== 503) {
      return hart(false, `API ${pfad}`, `Status ${res.status} (erwartet 200 oder ehrlicher 503)`);
    }
    if (!ct.includes('application/json')) {
      return hart(false, `API ${pfad}`, `Content-Type «${ct}» — HTML statt JSON = Route verschluckt (Soft-404-Signal)`);
    }
    hart(true, `API ${pfad}`, `${res.status} · application/json`);
  } catch (e) {
    hart(false, `API ${pfad}`, `Netz-/Timeout-Fehler: ${(e as Error).message}`);
  }
}

async function pruefeSitemap() {
  try {
    const res = await hole('/sitemap.xml');
    const body = res.status === 200 ? await res.text() : '';
    const ok = res.status === 200 && /<sitemapindex|<urlset/.test(body);
    hart(ok, 'Sitemap /sitemap.xml', ok ? '200 · XML-Sitemap-Index' : `Status ${res.status} / kein Sitemap-XML`);
  } catch (e) {
    hart(false, 'Sitemap /sitemap.xml', `Netz-/Timeout-Fehler: ${(e as Error).message}`);
  }
}

async function pruefeAsset(pfad: string, typPrefix: string) {
  try {
    const res = await hole(pfad, { method: 'GET' });
    const ct = res.headers.get('content-type') || '';
    const ok = res.status === 200 && ct.startsWith(typPrefix);
    hart(ok, `Asset ${pfad}`, ok ? `200 · ${ct.split(';')[0]}` : `Status ${res.status} · ${ct || 'kein Content-Type'}`);
  } catch (e) {
    hart(false, `Asset ${pfad}`, `Netz-/Timeout-Fehler: ${(e as Error).message}`);
  }
}

async function pruefeCsp() {
  try {
    const res = await hole('/');
    const csp = res.headers.get('content-security-policy') || '';
    hart(csp.includes("default-src 'self'"), 'CSP-Kopfzeile', csp ? "vorhanden · default-src 'self'" : 'FEHLT');
    // HART seit 15.8.2026 (vorher WARN, Anlass PR #244 entfallen): fehlt der
    // Host, blockt die CSP den LiveSuche-POST — ein totes Feature in Prod.
    hart(
      csp.includes('entscheidsuche.ch'),
      'CSP connect-src entscheidsuche.ch',
      csp.includes('entscheidsuche.ch')
        ? 'gedeckt'
        : 'FEHLT — LiveSuche-POST wird von der CSP geblockt',
    );
  } catch (e) {
    hart(false, 'CSP-Kopfzeile', `Netz-/Timeout-Fehler: ${(e as Error).message}`);
  }
}

async function pruefeSoft404() {
  const pfad = `/normtext/existiert-nicht-${Date.now()}.json`;
  try {
    const res = await hole(pfad);
    const ct = res.headers.get('content-type') || '';
    const echt404 = res.status === 404;
    // HART seit 15.8.2026 (vorher WARN, Anlass PR #244 entfallen): eine
    // 200-HTML-Shell auf fehlende Datenassets maskiert jeden Datenfehler.
    hart(
      echt404,
      'Soft-404-Signal',
      echt404
        ? 'fehlende .json-Assets geben echte 404'
        : `fehlendes Asset gibt Status ${res.status} (${ct.split(';')[0]}) statt 404 — Soft-404 zurück`,
    );
  } catch (e) {
    hart(false, 'Soft-404-Signal', `Netz-/Timeout-Fehler: ${(e as Error).message}`);
  }
}

/** Dieselbe Skip-Liste wie der `ignoreCommand` in vercel.json: Pfade, deren
 *  Änderung bewusst KEIN Deployment auslöst. Bleibt beides deckungsgleich,
 *  meldet der Wächter genau dann, wenn Vercel hätte bauen müssen. */
const NUR_DOKU = /\.md$|^(bibliothek|archiv|docs|\.claude)\//;

/** 30 min Bauzeit-Toleranz: ein frischer main-Commit darf noch unterwegs sein. */
const BAUZEIT_TOLERANZ_S = 30 * 60;

function git(...args: string[]): string {
  return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
}

/** true, wenn das Objekt wirklich im Repo liegt.
 *  BEWUSST `cat-file -e` und NICHT `rev-parse --verify`: letzteres liefert bei
 *  einem wohlgeformten 40-Hex-SHA Exit 0, auch wenn das Objekt fehlt — genau die
 *  Falle, die den Ausfall vom 15./16.8. verursacht hat. Der Wächter über den
 *  Fehler darf nicht auf demselben Fehler stehen. */
function objektDa(rev: string): boolean {
  try {
    git('cat-file', '-e', `${rev}^{commit}`);
    return true;
  } catch {
    return false;
  }
}

function istVorfahr(a: string, b: string): boolean {
  try {
    git('merge-base', '--is-ancestor', a, b);
    return true;
  } catch {
    return false;
  }
}

/**
 * Liefert Prod genau den Stand aus, der auf main steht?
 *
 * Drei Schritte: (1) Build-Kennung aus dem <head> der Startseite lesen,
 * (2) prüfen, dass das Repo diesen Commit kennt, (3) den Diff Build↔main auf
 * Nicht-Doku-Pfade prüfen. Grundsatz wie beim ignoreCommand, nur mit umgekehrtem
 * Vorzeichen: bei Unsicherheit ROT, nie still grün.
 */
/** Liest die Build-Kennung aus dem <head> der Startseite; null = Befund schon gesetzt. */
async function leseBuildKennung(): Promise<string | null> {
  try {
    const res = await hole('/');
    if (res.status !== 200) {
      hart(false, 'Prod-Stand', `Startseite Status ${res.status} — Build-Kennung nicht lesbar`);
      return null;
    }
    const treffer = /<meta\s+name="lexmetrik-build"\s+content="([^"]*)"/.exec(await res.text());
    if (!treffer?.[1]) {
      hart(
        false,
        'Prod-Stand',
        'Build-Kennung fehlt — <meta name="lexmetrik-build"> nicht im <head> (Deploy älter als der Meta-Einbau, oder Build übersprungen)',
      );
      return null;
    }
    return treffer[1];
  } catch (e) {
    hart(false, 'Prod-Stand', `Netz-/Timeout-Fehler: ${(e as Error).message}`);
    return null;
  }
}

async function pruefeBuildStand() {
  if (process.env.SMOKE_OHNE_BUILDSTAND === '1') {
    console.log('  (übersprungen) Prod-Stand — SMOKE_OHNE_BUILDSTAND=1 gesetzt (Aufruf ausserhalb eines Repos)\n');
    return;
  }

  // (1) Build-Kennung von der Live-Site.
  const buildSha = await leseBuildKennung();
  if (buildSha === null) return;

  if (buildSha === 'dev') {
    return hart(false, 'Prod-Stand', 'Build-Kennung «dev» — Prod wurde ohne VERCEL_GIT_COMMIT_SHA gebaut');
  }

  // (2) Repo-Seite. Ohne git/Repo ehrlich rot statt still grün — der Workflow
  //     checkt mit fetch-depth: 0 aus, der Fall darf also nicht auftreten.
  let mainRef: string;
  try {
    git('rev-parse', '--git-dir');
    mainRef = objektDa('origin/main') ? 'origin/main' : 'HEAD';
  } catch {
    return hart(false, 'Prod-Stand', 'kein git-Repo / git nicht verfügbar — Stand nicht prüfbar (SMOKE_OHNE_BUILDSTAND=1 zum bewussten Überspringen)');
  }

  if (!objektDa(buildSha)) {
    return hart(
      false,
      'Prod-Stand',
      `unbekannter Build-SHA ${buildSha} — im Repo nicht auffindbar (flacher Klon? fetch-depth: 0 nötig)`,
    );
  }

  const mainSha = git('rev-parse', '--short=8', mainRef);
  if (git('rev-parse', buildSha) === git('rev-parse', mainRef)) {
    return hart(true, 'Prod-Stand', `Build ${buildSha} == ${mainRef} — Prod ist aktuell`);
  }

  if (!istVorfahr(buildSha, mainRef)) {
    return hart(
      false,
      'Prod-Stand',
      `Build ${buildSha} ist kein Vorfahr von ${mainRef} (${mainSha}) — divergenter oder veralteter Repo-Stand (git fetch nötig?)`,
    );
  }

  // (3) Diff Build → main: nur Doku ist folgenlos, alles andere fehlt in Prod.
  const geaendert = git('diff', '--name-only', buildSha, mainRef).split('\n').filter(Boolean);
  const code = geaendert.filter((p) => !NUR_DOKU.test(p));
  if (code.length === 0) {
    return hart(true, 'Prod-Stand', `Build ${buildSha}, ${mainRef} ${mainSha} — Rückstand nur Doku (${geaendert.length} Datei(en), kein Deploy nötig)`);
  }

  // Frische-Toleranz: ein eben gemergter CODE-Commit darf noch bauen. Massgeblich
  // ist der jüngste Commit, der eine der nicht ausgelieferten Code-Dateien
  // berührt — NICHT der jüngste main-Commit: sonst hielte jeder Doku-/Buchungs-
  // Commit kurz vor dem 6-h-Cron den Wächter falsch grün (Bug-Check #531).
  const juengsterCodeCommit = Number(git('log', '-1', '--format=%ct', `${buildSha}..${mainRef}`, '--', ...code));
  const alterS = Math.round(Date.now() / 1000) - juengsterCodeCommit;
  if (alterS < BAUZEIT_TOLERANZ_S) {
    return hart(
      true,
      'Prod-Stand',
      `Build ${buildSha}, ${mainRef} ${mainSha}: ${code.length} Code-Datei(en) offen, jüngster main-Commit erst ${Math.round(alterS / 60)} min alt — Deploy vermutlich unterwegs (< 30 min)`,
    );
  }

  hart(
    false,
    'Prod-Stand',
    `Prod hinkt hinter main: ${code.length} Code-Datei(en) nicht ausgeliefert (Build ${buildSha}, main ${mainSha}, seit ${Math.round(alterS / 60)} min) — z. B. ${code.slice(0, 3).join(', ')}`,
  );
}

async function main() {
  console.log(`Prod-Smoke gegen ${BASE}\n`);
  // Kernrouten (prerendered, öffentlich) — Reihenfolge stabil für lesbare Logs.
  for (const pfad of ['/', '/gesetze', '/rechtsprechung', '/materialien', '/methodik', '/datenschutz']) {
    await pruefeHtmlRoute(pfad);
  }
  // IA-6 Stufe 2 (§11.8 Y-C, 3.8.2026): /international ist keine Seite mehr,
  // sondern ein permanenter Redirect auf die Säule. Genau DAS wird hier geprüft —
  // die vercel-Redirect-Ebene ist die einzige Schicht, die kein Repo-Tor sieht.
  await pruefeRedirect('/international', '/gesetze?ebene=international');
  await pruefeApiSuche();
  await pruefeSitemap();
  await pruefeAsset('/og.png', 'image/');
  await pruefeAsset('/robots.txt', 'text/plain');
  // Je 1 Stichproben-JSON pro Korpus (übernommen aus dem gestrichenen
  // .github/scripts/prod-smoke.sh des Normen-Monitors, Rückbau 5.10.2026 — dort die einzige
  // Deckung, die dieser Smoke noch nicht trug; FAHRPLAN-BASIS-AUSBAU Ist-Korrektur 15.8.2026).
  for (const pfad of ['/normtext/register.json', '/rechtsprechung/register.json', '/rechtsprechung/entscheid-index.json', '/materialien/register.json', '/such-index/artikel.json']) {
    await pruefeAsset(pfad, 'application/json');
  }
  await pruefeCsp();
  await pruefeSoft404();
  // Zuletzt, weil es als einziges die Repo-Seite braucht (QS-AUTOMATIK 16.8.2026).
  await pruefeBuildStand();

  let rot = 0;
  for (const b of befunde) {
    if (!b.ok) rot++;
    console.log(`${b.ok ? '  ok  ' : ' ROT  '} ${b.name} — ${b.detail}`);
  }
  console.log(`\n${befunde.length} Prüfungen · ${rot} rot`);
  if (rot > 0) {
    console.error('\nPROD-SMOKE ROT — Live-Site verletzt einen harten Vertrag.');
    process.exit(1);
  }
  console.log('\nPROD-SMOKE GRÜN.');
  // fetch/undici hält Keep-Alive-Sockets offen → expliziter Exit, sonst hängt
  // der Prozess ~Timeout lang nach dem letzten Log (CI-Job liefe unnötig lange).
  process.exit(0);
}

main().catch((e) => {
  console.error(`PROD-SMOKE ABBRUCH — ${(e as Error).message}`);
  process.exit(1);
});
