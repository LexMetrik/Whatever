// EID-2 (W2·5d §12) — Verifizier-Deep-Links «amtliche Fassung an genau dieser Stelle».
//
// Der Builder erzeugt NUR Outbound-Links in ELI-Form (`quelleUrl#<eId>`, §12.4):
// nie Filestore, nie eigene Anker, nie ein toter/unpräziser Link (§8). Die EINE
// Wahrheit der Artikel-Fragmente ist die Generator-Ableitung (ankerZuToken,
// scripts/normtext/extrahiere-fedlex.ts) — der Paritäts-Sweep unten beweist,
// dass jedes ausgelieferte Fragment über ankerZuToken exakt auf das Snapshot-
// Token zurückführt (§5, Identität statt Substring).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { verifizierLinkArtikel, verifizierLinkSektion } from '../lib/normtext/verifikationslink';
import { baueGliederungsbaum, type StrukturMap } from '../lib/normtext/browse';
import { ankerZuToken } from '../../scripts/normtext/extrahiere-fedlex';
import type { NormSnapshot } from '../lib/normtext/typen';

type SnapshotDatei = { eintraege: NormSnapshot[] };
const lade = (p: string): SnapshotDatei =>
  JSON.parse(readFileSync(new URL(`../../public/normtext/${p}`, import.meta.url), 'utf8')) as SnapshotDatei;

const zgb = lade('bund/ZGB.json');
const or = lade('bund/OR.json');
const kkv = lade('bund/KKV.json');
const eintrag = (d: SnapshotDatei, token: string): NormSnapshot => {
  const e = d.eintraege.find((x) => x.artikel === token);
  if (!e) throw new Error(`Fixture-Eintrag ${token} fehlt`);
  return e;
};

const GELTEND = { aufgehoben: undefined } as const;

describe('verifizierLinkArtikel — echte Snapshot-Fälle (§7)', () => {
  it('ZGB 712_a («art_712_a»-Klasse: Buchstaben-Suffix mit Unterstrich VOR dem Suffix)', () => {
    const e = eintrag(zgb, '712_a');
    expect(verifizierLinkArtikel(e, GELTEND))
      .toBe('https://www.fedlex.admin.ch/eli/cc/24/233_245_233/de#art_712_a');
  });

  it('ZGB disp_u1_art_6_b_bis (Schlusstitel + bis-Suffix: Fragment trägt den «/» der Fedlex-eId)', () => {
    const e = eintrag(zgb, 'disp_u1_art_6_b_bis');
    expect(verifizierLinkArtikel(e, GELTEND))
      .toBe('https://www.fedlex.admin.ch/eli/cc/24/233_245_233/de#disp_u1/art_6_b_bis');
  });

  it('ZGB 28_d_28_f (Bereichs-Token «Art. 28d–28f» → EIN amtlicher Anker)', () => {
    const e = eintrag(zgb, '28_d_28_f');
    expect(verifizierLinkArtikel(e, GELTEND))
      .toBe('https://www.fedlex.admin.ch/eli/cc/24/233_245_233/de#art_28_d_28_f');
  });

  it('OR 335_c (dritter Haupttext-Beleg der Stichproben-Serie)', () => {
    const e = eintrag(or, '335_c');
    expect(verifizierLinkArtikel(e, GELTEND))
      .toBe('https://www.fedlex.admin.ch/eli/cc/27/317_321_377/de#art_335_c');
  });
});

