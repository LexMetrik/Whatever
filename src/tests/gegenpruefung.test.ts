// src/tests/gegenpruefung.test.ts
//
// Tor-Dichte (Design-Spec Z. 104-110) + Kern-Kanten (Panel-Linse 1) +
// Glob-Realitäts-Regressionen (Panel-Linse 2). Läuft gegen echte temporäre
// git-Repos, damit die git-Kanonik (-uall/--no-renames/Platte-Bindung) real geprüft ist.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import {
  risikoDiffHash,
  risikoBereichHash,
  parseBereich,
  behalten,
  istRisikoPfad,
  istPruefLogik,
  istTorPfad,
  RECHTSLOGIK_DATEIEN,
  TOR_DATEIEN,
} from '../../scripts/gegenpruefung/kern';
import { bewerte, bewerteBereich, alsListe } from '../../scripts/check-gegenpruefung';

// ─── git-Test-Helfer ─────────────────────────────────────────────────────────
const angelegt: string[] = [];

function git(cwd: string, ...args: string[]): string {
  return execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
}
function schreib(root: string, pfad: string, inhalt: string): void {
  const abs = join(root, pfad);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, inhalt, 'utf8');
}
function neuesRepo(): string {
  const root = mkdtempSync(join(tmpdir(), 'gp-'));
  angelegt.push(root);
  git(root, 'init', '-q');
  const leer = join(root, '.githooks-leer');
  mkdirSync(leer, { recursive: true });
  git(root, 'config', 'core.hooksPath', leer); // fremde globale Hooks neutralisieren
  git(root, 'config', 'user.email', 't@t.ch');
  git(root, 'config', 'user.name', 'Test');
  git(root, 'config', 'commit.gpgsign', 'false');
  return root;
}
function commitAlles(root: string, msg = 'init'): void {
  git(root, 'add', '-A');
  git(root, 'commit', '-q', '-m', msg);
}
/** Repo mit einer committeten Basis-Datei (damit HEAD existiert). */
function repoMitBasis(): string {
  const root = neuesRepo();
  schreib(root, 'README.md', 'basis\n');
  commitAlles(root);
  return root;
}
const hash = (root: string) => risikoDiffHash({ cwd: root });

// CI-Selbstschutz feuert im Kern über process.env.CI/GITHUB_ACTIONS — für die
// Nicht-CI-Fälle sicher abschalten (die Suite selbst läuft in CI mit CI=true).
let ciBak: string | undefined;
let ghBak: string | undefined;
beforeEach(() => {
  ciBak = process.env.CI;
  ghBak = process.env.GITHUB_ACTIONS;
  delete process.env.CI;
  delete process.env.GITHUB_ACTIONS;
});
afterEach(() => {
  if (ciBak === undefined) delete process.env.CI;
  else process.env.CI = ciBak;
  if (ghBak === undefined) delete process.env.GITHUB_ACTIONS;
  else process.env.GITHUB_ACTIONS = ghBak;
});
afterAll(() => {
  for (const r of angelegt) rmSync(r, { recursive: true, force: true });
});

// ─── Die sechs Tor-Fälle (Spec Z. 104-110) ──────────────────────────────────
describe('Tor check:gegenpruefung — die sechs Fälle', () => {
  it('1) Diff berührt Risiko-Pfad, kein Pending → ROT', () => {
    const root = repoMitBasis();
    schreib(root, 'src/lib/tarif/x.ts', 'export const a = 1;\n');
    const r = hash(root);
    expect(r.kontext).toBe(true);
    expect(r.hash).not.toBeNull();
    expect(r.dateien).toContain('src/lib/tarif/x.ts');
    expect(bewerte(r, null).gruen).toBe(false);
  });

  it('2) Pending mit passendem Hash + bestanden → GRÜN', () => {
    const root = repoMitBasis();
    schreib(root, 'src/lib/tarif/x.ts', 'export const a = 1;\n');
    const r = hash(root);
    const ok = bewerte(r, { hash: r.hash!, verdikt: 'bestanden' });
    expect(ok.gruen).toBe(true);
  });

  it('3) Datei nach Quittung geändert (Hash-Mismatch) → ROT', () => {
    const root = repoMitBasis();
    schreib(root, 'src/lib/tarif/x.ts', 'export const a = 1;\n');
    const r1 = hash(root);
    const pending = { hash: r1.hash!, verdikt: 'bestanden' };
    schreib(root, 'src/lib/tarif/x.ts', 'export const a = 2;\n'); // Byte-Änderung
    const r2 = hash(root);
    expect(r2.hash).not.toBe(r1.hash);
    expect(bewerte(r2, pending).gruen).toBe(false);
  });

  it('4) Nur *.test.ts / Prüfskript geändert → GRÜN (Auto-Ausnahme)', () => {
    const root = repoMitBasis();
    schreib(root, 'src/lib/tarif/x.test.ts', 'it("x", () => {});\n');
    schreib(root, 'scripts/normtext/check-foo.ts', 'export const c = 1;\n');
    const r = hash(root);
    expect(r.hash).toBeNull();
    expect(bewerte(r, null).gruen).toBe(true);
  });

  it('5) Nichts Riskantes geändert → GRÜN', () => {
    const root = repoMitBasis();
    schreib(root, 'src/components/Foo.tsx', 'export const Foo = () => null;\n');
    const r = hash(root);
    expect(r.hash).toBeNull();
    expect(bewerte(r, null).gruen).toBe(true);
  });

  it('6) CI-Env → GRÜN (no-op)', () => {
    const root = repoMitBasis();
    schreib(root, 'src/lib/tarif/x.ts', 'export const a = 1;\n');
    process.env.CI = 'true';
    const r = hash(root);
    expect(r.kontext).toBe(false);
    expect(bewerte(r, null).gruen).toBe(true);
  });
});

