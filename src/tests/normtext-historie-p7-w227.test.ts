/**
 * W2·27-BUND-FERTIG · Paket P7 — Historie-Parser und Aufhebungs-Daten (1.10.2026).
 *
 * Eine Datei je Paket, damit die Risiko-Tests der Vorgänger (normtext-historie*, normtext-aufhebung-*) unberührt
 * bleiben (§6.3). Fixtures stammen wörtlich aus den gepinnten Fedlex-Konsolidierungen (Pins: scripts/fedlex-cache.sh;
 * Abruf der Caches 1.10.2026) bzw. aus den Struktur-Sidecars `public/normtext/struktur/bund/*.json`.
 */
import { describe, it, expect } from 'vitest';
import { fussnoteDiesenArtGegenstandslos } from '../../scripts/normtext/aufhebung-signal';
import { parseFussnoteHistorie, baueArtikelHistorie, type FnEingang } from '../lib/normtext/historie-parse';

// ── #47 · «ist dieser Art. gegenstandslos» nur UNBEDINGT (GP T2, 1.10.2026) ──────────────────────────────────────
describe('P7 #47 · fussnoteDiesenArtGegenstandslos — bedingte Formen sind kein Ganz-Vermerk', () => {
  it('Bestand bleibt: AsylG Art. 122 (unbedingt) trifft weiterhin', () => {
    expect(fussnoteDiesenArtGegenstandslos(
      'AS 1998 1582 Ziff. III. Aufgrund der Annahme dieses BB in der Volksabstimmung vom 13. Juni 1999 ist dieser Art. gegenstandslos.',
    )).toBe(true);
  });

  it('«… ist dieser Art. gegenstandslos, soweit …» / «, sofern …» / «, wenn …» trifft NICHT (Teil-Gegenstandslosigkeit, §1/§8)', () => {
    for (const t of [
      'AS 2001 1 Ziff. III. Aufgrund der Annahme des BB ist dieser Art. gegenstandslos, soweit er sich auf Abs. 3 bezieht.',
      'Aufgrund des BRB ist dieser Art. gegenstandslos, sofern keine Ausnahme besteht.',
      'Aufgrund des BRB ist dieser Artikel gegenstandslos; soweit der Bund Kosten trägt, gilt er weiter.',
      'Aufgrund des BRB ist dieser Art. gegenstandslos wenn das Gesetz in Kraft tritt.',
      'Aufgrund des BRB ist dieser Art. gegenstandslos, ausgenommen Abs. 2.',
    ]) {
      expect(fussnoteDiesenArtGegenstandslos(t), t).toBe(false);
    }
  });

  it('ein Folgesatz, der zufällig mit «Soweit» beginnt, entkräftet den Vermerk nicht', () => {
    // «… ist dieser Art. gegenstandslos. Soweit …» — der Punkt beendet die Aussage (Satzgrenze), nicht ein Bedingungssatz.
    expect(fussnoteDiesenArtGegenstandslos('Aufgrund des BRB ist dieser Art. gegenstandslos. Soweit nötig, siehe Art. 5.')).toBe(true);
  });
});

// ── #26 · RECHTSGRUNDLAGE_RE: der ParlG-Zweig ist belegt, nicht nur der GVG-Zweig ─────────────────────────────────
// Die Mutation «nur GVG» liess die Suite grün (Form «Art. N ParlG – AS …» kommt im Korpus heute 0× vor). Die
// Grammatik trägt den Zweig aber bewusst: dieselbe Berichtigungs-Klammer nennt neuere Fussnoten als «(Art. 58 Abs. 1
// ParlG; SR 171.10)»; die AS-Form mit ParlG ist die direkte Parallele zur GVG-Form und darf nie als Quelle der
// BERICHTIGUNG gelten (die Fussnote nennt dort die Rechtsgrundlage samt deren Fundstelle).
describe('P7 #26 · Rechtsgrundlage ParlG – AS … ist keine Fundstelle der Berichtigung', () => {
  const link = { label: 'AS 2003 3000', url: 'https://fedlex.data.admin.ch/eli/oc/2003/3000' };
  const fn = (text: string): FnEingang => ({ text, links: [link], absatz: null, item: null });

  it('runde und eckige Klammer, mit und ohne Absatz: Ereignis «berichtigt» ohne Quelle', () => {
    for (const t of [
      'Berichtigt von der Redaktionskommission der BVers (Art. 58 ParlG – AS 2003 3000).',
      'Berichtigt von der Redaktionskommission der BVers (Art. 58 Abs. 1 ParlG – AS 2003 3000).',
      'Berichtigt von der Redaktionskommission der BVers [Art. 58 Abs. 1 ParlG – AS 2003 3000].',
    ]) {
      const r = parseFussnoteHistorie(fn(t));
      expect(r.ereignisse.map((e) => [e.typ, e.quellen]), t).toEqual([['berichtigt', []]]);
    }
  });

  it('Gegenprobe: dieselbe Klammer mit einem ANDEREN Erlass (Art. 5 BGG – AS …) bleibt Quelle (nie breiter als GVG/ParlG)', () => {
    const r = parseFussnoteHistorie(fn('Berichtigt von der Redaktionskommission der BVers (Art. 5 BGG – AS 2003 3000).'));
    expect(r.ereignisse[0].quellen.map((q) => q.label)).toEqual(['AS 2003 3000']);
  });
});

