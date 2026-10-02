import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  bundStaffelung, fussnoteGruende, hatWortlautHauptklausel, inkraftEintraege,
  inkrafttretenJson, ladeArtikelSichten, staffelEntscheid, zeitleisteBeginn,
  type ArtikelSicht, type ErlassBasis, type InkrafttretenEintrag, type StaffelGrund,
} from '../../scripts/normtext/inkrafttreten-generieren.ts';

// W2·27-BUND-FERTIG — Kennzeichen «gestaffelt in Kraft» (Teil-Inkrafttreten).
// Fachlicher Hintergrund: das Abstract-`dateEntryInForce` ist bei allen 231 Bund-
// Erlassen eindeutig, taugt also nicht als Staffel-Signal; die Signale kommen aus
// der Fedlex-Zeitleiste, dem Wortlaut der Hauptklausel und ihren Fussnoten.

const art = (id: string, text: string, over: Partial<ArtikelSicht> = {}): ArtikelSicht =>
  ({ id, marginalie: [], text, fussnoten: [], ...over });

function sparqlFetch(bindings: Record<string, { value: string }>[]) {
  return (async () =>
    ({ ok: true, json: async () => ({ results: { bindings } }) }) as unknown as Response) as typeof fetch;
}
const wirft = (async () => { throw new Error('Netz weg'); }) as unknown as typeof fetch;

describe('Wortlaut-Hauptklausel (Signal b2)', () => {
  it('MWSTG Art. 116: Vorbehalt im selben Satz — Datum «1. Januar» trennt den Satz nicht', () => {
    const a = [art('116', 'Dieses Gesetz untersteht dem fakultativen Referendum. Es tritt unter Vorbehalt von Absatz 3 am 1. Januar 2010 in Kraft. Der Bundesrat bestimmt das Inkrafttreten der Artikel 34 Absatz 3 und 78 Absatz 4')];
    expect(hatWortlautHauptklausel(a)).toBe(true);
  });
  it('«mit Ausnahme von Artikel N» (ASYLV1 Art. 56) zählt', () => {
    expect(hatWortlautHauptklausel([art('56', 'Diese Verordnung tritt mit Ausnahme von Artikel 21 am 1. Oktober 1999 in Kraft.')])).toBe(true);
  });
  it('«Der Bundesrat bestimmt das Inkrafttreten» allein (ZPO Art. 408, KVG Art. 107) ist KEIN Signal', () => {
    expect(hatWortlautHauptklausel([art('408', 'Dieses Gesetz untersteht dem fakultativen Referendum. Der Bundesrat bestimmt das Inkrafttreten.')])).toBe(false);
  });
  it('eine einfache Hauptklausel ohne Vorbehalt ist kein Signal (BV Art. 195)', () => {
    expect(hatWortlautHauptklausel([art('195', 'Die Verfassung tritt am 1. Januar 2000 in Kraft.')])).toBe(false);
  });
  it('Schlusstitel-Zeilen vergangener Revisionen (disp_*) zählen nicht', () => {
    expect(hatWortlautHauptklausel([art('disp_u2_art_4', 'Diese Änderung tritt unter Vorbehalt von Absatz 2 am 1. Januar 2020 in Kraft.')])).toBe(false);
  });
  it('Vorbehalt in einem ANDEREN Satz als «in Kraft» zählt nicht', () => {
    expect(hatWortlautHauptklausel([art('9', 'Der Bund erlässt Vorschriften unter Vorbehalt kantonaler Zuständigkeit. Dieses Gesetz tritt am 1. Januar 2020 in Kraft.')])).toBe(false);
  });
});

