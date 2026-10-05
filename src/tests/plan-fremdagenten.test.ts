// src/tests/plan-fremdagenten.test.ts — die reine Klassierlogik der Jules-Messung
// (`scripts/analyse/fremdagenten-messung.ts`, QS-FREMDAGENTEN Nachbesserung 4.9.2026).
//
// WARUM EIGENE DATEI. `plan-selbstopt.test.ts` prüft die Rechenkerne unter
// `scripts/plan/`; hier steht das Gegenstück unter `scripts/analyse/`. Getrennt
// gehalten, weil diese Datei als einzige einen Unterprozess startet (Guard-Test
// unten) und dafür ein eigenes Zeitbudget braucht.
//
// KEIN NETZ, KEIN `gh`. Geprüft wird ausschliesslich `klassierePrs()` — die
// reine Funktion, in die die Klassierung gezogen wurde, damit sie ohne
// GitHub-Aufruf prüfbar ist. `erhebeJules()` selbst bleibt ungeprüft: es ist
// nur noch Beschaffung (ein `gh`-Aufruf) plus der Aufruf dieser Funktion.
// Ebenso geprüft: `parseAgyModelSlugs`/`pruefeAntigravityDrift` (Ergänzung
// QS-FREMDAGENTEN 4.9.2026, Modell-/Versions-Drift) — beide ohne `agy`.
import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import {
  JULES_FENSTER_TAGE,
  klassierePrs,
  parseAgyModelSlugs,
  pruefeAntigravityDrift,
  type AntigravityStand,
  type PrRohMitStatus,
} from '../../scripts/analyse/fremdagenten-messung';

const JETZT = new Date('2026-09-04T18:00:00.000Z');
/** Klar im 7-Tage-Fenster. */
const IM_FENSTER = '2026-09-03T00:00:00.000Z';

function pr(p: Partial<PrRohMitStatus> & { number: number; headRefName: string }): PrRohMitStatus {
  return {
    createdAt: '2026-09-02T12:00:00.000Z',
    mergedAt: null,
    closedAt: null,
    state: 'OPEN',
    body: null,
    title: 'egal',
    labels: [],
    ...p,
  };
}