// ── #50 · «Dieser Art. ist (heute) aufgehoben» an einem ABSATZ-/lit.-Marker ist eine Anmerkung zur ZITIERTEN Bestimmung ─
// Befund 1.10.2026: StGB 66, StPO 173, BGG 83, VVG 47a, OR disp_u13/art_6 trugen die Fussnote «Dieser Art. ist
// (heute) aufgehoben» bei lebendem Body; LFG 100 «nicht mehr in Kraft». Geprüft an den gepinnten Fedlex-HTMLs
// (Kontext des Markers, Abruf der Caches 1.10.2026): in ALLEN Fällen steht der Marker hinter einem ZITAT im
// Absatz-/lit.-Text («… wie eine kurze Freiheitsstrafe vollzogen (Art. 79[Fn])», «Artikel 139 Absatz 3 des
// Zivilgesetzbuchs[Fn]»); die Fussnote sagt, die zitierte Bestimmung sei aufgehoben — nicht den Artikel, in dem sie
// zitiert wird. Anzeige korrekt: der Artikel lebt, kein «aufgehoben»-Ereignis, kein aufgehobenSeit.
describe('P7 #50 · Zitat-Anmerkung «Dieser Art. ist aufgehoben» (Absatz-/lit.-Skopus) ist kein Aufhebungs-Ereignis', () => {
  const FAELLE: Array<{ wo: string; text: string; absatz: string | null; item: string | null }> = [
    { wo: 'StGB 66 Abs. 2 (zitiert Art. 79)', text: 'Dieser Art. ist aufgehoben (AS 2016 1249; BBl 2012 4721).', absatz: '2', item: null },
    { wo: 'StGB 172ter Abs. 2 (zitiert Art. 139 Ziff. 2)', text: 'Diese Ziff. ist heute aufgehoben.', absatz: '2', item: null },
    { wo: 'StPO 173 Abs. 1 lit. b (zitiert Art. 139 Abs. 3 ZGB)', text: 'SR 210. Dieser Art. ist heute aufgehoben.', absatz: '1', item: 'b' },
    { wo: 'BGG 83 lit. r (zitiert Art. 34 VGG)', text: 'SR 173.32. Dieser Art. ist aufgehoben. Siehe heute: Art. 33 Bst. i VGG in Verbindung mit Art. 53 Abs. 1 des BG vom 18. März 1994 über die Krankenversicherung.', absatz: null, item: 'r' },
    { wo: 'VVG 47a lit. a (zitiert Art. 12 Abs. 2 KVG)', text: 'SR 832.10. Dieser Art. ist heute aufgehoben. Siehe seit dem 1. Jan. 2016: Art. 2 Abs. 2 des Krankenversicherungsaufsichtsgesetzes.', absatz: null, item: 'a' },
    { wo: 'OR SchlT 6 Ziff. 12 (zitiert Art. 64)', text: 'Dieser Art. ist heute aufgehoben.', absatz: null, item: '12' },
    { wo: 'OR SchlT 3 Abs. 1 (zitiert Art. 226f–226k)', text: 'Diese Art. sind heute aufgehoben.', absatz: '1', item: null },
    { wo: 'VZV 80 Abs. 1 (zitiert Art. 10 Abs. 3)', text: 'Dieser Abs. ist heute aufgehoben.', absatz: '1', item: null },
    { wo: 'LFG 100 Abs. 2 lit. a (zitiert Art. 13a Abs. 1 Bst. b Ziff. 1)', text: 'SR 120. Dieser Art. ist nicht mehr in Kraft. Siehe heute: Art. 19 Abs. 2 Bst. a des Nachrichtendienstgesetzes vom 25. Sept. 2015 (SR 121).', absatz: '2', item: 'a' },
  ];

  it('kein «aufgehoben»-Ereignis, keine Ganz-Artikel-Historie (weder aufgehobenSeit noch gegenstandslos)', () => {
    for (const f of FAELLE) {
      const fn: FnEingang = { text: f.text, links: [], absatz: f.absatz, item: f.item };
      expect(parseFussnoteHistorie(fn).ereignisse.some((e) => e.typ === 'aufgehoben' || e.typ === 'gegenstandslos'), f.wo).toBe(false);
      const { historie } = baueArtikelHistorie([fn]);
      expect(historie?.aufgehobenSeit, f.wo).toBeUndefined();
      expect(historie?.gegenstandslos, f.wo).toBeUndefined();
    }
  });

  it('auch OHNE Skopus-Marke (Kopf-Anker) entstünde daraus kein datiertes Aufhebungs-Ereignis — undatiert, keine Erfindung (§2)', () => {
    // Gegenprobe zur Grenze: wer die Fussnote an den Artikelkopf legt, bekommt trotzdem kein «aufgehobenSeit».
    const { historie } = baueArtikelHistorie([{ text: 'Dieser Art. ist heute aufgehoben.', links: [], absatz: null, item: null }]);
    expect(historie?.aufgehobenSeit).toBeUndefined();
  });
});

