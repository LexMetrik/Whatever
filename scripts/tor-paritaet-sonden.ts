// ─── Sonden der Tor-Parität: wer läuft wo? (Mechanik) ───────────────────────
//
// Aus `scripts/check-tor-paritaet.ts` herausgelöst (Steuerungs-Flächendeckel
// `scripts/check-*.ts`, aufraeumen.md §3 — dieselbe Trennlinie wie
// check-verweis-inventar.ts ↔ verweis-inventar-messung.ts):
//
//   · DORT stehen die REGELN und die begründeten Allowlists — was gelten soll.
//   · HIER stehen die SONDEN — wie ermittelt wird, was tatsächlich läuft:
//     Kette, Workflow-Trigger, gate.sh, Fundstellen, und die transitive
//     Deckung über Ketten und kettenlesende Runner.
//
// Ohne Seiteneffekte beim Import (keine Prüfung, kein Exit).

import { readFileSync, readdirSync, existsSync } from 'node:fs';

export const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as {
  scripts: Record<string, string>;
};

export type Deckung = { pr: string[]; waechter: string[] };

/** Tore aus der `check:seriell`-Kette, in Reihenfolge. */
export function seriellTore(): string[] {
  const kette = pkg.scripts['check:seriell'];
  if (!kette) throw new Error('check:seriell fehlt in package.json — Kette umbenannt?');
  return [...kette.matchAll(/npm run (check:[a-z0-9:-]+)/g)].map((m) => m[1]);
}

/**
 * Top-Level-Schlüssel des `on:`-Blocks eines Workflows (Block- und Inline-Form).
 * `null` = kein lesbarer Block — Aufrufer wertet das als ROT, nie stillschweigend
 * als «kein PR-Trigger» (§6.7 lit. b).
 */
