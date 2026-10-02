/**
 * W2·27-BUND-FERTIG — Überschrift-Fussnoten (2.10.2026, Entscheid David).
 *
 * Fedlex setzt «Fassung gemäss …»/«Eingefügt durch …» oft an eine Gliederungsüberschrift (Titel, Abschnitt, Randtitel)
 * statt an jeden Artikel. Das Struktur-Sidecar hängt sie (`sektion`) nur an den ERSTEN Artikel darunter; die Historie
 * zeigte an allen übrigen «nichts erfasst». Seither gilt die Fussnote für alle Artikel, deren Gliederungspfad die
 * Überschrift enthält (`sektionsErbe` + `baueArtikelHistorie(…, { geerbt })`). Fixture-Texte sind wörtlich aus den
 * Struktur-Sidecars (`public/normtext/struktur/bund/OR.json`, StGB.json) gekürzt; die Korpus-Sonden lesen die committeten
 * Artefakte.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { baueArtikelHistorie, sektionsErbe, loeseErbeAuf, type ArtikelHistorie, type ErbArtikel, type HistorieEreignis, type FnEingang } from '../lib/normtext/historie-parse';
import { historieFuerArtikel, type HistorieShard } from '../lib/normtext/historie-laden';
import { baueGliederungsbaum, type Sektion } from '../lib/normtext/browse';
import { tokenAusId } from '../../scripts/normtext/historie-aufgehoben-lebend';
import type { NormSnapshot } from '../lib/normtext/typen';

const FASSUNG_1972 = 'Fassung gemäss Ziff. I des BG vom 25. Juni 1971, in Kraft seit 1. Jan. 1972 (AS 1971 1461; BBl 1967 II 241).';
const FASSUNG_2007 = 'Fassung gemäss Ziff. I 1 des BG vom 13. Dez. 2002, in Kraft seit 1. Jan. 2007 (AS 2006 3459; BBl 1999 1979).';
const EINGEFUEGT_2012 = 'Eingefügt durch Ziff. I des BG vom 18. März 2011, in Kraft seit 1. Jan. 2012 (AS 2011 4909).';
const AUFGEHOBEN_2010 = 'Aufgehoben durch Ziff. I des BG vom 1. Jan. 2009, mit Wirkung seit 1. Jan. 2010 (AS 2009 1).';

const fn = (text: string, extra: Partial<FnEingang> = {}): FnEingang => ({ nr: '1', text, links: [], absatz: null, item: null, ...extra });
const sek = (text: string, label: string): FnEingang => fn(text, { sektion: label });
const stufe = (ebene: number, label: string) => ({ ebene, label });
const TITEL = stufe(2, 'Zehnter Titel: Der Arbeitsvertrag');
const ABSCHNITT1 = stufe(3, 'Erster Abschnitt: Der Einzelarbeitsvertrag');
const ABSCHNITT2 = stufe(3, 'Zweiter Abschnitt: Besondere Vertragsverhältnisse');
const TITEL11 = stufe(2, 'Elfter Titel: Der Werkvertrag');

/** Historie eines Artikels der Folge `folge` (Token → Erbe aus `sektionsErbe`). */
function historieVon(folge: ErbArtikel[], token: string, opts: { snapshotAufgehoben?: boolean } = {}) {
  const a = folge.find((x) => x.token === token)!;
  const geerbt = sektionsErbe(folge).get(token);
  return baueArtikelHistorie(a.fussnoten, { geerbt, ...opts }).historie;
}

