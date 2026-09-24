// scripts/check-merge-schutz.ts — Merge-Tor für Risiko-Pfade (F1, Vorfall PR #309).
//
// Warum ein eigenes Tor: `risikoDiffHash()` liest den WORKING TREE
// (`git status --porcelain`), der zum Merge-Zeitpunkt sauber ist — das
// bestehende Tor ist dort strukturell grün und kann #309 nicht fangen. Dieses
// Tor prüft stattdessen den COMMITTETEN Bereich merge-base(BASIS)..KOPF.
//
// Risiko-Definition bleibt allein `behalten()` aus kern.ts (§5) — hier wird
// nichts neu klassifiziert, nur ein anderer Diff-Bereich eingespeist.
import { execFileSync } from 'node:child_process';
import { behalten } from './gegenpruefung/kern';
import { leseGegenpruefungAusRohLog, pruefeVerdiktForm, vereinigeVerdikte } from './gegenpruefung/squash-trailer';
import { pruefePrSchutz } from './gegenpruefung/pr-schutz';

const BASIS = process.env.MERGE_SCHUTZ_BASIS ?? 'origin/main';
// KOPF = Pruef-Spitze (Default HEAD). Der Merge-Hook setzt hier den
// PR-Head-SHA: geprueft wird der gemergte Stand (§17, 5.9.2026).
const KOPF = process.env.MERGE_SCHUTZ_KOPF ?? 'HEAD';

function git(args: string[]): string {
  return execFileSync('git', args, {
    stdio: ['ignore', 'pipe', 'ignore'],
    maxBuffer: 64 * 1024 * 1024,
  }).toString('utf8');
}

function raus(code: number, text: string): never {
  console.log(text);
  process.exit(code);
}

let basis: string;
try {
  basis = git(['merge-base', BASIS, KOPF]).trim();
} catch {
  // Kein origin/main erreichbar (frischer Clone, detached CI-Checkout) — das
  // Tor wird rot statt still grün (§6 Ziff. 7: kein stiller Skip).
  raus(1, `check:merge-schutz ROT — Referenz '${BASIS}' nicht auflösbar. ` +
    `Erst 'git fetch origin', dann erneut. (Kein stiller Skip: ein Tor ohne ` +
    `Referenz ist kein Tor.)`);
}

const geaendert = git(['diff', '--name-only', `${basis}..${KOPF}`])
  .split('\n')
  .map((z) => z.trim())
  .filter(Boolean);

const risiko = geaendert.filter(behalten);

if (risiko.length === 0) {
  raus(0, `check:merge-schutz grün — kein Risiko-Pfad im committeten Bereich ` +
    `${basis.slice(0, 8)}..${KOPF} (${geaendert.length} Datei(en) geändert).`);
}

// PR-Koerper-Schutz (§17, PRs #921/#923): Queue baut den Squash aus Titel+Body.
const prRot = pruefePrSchutz(process.argv, risiko.length, `${basis.slice(0, 8)}..${KOPF}`);
if (prRot) raus(1, prRot);

// Trailer im committeten Bereich: `%(trailers)` (echte Trailer-Zeilen) plus
// die tolerante Squash-Lesung (Anlass/Details: squash-trailer.ts), VEREINIGT
// UND DEDUPLIZIERT (A1, PR #925 Nachzug): bei einem normalen (Nicht-Queue-)
// Commit finden beide Lesungen denselben Wert — ohne Deduplizierung zählt die
// Grün-Meldung unten das Verdikt doppelt. vereinigeVerdikte() macht das als
// reine, separat getestete Funktion (stabile Reihenfolge, erster Treffer
// gewinnt).
const trailerKlassisch = git(['log', '--format=%(trailers:key=Gegenpruefung,valueonly)', `${basis}..${KOPF}`])
  .split('\n').map((z) => z.trim()).filter(Boolean);
const rohLog = git(['log', '--format=%B%x00', `${basis}..${KOPF}`]);
const trailer = vereinigeVerdikte(trailerKlassisch, leseGegenpruefungAusRohLog(rohLog));

const liste = risiko.slice(0, 12).map((p) => `    ${p}`).join('\n')
  + (risiko.length > 12 ? `\n    … und ${risiko.length - 12} weitere` : '');

const WEG =
  `  Weg: Skill »gegenpruefung« fahren, dann Verdikt als Trailer commiten:\n` +
  `    Gegenpruefung: bestanden (<Modell>, <Linsen>) — <Befunde>\n` +
  `  Beispiel:\n` +
  `    Gegenpruefung: bestanden (Opus 4.8, Extraktion/Identitaet) — 13 Stichproben\n` +
  `    blind gegen die Amtsquelle re-deriviert, 2 Befunde widerlegt und behoben.\n`;

