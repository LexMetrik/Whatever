// ─── Rechtsprechungs-Wochenlauf (CLI) — .github/workflows/rechtsprechung-wochenlauf.yml
//
//   vite-node scripts/rechtsprechung/wochenlauf.ts -- --datum=YYYY-MM-DD \
//     --aus=<ordner> [--checkpoint] [--stichprobe-n=12]
//
// Fährt die bestehenden Generatoren und Tore der Reihe nach (keine zweite
// Wahrheit, §5) und schreibt nach --aus: bericht.md (PR-Body), commit.txt,
// summary.md (Job-Summary), ergebnis.json. Die reine Logik steht in
// wochenlauf-kern.ts. Exit ≠ 0 nur bei Absturz, oder wenn KEIN Diff entstand
// und dabei eine Quelle ausfiel (sonst sähe ein Totalausfall aus wie «nichts Neues»).
//
// --checkpoint (nur CI, braucht git-Identität): nach jedem erfolgreichen
// Quell-Schritt ein lokaler WIP-Commit; scheitert ein Schritt (Exit ≠ 0), wird
// auf den letzten Checkpoint zurückgesetzt — ein Ausfall einer Quelle bricht
// die anderen nicht ab und hinterlässt keine halben Schreibvorgänge. Am Ende
// `git reset --soft` auf den Start: der Workflow sieht den ganzen Diff.
import { spawn, execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  baenderFuer, vergleicheRegister, erkenneAusfaelle, leseBsDelta, waehleStichprobe, pruefeIdentitaet,
  gruppeVon, entscheide, mergeSchutzSperrt, baueBericht, baueCommit,
  type RegEintrag, type Schritt, type Tor, type StichprobenZeile, type BerichtDaten,
} from './wochenlauf-kern';
import { clirUrl, bgeRefZuClirId } from '../normtext/clir-regeste';

const arg = (n: string) => process.argv.find((a) => a.startsWith(n + '='))?.slice(n.length + 1);
const datum = arg('--datum') ?? '';
const aus = arg('--aus') ?? '';
const checkpoint = process.argv.includes('--checkpoint');
const stichprobeN = Number(arg('--stichprobe-n') ?? '12');
if (!aus) { console.error('--aus=<ordner> fehlt'); process.exit(2); }
const baender = baenderFuer(datum); // wirft bei fehlendem/kaputtem --datum (§2: nie Date.now)

const REGISTER = 'public/rechtsprechung/register.json';
const BS = 'Basel-Stadt (Delta)';
const leseRegister = (): RegEintrag[] => (JSON.parse(readFileSync(REGISTER, 'utf8')) as { entscheide: RegEintrag[] }).entscheide;
const git = (...a: string[]) => execFileSync('git', a, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });

/** Befehl ausführen, Ausgabe live durchreichen UND sammeln. */
function fuehreAus(cmd: string, args: string[], timeoutMin = 90): Promise<{ code: number; log: string; stdout: string }> {
  console.log(`\n::group::${cmd} ${args.join(' ')}`);
  return new Promise((res) => {
    const p = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let log = '';
    let stdout = '';
    const nimm = (b: Buffer, ziel: NodeJS.WriteStream) => { const s = b.toString('utf8'); log += s; ziel.write(s); return s; };
    p.stdout.on('data', (b: Buffer) => { stdout += nimm(b, process.stdout); });
    p.stderr.on('data', (b: Buffer) => nimm(b, process.stderr));
    const t = setTimeout(() => { log += `\nABBRUCH: Zeitlimit ${timeoutMin} min\n`; p.kill('SIGTERM'); }, timeoutMin * 60_000);
    p.on('close', (code) => { clearTimeout(t); console.log('::endgroup::'); res({ code: code ?? 1, log, stdout }); });
  });
}

/** Log des letzten erfolgreichen Quell-Schritts je Name (BS-Delta-Plan liest nur einen gültigen Lauf). */
const quellLogs = new Map<string, string>();

