// ── QS-KORPUS 25.9.2026 · sprachübergreifend mehrdeutige Fedlex-Kürzel ──────
//
// Fedlex vergibt dieselbe Buchstabenfolge in verschiedenen Sprachen an
// verschiedene Erlasse (SPARQL jolux:titleShort über alle ConsolidationAbstracts,
// Abruf 25.9.2026):
//   AIMP — ITA SR 351.1 (IRSG) · FRA SR 172.056.5 (IVöB, Beschaffung)
//   OCP  — FRA SR 832.104 (VKL) · ITA SR 922.01 (JSV, Jagd)
//   OS   — FRA/ITA SR 961.011 (AVO) UND FRA/ITA SR 961.05; im Korpus aber
//          ausschliesslich «OS LCart» = SVKG (SR 251.5), Kartellsanktionen
// Stufe 1 (e3f874779-Nachverdikt): alle drei total gesperrt — nahm aber
// bund/bstger/RR_2026_46 (it, Rechtshilfe) sein IRSG. Stufe 2 (Wurzel-Fix,
// dieser Test): AIMP/OCP SPRACHGEBUNDEN (SPRACH_HOMONYME), aufgelöst nur je
// Textstück mit eindeutiger Sprache; OS bleibt total gesperrt (Homonym
// innerhalb derselben Sprache). Die Fundstellen unten sind ECHTE Snapshots.
// ROT ZU BEKOMMEN (§6.7): in `sprachStueckeVon` die Sprache der Sammelteile
// (`spracheDerSammelteile`) durch `snap.sprache` ersetzen (147_II_264 bekäme
// IRSG aus der FR-Regeste) oder AIMP wieder in ABK_AUSSCHLUSS setzen (RR_2026_46
// verlöre IRSG).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  ABK_AUSSCHLUSS, SPRACH_HOMONYME, normKeyFuerAbk, sprachAliasKey,
  normKeysVonSnapshot, artikelSchluesselVonSnapshot, sperrEntfernteNormKeys,
  fremdDefinierteKeys, spracheDerSammelteile,
} from '../../scripts/normtext/entscheide-mapping';
import type { EntscheidSnapshot } from '../lib/rechtsprechung/typen';

const echt = (pfad: string): EntscheidSnapshot =>
  JSON.parse(readFileSync(join(process.cwd(), 'public', 'rechtsprechung', `${pfad}.json`), 'utf8')).eintraege[0];

function snap(o: Partial<EntscheidSnapshot> = {}): EntscheidSnapshot {
  return {
    id: 'bund/bstger/TEST', gericht: 'bstger', gerichtName: 'Bundesstrafgericht',
    gerichtstyp: 'bundesstrafgericht', kanton: 'CH', abteilung: null, nummer: 'TEST',
    bgeReferenz: null, zitierung: 'TEST', datum: '2026-05-19',
    sprache: 'it', leitcharakter: 'routine', sachgebiet: 'strafrecht', legalArea: null,
    rubrum: null, regeste: null, regesteAmtlich: false,
    abschnitte: [], dispositivOrders: [], zitierteNormen: [], normKeys: [],
    zitierteEntscheide: [], bestand: 'snapshot', kuratierung: 'maschinell',
    quelle: 'opencaselaw', quelleUrl: 'https://bstger.weblaw.ch', abgerufen: '2026-09-25',
    fassungsToken: 'h', sha: 's',
    ...o,
  };
}
const erw = (text: string): EntscheidSnapshot['abschnitte'] =>
  [{ typ: 'erwaegung', bloecke: [{ marke: '1.', text }] }];
const irsgArtikel = (s: EntscheidSnapshot) => [...artikelSchluesselVonSnapshot(s)].filter((k) => k.startsWith('IRSG/')).sort();

describe('Tabelle: AIMP/OCP sprachgebunden, OS total gesperrt', () => {
  it('AIMP → IRSG nur in it, OCP → VKL nur in fr; sprachungebunden nie', () => {
    expect([...SPRACH_HOMONYME.keys()]).toEqual(['AIMP', 'OCP']);
    for (const t of ['AIMP', 'OCP', 'OS']) expect(normKeyFuerAbk(t), t).toBeNull();
    expect(sprachAliasKey('AIMP', 'it')).toBe('IRSG');
    expect(sprachAliasKey('AIMP', 'fr')).toBeNull();
    expect(sprachAliasKey('AIMP', 'de')).toBeNull();
    expect(sprachAliasKey('OCP', 'fr')).toBe('VKL');
    expect(sprachAliasKey('OCP', 'it')).toBeNull();
    expect(sprachAliasKey('AIMP', null)).toBeNull();
    expect(ABK_AUSSCHLUSS.has('OS')).toBe(true);
    expect(sprachAliasKey('OS', 'fr')).toBeNull();
  });
});

