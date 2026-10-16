/**
 * LESER-NAV · FB O-63 — der Bereichstext eines Sektionskopfs nennt eine Spanne mit ZWEI Zahlen.
 *
 * BEFUND (gemessen 16.10.2026, Kommando: `npx vitest` mit `berechneSektionMeta` über den
 * Gliederungsbaum aus `public/normtext/bund/<ERLASS>.json` + Sidecar): ein amtliches
 * Sammel-Etikett («Art. 50–51», zwei zusammen aufgehobene Artikel) als erstes oder letztes Glied
 * einer Sektion ergab «Art. 49–50–51» statt «Art. 49–51» — ZGB 20 von 1750 Sektionen, OR 13 von 2177,
 * StGB 7 von 189, SchKG 2 von 514. Dieselbe Zeichenkette steht im Kopf der Lesespalte und im
 * Treffer-Badge («Überschrift · Art. 11–50–51», ZGB «Personen»). Die Zuordnung der Artikel zu den
 * Sektionen ist davon nicht berührt: geändert wird nur der Anzeige-Text.
 *
 * ROT ZU BEKOMMEN (§6.7): in `berechnungen.ts` `bereichText` durch die frühere Formel
 * «Erstes Etikett, Gedankenstrich, Etikett ohne «Art.»-Präfix» ersetzen — (1) und (3) werden rot.
 */
import { describe, expect, it } from 'vitest';
import { baueGliederungsbaum, type Sektion, type StrukturMap } from '../lib/normtext/browse';
import type { NormSnapshot } from '../lib/normtext/typen';
import { bereichText, berechneSektionMeta } from '../pages/gesetz-leser/berechnungen';
import { baueLeserSuchIndex, sucheImErlass, badgesFuer } from '../pages/gesetz-leser/leserSuche';
import { ladeNormFixture } from './fixtures/normtext-fixture';

const basis = {
  ebene: 'bund' as const, quelle: 'X', erlass: 'X',
  stand: '2026-01-01', quelleUrl: 'https://example.invalid', abgerufen: '2026-01-01',
  fassungsToken: '20260101', sha: 'x',
};
const art = (token: string, label: string, text: string): NormSnapshot => ({
  ...basis, id: `x/${token}`, artikel: token, artikelLabel: label, bloecke: [{ absatz: '1', text }],
});

describe('bereichText — Spanne aus zwei Etiketten', () => {
  it('(1) Sammel-Etikett am Ende: nur sein letzter Teil, am Anfang: nur sein erster', () => {
    expect(bereichText('Art. 49', 'Art. 50–51')).toBe('Art. 49–51');
    expect(bereichText('Art. 50–51', 'Art. 55')).toBe('Art. 50–55');
    expect(bereichText('Art. 50–51', 'Art. 52–53')).toBe('Art. 50–53');
    expect(bereichText('§ 5–6', '§ 9')).toBe('§ 5–9');
  });
  it('(2) Gegenfall: einfache Etiketten bleiben wie vorher, Buchstaben-Zusätze ebenso', () => {
    expect(bereichText('Art. 336c', 'Art. 336d')).toBe('Art. 336c–336d');
    expect(bereichText('Art. 1', 'Art. 47')).toBe('Art. 1–47');
    expect(bereichText('§ 2', '§ 12a')).toBe('§ 2–12a');
  });
});

describe('berechneSektionMeta — Sammel-Etikett an der Grenze einer Sektion', () => {
  const eintraege = [
    art('49', 'Art. 49', 'Ein Satz.'),
    art('50_51', 'Art. 50–51', 'Aufgehoben.'),
    art('52', 'Art. 52', 'Ein Satz.'),
  ];
  const struktur: StrukturMap = {
    '49': { gliederung: [{ ebene: 0, label: 'Erster Titel: Alt' }], marginalie: [] },
    '50_51': { gliederung: [{ ebene: 0, label: 'Erster Titel: Alt' }], marginalie: [] },
    '52': { gliederung: [{ ebene: 0, label: 'Zweiter Titel: Neu' }], marginalie: [] },
  };
  it('(3) Bereich «Art. 49–51» statt «Art. 49–50–51»; der Einzel-Artikel behält sein Etikett', () => {
    const { sektionen } = baueGliederungsbaum(eintraege, struktur);
    const artIndex = new Map(eintraege.map((e, i) => [e.artikel, i] as const));
    const meta = berechneSektionMeta(sektionen, artIndex);
    const bereiche = sektionen.map((s) => meta.get(s.id)?.bereich);
    expect(bereiche).toEqual(['Art. 49–51', 'Art. 52']);
  });
});

describe('Korpus: keine Spanne mit drei Zahlen (ZGB, OR)', () => {
  for (const key of ['ZGB', 'OR']) {
    it(`(4) ${key}: kein Bereich mit zwei Gedankenstrichen`, () => {
      const { eintraege, struktur } = ladeNormFixture('bund', key);
      const { sektionen } = baueGliederungsbaum([...eintraege], struktur);
      const artIndex = new Map(eintraege.map((e, i) => [e.artikel, i] as const));
      const meta = berechneSektionMeta(sektionen, artIndex);
      const alle: Sektion[] = [];
      const gehe = (s: Sektion) => { alle.push(s); s.kinder.forEach(gehe); };
      sektionen.forEach(gehe);
      const dreiZahlen = alle.filter((s) => ((meta.get(s.id)?.bereich ?? '').match(/–/g) ?? []).length > 1);
      expect(dreiZahlen.map((s) => `${s.label}: ${meta.get(s.id)?.bereich}`)).toEqual([]);
      // Vorbedingung (§6.7): der Baum trägt Sektionen mit Bereich — «keine Dublette» wäre sonst trivial wahr.
      expect(alle.filter((s) => meta.get(s.id)?.bereich !== undefined).length).toBeGreaterThan(100);
    });
  }

  it('(5) das Treffer-Badge nennt dieselbe Spanne wie der Kopf (ZGB «Personen» unter dem Ersten Titel)', () => {
    const { eintraege, struktur } = ladeNormFixture('bund', 'ZGB');
    const treffer = sucheImErlass(baueLeserSuchIndex('ZGB', eintraege, struktur), 'Personen');
    const badges = badgesFuer(treffer.find((t) => t.token === '11')!, false);
    expect(badges.filter((b) => /–.*–/.test(b))).toEqual([]);
    expect(badges).toContain('Überschrift · Art. 11–51');
  });
});
