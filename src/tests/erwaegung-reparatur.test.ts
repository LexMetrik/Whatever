import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { normalisiereErwaegung, repariereErwaegungsBloecke } from '../../scripts/normtext/erwaegung-normalisieren';
import type { OclParagraph } from '../../scripts/normtext/adapter-typen';
import type { EntscheidBlock, EntscheidSnapshotDatei } from '../lib/rechtsprechung/typen';

// U-13 (plan/FEHLERBESTAND.md): BGE 152 III 205 (= Urteil 4A_129/2024 vom 15.9.2025). OCL setzt die Zahl nach «n o» in
// Literatur-Zitaten («n° 5 ad art. 34 CL», «n° 10 ad art. 45 …») als Erwägungs-Nummer (Phantom «E. 5», «E. 10», hinter E. 4.7
// bzw. am Ende eingehängt), und die Haupt-Überschriften «5.» und «6.» bleiben als Absatz im Text von E. 4.7 / E. 5.4 stehen.
// Beleg: OCL /structure/bger_4A_129_2024 (abgerufen 11.10.2026) und der amtliche Sammlungs-Auszug (clir, `auszugAbschnitte`),
// der E. 4.3 mit «… n° 10 ad art. 45 règlement Bruxelles I bis).» enden lässt.

const p = (e: string, text: string): OclParagraph => ({ e_number: e, text } as OclParagraph);
const marken = (b: EntscheidBlock[]) => b.map((x) => x.marke);

describe('normalisiereErwaegung — Zitat-Fragmente (a) und verschluckte Überschriften (b)', () => {
  const paras = [
    p('4.3', 'Saisie … Kommentar, 2\n\ne\néd. 2019, n\n\no'),
    p('4.7', 'En l\'espèce … rejeté.\n\n5.\n\nDans un second moyen, la recourante invoque …'),
    p('5', 'ad\nart. 34 CL\n; CHRISTIAN KOLLER … 5\n\ne\néd. 2021, n\n\no'),
    p('5.1', 'En vertu du principe de l\'épuisement des griefs …'),
    p('5.4', 'Il ne ressort pas clairement … tenu compte.\n\n6.\n\nAu vu de ce qui précède, le recours sera rejeté.'),
    p('10', 'ad art. 45 règlement Bruxelles I bis).'),
  ];
  const roh = paras.map((x): EntscheidBlock => ({ marke: null, text: String(x.text) }));
  const out = normalisiereErwaegung(paras, roh);

  it('Phantom «E. 5» (Fragment) und «E. 10» sind weg, E. 5 und E. 6 sind echte Überschriften-Blöcke', () => {
    expect(marken(out)).toEqual(['E. 4.3', 'E. 4.7', 'E. 5', 'E. 5.1', 'E. 5.4', 'E. 6']);
    expect(out.find((b) => b.marke === 'E. 5')!.text).toBe('Dans un second moyen, la recourante invoque …');
    expect(out.find((b) => b.marke === 'E. 6')!.text).toBe('Au vu de ce qui précède, le recours sera rejeté.');
  });
  it('die Fragmente hängen an ihrem Ursprung (E. 4.3), Zahl wieder eingefügt', () => {
    const t = out.find((b) => b.marke === 'E. 4.3')!.text;
    expect(t).toMatch(/n\n\no 5 ad art\. 34 CL; CHRISTIAN KOLLER/);
    expect(t).toMatch(/n\n\no 10 ad art\. 45 règlement Bruxelles I bis\)\.$/);
  });
  it('Wortinvariante: als Wortmenge geht nichts verloren und nichts kommt dazu (ausser den wieder eingefügten e_number-Zahlen 5 und 10)', () => {
    const wort = (t: string) => t.replace(/\s+([;.,)])/g, '$1').split(/\s+/).filter(Boolean).sort();
    const vorher = wort(paras.map((x) => String(x.text)).join(' ').replace(/(?:^|\s)\d{1,2}\.(?=\s)/g, ' '));
    const nachher = wort(out.map((b) => b.text).join(' '));
    const zusatz = nachher.filter((w) => !vorher.includes(w) || nachher.filter((x) => x === w).length > vorher.filter((x) => x === w).length);
    expect(vorher.filter((w) => !nachher.includes(w))).toEqual([]);
    expect([...new Set(zusatz)].sort()).toEqual(['10', '5']);   // genau die beiden aus e_number wieder eingefügten Zahlen
  });
  it('idempotent', () => {
    expect(repariereErwaegungsBloecke(out)).toEqual(out);
  });
});

describe('repariereErwaegungsBloecke — fail-closed', () => {
  const b = (marke: string | null, text: string): EntscheidBlock => ({ marke, text });
  it('ein Fragment ohne offenen «n o»-Block bleibt unverändert', () => {
    const e = [b('E. 1', 'Text.'), b('E. 2', 'ad art. 5 ZGB')];
    expect(repariereErwaegungsBloecke(e)).toEqual(e);
  });
  it('Überschrift nur, wenn sie der nächste Haupt-Rang ist und kein Block mit der Marke existiert', () => {
    const nichtNaechster = [b('E. 2.1', 'A.\n\n5.\n\nText folgt.')];
    expect(repariereErwaegungsBloecke(nichtNaechster)).toEqual(nichtNaechster);
    const schonDa = [b('E. 2.1', 'A.\n\n3.\n\nText folgt.'), b('E. 3', 'Echter dritter Block.')];
    expect(repariereErwaegungsBloecke(schonDa)).toEqual(schonDa);
    const ohneFolgetext = [b('E. 2.1', 'A.\n\n3.')];
    expect(repariereErwaegungsBloecke(ohneFolgetext)).toEqual(ohneFolgetext);
  });
  it('markenlose Blöcke bleiben unberührt', () => {
    const e = [b(null, 'A.\n\n2.\n\nText folgt.')];
    expect(repariereErwaegungsBloecke(e)).toEqual(e);
  });
});

describe('Korpus BGE 152 III 205', () => {
  const e = (JSON.parse(readFileSync(join(process.cwd(), 'public/rechtsprechung/bund/bge/152_III_205.json'), 'utf8')) as EntscheidSnapshotDatei).eintraege[0];
  const erw = e.abschnitte.find((a) => a.typ === 'erwaegung')!.bloecke;
  it('keine Phantom-Erwägung «E. 10», E. 6 ist ein eigener Block, E. 4.3 endet wie der amtliche Auszug', () => {
    const m = marken(erw);
    expect(m).not.toContain('E. 10');
    expect(m).toEqual(expect.arrayContaining(['E. 4.7', 'E. 5', 'E. 5.1', 'E. 5.4', 'E. 6']));
    expect(erw.find((x) => x.marke === 'E. 6')!.text).toMatch(/^Au vu de ce qui précède, le recours sera rejeté/);
    const amtlich = e.auszugAbschnitte!.find((a) => a.typ === 'erwaegung')!.bloecke.find((x) => x.marke === 'E. 4.3')!.text;
    expect(amtlich).toMatch(/n° 10 ad art\. 45 règlement Bruxelles I bis\)\.$/);
    expect(erw.find((x) => x.marke === 'E. 4.3')!.text).toMatch(/n\n\no 10 ad art\. 45 règlement Bruxelles I bis\)\.$/);
  });
});
