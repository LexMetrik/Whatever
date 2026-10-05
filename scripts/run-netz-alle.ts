// scripts/run-netz-alle.ts — Runner der Netz-Tor-Ketten `check:netz` (§17, QS-MONITOR-ROT
// Verfahrens-Gap 1.9.2026; Rückbau MONITOR 5.10.2026).
//
// WARUM ALLE GLIEDER: eine `&&`-Kette bricht beim ersten roten Tor ab — der Normen-Monitor
// zeigte so immer nur EINEN Befund je Lauf (14.8.2026; 24.8./31.8.: Kanonik-Arbiter verdeckte
// alles dahinter). Hier laufen ALLE Glieder nacheinander (Netz-Disziplin: sequentiell, nie
// parallel), jedes mit voller Ausgabe, am Ende die Tafel aller Verdikte.
//
// ZWEI KLASSEN (Entscheid David 5.10.2026: «wichtig ist gesetzestext. der rest muss nicht zu
// einem rot führen.» · später am Tag: «reduziere sonst einfach nur noch auf bund.»):
//   • `check:netz:kette`   — BUNDES-GESETZESTEXT: gespeicherter Bundes-Normtext/Pin weicht von
//     der amtlichen Fassung ab oder ein Zitat zeigt ins Leere (caches · zitate · fedlex-versionen
//     · pdf-netz = EMRK/NYÜ über Fedlex). Exit 1 eines Glieds ⇒ check:netz ROT (Exit 1).
//   • `check:netz:bericht` — alles andere, darunter die KANTONS-Drift `check:normtext-netz`
//     (LexWork, HTM NE/GE/TI, ZH-PDF + Auflöser, kantonale PDFs; ~1300 Erlasse — ein einzelner
//     dauerhaft unerreichbarer Kantonserlass hätte sonst nach zwei Wochen rot gefärbt; Kantone
//     ruhen bis Phase 2). Die Drift wird weiter erkannt (§7 d) und als ::warning:: + Tafelzeile
//     gemeldet, aber nie Exit 1; ihr Exit 2 macht den Lauf nicht unvollständig. Die Offline-
//     Bundteile von check-drift (Fassung/Vollständigkeit/Label) laufen als `check:normtext` im
//     gate. Übrige Bericht-Glieder: Materialien, Revisionen, Abkürzungen, Sprengel, Tarif, FR/IT,
//     Verfall, LIK. Rot eines Bericht-Glieds ⇒ ::warning:: + Bericht, NIE Exit 1.
//     Nachgeführt wird über die Bots (normen-monatslauf.yml, fedlex-frische.yml), nicht über
//     einen Alarm.
// EXIT 2 eines Glieds heisst «Quelle nicht erreichbar, keine Aussage» (Konvention der
// Netz-Tore). Ein Bundes-Gesetzestext-Glied mit Exit 2 wird nach einer Pause (NETZ_PAUSE_S, Default
// 90 s) EINMAL wiederholt; bleibt es bei 2, ist der Lauf UNVOLLSTÄNDIG: Warnung, Tafel-Zeile,
// `netz_unvollstaendig=1` nach $GITHUB_OUTPUT (der Workflow schliesst dann keinen Alarm-Zettel
// und führt den Netz-Zettel `alarm:normen-monitor-netz`). OBERGRENZE (Gegenprüfung 5.10.2026,
// Befund 1 — vorher blieb ein dauerhaft blindes Tor ewig grün): meldet der Workflow per
// NETZ_ZETTEL_OFFEN=1, dass schon der VORIGE Lauf unvollständig war, ist ein erneuter Exit 2
// ROT (Exit 1, `rot_grund=netz`). Dauerhafte Blindheit wird so spätestens im zweiten
// Wochenlauf rot; ein einzelner Netz-Aussetzer bleibt ein Hinweis.
//
// Die Tafel geht auf stdout, als Markdown nach $GITHUB_STEP_SUMMARY (Wochenbericht im Lauf)
// und nach $NETZ_TAFEL_DATEI (falls gesetzt; der Alarm-Zettel des Monitors zitiert sie).
// Rot-Beweis: NETZ_KETTE='npm run check:nope-a' NETZ_BERICHT='npm run check:nope-b' ⇒ Exit 1,
// nur nope-a rot; NETZ_KETTE='' NETZ_BERICHT='npm run check:nope-b' ⇒ Exit 0 mit Warnung.
// Kantons-Rot (5.10.2026): NETZ_KETTE='' NETZ_BERICHT='npm run check:normtext-netz' mit
// rotem/unerreichbarem Kanton ⇒ Exit 0, ::warning::, netz_unvollstaendig=0.
// Netz-Grenze (5.10.2026, fetch-Stub wirft): NETZ_KETTE='npm run check:pdf-netz' NETZ_BERICHT=''
// NETZ_PAUSE_S=0 ⇒ Exit 0 + netz_unvollstaendig=1; dazu NETZ_ZETTEL_OFFEN=1 ⇒ Exit 1.

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

/**
 * Gesamturteil. `rot`: Exit 1 (bzw. ≠0, ≠2) eines Gesetzestext-Glieds. `blind`: Gesetzestext-
 * Glieder, die auch nach der Wiederholung bei Exit 2 blieben (Lauf unvollständig).
 * `netzRot`: blind UND schon der vorige Lauf war unvollständig (Netz-Zettel offen) ⇒ Exit 1.
 */
