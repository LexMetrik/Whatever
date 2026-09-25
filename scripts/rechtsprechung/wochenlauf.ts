// ─── Rechtsprechungs-Wochenlauf (CLI) — .github/workflows/rechtsprechung-wochenlauf.yml
//
//   vite-node scripts/rechtsprechung/wochenlauf.ts -- --datum=YYYY-MM-DD \
//     --aus=<ordner> [--checkpoint] [--stichprobe-n=12] [--modus=woche|bs-vollabgleich]
//     [--frist-min=160] [--quellen-frist-min=110]
//
// Fährt die bestehenden Generatoren und Tore der Reihe nach (keine zweite
// Wahrheit, §5) und schreibt nach --aus: bericht.md (PR-Body), commit.txt,
// summary.md (Job-Summary), ergebnis.json, pfade.nul (Positivliste zum Stagen,
// NUL-getrennt). Liest <aus>/basis.json von wochenlauf-basis.ts (Aufbau auf
// dem Vorwochen-PR). Die reine Logik steht in wochenlauf-kern.ts, der Bericht
// in wochenlauf-bericht.ts.
//
// EXIT-CODES (Skill korpus-werkstatt, «Wochen-Nachzug prüfen und landen»):
//  0 = kein Diff bei erreichten Quellen, PR bereit ODER Entwurf (Entwurf
//      zusätzlich als ::warning:: und im Summary-Kopf — Punkt 15);
//  1 = Absturz, oder KEIN Diff und dabei eine Quelle ausgefallen (sonst sähe
//      ein Totalausfall aus wie «nichts Neues»; der Wächter meldet es).
//
// FRISTEN (A10, N2): Job-Timeout 185 min. Die Quellen dürfen bis
// --quellen-frist-min laufen (danach werden verbleibende Quellen übersprungen
// und als Ausfall gemeldet); jeder weitere Schritt bekommt min(eigene Kappe,
// Rest bis --frist-min). Stichprobe und Frische fragen vor JEDEM Abruf nach der
// Frist; danach «nicht geprüft» (⇒ Entwurf). Nach der Frist läuft höchstens EIN
// begonnener Abruf zu Ende: Stichprobe ≤ 5 min (OCL-Detail jget 3×45 s + zwei
// URLs × 2 × 30 s), Frische ≤ 1 min. Budget: Setup ≤ 10 + Skript ≤ 160 +
// Überhang ≤ 5 + PR-Schritt ≤ 5 = 180 < 185 — ein Abbruch durch GitHub
// verwürfe alles.
//
// --checkpoint (nur CI, braucht git-Identität): nach jedem erfolgreichen
// Quell-Schritt ein lokaler WIP-Commit; scheitert ein Schritt (Exit ≠ 0), wird
// auf den letzten Checkpoint zurückgesetzt — ein Ausfall einer Quelle bricht
// die anderen nicht ab und hinterlässt keine halben Schreibvorgänge. Am Ende
// `git reset --mixed` auf den Start: Arbeitsbaum = ganzer Diff, Index leer —
// gestagt wird nur die Positivliste (A11).
import { spawn, execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  baenderFuer, vergleicheRegister, erkenneAusfaelle, erkenneGuardBefunde, kantonalAusfall, KANTONSZWEIG_DATEI,
  leseBsDelta, leseBsVoll, entscheide, mergeSchutzSperrt, budgetZeilen, budgetBefund,
  teilePfade, leseStatusZ, zerlegeRunParallel, e2eAuswahl, restMinuten, auszug, uebrigeAufruf, richterPhantome,
  type RegEintrag, type Tor, type StichprobenZeile,
} from './wochenlauf-kern';
import { baueBericht, baueCommit, baueSummary, kuerzeBody, type BerichtDaten, type Schritt, type Modus } from './wochenlauf-bericht';
import { stichprobeZeile, frische } from './wochenlauf-netz';
import {
  stichprobenPlan, pruefeVorwoche, offeneBefunde, vollpruefungOffen, identitaetGeaendert, bsAktualisiertEintraege, mitFrist, ungeprueft, type Vorwoche,
} from './wochenlauf-vorwoche';
import { DATEN_BUDGET, gz } from '../perf/daten-budget';

