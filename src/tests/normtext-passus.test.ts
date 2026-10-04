import { describe, it, expect } from 'vitest';
import { parsePassus, textFragment, artikelLabelKurz } from '../lib/normtext/passus';

describe('parsePassus', () => {
  it('liest Artikel-Token und Absatz aus einem OR-Zitat', () => {
    expect(parsePassus('Art. 335c Abs. 1 OR')).toEqual({ artikelToken: '335_c', absatz: '1' });
  });
  it('liest Paragraf + Absatz (kantonal)', () => {
    expect(parsePassus('§ 4 Abs. 1')).toEqual({ artikelToken: '4', absatz: '1' });
  });
  it('ohne Absatz → absatz null', () => {
    expect(parsePassus('Art. 96 ZPO')).toEqual({ artikelToken: '96', absatz: null });
  });
  it('lit.-Angabe wird als eigene Verfeinerung (lit) erkannt', () => {
    expect(parsePassus('Art. 6 Abs. 1 lit. h StG')).toEqual({ artikelToken: '6', absatz: '1', lit: 'h' });
  });
  it('Bst.-Angabe (Synonym für lit.) wird als lit erkannt', () => {
    expect(parsePassus('§ 3 Abs. 1 Bst. a')).toEqual({ artikelToken: '3', absatz: '1', lit: 'a' });
  });
  it('Ziff.-Angabe wird als ziff erkannt', () => {
    expect(parsePassus('§ 11 Ziff. 17')).toEqual({ artikelToken: '11', absatz: null, ziff: '17' });
  });
  // B3 (Befund-Runde #1251): lat. Suffix an der Ziffer bleibt vollständig («Ziff. 1bis» war «1b»);
  // echte Buchstaben-Ziffern («3b», «5a») bleiben unverändert.
  it('Ziff. mit lat. Suffix «1bis»/«2ter» bleibt vollständig (kein «1b»/«2t»)', () => {
    expect(parsePassus('Art. 187 Ziff. 1bis StGB')).toEqual({ artikelToken: '187', absatz: null, ziff: '1bis' });
    expect(parsePassus('Art. 305bis Ziff. 1bis StGB')).toEqual({ artikelToken: '305_bis', absatz: null, ziff: '1bis' });
    expect(parsePassus('Art. 5 Ziffer 2ter OR')).toEqual({ artikelToken: '5', absatz: null, ziff: '2ter' });
  });
  it('Ziff. mit Buchstaben-Suffix «3b» bleibt «3b»', () => {
    expect(parsePassus('Art. 5 Ziff. 3b OR')).toEqual({ artikelToken: '5', absatz: null, ziff: '3b' });
    expect(parsePassus('Art. 187 Ziff. 1 StGB')).toEqual({ artikelToken: '187', absatz: null, ziff: '1' });
  });
  // B2: lateinische Absatz-Suffixe (bis/ter/…) dürfen nicht verstümmelt werden
  // («Abs. 1bis» wurde früher zu «1b»).
  it('Absatz mit lat. Suffix «1bis» bleibt vollständig (B2 — kein «1b»)', () => {
    expect(parsePassus('Art. 5 Abs. 1bis OR')).toEqual({ artikelToken: '5', absatz: '1bis' });
  });
  it('Absatz mit lat. Suffix «2ter» bleibt vollständig', () => {
    expect(parsePassus('Art. 5 Abs. 2ter OR')).toEqual({ artikelToken: '5', absatz: '2ter' });
  });
  // Bug-Audit 19.6.2026 (H5): ARTIKEL-Suffix bis/ter/… ohne Zwischenbuchstaben
  // («Art. 334bis») wurde zu «334_b» verstümmelt (das [a-z]? frass das «b»,
  // fehlende Wortgrenze). Muss vollständig «334_bis» bleiben.
  it('Artikel mit lat. Suffix «334bis» bleibt vollständig (H5 — kein «334_b»)', () => {
    expect(parsePassus('Art. 334bis ZGB')).toEqual({ artikelToken: '334_bis', absatz: null });
    expect(parsePassus('Art. 269ter StPO')).toEqual({ artikelToken: '269_ter', absatz: null });
    expect(parsePassus('Art. 335c OR')).toEqual({ artikelToken: '335_c', absatz: null });
  });
  // B3: «litera a» darf nicht als lit «e» (Match mitten im Wort «litera»)
  // fehlinterpretiert werden — Schlüsselwort braucht Wortgrenze/Punkt.
  it('«litera a» liefert KEIN fälschliches lit «e» (B3 — Wortgrenze)', () => {
    const p = parsePassus('Art. 6 litera a OR')!;
    expect(p.lit).not.toBe('e');
  });
  it('echtes «lit. a» wird weiterhin erkannt (B3 — kein Regress)', () => {
    expect(parsePassus('Art. 6 Abs. 1 lit. a OR')).toEqual({ artikelToken: '6', absatz: '1', lit: 'a' });
  });
  it('lit ohne Angabe bleibt weggelassen (Bestandskompat. — keine leeren Felder)', () => {
    const p = parsePassus('Art. 336 OR')!;
    expect(p).toEqual({ artikelToken: '336', absatz: null });
    expect('lit' in p).toBe(false);
    expect('ziff' in p).toBe(false);
  });
  it('kein Artikel im Text → null', () => {
    expect(parsePassus('siehe oben')).toBeNull();
  });
});

describe('artikelLabelKurz', () => {
  it('§ mit Abs./Ziff. → nur «§ N» (FIX 2)', () => {
    expect(artikelLabelKurz('§ 13 Abs. 1 Ziff. 1')).toBe('§ 13');
  });
  it('Art. mit Klammer-Verweis → nur «Art. N»', () => {
    expect(artikelLabelKurz('Art. 36 (Art. 38 vereinfacht)')).toBe('Art. 36');
  });
  it('§ mit Abs./lit./Erlass-Klammer → nur «§ N»', () => {
    expect(artikelLabelKurz('§ 24 Abs. 1 lit. a GT (BGS 615.11)')).toBe('§ 24');
  });
  it('führende Erlass-Nr. vor dem § ignoriert → «§ N»', () => {
    expect(artikelLabelKurz('211.433 § 15 Abs. 1 Ziff. 1')).toBe('§ 15');
  });
  it('schlankes Bund-Label bleibt unverändert', () => {
    expect(artikelLabelKurz('Art. 335c')).toBe('Art. 335c');
  });
  it('lat. Suffix (bis/ter) wird mitgenommen', () => {
    expect(artikelLabelKurz('Art. 334bis Abs. 2 OR')).toBe('Art. 334bis');
  });
  it('kleingeschriebenes «art» → kanonisch «Art.»', () => {
    expect(artikelLabelKurz('art 9 al. 2')).toBe('Art. 9');
  });
  it('ohne matchbaren Designator → roh zurück (defensiv)', () => {
    expect(artikelLabelKurz('Anhang Ziff. 3')).toBe('Anhang Ziff. 3');
  });
});

describe('textFragment', () => {
  it('baut ein gekürztes #:~:text=-Fragment aus den ersten Wörtern', () => {
    expect(textFragment('Der Arbeitgeber kann das Arbeitsverhältnis nicht kündigen, solange …'))
      .toBe('#:~:text=Der%20Arbeitgeber%20kann%20das%20Arbeitsverh%C3%A4ltnis%20nicht');
  });
});