// ─── bewerte: Verdikt ≠ bestanden ────────────────────────────────────────────
describe('bewerte', () => {
  it('Verdikt «widerlegt» trotz passendem Hash → ROT', () => {
    const root = repoMitBasis();
    schreib(root, 'src/lib/tarif/x.ts', 'export const a = 1;\n');
    const r = hash(root);
    expect(bewerte(r, { hash: r.hash!, verdikt: 'widerlegt' }).gruen).toBe(false);
  });
});

// ─── Glob-Realität (Panel-Linse 2) ──────────────────────────────────────────
describe('Risiko-/Prüflogik-Prädikate', () => {
  it('Rechnen-Engines: nur die Stichwort-Basenames, keine Über-Triggerung', () => {
    expect(istRisikoPfad('src/lib/verjaehrung.ts')).toBe(true);
    expect(istRisikoPfad('src/lib/streitwert.ts')).toBe(true);
    expect(istRisikoPfad('src/lib/schkgFristen.ts')).toBe(true);
    // Gegenprobe: kein Match für irrelevante top-level src/lib-Dateien
    expect(istRisikoPfad('src/lib/kantone.ts')).toBe(false);
    expect(istRisikoPfad('src/lib/bruch.ts')).toBe(false);
    // Rekursion in Unterordner nicht über die Rechnen-Regel (separat als Präfix)
    expect(istRisikoPfad('src/lib/pdf/frist-helfer.ts')).toBe(false);
  });

  it('Fassaden-Splits: der Logik-Ordner bleibt Risiko, nicht nur die Fassade (§6.7)', () => {
    // Rot-Beweis 4.8.2026: vor dem Ordner-Zweig war erstinstanz.ts false — der Split
    // hätte die Rechenlogik still aus der Risiko-Klassifikation genommen.
    expect(istRisikoPfad('src/lib/zustaendigkeit.ts')).toBe(true);
    expect(istRisikoPfad('src/lib/zustaendigkeit/erstinstanz.ts')).toBe(true);
    expect(istRisikoPfad('src/lib/zustaendigkeit/rechtsmittel.ts')).toBe(true);
    expect(istRisikoPfad('src/lib/zustaendigkeit/gemeinsam.ts')).toBe(true);
  });

  it('Extraktion: verschachtelte public/normtext-Snapshots werden erfasst', () => {
    expect(istRisikoPfad('public/normtext/bund/OR.json')).toBe(true);
    expect(istRisikoPfad('public/normtext/struktur/bund/OR.json')).toBe(true);
    expect(istRisikoPfad('public/normtext/register.json')).toBe(true);
    expect(istRisikoPfad('public/normtext/liesmich.md')).toBe(false); // nur .json
  });

  it('Verzeichnis-Präfixe', () => {
    expect(istRisikoPfad('src/lib/tarif/staffel.ts')).toBe(true);
    expect(istRisikoPfad('src/lib/fristenspiegel/x.ts')).toBe(true);
    expect(istRisikoPfad('src/data/tarif/gerichtskosten.ts')).toBe(true);
    expect(istRisikoPfad('src/lib/vorlagen/arbeitsvertrag.ts')).toBe(true);
    expect(istRisikoPfad('scripts/normtext/pdf-fetch.ts')).toBe(true);
    expect(istRisikoPfad('src/lib/normtext/adapter.ts')).toBe(true);
    // QS-DATA E1: Datenhaltungs-Schicht + DB-Artefakt-Manifest = Risiko-Pfad.
    expect(istRisikoPfad('scripts/datenhaltung/erlass-rows.ts')).toBe(true);
    expect(istRisikoPfad('scripts/normtext-snapshot.ts')).toBe(true);
    expect(istRisikoPfad('daten/normtext.db')).toBe(true);
    expect(istRisikoPfad('daten-manifest.json')).toBe(true);
    // E6a Stufe 1: Materialien-Adapter/Projektion + committete Projektionen = Risiko-Pfad.
    expect(istRisikoPfad('scripts/materialien/soft-law-projektion.ts')).toBe(true);
    expect(istRisikoPfad('public/materialien/register.json')).toBe(true);
    expect(istRisikoPfad('public/materialien/kanten/MWSTG.json')).toBe(true);
    expect(istRisikoPfad('public/materialien/kanten/MWSTG/1.json')).toBe(true);
    // W2·6c-E3: die Entstehungs-Projektion sagt am Artikel «diese Änderung geht
    // auf jene Botschaft zurück» (Rot-Beweis 11.9.2026: ohne die kern.ts-Zeile
    // liefert dieselbe Abfrage false).
    expect(istRisikoPfad('public/materialien/entstehung/OR.json')).toBe(true);
    // public/materialien nur EINE Ebene für nackte *.json (kanten/** separat als Präfix)
    expect(istRisikoPfad('public/materialien/liesmich.md')).toBe(false);
  });

  it('Prüflogik-Ausnahme sticht das Risiko (Set-Subtraktion)', () => {
    expect(istPruefLogik('src/tests/foo.test.ts')).toBe(true);
    expect(istPruefLogik('scripts/normtext/check-drift.ts')).toBe(true);
    expect(istPruefLogik('scripts/gegenpruefung/kern.ts')).toBe(true);
    expect(istPruefLogik('scripts/gate.sh')).toBe(true);
    // behalten = Risiko UND nicht Prüflogik
    expect(behalten('scripts/normtext/check-drift.ts')).toBe(false); // Risiko, aber Check
    expect(behalten('scripts/normtext/pdf-fetch.ts')).toBe(true); // echter Extraktions-Generator
    expect(behalten('src/lib/tarif/x.test.ts')).toBe(false);
    // QS-DATA: check-*.ts der Datenhaltung = Prüflogik (raus); die Bau-/Projektions-Module bleiben.
    expect(istPruefLogik('scripts/datenhaltung/check-datenhaltung.ts')).toBe(true);
    expect(behalten('scripts/datenhaltung/check-datenhaltung.ts')).toBe(false);
    expect(behalten('scripts/datenhaltung/erlass-rows.ts')).toBe(true);
    // E6a Stufe 1: check-materialien = Prüflogik (raus); Projektion/Register bleiben.
    expect(istPruefLogik('scripts/materialien/check-materialien.ts')).toBe(true);
    expect(behalten('scripts/materialien/check-materialien.ts')).toBe(false);
    expect(behalten('scripts/materialien/soft-law-projektion.ts')).toBe(true);
    expect(behalten('public/materialien/register.json')).toBe(true);
    expect(behalten('public/materialien/kanten/MWSTG/1.json')).toBe(true);
  });

  // ANLASS: Prüfung Rechtslogik 23.9.2026, Befund S1-01 (RL-02, W2·30-RL-W0).
  // Gemessen vor RL-02: behalten()=false für die Engines, an denen die schweren
  // Rechtsfehler sitzen (mietrecht F4-01, gewaehrleistung F5-05, erbteilung
  // B3-01, verzugszins S3-a …) — ihre Fixes wären ohne Zweitblick gelandet.
  it('RL-02 A: Rechtslogik-Engines ausserhalb RECHNEN_RE sind Risiko (explizite Liste)', () => {
    for (const p of [
      'src/lib/verzugszins.ts',
      'src/lib/lohnfortzahlung.ts',
      'src/lib/erbteilung.ts',
      'src/lib/mietrecht.ts',
      'src/lib/gewaehrleistung.ts',
      'src/lib/teuerung.ts',
      'src/lib/datumsUtils.ts',
      'src/lib/emissionsabgabe.ts',
      'src/lib/notariatGrundbuch.ts',
      'src/lib/notariate.ts',
      'src/lib/vdSchlichtung.ts',
      'src/lib/zpoPresets.ts',
      'src/lib/famStatusPresets.ts',
      'src/lib/presetIndex.ts',
      'src/lib/gerichtszitat.ts',
    ]) {
      expect(behalten(p), p).toBe(true);
    }
  });

  it('RL-02 A: Rechen-Stammdaten und Zuständigkeitsregeln in src/data sind Risiko', () => {
    for (const p of [
      'src/data/zpoFeiertage.ts',
      'src/data/schkgFeiertage.ts',
      'src/data/lohnfortzahlungSkalen.ts',
      'src/data/likReihe.ts',
      'src/data/mietTermine.ts',
      'src/data/zustaendigkeitKosten.ts',
      'src/data/zustaendigkeitKantone.ts',
      'src/data/zustaendigkeit/beSprengel.json',
    ]) {
      expect(behalten(p), p).toBe(true);
    }
  });

  it('RL-02 A: Rechtsprechungs-Bezüge, Katalogtexte mit Statusaussagen, Rechtshinweis-Seite', () => {
    expect(behalten('src/lib/rechtsprechung/bezuege.ts')).toBe(true);
    expect(behalten('public/rechtsprechung/bezuege/OR.json')).toBe(true);
    expect(behalten('src/lib/startseiteKarten.ts')).toBe(true);
    expect(behalten('src/lib/startseiteKartenAusbau.ts')).toBe(true);
    expect(behalten('src/lib/startseiteKartenBetraegeWerkzeuge.ts')).toBe(true);
    expect(behalten('src/lib/startseiteVorlagen.ts')).toBe(true);
    expect(behalten('src/lib/startseiteVorlagenAusbau.ts')).toBe(true);
    expect(behalten('src/lib/startseiteVorlagenEingabenGesellschaft.ts')).toBe(true);
    expect(behalten('src/lib/startseiteVorlagenVorsorgeVertraege.ts')).toBe(true);
    expect(behalten('src/pages/VorlageVerjaehrungsverzicht.tsx')).toBe(true);
  });

  it('RL-02 A Gegenprobe: Nicht-Engines, PDF-Render, Adressdaten, andere Seiten, Tests bleiben frei', () => {
    expect(behalten('src/lib/kantone.ts')).toBe(false);
    expect(behalten('src/lib/bruch.ts')).toBe(false);
    expect(behalten('src/lib/pdf/pdfRender.ts')).toBe(false); // rendert nur das Assemble-Ergebnis (§5)
    expect(behalten('src/data/zivilgerichteErstinstanz.ts')).toBe(false); // Adressen, W-03 offen
    expect(behalten('src/data/betreibungsaemter.ts')).toBe(false);
    expect(behalten('src/data/handelsregisteraemter.ts')).toBe(false);
    expect(behalten('src/data/obereInstanzen.ts')).toBe(false);
    expect(behalten('src/data/schlichtungsstellen.ts')).toBe(false);
    expect(behalten('src/pages/VorlageMietvertrag.tsx')).toBe(false); // kein Glob über src/pages/**
    expect(behalten('src/tests/mietrecht.test.ts')).toBe(false);
    expect(behalten('src/lib/startseiteModule.tsx')).toBe(false); // nur Karten-/Vorlagen-Katalogtexte
  });

  // ANLASS: Prüfung Rechtslogik 23.9.2026, Entscheid David W-02 (b) «Ja, in
  // Welle 0 mitbauen»: eine Aufweichung eines Tors fiel bisher durch kein Tor,
  // weil istPruefLogik() die Tore selbst ausnahm.
  it('RL-02 B: Tor-Pfade sind gegenprüfungspflichtig, obwohl Prüflogik', () => {
    for (const p of [
      'scripts/gegenpruefung/kern.ts',
      'scripts/gegenpruefung/squash-trailer.ts',
      'scripts/gegenpruefung-ok.ts',
      'scripts/check-gegenpruefung.ts',
      'scripts/check-merge-schutz.ts',
      '.github/workflows/ci.yml',
      'scripts/gate.sh',
      'scripts/golden-outputs.ts',
      'golden/lexmetrik-golden.json',
      'scripts/analyse/test-assertion-diff.ts',
      'scripts/check-fachaenderung.ts',
      'scripts/analyse/fachaenderung-kern.ts',
    ]) {
      expect(istTorPfad(p), p).toBe(true);
      expect(behalten(p), p).toBe(true);
    }
    // Prüflogik-Eigenschaft bleibt unverändert — nur behalten() kombiniert neu.
    expect(istPruefLogik('scripts/gegenpruefung/kern.ts')).toBe(true);
  });

  it('RL-02 B Gegenprobe: Tests und übrige check-Skripte sind kein Tor-Pfad', () => {
    expect(istTorPfad('src/tests/gegenpruefung.test.ts')).toBe(false);
    expect(istTorPfad('scripts/gegenpruefung/kern.test.ts')).toBe(false);
    expect(behalten('scripts/gegenpruefung/kern.test.ts')).toBe(false);
    expect(behalten('scripts/normtext/check-drift.ts')).toBe(false);
    expect(behalten('.github/workflows/fedlex-frische.yml')).toBe(false);
    expect(behalten('golden/anderes.json')).toBe(false);
  });

  // §6.7: eine explizite Liste verliert still ihre Wirkung, wenn eine Datei
  // umbenannt wird — das Prädikat träfe dann ins Leere. Dieser Test macht das rot.
  it('RL-02: jede Datei der expliziten Listen existiert im Baum', () => {
    const wurzel = join(__dirname, '..', '..');
    const fehlend = [...RECHTSLOGIK_DATEIEN, ...TOR_DATEIEN].filter((p) => !existsSync(join(wurzel, p)));
    expect(fehlend).toEqual([]);
    expect(RECHTSLOGIK_DATEIEN.length).toBeGreaterThan(20);
    expect(TOR_DATEIEN.length).toBeGreaterThan(5);
    // Katalogtext-Familie (Muster statt Liste): der Baum trägt sie wirklich.
    const katalog = readdirSync(join(wurzel, 'src/lib'))
      .map((b) => `src/lib/${b}`)
      .filter((p) => /^src\/lib\/startseite(Karten|Vorlagen)[A-Za-z]*\.ts$/.test(p));
    expect(katalog.length).toBeGreaterThanOrEqual(8);
    for (const p of katalog) expect(behalten(p), p).toBe(true);
    // Bezüge-Shards: mindestens einer existiert und ist erfasst.
    const shards = readdirSync(join(wurzel, 'public/rechtsprechung/bezuege')).filter((b) => b.endsWith('.json'));
    expect(shards.length).toBeGreaterThan(0);
    expect(behalten(`public/rechtsprechung/bezuege/${shards[0]}`)).toBe(true);
  });
});