describe('verifizierLinkArtikel — «__N»-Token mit eigenem amtlichem Namens-Anker (W2·27, Nebenfund #890)', () => {
  it('KKV 126_z__2 («Wesentliche Mängel»): quelleUrl trägt #ta126z → Deep-Link freigegeben', () => {
    // Live-Beleg 30.9.2026 (fedlex.admin.ch, Chromium): …/eli/cc/2006/859/de#ta126z landet am
    // 2. Vorkommen «Art. 126z tredecies» (top −237 px), das 1. liegt bei −3334 px.
    const e = eintrag(kkv, '126_z__2');
    expect(e.quelleUrl).toBe('https://www.fedlex.admin.ch/eli/cc/2006/859/de#ta126z');
    expect(verifizierLinkArtikel(e, GELTEND)).toBe('https://www.fedlex.admin.ch/eli/cc/2006/859/de#ta126z');
  });

  it('Korpus-Sweep: jede Freigabe eines «__N»-Tokens trägt einen amtlichen Namens-Anker (Positiv-Form); KKV 126_z__2 ist dabei', () => {
    const bund = ['KKV', 'ZGB', 'OR'].flatMap((n) => lade(`bund/${n}.json`).eintraege);
    const nToken = bund.filter((e) => /__\d+$/.test(e.artikel));
    expect(nToken.map((e) => e.artikel)).toContain('126_z__2'); // Sabotage-Schutz: nicht leer (§6.7b)
    let freigaben = 0;
    for (const e of nToken) {
      const url = verifizierLinkArtikel(e, GELTEND);
      if (url == null) continue;
      freigaben += 1;
      // Positiv-Form (unabhängiges Orakel, nicht der Produktiv-Regex): «a»+Nummer(+Buchstaben), ggf.
      // «t»-Präfixe, ggf. Bereichs-Wiederholung («a29a29f») — kein «_», kein «/»
      // (Empirie-Sweep über 3 171 <article> in ZGB/OR/KKV, 30.9.2026).
      expect(url.slice(url.indexOf('#') + 1)).toMatch(/^t*(?:a\d+[a-z]*)+$/);
    }
    expect(freigaben).toBeGreaterThan(0);
  });
});

describe('verifizierLinkArtikel — «__N» nur bei amtlichem Namens-Anker, nie bei Struktur-Basis-Anker (Positivliste, W2·27)', () => {
  const BASIS = 'https://www.fedlex.admin.ch/eli/cc/2006/859/de';
  const mit = (artikel: string, fragment: string): NormSnapshot => ({
    ...eintrag(kkv, '126_z__2'), artikel, quelleUrl: `${BASIS}#${fragment}`,
  });

  // Anhang-/Sektions-Pfad des Generators (scripts/normtext-snapshot.ts): bei «__N» wird der
  // Basis-Anker (= ERSTES Vorkommen) geschrieben, amtlicherAnker() läuft dort nicht.
  it.each([
    ['annex_1__2', 'annex_1'],
    ['annex_u1__2', 'annex_u1'],
    ['lvl_u1__2', 'lvl_u1'],
    ['scope_u1__2', 'scope_u1'],
    ['decl_u1__2', 'decl_u1'],
  ])('%s → Fragment #%s (Basis-Anker des 1. Vorkommens) → null', (artikel, fragment) => {
    expect(verifizierLinkArtikel(mit(artikel, fragment), GELTEND)).toBeNull();
  });

  it.each([
    ['disp_u1_art_1__2', 'disp_u1/art_1'],
    ['126_z__2', 'art_126_z'],
    ['x__2', 'book_1/part_1/tit_19/chap_3'],
    ['x__2', 'a'], // kein Ziffernteil
    ['x__2', 'ta'], // kein Ziffernteil
    ['x__2', 'xa126z'], // fremdes Präfix
    ['x__2', 'ta126z_x'], // «_» → Struktur-Id-Form
    ['x__2', 'ta126z/x'],
  ])('%s → Fragment #%s ist kein amtlicher Namens-Anker → null', (artikel, fragment) => {
    expect(verifizierLinkArtikel(mit(artikel, fragment), GELTEND)).toBeNull();
  });

  // Die Formen, die amtlicherAnker() (scripts/normtext/artikel-vorkommen.ts) tatsächlich liefert:
  // der <a name>-Wert vor dem Artikelkopf (Sweep ZGB+OR+KKV: «a126z», «ta126z», «tta1», «a29a29f»).
  it.each(['ta126z', 'a126z', 'a10', 'tta1', 'ttttta2', 'a29a29f', 'a226a226d'])(
    '«__N» mit amtlichem Namens-Anker #%s → Deep-Link freigegeben',
    (fragment) => {
      expect(verifizierLinkArtikel(mit('x__2', fragment), GELTEND)).toBe(`${BASIS}#${fragment}`);
    },
  );

  it('Nicht-«__N»-Token bleiben unberührt: annex_1 (ohne Suffix) behält sein Fragment', () => {
    expect(verifizierLinkArtikel(mit('annex_1', 'annex_1'), GELTEND)).toBe(`${BASIS}#annex_1`);
  });
});

