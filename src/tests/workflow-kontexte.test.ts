// ─── Workflow-Kontexte: unzulässige Ausdrucks-Kontexte vor der Landung fangen (MONITOR, 6.10.2026) ──
// Anlass: PR #1336 landete .github/workflows/materialien-nachzug.yml mit Job-level
// `env: NACHZUG_TMP: ${{ runner.temp }}/…` (Z.36). Der runner-Kontext gibt es auf Job-Ebene nicht;
// GitHub verwirft die ganze Datei («Unrecognized named-value: 'runner'», HTTP 422 bei
// `gh workflow run`), der Bot startete weder per Takt noch per Hand — und kein Tor sah es, weil
// das Repo kein actionlint hat. Dieser Test ist der Wurzel-Fix (§17).
//
// Quelle der Erlaubt-Listen: GitHub Docs «Contexts reference — Context availability»,
// https://docs.github.com/en/actions/reference/workflows-and-actions/contexts#context-availability
// (Stand abgerufen 6.10.2026). Geprüft werden nur Schlüssel, deren Liste enger ist als die der
// Steps; Step-Ebene (dort ist alles ausser Sonderfällen erlaubt) und jobs.<id>.outputs bleiben aussen vor.
//
// Bewusst ein Zeilen-Scanner statt YAML-Parser: package.json führt keinen YAML-Parser als direkte
// Abhängigkeit (js-yaml/yaml nur transitiv), und der Scanner liefert die Zeilennummer gleich mit.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const KONTEXTE = ['github', 'env', 'vars', 'job', 'jobs', 'steps', 'runner', 'secrets', 'strategy', 'matrix', 'needs', 'inputs'];
const WORKFLOW_EBENE: Record<string, string[]> = {
  'run-name': ['github', 'inputs', 'vars'],
  concurrency: ['github', 'inputs', 'vars'],
  env: ['github', 'secrets', 'inputs', 'vars'],
};
const JOB_EBENE: Record<string, string[]> = {
  concurrency: ['github', 'needs', 'strategy', 'matrix', 'inputs', 'vars'],
  'continue-on-error': ['github', 'needs', 'strategy', 'vars', 'matrix', 'inputs'],
  env: ['github', 'needs', 'strategy', 'matrix', 'vars', 'secrets', 'inputs'],
  environment: ['github', 'needs', 'strategy', 'matrix', 'vars', 'inputs'],
  if: ['github', 'needs', 'vars', 'inputs'],
  name: ['github', 'needs', 'strategy', 'matrix', 'vars', 'inputs'],
  'runs-on': ['github', 'needs', 'strategy', 'matrix', 'vars', 'inputs'],
  strategy: ['github', 'needs', 'vars', 'inputs'],
  'timeout-minutes': ['github', 'needs', 'strategy', 'matrix', 'vars', 'inputs'],
  with: ['github', 'needs', 'strategy', 'matrix', 'inputs', 'vars'],
  secrets: ['github', 'needs', 'strategy', 'matrix', 'secrets', 'inputs', 'vars'],
};

interface Fund { zeile: number; ort: string; kontext: string }
interface Knoten { schluessel: string; zeile: number; ende: number; einzug: number }

const einzug = (z: string) => z.length - z.trimStart().length;
const leer = (z: string) => z.trim() === '' || z.trimStart().startsWith('#');

