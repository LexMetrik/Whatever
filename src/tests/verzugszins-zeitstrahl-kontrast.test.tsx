// @vitest-environment node
/// <reference path="../../scripts/fremdmodule.d.ts" />
// (Die Referenz bringt die culori-Deklaration der Prüfschicht in `tsc -b`
// der App — die Messmaschine `scripts/farbwelt-messung.ts` importiert culori,
// das kein eigenes `.d.ts` liefert.)
// ═══ W2·29-WERKBANK-REST S5c · Verzugszins-Zeitstrahl: Beschriftung auf jeder Fläche lesbar
//
// Posten 25.9.2026 «S3: Kontrast VerzugszinsTimeline.tsx:30-31 auf-gold auf
// brass-300 dunkel 1.92:1». Die sechste Satz-Fläche war `--brass-300` mit der
// nie kippenden Tinte `--auf-gold` — gebaut unter der Annahme, brass-300 bleibe
// auch im Dunkel hell. Die Token-Quelle sagt anders (dunkel #514F4B), die
// Beschriftung stand dort mit 1.92:1 (WCAG 1.4.3 verlangt 4.5:1).
//
// Die Probe RENDERT den Zeitstrahl mit sechs verschiedenen Sätzen plus dem
// «getilgt»-Abschnitt und misst jedes Paar (Füllung × Beschriftungs-Tinte)
// so, wie die Komponente es ausgibt — in beiden Themen, aufgelöst aus
// `src/index.css` (Projektion von `design/tokens.json`, `check:tokens-drift`)
// über dieselbe Messmaschine wie `check:farbwelt`.
//
// ROT ZU BEKOMMEN (§6.7, gefahren 25.9.2026 gegen src/): die alte Palette
// (`'var(--brass-300)'` an Stelle 2 plus `TEXT_AUSNAHME` → `--auf-gold`)
// wieder einsetzen ⇒ Fall «Kontrast» rot mit brass-300 × auf-gold dunkel 1.92.
// Eine Fläche doppelt (z. B. `--brass-100` an Stelle 2) ⇒ Fall «sechs
// verschiedene Flächen» rot.
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { VerzugszinsTimeline } from '../components/VerzugszinsTimeline';
import type { VerzugszinsErgebnis } from '../lib/verzugszins';
import { kontrast } from '../../scripts/farbwelt-messung';

const SAETZE = [5, 4, 3.5, 2.5, 2, 1.5];
const seg = (satz: number, i: number) => ({
  satz, tage: 30, von: `0${i + 1}.01.2025`, bis: `0${i + 1}.02.2025`, kapital: 1000, zins: 1,
});

/** Sechs Sätze, Kapital getilgt vor dem Stichtag ⇒ auch der «getilgt»-Abschnitt steht. */
const E = {
  segmente: SAETZE.map(seg),
  ersterZinstag: '01.01.2025',
  stichtag: '31.12.2025',
  kapitalOffen: 0, kapitalOffenCHF: '0.00',
  zinsOffenCHF: '6.00', totalOffen: 6, totalOffenCHF: '6.00',
} as unknown as VerzugszinsErgebnis;

/** Die Abschnitte des Zeitstrahls: [Füllung, Tinte, Beschriftung] aus dem gerenderten style. */
function abschnitte(): { fuellung: string; tinte: string; label: string }[] {
  const html = renderToStaticMarkup(<VerzugszinsTimeline e={E} />);
  const re = /style="[^"]*background:var\(--([\w-]+)\);color:var\(--([\w-]+)\)[^"]*"><span[^>]*>([^<]+)<\/span>/g;
  return [...html.matchAll(re)].map((m) => ({ fuellung: m[1], tinte: m[2], label: m[3] }));
}

describe('S5c · Verzugszins-Zeitstrahl — Beschriftung auf jeder Fläche', () => {
  it('rendert sechs Satz-Abschnitte plus «getilgt»', () => {
    const a = abschnitte();
    expect(a.map((x) => x.label)).toEqual([...SAETZE.map((s) => `${s} %`), 'getilgt']);
  });

  it('sechs verschiedene Satz-Flächen, keine gleich der «getilgt»-Fläche', () => {
    const a = abschnitte();
    const satz = a.slice(0, 6).map((x) => x.fuellung);
    expect(new Set(satz).size, satz.join(', ')).toBe(6);
    expect(satz).not.toContain(a[6].fuellung);
  });

  it('Kontrast: jede Beschriftung ≥ 4.5:1 auf ihrer Fläche, hell UND dunkel', () => {
    const befund = abschnitte().flatMap(({ fuellung, tinte }) =>
      (['hell', 'dunkel'] as const).map((modus) => ({
        paar: `${tinte} auf ${fuellung} (${modus})`,
        wert: Math.round(kontrast(tinte, fuellung, modus) * 100) / 100,
      })));
    const unter = befund.filter((b) => b.wert < 4.5);
    expect(unter, JSON.stringify(befund)).toEqual([]);
  });
});
