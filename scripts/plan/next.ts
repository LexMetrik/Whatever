// scripts/plan/next.ts — CLI über der nebenwirkungsfreien Auflösung (aufloesen.ts).
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { parseRoadmap, ladeChronikDone } from './parse';
import { resolve } from './aufloesen';
import { laufeEcht, lageBlock, sammleAlarme } from './lage';
import { flaechenZeile, klassiere } from './gitFlaechen';
import { sammleFakten } from './gitFlaechenSammeln';
import { leseNotizen, notizenBefund, notizenVerzeichnis, notizenZeilen } from './notizen';
import { postenJeDach, postenScan, postenZeile } from './postenKern';
import {
  flaechenDateien, leseGrenze, leseZeitreihe, summeBytes, trendZeile,
} from '../analyse/steuerflaecheKern';
export { resolve, type Buckets } from './aufloesen';

// CLI
if (!process.env.VITEST) {
  const { einheiten, queue } = parseRoadmap(readFileSync('ROADMAP.md', 'utf8'));
  // Erledigte Schritte dürfen in ROADMAP-CHRONIK.md liegen (Deckel-Entlastung
  // 15.9.2026) — ihre dep-Kanten gelten als erfüllt (sonst «wartet auf dep»).
  const b = resolve(einheiten, queue, ladeChronikDone());
  const z = (s: string) => console.log(s);
  z(`▶ OBERSTER offener Schritt: ${b.readyNow[0] ?? '—'}`);
  // Token-Diät 31.8.2026 (QS-EFFIZIENZ): Zähler statt ready-now-Liste (~-0.5 KB
  // je Aufruf) — jede ID steht schon in den Lanes; Vollform: plan:dump.
  z(`▶ JETZT baubar: ${b.readyNow.length} Schritte — nach Feld gebündelt in den Lanes (Vollliste: plan:dump):`);
  z(`  Parallel-Lanes: ${b.lanes.map((l) => `[${l.join(' + ')}]`).join('  ') || '—'}`);
  if (b.wartetDep.length) z(`⏳ wartet auf dep: ${b.wartetDep.map((x) => `${x.id}→${x.offen.join(',')}`).join(' · ')}`);
  if (b.blockiert.length) z(`⛔ blockiert: ${b.blockiert.map((x) => `${x.id}(${x.blocker})`).join(', ')}`);
  if (b.geparkt.length) z(`🅿️  geparkt: ${b.geparkt.join(', ')}`);
  if (b.inArbeit.length) z(`🔨 in Arbeit (wip): ${b.inArbeit.join(', ')}`);
  // Alarm-Zeile VOR den Warnungen (QS-MONITOR-ROT): gh mit hartem Timeout, Ausfall = Hinweis.
  z(sammleAlarme(laufeEcht));
  // Kollisionswarnung (Steuerungs-Diät 29.8.2026): gleiches Baufeld auf wip.
  // Die F6-Sonden (PRs, Remote-Branches, Worktrees) stehen im Lage-Block.
  for (const x of b.feldBelegt) {
    z(`⚠️  Baufeld «${x.feld}» ist von ${x.durch} (wip) belegt — ${x.id} nur im eigenen Worktree bauen (§12).`);
  }
  // Ab hier nur ANGEHÄNGTE Blöcke (nie dazwischen): zieht man einen ab, ist die
  // Ausgabe darüber byte-identisch zum Stand davor; Ausfall ⇒ still (§8).
  // Lage-Block (QS-PLAN-REVIEW/4a).
  for (const zeile of lageBlock(einheiten, b.inArbeit, { prs: process.argv.includes('--prs') })) z(zeile);
  // Session-Notizen-Befund (Weisung David 15.9.2026). Kein Verzeichnis/keine
  // Datei ⇒ still (kein Gate-Tor, §17-Gegengewicht).
  try {
    const gitCommonDir = execFileSync('git', ['rev-parse', '--git-common-dir'], {
      encoding: 'utf8',
      timeout: 3000,
    }).trim();
    const dateien = leseNotizen(notizenVerzeichnis(gitCommonDir, process.cwd()));
    for (const zeile of notizenZeilen(notizenBefund(dateien))) z(zeile);
  } catch {
    // git nicht verfügbar/kein Repo
  }
  // Posten-Zeile (Posten-Modell 20.9.2026, QS-EFFIZIENZ): ohne sie wären die aus
  // ROADMAP.md herausgelösten Nebenfunde unsichtbar (F17, `check:plan` Regel 16 a).
  const posten = postenZeile(postenJeDach(postenScan()));
  if (posten) z(posten);
  // Steuerungs-Zeile (Sperrklinke 20.9.2026, QS-EFFIZIENZ): einzige laufende
  // Rückmeldung, ob die Steuerung wächst — David wollte KEINEN zusätzlichen
  // Bericht und keine Messung je Session (Entscheid 20.9.2026). Kein Netz, kein
  // git-log-Scan: eine `git ls-files`-Summe plus eine CSV-Zeile.
  try {
    z(trendZeile({
      ist: summeBytes(flaechenDateien()),
      grenze: leseGrenze(),
      reihe: leseZeitreihe(),
      heute: new Date().toISOString().slice(0, 10),
    }));
  } catch {
    // kein Repo / keine messwerte/steuerflaeche.json
  }
  // Git-Flächen-Zeile (21.9.2026, Anlass im Kopf von gitFlaechen.ts). NETZFREI
  // und ohne `gh` — der Pflicht-Einstieg darf nicht am Netz hängen (einzige
  // gh-Ausnahme ohne `--prs`: Alarm-Zeile mit hartem Timeout). Damit ist
  // «gelandet» hier nicht unterscheidbar von «ungelandet»: die Zeile sagt
  // darum ehrlich «zu prüfen» (§8), die Klassierung macht der Befehl.
  // NUR ZÄHLER, keine Namen: die Namen stehen schon im Lage-Block darüber
  // (Bug-Check 21.9.2026, Auflage 5 — keine zweite Liste derselben Sache).
  // Sauberer Zustand ⇒ keine Zeile.
  try {
    const fakten = sammleFakten({ mitGh: false, zaehlen: false, tiefPruefen: false });
    const flaechen = flaechenZeile(klassiere(fakten), false);
    if (flaechen) z(flaechen);
  } catch {
    // git nicht verfügbar/kein Repo
  }
}