const VORFALL =
  `  Vorfall PR #309 (20.7.2026): 11 erfundene Amtsträger:innen gingen ~1 h auf ` +
  `prod, weil die Merge-Erlaubnis im Bau-Auftrag stand und niemand das Verdikt ` +
  `abwartete.\n`;

if (trailer.length === 0) {
  raus(1,
    `check:merge-schutz ROT — ${risiko.length} Risiko-Datei(en) im committeten ` +
    `Bereich, aber KEIN 'Gegenpruefung:'-Verdikt in den Commits:\n${liste}\n\n` +
    `${VORFALL}\n${WEG}\n` +
    `  Reine Prüflogik ohne Inhaltsänderung: 'Gegenpruefung: n/a — reine Prüflogik' ` +
    `— gilt hier NICHT: reine Prüflogik ist bereits ausgenommen; was trotzdem ` +
    `gelistet ist, ist Risiko-Pfad oder Tor-Pfad (istTorPfad, RL-02 W-02 (b): ` +
    `Änderungen an den Toren selbst verlangen ein Verdikt).`);
}

// ── FORM DES VERDIKTS ────────────────────────────────────────────────────
// Regexe + Prüf-Funktion (F2a-Sabotage-Fund 20.7.2026) in
// ./gegenpruefung/squash-trailer.ts (Import oben) — Verhalten byte-gleich
// zur vorherigen Inline-Fassung, dort testbar ohne git-Nebenwirkungen.
type Mangel = { wert: string; grund: string };
const maengel: Mangel[] = [];
const gueltig: string[] = [];

for (const t of trailer) {
  const p = pruefeVerdiktForm(t);
  if (p.art === 'na') continue;
  if (p.art === 'mangel') {
    maengel.push({ wert: t, grund: p.grund });
    continue;
  }
  gueltig.push(t);
}

if (gueltig.length === 0) {
  const gefunden = maengel.length
    ? `  Gefunden, aber formal untauglich:\n` +
      maengel.map((m) => `    · «${m.wert.slice(0, 90)}»\n      → ${m.grund}`).join('\n') + '\n'
    : `  Nur 'n/a'-Trailer gefunden — die zählen hier nicht.\n`;
  raus(1,
    `check:merge-schutz ROT — ${risiko.length} Risiko-Datei(en) im committeten ` +
    `Bereich, aber KEIN formal taugliches Gegenprüfungs-Verdikt:\n${liste}\n\n` +
    `${gefunden}\n${VORFALL}\n${WEG}`);
}

// ── BINDUNG AN EIN ARTEFAKT ──────────────────────────────────────────────
// Ein formal korrekter Trailer bleibt SELBST-ATTESTIERT: der bauende Agent
// kann ihn schreiben — Behauptung, kein Nachweis. Darum muss zusätzlich das
// Register (bibliothek/register/gegenpruefung-register.md) im selben Bereich
// gewachsen sein: unabhängiges Artefakt (§6 Ziff. 7 lit. a) via
// `npm run gegenpruefung:ok`, das den Nachweis an genau diesen Diff bindet.
const REGISTER = 'bibliothek/register/gegenpruefung-register.md';
const registerDiff = git(['diff', '--numstat', `${basis}..${KOPF}`, '--', REGISTER]).trim();
const zugewachsen = registerDiff
  ? Number(registerDiff.split('\n')[0].split('\t')[0] || 0)
  : 0;

if (zugewachsen === 0) {
  raus(1,
    `check:merge-schutz ROT — Verdikt-Trailer vorhanden, aber ${REGISTER} ` +
    `ist im Bereich ${basis.slice(0, 8)}..${KOPF} NICHT gewachsen.\n\n` +
    `  ${risiko.length} Risiko-Datei(en):\n${liste}\n\n` +
    `  Ein Trailer ist eine BEHAUPTUNG über eine Prüfung, kein Nachweis — der\n` +
    `  bauende Agent kann ihn selbst schreiben (belegt: ein leerer Commit mit\n` +
    `  'Gegenpruefung: x' machte dieses Tor am 20.7.2026 grün). Der Nachweis ist\n` +
    `  der Register-Eintrag mit Diff-Hash, Quelle + Stand und Befunden.\n\n` +
    `  Weg: Skill »gegenpruefung« fahren, dann  npm run gegenpruefung:ok  —\n` +
    `  das schreibt den Eintrag und bindet ihn an genau diesen Diff.`);
}

console.log(
  `check:merge-schutz grün — ${risiko.length} Risiko-Datei(en), ` +
  `${gueltig.length} formal taugliche(s) Verdikt(e), ` +
  `${REGISTER} um ${zugewachsen} Zeile(n) gewachsen.` +
  (maengel.length ? ` (${maengel.length} untauglicher Trailer ignoriert.)` : ''));
