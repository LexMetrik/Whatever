// D6 · Werkzeug-Kanten suffix-exakt (W2·29-WERKBANK-LESER, Befunde AN-5/AN-6, 23.9.2026).
//
// Die Norm↔Werkzeug-Tabelle kannte bis 23.9.2026 nur Hauptnummern: «324_a» fiel
// auf 324, also hing der Lohnfortzahlungs-Rechner an Art. 324 OR (Annahmeverzug
// des Arbeitgebers) statt an Art. 324a/324b OR, die Nichtbekanntgabe-Vorlage an
// Art. 8 statt 8a SchKG. Und das ArG trug den Lohnfortzahlungs-Rechner, obwohl
// die Regel im OR steht. Dieses Tor hält fest:
//   (1) Suffix-Exaktheit — kein Vorsilben-Treffer in beide Richtungen, bis/ter.
//   (2) die korrigierten Kanten (Fedlex AKN, geltende Fassung, abgerufen 23.9.2026).
//   (3) jede Suffix-Grenze ist ein amtlich existierender Artikel (lokaler
//       Fedlex-Snapshot public/normtext/bund/<KEY>.json) — keine erfundene Grenze.
//
// ROT GESEHEN (§6.7): gegen werkzeuge.ts von origin/main 7a7d8457c gefahren
// (Datei per `git show` zurückgelegt) — Ausgabe im PR-Bericht.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import {
  ARTIKEL_WERKZEUGE, ERLASS_WERKZEUGE, werkzeugeFuerArtikel, werkzeugeFuerZitate,
  artikelWerkzeugGruppen, trifftArtikel, vergleicheArtikel, bereichLabel,
} from '../lib/normtext/werkzeuge';

const ids = (erlass: string, token: string) => werkzeugeFuerArtikel(erlass, token).map((w) => w.id);
const zitatIds = (zitat: string) => werkzeugeFuerZitate([zitat]).map((w) => w.id);

