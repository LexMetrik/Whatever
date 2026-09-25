// Amtlicher BGE-Sammlungs-Auszug aus bger.ch clir (QS-KORPUS 25.9.2026, Posten
// «BGE 152 I 2 mit amtlichem clir-Auszug aufnehmen»). Fixture: gekürzter echter
// clir-Auszug BGE 152 I 2 (DE-Seite, abgerufen 25.9.2026).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ersetzeKonflatiertenAuszug, parseClirAuszug } from '../../scripts/normtext/clir-auszug';
import type { EntscheidAbschnitt, EntscheidSnapshot } from '../lib/rechtsprechung/typen';

const FIX = readFileSync(join(__dirname, 'fixtures', 'clir-auszug-152-I-2-de.html'), 'utf8');
const texte = (a: EntscheidAbschnitt[] | null) => (a ?? []).flatMap((x) => x.bloecke.map((b) => b.text)).join('\n');

describe('parseClirAuszug — BGE 152 I 2 (clir, gekürzt)', () => {
  const a = parseClirAuszug(FIX, '152 I 2');

  it('liefert Sachverhalt + Erwägungen im Format des OCL-Pfads', () => {
    expect(a?.map((x) => x.typ)).toEqual(['sachverhalt', 'erwaegung']);
    expect(a?.[0].vollstaendig).toBe(true);
    expect(a?.[0].bloecke.map((b) => b.marke)).toEqual(['A.', 'B.', 'C.']);
    const erw = a?.[1].bloecke ?? [];
    expect(erw.map((b) => b.marke)).toEqual(['E. 4', 'E. 4.1', 'E. 4.5', 'E. 5']);
    expect(erw.map((b) => b.tiefe)).toEqual([1, 2, 2, 1]);
    expect(erw[0].text.startsWith('Der Anspruch auf rechtliches Gehör gemäss Art. 29 Abs. 2 BV dient')).toBe(true);
    // Folgeabsätze einer Erwägung hängen am Markenblock (wie die OCL-Auszüge: Leerzeichen).
    expect(erw[3].text.endsWith('in Art. 30 Abs. 2 lit. b VwVG geregelten Ausnahme für Einspracheverfahren.')).toBe(true);
    expect(erw[3].text).toContain('ursprüngliche Mangel geheilt. Zwar wiegt das vollständige Fehlen');
  });

  it('Seitenkopf-Leck: kein «BGE 152 I 2 S. n» im Text, Satz über den Seitenumbruch ganz', () => {
    expect(texte(a)).not.toMatch(/BGE\s+152\s+I\s+2\s+S\./);
    expect(texte(a)).toContain('auf das Rechtshilfeersuchen ein und ordnete die Sperrung');
  });

  it('Einleitung «Aus den Erwägungen:» und Rahmen-Überschriften sind kein Text', () => {
    expect(texte(a)).not.toContain('Aus den Erwägungen');
    expect(texte(a)).not.toMatch(/ab Seite \d/);
  });

  it('fremder Seitenkopf (Konflation in der Quelle) ⇒ null', () => {
    expect(parseClirAuszug(FIX.replace('BGE 152 I 2 S. 4', 'BGE 152 I 20 S. 4'), '152 I 2')).toBeNull();
  });

  it('Seitenkopf als Fliesstext statt Umbruch-Div ⇒ null (Leck-Falle)', () => {
    expect(parseClirAuszug(FIX.replace('Fraglich ist, ob dieser Mangel', 'BGE 152 I 2 S. 8 Fraglich ist, ob dieser Mangel'), '152 I 2')).toBeNull();
  });

  it('Umlaute: iso-8859-1-Bytes wie holeClirHtml dekodiert ⇒ identisch; falsch dekodiert ⇒ null', () => {
    const latin1 = Buffer.from(FIX, 'latin1');
    expect(parseClirAuszug(new TextDecoder('iso-8859-1').decode(latin1), '152 I 2')).toEqual(a);
    expect(texte(a)).toContain('Gehör');
    // Latin-1-Bytes als UTF-8 gelesen ⇒ Ersatzzeichen; UTF-8-Bytes als Latin-1 ⇒ Mojibake.
    expect(parseClirAuszug(new TextDecoder('utf-8').decode(latin1), '152 I 2')).toBeNull();
    expect(parseClirAuszug(new TextDecoder('iso-8859-1').decode(Buffer.from(FIX, 'utf8')), '152 I 2')).toBeNull();
  });

  it('fehlende Anker / Ende / Marken, falscher Titel ⇒ null', () => {
    expect(parseClirAuszug(FIX.replace('id="erwaegungen"', 'id="x"'), '152 I 2')).toBeNull();
    expect(parseClirAuszug(FIX.replace('<div class="box_bottom_2ndline">', '<div>'), '152 I 2')).toBeNull();
    expect(parseClirAuszug(FIX.replace(/id="consideration_[0-9.]+"/g, ''), '152 I 2')).toBeNull();
    expect(parseClirAuszug(FIX, '152 I 20')).toBeNull();
    expect(parseClirAuszug(FIX, null)).toBeNull();
  });

  it('Marke ≠ Anker, doppelte Marke oder Text vor der ersten Marke ⇒ null', () => {
    expect(parseClirAuszug(FIX.replace('id="consideration_4.1">4.1 ', 'id="consideration_4.1">4.2 '), '152 I 2')).toBeNull();
    expect(parseClirAuszug(FIX.replace('id="consideration_4.5">4.5 ', 'id="consideration_4.1">4.1 '), '152 I 2')).toBeNull();
    expect(parseClirAuszug(FIX.replace('Aus den Erwägungen:', 'Irgendein Satz.'), '152 I 2')).toBeNull();
  });
});

