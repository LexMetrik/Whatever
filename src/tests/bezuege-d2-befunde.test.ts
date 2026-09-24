// ─── D2 «Bezüge»: Regressionstests je Befund (W2·29-WERKBANK-LESER S6/W2) ────
//
// Vier Befunde der Prüfrunde 1 an der Zuordnung Entscheid ↔ Artikel:
//   B-1  Platzhalter-Datum 01.01. ohne Flag (BS-Entscheide ohne Metadaten-Datum)
//   E-1  BGE als «Leitentscheid» zu einem Artikel, der nur in einer NICHT
//        publizierten Erwägung des Volltext-Urteils steht
//   E-7  textgleiche Dubletten aus dem BS-Portal doppelt in der Linie
//   Fehlabgleich-Verdacht OR 41 ← BGE 151 IV 265 (Art. 182 StGB): Ursache war E-1
//
// Zwei Ebenen: (a) der Generator `baueBezugsIndex` an echten, committeten
// Snapshots (deterministisch, ohne Netz), (b) die ausgelieferten Shards selbst —
// damit ein Artefakt, das an der Quelle vorbei gepflegt würde, rot wird (§5).

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { EntscheidSnapshot } from '../lib/rechtsprechung/typen';
import {
  baueBezugsIndex, baueBezugsShards, textgleicheDubletten, unpublizierteSchluessel,
} from '../../scripts/normtext/bezuege-bauen';
import { vergleicheLeitfaelle, manifestRegesteKurz } from '../../scripts/normtext/entscheide-schreiben';
import { artikelSchluesselVonSnapshot } from '../../scripts/normtext/entscheide-mapping';
import { entscheidPraezision, klassifiziereFassungsBezug, entscheidDatum } from '../lib/verzahnung/artikel-revisionen';

const PUB = join(process.cwd(), 'public', 'rechtsprechung');
const snap = (datei: string): EntscheidSnapshot =>
  JSON.parse(readFileSync(join(PUB, datei), 'utf8')).eintraege[0] as EntscheidSnapshot;
const shard = (erlass: string) => JSON.parse(readFileSync(join(PUB, 'bezuege', `${erlass}.json`), 'utf8'));
const bau = (auswahl: EntscheidSnapshot[]) =>
  baueBezugsIndex(auswahl, new Map(), vergleicheLeitfaelle, manifestRegesteKurz);

describe('E-1: Artikel nur in nicht publizierter Erwägung → Kante auf das Volltext-Urteil', () => {
  const bge = snap('bund/bge/152_III_23.json');

  it('BGE 152 III 23: Art. 336c OR nur in E. 3 von 4A_221/2025 — nicht Regeste, nicht Auszug', () => {
    const alle = artikelSchluesselVonSnapshot(bge);
    expect(alle.has('OR/336c')).toBe(true);        // Vorbedingung: der Volltext nennt ihn
    const u = unpublizierteSchluessel(bge, alle);
    expect(u.get('OR/336c')).toEqual(['E. 3']);
    expect(u.has('OR/324a')).toBe(false);          // Regeste-Artikel bleibt am BGE
  });

  it('Generator: OR/336c zeigt auf bge_152_III_23__voll (Klasse bger), OR/324a weiter auf den BGE', () => {
    const idx = bau([bge]);
    const k336c = idx.proArtikel.get('OR/336c')!;
    expect(k336c.map((k) => k.key)).toEqual(['bge_152_III_23__voll']);
    expect(k336c[0].facetten.status).toBe('bger');
    expect(k336c[0].zitierung).toBe('Urteil 4A_221/2025 (nicht publ. in BGE 152 III 23)');
    expect(k336c[0].regesteKurz).toBeNull();
    expect(k336c[0].erwaegungen).toEqual(['E. 3']);
    expect(k336c[0].unpubliziert).toEqual({ bge: '152 III 23', urteil: '4A_221/2025' });
    const k324a = idx.proArtikel.get('OR/324a')!;
    expect(k324a.map((k) => k.key)).toEqual(['bge_152_III_23']);
    expect(k324a[0].facetten.status).toBe('bge');
    // Shard-Form: Kopf trägt `unpubliziert`, die Kante die Erwägungen.
    const or = baueBezugsShards(idx, '2026-09-23').get('OR')!;
    expect(or.dokumente['bge_152_III_23__voll'].unpubliziert).toEqual({ bge: '152 III 23', urteil: '4A_221/2025' });
    expect(or.proArtikel['336c']).toEqual([{ key: 'bge_152_III_23__voll', gewicht: 0, erwaegungen: ['E. 3'] }]);
  });

  it('Auszug ohne Erwägungen (unvollständig erfasst): keine Umlenkung', () => {
    const nurSv: EntscheidSnapshot = {
      ...bge, auszugAbschnitte: bge.auszugAbschnitte!.filter((a) => a.typ !== 'erwaegung'),
    };
    expect(unpublizierteSchluessel(nurSv, artikelSchluesselVonSnapshot(nurSv)).size).toBe(0);
  });

  it('ausgeliefert: OR 336c ohne BGE 152 III 23, OR 41 ohne BGE 151 IV 265 (nur E. 1 von 6B_296/2024)', () => {
    const or = shard('OR');
    const keys336c = or.proArtikel['336c'].map((e: { key: string }) => e.key);
    expect(keys336c).not.toContain('bge_152_III_23');
    expect(or.proArtikel['336c']).toContainEqual({ key: 'bge_152_III_23__voll', gewicht: 0, erwaegungen: ['E. 3'] });
    const keys41 = or.proArtikel['41'].map((e: { key: string }) => e.key);
    expect(keys41).not.toContain('bge_151_IV_265');
    expect(keys41).toContain('bge_151_IV_265__voll');
    expect(or.dokumente['bge_151_IV_265__voll'].facetten.status).toBe('bger');
    // Gegenprobe Fehlabgleich-Verdacht: BGE 152 III 7 nennt «Art. 41 ff. OR» im
    // PUBLIZIERTEN E. 4.7.1 (SVG-Haftung) — die Kante bleibt zu Recht am BGE.
    expect(keys41).toContain('bge_152_III_7');
  });
});