// ─── Regression (Panel-Linse 2, im echten Repo) ──────────────────────────────
describe('Glob-Regressionen im Repo', () => {
  it('(a) Änderung an src/lib/kantone.ts → GRÜN (keine Über-Triggerung)', () => {
    const root = repoMitBasis();
    schreib(root, 'src/lib/kantone.ts', 'export const k = 1;\n');
    expect(hash(root).hash).toBeNull();
  });

  it('(b) verschachteltes public/normtext/bund/*.json ohne Pending → ROT', () => {
    const root = repoMitBasis();
    schreib(root, 'public/normtext/bund/OR.json', '{"a":1}\n');
    const r = hash(root);
    expect(r.hash).not.toBeNull();
    expect(r.dateien).toContain('public/normtext/bund/OR.json');
    expect(bewerte(r, null).gruen).toBe(false);
  });
});

// ─── Kern-Kanten (Panel-Linse 1) ─────────────────────────────────────────────
describe('Kern-Kanten der Diff-Hash-Kanonik', () => {
  it('untracked-Ordner wird durch -uall zu Einzeldateien expandiert', () => {
    const root = repoMitBasis();
    schreib(root, 'public/normtext/neu/one.json', '{"a":1}\n');
    schreib(root, 'public/normtext/neu/two.json', '{"b":2}\n');
    const r = hash(root);
    expect(r.dateien).toContain('public/normtext/neu/one.json');
    expect(r.dateien).toContain('public/normtext/neu/two.json');
  });

  it('Rename zerfällt mit --no-renames in gelöscht + neu (Einzel-Pfade)', () => {
    const root = repoMitBasis();
    schreib(root, 'src/lib/tarif/alt.ts', 'export const a = 1;\n');
    commitAlles(root, 'add alt');
    git(root, 'mv', 'src/lib/tarif/alt.ts', 'src/lib/tarif/neu.ts');
    const r = hash(root);
    expect(r.dateien).toContain('src/lib/tarif/alt.ts'); // Lösch-Marker
    expect(r.dateien).toContain('src/lib/tarif/neu.ts'); // Inhalts-Hash
  });

  it('leere Datei ≠ gelöschte Datei (unterschiedliche Hashes)', () => {
    const rootLeer = neuesRepo();
    schreib(rootLeer, 'src/lib/tarif/x.ts', 'inhalt\n');
    commitAlles(rootLeer);
    schreib(rootLeer, 'src/lib/tarif/x.ts', ''); // jetzt leer, existiert
    const hLeer = hash(rootLeer).hash;

    const rootDel = neuesRepo();
    schreib(rootDel, 'src/lib/tarif/x.ts', 'inhalt\n');
    commitAlles(rootDel);
    rmSync(join(rootDel, 'src/lib/tarif/x.ts')); // gelöscht
    const hDel = hash(rootDel).hash;

    expect(hLeer).not.toBeNull();
    expect(hDel).not.toBeNull();
    expect(hLeer).not.toBe(hDel);
  });

  it('Unicode-/Leerzeichen-Pfad wird roh gebunden', () => {
    const root = repoMitBasis();
    schreib(root, 'src/lib/tarif/mit leer é.ts', 'export const a = 1;\n');
    const r = hash(root);
    expect(r.kontext).toBe(true);
    expect(r.hash).not.toBeNull();
    expect(r.dateien).toContain('src/lib/tarif/mit leer é.ts');
  });

  it('MM bindet die Platte, nicht den Index-Blob', () => {
    // staged 'A', dann unstaged 'B' obendrauf → Platte = 'B'
    const rootMM = neuesRepo();
    schreib(rootMM, 'src/lib/tarif/x.ts', 'v0\n');
    commitAlles(rootMM);
    schreib(rootMM, 'src/lib/tarif/x.ts', 'A\n');
    git(rootMM, 'add', 'src/lib/tarif/x.ts');
    schreib(rootMM, 'src/lib/tarif/x.ts', 'B\n'); // nur Platte
    const hMM = hash(rootMM).hash;

    // Vergleich: dieselbe Platte 'B', aber nur unstaged (kein Index-Divergenz)
    const rootM = neuesRepo();
    schreib(rootM, 'src/lib/tarif/x.ts', 'v0\n');
    commitAlles(rootM);
    schreib(rootM, 'src/lib/tarif/x.ts', 'B\n');
    const hM = hash(rootM).hash;

    expect(hMM).toBe(hM); // Hash folgt der Platte, nicht dem Staging
  });

  it('Sortier-Stabilität: Erscheinungsreihenfolge egal', () => {
    const rootAB = repoMitBasis();
    schreib(rootAB, 'src/lib/tarif/a.ts', 'x\n');
    schreib(rootAB, 'src/lib/tarif/b.ts', 'y\n');
    const hAB = hash(rootAB).hash;

    const rootBA = repoMitBasis();
    schreib(rootBA, 'src/lib/tarif/b.ts', 'y\n');
    schreib(rootBA, 'src/lib/tarif/a.ts', 'x\n');
    const hBA = hash(rootBA).hash;

    expect(hAB).toBe(hBA);
  });

  it('kein HEAD (Repo ohne Commit) → kontext:false (no-op grün)', () => {
    const root = neuesRepo(); // KEIN commit
    schreib(root, 'src/lib/tarif/x.ts', 'export const a = 1;\n');
    const r = hash(root);
    expect(r.kontext).toBe(false);
    expect(bewerte(r, null).gruen).toBe(true);
  });

  it('Staging-neutral: git add nach der Quittung lässt den Hash unverändert', () => {
    const root = repoMitBasis();
    schreib(root, 'src/lib/tarif/x.ts', 'export const a = 1;\n');
    const vorher = hash(root).hash;
    git(root, 'add', 'src/lib/tarif/x.ts'); // nur Staging, kein Byte
    const nachher = hash(root).hash;
    expect(nachher).toBe(vorher);
  });
});

