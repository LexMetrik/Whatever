// scripts/plan/next.ts — CLI über der nebenwirkungsfreien Auflösung (aufloesen.ts).
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { parseRoadmap, ladeChronikDone } from './parse';
import { resolve } from './aufloesen';
import { lageBlock } from './lage';
import { leseNotizen, notizenBefund, notizenVerzeichnis, notizenZeilen } from './notizen';
export { resolve, type Buckets } from './aufloesen';

// CLI
if (!process.env.VITEST) {
  const { einheiten, queue } = parseRoadmap(readFileSync('ROADMAP.md', 'utf8'));
  // Erledigte Schritte dürfen in ROADMAP-CHRONIK.md liegen (Deckel-Entlastung
  // 15.9.2026) — ihre dep-Kanten gelten trotzdem als erfüllt. Ohne diese Zeile
  // meldete plan:next jeden Nachfolger eines archivierten Schrittes als
  // «wartet auf dep» und nie als baubar.
  const b = resolve(einheiten, queue, ladeChronikDone());
  const z = (s: string) => console.log(s);
  z(`▶ OBERSTER offener Schritt: ${b.readyNow[0] ?? '—'}`);
  // Token-Diät 31.8.2026 (QS-EFFIZIENZ): die volle ready-now-Aufzählung stand
  // doppelt da — jede ID steht bereits in den Lanes (gruppiert nach Feld, also
  // nützlicher). Diese Ausgabe liest JEDE Session und jeder Station-A-Agent;
  // der Zähler ersetzt die Liste (~-0.5 KB je Aufruf), plan:dump bleibt die
  // Vollform für Maschinenleser.
  z(`▶ JETZT baubar: ${b.readyNow.length} Schritte — nach Feld gebündelt in den Lanes (Vollliste: plan:dump):`);
  z(`  Parallel-Lanes: ${b.lanes.map((l) => `[${l.join(' + ')}]`).join('  ') || '—'}`);
  if (b.wartetDep.length) z(`⏳ wartet auf dep: ${b.wartetDep.map((x) => `${x.id}→${x.offen.join(',')}`).join(' · ')}`);
  if (b.blockiert.length) z(`⛔ blockiert: ${b.blockiert.map((x) => `${x.id}(${x.blocker})`).join(', ')}`);
  if (b.geparkt.length) z(`🅿️  geparkt: ${b.geparkt.join(', ')}`);
  if (b.inArbeit.length) z(`🔨 in Arbeit (wip): ${b.inArbeit.join(', ')}`);
  // Kollisionswarnung (Steuerungs-Diät 29.8.2026): gleiches Baufeld auf wip.
  // Die drei F6-Sonden (offene PRs, Remote-Branches, Worktrees) bleiben — sie
  // stehen im Lage-Block darunter.
  for (const x of b.feldBelegt) {
    z(`⚠️  Baufeld «${x.feld}» ist von ${x.durch} (wip) belegt — ${x.id} nur im eigenen Worktree bauen (§12).`);
  }
  // Lage-Block ANGEHÄNGT (nie dazwischen): zieht man ihn ab, ist die Ausgabe
  // oben byte-identisch zum Stand vor QS-PLAN-REVIEW/4a.
  for (const zeile of lageBlock(einheiten, b.inArbeit, { prs: process.argv.includes('--prs') })) z(zeile);
  // Session-Notizen-Befund NACH dem Lage-Block angehängt (nie dazwischen,
  // Weisung David 15.9.2026): zieht man diesen Block ab, ist die Ausgabe
  // darüber byte-identisch zum Stand vor QS-EFFIZIENZ/Session-Notizen. Kein
  // Verzeichnis/keine Datei ⇒ still (kein Gate-Tor, §17-Gegengewicht).
  try {
    const gitCommonDir = execFileSync('git', ['rev-parse', '--git-common-dir'], {
      encoding: 'utf8',
      timeout: 3000,
    }).trim();
    const dateien = leseNotizen(notizenVerzeichnis(gitCommonDir));
    for (const zeile of notizenZeilen(notizenBefund(dateien))) z(zeile);
  } catch {
    // git nicht verfügbar/kein Repo — Pflicht-Einstieg degradiert still (§8,
    // gleiche Regel wie lage.ts).
  }
}