export function urteil(
  verdikte: Verdikt[],
  netzZettelOffen = false,
): { rot: Verdikt[]; warnungen: Verdikt[]; blind: Verdikt[]; netzRot: boolean } {
  const rot = verdikte.filter((v) => v.klasse === 'gesetzestext' && v.exit !== 0 && v.exit !== 2);
  const warnungen = verdikte.filter((v) => v.exit !== 0 && !rot.includes(v));
  const blind = verdikte.filter((v) => v.klasse === 'gesetzestext' && v.exit === 2);
  return { rot, warnungen, blind, netzRot: blind.length > 0 && netzZettelOffen };
}

/** Zeilen für $GITHUB_OUTPUT — der Workflow steuert damit Zettel-Schliessung und Netz-Zettel. */
export function ausgabeZeilen(u: ReturnType<typeof urteil>): string {
  const grund = u.rot.length ? 'gesetzestext' : u.netzRot ? 'netz' : '';
  return `netz_unvollstaendig=${u.blind.length ? 1 : 0}\nrot_grund=${grund}\n`;
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

/** Synchrone Pause vor der Wiederholung (ein Aussetzer heilt selten in Millisekunden). */
function pause(sekunden: number): void {
  if (sekunden > 0) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, sekunden * 1000);
}

function main(): void {
  const glieder = leseKetten();
  const verdikte: Verdikt[] = [];
  console.log(`check:netz — ${glieder.length} Netz-Tore (${glieder.filter((g) => g.klasse === 'gesetzestext').length} Bundes-Gesetzestext · Rest Bericht inkl. Kantone), sequentiell:\n`);
  for (const g of glieder) {
    const start = Date.now();
    console.log(`\n══ ${g.tor}${g.args.length ? ' ' + g.args.join(' ') : ''} [${g.klasse}] ══`);
    let exit = fahre(g);
    let versuche = 1;
    if (exit === 2 && g.klasse === 'gesetzestext') {
      const s = Number(process.env.NETZ_PAUSE_S ?? 90);
      console.log(`\n── ${g.tor}: Exit 2 (Quelle nicht erreichbar) — Wiederholung nach ${s}s Pause ──`);
      pause(s);
      exit = fahre(g);
      versuche = 2;
    }
    verdikte.push({ ...g, exit, versuche, sekunden: Math.round((Date.now() - start) / 1000) });
  }

  const u = urteil(verdikte, process.env.NETZ_ZETTEL_OFFEN === '1');
  const { rot, warnungen, blind, netzRot } = u;
  console.log('\n── check:netz — Tafel ───────────────────────────────────────');
  for (const v of verdikte) console.log(`  ${status(v).padEnd(7)} ${v.tor.padEnd(32)} [${v.klasse}] exit ${v.exit}  (${v.sekunden}s)`);
  for (const v of warnungen) {
    const was = v.exit === 2 ? 'Quelle nicht erreichbar — keine Aussage' : 'Abweichung (Bericht, kein Bundes-Gesetzestext-Rot)';
    console.log(`::warning title=check:netz ${v.tor}::${was} (exit ${v.exit}); Details im Lauf-Log.`);
  }
  const netzZeile = blind.length
    ? `\n**Lauf unvollständig** — ohne Aussage (Exit 2 nach Wiederholung): ${blind.map((v) => `\`${v.tor}\``).join(', ')}. ` +
      (netzRot ? 'Schon der vorige Lauf war unvollständig ⇒ ROT (Zwei-Wochen-Grenze).\n' : 'Bleibt das im nächsten Lauf so, wird der Monitor rot.\n')
    : '';
  const kopf = rot.length ? `ROT (${rot.length} Bundes-Gesetzestext-Befund(e))` : netzRot ? 'ROT (Bundes-Gesetzestext zwei Läufe in Folge ungeprüft)' : blind.length ? 'Bundes-Gesetzestext UNVOLLSTÄNDIG geprüft' : 'Bundes-Gesetzestext grün';
  const md = `## check:netz — ${kopf}` +
    `${warnungen.length ? ` · ${warnungen.length} Bericht/Netz-Hinweis(e)` : ''}\n${netzZeile}\n${tafelMarkdown(verdikte)}\n`;
  try { if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, md); } catch { /* Bericht ist Beiwerk */ }
  try { if (process.env.NETZ_TAFEL_DATEI) writeFileSync(process.env.NETZ_TAFEL_DATEI, md); } catch { /* dito */ }
  // Steuer-Ausgabe für den Workflow: KEIN stilles Schlucken — ohne sie würde «Bei Grün» einen
  // Zettel schliessen, obwohl der Lauf blind war (§8).
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, ausgabeZeilen(u));

  if (rot.length || netzRot) {
    if (rot.length) console.error(`\ncheck:netz ROT — Bundes-Gesetzestext: ${rot.map((v) => v.tor).join(', ')}.`);
    if (netzRot) console.error(`\ncheck:netz ROT — zweiter Lauf in Folge ohne Aussage: ${blind.map((v) => v.tor).join(', ')} (Netz-Zettel war schon offen).`);
    process.exit(1);
  }
  if (blind.length) console.log(`::warning title=check:netz unvollständig::Bundes-Gesetzestext ohne Aussage: ${blind.map((v) => v.tor).join(', ')} — im nächsten Lauf erneut ⇒ rot.`);
  console.log(`\ncheck:netz grün (Bundes-Gesetzestext${blind.length ? ', UNVOLLSTÄNDIG' : ''}) — ${verdikte.length} Tore gefahren, ${warnungen.length} Hinweis(e) im Bericht.`);
}

if (!process.env.VITEST) main();
