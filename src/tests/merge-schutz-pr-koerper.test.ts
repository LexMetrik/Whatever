// src/tests/merge-schutz-pr-koerper.test.ts — PR-Körper-Schutz simuliert die
// Queue-Squash-Nachricht aus PR-TITEL+PR-BODY (§17, QS-CI-MINUTEN, Befund
// Session Gliederung 19./20.9.2026): alle 3 roten `merge_group`-Läufe seit
// Einführung der Merge-Queue (Läufe 35449385978, 35451221267, 35458509735;
// PRs #921, #923) fielen an derselben Lücke — `check-merge-schutz.ts` zählte
// bis dahin nur die ZWEIG-Commits (`git log`), die Queue baut ihren einen
// Commit aber aus PR-Titel+PR-Body. Ein im PR-Body fehlendes oder verkürztes
// Verdikt war damit im Zweig-Commit-Pfad grün und flog erst nach ~25 min aus
// der Queue.
//
// Teil 1 testet die reinen/injizierbaren Funktionen aus
// scripts/gegenpruefung/pr-schutz.ts — kein Netz, keine echte `gh`-Abfrage
// (Auftragsvorgabe: gh-Abfrage injizierbar bauen). Teil 2 fährt das Tor
// selbst zweimal gegen ein temporäres git-Repo mit einer `gh`-Attrappe auf
// PATH — echter Beweis für die Verdrahtungs-Reihenfolge (kein Risiko-Diff ⇒
// PR-Körper-Schutz wird gar nicht erst aufgerufen; Risiko-Diff + verkürztes
// PR-Body-Verdikt ⇒ ROT trotz gültigem Zweig-Trailer — genau der Root-Cause).
import { execFileSync, spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, afterEach, describe, expect, it } from 'vitest';
import {
  baueQueueSquash,
  holePrKoerperFuerKopf,
  loeseKopfAufZuSha,
  pruefePrKoerper,
  pruefePrSchutz,
  type PrKoerper,
} from '../../scripts/gegenpruefung/pr-schutz';

const WURZEL = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

// Echte Fixture: `gh pr view 923 --json title,body` (20.9.2026) — PR #923 war
// einer der beiden PRs, die in der Queue an dieser Lücke fielen; sein Body
// ist inzwischen (nach `gh pr edit`) formal gültig und dient hier als
// GRÜN-Fixture (Auftragsvorgabe: "falls er inzwischen korrigiert wurde, nimm
// die Fixture"). Genau die Form, die Test (c) verlangt: eine >72-Zeichen-Zeile
// im letzten Absatz, eine '🤖 Generated…'-Zeile im vorletzten Absatz davor.
const FIXTURE_923_BODY = readFileSync(resolve(__dirname, 'fixtures/merge-schutz-pr-body-923.txt'), 'utf8');
const TITEL_923 = 'fix(struktur): SVG-Randtitel «Grundregel» nicht mehr an Art. 27 ff. vererbt (W2·5m-LESER-V3)';

// ─── Teil 1: reine Funktionen ───────────────────────────────────────────────

describe('baueQueueSquash', () => {
  it('Titel, Leerzeile, Body — dieselbe Form wie die Queue beim Squash', () => {
    expect(baueQueueSquash('feat(x): y', 'Beleg-Absatz.')).toBe('feat(x): y\n\nBeleg-Absatz.');
  });

  it('leerer/nur-Whitespace-Body ⇒ nur der Titel', () => {
    expect(baueQueueSquash('feat(x): y', '')).toBe('feat(x): y');
    expect(baueQueueSquash('feat(x): y', '   \n  ')).toBe('feat(x): y');
  });
});