describe('sektionsErbe · Überschrift-Fussnoten gelten für alle Artikel darunter', () => {
  const folge: ErbArtikel[] = [
    { token: '319', gliederung: [TITEL, ABSCHNITT1], fussnoten: [sek(FASSUNG_1972, TITEL.label)] },
    { token: '320', gliederung: [TITEL, ABSCHNITT1] },
    { token: '321', gliederung: [TITEL, ABSCHNITT1] },
    { token: '330_a', gliederung: [TITEL, ABSCHNITT2] }, // Abschnittswechsel unter DEMSELBEN Titel: Titel-Fussnote gilt weiter
    { token: '363', gliederung: [TITEL11] }, // Titel gleicher Stufe beendet den Bereich
  ];

  it('Träger-Artikel UND jeder Folge-Artikel im Bereich tragen das Ereignis mit Herkunfts-Label', () => {
    for (const token of ['319', '320', '321', '330_a']) {
      const h = historieVon(folge, token)!;
      expect(h, token).not.toBeNull();
      expect(h.giltSeit, token).toBe('1972-01-01');
      expect(h.ereignisse, token).toHaveLength(1);
      expect(h.ereignisse[0]).toMatchObject({ typ: 'fassung', datum: '1972-01-01', ueberschrift: TITEL.label });
    }
  });

  it('die nächste Überschrift gleicher Stufe beendet den Bereich: Art. 363 (Elfter Titel) erbt nichts', () => {
    expect(sektionsErbe(folge).has('363')).toBe(false);
    expect(historieVon(folge, '363')).toBeNull();
  });

  it('verschachtelte Stufen: Abschnitts-Fussnote gilt nur im Abschnitt, Titel-Fussnote im ganzen Titel (äusserste zuerst)', () => {
    const f2: ErbArtikel[] = [
      { token: '1', gliederung: [TITEL, ABSCHNITT1], fussnoten: [sek(FASSUNG_1972, TITEL.label), { ...sek(EINGEFUEGT_2012, ABSCHNITT1.label), nr: '2' }] },
      { token: '2', gliederung: [TITEL, ABSCHNITT1] },
      { token: '3', gliederung: [TITEL, ABSCHNITT2] },
    ];
    const art2 = historieVon(f2, '2')!;
    expect(art2.ereignisse.map((e) => [e.typ, e.ueberschrift])).toEqual([
      ['fassung', TITEL.label],
      ['eingefuegt', ABSCHNITT1.label],
    ]);
    expect(art2.giltSeit).toBe('2012-01-01');
    // Art. 3 liegt in Abschnitt 2: nur die Titel-Fussnote
    expect(historieVon(f2, '3')!.ereignisse.map((e) => e.ueberschrift)).toEqual([TITEL.label]);
  });

  it('Randtitel-Ebene (Marginalie): geteilter Ahne «A. …» wird Knoten, seine Fussnote gilt für die Artikel darunter', () => {
    const f3: ErbArtikel[] = [
      { token: '47', gliederung: [stufe(1, 'Erstes Buch')], marginalie: ['A. Strafzumessung', 'I. Grundsatz', 'Strafzumessung'], fussnoten: [sek(FASSUNG_2007, 'A. Strafzumessung')] },
      { token: '48', gliederung: [stufe(1, 'Erstes Buch')], marginalie: ['A. Strafzumessung', 'I. Grundsatz', 'Strafmilderung'] },
      { token: '49', gliederung: [stufe(1, 'Erstes Buch')], marginalie: ['A. Strafzumessung', 'II. Konkurrenz', 'Retrospektive'] },
      { token: '50', gliederung: [stufe(1, 'Erstes Buch')], marginalie: ['B. Strafen', 'I. Geldstrafe', 'Anderes'] },
    ];
    for (const t of ['47', '48', '49']) expect(historieVon(f3, t)!.ereignisse[0].ueberschrift, t).toBe('A. Strafzumessung');
    expect(historieVon(f3, '50')).toBeNull();
  });

  it('«Aufgehoben» an der Überschrift wird NICHT weitergegeben; kein aufgehobenSeit und keine Widerlegung', () => {
    const f4: ErbArtikel[] = [
      { token: '1', gliederung: [TITEL], fussnoten: [sek(AUFGEHOBEN_2010, TITEL.label)] },
      { token: '2', gliederung: [TITEL] },
    ];
    expect(historieVon(f4, '2')).toBeNull();
    // Gemischte Fussnote: nur der Fassungs-Teil geht weiter, nie der Aufhebungs-Teil
    const f5: ErbArtikel[] = [
      { token: '1', gliederung: [TITEL], fussnoten: [sek(`${EINGEFUEGT_2012} ${AUFGEHOBEN_2010}`, TITEL.label)] },
      { token: '2', gliederung: [TITEL] },
    ];
    const h = historieVon(f5, '2')!;
    expect(h.ereignisse.map((e) => e.typ)).toEqual(['eingefuegt']);
    expect(h.aufgehobenSeit).toBeUndefined();
  });

  it('nicht weitergegebene Typen («Ausdruck», «Ursprünglich», «Nummerierung») bleiben am Träger', () => {
    const f6: ErbArtikel[] = [
      {
        token: '1', gliederung: [TITEL],
        fussnoten: [
          sek('Ausdruck gemäss Ziff. I des BG vom 20. März 1998, in Kraft seit 1. Aug. 2000 (AS 2000 1569).', TITEL.label),
          { ...sek('Ursprünglich Tit. vor Art. 27.', TITEL.label), nr: '2' },
        ],
      },
      { token: '2', gliederung: [TITEL] },
    ];
    expect(historieVon(f6, '2')).toBeNull();
    expect(historieVon(f6, '1')!.ereignisse.map((e) => [e.typ, e.ueberschrift])).toEqual([['ausdruck', TITEL.label], ['urspruenglich', TITEL.label]]);
  });

  it('eigenes jüngeres Ereignis bleibt massgeblich für giltSeit; ein jüngeres Überschrift-Datum rückt giltSeit vor (Entscheid David)', () => {
    const f7: ErbArtikel[] = [
      { token: '1', gliederung: [TITEL], fussnoten: [sek(FASSUNG_1972, TITEL.label)] },
      { token: '2', gliederung: [TITEL], fussnoten: [fn(EINGEFUEGT_2012)] }, // eigen jünger (2012 > 1972)
      { token: '3', gliederung: [TITEL], fussnoten: [fn('Fassung gemäss Ziff. I des BG vom 1. Jan. 1960, in Kraft seit 1. Jan. 1961 (AS 1960 1).')] }, // eigen älter
    ];
    const a2 = historieVon(f7, '2')!;
    expect(a2.giltSeit).toBe('2012-01-01');
    expect(a2.ereignisse.map((e) => e.ueberschrift)).toEqual([TITEL.label, undefined]);
    expect(historieVon(f7, '3')!.giltSeit).toBe('1972-01-01');
  });

  it('amtlich aufgehobener Artikel (Text-Shard) und Artikel mit eigener Ganzaufhebung erben nichts', () => {
    const f8: ErbArtikel[] = [
      { token: '1', gliederung: [TITEL], fussnoten: [sek(FASSUNG_1972, TITEL.label)] },
      { token: '2', gliederung: [TITEL] },
      { token: '3', gliederung: [TITEL], fussnoten: [fn(AUFGEHOBEN_2010)] },
    ];
    expect(historieVon(f8, '2', { snapshotAufgehoben: true })).toBeNull();
    const a3 = historieVon(f8, '3')!;
    expect(a3.aufgehobenSeit).toBe('2010-01-01');
    expect(a3.ereignisse.map((e) => e.typ)).toEqual(['aufgehoben']); // nicht um die Überschrift-Fassung ergänzt
    expect(a3.giltSeit).toBeNull();
  });

  it('zwei Überschriften mit gleichem Label, aber verschiedener Fedlex-eId («…» bei aufgehobenen Titeln) bleiben getrennt', () => {
    const u1 = { ebene: 2, label: '…', eId: 'chap_3/lvl_u1' };
    const u2 = { ebene: 2, label: '…', eId: 'chap_3/lvl_u2' };
    const f10: ErbArtikel[] = [
      { token: '37', gliederung: [stufe(1, '3. Kapitel'), u1], fussnoten: [sek(FASSUNG_1972, '…')] },
      { token: '38', gliederung: [stufe(1, '3. Kapitel'), u1] },
      { token: '43', gliederung: [stufe(1, '3. Kapitel'), u2] }, // andere Überschrift «…»: kein Erbe aus u1
    ];
    expect(sektionsErbe(f10).has('38')).toBe(true);
    expect(sektionsErbe(f10).has('43')).toBe(false);
  });

  it('Artikel ohne Gliederung lässt den offenen Pfad unberührt (wie der Baum: «ohneGliederung»)', () => {
    const f9: ErbArtikel[] = [
      { token: '1', gliederung: [TITEL], fussnoten: [sek(FASSUNG_1972, TITEL.label)] },
      { token: '2' },
      { token: '3', gliederung: [TITEL] },
    ];
    expect(sektionsErbe(f9).has('2')).toBe(false);
    expect(sektionsErbe(f9).get('3')).toHaveLength(1);
  });
});