describe('D6 (1) — Artikel-Kennung exakt mit Suffix', () => {
  it('324 trifft den Lohnfortzahlungs-Rechner NICHT, 324a/324b schon (AN-5)', () => {
    expect(ids('OR', '324')).not.toContain('lohnfortzahlung');
    expect(ids('OR', '324_a')).toContain('lohnfortzahlung');
    expect(ids('OR', '324_b')).toContain('lohnfortzahlung');
    expect(ids('OR', '325')).not.toContain('lohnfortzahlung');
  });

  it('SchKG: 8 trifft die Nichtbekanntgabe NICHT, 8a schon; 8a_bis nicht', () => {
    expect(ids('SCHKG', '8')).not.toContain('nichtbekanntgabe-betreibung');
    expect(ids('SCHKG', '8_a')).toContain('nichtbekanntgabe-betreibung');
    expect(ids('SCHKG', '8_a_bis')).not.toContain('nichtbekanntgabe-betreibung');
  });

  it('umgekehrt: eine blanke Grenze trifft ihre Sub-Artikel nicht (273 ⊅ 273a)', () => {
    expect(ids('OR', '273')).toContain('mietrecht');
    expect(ids('OR', '273_a')).not.toContain('mietrecht');
  });

  it('bis/ter: Grenze «9bis» trifft genau 9bis — nicht 9, 9a, 9ter, 10', () => {
    const k = { von: 9, bis: 9, vonArtikel: '9bis', bisArtikel: '9bis' };
    expect(trifftArtikel(k, '9_bis')).toBe(true);
    expect(trifftArtikel(k, '9bis')).toBe(true);
    for (const t of ['9', '9_a', '9_ter', '10', '9_bis_a']) expect(trifftArtikel(k, t), t).toBe(false);
    const g = { von: 329, bis: 329, vonArtikel: '329g', bisArtikel: '329gbis' };
    expect(trifftArtikel(g, '329_g_bis')).toBe(true);
    expect(trifftArtikel(g, '329_g')).toBe(true);
    expect(trifftArtikel(g, '329_h')).toBe(false);
    expect(trifftArtikel(g, '329_g_ter')).toBe(false);
  });

  it('amtliche Reihenfolge: 324 < 324a < 324b < 325 · 329g < 329gbis < 329h · 9 < 9bis < 9ter < 10', () => {
    const folgen = [['324', '324a', '324b', '325'], ['329g', '329gbis', '329h'], ['9', '9bis', '9ter', '10']];
    for (const f of folgen) {
      for (let i = 1; i < f.length; i++) expect(vergleicheArtikel(f[i - 1], f[i]), `${f[i - 1]} < ${f[i]}`).toBeLessThan(0);
    }
    expect(vergleicheArtikel('324_a', '324a')).toBe(0);
  });

  it('Nicht-Artikel (Anhang, Doppelnummer) trifft nie', () => {
    const k = { von: 620, bis: 635 };
    for (const t of ['annex_1', '627_628', '', 'disp_u1_art_1']) expect(trifftArtikel(k, t), t).toBe(false);
  });

  it('Zitat-Richtung folgt derselben Regel (Art. 324a OR ja, Art. 324 OR nein)', () => {
    expect(zitatIds('Art. 324a Abs. 2 OR')).toContain('lohnfortzahlung');
    expect(zitatIds('Art. 324 OR')).not.toContain('lohnfortzahlung');
    expect(zitatIds('Art. 8a SchKG')).toContain('nichtbekanntgabe-betreibung');
    expect(zitatIds('Art. 8 SchKG')).not.toContain('nichtbekanntgabe-betreibung');
  });

  it('Etiketten tragen den Suffix (Art. 324a–324b, Art. 8a, Art. 127–142)', () => {
    const or = artikelWerkzeugGruppen('OR').map((g) => g.label);
    expect(or).toContain('Art. 324a–324b');
    expect(or).toContain('Art. 127–142');
    expect(or).not.toContain('Art. 324');
    expect(artikelWerkzeugGruppen('SCHKG').map((g) => g.label)).toContain('Art. 8a');
    expect(bereichLabel({ von: 336, bis: 336, vonArtikel: '336c', bisArtikel: '336c' })).toBe('Art. 336c');
  });
});

