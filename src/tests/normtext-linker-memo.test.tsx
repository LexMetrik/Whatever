import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { LocaleProvider } from '../components/locale';
// vitest hebt `vi.mock` ÜBER die Importe — `NormText` sieht damit die gezählten
// Fassungen, obwohl hier statisch importiert wird.
import { artikelnPluralVerweise, fremdRoutingFormB } from '../lib/fedlex';
import { NormText, type InternRefs } from '../components/NormText';

// ═══ W2·24-PERF-REST · Wächter des Linker-Memos ══════════════════════════════
//
// WOFÜR. Der Leser rendert die Artikelliste beim Seitenaufbau MEHRFACH — auf
// `/gesetze/bund/OR` gezählt (CDP `Profiler.startPreciseCoverage`, dist-Preview,
// CPU×4, Kadenz «reines Laden, kein Scrollen», n=3, 15.9.2026): 16 420 Aufrufe
// von `artikelnPluralVerweise` für 4 850 Snapshot-Texte = 3.35 Durchgänge.
// `NormText` hält das Ergebnis darum je (Ebene, Erlass, Text) fest.
//
// Dieser Wächter sichert BEIDE Hälften der Zusicherung:
//   1. je Datenreferenz GENAU EINE Auswertung, auch über mehrere Durchgänge und
//      auch dann, wenn das `InternRefs`-Objekt je Durchgang neu entsteht;
//   2. KEINE Kollision zwischen Erlassen (Skill `perf`, Bauregel 4): derselbe
//      Satz muss in einem anderen Erlass neu ausgewertet werden UND ein anderes
//      Ziel liefern — sonst wäre der Speicher ein globaler Token-Key.
//
// Der Zähl-Spy liegt auf `../lib/fedlex` (dem Barrel, aus dem `NormText`
// importiert); er ruft die ECHTE Funktion auf, misst also nur die Aufruf-Zahl
// und verändert kein Ergebnis.
vi.mock('../lib/fedlex', async (echt) => {
  const m = await echt<typeof import('../lib/fedlex')>();
  return {
    ...m,
    artikelnPluralVerweise: vi.fn(m.artikelnPluralVerweise),
    fremdRoutingFormB: vi.fn(m.fremdRoutingFormB),
  };
});

const spyPlural = vi.mocked(artikelnPluralVerweise);
const spyFremd = vi.mocked(fremdRoutingFormB);

const ssr = (el: React.ReactElement) => renderToString(<LocaleProvider>{el}</LocaleProvider>);

/** Frisches `InternRefs` je Aufruf — der Speicher darf NICHT an der Objekt-
 *  Identität hängen (im Leser entsteht sie bei jedem Daten-Nachzug neu). */
const internFuer = (basisPfad: string): InternRefs => ({
  tokenMap: new Map([['12', '12'], ['31', '31'], ['35', '35'], ['45', '45'], ['66a', '66_a']]),
  basisPfad,
  springeZu: () => {},
});

// Je Fall ein EIGENER Text: der Speicher lebt auf Modul-Ebene, gemeinsame Texte
// würden die Fälle voneinander abhängig machen.
const TEXT_PLURAL = 'Vorbehalten bleiben die Artikel 31, 35 und 45 dieses Erlasses.';
const TEXT_FREMD = 'Artikel 66a oder 66abis des Strafgesetzbuchs (StGB) bleiben vorbehalten.';
const TEXT_TRAEGER = 'Artikel 12 Absatz 3 des Gesetzes bleibt in jedem Fall anwendbar.';

describe('Linker-Memo: genau eine Auswertung je Datenreferenz', () => {
  it('wertet den Plural-Linker über drei Render-Durchgänge nur EINMAL aus — Ausgabe byte-gleich', () => {
    spyPlural.mockClear();
    const laeufe = [1, 2, 3].map(() => ssr(
      <NormText text={TEXT_PLURAL} intern={internFuer('/gesetze/bund/OR')} />,
    ));
    // Der Satz muss den Plural-Pfad wirklich erreichen (sonst bewiese die Zahl nichts).
    expect(spyPlural.mock.results[0]?.value).toHaveLength(1);
    expect(new Set(laeufe).size).toBe(1);
    expect(spyPlural).toHaveBeenCalledTimes(1);
  });

  it('wertet das Fremd-Routing über drei Render-Durchgänge nur EINMAL aus — Ausgabe byte-gleich', () => {
    spyFremd.mockClear();
    const laeufe = [1, 2, 3].map(() => ssr(
      <NormText text={TEXT_FREMD} intern={internFuer('/gesetze/bund/OR')} />,
    ));
    // Der Satz muss wirklich routen (Klammer-Signal «(StGB)»), nicht null liefern.
    expect(spyFremd.mock.results[0]?.value).toMatchObject({ gesetz: 'StGB' });
    expect(new Set(laeufe).size).toBe(1);
    expect(spyFremd).toHaveBeenCalledTimes(1);
  });
});

describe('Linker-Memo: kein globaler Token-Key (Bauregel 4)', () => {
  it('wertet denselben Satz in einem ANDEREN Erlass neu aus und liefert ein anderes Ziel', () => {
    spyFremd.mockClear();
    // «des Gesetzes» zielt auf das TRÄGERGESETZ des gelesenen Erlasses:
    // ArGV 1 → ArG, UVV → UVG (`src/lib/fedlex/traegergesetz.ts`).
    const inArgv1 = ssr(<NormText text={TEXT_TRAEGER} intern={internFuer('/gesetze/bund/ARGV1')} />);
    const inUvv = ssr(<NormText text={TEXT_TRAEGER} intern={internFuer('/gesetze/bund/UVV')} />);
    expect(spyFremd).toHaveBeenCalledTimes(2);
    expect(spyFremd.mock.results[0]?.value).toMatchObject({ gesetz: 'ArG' });
    expect(spyFremd.mock.results[1]?.value).toMatchObject({ gesetz: 'UVG' });
    expect(inArgv1).not.toBe(inUvv);
  });
});
