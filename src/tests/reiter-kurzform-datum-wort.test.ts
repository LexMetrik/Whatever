/**
 * W2·29-WERKBANK-REST S5b (25.9.2026) · Reiter-Kurzform eines Entscheids: das
 * Urteilsdatum fällt auch in WORT-Form weg («vom 20. Juni 2022»).
 *
 * Posten «Nachzüge aus R13 und Gesamtprüfung», Punkt «Geschäftsnummer-Kurzform
 * statt R8-Allowlist» (FAHRPLAN-DESIGN-IDENTITAET Ziff. 4). Die Regel stand
 * schon (`lib/tabs.ts` `zerlege`, F6: «das angehängte Urteilsdatum fällt weg —
 * es identifiziert nichts, was die Nummer nicht schon identifiziert»), griff
 * aber nur für «vom TT.MM.JJJJ». GEMESSEN 25.9.2026 an
 * public/rechtsprechung/register.json: 6505 Entscheide, 3795 mit Zahl-Datum,
 * 39 mit Wort-Datum (alle BGer/BVGer/BStGer/BPatGer) — darunter
 * bger_1B_278_2022, der einzige Rest der `kein-abschnitt`-Allowlist in der
 * Rechtsprechung (6 Einträge @320/390, «BGer 1B_278/2022 vom 20. Juni 2022»
 * 217 px in 171/212 px). Die Geschäftsnummer bleibt ungekürzt (§8).
 */
import { describe, it, expect } from 'vitest';
import { reiterKurzformTeile, reiterKurzformText, type TabEintrag } from '../lib/tabs';
import type { VerlaufManifeste } from '../lib/verlaufLabel';

const ent = (key: string, zitierung: string) => ({ key, zitierung }) as never;
const m: VerlaufManifeste = {
  gesetze: null,
  entscheide: {
    erzeugt: '2026-09-25',
    entscheide: [
      ent('bger_1B_278_2022', 'BGer 1B_278/2022 vom 20. Juni 2022'),
      ent('bpatger_S2024_005_S2024_006_S2024_007', 'BPatGer S2024_005, S2024_006, S2024_007 vom 8. Juli 2025'),
      ent('bs_x', 'Appellationsgericht BS BES.2020.86 vom 12.04.2022'),
      ent('bstger_x', 'BStGer CR.2026.5 vom 11. März 2026'),
      ent('fremd', 'BGer 1B_1/2020 vom 20. Juno 2022'),
    ],
  },
} as unknown as VerlaufManifeste;
const tab = (key: string): TabEintrag => ({ path: `/rechtsprechung/${key}` }) as TabEintrag;

describe('Reiter-Kurzform: Urteilsdatum fällt auch in Wort-Form weg', () => {
  it('«BGer 1B_278/2022 vom 20. Juni 2022» → «BGer 1B_278/2022»', () => {
    expect(reiterKurzformText(tab('bger_1B_278_2022'), m)).toBe('BGer 1B_278/2022');
    expect(reiterKurzformTeile(tab('bger_1B_278_2022'), m)).toMatchObject({ kopf: 'BGer', kern: '1B_278/2022' });
  });
  it('Umlaut-Monat und Mehrfach-Nummer', () => {
    expect(reiterKurzformText(tab('bstger_x'), m)).toBe('BStGer CR.2026.5');
    expect(reiterKurzformText(tab('bpatger_S2024_005_S2024_006_S2024_007'), m)).toBe('BPatGer S2024_005, S2024_006, S2024_007');
  });
  it('Zahl-Datum wie bisher (F6), Gericht gekürzt', () => {
    expect(reiterKurzformText(tab('bs_x'), m)).toBe('AppGer BS BES.2020.86');
  });
  it('kein Monatsname ⇒ nichts geraten, Zitierung bleibt (§7)', () => {
    expect(reiterKurzformText(tab('fremd'), m)).toBe('BGer 1B_1/2020 vom 20. Juno 2022');
  });
});