/** Direkte Kinder (Mapping-Schlüssel) der Zeilen (von, bis] mit Einzug > elternEinzug. */
function kinder(zeilen: string[], von: number, bis: number, elternEinzug: number): Knoten[] {
  const aus: Knoten[] = [];
  let kindEinzug = -1;
  for (let i = von + 1; i < bis; i++) {
    const z = zeilen[i];
    if (leer(z)) continue;
    const e = einzug(z);
    if (e <= elternEinzug) break;
    if (kindEinzug < 0) kindEinzug = e;
    if (e !== kindEinzug) continue;
    const m = /^\s*(["']?)([\w.-]+)\1\s*:(?:\s|$)/.exec(z);
    if (!m) continue;
    if (aus.length) aus[aus.length - 1].ende = i;
    aus.push({ schluessel: m[2], zeile: i, ende: bis, einzug: e });
  }
  // Ende des letzten Kindes: erste nicht-leere Zeile mit Einzug ≤ elternEinzug.
  if (aus.length) {
    const letzt = aus[aus.length - 1];
    for (let i = letzt.zeile + 1; i < bis; i++) if (!leer(zeilen[i]) && einzug(zeilen[i]) <= elternEinzug) { letzt.ende = i; break; }
  }
  return aus;
}

/** Kontext-Namen eines Ausdrucks (String-Literale entfernt, Eigenschaften nach «.» ignoriert). */
function kontexteIn(ausdruck: string): string[] {
  const ohneLiterale = ausdruck.replace(/'(?:[^']|'')*'/g, "''");
  const treffer = [...ohneLiterale.matchAll(/(?<![\w.-])([A-Za-z_][\w-]*)(?!\s*\()/g)].map((m) => m[1]);
  return treffer.filter((t) => KONTEXTE.includes(t));
}

function pruefeKnoten(zeilen: string[], k: Knoten, ort: string, erlaubt: string[], funde: Fund[]) {
  const nichtKommentar = (z: string) => (leer(z) ? '' : z);
  for (let i = k.zeile; i < k.ende; i++) {
    const z = nichtKommentar(zeilen[i]);
    for (const m of z.matchAll(/\$\{\{([\s\S]*?)\}\}/g))
      for (const kx of kontexteIn(m[1])) if (!erlaubt.includes(kx)) funde.push({ zeile: i + 1, ort, kontext: kx });
  }
  // `if:` ist implizit ein Ausdruck, auch ohne ${{ }} (einzeilig oder als Block-Skalar).
  if (k.schluessel === 'if') {
    const kopf = zeilen[k.zeile].replace(/^\s*if\s*:\s*/, '');
    const teile = [{ text: kopf, zeile: k.zeile }];
    for (let i = k.zeile + 1; i < k.ende; i++) teile.push({ text: nichtKommentar(zeilen[i]), zeile: i });
    for (const t of teile) {
      if (t.text.includes('${{') || /^[>|][+-]?\s*$/.test(t.text.trim())) continue;
      for (const kx of kontexteIn(t.text)) if (!erlaubt.includes(kx)) funde.push({ zeile: t.zeile + 1, ort, kontext: kx });
    }
  }
}

function pruefeWorkflow(text: string): Fund[] {
  const zeilen = text.split('\n');
  const funde: Fund[] = [];
  for (const k of kinder(zeilen, -1, zeilen.length, -1)) {
    if (WORKFLOW_EBENE[k.schluessel]) pruefeKnoten(zeilen, k, k.schluessel, WORKFLOW_EBENE[k.schluessel], funde);
    if (k.schluessel !== 'jobs') continue;
    for (const job of kinder(zeilen, k.zeile, k.ende, k.einzug))
      for (const s of kinder(zeilen, job.zeile, job.ende, job.einzug))
        if (JOB_EBENE[s.schluessel]) pruefeKnoten(zeilen, s, `jobs.${job.schluessel}.${s.schluessel}`, JOB_EBENE[s.schluessel], funde);
  }
  return funde;
}

const DIR = join(process.cwd(), '.github', 'workflows');
const DATEIEN = readdirSync(DIR).filter((d) => /\.ya?ml$/.test(d)).sort();

describe('Workflow-Kontexte (Context availability)', () => {
  it('findet Workflows', () => expect(DATEIEN.length).toBeGreaterThan(5));

  it.each(DATEIEN)('%s nutzt nur zulässige Kontexte auf Workflow- und Job-Ebene', (datei) => {
    const funde = pruefeWorkflow(readFileSync(join(DIR, datei), 'utf8')).map((f) => `${datei}:${f.zeile} ${f.ort} ← ${f.kontext}`);
    expect(funde).toEqual([]);
  });

  it('Rot-Beweis: Vorfall #1336 (runner.temp im Job-env) wird an der richtigen Zeile gefangen', () => {
    const yml = [
      'name: X', 'on: workflow_dispatch', 'env:', '  A: ${{ github.sha }}', '  B: ${{ steps.x.outputs.y }}',
      'jobs:', '  nachzug:', '    name: N ${{ matrix.q }}', '    runs-on: ${{ runner.os }}', '    timeout-minutes: 5',
      '    if: steps.a.outputs.b == \'x\' && github.event_name != \'job.x\'', '    env:', '      TZ: Europe/Zurich',
      '      NACHZUG_TMP: ${{ runner.temp }}/materialien-nachzug', '      OK: ${{ secrets.T }}${{ needs.a.result }}',
      '    steps:', '      - run: echo', '        env:', '          T: ${{ runner.temp }}',
    ].join('\n');
    expect(pruefeWorkflow(yml)).toEqual([
      { zeile: 5, ort: 'env', kontext: 'steps' },
      { zeile: 9, ort: 'jobs.nachzug.runs-on', kontext: 'runner' },
      { zeile: 11, ort: 'jobs.nachzug.if', kontext: 'steps' },
      { zeile: 14, ort: 'jobs.nachzug.env', kontext: 'runner' },
    ]);
  });
});
