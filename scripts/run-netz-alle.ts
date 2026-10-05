// scripts/run-netz-alle.ts — Runner der Netz-Tor-Ketten `check:netz` (§17, QS-MONITOR-ROT
// Verfahrens-Gap 1.9.2026; Rückbau MONITOR 5.10.2026).
//
// WARUM ALLE GLIEDER: eine `&&`-Kette bricht beim ersten roten Tor ab — der Normen-Monitor
// zeigte so immer nur EINEN Befund je Lauf (14.8.2026; 24.8./31.8.: Kanonik-Arbiter verdeckte
// alles dahinter). Hier laufen ALLE Glieder nacheinander (Netz-Disziplin: sequentiell, nie
// parallel), jedes mit voller Ausgabe, am Ende die Tafel aller Verdikte.
//
// ZWEI KLASSEN (Entscheid David 5.10.2026: «wichtig ist gesetzestext. der rest muss nicht zu
// einem rot führen.»):
//   • `check:netz:kette`   — GESETZESTEXT: gespeicherter Normtext/Pin weicht von der amtlichen
//     Fassung ab oder ein Zitat zeigt ins Leere. Exit 1 eines Glieds ⇒ check:netz ROT (Exit 1).
//   • `check:netz:bericht` — alles andere (Materialien, Revisionen, Abkürzungen, Sprengel,
//     Tarif, FR/IT, Verfall, LIK). Rot eines Glieds ⇒ ::warning:: + Bericht, NIE Exit 1.
//     Nachgeführt wird über die Bots (normen-monatslauf.yml, fedlex-frische.yml), nicht über
//     einen Alarm.
// EXIT 2 eines Glieds heisst «Quelle nicht erreichbar, keine Aussage» (Konvention der
// Netz-Tore). Ein Gesetzestext-Glied mit Exit 2 wird EINMAL wiederholt; bleibt es bei 2, ist
// das eine sichtbare Warnung, kein Rot — ein Netz-Aussetzer ist kein Rechtsstands-Befund.
//
// Die Tafel geht auf stdout, als Markdown nach $GITHUB_STEP_SUMMARY (Wochenbericht im Lauf)
// und nach $NETZ_TAFEL_DATEI (falls gesetzt; der Alarm-Zettel des Monitors zitiert sie).
// Rot-Beweis: NETZ_KETTE='npm run check:nope-a' NETZ_BERICHT='npm run check:nope-b' ⇒ Exit 1,
// nur nope-a rot; NETZ_KETTE='' NETZ_BERICHT='npm run check:nope-b' ⇒ Exit 0 mit Warnung.

import { spawnSync } from 'node:child_process';
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';

export type Klasse = 'gesetzestext' | 'bericht';
export type Glied = { tor: string; args: string[]; klasse: Klasse };
export type Verdikt = Glied & { exit: number; sekunden: number; versuche: number };

/** Zerlegt eine `npm run a && npm run b -- --x`-Kette in Glieder. */
export function parseKette(roh: string, klasse: Klasse): Glied[] {
  const glieder: Glied[] = [];
  for (const teil of roh.split('&&')) {
    const m = teil.trim().match(/^npm run (\S+)(.*)$/);
    if (m) glieder.push({ tor: m[1], args: m[2].trim().split(/\s+/).filter(Boolean), klasse });
  }
  return glieder;
}

/** Gesamturteil: rot NUR bei Exit 1 (bzw. ≠0, ≠2) eines Gesetzestext-Glieds. */
export function urteil(verdikte: Verdikt[]): { rot: Verdikt[]; warnungen: Verdikt[] } {
  const rot = verdikte.filter((v) => v.klasse === 'gesetzestext' && v.exit !== 0 && v.exit !== 2);
  const warnungen = verdikte.filter((v) => v.exit !== 0 && !rot.includes(v));
  return { rot, warnungen };
}

export function status(v: Verdikt): string {
  if (v.exit === 0) return 'grün';
  if (v.exit === 2) return 'NETZ';
  return v.klasse === 'gesetzestext' ? 'ROT' : 'Bericht';
}

