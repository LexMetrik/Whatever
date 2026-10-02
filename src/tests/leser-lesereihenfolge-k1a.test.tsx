import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { LeserLesespalte } from '../pages/gesetz-leser/v3/LeserLesespalte';
import type { LeserV3Modell } from '../pages/gesetz-leser/v3/leserV3Modell';
import { baueGliederungsbaum, type StrukturMap } from '../lib/normtext/browse';
import type { BrowseErlass } from '../lib/normtext/browse-typen';
import type { NormSnapshot } from '../lib/normtext/typen';
import bs569Snapshot from '../../public/normtext/kanton/BS-569.500.json';
import bs569Struktur from '../../public/normtext/struktur/kanton/BS-569.500.json';
import kkvSnapshot from '../../public/normtext/bund/KKV.json';
import kkvStruktur from '../../public/normtext/struktur/bund/KKV.json';

// ─── F24 · DIE LESESPALTE LÄUFT DOKUMENTLINEAR (K-1a, W2·13-KANTONE) ─────────
//
// GEMESSEN 31.8.2026 am committeten Korpus: `baueGliederungsbaum` legt einen
// Artikel genau dann in `ohneGliederung`, wenn er WEDER eine amtliche Gliederung
// NOCH eine geteilte Randtitel-Stufe trägt — also auch dann, wenn er MITTEN im
// Dokument zwischen zwei solchen Stufen steht (fehlende oder nur einteilige
// Marginalie). Die Lesespalte rendete diese Artikel bis hierher als EINEN Block
// VOR allen Sektionen; der Leser bekam damit eine Reihenfolge, die es im
// amtlichen Erlass nicht gibt (§8: keine Aussage, die die Quelle nicht deckt).
//
// Betroffene Erlasse am Stand 31.8.2026: BS-569.500, GR-310.250, ZG-641.1.
// Vorbild des Fixes ist das TOC-Modell, das dieselbe Klasse seit B2 (9.8.2026)
// dokumentlinear einordnet (`gliederungsModell.ts`, Vor-/Mittel-/Nachspann).
//
// Der Test misst die REIHENFOLGE IM MARKUP, nicht die Modell-Listen: genau dort
// lag der Defekt (das Modell kannte die Artikel, die Spalte stellte sie falsch).

const ERLASS: BrowseErlass = {
  key: 'BS-569.500', ebene: 'kanton', kanton: 'BS', kuerzel: 'Plakatverordnung',
  titel: 'Plakatverordnung', sr: '569.500', rechtsgebiet: 'oeffentlich', sprache: 'de',
  rang: 0, status: 'snapshot', datei: 'kanton/BS-569.500.json', artikelAnzahl: 10,
  stand: '2026-06-15', quelleUrl: 'https://www.gesetzessammlung.bs.ch/data/569.500/de',
  fassungsToken: '20250615', pdfPfad: null,
};

const snap = (artikel: string): NormSnapshot => ({
  id: `kanton/X/art_${artikel}`, ebene: 'kanton', quelle: 'X', erlass: 'X',
  artikel, artikelLabel: `§ ${artikel}`, bloecke: [{ absatz: null, text: `Text ${artikel}` }],
  stand: '2026-01-01', quelleUrl: 'u', abgerufen: '2026-01-01', fassungsToken: 't', sha: 's',
});

/** Baut das Minimal-Modell, das die Lesespalte tatsächlich liest (§3: reine
 *  Darstellung — alles Übrige ist für sie unerreichbar und bleibt ungesetzt). */
function modellFuer(eintraege: NormSnapshot[], struktur: StrukturMap): LeserV3Modell {
  const { sektionen, ohneGliederung } = baueGliederungsbaum(eintraege, struktur);
  const artIndex = new Map<string, number>();
  eintraege.forEach((e, i) => artIndex.set(e.artikel, i));
  const sekPos = new Map<string, number>();
  const walk = (s: (typeof sektionen)[number]): number => {
    let min = Infinity;
    for (const a of s.artikel) min = Math.min(min, artIndex.get(a.artikel) ?? Infinity);
    for (const k of s.kinder) min = Math.min(min, walk(k));
    sekPos.set(s.id, min);
    return min;
  };
  sektionen.forEach(walk);
  return {
    erlass: ERLASS, eintraege, struktur, sektionen, ohneGliederung,
    basisPfad: '/gesetze/kanton/BS-569.500', vorher: null, nachher: null,
    sekPos, artIndex,
    sektionMeta: new Map(),
    margAnzeige: new Map(),
    internRefs: undefined,
    offen: {},
    setOffen: () => {},
    historieFuer: () => undefined,
    // §6.3-DEKLARATION (W2·24-R6c): das Modell führt seit der Zähl-Datei einen
    // dritten Nachschlag je Artikel (`bezuegeZaehler`, `../pages/gesetz-leser/
    // bezuegeZaehler`). Das Doppel gibt ihn wie die beiden anderen leer zurück —
    // dieser Fall prüft die REIHENFOLGE des Markups, nicht die Bezüge; ohne den
    // Eintrag stürzt der Renderer ab, statt etwas zu messen.
    bezuegeZaehler: () => undefined,
    refs: { leseRef: createRef<HTMLDivElement>(), sekRef: { current: new Map() } },
  } as unknown as LeserV3Modell;
}