describe('Fussnoten (Signale a und a2)', () => {
  const klausel = (fn: string[]) => art('154', 'Dieses Gesetz tritt am 1. Januar 1948 in Kraft.', { marginalie: ['Inkrafttreten und Vollzug'], fussnoten: fn });

  it('a: Teildatum-Fussnote am Inkrafttretens-Artikel (AHVG Fn 472)', () => {
    const g = fussnoteGruende([klausel(['Die Art. 9, Abs. 4, 17 und 109 traten am 1. Aug. 1947 in Kraft (BRB vom 28. Juli 1947).'])]);
    expect(g).toEqual(['fussnote-teildatum']);
  });
  it('a: dieselbe Fussnote an einem ANDEREN Artikel zählt nicht (AVIG Art. 22a)', () => {
    const g = fussnoteGruende([art('22_a', 'Text.', { fussnoten: ['Dieser Abs. tritt erst am 1. Juli 1997 in Kraft (siehe AS 1997 60).'] })]);
    expect(g).toEqual([]);
  });
  it('a: «in Kraft seit …» (Fassungs-Vermerk) ist kein Teildatum', () => {
    expect(fussnoteGruende([klausel(['Fassung gemäss Ziff. I des BG vom 24. Juni 1977, in Kraft seit 1. Jan. 1979.'])])).toEqual([]);
  });
  it('a2: Inkraftsetzungs-V auch an normalem Artikel (UVG Art. 68), KVG/FIDLEG-Form', () => {
    expect(fussnoteGruende([art('68', 'Text.', { fussnoten: ['Siehe auch Art. 2 der V vom 20. Sept. 1982 über die Inkraftsetzung und Einführung des BG über die Unfallversicherung (AS 1982 1724).'] })])).toEqual(['fussnote-inkraftsetzungs-v']);
    expect(fussnoteGruende([art('107', 'Text.', { fussnoten: ['Art. 1 der V vom 12. April 1995 über die Inkraftsetzung und Einführung des BG vom 18. März 1994 über die Krankenversicherung (AS 1995 1367).'] })])).toEqual(['fussnote-inkraftsetzungs-v']);
    expect(fussnoteGruende([art('96', 'Text.', { fussnoten: ['V vom 6. Nov. 2019 über die abschliessende Inkraftsetzung des Finanzinstitutsgesetzes (AS 2019 4631).'] })])).toEqual(['fussnote-inkraftsetzungs-v']);
  });
  it('a2: Änderungs-Vermerk «Fassung gemäss … Inkraftsetzung» (VGG Art. 4) zählt nicht', () => {
    expect(fussnoteGruende([art('4', 'Text.', { fussnoten: ['Fassung gemäss Art. 2 der V vom 1. März 2006 über die Inkraftsetzung des Bundesgerichtsgesetzes (AS 2006 1205).'] })])).toEqual([]);
  });
});