// ── Korpus-Sonden gegen die committeten Artefakte ──────────────────────────────────────────────────────────────
const STRUKTUR = 'public/normtext/struktur/bund';
const TEXT = 'public/normtext/bund';
const HISTORIE = 'public/normtext/historie';

describe('Korpus · Knoten-Identität = baueGliederungsbaum (jeder Artikel unter einer Überschrift mit Sektions-Fussnote erbt sie)', () => {
  // Äquivalenzbeweis: der Baum, den der Leser zeigt (baueGliederungsbaum), und die Vererbung dieses Moduls beschreiben
  // dieselben Bereiche. Für JEDE Überschrift mit Sektions-Fussnote im Bund-Korpus gilt: alle Artikel im Teilbaum
  // (ausser dem Träger) haben die Fussnote in `sektionsErbe`.
  it('alle Erlasse: Teilbaum-Artikel ⊆ Erben je Überschrift-Fussnote', () => {
    let knoten = 0;
    let artikelGeprueft = 0;
    for (const datei of readdirSync(STRUKTUR).filter((f) => f.endsWith('.json'))) {
      const struktur = JSON.parse(readFileSync(`${STRUKTUR}/${datei}`, 'utf8')).artikel as Record<string, ErbArtikel>;
      const text = JSON.parse(readFileSync(`${TEXT}/${datei}`, 'utf8')) as { eintraege: NormSnapshot[] };
      const reihenfolge = new Map(text.eintraege.map((e, i) => [e.artikel, i]));
      const tokenVonArtikel = new Map(text.eintraege.map((e) => [e.artikel, tokenAusId(e.id)]));
      const folge = text.eintraege.map((e) => tokenAusId(e.id)).filter((t) => t in struktur).map((token) => ({ ...struktur[token], token }));
      const erbe = sektionsErbe(folge);
      const { sektionen } = baueGliederungsbaum(text.eintraege, struktur as never);
      const alleArtikel = (s: Sektion): NormSnapshot[] => [...s.artikel, ...s.kinder.flatMap(alleArtikel)];
      const besuche = (s: Sektion) => {
        for (const f of s.fussnoten ?? []) {
          knoten++;
          const traeger = struktur[tokenVonArtikel.get(f.artikel)!];
          const quell = traeger.fussnoten!.find((x) => x.nr === f.nr && x.sektion)!;
          const ab = reihenfolge.get(f.artikel)!;
          const eIdsTraeger = struktur[tokenVonArtikel.get(f.artikel)!].gliederung ?? [];
          for (const a of alleArtikel(s)) {
            // Nur Artikel NACH dem Träger (die Überschrift steht im Dokument vor ihm) und nicht unter einer anderen Überschrift,
            // die der Baum bloss wegen gleichen Labels («…» bei aufgehobenen Titeln) im selben Knoten führt: dort trennt die eId.
            if (a.artikel === f.artikel || reihenfolge.get(a.artikel)! < ab) continue;
            const eIds = struktur[tokenVonArtikel.get(a.artikel)!].gliederung ?? [];
            if (eIds.some((g, i) => eIdsTraeger[i]?.eId && g.eId && g.eId !== eIdsTraeger[i].eId)) continue;
            artikelGeprueft++;
            expect(erbe.get(tokenVonArtikel.get(a.artikel)!)?.includes(quell), `${datei} Art. ${a.artikel} unter «${s.label}»`).toBe(true);
          }
        }
        s.kinder.forEach(besuche);
      };
      sektionen.forEach(besuche);
    }
    expect(knoten).toBeGreaterThan(1000);
    expect(artikelGeprueft).toBeGreaterThan(5000);
  }, 120_000);
});