export function ereignisse(inhalt: string): Set<string> | null {
  const zeilen = inhalt.split('\n');
  const start = zeilen.findIndex((z) => /^["']?on["']?\s*:/.test(z));
  if (start === -1) return null;

  const rest = zeilen[start].replace(/^["']?on["']?\s*:/, '').replace(/#.*$/, '').trim();
  if (rest) {
    // Inline-Form: `on: push` oder `on: [push, pull_request]`.
    return new Set(rest.replace(/^\[|\]$/g, '').split(',').map((s) => s.trim()).filter(Boolean));
  }

  // Block-Form: alle Kinder auf der GERINGSTEN Einrücktiefe des Blocks. Tiefere
  // Zeilen sind Unterschlüssel (`branches:`, `- cron:`) und keine Ereignisse.
  const block: string[] = [];
  for (const z of zeilen.slice(start + 1)) {
    if (/^\S/.test(z)) break;                 // Spalte 0 ⇒ nächster Top-Level-Schlüssel
    if (!z.trim() || /^\s*#/.test(z)) continue; // Leerzeile / Kommentarzeile
    block.push(z);
  }
  if (!block.length) return new Set();
  const tiefe = Math.min(...block.map((z) => z.length - z.trimStart().length));
  const namen = new Set<string>();
  for (const z of block) {
    if (z.length - z.trimStart().length !== tiefe) continue;
    const m = /^\s*([a-z_]+)\s*:/.exec(z);
    if (m) namen.add(m[1]);
  }
  return namen;
}

/**
 * Tore, die `scripts/gate.sh` im `voll`-Modus tatsächlich AUSFÜHRT — per
 * npm-Alias (`npm run check:<name>`) oder per direktem Skript-Pfad (z. B.
 * check:zh-vollstaendigkeit/zh-randtitel, gebunden über den Pfad aus
 * package.json). Kommentarzeilen zählen nie als Ausführung.
 */
export function gateShAbgedeckt(): Set<string> {
  const inhalt = readFileSync('scripts/gate.sh', 'utf8')
    .split('\n')
    .filter((z) => !/^\s*#/.test(z))
    .join('\n');
  const abgedeckt = new Set<string>();
  for (const m of inhalt.matchAll(/npm run (check:[a-z0-9:-]+)/g)) abgedeckt.add(m[1]);
  for (const [name, cmd] of Object.entries(pkg.scripts)) {
    if (!name.startsWith('check:') || abgedeckt.has(name)) continue;
    const pfad = /(scripts\/\S+\.(?:ts|tsx|mjs|sh))\b/.exec(cmd)?.[1];
    if (pfad && inhalt.includes(pfad)) abgedeckt.add(name);
  }
  return abgedeckt;
}

/** Zeilennummern (1-basiert) in ci.yml, an denen `npm run <tor>` vorkommt —
 *  die «Fundstelle» für die Fehlermeldung von Regel (4). */
export function ciYmlFundstellen(tor: string): number[] {
  const zeilen = readFileSync('.github/workflows/ci.yml', 'utf8').split('\n');
  const treffer: number[] = [];
  const muster = new RegExp(`npm run ${tor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
  zeilen.forEach((z, i) => { if (muster.test(z)) treffer.push(i + 1); });
  return treffer;
}

/** Skript-Pfad → Tor-Name (CI-Pfad-Fallback zu gateShAbgedeckt). */
export function pfadZuTor(): Map<string, string> {
  const abbildung = new Map<string, string>();
  for (const [name, cmd] of Object.entries(pkg.scripts)) {
    if (!name.startsWith('check:')) continue;
    const pfad = /(scripts\/\S+\.(?:ts|tsx|mjs|sh))\b/.exec(cmd)?.[1];
    if (pfad) abbildung.set(pfad, name);
  }
  return abbildung;
}

/** Tore, die ein Workflow aufruft — getrennt nach PR- und Wächter-Deckung (s. Kopf). */
export function ciTore(): { deckung: Map<string, Deckung>; ohneOn: string[] } {
  const deckung = new Map<string, Deckung>();
  const ohneOn: string[] = [];
  const dir = '.github/workflows';
  const pfadAbbildung = pfadZuTor();
  for (const datei of readdirSync(dir)) {
    if (!/\.ya?ml$/.test(datei)) continue;
    const inhalt = readFileSync(`${dir}/${datei}`, 'utf8');
    const ev = ereignisse(inhalt);
    if (ev === null) ohneOn.push(datei);
    const istPr = ev !== null && (ev.has('pull_request') || ev.has('pull_request_target'));
    // Nur echte `run:`-Zeilen zählen — ein Tor, das bloss im Kommentar erwähnt
    // wird, läuft nicht (und hat genau diesen Irrtum schon einmal erzeugt).
    for (const zeile of inhalt.split('\n')) {
      const ohneKommentar = zeile.replace(/^\s*#.*$/, '');
      const vermerken = (tor: string) => {
        const d = deckung.get(tor) ?? { pr: [], waechter: [] };
        const liste = istPr ? d.pr : d.waechter;
        if (!liste.includes(datei)) liste.push(datei);
        deckung.set(tor, d);
      };
      for (const m of ohneKommentar.matchAll(/npm run (check:[a-z0-9:-]+)/g)) vermerken(m[1]);
      // Pfad-Fallback: `vite-node`/`node scripts/x.*` zählt als Tor mit diesem Pfad.
      const pfad = /(?:npx vite-node|node)\s+(scripts\/\S+\.(?:ts|tsx|mjs|sh))\b/.exec(ohneKommentar)?.[1];
      const tor = pfad && pfadAbbildung.get(pfad);
      if (tor) vermerken(tor);
    }
  }
  return { deckung, ohneOn };
}


// ── (6) GRUNDMENGE (SCHÄRFUNG 14.9.2026, Befund B): jedes `check:*`-Skript ──
//     läuft IRGENDWO — in check:seriell, in einer Kette, in einem Workflow oder
//     in gate.sh — oder steht begründet auf ALLOWLIST_UNVERDRAHTET.
//
//     Warum eine eigene Deckungs-Rechnung und nicht `seriell ∪ alleCiPrTore`:
//     Tore erreichen einen Lauf auch INDIREKT, und beides kommt im Repo vor —
//     (a) über eine Kette in package.json (`check:netz:kette` reiht 16 Netz-
//     Tore), (b) über einen Runner, der eine Kette AUSLIEST statt sie
//     aufzurufen (`run-netz-alle.ts` liest 'check:netz:kette', `run-parallel.ts`
//     liest 'check:seriell'). Beide Wege sind echte Läufe; wer sie nicht
//     mitrechnet, erzeugt 16 falsche Rote und damit Druck, die Allowlist zu
//     fluten — das Gegenteil eines scharfen Tors. Der Fixpunkt unten folgt
//     darum beiden Kanten, bis nichts Neues mehr dazukommt.
export const alleCheckSkripte = Object.keys(pkg.scripts)
  .filter((n) => n.startsWith('check:') || n === 'check')
  // `check` und `check:seriell` SIND die Läufe, nicht Tore in einem Lauf.
  .filter((n) => n !== 'check' && n !== 'check:seriell');

const torZuPfad = new Map([...pfadZuTor()].map(([p, t]) => [t, p] as const));
export const irgendwoGedeckt = new Set<string>([...seriellTore(), ...ciTore().deckung.keys(), ...gateShAbgedeckt()]);
for (let geaendert = true; geaendert;) {
  geaendert = false;
  for (const t of [...irgendwoGedeckt]) {
    // (a) Kette in package.json: `npm run check:x && npm run check:y`.
    for (const m of (pkg.scripts[t] ?? '').matchAll(/npm run (check:[a-z0-9:-]+)/g)) {
      if (!irgendwoGedeckt.has(m[1])) { irgendwoGedeckt.add(m[1]); geaendert = true; }
    }
    // (b) Runner, der eine KETTE ausliest statt sie aufzurufen.
    //
    //     Eng gefasst, und zwar aus Schaden: ein Literal zählt nur, wenn das
    //     genannte Skript SELBST eine Kette ist (`npm run check:…` in seinem
    //     Kommando). Sonst deckt jede blosse Nennung — und dieses Tor nennt in
    //     ALLOWLIST_UNVERDRAHTET zwangsläufig genau die Namen, die es melden
    //     soll: es hätte sich seine eigenen drei Befunde weggedeckt (gesehen
    //     14.9.2026 beim Bau). Dieselbe Rekursions-Falle wie 20.7.2026, als das
    //     Tor auf der eigenen Allowlist stand. Der eigene Quelltext ist darum
    //     zusätzlich ausgeschlossen — eine Deckungsquelle, die sich selbst
    //     befragt, ist keine.
    const pfad = torZuPfad.get(t);
    if (!pfad || !existsSync(pfad) || pfad === 'scripts/check-tor-paritaet.ts') continue;
    for (const m of readFileSync(pfad, 'utf8').matchAll(/['"`](check:[a-z0-9:-]+)['"`]/g)) {
      const istKette = /npm run check:/.test(pkg.scripts[m[1]] ?? '');
      if (istKette && !irgendwoGedeckt.has(m[1])) { irgendwoGedeckt.add(m[1]); geaendert = true; }
    }
  }
}