async function schritt(name: string, cmd: string, args: string[], quelle: boolean): Promise<Schritt> {
  const r = await fuehreAus(cmd, args);
  if (quelle && r.code === 0) quellLogs.set(name, r.log);
  const s: Schritt = { name, befehl: `${cmd} ${args.join(' ')}`, code: r.code, ausfaelle: erkenneAusfaelle(r.log) };
  if (quelle && checkpoint) {
    if (r.code === 0) { git('add', '-A'); git('commit', '-q', '--allow-empty', '--no-verify', '-m', `wip: ${name}`); }
    else { git('reset', '-q', '--hard', 'HEAD'); git('clean', '-qfd', '--', 'public', 'daten', 'bibliothek', 'src'); }
  }
  return s;
}

/** Amtliche Seite holen: höflich, 30 s Timeout; nächste URL bei 5xx/Netzfehler (bger.ch → search.bger.ch). */
async function holeSeite(urls: string[]): Promise<{ url: string; html: string } | null> {
  for (const url of urls) {
    for (let i = 0; i < 2; i++) {
      try {
        const r = await fetch(url, { signal: AbortSignal.timeout(30_000), headers: { 'User-Agent': 'LexMetrik/1.0 (+https://lexmetrik.vercel.app; Wochenlauf-Stichprobe)' } });
        if (r.ok) return { url, html: new TextDecoder('iso-8859-1').decode(new Uint8Array(await r.arrayBuffer())) };
        if (r.status < 500) break;
      } catch { /* Netz: nächster Versuch */ }
      await new Promise((ok) => setTimeout(ok, 1500));
    }
  }
  return null;
}

function urlsFuer(e: RegEintrag): string[] {
  if (gruppeVon(e) === 'bge') {
    const id = bgeRefZuClirId(e.bgeReferenz ?? '');
    if (!id) return [];
    const www = clirUrl(id, 'de');
    return [www, www.replace('://www.bger.ch/', '://search.bger.ch/')];
  }
  return e.quelleUrl ? [e.quelleUrl] : [];
}