describe('pruefePrKoerper — die drei Kernfälle (a)/(b)/(c)', () => {
  it('(a) Body ohne jeden Gegenpruefung-Absatz ⇒ kein-verdikt', () => {
    const body = '## Was\nEin Fix ohne Verdikt-Absatz.\n\nRoadmap: X\n';
    expect(pruefePrKoerper('fix(x): y', body)).toEqual({ art: 'kein-verdikt' });
  });

  it('(b) verkürztes Verdikt ("— keine", < 15 Zeichen Befund-Teil) ⇒ mangel', () => {
    const body = 'Roadmap: X\nGegenpruefung: bestanden (Opus, Test) — keine\n';
    const u = pruefePrKoerper('fix(x): y', body);
    expect(u.art).toBe('mangel');
    if (u.art === 'mangel') {
      expect(u.grund).toMatch(/Befund-Teil/);
      expect(u.wert).toBe('bestanden (Opus, Test) — keine');
    }
  });

  it('(c) echte Fixture PR #923 (Titel+Body) ⇒ gueltig', () => {
    expect(pruefePrKoerper(TITEL_923, FIXTURE_923_BODY)).toEqual({ art: 'gueltig' });
  });

  it('mehrere Gegenpruefung-Zeilen im letzten Absatz — der erste gültige zählt', () => {
    // Reale Form kommt so nicht vor (ein Absatz hat höchstens einen Verdikt-
    // Trailer), aber pruefePrKoerper darf bei einem Mix nicht am ersten
    // Mangel scheitern, wenn ein späterer gültig ist.
    const body = 'Gegenpruefung: x\nGegenpruefung: bestanden (Opus, Test) — genug Zeichen im Befund-Teil\n';
    expect(pruefePrKoerper('fix(x): y', body)).toEqual({ art: 'gueltig' });
  });

  // A3-Nachzug (Gegenprüfung 20.9.2026): GitHub hängt den PR-Body-Co-Author-
  // Absatz beim Squash empirisch in ZWEI Formen an (6:6 unter den letzten 12
  // Queue-Merges) — mit `---------`-Trennzeile UND bare, ohne Trennzeile
  // (PR #942/d20efde42). Beide Formen müssen die Queue-Squash-Simulation
  // hier GRÜN lesen, sonst reisst ein gültiges Verdikt allein wegen der
  // Anhangsform.
  it('(d) Verdikt als letzter Body-Absatz + bare Co-author-Anhang (ohne Strichzeile) ⇒ gueltig', () => {
    const titel = 'fix(x): y';
    const body =
      'Roadmap: X\n' +
      'Gegenpruefung: bestanden (Opus, Test) — Verdikt trotz bare Co-Author-Anhang muss gelesen werden.\n\n' +
      'Co-authored-by: Claude Sonnet <noreply@anthropic.com>\n';
    expect(pruefePrKoerper(titel, body)).toEqual({ art: 'gueltig' });
    // baueQueueSquash spielt beide Anhangsformen durch derselben Prüfung zu.
    const mitStrich = body.replace(
      '\n\nCo-authored-by',
      '\n\n---------\n\nCo-authored-by',
    );
    expect(pruefePrKoerper(titel, mitStrich)).toEqual({ art: 'gueltig' });
    expect(baueQueueSquash(titel, body)).toContain('Gegenpruefung: bestanden');
  });
});