// ─── Zweiter Eingang: committeter Bereich (QS-GP-BEREICH, 8.8.2026) ─────────
//
// VORHER-BEWEIS (§6.7, im echten Repo geführt, 8.8.2026): eine committete
// Änderung an `src/lib/tarif/rotbeweis-tmp.ts` bei SAUBEREM Baum ergab
//   check:gegenpruefung → «grün — keine Risiko-Datei … im Working-Tree geändert» (Exit 0)
//   gegenpruefung:ok    → «keine Risiko-Datei im Working-Tree geändert — nichts
//                          zu quittieren» (Exit 1)
// Das Tor konnte im Regelfall «Branch-Arbeit committet» also nicht mehr
// scheitern. Fall 1) unten friert genau diesen Fall als Test ein.

/** Zweig-Punkt: Repo mit Basis-Commit auf Zweig `basis`. */
function repoMitZweig(): string {
  const root = repoMitBasis();
  git(root, 'branch', '-f', 'basis', 'HEAD');
  return root;
}

describe('committeter Bereich — risikoBereichHash', () => {
  it('1) §3.7-Kernfall: sauberer Baum, Risiko-Diff NUR committet → Baum grün, Bereich ROT', () => {
    const root = repoMitZweig();
    schreib(root, 'src/lib/tarif/x.ts', 'export const a = 1;\n');
    commitAlles(root, 'risiko committet');

    // (a) Der alte Eingang sieht nichts — genau das war die Lücke.
    const baum = risikoDiffHash({ cwd: root });
    expect(baum.kontext).toBe(true);
    expect(baum.hash).toBeNull();
    expect(bewerte(baum, null).gruen).toBe(true);

    // (b) Der neue Eingang sieht es und wird ohne Quittung rot.
    const ber = risikoBereichHash({ cwd: root, bereich: 'basis..HEAD' });
    expect(ber.kontext).toBe(true);
    expect(ber.hash).not.toBeNull();
    expect(ber.dateien).toEqual(['src/lib/tarif/x.ts']);
    const rot = bewerteBereich(ber, null);
    expect(rot.gruen).toBe(false);
    expect(rot.meldung).toContain('src/lib/tarif/x.ts');
  });

  it('2) mit passender Quittung → GRÜN; Verdikt ≠ bestanden bleibt ROT', () => {
    const root = repoMitZweig();
    schreib(root, 'src/lib/tarif/x.ts', 'export const a = 1;\n');
    commitAlles(root, 'risiko committet');
    const ber = risikoBereichHash({ cwd: root, bereich: 'basis..HEAD' });

    expect(
      bewerteBereich(ber, [{ hash: ber.hash!, verdikt: 'bestanden', modus: 'bereich' }]).gruen,
    ).toBe(true);
    expect(
      bewerteBereich(ber, [{ hash: ber.hash!, verdikt: 'widerlegt', modus: 'bereich' }]).gruen,
    ).toBe(false);
    // fremder Hash (andere Quittung) zählt nicht
    expect(bewerteBereich(ber, [{ hash: 'ff'.repeat(32), verdikt: 'bestanden' }]).gruen).toBe(false);
  });

  it('3) Schema-Identität: derselbe Diff ergibt als Baum und als Commit denselben Hash', () => {
    // Das ist die Bedingung dafür, dass die HAND-Hash-Zeilen im Register
    // (2026-07-28 ff.) rückwirkend nachrechenbar bleiben: EIN Schema,
    // zwei Eingänge — pfad NUL art NUL sha256(Inhalt) NUL, byte-sortiert.
    const rBaum = repoMitZweig();
    schreib(rBaum, 'src/lib/tarif/x.ts', 'export const a = 1;\n');
    schreib(rBaum, 'src/data/tarif/y.ts', 'export const b = 2;\n');
    const hBaum = risikoDiffHash({ cwd: rBaum }).hash;

    const rBer = repoMitZweig();
    schreib(rBer, 'src/lib/tarif/x.ts', 'export const a = 1;\n');
    schreib(rBer, 'src/data/tarif/y.ts', 'export const b = 2;\n');
    commitAlles(rBer, 'dasselbe, aber committet');
    const hBer = risikoBereichHash({ cwd: rBer, bereich: 'basis..HEAD' }).hash;

    expect(hBaum).not.toBeNull();
    expect(hBer).toBe(hBaum);
  });

  it('4) frisch geforkter Branch ohne eigene Commits → hash null, GRÜN (kein Falsch-Rot)', () => {
    const root = repoMitZweig();
    const r = risikoBereichHash({ cwd: root, bereich: 'basis..HEAD' });
    expect(r.kontext).toBe(true);
    expect(r.hash).toBeNull();
    expect(bewerteBereich(r, null).gruen).toBe(true);
  });

  it('5) Basis hinter der Referenz: merge-base zählt NUR die eigenen Commits', () => {
    // Zweig forkt, danach wandert `basis` mit einer FREMDEN Risiko-Änderung
    // weiter. Ohne merge-base (stumpfes basis..HEAD) fiele die fremde Datei
    // in den eigenen Bereich — ein Falsch-Rot für Arbeit, die einem nicht gehört.
    const root = repoMitZweig();
    git(root, 'checkout', '-q', '-b', 'arbeit');
    schreib(root, 'src/components/Foo.tsx', 'export const Foo = () => null;\n');
    commitAlles(root, 'eigene, harmlose Arbeit');

    git(root, 'checkout', '-q', 'basis');
    schreib(root, 'src/lib/tarif/fremd.ts', 'export const f = 1;\n');
    commitAlles(root, 'fremde Risiko-Arbeit auf basis');
    git(root, 'checkout', '-q', 'arbeit');

    const r = risikoBereichHash({ cwd: root, bereich: 'basis..HEAD' });
    expect(r.dateien).not.toContain('src/lib/tarif/fremd.ts');
    expect(r.hash).toBeNull();
    expect(bewerteBereich(r, null).gruen).toBe(true);
  });

  it('6) Referenz nicht auflösbar → SKIP mit benannter Ursache (kein stilles Grün, §6.7 lit. b)', () => {
    const root = repoMitBasis(); // kein origin/main
    const r = risikoBereichHash({ cwd: root });
    expect(r.kontext).toBe(false);
    expect(r.grund).toBe('keine-basis');
    const s = bewerteBereich(r, null);
    expect(s.gruen).toBe(true);
    expect(s.meldung).toContain('SKIP');
    expect(s.meldung).toContain('check:merge-schutz'); // Arbiter wird benannt
    expect(s.meldung).toContain('KEINE Aussage');
  });

  it('7) CI → kontext:false mit ci-selbstschutz (merge-schutz ist dort der Arbiter)', () => {
    const root = repoMitZweig();
    schreib(root, 'src/lib/tarif/x.ts', 'export const a = 1;\n');
    commitAlles(root, 'risiko');
    process.env.CI = 'true';
    const r = risikoBereichHash({ cwd: root, bereich: 'basis..HEAD' });
    expect(r.kontext).toBe(false);
    expect(r.grund).toBe('ci-selbstschutz');
    const s = bewerteBereich(r, null);
    expect(s.gruen).toBe(true);
    expect(s.meldung).toContain('check:merge-schutz');
  });

  it('8) gelöschte Risiko-Datei im Bereich zählt (art «geloescht», ≠ leere Datei)', () => {
    const rDel = repoMitBasis();
    schreib(rDel, 'src/lib/tarif/x.ts', 'inhalt\n');
    commitAlles(rDel, 'anlegen');
    git(rDel, 'branch', '-f', 'basis', 'HEAD');
    git(rDel, 'rm', '-q', 'src/lib/tarif/x.ts');
    commitAlles(rDel, 'loeschen');
    const hDel = risikoBereichHash({ cwd: rDel, bereich: 'basis..HEAD' });
    expect(hDel.dateien).toEqual(['src/lib/tarif/x.ts']);
    expect(hDel.hash).not.toBeNull();

    const rLeer = repoMitBasis();
    schreib(rLeer, 'src/lib/tarif/x.ts', 'inhalt\n');
    commitAlles(rLeer, 'anlegen');
    git(rLeer, 'branch', '-f', 'basis', 'HEAD');
    schreib(rLeer, 'src/lib/tarif/x.ts', '');
    commitAlles(rLeer, 'leeren');
    const hLeer = risikoBereichHash({ cwd: rLeer, bereich: 'basis..HEAD' });
    expect(hLeer.hash).not.toBe(hDel.hash);
  });

  it('9) nur Prüflogik committet → hash null (Auto-Ausnahme gilt identisch)', () => {
    const root = repoMitZweig();
    schreib(root, 'src/lib/tarif/x.test.ts', 'it("x", () => {});\n');
    schreib(root, 'scripts/gegenpruefung/kern.ts', '// x\n');
    commitAlles(root, 'nur pruef-logik');
    expect(risikoBereichHash({ cwd: root, bereich: 'basis..HEAD' }).hash).toBeNull();
  });

  it('10) Unicode-/Leerzeichen-Pfad wird auch im Bereich roh gebunden', () => {
    const root = repoMitZweig();
    schreib(root, 'src/lib/tarif/mit leer é.ts', 'export const a = 1;\n');
    commitAlles(root, 'unicode');
    const r = risikoBereichHash({ cwd: root, bereich: 'basis..HEAD' });
    expect(r.dateien).toContain('src/lib/tarif/mit leer é.ts');
    expect(r.hash).not.toBeNull();
  });
});