describe('klassierePrs (Jules-Messung, Proben ausgeschlossen)', () => {
  it('erkennt keinen Jules-PR im Branch `test/t5-prueferprobe` — weder Task-ID noch Präfix', () => {
    const out = klassierePrs(
      [pr({ number: 900, headRefName: 'test/t5-prueferprobe', state: 'CLOSED', closedAt: IM_FENSTER })],
      JETZT,
    );
    expect(out.gemergt).toEqual([]);
    expect(out.geschlossen).toEqual([]);
    expect(out.proben).toEqual([]);
  });

  // Der Anlass der Nachbesserung: PR #642 (`jules/relax-min-height-test-…`)
  // trug das Label `probe` und wurde als Ablehnung gezählt — die Landungsquote
  // fiel dadurch unter die Rückbau-Schwelle, obwohl kein Bau abgelehnt wurde.
  it('zählt einen geschlossenen Jules-PR mit Label `probe` als Probe, nicht als Ablehnung', () => {
    const out = klassierePrs(
      [
        pr({
          number: 642,
          headRefName: 'jules/relax-min-height-test-16624704437205943962',
          state: 'CLOSED',
          closedAt: IM_FENSTER,
          labels: [{ name: 'probe' }],
        }),
      ],
      JETZT,
    );
    expect(out.geschlossen).toEqual([]);
    expect(out.proben.map((p) => p.number)).toEqual([642]);
  });

  it('zählt denselben PR OHNE Label als Ablehnung', () => {
    const out = klassierePrs(
      [
        pr({
          number: 642,
          headRefName: 'jules/relax-min-height-test-16624704437205943962',
          state: 'CLOSED',
          closedAt: IM_FENSTER,
        }),
      ],
      JETZT,
    );
    expect(out.geschlossen.map((p) => p.number)).toEqual([642]);
    expect(out.proben).toEqual([]);
  });

  it('nimmt auch einen GEMERGTEN Probe-PR aus der Quote — sonst schönte die Probe den Zähler', () => {
    const out = klassierePrs(
      [
        pr({
          number: 643,
          headRefName: 'jules-1111541331587033919-8d87826d',
          state: 'MERGED',
          mergedAt: IM_FENSTER,
          labels: [{ name: 'probe' }],
        }),
      ],
      JETZT,
    );
    expect(out.gemergt).toEqual([]);
    expect(out.proben.map((p) => p.number)).toEqual([643]);
  });

  // ANLASS (5.9.2026, Fahrplan §5): PR #707 war eine gültige Entwurf-Antwort
  // — der Auftrag verlangte bei Feldabweichung Entwurfs-PR + Abbruch, Jules
  // tat genau das. Ohne Merge geschlossen zählte er dennoch als Ablehnung.
  it('zählt einen geschlossenen Jules-PR mit Label `entwurf-antwort` als Entwurf-Antwort, nicht als Ablehnung', () => {
    const out = klassierePrs(
      [
        pr({
          number: 707,
          headRefName: 'jules-1111541331587033919-entwurf',
          state: 'CLOSED',
          closedAt: IM_FENSTER,
          labels: [{ name: 'entwurf-antwort' }],
        }),
      ],
      JETZT,
    );
    expect(out.geschlossen).toEqual([]);
    expect(out.entwurfAntworten.map((p) => p.number)).toEqual([707]);
  });

  it('trägt beide Label `probe` und `entwurf-antwort` in die Probe ein — Probe hat Vorrang', () => {
    const out = klassierePrs(
      [
        pr({
          number: 708,
          headRefName: 'jules-1111541331587033919-beide',
          state: 'CLOSED',
          closedAt: IM_FENSTER,
          labels: [{ name: 'probe' }, { name: 'entwurf-antwort' }],
        }),
      ],
      JETZT,
    );
    expect(out.proben.map((p) => p.number)).toEqual([708]);
    expect(out.entwurfAntworten).toEqual([]);
    expect(out.geschlossen).toEqual([]);
  });

  it('trennt gemergt und geschlossen und lässt offene PRs ganz aus', () => {
    const out = klassierePrs(
      [
        pr({ number: 1, headRefName: 'jules-1111541331587033919-8d87826d', state: 'MERGED', mergedAt: IM_FENSTER }),
        pr({ number: 2, headRefName: 'jules/etwas-1111541331587033919', state: 'CLOSED', closedAt: IM_FENSTER }),
        pr({ number: 3, headRefName: 'jules-2111541331587033919-aaaa', state: 'OPEN' }),
      ],
      JETZT,
    );
    expect(out.gemergt.map((p) => p.number)).toEqual([1]);
    expect(out.geschlossen.map((p) => p.number)).toEqual([2]);
    expect(out.proben).toEqual([]);
  });

  it('schneidet am Fenster: was älter als die Fensterbreite ist, zählt nicht mehr', () => {
    const alt = new Date(JETZT.getTime() - (JULES_FENSTER_TAGE + 1) * 24 * 3_600_000).toISOString();
    const out = klassierePrs(
      [pr({ number: 4, headRefName: 'jules-1111541331587033919-8d87826d', state: 'MERGED', mergedAt: alt })],
      JETZT,
    );
    expect(out.gemergt).toEqual([]);
  });

  it('kommt ohne `labels`-Feld zurecht (ältere gh-Ausgabe), statt zu werfen', () => {
    const ohneLabels = {
      number: 5,
      headRefName: 'jules-1111541331587033919-8d87826d',
      createdAt: IM_FENSTER,
      mergedAt: null,
      closedAt: IM_FENSTER,
      state: 'CLOSED',
      body: null,
      title: 't',
    } as unknown as PrRohMitStatus;
    expect(klassierePrs([ohneLabels], JETZT).geschlossen.map((p) => p.number)).toEqual([5]);
  });
});