async function main(): Promise<void> {
  mkdirSync(aus, { recursive: true });
  const D = `--datum=${datum}`;
  const vorher = leseRegister();
  const start = git('rev-parse', 'HEAD').trim();

  const quellen: Schritt[] = [];
  quellen.push(await schritt(`BGE Bd. ${baender.vor}+${baender.lauf}`, 'npm', ['run', 'entscheide', '--', D, '--additiv', `--bge-baender=${baender.vor},${baender.lauf}`], true));
  quellen.push(await schritt(BS, 'npm', ['run', 'entscheide:bs', '--', '--delta', D], true));
  quellen.push(await schritt('Übrige Gerichte (additiv)', 'npm', ['run', 'entscheide', '--', D, '--additiv',
    '--eidg=bvger,bstger,bpatger', '--eidg-pro=5',
    '--courts=zh_obergericht,be_verwaltungsgericht,sg_gerichte,gr_gerichte,ag_gerichte', '--kanton-pro=6'], true));
  if (checkpoint) git('reset', '-q', '--soft', start);

  const vergleich = vergleicheRegister(vorher, leseRegister());
  const bs = leseBsDelta(quellLogs.get(BS) ?? '');
  const snapshotsGeaendert = git('status', '--porcelain', '--', 'public/rechtsprechung/bund', 'public/rechtsprechung/kanton').trim() !== '';
  const inhaltsDiff = vergleich.neu.length + vergleich.entfernt.length + bs.aktualisiert.length > 0 || snapshotsGeaendert;
  const quelleAus = quellen.some((q) => q.code !== 0 || q.ausfaelle.length);

  const nachbau: Schritt[] = [];
  const tore: Tor[] = [];
  const stichprobe: StichprobenZeile[] = [];
  let dateien: string[] = [];
  if (inhaltsDiff) {
    nachbau.push(await schritt('normKeys-Remap (Lehre #1099)', 'npm', ['run', 'entscheide', '--', D, '--remap'], false));
    nachbau.push(await schritt('Projektionen', 'npm', ['run', 'projektionen'], false));
    const reg = await fuehreAus('npx', ['vite-node', 'scripts/bge-register-generieren.ts']);
    if (reg.code === 0) writeFileSync('bibliothek/rechtsprechung/bge-register.md', reg.stdout);
    nachbau.push({ name: 'BGE-Register (bibliothek)', befehl: 'bge-register-generieren.ts', code: reg.code, ausfaelle: [] });
    if ((await fuehreAus('npm', ['run', 'check:datenhaltung'])).code !== 0) {
      nachbau.push(await schritt('Datenhaltungs-Manifest (check:datenhaltung war rot)', 'npm', ['run', 'datenhaltung:manifest'], false));
    }
    for (const t of ['check:entscheide', 'check:bs-entscheide', 'check:normkeys', 'check:paritaet',
      'check:datenhaltung', 'check:bezuege-zaehler', 'check:bezuege']) {
      const r = await fuehreAus('npm', ['run', t]);
      tore.push({ name: t, code: r.code, auszug: r.log.trim().split('\n').slice(-3).join('\n') });
    }
    for (const e of waehleStichprobe(vergleich.neu, stichprobeN)) {
      const seite = await holeSeite(urlsFuer(e));
      if (!seite) { stichprobe.push({ key: e.key, url: urlsFuer(e)[0] ?? null, ergebnis: 'nicht-pruefbar', detail: 'Quelle nicht erreichbar' }); continue; }
      const id = pruefeIdentitaet(seite.html, e);
      stichprobe.push({ key: e.key, url: seite.url, ergebnis: id.treffer === null ? 'nicht-pruefbar' : id.treffer ? 'treffer' : 'fehltreffer', detail: id.detail });
    }
    dateien = git('-c', 'core.quotePath=false', 'status', '--porcelain', '-uall').split('\n').filter(Boolean).map((z) => z.slice(3).split(' -> ').pop()!.replace(/^"|"$/g, ''));
  } else if (checkpoint) {
    git('reset', '-q', '--hard', start); git('clean', '-qfd', '--', 'public', 'daten', 'bibliothek', 'src');
  }

  const sperrt = mergeSchutzSperrt(dateien);
  const ent = entscheide({
    inhaltsDiff, toreRot: tore.filter((t) => t.code !== 0).map((t) => t.name),
    nachbauRot: nachbau.filter((n) => n.code !== 0).map((n) => n.name), stichprobe, mergeSchutzSperrt: sperrt,
  });
  const laufUrl = process.env.GITHUB_RUN_ID
    ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}` : null;
  const daten: BerichtDaten = { datum, baender, quellen, nachbau, vergleich, bs, tore, stichprobe, entscheid: ent, mergeSchutzSperrt: sperrt, laufUrl };
  const bericht = baueBericht(daten);
  writeFileSync(join(aus, 'bericht.md'), bericht);
  writeFileSync(join(aus, 'commit.txt'), baueCommit(daten));
  writeFileSync(join(aus, 'ergebnis.json'), JSON.stringify({ ...ent, neu: vergleich.neu.length, entfernt: vergleich.entfernt.length, quelleAus }, null, 1) + '\n');
  writeFileSync(join(aus, 'summary.md'), ent.entscheid === 'kein-diff'
    ? `## Rechtsprechungs-Wochenlauf ${datum}: keine neuen Entscheide\n\n${quelleAus
      ? `**Achtung — Quellen ausgefallen, «nichts Neues» ist darum nicht belegt:**\n\n${quellen.filter((q) => q.code !== 0 || q.ausfaelle.length).map((q) => `- ${q.name} (Exit ${q.code}): ${q.ausfaelle.slice(0, 5).join(' · ')}`).join('\n')}\n`
      : 'Alle Quellen erreicht, kein Inhalts-Diff — kein PR.\n'}`
    : `## Rechtsprechungs-Wochenlauf ${datum}: ${ent.entscheid === 'entwurf' ? 'PR als ENTWURF (rot)' : 'PR'}\n\n${bericht}`);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `entscheid=${ent.entscheid}\n`);
  console.log(`[wochenlauf] Entscheid: ${ent.entscheid}${ent.gruende.length ? ` — ${ent.gruende.join(' · ')}` : ''}`);
  if (ent.entscheid === 'kein-diff' && quelleAus) process.exitCode = 1;
}

main().catch((e) => { console.error(e); process.exit(1); });