describe('parseBereich', () => {
  it('Formen: leer, nur Basis, A..B, A.. und ..B', () => {
    expect(parseBereich(undefined)).toEqual({ basisRef: 'origin/main', spitze: 'HEAD' });
    expect(parseBereich('')).toEqual({ basisRef: 'origin/main', spitze: 'HEAD' });
    expect(parseBereich('abc..def')).toEqual({ basisRef: 'abc', spitze: 'def' });
    expect(parseBereich('abc..')).toEqual({ basisRef: 'abc', spitze: 'HEAD' });
    expect(parseBereich('..def')).toEqual({ basisRef: 'origin/main', spitze: 'def' });
    expect(parseBereich('abc')).toEqual({ basisRef: 'abc', spitze: 'HEAD' });
  });

  it('Drei-Punkt-Form wird NICHT still umgedeutet', () => {
    // git meint mit A...B die symmetrische Differenz — stillschweigend als
    // A..B zu lesen hiesse, einen anderen Diff zu quittieren als den genannten.
    expect(() => parseBereich('abc...def')).toThrow(/Drei-Punkt/);
  });
});

describe('Pending-Datei: Liste seit 8.8.2026, Alt-Form bleibt gültig', () => {
  it('Alt-Form (ein Objekt) wird weiterhin als Working-Tree-Quittung gelesen', () => {
    const root = repoMitBasis();
    schreib(root, 'src/lib/tarif/x.ts', 'export const a = 1;\n');
    const r = risikoDiffHash({ cwd: root });
    // genau die Form, die vor diesem Schritt geschrieben wurde
    expect(bewerte(r, { hash: r.hash!, verdikt: 'bestanden' }).gruen).toBe(true);
  });

  it('Liste trägt beide Eingänge gleichzeitig', () => {
    const root = repoMitZweig();
    schreib(root, 'src/lib/tarif/x.ts', 'export const a = 1;\n');
    commitAlles(root, 'committet');
    schreib(root, 'src/data/tarif/y.ts', 'export const b = 2;\n'); // zusätzlich dreckig
    const baum = risikoDiffHash({ cwd: root });
    const ber = risikoBereichHash({ cwd: root, bereich: 'basis..HEAD' });
    expect(baum.hash).not.toBe(ber.hash);

    const datei = {
      eintraege: [
        { hash: baum.hash!, verdikt: 'bestanden', modus: 'baum' as const },
        { hash: ber.hash!, verdikt: 'bestanden', modus: 'bereich' as const },
      ],
    };
    expect(alsListe(datei)).toHaveLength(2);
    expect(bewerte(baum, datei).gruen).toBe(true);
    expect(bewerteBereich(ber, datei).gruen).toBe(true);

    // Nur EINE der beiden Quittungen → der andere Eingang bleibt rot.
    const nurBaum = { eintraege: [datei.eintraege[0]] };
    expect(bewerte(baum, nurBaum).gruen).toBe(true);
    expect(bewerteBereich(ber, nurBaum).gruen).toBe(false);
  });
});

