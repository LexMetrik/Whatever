// Materialien-Nachzug-Bot (scripts/materialien/nachzug.ts, MONITOR 6.10.2026).
// Bewiesen wird: Drift-Auswertung nur per Positiv-Liste (Netzfehler/Count-Gate = Hinweis, kein
// Vollcrawl), Rauschschutz über angehängte dok-Zeilen, Reihenfolge snapshot → materialien je Quelle
// vor EINER Kaskade ohne Revisionen, Werkzeugfehler ⇒ Exit ≠ 0, und die Workflow-Struktur
// (kein Auto-Merge, Entwurf bei «pruefen», Staging = ERLAUBTE_PFADE).
import { describe, expect, it, beforeAll } from 'vitest';
import { spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import {
  ERLAUBTE_PFADE, Werkzeugfehler, fremdePfade, klassifiziereZustand, nachzug, parseQuellenFilter, prText,
  werteNetzAus, type Lauf, type Werkzeuge,
} from '../../scripts/materialien/nachzug';
import { istRisikoPfad, behalten } from '../../scripts/gegenpruefung/kern';

const ROOT = resolve(__dirname, '../..');
const rot = (t: string) => `ROT   materialien-netz: ${t}`;
const zus = (n: number) => `\ncheck:materialien-netz — ${n} Drift-Befund(e). Snapshot neu ziehen (nie Auto-Fix).`;
const netz = (...zeilen: string[]) => zeilen.map(rot).join('\n') + zus(zeilen.length);

describe('werteNetzAus — Drift nur per Positiv-Liste', () => {
  it('zwei driftende Quellen ⇒ [seco, estv-mwst] in fester Reihenfolge', () => {
    const a = werteNetzAus(netz(
      "ESTV-MWST: drift_token 'ESTV-MWST-INFO-04' abweichend (Manifest a ≠ live b: ToC/Ziffern-Baum geändert) — Snapshot neu ziehen.",
      "SECO: neues Dokument 'SECO-WL-ARG-ART-9' live, fehlt im Manifest — Snapshot neu ziehen.",
    ));
    expect(a.drift).toEqual(['seco', 'estv-mwst']);
    expect(a.hinweise).toEqual([]);
  });

  it('entlistet und Stand-Probe «Publiziert-am ≠ Stand» sind Drift', () => {
    const a = werteNetzAus(netz(
      "EDÖB: Dokument 'EDOEB-LF-1' im Manifest, aber live nicht mehr auffindbar (entlistet/umbenannt?) — Snapshot neu ziehen.",
      'ESTV-MWST: Stand-Probe ESTV-MWST-BRANCHEN-INFO-26 Publiziert-am 2026-09-03 ≠ committeter Stand 2025-03-31 — Snapshot neu ziehen.',
    ));
    expect(a.drift).toEqual(['edoeb', 'estv-mwst']);
  });

  it('Live-Crawl ROT / Live-Inventar ROT / Arbiter-Fehler / Kurz-URL / tote Stand-Probe ⇒ Hinweis, KEINE Drift', () => {
    const a = werteNetzAus(netz(
      'SECO: Live-Crawl ROT — fetch failed',
      'ESTV-MWST: Live-Inventar ROT — Count-Gate 12 < 20',
      'estv-ks: Arbiter-Fehler — ECONNRESET',
      "ESTV-MWST: Kurz-URL-Stichprobe 'ESTV-MWST-INFO-01' — 302-Ziel weicht ab",
      'ESTV-MWST: Stand-Probe ESTV-MWST-INFO-02 tot (HTTP 503) — Snapshot neu ziehen.',
      'ESTV-MWST: Stand-Probe ESTV-MWST-INFO-03 (https://x) ohne «Publiziert am» — Struktur-Drift.',
    ));
    expect(a.drift).toEqual([]);
    expect(a.hinweise.map((h) => h.quelle)).toEqual(['seco', 'estv-mwst', 'estv-ks', 'estv-mwst', 'estv-mwst', 'estv-mwst']);
  });

  it('EDÖB in zerlegter Unicode-Form (NFD) wird erkannt', () => {
    const a = werteNetzAus(netz("EDÖB: neues Dokument 'EDOEB-X' live, fehlt im Manifest — Snapshot neu ziehen.".normalize('NFD')));
    expect(a.drift).toEqual(['edoeb']);
  });

  it('unbekannte Form ⇒ Hinweis ohne Quelle', () => {
    expect(werteNetzAus(netz('irgendwas Neues')).hinweise).toEqual([{ quelle: null, text: 'irgendwas Neues' }]);
  });

  it('rot ohne Befundzeile oder Zahl ≠ Zusammenfassung ⇒ Werkzeugfehler', () => {
    expect(() => werteNetzAus('check:materialien-netz ROT: soft-law-zustand Z.3: kein gültiges JSON.')).toThrow(Werkzeugfehler);
    expect(() => werteNetzAus(rot("SECO: neues Dokument 'A' live, fehlt im Manifest") + zus(2))).toThrow(/Ausgabeformat/);
  });

  it('Vertrag mit check-materialien-netz.ts / estv-mwst-stand-probe.ts: die erkannten Formen stehen dort wörtlich', () => {
    const netzSrc = readFileSync(join(ROOT, 'scripts/materialien/check-materialien-netz.ts'), 'utf8');
    const probeSrc = readFileSync(join(ROOT, 'scripts/materialien/estv-mwst-stand-probe.ts'), 'utf8');
    expect(netzSrc).toContain('console.error(`ROT   materialien-netz: ${f}`)');
    expect(netzSrc).toContain('check:materialien-netz — ${fehler.length} Drift-Befund(e)');
    expect(netzSrc).toContain("neues Dokument '${id}' live, fehlt im Manifest");
    expect(netzSrc).toContain("Dokument '${id}' im Manifest, aber live nicht mehr");
    expect(netzSrc).toContain("drift_token '${id}' abweichend");
    expect(netzSrc).toContain('`${a.quelle}: Arbiter-Fehler');
    for (const p of ['SECO', 'EDÖB', 'ESTV-KS', 'ESTV-MWST']) expect(netzSrc).toContain(`\`${p}: `);
    expect(probeSrc).toMatch(/Stand-Probe \$\{probe\.dok\} Publiziert-am \$\{live\} ≠ committeter Stand/);
  });
});

// ── Rauschschutz ─────────────────────────────────────────────────────────────────────────────
const lauf = (q: string) => JSON.stringify({ typ: 'lauf', quelle: q, abgerufen: '2026-10-12', indexSha: 'x' });
const dok = (id: string, status = 'gelistet') => JSON.stringify({ typ: 'dok', id, status });
const ALT = [lauf('seco'), dok('SECO-A'), dok('SECO-B'), dok('SECO-C'), dok('SECO-C', 'entlistet')].join('\n') + '\n';

describe('klassifiziereZustand — Rauschschutz über angehängte dok-Zeilen', () => {
  it('nur lauf-Kopfzeile ⇒ keine (kein PR)', () => {
    const k = klassifiziereZustand(ALT, ALT + lauf('seco') + '\n');
    expect(k.status).toBe('keine');
    expect(k.dokZeilen).toBe(0);
    expect(k.jeQuelle.has('seco')).toBe(true);
  });
  it('eine neue dok-Zeile ⇒ anfuegung', () => {
    const k = klassifiziereZustand(ALT, ALT + [lauf('seco'), dok('SECO-NEU')].join('\n') + '\n');
    expect(k.status).toBe('anfuegung');
    expect(k.jeQuelle.get('seco')?.neu).toEqual(['SECO-NEU']);
  });
  it('geänderte, entlistete oder wieder gelistete dok ⇒ pruefen', () => {
    expect(klassifiziereZustand(ALT, ALT + [lauf('seco'), dok('SECO-NEU'), dok('SECO-A')].join('\n') + '\n').status).toBe('pruefen');
    expect(klassifiziereZustand(ALT, ALT + [lauf('seco'), dok('SECO-B', 'entlistet')].join('\n') + '\n').jeQuelle.get('seco')?.entlistet).toEqual(['SECO-B']);
    const w = klassifiziereZustand(ALT, ALT + [lauf('seco'), dok('SECO-C')].join('\n') + '\n');
    expect(w.status).toBe('pruefen');
    expect(w.jeQuelle.get('seco')?.wiedergelistet).toEqual(['SECO-C']);
  });
  it('dok-Zeilen werden der vorangehenden lauf-Zeile (Quelle) zugeordnet', () => {
    const k = klassifiziereZustand(ALT, ALT + [lauf('seco'), lauf('estv-mwst'), dok('ESTV-MWST-INFO-99')].join('\n') + '\n');
    expect(k.jeQuelle.get('seco')?.neu).toEqual([]);
    expect(k.jeQuelle.get('estv-mwst')?.neu).toEqual(['ESTV-MWST-INFO-99']);
  });
  it('nicht append-only, dok vor lauf, kaputtes JSON ⇒ Werkzeugfehler', () => {
    expect(() => klassifiziereZustand(ALT, ALT.slice(5))).toThrow(Werkzeugfehler);
    expect(() => klassifiziereZustand(ALT, ALT + dok('SECO-X') + '\n')).toThrow(/vor jeder lauf/);
    expect(() => klassifiziereZustand(ALT, ALT + '{kaputt\n')).toThrow(/kein gültiges JSON/);
  });
  it('echtes committetes Manifest: unverändert + Kopfzeile ⇒ keine', () => {
    const echt = readFileSync(join(ROOT, 'bibliothek/register/soft-law-zustand.jsonl'), 'utf8');
    expect(klassifiziereZustand(echt, echt).status).toBe('keine');
    expect(klassifiziereZustand(echt, echt + lauf('estv-mwst') + '\n').status).toBe('keine');
  });
});

describe('Pfad-Wache', () => {
  it('erlaubte Pfade gehen durch, Revisions-Sidecars und Fremdes nicht', () => {
    const s = [
      ' M bibliothek/register/soft-law-zustand.jsonl',
      ' M public/materialien/register.json',
      '?? public/materialien/kanten/OR.json',
      ' D public/materialien/kanten/ALT.json',
      ' M src/data/startseiteZaehler.generated.ts',
      ' M daten-manifest.json',
      ' M public/normtext/revisionen/DSG.json',
      'R  public/materialien/a.json -> src/x.ts',
    ].join('\n');
    expect(fremdePfade(s)).toEqual(['public/normtext/revisionen/DSG.json', 'src/x.ts']);
  });
});

// ── Ablauf mit Attrappen ─────────────────────────────────────────────────────────────────────
interface Attrappe extends Werkzeuge {
  aufrufe: string[];
  warnungen: string[];
  verworfen: number;
}
function attrappe(o: {
  netz?: Lauf;
  exit?: Record<string, number>;
  statusNach?: string;
  angehaengt?: string;
  sauberVorher?: boolean;
}): Attrappe {
  let gefahren = false;
  const a: Attrappe = {
    aufrufe: [],
    warnungen: [],
    verworfen: 0,
    npm(skript, args) {
      a.aufrufe.push([skript, ...args].join(' '));
      if (skript === 'check:materialien-netz') return o.netz ?? { status: 0, ausgabe: '' };
      gefahren = true;
      return { status: o.exit?.[skript] ?? 0, ausgabe: '' };
    },
    gitStatus() {
      if (!gefahren) return o.sauberVorher === false ? ' M src/x.ts\n' : '';
      return a.verworfen ? '' : (o.statusNach ?? ' M bibliothek/register/soft-law-zustand.jsonl\n');
    },
    zustandHead: () => ALT,
    zustandArbeitsbaum: () => ALT + (o.angehaengt ?? ''),
    verwerfe() { a.verworfen++; },
    log() {},
    warnung(s) { a.warnungen.push(s); },
  };
  return a;
}
const DRIFT2 = {
  status: 1,
  ausgabe: netz(
    "ESTV-MWST: drift_token 'ESTV-MWST-INFO-04' abweichend (Manifest a ≠ live b) — Snapshot neu ziehen.",
    "SECO: neues Dokument 'SECO-NEU' live, fehlt im Manifest — Snapshot neu ziehen.",
    'EDÖB: Live-Crawl ROT — fetch failed',
  ),
};
const ANGEHAENGT2 = [lauf('seco'), dok('SECO-NEU'), lauf('estv-mwst'), dok('ESTV-MWST-INFO-04')].join('\n') + '\n';

describe('nachzug — Reihenfolge und Fehlerpfade', () => {
  it('keine Drift (Exit 0) ⇒ status keine, nur das Netz-Tor gefahren', () => {
    const w = attrappe({});
    expect(nachzug('2026-10-12', null, w).status).toBe('keine');
    expect(w.aufrufe).toEqual(['check:materialien-netz']);
  });

  it('Drift seco + estv-mwst: je Quelle snapshot → materialien, dann EINE Kaskade ohne Revisionen; EDÖB-Netzfehler nur Hinweis', () => {
    const w = attrappe({ netz: DRIFT2, angehaengt: ANGEHAENGT2 });
    const e = nachzug('2026-10-12', null, w);
    expect(w.aufrufe).toEqual([
      'check:materialien-netz',
      'materialien:snapshot --datum=2026-10-12 --quelle=seco',
      'materialien --datum=2026-10-12',
      'materialien:snapshot --datum=2026-10-12 --quelle=estv-mwst',
      'materialien --datum=2026-10-12',
      'materialien:kaskade --datum=2026-10-12 --ohne-revisionen',
    ]);
    expect(e.quellen).toEqual(['seco', 'estv-mwst']);
    expect(e.status).toBe('anfuegung'); // beide ids in ALT unbekannt ⇒ neu
    expect(e.widerspruch).toEqual([]);
  });

  it('nur Hinweise (Netzfehler) ⇒ kein Snapshot, kein PR, kein Rot', () => {
    const w = attrappe({ netz: { status: 1, ausgabe: netz('ESTV-MWST: Live-Inventar ROT — Timeout') } });
    const e = nachzug('2026-10-12', null, w);
    expect(e.status).toBe('keine');
    expect(w.aufrufe).toEqual(['check:materialien-netz']);
    expect(w.warnungen).toHaveLength(1);
  });

  it('Filter «quellen» lässt eine driftende Quelle aus (Warnung)', () => {
    const w = attrappe({ netz: DRIFT2, angehaengt: [lauf('seco'), dok('SECO-NEU')].join('\n') + '\n' });
    const e = nachzug('2026-10-12', parseQuellenFilter('seco'), w);
    expect(e.quellen).toEqual(['seco']);
    expect(e.ausgelassen).toEqual(['estv-mwst']);
    expect(e.status).toBe('anfuegung');
    expect(w.aufrufe.filter((x) => x.startsWith('materialien:snapshot'))).toEqual(['materialien:snapshot --datum=2026-10-12 --quelle=seco']);
    expect(() => parseQuellenFilter('seco,bger')).toThrow(Werkzeugfehler);
  });

  it('nur Lauf-Kopfzeilen nach dem Snapshot ⇒ verworfen, status keine, aber Widerspruch (Lauf rot)', () => {
    const w = attrappe({ netz: DRIFT2, angehaengt: [lauf('seco'), lauf('estv-mwst')].join('\n') + '\n' });
    const e = nachzug('2026-10-12', null, w);
    expect(e.status).toBe('keine');
    expect(w.verworfen).toBe(1);
    expect(e.widerspruch).toEqual(['seco', 'estv-mwst']);
  });

  it('Werkzeugfehler: Netz-Tor Exit 2, Snapshot rot, Kaskade rot, fremder Pfad, schmutziger Baum', () => {
    expect(() => nachzug('2026-10-12', null, attrappe({ netz: { status: 2, ausgabe: '' } }))).toThrow(/Exit 2/);
    const s = attrappe({ netz: DRIFT2, exit: { 'materialien:snapshot': 1 } });
    expect(() => nachzug('2026-10-12', null, s)).toThrow(/snapshot --quelle=seco/);
    expect(s.aufrufe).toHaveLength(2); // nach dem roten Snapshot läuft nichts mehr
    expect(() => nachzug('2026-10-12', null, attrappe({ netz: DRIFT2, exit: { 'materialien:kaskade': 1 } }))).toThrow(/kaskade/);
    expect(() => nachzug('2026-10-12', null, attrappe({ netz: DRIFT2, angehaengt: ANGEHAENGT2, statusNach: ' M public/normtext/revisionen/OR.json\n' })))
      .toThrow(/ausserhalb der erlaubten Pfade/);
    expect(() => nachzug('2026-10-12', null, attrappe({ sauberVorher: false }))).toThrow(/nicht sauber/);
    expect(() => nachzug('heute', null, attrappe({}))).toThrow(/--datum/);
  });

  it('PR-Text nennt Status, Quellen-Tabelle und Hinweise', () => {
    const e = nachzug('2026-10-12', null, attrappe({ netz: DRIFT2, angehaengt: ANGEHAENGT2 }));
    const t = prText(e, '2026-10-12');
    expect(t).toContain('| seco | SECO-NEU |');
    expect(t).toContain('Live-Crawl ROT');
  });
});

describe('CLI nachzug-run.ts — Werkzeugfehler ⇒ Exit ≠ 0', () => {
  it('ohne --datum endet der Runner mit Exit 1 (vor jedem Netz-Zugriff)', () => {
    const r = spawnSync('npx', ['vite-node', 'scripts/materialien/nachzug-run.ts', '--', '--quellen=bger'], { cwd: ROOT, encoding: 'utf8' });
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('Werkzeugfehler');
  }, 60_000);
});

describe('Risikopfad', () => {
  it('Bot-Dateien sind gegenprüfungspflichtig (istRisikoPfad ∧ behalten)', () => {
    for (const p of ['scripts/materialien/nachzug.ts', 'scripts/materialien/nachzug-run.ts', 'scripts/materialien/kaskade-run.ts']) {
      expect(istRisikoPfad(p)).toBe(true);
      expect(behalten(p)).toBe(true);
    }
  });
});

// ── Workflow-Struktur ────────────────────────────────────────────────────────────────────────
const WORKFLOW = join(ROOT, '.github/workflows/materialien-nachzug.yml');

/** run-Block des Schritts mit dem gegebenen Namens-Anfang, entrückt (Muster verfall-erinnerung-workflow.test.ts). */
function runBlock(yml: string, schrittName: string): string {
  const zeilen = yml.split('\n');
  const i = zeilen.findIndex((z) => z.includes(`- name: ${schrittName}`));
  if (i < 0) throw new Error(`Schritt «${schrittName}» fehlt`);
  const r = zeilen.findIndex((z, k) => k > i && /^\s+run: \|\s*$/.test(z));
  const einzug = zeilen[r].match(/^\s*/)![0].length;
  const block: string[] = [];
  for (let k = r + 1; k < zeilen.length; k++) {
    const z = zeilen[k];
    if (z.trim() !== '' && z.match(/^\s*/)![0].length <= einzug) break;
    block.push(z.slice(einzug + 2));
  }
  return block.join('\n') + '\n';
}

describe('Workflow materialien-nachzug.yml', () => {
  const yml = readFileSync(WORKFLOW, 'utf8');

  it('Takt, Eingaben, Concurrency, minimale Rechte, Timeout', () => {
    expect(yml).toContain("- cron: '43 5 * * 1'");
    expect(yml).toMatch(/workflow_dispatch:\n\s+inputs:\n\s+quellen:/);
    expect(yml).toMatch(/trockenlauf:[\s\S]*?type: boolean/);
    expect(yml).toMatch(/concurrency:\n\s+group: materialien-nachzug\n\s+cancel-in-progress: false/);
    expect(yml).toMatch(/^permissions: \{\}$/m);
    expect(yml).toMatch(/permissions:\n\s+contents: write\n\s+pull-requests: write\n[\s\S]*?actions: write/);
    expect(yml).toContain('timeout-minutes: 120');
    expect(yml).toContain('npm run materialien:nachzug -- --datum=');
  });

  it('nie Auto-Merge; Token-Fallback; CI per workflow_dispatch angestossen', () => {
    expect(yml).not.toMatch(/gh pr merge|--auto\b/);
    expect(yml).toContain('GH_TOKEN: ${{ secrets.AUTOMERGE_TOKEN || github.token }}');
    expect(yml).toContain('gh workflow run ci.yml --ref "$branch"');
  });

  it('Staging = genau ERLAUBTE_PFADE (eine Liste, zwei Leser)', () => {
    const m = /git add -A -- (.+)$/m.exec(yml);
    expect(m).not.toBeNull();
    expect(m![1].trim().split(/\s+/)).toEqual([...ERLAUBTE_PFADE]);
  });

  describe('PR-Stufe gegen Ersatz-git/gh', () => {
    let dir: string;
    let block: string;
    beforeAll(() => {
      block = runBlock(yml, 'PR eröffnen');
      dir = mkdtempSync(join(tmpdir(), 'mat-nz-'));
      mkdirSync(join(dir, 'bin'));
      for (const name of ['gh', 'git']) {
        writeFileSync(
          join(dir, 'bin', name),
          `#!/usr/bin/env bash\necho "${name} $*" >> "$LOG"\n` +
            (name === 'gh' ? 'if [ "$1 $2" = "pr list" ]; then printf \'%s\' "${GH_OFFEN:-}"; fi\n' : '') +
            'exit 0\n',
        );
        chmodSync(join(dir, 'bin', name), 0o755);
      }
    });
    function fahre(env: Record<string, string>) {
      const log = join(dir, `log-${Math.random().toString(36).slice(2)}`);
      const tmp = mkdtempSync(join(dir, 't-'));
      writeFileSync(join(tmp, 'pr-body.md'), 'Text\n');
      const r = spawnSync('bash', ['-c', block], {
        encoding: 'utf8',
        env: {
          PATH: `${join(dir, 'bin')}:${process.env.PATH}`, LOG: log, NACHZUG_TMP: tmp,
          DATUM: '2026-10-12', QUELLEN_LAUF: 'seco', TORE: '0', GITHUB_SERVER_URL: 'https://x', GITHUB_REPOSITORY: 'o/r', GITHUB_RUN_ID: '1',
          ...env,
        },
      });
      return { status: r.status, aufrufe: existsSync(log) ? readFileSync(log, 'utf8').trim().split('\n') : [] };
    }
    it('anfuegung ⇒ normaler PR, dann CI-Dispatch; kein --draft', () => {
      const r = fahre({ STATUS: 'anfuegung' });
      expect(r.status).toBe(0);
      const create = r.aufrufe.find((a) => a.startsWith('gh pr create'))!;
      expect(create).not.toContain('--draft');
      expect(r.aufrufe.at(-1)).toBe('gh workflow run ci.yml --ref chore/materialien-nachzug-2026-10-12');
      expect(r.aufrufe).toContain('git push --force -u origin chore/materialien-nachzug-2026-10-12');
    });
    it('pruefen ⇒ PR als Entwurf', () => {
      expect(fahre({ STATUS: 'pruefen' }).aufrufe.find((a) => a.startsWith('gh pr create'))).toContain('--draft');
    });
    it('PR schon offen ⇒ nichts gepusht (idempotent)', () => {
      const r = fahre({ STATUS: 'anfuegung', GH_OFFEN: '42' });
      expect(r.status).toBe(0);
      expect(r.aufrufe.some((a) => a.startsWith('git '))).toBe(false);
    });
    it('anfuegung mit roten Toren ⇒ Exit 1, kein git/gh', () => {
      const r = fahre({ STATUS: 'anfuegung', TORE: '1' });
      expect(r.status).toBe(1);
      expect(r.aufrufe).toEqual([]);
    });
  });
});