describe('pruefePrSchutz — injizierte gh-Holung, kein Netz', () => {
  const bereich = 'aaaa1111..bbbb2222';

  it('(e) kein PR gefunden (kein gh/kein PR/kein Netz) ⇒ null, sauberer Überspring', () => {
    expect(pruefePrSchutz(['node', 'script'], 3, bereich, () => null)).toBeNull();
  });

  it('(a) PR gefunden, Body ohne Verdikt ⇒ ROT-Meldung mit Heil-Hinweis', () => {
    const holen = (): PrKoerper => ({ nummer: 42, titel: 'fix(x): y', body: 'Kein Verdikt hier.\n' });
    const r = pruefePrSchutz(['node', 'script'], 3, bereich, holen);
    expect(r).not.toBeNull();
    expect(r).toContain('PR #42');
    expect(r).toContain("kein 'Gegenpruefung:'-Verdikt im PR-Body");
    expect(r).toContain('gh pr edit 42 --body-file');
  });

  it('(b) PR gefunden, Verdikt verkürzt ⇒ ROT-Meldung nennt Fundstelle + Mangel-Grund', () => {
    const holen = (): PrKoerper => ({
      nummer: 7,
      titel: 'fix(x): y',
      body: 'Roadmap: X\nGegenpruefung: bestanden (Opus, Test) — keine\n',
    });
    const r = pruefePrSchutz(['node', 'script'], 1, bereich, holen);
    expect(r).toContain('formal untauglich');
    expect(r).toContain('Befund-Teil');
    expect(r).toContain('bestanden (Opus, Test) — keine');
  });

  it('(c) PR gefunden, gültiges Verdikt (echte Fixture #923) ⇒ null — alter Pfad prüft weiter', () => {
    const holen = (): PrKoerper => ({ nummer: 923, titel: TITEL_923, body: FIXTURE_923_BODY });
    expect(pruefePrSchutz(['node', 'script'], 12, bereich, holen)).toBeNull();
  });

  it('--pr <n> wird an holen() durchgereicht (expliziter Modus)', () => {
    let empfangen: string | undefined = 'unveraendert';
    const holen = (nr?: string): PrKoerper | null => {
      empfangen = nr;
      return null;
    };
    pruefePrSchutz(['node', 'script', '--pr', '555'], 1, bereich, holen);
    expect(empfangen).toBe('555');
  });

  // A1/A4-Nachzug (Gegenprüfung 20.9.2026, «NICHT BESTANDEN»): DEKLARIERTE
  // fachliche Änderung dieses Tests (§6.3) — er zementierte bisher die A1-
  // Lücke (Branch-Modus IMMER, auch wenn `MERGE_SCHUTZ_KOPF` gesetzt ist —
  // genau der Realfall des Hooks, der im Haupt-Checkout auf `main` läuft und
  // dort keinen PR für den Branch findet). Auf das neue Soll umgestellt:
  // ohne `--pr` UND ohne `MERGE_SCHUTZ_KOPF` bleibt der Branch-Modus
  // unverändert; ist `MERGE_SCHUTZ_KOPF` gesetzt, entscheidet stattdessen
  // `holenFuerKopf` — der Branch-Modus (`holen()`) wird dann gar nicht erst
  // aufgerufen.
  it('ohne --pr, ohne MERGE_SCHUTZ_KOPF: Branch-Modus wie bisher (holen() ohne Nummer)', () => {
    let empfangen: string | undefined = 'unveraendert';
    const holen = (nr?: string): PrKoerper | null => {
      empfangen = nr;
      return null;
    };
    const r = pruefePrSchutz(['node', 'script'], 1, bereich, holen, () => null, {});
    expect(empfangen).toBeUndefined();
    expect(r).toBeNull();
  });

  it('MERGE_SCHUTZ_KOPF gesetzt + Treffer ⇒ dieser PR wird geprüft, Branch-Modus bleibt aus', () => {
    let branchAufgerufen = false;
    const holen = (): PrKoerper | null => {
      branchAufgerufen = true;
      return null;
    };
    const holenFuerKopf = (kopf: string): PrKoerper | null => {
      expect(kopf).toBe('deadbeef00112233');
      return { nummer: 77, titel: 'fix(x): y', body: 'Kein Verdikt hier.\n' };
    };
    const r = pruefePrSchutz(
      ['node', 'script'], 1, bereich, holen, holenFuerKopf,
      { MERGE_SCHUTZ_KOPF: 'deadbeef00112233' },
    );
    expect(branchAufgerufen).toBe(false);
    expect(r).toContain('PR #77');
    expect(r).toContain("kein 'Gegenpruefung:'-Verdikt im PR-Body");
  });

  it('MERGE_SCHUTZ_KOPF gesetzt + kein Treffer ⇒ sauberer Überspring, NIE Fallback auf Branch-Modus (A2)', () => {
    let branchAufgerufen = false;
    const holen = (): PrKoerper | null => {
      branchAufgerufen = true;
      return null;
    };
    const holenFuerKopf = (): PrKoerper | null => null;
    const r = pruefePrSchutz(
      ['node', 'script'], 1, bereich, holen, holenFuerKopf,
      { MERGE_SCHUTZ_KOPF: 'deadbeef00112233' },
    );
    expect(r).toBeNull();
    expect(branchAufgerufen).toBe(false);
  });

  it('--pr <n> hat Vorrang vor MERGE_SCHUTZ_KOPF (expliziter Modus gewinnt)', () => {
    const holen = (nr?: string): PrKoerper | null => {
      expect(nr).toBe('555');
      return null;
    };
    const holenFuerKopf = (): PrKoerper | null => {
      throw new Error('holenFuerKopf haette bei explizitem --pr nicht aufgerufen werden duerfen');
    };
    const r = pruefePrSchutz(
      ['node', 'script', '--pr', '555'], 1, bereich, holen, holenFuerKopf,
      { MERGE_SCHUTZ_KOPF: 'deadbeef00112233' },
    );
    expect(r).toBeNull();
  });
});

// ─── Teil 2: Integration — das echte Tor gegen ein temporäres git-Repo ──────
// Spawnt `vite-node scripts/check-merge-schutz.ts` (dieselbe Form wie
// `npm run check:merge-schutz`) mit einer `gh`-Attrappe auf PATH — echter
// End-zu-End-Beweis, kein Netz (die Attrappe beantwortet `gh pr view` lokal).