// ─── Auflagen der Gegenprüfung vom 8.8.2026 (B1/B3/B5) ──────────────────────
describe('B1 — was der Bereichs-Hash bindet (Datei-Menge + Endinhalt, nicht die Spanne)', () => {
  it('enge und weite Spanne mit GLEICHER Datei-Menge ergeben denselben Hash', () => {
    // Live-Befund der Gegenprüfung: zwei Risiko-Commits A+B auf derselben Datei;
    // eine Quittung über HEAD~1..HEAD macht auch origin/main..HEAD grün. Das ist
    // sachlich richtig (der geprüfte Endzustand ist derselbe) und wird jetzt
    // AUSGESPROCHEN statt verschwiegen — dieser Test friert die Semantik ein,
    // damit sie niemand versehentlich als Loch «repariert».
    const root = repoMitZweig();
    schreib(root, 'src/lib/tarif/x.ts', 'export const a = 1;\n');
    commitAlles(root, 'A');
    schreib(root, 'src/lib/tarif/x.ts', 'export const a = 2;\n');
    commitAlles(root, 'B');

    const eng = risikoBereichHash({ cwd: root, bereich: 'HEAD~1..HEAD' });
    const weit = risikoBereichHash({ cwd: root, bereich: 'basis..HEAD' });
    expect(eng.dateien).toEqual(weit.dateien);
    expect(eng.hash).toBe(weit.hash);
  });

  it('enge Spanne mit KLEINERER Datei-Menge deckt den Voll-Bereich NICHT', () => {
    const root = repoMitZweig();
    schreib(root, 'src/lib/tarif/x.ts', 'export const a = 1;\n');
    commitAlles(root, 'A');
    schreib(root, 'src/data/tarif/y.ts', 'export const b = 2;\n');
    commitAlles(root, 'B');

    const eng = risikoBereichHash({ cwd: root, bereich: 'HEAD~1..HEAD' });
    const weit = risikoBereichHash({ cwd: root, bereich: 'basis..HEAD' });
    expect(eng.dateien).toEqual(['src/data/tarif/y.ts']);
    expect(weit.dateien).toEqual(['src/data/tarif/y.ts', 'src/lib/tarif/x.ts']);
    expect(eng.hash).not.toBe(weit.hash);
    // Quittung der engen Spanne lässt den Voll-Bereich rot.
    const quittung = [{ hash: eng.hash!, verdikt: 'bestanden', modus: 'bereich' as const }];
    expect(bewerteBereich(weit, quittung).gruen).toBe(false);
  });

  it('Rot-Meldung benennt die Bindung ausdrücklich', () => {
    const root = repoMitZweig();
    schreib(root, 'src/lib/tarif/x.ts', 'export const a = 1;\n');
    commitAlles(root, 'A');
    const m = bewerteBereich(risikoBereichHash({ cwd: root, bereich: 'basis..HEAD' }), null).meldung;
    expect(m).toContain('NICHT die angegebene Commit-Spanne');
  });
});

