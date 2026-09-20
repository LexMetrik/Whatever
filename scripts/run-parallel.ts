/**
 * Paralleler Gate-Runner (Werkzeug-Audit, Nulltarif-Paket §Audit-1).
 *
 * Führt exakt die `check:*`-Sub-Skripte der seriellen Kette (`check:seriell`)
 * gleichzeitig aus (Concurrency ≈ CPU−1) statt seriell verkettet. Der Gewinn ist
 * reines I/O-/Prozess-Overlap: die 20 Sub-Checks sind **alle read-only**
 * (verifiziert 3.7.2026 — nur `check:verfall-ui`/`check:datenhaltung` enthalten
 * überhaupt `writeFileSync`, beide ausschliesslich hinter den NICHT gesetzten
 * Flags `--check`/`--schreibe`), es gibt also keine Schreib-Kollision und keine
 * Reihenfolge-Abhängigkeit zwischen ihnen.
 *
 * §6.1 (kein verstecktes Versagen): Bei JEDEM roten Sub-Check wird dessen VOLLE
 * gepufferte Ausgabe (stdout + stderr) gedruckt und der Runner endet mit Exit 1.
 * Grün: kompakte Zusammenfassung (Name · Dauer), sortiert nach Kettenreihenfolge.
 *
 * §2: kein Date.now in Rechenlogik — die hier gemessene Wanduhr-Dauer ist reine
 * Diagnose-Ausgabe (kein Tor-Verdikt, keine Persistenz).
 *
 * Fallback: `npm run check:seriell` läuft weiterhin die klassische serielle Kette.
 *
 * ─── Tor-Ereignis-Log (Schritt QS-SELBSTOPT, Stufe 1 «erst messen») ──────────
 *
 * Seit 7.8.2026 hinterlässt jeder Sub-Check eine JSONL-Zeile `{ts, tor, ok}` in
 * `.selbstopt-ereignisse.jsonl` (gitignoriert). Damit hat die Messreihe die
 * geforderte Granularität JE `check:*` — und zwar an der Stelle, an der die
 * Tore tatsächlich einzeln laufen.
 *
 * WARUM HIER UND NICHT IN EINEM NEUEN RUNNER FÜR `check:seriell`. Der Auftrag
 * sah vor, die `&&`-Kette von `check:seriell` durch einen eigenen Runner zu
 * ersetzen. Das wäre hier ein Rückschritt gewesen, und zwar aus einem
 * überprüfbaren Grund: `check:seriell` ist im Repo nicht bloss eine Kette,
 * sondern die **Single Source of Truth über die Tor-Menge**. ZWEI Stellen lesen
 * den String und zerlegen ihn per Regex auf `npm run <tor>` —
 * `leseCheckKette()` hier und `seriellTore()` in `scripts/check-tor-paritaet.ts`
 * (Fehlerklasse F2b: friert die Lücke zwischen lokalen und CI-Toren ein). Ein
 * Runner-Aufruf statt der Kette hätte beiden die Datengrundlage entzogen: der
 * Paritäts-Wächter hätte NULL serielle Tore gesehen und wäre still grün
 * geworden — genau die Attrappe, vor der §6.7 warnt, und ausgerechnet an dem
 * Tor, das Blindheit melden soll.
 *
 * Der Umweg über eine zweite Tor-Liste im Runner wäre eine zweite Wahrheit
 * (§5). Also: Kette unverändert, Protokollierung dort, wo der Prozess ohnehin
 * je Tor verzweigt. `npm run gate` fährt `npm run check` und damit diesen
 * Runner — der Alltagspfad ist vollständig abgedeckt. NICHT abgedeckt bleibt
 * der Fallback-Pfad `npm run check:seriell` (die rohe `&&`-Kette): wer ihn
 * direkt fährt, erzeugt keine Ereignisse. Das ist eine bewusst offengelegte
 * Lücke (§8), keine unbemerkte: sie kostet nichts ausser fehlenden Messpunkten,
 * und ein Tor hängt an dieser Zeitreihe ohnehin nie.
 */
/*
 * LEISE BEI GRÜN 5.9.2026 (QS-EFFIZIENZ): Bei Grün nur Kopf- und eine
 * Summenzeile statt 48 Einzelzeilen; volle Liste weiterhin bei CI oder
 * `--verbose`, rote Sub-Checks weiterhin einzeln + mit voller Ausgabe.
 */
import { spawn } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';
import { cpus } from 'node:os';
import { performance } from 'node:perf_hooks';

/**
 * Lokales Ereignis-Log der Tor-Läufe (gitignoriert, je Maschine eigen).
 * Bis 20.9.2026 aus `scripts/plan/selbstoptKern.ts` importiert — mit
 * `retro:17`/`selbstopt:erheben` entfallen (Entscheid David, Rückbau
 * QS-EFFIZIENZ); diese Datei ist seither die einzige Schreibstelle (neben
 * `scripts/gate.sh`, eigenes Literal dort), gelesen von
 * `scripts/analyse/tor-bewaehrung.ts` (Konstante `LOKALES_LOG`, ebenfalls
 * eigenes Literal — zwei Konsumenten teilen sich den Pfad als Wert, nicht als
 * Import, weil kein gemeinsamer Kern mehr existiert).
 */
const EREIGNIS_DATEI = '.selbstopt-ereignisse.jsonl';