const aufgeraeumt: string[] = [];
afterAll(() => {
  for (const p of aufgeraeumt) rmSync(p, { recursive: true, force: true });
});

function git(cwd: string, ...args: string[]): string {
  return execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
}
function neuesRepo(): string {
  const root = mkdtempSync(join(tmpdir(), 'mschutz-pr-'));
  aufgeraeumt.push(root);
  git(root, 'init', '-q');
  const leer = join(root, '.githooks-leer');
  mkdirSync(leer, { recursive: true });
  git(root, 'config', 'core.hooksPath', leer); // fremde globale Hooks neutralisieren
  git(root, 'config', 'user.email', 't@t.ch');
  git(root, 'config', 'user.name', 'Test');
  git(root, 'config', 'commit.gpgsign', 'false');
  return root;
}
function schreib(root: string, pfad: string, inhalt: string): void {
  const abs = join(root, pfad);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, inhalt, 'utf8');
}
function commit(root: string, msg: string): void {
  git(root, 'add', '-A');
  execFileSync('git', ['-C', root, 'commit', '-q', '-m', msg]);
}

/**
 * gh-Attrappe auf PATH: `gh pr view … --json …` UND `gh pr list … --json …`
 * liefern dieselbe (test-gesteuerte) Antwort — als Einzelobjekt bzw. als
 * Liste mit einem Eintrag, je nach Subkommando ($2). A1-Nachzug (Gegen-
 * prüfung 20.9.2026): der echte Merge-Schutz ruft bei gesetztem
 * `MERGE_SCHUTZ_KOPF` jetzt `gh pr list` (Holung über headRefOid) statt
 * `gh pr view` (Branch-Modus) — die Attrappe muss deshalb BEIDE
 * Subkommandos bedienen, sonst prüfen die Integrationstests unten seit dem
 * A1-Fix den falschen Pfad (still `null` ⇒ Rückfall auf den alten
 * Zweig-Trailer-Pfad, keine echte Probe der neuen Verdrahtung mehr).
 */
function ghAttrappe(antwort: { number: number; title: string; body: string; headRefOid?: string }): string {
  const bin = mkdtempSync(join(tmpdir(), 'gh-bin-'));
  aufgeraeumt.push(bin);
  const p = join(bin, 'gh');
  const einzeln = JSON.stringify(antwort);
  const liste = JSON.stringify([antwort]);
  writeFileSync(
    p,
    `#!/bin/sh\n` +
      `if [ "$2" = "list" ]; then\n` +
      `cat <<'EOF_GH_LISTE'\n${liste}\nEOF_GH_LISTE\n` +
      `else\n` +
      `cat <<'EOF_GH_FIXTURE'\n${einzeln}\nEOF_GH_FIXTURE\n` +
      `fi\n`,
    'utf8',
  );
  chmodSync(p, 0o755);
  return bin;
}