const arg = (n: string) => process.argv.find((a) => a.startsWith(n + '='))?.slice(n.length + 1);
const datum = arg('--datum') ?? '';
const aus = arg('--aus') ?? '';
const checkpoint = process.argv.includes('--checkpoint');
const stichprobeN = Math.max(12, Number(arg('--stichprobe-n') ?? '12'));
const modus: Modus = arg('--modus') === 'bs-vollabgleich' ? 'bs-vollabgleich' : 'woche';
const fristMin = Number(arg('--frist-min') ?? '160');
const quellenFristMin = Number(arg('--quellen-frist-min') ?? '110');
if (!aus) { console.error('--aus=<ordner> fehlt'); process.exit(2); }
const baender = baenderFuer(datum); // wirft bei fehlendem/kaputtem --datum (§2: nie Date.now in der Erhebung)
const T0 = Date.now(); // nur Betriebsuhr für Fristen, nie in Daten oder Entscheid-Logik
const rest = (kappe: number, frist = fristMin) => Math.min(kappe, restMinuten(T0, Date.now(), frist));
/** Frist offen? Stichprobe und Frische fragen vor JEDEM Abruf (N2). */
const weiter = () => restMinuten(T0, Date.now(), fristMin) > 0;

const REGISTER = 'public/rechtsprechung/register.json';
const BS = 'Basel-Stadt (Delta)';
const UEBRIGE = 'Übrige Gerichte (additiv)';
const git = (...a: string[]) => execFileSync('git', a, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
const regAus = (json: string): RegEintrag[] => (JSON.parse(json) as { entscheide: RegEintrag[] }).entscheide;
const leseRegister = () => regAus(readFileSync(REGISTER, 'utf8'));
const gzJetzt = () => Object.fromEntries(DATEN_BUDGET.map(([p]) => [p, existsSync(p) ? gz(p) : null]));

/** Befehl ausführen, Ausgabe live durchreichen UND sammeln; Zeitlimit in Minuten (≤ 0 ⇒ nicht starten). */
function fuehreAus(cmd: string, args: string[], timeoutMin: number): Promise<{ code: number; log: string; stdout: string }> {
  if (timeoutMin <= 0) return Promise.resolve({ code: 124, log: `übersprungen — Lauf-Frist erreicht (${cmd} ${args.join(' ')})\n`, stdout: '' });
  console.log(`\n::group::${cmd} ${args.join(' ')}`);
  return new Promise((res) => {
    const p = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let log = '';
    let stdout = '';
    const nimm = (b: Buffer, ziel: NodeJS.WriteStream) => { const s = b.toString('utf8'); log += s; ziel.write(s); return s; };
    p.stdout.on('data', (b: Buffer) => { stdout += nimm(b, process.stdout); });
    p.stderr.on('data', (b: Buffer) => nimm(b, process.stderr));
    const t = setTimeout(() => { log += `\nABBRUCH: Zeitlimit ${Math.round(timeoutMin)} min\n`; p.kill('SIGTERM'); }, timeoutMin * 60_000);
    p.on('close', (code) => { clearTimeout(t); console.log('::endgroup::'); res({ code: code ?? 1, log, stdout }); });
  });
}

/** Logs der Quell- und Nachbau-Schritte (Guard-Befunde, BS-Plan). */
const logs = new Map<string, string>();

async function schritt(name: string, cmd: string, args: string[], quelle: boolean, zusatz: (log: string) => string[] = () => []): Promise<Schritt> {
  const r = await fuehreAus(cmd, args, quelle ? rest(90, quellenFristMin) : rest(20));
  logs.set(name, r.log);
  const s: Schritt = { name, befehl: `${cmd} ${args.join(' ')}`, code: r.code, ausfaelle: [...erkenneAusfaelle(r.log), ...zusatz(r.log)] };
  if (quelle && checkpoint) {
    if (r.code === 0) { git('add', '-A'); git('commit', '-q', '--allow-empty', '--no-verify', '-m', `wip: ${name}`); }
    else { git('reset', '-q', '--hard', 'HEAD'); git('clean', '-qfd', '--', 'public', 'daten', 'bibliothek', 'src'); }
  }
  return s;
}

async function tor(name: string, cmd: string, args: string[], kappe: number): Promise<{ t: Tor; log: string }> {
  const r = await fuehreAus(cmd, args, rest(kappe));
  return { t: { name, code: r.code, auszug: auszug(r.log) }, log: r.log };
}

async function main(): Promise<void> {
  mkdirSync(aus, { recursive: true });
  const D = `--datum=${datum}`;
  const basisDatei = join(aus, 'basis.json');
  const b = existsSync(basisDatei) ? JSON.parse(readFileSync(basisDatei, 'utf8')) as { branch?: string; nr?: string; vorwocheVerworfen?: string; vorwoche?: Vorwoche | null } : {};
  const vorwoche = b.vorwoche ?? null;
  const basis = { branch: b.branch || null, nr: b.vorwocheVerworfen ? null : b.nr || null, vorwocheVerworfen: b.vorwocheVerworfen || null };
  const vorherLauf = leseRegister();
  let vorherMain = vorherLauf;
  try { vorherMain = regAus(git('show', `origin/main:${REGISTER}`)); } catch { /* ohne origin/main (lokal): Basis = Laufstart */ }
  const gzVorher = gzJetzt();
  const RICHTER = 'public/rechtsprechung/richter.json';
  const richterAus = (json: string) => (JSON.parse(json) as { richter: Record<string, { name: string }> }).richter;
  let richterVorher = richterAus(readFileSync(RICHTER, 'utf8'));
  try { richterVorher = richterAus(git('show', `origin/main:${RICHTER}`)); } catch { /* lokal ohne origin/main: Laufstart */ }
  const start = git('rev-parse', 'HEAD').trim();

  const quellen: Schritt[] = [];
  if (modus === 'bs-vollabgleich') {
    quellen.push(await schritt('Basel-Stadt (Vollabgleich)', 'npx', ['vite-node', 'scripts/rechtsprechung/wochenlauf-bs-voll.ts', '--', D], true));
  } else {
    quellen.push(await schritt(`BGE Bd. ${baender.vor}+${baender.lauf}`, 'npm', ['run', 'entscheide', '--', D, '--additiv', `--bge-baender=${baender.vor},${baender.lauf}`], true));
    quellen.push(await schritt(BS, 'npm', ['run', 'entscheide:bs', '--', '--delta', D], true));
    // Ausgenommene Gerichte (AUSGENOMMEN, wochenlauf-kern.ts) fehlen hier und stehen im Bericht.
    const u = uebrigeAufruf(datum);
    quellen.push(await schritt(UEBRIGE, 'npm', u.args, true, (log) => kantonalAusfall(existsSync(KANTONSZWEIG_DATEI), u.kantone, log)));
  }
  if (checkpoint) git('reset', '-q', '--mixed', start);

  const jetzt = leseRegister();
  const vergleich = vergleicheRegister(vorherMain, jetzt);
  const woche = vergleicheRegister(vorherLauf, jetzt);
  const bsLog = [...logs].filter(([n]) => n.startsWith('Basel-Stadt')).map(([, l]) => l).join('\n');
  const bs = leseBsDelta(quellen.some((q) => q.name.startsWith('Basel-Stadt') && q.code === 0) ? bsLog : '');
  const snapshotsGeaendert = git('status', '--porcelain', '--', 'public/rechtsprechung/bund', 'public/rechtsprechung/kanton').trim() !== '';
  const inhaltsDiff = woche.neu.length + woche.entfernt.length + bs.aktualisiert.length > 0 || snapshotsGeaendert;
  const quellenAus = quellen.filter((q) => q.code !== 0 || q.ausfaelle.length).map((q) => q.name);

  const nachbau: Schritt[] = [];
  const tore: Tor[] = [];
  const stichprobe: StichprobenZeile[] = [];
  const fristAus: string[] = [];
  const vollOffen: string[] = [];
  let dateien: string[] = [];
  let gzNachher = gzVorher;
  if (inhaltsDiff) {
    nachbau.push(await schritt('normKeys-Remap (Lehre #1099)', 'npm', ['run', 'entscheide', '--', D, '--remap'], false));
    nachbau.push(await schritt('Projektionen', 'npm', ['run', 'projektionen'], false));
    const reg = await fuehreAus('npx', ['vite-node', 'scripts/bge-register-generieren.ts'], rest(10));
    if (reg.code === 0) writeFileSync('bibliothek/rechtsprechung/bge-register.md', reg.stdout);
    nachbau.push({ name: 'BGE-Register (bibliothek)', befehl: 'bge-register-generieren.ts', code: reg.code, ausfaelle: [] });
    if ((await fuehreAus('npm', ['run', 'check:datenhaltung'], rest(10))).code !== 0) {
      nachbau.push(await schritt('Datenhaltungs-Manifest (check:datenhaltung war rot)', 'npm', ['run', 'datenhaltung:manifest'], false));
    }
    // Prüfstrasse = was merge_group fährt (ci.yml Jobs tore/bau/perf/e2e), ohne
    // check:merge-schutz (zwangsläufig rot bis zum Verdikt). `npm run check` ist
    // die Tor-Menge von check:seriell (tor-paritaet hält sie deckungsgleich mit
    // ci.yml); check:gegenpruefung ist darin im Runner ein grüner No-op (CI-Selbstschutz).
    // check:besetzung (in npm run check) erkennt Phantom-Richter nicht (Lehre #1117/#1122).
    const phantome = richterPhantome(richterVorher, richterAus(readFileSync(RICHTER, 'utf8')));
    tore.push({ name: 'Richter-Slugs (Phantom-Prüfung, Lehre #1117)', code: phantome.length ? 1 : 0, auszug: phantome.slice(0, 8).join(' · ') + (phantome.length > 8 ? ` · … +${phantome.length - 8}` : '') });
    tore.push((await tor('npm test', 'npm', ['test'], 20)).t);
    const chk = await fuehreAus('npm', ['run', 'check'], rest(20));
    tore.push(...(chk.code === 0 ? [{ name: 'npm run check (alle Sub-Checks)', code: 0, auszug: '' }] : zerlegeRunParallel(chk.log, chk.code)));
    const bau = await tor('npm run build', 'npm', ['run', 'build'], 15);
    tore.push(bau.t);
    const specs = e2eAuswahl(readdirSync('e2e').map((f) => `e2e/${f}`));
    if (bau.t.code === 0) {
      tore.push((await tor('check:perf-budget', 'npm', ['run', 'check:perf-budget'], 5)).t);
      tore.push((await tor(`e2e (${specs.length} Korpus-Specs)`, 'npx', ['playwright', 'test', ...specs, '--reporter=line'], 30)).t);
    } else {
      for (const n of ['check:perf-budget', `e2e (${specs.length} Korpus-Specs)`]) tore.push({ name: n, code: 1, auszug: 'nicht gefahren — Build rot' });
    }
    gzNachher = gzJetzt();
    // Pool = neu ∪ Identität geändert ∪ BS aktualisiert (N3); Pflicht zusätzlich
    // zu n: jeder Eintrag eines DATUM_VOLLPRUEFUNG-Gerichts (N1) und jeder offene
    // Befund der Vorwoche (A2). Nach der Frist: «nicht geprüft» (N2).
    const pool = [...vergleich.neu, ...identitaetGeaendert(vorherMain, jetzt), ...bsAktualisiertEintraege(bs.aktualisiert, jetzt)];
    const plan = stichprobenPlan(pool, stichprobeN, jetzt, (vorwoche?.befunde ?? []).map((x) => x.key));
    const sp = await mitFrist(plan, weiter, stichprobeZeile, ungeprueft);
    stichprobe.push(...sp.out);
    vollOffen.push(...vollpruefungOffen(plan, sp.out)); // R2: BE nicht prüfbar ⇒ eigener Entwurf-Grund
    if (sp.uebersprungen) fristAus.push(`Stichprobe ${sp.uebersprungen} von ${plan.length}`);
    dateien = leseStatusZ(git('status', '--porcelain', '-z', '-uall'));
  } else if (checkpoint) {
    git('reset', '-q', '--hard', start); git('clean', '-qfd', '--', 'public', 'daten', 'bibliothek', 'src');
  }

  const { erwartet, unerwartet } = teilePfade(dateien);
  writeFileSync(join(aus, 'pfade.nul'), erwartet.map((p) => `${p}\0`).join(''));
  const budget = budgetZeilen(DATEN_BUDGET, gzVorher, gzNachher, erwartet);
  const fri = modus === 'woche' ? await frische(datum, jetzt, weiter) : { zeilen: [], uebersprungen: 0 };
  if (fri.uebersprungen) fristAus.push(`Frische ${fri.uebersprungen} Gerichte`);
  const fr = fri.zeilen;
  const sperrt = mergeSchutzSperrt(erwartet);
  const vw = pruefeVorwoche(vorwoche, stichprobe);
  const ent = entscheide({
    vorwocheOffen: vw.gruende, fristAus, vollpruefungOffen: vollOffen,
    inhaltsDiff, quellenAus, toreRot: tore.filter((t) => t.code !== 0).map((t) => t.name),
    nachbauRot: nachbau.filter((n) => n.code !== 0).map((n) => n.name), stichprobe, mergeSchutzSperrt: sperrt,
    unerwartet, budgetUeber: budgetBefund(budget).ueber, vorwocheVerworfen: basis.vorwocheVerworfen,
  });
  const laufUrl = process.env.GITHUB_RUN_ID
    ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}` : null;
  const daten: BerichtDaten = {
    datum, modus, baender, basis, quellen, nachbau, vergleich, dieseWoche: { neu: woche.neu.length, entfernt: woche.entfernt.length },
    bs, bsVoll: leseBsVoll(bsLog), guards: [...logs.values()].flatMap(erkenneGuardBefunde), tore, stichprobe, budget, frische: fr,
    unerwartet, entscheid: ent, mergeSchutzSperrt: sperrt, laufUrl, befunde: offeneBefunde(stichprobe, vw.offen),
  };
  const bericht = baueBericht(daten);
  // R3: PR-Body < 60 000 Zeichen (GitHub-Grenze 65 536); die Job-Summary trägt den Volltext.
  writeFileSync(join(aus, 'bericht.md'), kuerzeBody(bericht, laufUrl));
  writeFileSync(join(aus, 'commit.txt'), baueCommit(daten));
  writeFileSync(join(aus, 'ergebnis.json'), JSON.stringify({ ...ent, neu: vergleich.neu.length, entfernt: vergleich.entfernt.length, quellenAus, unerwartet }, null, 1) + '\n');
  writeFileSync(join(aus, 'summary.md'), baueSummary(daten, bericht));
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `entscheid=${ent.entscheid}\n`);
  console.log(`[wochenlauf] Entscheid: ${ent.entscheid}${ent.gruende.length ? ` — ${ent.gruende.join(' · ')}` : ''}`);
  if (ent.entscheid === 'entwurf') console.log(`::warning title=Rechtsprechungs-Wochenlauf ${datum}::ENTWURF (rot) — ${ent.gruende.join(' · ')}`);
  if (ent.entscheid === 'kein-diff' && quellenAus.length) {
    console.log(`::warning title=Rechtsprechungs-Wochenlauf ${datum}::kein Diff, aber Quellen ausgefallen: ${quellenAus.join(', ')}`);
    process.exitCode = 1;
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