describe('verifizierLinkArtikel — kein Link statt falscher Link (§8)', () => {
  it('Synthese-Suffix «__2» OHNE eigenen amtlichen Anker (Fallback auf den Basis-Anker = 1. Vorkommen) → null', () => {
    // amtlicherAnker() fällt bei nicht eindeutigem Namens-Anker auf den Basis-Anker zurück
    // — der zeigt auf das ERSTE Vorkommen, also auf einen FREMDEN Artikel (§8).
    const e = { ...eintrag(kkv, '126_z__2'), quelleUrl: 'https://www.fedlex.admin.ch/eli/cc/2006/859/de#art_126_z' };
    expect(verifizierLinkArtikel(e, GELTEND)).toBeNull();
  });

  it('Synthese-Suffix «__2» im Schlussteil mit Basis-Anker «disp_u1/art_1» (fremder Artikel) → null', () => {
    const e = {
      ...eintrag(kkv, '126_z__2'),
      artikel: 'disp_u1_art_1__2',
      quelleUrl: 'https://www.fedlex.admin.ch/eli/cc/2006/859/de#disp_u1/art_1',
    };
    expect(verifizierLinkArtikel(e, GELTEND)).toBeNull();
  });

  it('Synthese-Suffix «__2» ohne Fragment / ohne ELI-Form → null', () => {
    const e = eintrag(kkv, '126_z__2');
    expect(verifizierLinkArtikel({ ...e, quelleUrl: 'https://www.fedlex.admin.ch/eli/cc/2006/859/de' }, GELTEND)).toBeNull();
    expect(verifizierLinkArtikel({ ...e, quelleUrl: 'https://fedlex.data.admin.ch/filestore/x/de/html/x.html#ta126z' }, GELTEND)).toBeNull();
  });

  it('Kanton-Eintrag (kein Fedlex-eId-Raum) → null', () => {
    const e = { ...eintrag(zgb, '712_a'), ebene: 'kanton' as const };
    expect(verifizierLinkArtikel(e, GELTEND)).toBeNull();
  });

  it('Nicht-ELI-Quelle (Filestore, §12.4 «NIE Filestore-URL») → null', () => {
    const e = {
      ...eintrag(zgb, '712_a'),
      quelleUrl: 'https://fedlex.data.admin.ch/filestore/fedlex.data.admin.ch/eli/cc/24/233_245_233/20260101/de/html/fedlex-data-admin-ch-eli-cc-24-233_245_233-20260101-de-html.html#art_712_a',
    };
    expect(verifizierLinkArtikel(e, GELTEND)).toBeNull();
  });

  it('quelleUrl ohne Fragment (keine Stelle bestimmbar) → null', () => {
    const e = { ...eintrag(zgb, '712_a'), quelleUrl: 'https://www.fedlex.admin.ch/eli/cc/24/233_245_233/de' };
    expect(verifizierLinkArtikel(e, GELTEND)).toBeNull();
  });

  it('ganz aufgehobener Erlass → null (Kopf-Konvention: kein «Fassung»-Link, §8)', () => {
    const e = eintrag(zgb, '712_a');
    expect(verifizierLinkArtikel(e, { aufgehoben: { datum: '2020-01-01' } as never })).toBeNull();
  });
});