export function tafelMarkdown(verdikte: Verdikt[]): string {
  const zeilen = ['| Prüfung | Klasse | Ergebnis | Exit | Dauer |', '|---|---|---|---|---|'];
  for (const v of verdikte) {
    zeilen.push(`| \`${v.tor}\` | ${v.klasse} | ${status(v)} | ${v.exit}${v.versuche > 1 ? ` (${v.versuche} Versuche)` : ''} | ${v.sekunden}s |`);
  }
  return zeilen.join('\n');
}

function leseKetten(): Glied[] {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> };
  const kette = process.env.NETZ_KETTE ?? pkg.scripts?.['check:netz:kette'];
  const bericht = process.env.NETZ_BERICHT ?? pkg.scripts?.['check:netz:bericht'];
  if (kette === undefined || bericht === undefined) {
    console.error('run-netz-alle: package.json braucht "check:netz:kette" UND "check:netz:bericht".');
    process.exit(1);
  }
  const glieder = [...parseKette(kette, 'gesetzestext'), ...parseKette(bericht, 'bericht')];
  if (glieder.length === 0) {
    console.error('run-netz-alle: keine "npm run …"-Glieder gefunden.');
    process.exit(1);
  }
  return glieder;
}

function fahre(g: Glied): number {
  return spawnSync('npm', ['run', g.tor, ...g.args], { stdio: 'inherit', env: process.env }).status ?? 1;
}

function main(): void {
  const glieder = leseKetten();
  const verdikte: Verdikt[] = [];
  console.log(`check:netz — ${glieder.length} Netz-Tore (${glieder.filter((g) => g.klasse === 'gesetzestext').length} Gesetzestext · Rest Bericht), sequentiell:\n`);
  for (const g of glieder) {
    const start = Date.now();
    console.log(`\n══ ${g.tor}${g.args.length ? ' ' + g.args.join(' ') : ''} [${g.klasse}] ══`);
    let exit = fahre(g);
    let versuche = 1;
    if (exit === 2 && g.klasse === 'gesetzestext') {
      console.log(`\n── ${g.tor}: Exit 2 (Quelle nicht erreichbar) — eine Wiederholung ──`);
      exit = fahre(g);
      versuche = 2;
    }
    verdikte.push({ ...g, exit, versuche, sekunden: Math.round((Date.now() - start) / 1000) });
  }

  const { rot, warnungen } = urteil(verdikte);
  console.log('\n── check:netz — Tafel ───────────────────────────────────────');
  for (const v of verdikte) console.log(`  ${status(v).padEnd(7)} ${v.tor.padEnd(32)} [${v.klasse}] exit ${v.exit}  (${v.sekunden}s)`);
  for (const v of warnungen) {
    const was = v.exit === 2 ? 'Quelle nicht erreichbar — keine Aussage' : 'Abweichung (Bericht, kein Gesetzestext-Rot)';
    console.log(`::warning title=check:netz ${v.tor}::${was} (exit ${v.exit}); Details im Lauf-Log.`);
  }
  const md = `## check:netz — ${rot.length ? `ROT (${rot.length} Gesetzestext-Befund(e))` : 'Gesetzestext grün'}` +
    `${warnungen.length ? ` · ${warnungen.length} Bericht/Netz-Hinweis(e)` : ''}\n\n${tafelMarkdown(verdikte)}\n`;
  try { if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, md); } catch { /* Bericht ist Beiwerk */ }
  try { if (process.env.NETZ_TAFEL_DATEI) writeFileSync(process.env.NETZ_TAFEL_DATEI, md); } catch { /* dito */ }

  if (rot.length) {
    console.error(`\ncheck:netz ROT — Gesetzestext: ${rot.map((v) => v.tor).join(', ')}.`);
    process.exit(1);
  }
  console.log(`\ncheck:netz grün (Gesetzestext) — ${verdikte.length} Tore gefahren, ${warnungen.length} Hinweis(e) im Bericht.`);
}

if (!process.env.VITEST) main();
