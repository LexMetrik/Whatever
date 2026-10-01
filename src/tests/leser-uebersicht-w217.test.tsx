/**
 * W2·17-UI-BEFUNDE · Erlass-Übersicht (Steckbrief-Box) — Befund-Sonden
 * (Inventar 1.10.2026, Befunde PE-H1/H4/H5/H6/H7/H9).
 *
 * Diese Datei wächst je Befund-Gruppe; jede Sonde war gegen den Vorzustand rot.
 */
import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import {
  erfassungsgradSatz, ruheZeile, uebersichtsAngaben, type UebersichtsEingabe,
} from '../pages/gesetz-leser/v3/uebersichtAngaben';
import { ErlassLeserKopf } from '../pages/gesetz-leser/parts/ErlassLeserKopf';
import type { BrowseErlass } from '../lib/normtext/browse-typen';

function erlassBauen(p: Partial<BrowseErlass>): BrowseErlass {
  return {
    key: 'PROBE', ebene: 'bund', kanton: null, kuerzel: 'PROBE', titel: 'Probe-Erlass',
    sr: '999.9', rechtsgebiet: 'privat', sprache: 'de', rang: 1, status: 'snapshot',
    datei: 'bund/PROBE.json', artikelAnzahl: 10, stand: '2026-01-01',
    quelleUrl: 'https://www.fedlex.admin.ch/eli/cc/probe/de',
    fassungsToken: '20260101', pdfPfad: null, pdfUrl: null, pdfStand: null,
    inkraftSeit: null,
    ...p,
  } as BrowseErlass;
}

function eingabe(p: Partial<UebersichtsEingabe> & { erlass: BrowseErlass }): UebersichtsEingabe {
  return {
    kopf: null, currency: undefined, erlassTyp: undefined, anzahl: 10,
    bestimmungsWort: 'Artikel', bestimmungsEtikettStatus: undefined,
    gliederungsTiefe: 0, kennzahlen: null, kantonSys: {}, kantonErlassAnzahl: null,
    nichtKonsolidiert: false, nichtKonsolidiertSeit: null,
    ...p,
  };
}

// ── H1-B01 / PA-6-B07 · «1 Paragraphen» ─────────────────────────────────────
describe('Zählform in Ruhezeile und Fakten-Zeile (H1-B01, PA-6-B07)', () => {
  const bs = { ebene: 'kanton', sr: '257.118' } as const;

  it('Ruhezeile: genau 1 Eintrag steht im Singular', () => {
    expect(ruheZeile(bs, 1, 'Paragraphen')).toBe('257.118 · 1 Paragraph');
    expect(ruheZeile(bs, 1, 'Artikel')).toBe('257.118 · 1 Artikel');
    // Anhang-Dominanz: «Einträge» braucht ebenfalls den Singular.
    expect(ruheZeile(bs, 1, 'Artikel', { artikelAnzahl: 1, anhangArtikel: 1 })).toBe('257.118 · 1 Eintrag');
  });

  it('Ruhezeile: Mehrzahl bleibt unverändert, auch bei 0 und 2', () => {
    expect(ruheZeile(bs, 2, 'Paragraphen')).toBe('257.118 · 2 Paragraphen');
    expect(ruheZeile(bs, 0, 'Paragraphen')).toBe('257.118 · 0 Paragraphen');
    expect(ruheZeile(bs, 607, 'Artikel', { artikelAnzahl: 607, anhangArtikel: 590 })).toBe('257.118 · 607 Einträge');
  });

  it('Fakten-Zeile des Titelblatts: gleicher Singular wie die Ruhezeile', () => {
    const render = (n: number, wort: 'Artikel' | 'Paragraphen') => renderToString(
      <MemoryRouter>
        <ErlassLeserKopf erlass={erlassBauen({ ebene: 'kanton', kanton: 'BS', sr: '257.118' })}
          overline="Kanton BS" artikelAnzahl={n} bestimmungsWort={wort} hinweis="H" />
      </MemoryRouter>,
    ).replace(/<[^>]+>/g, '');
    expect(render(1, 'Paragraphen')).toMatch(/1 Paragraph(?!en)/);
    expect(render(3, 'Paragraphen')).toMatch(/3 Paragraphen/);
  });
});

// ── H5-B01 · «bisher 1 Erlasse erfasst» ─────────────────────────────────────
describe('Erfassungsgrad-Satz im Singular (H5-B01)', () => {
  it('genau 1 erfasster Erlass: «ist bisher 1 Erlass erfasst», nie «1 Erlasse»', () => {
    const satz = erfassungsgradSatz({ kanton: 'UR', n: 1, stufe: 'duenn' });
    expect(satz).toBe('Aus dem Kanton UR ist bisher 1 Erlass erfasst — der Bestand ist nicht vollständig.');
    expect(satz).not.toMatch(/\b1 Erlasse\b/);
  });
  it('belegt vollständig mit N = 1: «der einzige Erlass», nie «alle 1 Erlasse»', () => {
    const satz = erfassungsgradSatz({
      kanton: 'UR', n: 1, stufe: 'vollstaendig',
      belegtN: 1, belegStand: '2026-08-18', belegQuelle: 'https://example.invalid/',
    });
    expect(satz).not.toMatch(/\b1 Erlasse\b/);
    expect(satz).toContain('einzige Erlass');
  });
  it('Mehrzahl unverändert', () => {
    expect(erfassungsgradSatz({ kanton: 'BS', n: 859, stufe: 'auswahl' }))
      .toBe('Aus dem Kanton BS sind bisher 859 Erlasse erfasst — der Bestand ist nicht vollständig.');
  });
});

// ── H5-B02 · Zähl-Etikett-Hinweis folgt der Ruhezeile ───────────────────────
describe('§8-Hinweis nennt dasselbe Zählwort wie die Ruhezeile (H5-B02)', () => {
  it('SG-3849-Muster: Ruhezeile «Einträge» ⇒ der Hinweis sagt nicht «Artikel»', () => {
    const a = uebersichtsAngaben(eingabe({
      erlass: erlassBauen({ ebene: 'kanton', kanton: 'SG', sr: null, artikelAnzahl: 607 }),
      anzahl: 607, bestimmungsEtikettStatus: 'entwurf',
      kennzahlen: { artikelAnzahl: 607, anhangArtikel: 590, hatSidecar: true } as never,
    }));
    expect(a.ruhe).toContain('607 Einträge');
    const hinweis = a.hinweise.find((h) => h.includes('gezählt'));
    expect(hinweis).toContain('«Einträge»');
    expect(hinweis).not.toContain('«Artikel»');
  });
  it('ohne Anhang-Dominanz bleibt das Basis-Wort', () => {
    const a = uebersichtsAngaben(eingabe({
      erlass: erlassBauen({ ebene: 'kanton', kanton: 'AG', sr: '295.250' }),
      bestimmungsWort: 'Paragraphen', bestimmungsEtikettStatus: 'entwurf',
      kennzahlen: { artikelAnzahl: 50, anhangArtikel: 2, hatSidecar: true } as never,
    }));
    expect(a.hinweise.find((h) => h.includes('gezählt'))).toContain('«Paragraphen»');
  });
});