interface CheckErgebnis {
  name: string;
  code: number;
  ausgabe: string; // stdout + stderr, in Ankunftsreihenfolge zusammengeführt
  dauerMs: number;
}

/** Liest die Sub-Check-Namen aus `check:seriell` (Single Source of Truth für die
 *  Kette; kein zweites Pflege-Duplikat, §5). Extrahiert jedes `npm run <name>`. */
function leseCheckKette(): string[] {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> };
  const seriell = pkg.scripts?.['check:seriell'];
  if (!seriell) {
    console.error('run-parallel: package.json enthält kein "check:seriell" — Kette unbekannt.');
    process.exit(1);
  }
  const namen: string[] = [];
  for (const teil of seriell.split('&&')) {
    const m = teil.trim().match(/^npm run (\S+)$/);
    if (m) namen.push(m[1]);
  }
  if (namen.length === 0) {
    console.error('run-parallel: keine "npm run check:*"-Glieder in check:seriell gefunden.');
    process.exit(1);
  }
  return namen;
}

/**
 * Ein Tor-Ereignis anhängen. **Kann den Runner nicht rot machen:** ein voller
 * oder schreibgeschützter Baum darf keine Prüfung kosten, und ein Messwert ist
 * nie wichtiger als das Verdikt, das er misst. Deshalb schluckt der `catch`
 * bewusst alles — sichtbar wird der Ausfall trotzdem, weil
 * `scripts/analyse/tor-bewaehrung.ts` ein fehlendes Log als Ausfall vermerkt.
 */
function protokolliere(name: string, ok: boolean): void {
  try {
    appendFileSync(EREIGNIS_DATEI, `${JSON.stringify({ ts: new Date().toISOString(), tor: name, ok })}\n`);
  } catch {
    /* Messung darf das Tor nie kosten. */
  }
}

function laufeCheck(name: string): Promise<CheckErgebnis> {
  return new Promise((resolve) => {
    const start = performance.now();
    // Kein --silent: bei Rot wollen wir die volle npm-Ausgabe (§6.1).
    const kind = spawn('npm', ['run', name], { stdio: ['ignore', 'pipe', 'pipe'] });
    let ausgabe = '';
    kind.stdout.on('data', (d: Buffer) => { ausgabe += d.toString(); });
    kind.stderr.on('data', (d: Buffer) => { ausgabe += d.toString(); });
    kind.on('close', (code) => {
      resolve({ name, code: code ?? 1, ausgabe, dauerMs: performance.now() - start });
    });
    kind.on('error', (err) => {
      ausgabe += `\n[run-parallel] Prozess-Fehler: ${err instanceof Error ? err.message : String(err)}\n`;
      resolve({ name, code: 1, ausgabe, dauerMs: performance.now() - start });
    });
  });
}

async function main(): Promise<void> {
  const kette = leseCheckKette();
  const concurrency = Math.max(1, cpus().length - 1);
  const gesamtStart = performance.now();
  const verbose = Boolean(process.env.CI) || process.argv.includes('--verbose');

  console.log(`run-parallel: ${kette.length} Sub-Checks, Concurrency ${concurrency} (CPU ${cpus().length}) …`);

  // Einfacher Worker-Pool: nächster freier Slot nimmt den nächsten Namen.
  const ergebnisse = new Map<string, CheckErgebnis>();
  let naechster = 0;
  async function worker(): Promise<void> {
    for (;;) {
      const i = naechster++;
      if (i >= kette.length) return;
      const name = kette[i];
      const e = await laufeCheck(name);
      ergebnisse.set(name, e);
      protokolliere(name, e.code === 0);
      // Live-Fortschritt: bei Grün nur mit --verbose/CI (sonst Summenzeile am
      // Ende), rote Zeile immer sichtbar — unabhängig von --verbose/CI.
      if (e.code !== 0 || verbose) {
        const s = (e.dauerMs / 1000).toFixed(1);
        console.log(`${e.code === 0 ? '  ✓' : '  ✗'} ${name.padEnd(28)} ${s.padStart(5)}s`);
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, kette.length) }, () => worker()));

  const gesamtS = ((performance.now() - gesamtStart) / 1000).toFixed(1);

  // Rote Checks in Kettenreihenfolge, mit VOLLER Ausgabe (§6.1).
  const rote = kette.map((n) => ergebnisse.get(n)!).filter((e) => e.code !== 0);
  if (rote.length > 0) {
    for (const e of rote) {
      console.error(`\n${'═'.repeat(72)}\nFEHLER in ${e.name} (Exit ${e.code}) — volle Ausgabe:\n${'═'.repeat(72)}`);
      console.error(e.ausgabe.trimEnd());
    }
    console.error(`\nrun-parallel: ${rote.length}/${kette.length} Sub-Check(s) ROT (${gesamtS}s): ${rote.map((e) => e.name).join(', ')}`);
    process.exit(1);
  }

  const langsamste = kette
    .map((n) => ergebnisse.get(n)!)
    .sort((a, b) => b.dauerMs - a.dauerMs)
    .slice(0, 3)
    .map((e) => `${e.name} ${(e.dauerMs / 1000).toFixed(1)}s`)
    .join(', ');
  console.log(`\nrun-parallel: alle ${kette.length} Sub-Checks GRÜN in ${gesamtS}s — langsamste: ${langsamste}`);
}

main().catch((err) => {
  console.error('run-parallel: unerwarteter Fehler:', err);
  process.exit(1);
});