describe('D6 (2) — korrigierte Kanten gegen Fedlex (Stand 23.9.2026)', () => {
  it('Miete: 266–266o und 271–273 tragen den Kündigungsrechner, 267–270e (Rückgabe/Mietzins) nicht', () => {
    for (const t of ['266', '266_a', '266_o', '271', '271_a', '272_b', '273']) expect(ids('OR', t), t).toContain('mietrecht');
    for (const t of ['267', '268', '269', '269_d', '270', '270_e']) expect(ids('OR', t), t).not.toContain('mietrecht');
  });

  it('Arbeit: 335–335c und 336c tragen den Kündigungsrechner, Massenentlassung/missbräuchliche Kündigung nicht', () => {
    for (const t of ['335', '335_a', '335_b', '335_c', '336_c']) expect(ids('OR', t), t).toContain('kuendigung-sperrfristen');
    for (const t of ['335_d', '335_k', '336', '336_a', '336_b', '336_d']) expect(ids('OR', t), t).not.toContain('kuendigung-sperrfristen');
  });

  it('Werkvertrag: 367–371 OR tragen den Gewährleistungsrechner (Vertragstyp «werkvertrag»)', () => {
    for (const t of ['367', '368', '370', '371']) expect(ids('OR', t), t).toContain('gewaehrleistung');
    expect(ids('OR', '372')).not.toContain('gewaehrleistung');
  });

  it('ZPO: Rechtsmittelfristen nur an 311–314 und 321, nicht an 315–320', () => {
    for (const t of ['311', '312', '314', '321']) expect(ids('ZPO', t), t).toContain('zpo-fristen');
    for (const t of ['315', '317', '319', '320']) expect(ids('ZPO', t), t).not.toContain('zpo-fristen');
    expect(ids('ZPO', '94_a')).toContain('streitwert');
  });

  it('ZGB: Erb-Fristen an 521, 533, 566–571, 580, 587, 600–601 — nicht an 522–532, 598/599', () => {
    for (const t of ['521', '533', '566', '567', '571', '580', '587', '600', '601']) expect(ids('ZGB', t), t).toContain('erbrecht-fristen');
    for (const t of ['522', '532', '598', '599']) expect(ids('ZGB', t), t).not.toContain('erbrecht-fristen');
    for (const t of ['457', '462', '471', '522', '532']) expect(ids('ZGB', t), t).toContain('erbteilung');
    expect(ids('ZGB', '533')).not.toContain('erbteilung');
  });

  it('SchKG: Betreibungskosten nur an Art. 68, nicht an 68a–68e; Rechtsstillstand 56–63 ⇒ Fristen', () => {
    expect(ids('SCHKG', '68')).toContain('betreibungskosten');
    expect(ids('SCHKG', '68_a')).not.toContain('betreibungskosten');
    for (const t of ['56', '57_a', '62', '63']) expect(ids('SCHKG', t), t).toContain('schkg-fristen');
  });

  it('StGB: Gerichtsstand-Rechner nur am Begehungsort (Art. 8), nicht an Art. 3–7', () => {
    expect(ids('STGB', '8')).toContain('straf-zustaendigkeit');
    for (const t of ['3', '5', '7']) expect(ids('STGB', t), t).not.toContain('straf-zustaendigkeit');
  });

  it('ArG trägt keinen OR-Rechner mehr (AN-6) — nur den Überzeit-Zuschlag (Art. 12/13 ArG)', () => {
    const arg = ERLASS_WERKZEUGE.ARG;
    for (const id of ['lohnfortzahlung', 'ferienanspruch', 'dreizehnter-monatslohn']) expect(arg, id).not.toContain(id);
    expect(arg).toEqual(['ueberstunden-zuschlag']);
    const argKanten = ARTIKEL_WERKZEUGE.filter((k) => k.erlass === 'ARG');
    expect(argKanten.flatMap((k) => k.werkzeuge)).toEqual(['ueberstunden-zuschlag']);
  });
});

describe('D6 (3) — Suffix-Grenzen sind echte Artikel', () => {
  const tokens = new Map<string, Set<string>>();
  const korpus = (key: string): Set<string> => {
    let s = tokens.get(key);
    if (!s) {
      const roh = JSON.parse(readFileSync(join(process.cwd(), 'public/normtext/bund', `${key}.json`), 'utf8')) as { eintraege: { artikel: string }[] };
      s = new Set(roh.eintraege.map((e) => e.artikel.replace(/_/g, '')));
      tokens.set(key, s);
    }
    return s;
  };

  it('jede vonArtikel/bisArtikel-Grenze: Hauptnummer = von/bis, Grenze existiert im Fedlex-Snapshot, von ≤ bis', () => {
    const fehler: string[] = [];
    for (const k of ARTIKEL_WERKZEUGE) {
      const wo = `${k.erlass} ${bereichLabel(k)}`;
      for (const [grenze, nr] of [[k.vonArtikel, k.von], [k.bisArtikel, k.bis]] as const) {
        if (grenze === undefined) continue;
        if (Number.parseInt(grenze, 10) !== nr) fehler.push(`${wo}: Grenze ${grenze} ≠ Hauptnummer ${nr}`);
        if (!korpus(k.erlass).has(grenze)) fehler.push(`${wo}: Art. ${grenze} fehlt im Snapshot`);
      }
      const lo = k.vonArtikel ?? String(k.von), hi = k.bisArtikel ?? String(k.bis);
      if (vergleicheArtikel(lo, hi) > 0) fehler.push(`${wo}: von > bis`);
    }
    expect(fehler).toEqual([]);
  });
});