describe('verifizierLinkArtikel — §5-Parität: Fragment ↔ ankerZuToken (korpusweit ZGB+OR)', () => {
  it('jedes gelieferte Fragment führt über ankerZuToken EXAKT auf das Snapshot-Token zurück', () => {
    let geprueft = 0;
    for (const e of [...zgb.eintraege, ...or.eintraege]) {
      const url = verifizierLinkArtikel(e, GELTEND);
      if (url == null) continue;
      const fragment = url.slice(url.indexOf('#') + 1);
      expect(ankerZuToken(fragment)).toBe(e.artikel);
      geprueft += 1;
    }
    // Sabotage-Schutz: der Sweep darf nicht leer durchlaufen (still-grünes Tor, §6.7b).
    expect(geprueft).toBeGreaterThan(2000);
  });
});

describe('verifizierLinkSektion — Container-eId aus dem EID-1-Sidecar', () => {
  const zgbErlass = { ebene: 'bund' as const, quelleUrl: 'https://www.fedlex.admin.ch/eli/cc/24/233_245_233/de', aufgehoben: undefined };

  it('reale ZGB-Container-eId (Stockwerkeigentum) → ELI-Deep-Link', () => {
    expect(verifizierLinkSektion(zgbErlass, 'book_4/part_1/tit_19/chap_3'))
      .toBe('https://www.fedlex.admin.ch/eli/cc/24/233_245_233/de#book_4/part_1/tit_19/chap_3');
  });

  it('ohne eId (Sidecar ohne EID-1-Feld, z. B. Randtitel-Knoten) → null', () => {
    expect(verifizierLinkSektion(zgbErlass, undefined)).toBeNull();
  });

  it('Kanton / Nicht-ELI / Basis-URL mit eigenem Fragment / aufgehoben → null', () => {
    expect(verifizierLinkSektion({ ...zgbErlass, ebene: 'kanton' }, 'book_1')).toBeNull();
    expect(verifizierLinkSektion({ ...zgbErlass, quelleUrl: 'https://www.lexfind.ch/tol/1234/de' }, 'book_1')).toBeNull();
    expect(verifizierLinkSektion({ ...zgbErlass, quelleUrl: `${zgbErlass.quelleUrl}#art_1` }, 'book_1')).toBeNull();
    expect(verifizierLinkSektion({ ...zgbErlass, aufgehoben: { datum: '2020-01-01' } as never }, 'book_1')).toBeNull();
  });
});

describe('baueGliederungsbaum — eId-Durchreichung (EID-1 → Sektion)', () => {
  const snap = (token: string): NormSnapshot => ({
    ...eintrag(zgb, '712_a'), id: `t/${token}`, artikel: token,
  });

  it('amtliche Gliederungsstufen tragen die Sidecar-eId; Randtitel-Knoten keine', () => {
    const struktur: StrukturMap = {
      a1: {
        gliederung: [
          { ebene: 1, label: 'Erster Teil', eId: 'part_1' },
          { ebene: 2, label: 'Erster Titel', eId: 'part_1/tit_1' },
        ],
        marginalie: ['A. Grundsatz', 'I. Umfang', 'Blattüberschrift'],
      },
      a2: { gliederung: [{ ebene: 1, label: 'Erster Teil', eId: 'part_1' }], marginalie: [] },
    };
    const { sektionen } = baueGliederungsbaum([snap('a1'), snap('a2')], struktur);
    expect(sektionen).toHaveLength(1);
    expect(sektionen[0].eId).toBe('part_1');
    expect(sektionen[0].kinder[0].eId).toBe('part_1/tit_1');
    // Randtitel-promotete Knoten («A. …» → «I. …») sind KEINE amtlichen Container:
    const randtitel = sektionen[0].kinder[0].kinder[0];
    expect(randtitel.randtitel).toBe(true);
    expect(randtitel.eId).toBeUndefined();
  });

  it('Sidecar ohne eId-Feld (Alt-Stand/Kanton): Sektion bleibt eId-frei — kein Fabrizieren (§7)', () => {
    const struktur: StrukturMap = { a1: { gliederung: [{ ebene: 1, label: 'Erster Teil' }], marginalie: [] } };
    const { sektionen } = baueGliederungsbaum([snap('a1')], struktur);
    expect(sektionen[0].eId).toBeUndefined();
  });
});