/** Reihenfolge der Artikel-Anker im gerenderten Markup (`<article id="art-…">`). */
function ankerReihenfolge(html: string): string[] {
  return [...html.matchAll(/id="art-([^"]+)"/g)].map((m) => m[1]);
}

function rendere(eintraege: NormSnapshot[], struktur: StrukturMap): string {
  return renderToString(
    <MemoryRouter>
      <LeserLesespalte m={modellFuer(eintraege, struktur)} />
    </MemoryRouter>,
  );
}

describe('F24 · Lesespalte rendert dokumentlinear (K-1a)', () => {
  it('freie Artikel MITTEN im Dokument stehen an ihrer Dokumentposition', () => {
    // Auslöser-Klasse in Reinform: § 2 und § 4 tragen eine geteilte Randtitel-
    // Stufe (⇒ Sektion), § 1, § 3 und § 5 keine (⇒ `ohneGliederung`).
    const eintraege = ['1', '2', '3', '4', '5'].map(snap);
    const struktur: StrukturMap = {
      1: { gliederung: [], marginalie: [] },
      2: { gliederung: [], marginalie: ['I. Erster Teil'] },
      3: { gliederung: [], marginalie: [] },
      4: { gliederung: [], marginalie: ['II. Zweiter Teil'] },
      5: { gliederung: [], marginalie: ['Gegenstand'] }, // Sachtitel ⇒ Blatt, kein Knoten
    };
    expect(ankerReihenfolge(rendere(eintraege, struktur))).toEqual(['1', '2', '3', '4', '5']);
  });

  it('BS-569.500 (echter Korpus-Fall): Markup-Reihenfolge == Snapshot-Reihenfolge', () => {
    const eintraege = bs569Snapshot.eintraege as unknown as NormSnapshot[];
    const struktur = bs569Struktur.artikel as unknown as StrukturMap;
    expect(ankerReihenfolge(rendere(eintraege, struktur)))
      .toEqual(eintraege.map((e) => e.artikel));
  });

  it('KKV (Bund): der eine strukturlose Artikel steht an Position 181, nicht vorn', () => {
    // §7-KORREKTUR ZUR BAU-SPEC: sie nannte die Klasse «betroffen heute nur noch
    // 3 Erlasse, kein Bund-Erlass». NACHGEMESSEN 31.8.2026 über alle 1420
    // Snapshot-Erlasse: es sind VIER — BS-569.500, GR-310.250, ZG-641.1 und der
    // Bundeserlass KKV. Dessen Artikel `126_z__2` trägt gar keinen
    // Struktur-Eintrag (weder Gliederung noch Marginalie) und stand deshalb als
    // ERSTER im Lesetext, obwohl er an 182. Stelle von 211 steht. Dieselbe
    // Zählung nennt schon der B2-Kommentar im TOC-Modell («KKV 1 von 211»).
    const eintraege = kkvSnapshot.eintraege as unknown as NormSnapshot[];
    const struktur = kkvStruktur.artikel as unknown as StrukturMap;
    const anker = ankerReihenfolge(rendere(eintraege, struktur));
    expect(anker).toEqual(eintraege.map((e) => e.artikel));
    expect(anker.indexOf('126_z__2')).toBe(181);
  });

  it('reiner Vorspann bleibt Vorspann (Bund-Muster, unverändert)', () => {
    // Alle freien Artikel VOR dem Baum — der Regelfall (Ingress-/Vorspann-
    // Artikel, kantonale Erlasse ohne jede Gliederung). Die Reihenfolge ist
    // schon vor dem Fix richtig; der Test hält fest, dass sie es bleibt.
    const eintraege = ['1', '2', '3'].map(snap);
    const struktur: StrukturMap = {
      1: { gliederung: [], marginalie: [] },
      2: { gliederung: [], marginalie: [] },
      3: { gliederung: [], marginalie: ['I. Erster Teil'] },
    };
    expect(ankerReihenfolge(rendere(eintraege, struktur))).toEqual(['1', '2', '3']);
  });

  it('ohne freie Artikel bleibt das Markup unverändert (kein Leer-Block)', () => {
    const eintraege = ['1', '2'].map(snap);
    const struktur: StrukturMap = {
      1: { gliederung: [], marginalie: ['I. Erster Teil'] },
      2: { gliederung: [], marginalie: ['II. Zweiter Teil'] },
    };
    const html = rendere(eintraege, struktur);
    expect(ankerReihenfolge(html)).toEqual(['1', '2']);
    expect(html).not.toContain('space-y-5 mb-6');
  });
});