// ── N2 (Nach-Verdikt 20.9.2026, niedrig): holePrKoerperFuerKopf löst `kopf`
// jetzt auf und vergleicht per GLEICHHEIT, nicht mehr per `startsWith` ─────
// Vorher: 'HEAD' (oder jeder andere gültige Nicht-Hex-Rev) startet nie mit
// einem hex `headRefOid`-Präfix ⇒ traf NIE, egal welcher PR gemeint war,
// und wurde still übersprungen — kein Rot, aber auch kein Schutz. Diese
// Tests laufen ohne echtes Repo: `aufloesen` wird injiziert (kein `git`
// nötig), `gh` wird per PATH-Attrappe (ghAttrappe, s. o.) bedient.
describe('holePrKoerperFuerKopf — N2 (Auflösung statt Präfixvergleich)', () => {
  const alterPath = process.env.PATH;
  afterEach(() => {
    process.env.PATH = alterPath;
  });

  it('kopf = "HEAD", aufloesen liefert vollen SHA ⇒ Treffer per Gleichheit (schlug vorher NIE an)', () => {
    const vollerSha = 'deadbeef00112233445566778899aabbccddeeff';
    const bin = ghAttrappe({ number: 9, title: 'fix(x): y', body: 'Body', headRefOid: vollerSha });
    process.env.PATH = `${bin}:${alterPath}`;
    const pr = holePrKoerperFuerKopf('HEAD', () => vollerSha);
    expect(pr).toEqual({ nummer: 9, titel: 'fix(x): y', body: 'Body' });
  });

  it('kopf = Kurz-SHA, aufloesen liefert vollen SHA ⇒ Treffer über Auflösung', () => {
    const vollerSha = 'deadbeef00112233445566778899aabbccddeeff';
    const bin = ghAttrappe({ number: 9, title: 'fix(x): y', body: 'Body', headRefOid: vollerSha });
    process.env.PATH = `${bin}:${alterPath}`;
    const pr = holePrKoerperFuerKopf('deadbeef00', () => vollerSha);
    expect(pr).toEqual({ nummer: 9, titel: 'fix(x): y', body: 'Body' });
  });

  it('kopf unauflösbar (aufloesen liefert null) ⇒ Überspringen, gh wird gar nicht erst aufgerufen', () => {
    // Eine gh-Attrappe, die bei jedem Aufruf eine Markerdatei anlegt — wäre
    // sie (trotz unauflösbarem `kopf`) doch aufgerufen worden, existierte die
    // Markerdatei danach. Ohne diesen Beleg würde ein fehlender
    // Früh-Ausstieg NICHT auffallen: `gh` scheitert dann zwar mangels
    // Attrappe auf PATH und holePrKoerperFuerKopf gäbe wegen des
    // umschliessenden try/catch ebenfalls `null` zurück — derselbe Rückgabewert,
    // aber der falsche Grund.
    const bin = mkdtempSync(join(tmpdir(), 'gh-bin-marker-'));
    aufgeraeumt.push(bin);
    const marker = join(bin, 'wurde-aufgerufen');
    writeFileSync(join(bin, 'gh'), `#!/bin/sh\ntouch '${marker}'\necho '[]'\n`, 'utf8');
    chmodSync(join(bin, 'gh'), 0o755);
    process.env.PATH = `${bin}:${alterPath}`;

    const pr = holePrKoerperFuerKopf('nicht-aufloesbare-referenz-xyz', () => null);
    expect(pr).toBeNull();
    expect(existsSync(marker)).toBe(false);
  });

  it('kopf = voller SHA direkt (Regression: unveränderter Grundfall bleibt ein Treffer)', () => {
    const vollerSha = 'cafebabe00112233445566778899aabbccddeeff';
    const bin = ghAttrappe({ number: 3, title: 'fix(y): z', body: 'B', headRefOid: vollerSha });
    process.env.PATH = `${bin}:${alterPath}`;
    const pr = holePrKoerperFuerKopf(vollerSha, () => vollerSha);
    expect(pr).toEqual({ nummer: 3, titel: 'fix(y): z', body: 'B' });
  });
});

describe('loeseKopfAufZuSha — injizierbar, kein echtes Repo nötig', () => {
  it('ausfuehren liefert SHA mit Zeilenumbruch ⇒ getrimmt zurückgegeben', () => {
    expect(loeseKopfAufZuSha('HEAD', () => 'deadbeef00112233445566778899aabbccddeeff\n')).toBe(
      'deadbeef00112233445566778899aabbccddeeff',
    );
  });

  it('ausfuehren wirft (ungültige Referenz) ⇒ null', () => {
    expect(
      loeseKopfAufZuSha('nicht-aufloesbar', () => {
        throw new Error('unknown revision');
      }),
    ).toBeNull();
  });
});

function laufeTor(repo: string, basis: string, kopf: string, ghBin: string): { status: number | null; ausgabe: string } {
  const vite = resolve(WURZEL, 'node_modules/.bin/vite-node');
  const script = resolve(WURZEL, 'scripts/check-merge-schutz.ts');
  const p = spawnSync(vite, [script], {
    cwd: repo,
    encoding: 'utf8',
    env: { ...process.env, PATH: `${ghBin}:${process.env.PATH}`, MERGE_SCHUTZ_BASIS: basis, MERGE_SCHUTZ_KOPF: kopf },
  });
  return { status: p.status, ausgabe: (p.stdout ?? '') + (p.stderr ?? '') };
}