describe('Korpus · committete Historie-Shards (Stichprobe) und Auflösung der geerbten Ereignisse', () => {
  const lade = (erlass: string) => JSON.parse(readFileSync(`${HISTORIE}/${erlass}.json`, 'utf8')) as HistorieShard;

  it('OR Art. 320 (Zehnter Titel, Fassung 1971/72): im Shard nur als Index, nach der Auflösung als Ereignis an der Überschrift', () => {
    const shard = lade('OR');
    expect(shard.artikel['320'].erbt).toHaveLength(1);
    expect(shard.artikel['320'].ereignisse).toEqual([]); // Nutzlast: das Ereignis steht EINMAL in der Tabelle
    const h = historieFuerArtikel(shard, '320')!;
    expect(h.erbt).toBeUndefined();
    expect(h.ereignisse[0]).toMatchObject({ typ: 'fassung', datum: '1972-01-01', ueberschrift: 'Zehnter Titel: Der Arbeitsvertrag' });
    expect(h.giltSeit).toBe('1972-01-01');
    expect(historieFuerArtikel(shard, '320')).toBe(h); // stabile Identität (memo)
  });

  it('Träger-Artikel behält sein Ereignis inline (mit Herkunft), Artikel ohne Erbe bleibt unverändert', () => {
    const shard = lade('OR');
    expect(shard.artikel['319'].erbt).toBeUndefined();
    expect(shard.artikel['319'].ereignisse[0]).toMatchObject({ typ: 'fassung', ueberschrift: 'Zehnter Titel: Der Arbeitsvertrag' });
    expect(historieFuerArtikel(shard, '319')).toBe(shard.artikel['319']);
  });

  it('loeseErbeAuf: geerbte Ereignisse stehen VOR den eigenen; fehlende Tabellen-Einträge werden übersprungen', () => {
    const E = { wirkung: false, quellen: [] as HistorieEreignis['quellen'], absatz: null, item: null };
    const a: ArtikelHistorie = { giltSeit: '2012-01-01', ereignisse: [{ ...E, typ: 'eingefuegt', datum: '2012-01-01' }], erbt: [1, 7] };
    const r = loeseErbeAuf(a, [{ ...E, typ: 'fassung', datum: '1970-01-01', ueberschrift: 'X' }, { ...E, typ: 'fassung', datum: '1972-01-01', ueberschrift: 'Y' }]);
    expect(r.ereignisse.map((e) => e.ueberschrift ?? 'eigen')).toEqual(['Y', 'eigen']);
    expect(r.erbt).toBeUndefined();
  });

  it('jeder Index in `erbt` zeigt in die Tabelle (alle Erlasse), die Tabelle enthält nur weitergebbare Typen', () => {
    let indizes = 0;
    for (const datei of readdirSync(HISTORIE).filter((f) => f.endsWith('.json'))) {
      const shard = JSON.parse(readFileSync(`${HISTORIE}/${datei}`, 'utf8')) as HistorieShard;
      const tabelle = shard.ueberschriftEreignisse ?? [];
      for (const [token, a] of Object.entries(shard.artikel)) {
        for (const i of a.erbt ?? []) {
          indizes++;
          expect(tabelle[i], `${datei} ${token}`).toBeDefined();
          expect(['fassung', 'eingefuegt'], `${datei} ${token}`).toContain(tabelle[i].typ);
          expect(tabelle[i].ueberschrift, `${datei} ${token}`).toBeTruthy();
        }
      }
    }
    expect(indizes).toBeGreaterThan(8000);
  });
});