// ── #27 · «Gegenstandslos» ohne Datum wird durch eine SPÄTERE Fassung derselben Fussnote widerlegt ─────────────────
// Bisher widerlegte nur ein DATIERTES gegenstandslos (Vergleich der Daten, GP #1209 Hinweis, Korpus 0 Fälle). Ohne
// Datum fehlt der Vergleich; die Fussnote selbst ordnet aber amtlich chronologisch (ältester Eingriff zuerst, s.
// `baueArtikelHistorie`): folgt dem Vermerk INNERHALB DERSELBEN Fussnote eine Neufassung/Einfügung, lebt der Artikel
// wieder. Über Fussnoten hinweg ist die Reihenfolge nicht chronologisch — dort bleibt der Vermerk (§1/§8, kein Raten).
describe('P7 #27 · undatiertes «Gegenstandslos» + spätere Fassung in derselben Fussnote', () => {
  const fn = (text: string): FnEingang => ({ text, links: [], absatz: null, item: null });

  it('«Gegenstandslos. Fassung gemäss …, in Kraft seit …» ⇒ der Artikel lebt wieder: kein gegenstandslos', () => {
    const { historie } = baueArtikelHistorie([fn('Gegenstandslos. Fassung gemäss Ziff. I des BG vom 1. Jan. 2020, in Kraft seit 1. Jan. 2021 (AS 2020 1).')]);
    expect(historie?.gegenstandslos).toBeUndefined();
  });

  it('auch eine UNDATIERTE spätere Einfügung widerlegt (Reihenfolge, nicht Datum, trägt den Beleg)', () => {
    const { historie } = baueArtikelHistorie([fn('Gegenstandslos. Eingefügt durch Ziff. I des BG vom 1. Jan. 2020 (AS 2020 1).')]);
    expect(historie?.gegenstandslos).toBeUndefined();
  });

  it('Gegenprobe: «Fassung … 2019. Gegenstandslos.» (Vermerk ZULETZT) bleibt gegenstandslos ohne Datum', () => {
    const { historie } = baueArtikelHistorie([fn('Fassung gemäss Ziff. I des BG vom 1. Jan. 2018, in Kraft seit 1. Jan. 2019 (AS 2018 1). Gegenstandslos.')]);
    expect(historie?.gegenstandslos).toEqual({ seit: null });
  });

  it('Gegenprobe: eine Fassung in einer ANDEREN Fussnote ist nicht chronologisch einordenbar ⇒ Vermerk bleibt (OR SchlT 6-Form)', () => {
    const { historie } = baueArtikelHistorie([
      fn('Gegenstandslos.'),
      fn('Fassung gemäss Ziff. I des BG vom 1. Jan. 2020, in Kraft seit 1. Jan. 2021 (AS 2020 1).'),
    ]);
    expect(historie?.gegenstandslos).toEqual({ seit: null });
  });

  it('Gegenprobe: das DATIERTE gegenstandslos folgt weiter dem Datums-Vergleich (StGB 67f bleibt gegenstandslos seit 2018)', () => {
    const { historie } = baueArtikelHistorie([fn('Gegenstandslos gemäss Ziff. IV 1 des BG vom 19. Juni 2015, mit Wirkung seit 1. Jan. 2018 (AS 2016 1249).')]);
    expect(historie?.gegenstandslos).toEqual({ seit: '2018-01-01' });
  });
});
