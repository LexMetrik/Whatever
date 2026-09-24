import { describe, expect, it } from 'vitest';
import { botschaftenZumArtikel, fgaSchluessel } from '../pages/gesetz-leser/v3/blattMaterialien';
import type { BotschaftBezug } from '../lib/materialien/botschaften';
import type { ArtikelHistorie } from '../lib/normtext/historie-parse';

// S6 W1f (24.9.2026) · Reiter «Materialien», Artikelteil: die Botschaften, auf
// die eine Änderung des Artikels verweist — Abgleich über die ELI als
// IDENTITÄT (CLAUDE.md §7), nie als Teilstring. Die Werte sind die am
// 24.9.2026 im gebauten Stand gemessenen (BGBM Art. 2).
// ROT ZU BEKOMMEN (§6.7): in `botschaftenZumArtikel` `belegt.has(k)` durch
// einen Präfix-Vergleich (`[...belegt].some((x) => k.startsWith(x))`) ersetzen
// ⇒ «kein Präfix-Treffer» rot (so gefahren 24.9.2026: 1 failed | 3 passed).

const bot = (key: string, quelleUrl: string): BotschaftBezug => ({
  key, titel: key, nummer: key, quelleUrl, stand: '2004-11-24', parlamentUrl: null,
});
const historie = (...urls: string[]): ArtikelHistorie => ({
  giltSeit: '2025-01-01',
  ereignisse: [{ typ: 'fassung', datum: '2025-01-01', wirkung: false, quellen: urls.map((url) => ({ label: 'BBl', url })), absatz: null, item: null }],
});

describe('S6 W1f · Botschaften zum Artikel', () => {
  it('die ELI aus Fussnote und Botschaft ist dieselbe Identität', () => {
    expect(fgaSchluessel('https://fedlex.data.admin.ch/eli/fga/2005/54')).toBe('fga/2005/54');
    expect(fgaSchluessel('https://www.fedlex.admin.ch/eli/fga/2005/54/de')).toBe('fga/2005/54');
    expect(fgaSchluessel('https://fedlex.data.admin.ch/eli/oc/2024/376')).toBeNull();
  });

  it('BGBM Art. 2: BBl 2005 465 (= eli/fga/2005/54) findet die Botschaft 04.078', () => {
    const liste = [bot('04.078', 'https://www.fedlex.admin.ch/eli/fga/2005/54/de'), bot('99.999', 'https://www.fedlex.admin.ch/eli/fga/2010/7/de')];
    const h = historie('https://fedlex.data.admin.ch/eli/fga/2005/54', 'https://fedlex.data.admin.ch/eli/oc/2024/376');
    expect(botschaftenZumArtikel(liste, h).map((b) => b.key)).toEqual(['04.078']);
  });

  it('kein Präfix-Treffer: fga/2005/5 ist nicht fga/2005/54', () => {
    const liste = [bot('04.078', 'https://www.fedlex.admin.ch/eli/fga/2005/54/de')];
    expect(botschaftenZumArtikel(liste, historie('https://fedlex.data.admin.ch/eli/fga/2005/5'))).toEqual([]);
  });

  it('ohne Historie oder ohne Botschaften: leer', () => {
    expect(botschaftenZumArtikel(null, historie('https://fedlex.data.admin.ch/eli/fga/2005/54'))).toEqual([]);
    expect(botschaftenZumArtikel([bot('04.078', 'https://www.fedlex.admin.ch/eli/fga/2005/54/de')], undefined)).toEqual([]);
  });
});
