/**
 * Dedupe-Schlüssel der Curia-Kommissionen und -Beschlüsse (scripts/entstehung/curia.ts):
 * JSON-Tupel statt `|`-Join (Posten 2026-09-21 «Curia-Nachbarn», Punkt 2). Ein `|` im
 * Freitext (CouncilName, ResolutionText, CommitteeName) darf zwei VERSCHIEDENE Zeilen
 * nicht still auf einen Map-Eintrag zusammenfallen lassen — die jeweils letzte
 * überschriebe die vorherige (Nutzungsauflage: Daten inhaltlich nicht verändern).
 * Echte byte-gleiche Doppellieferungen fallen weiterhin zusammen.
 */

import { describe, it, expect } from 'vitest';
import { baueBeschluesse, baueKommissionen, type OdataZeile } from '../../scripts/entstehung/curia.ts';

const D = (iso: string): string => `/Date(${Date.parse(`${iso}T00:00:00Z`)})/`;

describe('baueBeschluesse: Schlüssel ohne Pipe-Kollision', () => {
  it('zwei verschiedene Beschlüsse, die im alten `|`-Schlüssel gleich lauteten, bleiben zwei', () => {
    // alt: `2024-05-29|Nationalrat|1||Eintreten` für BEIDE Zeilen (rat «Nationalrat|1» ohne
    // Vorlage vs. rat «Nationalrat» mit Vorlage 1 und Text «|Eintreten»)
    const zeilen: OdataZeile[] = [
      { ResolutionDate: D('2024-05-29'), CouncilName: 'Nationalrat|1', CouncilAbbreviation: 'NR', ResolutionText: 'Eintreten', IdBill: 'ohne' },
      { ResolutionDate: D('2024-05-29'), CouncilName: 'Nationalrat', CouncilAbbreviation: 'NR', ResolutionText: '|Eintreten', IdBill: 'b1' },
    ];
    const out = baueBeschluesse(zeilen, new Map([['b1', 1]]));
    expect(out).toHaveLength(2);
    expect(out.map((b) => [b.rat, b.vorlage, b.text])).toEqual([['Nationalrat', 1, '|Eintreten'], ['Nationalrat|1', null, 'Eintreten']]);
  });

  it('byte-gleiche Doppellieferung fällt weiterhin zusammen', () => {
    const z: OdataZeile = { ResolutionDate: D('2024-05-29'), CouncilName: 'Ständerat', CouncilAbbreviation: 'SR', ResolutionText: 'Zustimmung', IdBill: 'b1' };
    expect(baueBeschluesse([z, { ...z }], new Map([['b1', 1]]))).toHaveLength(1);
  });
});

describe('baueKommissionen: Schlüssel als Tupel', () => {
  // Hier ist eine Kollision im alten Schlüssel praktisch UNMÖGLICH: `datum` stammt aus
  // odataDatum (nur YYYY-MM-DD oder null) und enthält nie `|` — das erste `|` trennt
  // eindeutig. Der Test sichert darum nur Dedupe + Getrennthaltung, nicht einen Rot-Fall.
  it('byte-gleiche Doppellieferung fällt weiterhin zusammen, verschiedene Namen mit `|` bleiben getrennt', () => {
    const a: OdataZeile = { PreconsultationDate: D('2024-03-08'), CommitteeName: 'Kommission A|B', Abbreviation1: 'K-AB' };
    const b: OdataZeile = { PreconsultationDate: D('2024-03-08'), CommitteeName: 'Kommission A', Abbreviation1: 'K-A' };
    const out = baueKommissionen([a, { ...a }, b]);
    expect(out.map((k) => k.name)).toEqual(['Kommission A', 'Kommission A|B']);
  });
});