describe('E-7: textgleiche Dubletten — einmal in der Linie, eigene Seite bleibt', () => {
  const a = snap('kanton/BS/bs_appellationsgericht/VD.2025.54.json');
  const b = snap('kanton/BS/bs_appellationsgericht/VD.2025.54-20250613.json');

  it('VD.2025.54 (nF30_KEY 78498/78499): Zwilling erkannt, kleinste id behalten', () => {
    const d = textgleicheDubletten([b, a]);
    expect([...d]).toEqual([[b.id, a.id]]);
    const idx = bau([a, b]);
    for (const kanten of idx.proArtikel.values()) {
      expect(kanten.map((k) => k.key)).not.toContain('bs_appellationsgericht_VD.2025.54-20250613');
    }
    expect(idx.proArtikel.get('BGG/42')!.map((k) => k.key)).toEqual(['bs_appellationsgericht_VD.2025.54']);
    expect(idx.befund.dublettenVerworfen).toEqual([`${b.id} ← ${a.id}`]);
  });

  it('abweichender Text bei gleicher Nummer und gleichem Datum: KEINE Dublette (fachliche Frage)', () => {
    const verschieden: EntscheidSnapshot = {
      ...b,
      abschnitte: b.abschnitte.map((x, i) => (i === 0 ? { ...x, bloecke: [{ ...x.bloecke[0], text: `${x.bloecke[0].text} Ergänzung.` }, ...x.bloecke.slice(1)] } : x)),
    };
    expect(textgleicheDubletten([a, verschieden]).size).toBe(0);
  });

  it('ausgeliefert: BGG/42 führt VD.2025.54 genau einmal', () => {
    const keys = shard('BGG').proArtikel['42'].map((e: { key: string }) => e.key);
    expect(keys.filter((k: string) => k.startsWith('bs_appellationsgericht_VD.2025.54'))).toEqual(['bs_appellationsgericht_VD.2025.54']);
  });
});

describe('B-1: Datum — kein erfundenes 01.01., Flag wird durchgereicht, Warnzeichen ehrlich', () => {
  it('ausgeliefert: BES.2024.88 mit echtem Datum 2025-09-15, BEZ.2023.74 mit 2024-09-19', () => {
    const doks = Object.values<{ zitierung: string; datum: string }>(
      Object.assign({}, ...['STPO', 'STGB', 'SCHKG', 'ZPO', 'OR', 'BGG'].map((e) => shard(e).dokumente)),
    );
    const bes = doks.find((d) => d.zitierung.startsWith('Appellationsgericht BS BES.2024.88'));
    expect(bes?.datum).toBe('2025-09-15');
    const bez = doks.find((d) => d.zitierung.startsWith('Appellationsgericht BS BEZ.2023.74'));
    expect(bez?.datum).toBe('2024-09-19');
  });

  it('Generator: datumUnbekannt wird in Kante und Kopf durchgereicht und steht am Ende der Klasse', () => {
    const echt = snap('kanton/BS/bs_appellationsgericht/VD.2025.54.json');
    const ohne: EntscheidSnapshot = { ...echt, id: 'kanton/BS/bs_appellationsgericht/VD.2020.1', nummer: 'VD.2020.1', datum: '2030-01-01', datumUnbekannt: true };
    const idx = bau([ohne, echt]);
    const k = idx.proArtikel.get('BGG/42')!;
    // Ohne Flag stünde der «2030-01-01»-Platzhalter als jüngstes Datum ZUERST.
    expect(k.map((x) => x.key)).toEqual(['bs_appellationsgericht_VD.2025.54', 'bs_appellationsgericht_VD.2020.1']);
    expect(k[1].datumUnbekannt).toBe(true);
    expect(k[0].datumUnbekannt).toBeUndefined();
    const s = baueBezugsShards(idx, '2026-09-23').get('BGG')!;
    expect(s.dokumente['bs_appellationsgericht_VD.2020.1'].datumUnbekannt).toBe(true);
    expect('datumUnbekannt' in s.dokumente['bs_appellationsgericht_VD.2025.54']).toBe(false);
  });

  it('kantonaler Platzhalter YYYY-01-01 ⇒ Präzision unbekannt, nie «revidiert»', () => {
    expect(entscheidPraezision('2024-01-01', 'bs_appellationsgericht')).toBe('unbekannt');
    expect(entscheidPraezision('2024-01-01', 'kantonal')).toBe('unbekannt');
    expect(entscheidPraezision('2025-09-15', 'bs_appellationsgericht')).toBe('tag');
    const rev = { iso: '2024-07-01', as: 'AS 2023 1' };
    expect(klassifiziereFassungsBezug(entscheidDatum('2024-01-01', 'kantonal'), rev)).toBe('unbekannt');
    expect(klassifiziereFassungsBezug(entscheidDatum('2025-09-15', 'kantonal'), rev)).toBe('gleich');
    // Bundesgericht unverändert: BGE-Bandjahr bleibt 'bandjahr', bger-Datum 'tag'.
    expect(entscheidPraezision('1995-01-01', 'bge')).toBe('bandjahr');
    expect(entscheidPraezision('1995-01-01', 'bger')).toBe('tag');
  });
});