describe('B3 — Diagnose-Ehrlichkeit: fehlender Nachweis ≠ Hash-Mismatch', () => {
  it('nur Quittung des ANDEREN Eingangs → «kein Nachweis für diesen Eingang»', () => {
    const root = repoMitZweig();
    schreib(root, 'src/lib/tarif/x.ts', 'export const a = 1;\n');
    commitAlles(root, 'committet');
    const ber = risikoBereichHash({ cwd: root, bereich: 'basis..HEAD' });
    const nurBaum = [{ hash: 'ab'.repeat(32), verdikt: 'bestanden', modus: 'baum' as const }];
    const m = bewerteBereich(ber, nurBaum);
    expect(m.gruen).toBe(false);
    expect(m.meldung).toContain('kein Nachweis für diesen Eingang');
    expect(m.meldung).not.toContain('Hash-Mismatch');
  });

  it('Alt-Eintrag ohne modus zählt als Baum-Quittung → Bereich meldet «kein Nachweis»', () => {
    const root = repoMitZweig();
    schreib(root, 'src/lib/tarif/x.ts', 'export const a = 1;\n');
    commitAlles(root, 'committet');
    const ber = risikoBereichHash({ cwd: root, bereich: 'basis..HEAD' });
    const alt = { hash: 'cd'.repeat(32), verdikt: 'bestanden' }; // Form vor 8.8.2026
    expect(bewerteBereich(ber, alt).meldung).toContain('kein Nachweis für diesen Eingang');
  });

  it('echte Nachträglich-geändert-Lage bleibt «Hash-Mismatch»', () => {
    const root = repoMitZweig();
    schreib(root, 'src/lib/tarif/x.ts', 'export const a = 1;\n');
    commitAlles(root, 'A');
    const alt = risikoBereichHash({ cwd: root, bereich: 'basis..HEAD' });
    schreib(root, 'src/lib/tarif/x.ts', 'export const a = 2;\n');
    commitAlles(root, 'B');
    const neu = risikoBereichHash({ cwd: root, bereich: 'basis..HEAD' });
    const m = bewerteBereich(neu, [
      { hash: alt.hash!, verdikt: 'bestanden', modus: 'bereich' as const },
    ]);
    expect(m.gruen).toBe(false);
    expect(m.meldung).toContain('Hash-Mismatch');
  });

  it('gar keine Quittung → «Pending fehlt» (unverändert)', () => {
    const root = repoMitZweig();
    schreib(root, 'src/lib/tarif/x.ts', 'export const a = 1;\n');
    commitAlles(root, 'A');
    const m = bewerteBereich(risikoBereichHash({ cwd: root, bereich: 'basis..HEAD' }), null);
    expect(m.meldung).toContain('.gegenpruefung-pending fehlt');
  });
});

describe('B5 — Nicht-Blob im Risiko-Pfad scheitert hart statt still «gelöscht»', () => {
  it('Gitlink (Submodul) auf einem Risiko-Pfad wirft', () => {
    const root = repoMitZweig();
    // Gitlink ohne echtes Submodul-Repo direkt in den Index schreiben
    // (Zeiger auf einen existierenden Commit — git prüft die Objekt-Id).
    const sha = git(root, 'rev-parse', 'HEAD').trim();
    git(root, 'update-index', '--add', '--cacheinfo', `160000,${sha},src/lib/tarif/sub`);
    git(root, 'commit', '-q', '-m', 'gitlink');
    expect(() => risikoBereichHash({ cwd: root, bereich: 'basis..HEAD' })).toThrow(/kein Blob/);
  });
});