describe('ersetzeKonflatiertenAuszug', () => {
  const clir = parseClirAuszug(FIX, '152 I 2')!;
  const basis = (bodyText: string): EntscheidSnapshot => ({
    id: 'bund/bge/152_I_2', gericht: 'bge', gerichtName: 'Bundesgericht', gerichtstyp: 'bundesgericht',
    kanton: 'CH', abteilung: 'I', nummer: '152 I 2', bgeReferenz: '152 I 2', zitierung: 'BGE 152 I 2',
    datum: '2026-02-27', sprache: 'fr', leitcharakter: 'leitentscheid', sachgebiet: 'oeffentlich', legalArea: 'public',
    rubrum: { besetzung: 'fremd' } as EntscheidSnapshot['rubrum'],
    regeste: { text: 'Sperrung von Vermögenswerten (Art. 4 SRVG); Anspruch auf vorgängige Anhörung (Art. 29 Abs. 2 BV; Art. 30 VwVG).', quelle: 'opencaselaw' },
    regesteAmtlich: true,
    abschnitte: [{ typ: 'erwaegung', bloecke: [{ marke: null, text: bodyText }] }],
    dispositivOrders: ['fremd'], zitierteNormen: ['Art. 25 Abs. 3 EIMP'], normKeys: ['IRSG'],
    zitierteEntscheide: ['BGE 152 I 20'], bestand: 'snapshot', kuratierung: 'maschinell', quelle: 'opencaselaw',
    quelleUrl: 'https://search.bger.ch/x', abgerufen: '2026-09-25', fassungsToken: 'x', sha: 'alt',
  } as EntscheidSnapshot);
  const sprache = () => 'de' as const;

  it('ohne fremden Seitenkopf: dasselbe Objekt (byte-gleich für alle übrigen BGE)', () => {
    const b = basis('Eigener Text BGE 152 I 2 S. 5 weiter.');
    expect(ersetzeKonflatiertenAuszug(b, clir, sprache)).toBe(b);
  });

  it('ohne clir-Auszug: dasselbe Objekt (Guard verwirft dann wie bisher)', () => {
    const b = basis('Texte étranger BGE 152 I 20 S. 21 suite.');
    expect(ersetzeKonflatiertenAuszug(b, null, sprache)).toBe(b);
  });

  it('mit fremdem Seitenkopf: Body = clir-Auszug, Felder des vermischten Records geleert', () => {
    const r = ersetzeKonflatiertenAuszug(basis('Texte étranger BGE 152 I 20 S. 21 suite.'), clir, sprache)!;
    expect(r.abschnitte).toBe(clir);
    expect(r.sprache).toBe('de');
    expect(r.rubrum).toBeNull();
    expect(r.dispositivOrders).toEqual([]);
    expect(r.zitierteNormen).toEqual([]);
    expect(r.zitierteEntscheide).toEqual([]);
    expect(r.sha).not.toBe('alt');
    expect(r.normKeys).toContain('BV');
    expect(r.normKeys).not.toContain('IRSG');
  });
});