/** Repo mit einem Risiko-Datei-Commit, gültigem Zweig-Trailer + gewachsenem Register. */
function repoMitRisikoUndGueltigemZweigTrailer(): { repo: string; basis: string; kopf: string } {
  const repo = neuesRepo();
  schreib(repo, 'README.md', 'x\n');
  commit(repo, 'init');
  const basis = git(repo, 'rev-parse', 'HEAD').trim();
  schreib(repo, 'src/lib/vorlagen/x.ts', 'export const x = 1;\n');
  schreib(repo, 'bibliothek/register/gegenpruefung-register.md', '# Register\n\n- Eintrag X\n');
  commit(repo, 'feat(vorlagen): x\n\nGegenpruefung: bestanden (Opus, Test) — echter Zweig-Trailer mit genug Zeichen im Befund-Teil.\n');
  const kopf = git(repo, 'rev-parse', 'HEAD').trim();
  return { repo, basis, kopf };
}

describe('Integration: check-merge-schutz.ts gegen ein temporäres git-Repo', () => {
  it('(d) kein Risiko-Diff ⇒ grün — eine boshafte gh-Attrappe (leerer Body) bleibt unbeachtet', () => {
    const repo = neuesRepo();
    schreib(repo, 'README.md', 'x\n');
    commit(repo, 'init');
    const kopf = git(repo, 'rev-parse', 'HEAD').trim();
    const bin = ghAttrappe({ number: 1, title: 'x', body: '' }); // wäre ROT, würde sie aufgerufen
    const r = laufeTor(repo, kopf, kopf, bin);
    expect(r.status).toBe(0);
    expect(r.ausgabe).toContain('kein Risiko-Pfad');
  }, 20000);

  it('Risiko-Diff + gültiger Zweig-Trailer, aber PR-Body-Verdikt verkürzt ⇒ ROT (Root-Cause-Regression, Befund PRs #921/#923)', () => {
    const { repo, basis, kopf } = repoMitRisikoUndGueltigemZweigTrailer();
    // A1-Nachzug: headRefOid = kopf — der echte Hook uebergibt MERGE_SCHUTZ_KOPF
    // aus `gh pr view --json headRefOid`, die Attrappe muss denselben Wert im
    // `pr list`-Treffer liefern, sonst greift der neue Kopf-Modus nicht.
    const bin = ghAttrappe({
      number: 9,
      title: 'feat(vorlagen): x',
      body: 'Roadmap: X\nGegenpruefung: bestanden (Opus, Test) — keine\n',
      headRefOid: kopf,
    });
    const r = laufeTor(repo, basis, kopf, bin);
    expect(r.status).toBe(1);
    expect(r.ausgabe).toContain('PR #9');
    expect(r.ausgabe).toContain('formal untauglich');
  }, 20000);

  it('dieselbe Lage, aber PR-Body-Verdikt gültig ⇒ GRÜN (alter Pfad greift, Register gewachsen)', () => {
    const { repo, basis, kopf } = repoMitRisikoUndGueltigemZweigTrailer();
    const bin = ghAttrappe({ number: 9, title: TITEL_923, body: FIXTURE_923_BODY, headRefOid: kopf });
    const r = laufeTor(repo, basis, kopf, bin);
    expect(r.status).toBe(0);
    expect(r.ausgabe).toContain('grün');
    expect(r.ausgabe).toContain('gewachsen');
  }, 20000);

  // A1-Nachzug: der eigentliche Realfall — `MERGE_SCHUTZ_KOPF` gesetzt, aber
  // KEIN PR mit passendem headRefOid in der Liste (z. B. Haupt-Checkout auf
  // `main`, PR laengst zu, oder `gh`-Antwort ohne Treffer). Muss sauber
  // ueberspringen und NICHT auf den (hier gar nicht erreichbaren) Branch-
  // Modus zurueckfallen — der alte Zweig-Trailer-Pfad greift danach weiter
  // und macht dieses Repo GRUEN (gueltiger Zweig-Trailer + Register gewachsen).
  it('MERGE_SCHUTZ_KOPF gesetzt, aber kein PR-Treffer (headRefOid passt nicht) ⇒ sauberer Überspring, alter Zweig-Pfad entscheidet', () => {
    const { repo, basis, kopf } = repoMitRisikoUndGueltigemZweigTrailer();
    const bin = ghAttrappe({
      number: 9,
      title: 'feat(vorlagen): x',
      body: 'Kein Verdikt hier.\n',
      headRefOid: '0'.repeat(40), // passt garantiert nicht zu `kopf`
    });
    const r = laufeTor(repo, basis, kopf, bin);
    expect(r.status).toBe(0);
    expect(r.ausgabe).toContain('grün');
    expect(r.ausgabe).toContain('gewachsen');
  }, 20000);
});