describe('parseAgyModelSlugs', () => {
  it('zieht die erste Spalte je Zeile und überspringt die Fetching-Kopfzeile', () => {
    const roh = 'Fetching available models...\ngemini-3.8-flash-high\tGemini 3.8 Flash (High)\nclaude-sonnet-4-6\tClaude Sonnet 4.6 (Thinking)\n';
    expect(parseAgyModelSlugs(roh)).toEqual(['gemini-3.8-flash-high', 'claude-sonnet-4-6']);
  });

  it('überspringt Leerzeilen und liefert [] für leere Ausgabe', () => {
    expect(parseAgyModelSlugs('\n\n')).toEqual([]);
    expect(parseAgyModelSlugs('')).toEqual([]);
  });
});

describe('pruefeAntigravityDrift (Modell-/Versions-Drift, Ergänzung QS-FREMDAGENTEN 4.9.2026)', () => {
  const register = (p: Partial<AntigravityStand> = {}): AntigravityStand => ({
    version: '1.1.26',
    models: ['gemini-3.8-flash-low', 'claude-sonnet-4-6'],
    letzte_sichtung: '2026-09-04',
    ...p,
  });

  it('schweigt, wenn Version und Modelle mit dem Register übereinstimmen', () => {
    expect(pruefeAntigravityDrift(register(), '1.1.26', ['gemini-3.8-flash-low', 'claude-sonnet-4-6'])).toEqual([]);
  });

  it('meldet fehlendes Register statt zu raten', () => {
    const hinweise = pruefeAntigravityDrift(null, '1.1.26', ['gemini-3.8-flash-low']);
    expect(hinweise).toHaveLength(1);
    expect(hinweise[0]).toContain('bibliothek/register/antigravity-stand.json');
  });

  it('meldet eine Versions-Drift im Format alt→neu', () => {
    const hinweise = pruefeAntigravityDrift(register(), '1.2.0', ['gemini-3.8-flash-low', 'claude-sonnet-4-6']);
    expect(hinweise).toContain('Antigravity-Version: agy 1.1.26→1.2.0');
  });

  it('meldet jedes neue Modell einzeln, unverändert vorhandene bleiben stumm', () => {
    const hinweise = pruefeAntigravityDrift(register(), '1.1.26', ['gemini-3.8-flash-low', 'claude-sonnet-4-6', 'gemini-4.0-flash']);
    expect(hinweise).toEqual(['NEU: Modell gemini-4.0-flash']);
  });

  it('meldet Versions- und Modell-Drift gemeinsam, wenn beides abweicht', () => {
    const hinweise = pruefeAntigravityDrift(register(), '1.2.0', ['gemini-4.0-flash']);
    expect(hinweise).toEqual(['Antigravity-Version: agy 1.1.26→1.2.0', 'NEU: Modell gemini-4.0-flash']);
  });
});

// ─────────────────────────── CLI-Guard (FREMDAGENTEN_CLI) ───────────────────────────
//
// `scripts/plan/selbstopt-erheben.ts` IMPORTIERT `erhebeJules()` aus derselben
// Datei, die auch die CLI trägt. Löste der blosse Import `main()` aus, führte
// jede Erhebung zusätzlich die Tabellen-Ausgabe samt `process.exit` aus. Der
// Guard `process.env.FREMDAGENTEN_CLI === '1'` verhindert das — und ein Guard
// ohne Test ist ein Tor, das nicht scheitern kann (§6.7).
describe('CLI-Guard FREMDAGENTEN_CLI', () => {
  it('ein Import ohne FREMDAGENTEN_CLI führt nichts aus (kein stdout, Exit 0)', () => {
    // Bewusst ein echter Unterprozess OHNE `VITEST`: nur so ist der Fall
    // «Bibliotheks-Import im Bau» nachgestellt, den der Guard abdeckt. Liefe
    // `main()`, stünde hier die Messtabelle (oder eine gh-Fehlermeldung mit
    // Exit 1) statt einer leeren Ausgabe.
    const env = { ...process.env };
    delete env.VITEST;
    delete env.VITEST_WORKER_ID;
    delete env.FREMDAGENTEN_CLI;
    const stdout = execFileSync(
      'npx',
      ['vite-node', 'scripts/analyse/fremdagenten-messung.ts'],
      { encoding: 'utf8', env, stdio: ['ignore', 'pipe', 'ignore'], timeout: 120_000 },
    );
    expect(stdout).toBe('');
  }, 130_000);
});