describe('staffelEntscheid / Zeitleiste — fail-closed', () => {
  const ohneText: ArtikelSicht[] = [art('1', 'Text.')];

  it('erste Konsolidierung VOR dem Ur-Datum ⇒ gestaffelt (SVG: 1959-08-25 < 1960-01-01)', () => {
    expect(staffelEntscheid({ urDatum: '1960-01-01', zeitleisteErste: '1959-08-25', artikel: ohneText }))
      .toEqual({ gestaffelt: true, gestaffeltGrund: ['fedlex-zeitleiste'] });
  });
  it('erste Konsolidierung = Ur-Datum ⇒ nicht gestaffelt (OR)', () => {
    expect(staffelEntscheid({ urDatum: '1912-01-01', zeitleisteErste: '1912-01-01', artikel: ohneText }))
      .toEqual({ gestaffelt: false, gestaffeltGrund: [] });
  });
  it('Zeitleiste unbelegt ⇒ gestaffelt, Grund «unbekannt»', () => {
    expect(staffelEntscheid({ urDatum: '1912-01-01', zeitleisteErste: null, artikel: ohneText }))
      .toEqual({ gestaffelt: true, gestaffeltGrund: ['unbekannt'] });
  });
  it('Ur-Datum fehlt ⇒ gestaffelt, Grund «unbekannt»', () => {
    expect(staffelEntscheid({ urDatum: null, zeitleisteErste: '1912-01-01', artikel: ohneText }).gestaffeltGrund).toEqual(['unbekannt']);
  });
  it('Normtext nicht lesbar ⇒ gestaffelt, Grund «unbekannt»', () => {
    expect(staffelEntscheid({ urDatum: '1912-01-01', zeitleisteErste: '1912-01-01', artikel: null }).gestaffeltGrund).toEqual(['unbekannt']);
  });
  it('positives Signal verdrängt «unbekannt» (Gründe bleiben sachlich)', () => {
    const r = staffelEntscheid({ urDatum: '1960-01-01', zeitleisteErste: null, artikel: [art('56', 'Diese Verordnung tritt mit Ausnahme von Artikel 21 am 1. Oktober 1999 in Kraft.')] });
    expect(r.gestaffeltGrund).toEqual(['wortlaut-hauptklausel']);
  });

  it('zeitleisteBeginn: Netzfehler wirft nicht, lässt die ELI unbelegt', async () => {
    const m = await zeitleisteBeginn(['cc/27/317_321_377'], wirft);
    expect(m.size).toBe(0);
  });
  it('zeitleisteBeginn: leere Antwort ⇒ unbelegt; Treffer ⇒ Datum', async () => {
    expect((await zeitleisteBeginn(['cc/27/317_321_377'], sparqlFetch([]))).size).toBe(0);
    const m = await zeitleisteBeginn(['cc/27/317_321_377'], sparqlFetch([
      { abstract: { value: 'https://fedlex.data.admin.ch/eli/cc/27/317_321_377' }, erste: { value: '1912-01-01' } },
    ]));
    expect(m.get('cc/27/317_321_377')).toBe('1912-01-01');
  });

  const basis: ErlassBasis = { key: 'OR', sr: '220', ebene: 'bund', status: 'snapshot', quelleUrl: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/de' };
  it('bundStaffelung bei totalem Netzausfall: jeder Erlass gestaffelt/unbekannt, nie false', async () => {
    const st = await bundStaffelung([basis], { OR: { datum: '1912-01-01', quelle: 'fedlex' } }, wirft, () => [art('1', 'Text.')]);
    expect(st.OR).toEqual({ gestaffelt: true, gestaffeltGrund: ['unbekannt'] });
  });
  it('inkraftEintraege: JEDER Erlass trägt das Feld, auch ohne Ur-Datum und ohne Staffel-Auskunft', () => {
    const e = inkraftEintraege([basis, { ...basis, key: 'X' }], { OR: { datum: '1912-01-01', quelle: 'fedlex' } }, {});
    for (const k of ['OR', 'X']) {
      expect(typeof e[k].gestaffelt, k).toBe('boolean');
      expect(Array.isArray(e[k].gestaffeltGrund), k).toBe(true);
    }
    expect(e.X.datum).toBeUndefined();
    expect(e.X.gestaffelt).toBe(true);
  });
  it('inkrafttretenJson bleibt sortiert und deterministisch mit den neuen Feldern', () => {
    const j = inkrafttretenJson({ B: { datum: '2000-01-01', quelle: 'fedlex', gestaffelt: false, gestaffeltGrund: [] }, A: { quelle: 'fedlex', gestaffelt: true, gestaffeltGrund: ['unbekannt'] } });
    expect(j.indexOf('"A"')).toBeLessThan(j.indexOf('"B"'));
    expect(j.endsWith('}\n')).toBe(true);
  });
});

describe('Korpus — inkrafttreten.json (alle Bund-Erlasse)', () => {
  const sidecar = JSON.parse(readFileSync('public/normtext/inkrafttreten.json', 'utf8')) as Record<string, InkrafttretenEintrag>;
  const register = JSON.parse(readFileSync('public/normtext/register.json', 'utf8')) as
    { erlasse: { key: string; ebene: string; status: string; inkraftGestaffelt?: boolean }[] };
  const bundSnaps = register.erlasse.filter((e) => e.ebene === 'bund' && e.status === 'snapshot');
  const GRUENDE: StaffelGrund[] = ['fedlex-zeitleiste', 'wortlaut-hauptklausel', 'fussnote-teildatum', 'fussnote-inkraftsetzungs-v', 'unbekannt'];

  it('KEIN Bund-Snapshot ohne explizites Feld; Gründe ⇔ gestaffelt; nur bekannte Gründe', () => {
    expect(bundSnaps.length).toBeGreaterThanOrEqual(227);
    for (const e of bundSnaps) {
      const s = sidecar[e.key];
      expect(s, e.key).toBeDefined();
      expect(typeof s.gestaffelt, e.key).toBe('boolean');
      expect(Array.isArray(s.gestaffeltGrund), e.key).toBe(true);
      expect(s.gestaffelt, e.key).toBe(s.gestaffeltGrund.length > 0);
      for (const g of s.gestaffeltGrund) expect(GRUENDE, `${e.key}: ${g}`).toContain(g);
    }
  });

  it('gestaffelt: SVG, FINMAG, KVG, MWSTG, ZGB, STGB — nicht gestaffelt: OR, BV, ZPO', () => {
    for (const k of ['SVG', 'FINMAG', 'KVG', 'MWSTG', 'ZGB', 'STGB']) expect(sidecar[k].gestaffelt, k).toBe(true);
    for (const k of ['OR', 'BV', 'ZPO']) expect(sidecar[k].gestaffelt, k).toBe(false);
  });

  it('Gründe der Belegfälle (Wortlaut/Fussnote/Zeitleiste)', () => {
    expect(sidecar.SVG.gestaffeltGrund).toEqual(['fedlex-zeitleiste']);
    expect(sidecar.MWSTG.gestaffeltGrund).toEqual(['wortlaut-hauptklausel', 'fussnote-teildatum']);
    expect(sidecar.KVG.gestaffeltGrund).toEqual(['fussnote-inkraftsetzungs-v']);
    expect(sidecar.FIDLEG.gestaffeltGrund).toEqual(['fussnote-inkraftsetzungs-v']);
    expect(sidecar.AHVG.gestaffeltGrund).toEqual(['fedlex-zeitleiste', 'wortlaut-hauptklausel', 'fussnote-teildatum']);
  });

  it('Normtext-Signale sind aus den Shards REPRODUZIERBAR (Sidecar == aktuelle Regeln)', () => {
    // Fängt jede Regel-Änderung im Generator, die nicht mit neuem Sidecar-Lauf
    // einhergeht (und umgekehrt): die Offline-Signale müssen dem Sidecar gleichen.
    for (const e of bundSnaps) {
      const artikel = ladeArtikelSichten(e.key);
      expect(artikel, e.key).not.toBeNull();
      const erwartet: StaffelGrund[] = [];
      if (hatWortlautHauptklausel(artikel!)) erwartet.push('wortlaut-hauptklausel');
      erwartet.push(...fussnoteGruende(artikel!));
      const gespeichert = sidecar[e.key].gestaffeltGrund.filter((g) => g !== 'fedlex-zeitleiste' && g !== 'unbekannt');
      expect(gespeichert, e.key).toEqual(erwartet);
    }
  });

  it('Projektion: register.inkraftGestaffelt == Sidecar (ein Ort, §5); Kanton ohne Feld', () => {
    for (const e of register.erlasse) {
      if (e.ebene === 'bund' && e.status === 'snapshot') expect(e.inkraftGestaffelt, e.key).toBe(sidecar[e.key].gestaffelt);
      if (e.ebene !== 'bund') expect(e.inkraftGestaffelt, e.key).toBeUndefined();
    }
  });
});