describe('echte Fundstellen', () => {
  it('bund/bstger/RR_2026_46 (it, Rechtshilfe, «art. 55 AIMP») trägt IRSG', () => {
    const s = echt('bund/bstger/RR_2026_46');
    expect(s.sprache).toBe('it');
    expect(spracheDerSammelteile(s)).toBe('it');
    expect(normKeysVonSnapshot(s)).toContain('IRSG');
    expect(irsgArtikel(s)).toEqual(expect.arrayContaining(['IRSG/55', 'IRSG/12', 'IRSG/21']));
  });

  it('Beschaffungs-BGE mit FR-«AIMP» (= IVöB) bekommen KEIN IRSG', () => {
    for (const id of ['bund/bge/152_II_211', 'bund/bge/152_II_325', 'bund/bge/151_II_81', 'bund/bge/150_II_105', 'bund/bge/151_I_113']) {
      const s = echt(id);
      expect(normKeysVonSnapshot(s), id).not.toContain('IRSG');
      expect(irsgArtikel(s), id).toEqual([]);
    }
  });

  it('trilingualer BGE 147_II_264 (it): «Art. 8 Abs. 1 AIMP» in statutes stammt aus der FR-Regeste — gesperrt', () => {
    const s = echt('bund/bge/147_II_264');
    expect(s.sprache).toBe('it');
    expect(s.zitierteNormen).toContain('Art. 8 Abs. 1 AIMP');
    expect(spracheDerSammelteile(s)).toBeNull();
    expect(normKeysVonSnapshot(s)).not.toContain('IRSG');
  });

  it('BGE 150_IV_201 (Rechtshilfe): die IT-Regeste-Fassung allein löst «AIMP» zu IRSG, die FR-Fassung von 152_II_211 nicht', () => {
    const rh = echt('bund/bge/150_IV_201');
    const nurIt = { ...rh, abschnitte: [], auszugAbschnitte: [], zitierteNormen: [],
      regeste: { ...rh.regeste!, text: '', sprachfassungen: rh.regeste!.sprachfassungen!.filter((f) => f.sprache === 'it') } };
    // Die IT-Fassung nennt das IRSG NUR als «AIMP» — der Key kann aus nichts anderem stammen.
    expect(JSON.stringify(nurIt.regeste.sprachfassungen)).not.toMatch(/\b(?:IRSG|EIMP)\b/);
    expect(normKeysVonSnapshot(nurIt)).toContain('IRSG');
    const be = echt('bund/bge/152_II_211');
    const nurFr = { ...be, abschnitte: [], auszugAbschnitte: [], zitierteNormen: [],
      regeste: { ...be.regeste!, text: '', sprachfassungen: be.regeste!.sprachfassungen!.filter((f) => f.sprache === 'fr') } };
    expect(normKeysVonSnapshot(nurFr)).not.toContain('IRSG');
  });

  it('OCP in it (152_II_196 Jagd, 150_IV_425 «OCP-CPM») bleibt ohne VKL', () => {
    for (const id of ['bund/bge/152_II_196', 'bund/bge/150_IV_425']) expect(normKeysVonSnapshot(echt(id)), id).not.toContain('VKL');
  });

  it('«OS LCart» im fr-Body (148_II_25) bleibt ohne AVO', () => {
    expect(normKeysVonSnapshot(echt('bund/bge/148_II_25'))).not.toContain('AVO');
  });
});

describe('Sprach-Zuordnung je Textstück', () => {
  it('fr-Body eines einsprachigen Entscheids: OCP → VKL, AIMP → nichts', () => {
    const s = snap({ sprache: 'fr', abschnitte: erw('Selon l\'art. 59 OCP et l\'art. 12 AIMP, le recours est rejeté.') });
    expect(normKeysVonSnapshot(s)).toContain('VKL');
    expect(normKeysVonSnapshot(s)).not.toContain('IRSG');
  });

  it('Body-Erkennung widerspricht snap.sprache ⇒ nicht eindeutig ⇒ kein Key', () => {
    const deutsch = 'Die Beschwerde ist gegen den Entscheid gerichtet, und das Gericht hat die Sache '
      + 'nicht geprüft, dass der Beschwerdeführer über die Frist durch die Behörde informiert wird '
      + 'und sich nach Art. 12 AIMP zur Sache äussert.';
    expect(normKeysVonSnapshot(snap({ sprache: 'it', abschnitte: erw(deutsch) }))).not.toContain('IRSG');
  });

  it('sperrEntfernteNormKeys: Alt-IRSG aus FR-«AIMP» fällt, IRSG aus it-«AIMP» bleibt', () => {
    const fr = snap({ sprache: 'fr', normKeys: ['IRSG'], abschnitte: erw('art. 44 al. 1 let. b AIMP') });
    expect(sperrEntfernteNormKeys(fr)).toEqual(['IRSG']);
    const it_ = snap({ sprache: 'it', normKeys: ['IRSG'], abschnitte: erw('art. 55 AIMP') });
    expect(sperrEntfernteNormKeys(it_)).toEqual([]);
  });
});

describe('fremdDefinierteKeys nutzt dieselbe Auflösung wie die Extraktion (§5)', () => {
  it('Gerichts-Kürzel «CV» (VRK) — anders definiert ⇒ gesperrt (Posten 25.9.2026)', () => {
    const s = snap({
      gericht: 'bger', gerichtstyp: 'bundesgericht', sprache: 'de',
      abschnitte: erw('Nach dem kantonalen Kaufrecht (Konvention zum Kaufrecht, CV) ist Art. 5 CV massgebend.'),
    });
    expect([...fremdDefinierteKeys(s)]).toContain('VRK');
  });

  it('it-«AIMP» mit fremdem Titel ⇒ IRSG gesperrt; fr-«AIMP» löst gar nicht erst auf', () => {
    const def = '(Konvention über die Beschaffung, AIMP)';
    expect([...fremdDefinierteKeys(snap({ sprache: 'it', abschnitte: erw(`Il ricorso secondo ${def} è respinto.`) }))]).toContain('IRSG');
    expect([...fremdDefinierteKeys(snap({ sprache: 'fr', abschnitte: erw(`Le recours selon ${def} est rejeté.`) }))]).toEqual([]);
  });
});
