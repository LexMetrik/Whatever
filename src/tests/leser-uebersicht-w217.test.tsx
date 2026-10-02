/**
 * W2·17-UI-BEFUNDE · Erlass-Übersicht (Steckbrief-Box) — Befund-Sonden
 * (Inventar 1.10.2026, Befunde PE-H1/H4/H5/H6/H7/H9).
 *
 * Diese Datei wächst je Befund-Gruppe; jede Sonde war gegen den Vorzustand rot.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import {
  erfassungsgradSatz, ruheZeile, uebersichtsAngaben, type UebersichtsEingabe,
} from '../pages/gesetz-leser/v3/uebersichtAngaben';
import { ErlassLeserKopf } from '../pages/gesetz-leser/parts/ErlassLeserKopf';
import { UebersichtBox } from '../pages/gesetz-leser/v3/UebersichtBox';
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
  it('«Einträge» ist unser Hilfswort: der Satz fragt nicht, ob es amtlich sei', () => {
    const a = uebersichtsAngaben(eingabe({
      erlass: erlassBauen({ ebene: 'kanton', kanton: 'SG', sr: null, artikelAnzahl: 607 }),
      anzahl: 607, bestimmungsEtikettStatus: 'entwurf',
      kennzahlen: { artikelAnzahl: 607, anhangArtikel: 590, hatSidecar: true } as never,
    }));
    const hinweis = a.hinweise.find((h) => h.includes('gezählt')) ?? '';
    expect(hinweis).toContain('«Einträge»');
    expect(hinweis).not.toMatch(/ob das die amtliche Bezeichnung ist/);
    expect(hinweis).toMatch(/keine amtliche Bezeichnung/);
  });
  it('«Artikel»/«Paragraphen» behalten die offene Prüf-Aussage unverändert', () => {
    const a = uebersichtsAngaben(eingabe({
      erlass: erlassBauen({ ebene: 'kanton', kanton: 'AG', sr: '295.250' }),
      bestimmungsWort: 'Paragraphen', bestimmungsEtikettStatus: 'entwurf',
      kennzahlen: { artikelAnzahl: 50, anhangArtikel: 2, hatSidecar: true } as never,
    }));
    expect(a.hinweise.find((h) => h.includes('gezählt')))
      .toContain('ob das die amtliche Bezeichnung ist, ist noch nicht geprüft');
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

// ═══ Gruppe B · Links, Etikett, Klapp-Pfeil der Box ═════════════════════════
const sgPdf = 'https://www.gesetzessammlung.sg.ch/api/de/versions/3849/pdf_file';
const boxHtml = (e: BrowseErlass, extra: Partial<UebersichtsEingabe> = {}, rohdaten?: { href: string; stand: string | null }) =>
  renderToString(<UebersichtBox angaben={uebersichtsAngaben(eingabe({ erlass: e, ...extra }))} rohdaten={rohdaten as never} offen />);

describe('H4-B03 · «Amtliche Fassung» auf einen PDF-Endpunkt ist als Download gekennzeichnet', () => {
  it('quelleUrl auf LexWork-PDF-Endpunkt: ⬇ statt ↗, Etikett nennt das PDF', () => {
    for (const url of [sgPdf, `${sgPdf}_with_annexes`]) {
      const a = uebersichtsAngaben(eingabe({
        erlass: erlassBauen({ ebene: 'kanton', kanton: 'SG', quelleUrl: url }),
      }));
      const l = a.links.find((x) => x.id === 'quelle');
      expect(l?.zeichen, url).toBe('⬇');
      expect(l?.label, url).toBe('Amtliche Fassung (PDF)');
      expect(l?.href).toBe(url);
    }
  });
  it('aufgehobener Erlass behält seine Beschriftung, nur mit PDF-Zusatz', () => {
    const a = uebersichtsAngaben(eingabe({
      erlass: erlassBauen({ ebene: 'kanton', quelleUrl: sgPdf, aufgehoben: { seit: '2026-03-01' } }),
    }));
    expect(a.links[0].label).toBe('Amtliche (aufgehobene) Fassung (PDF)');
    expect(a.links[0].zeichen).toBe('⬇');
  });
  it('HTML-Ziele bleiben ↗ (Fedlex, LexWork-Textseite)', () => {
    for (const url of [
      'https://www.fedlex.admin.ch/eli/cc/probe/de',
      'https://www.gesetzessammlung.bs.ch/app/de/texts_of_law/640.100',
      'https://www.gesetzessammlung.sg.ch/api/de/texts_of_law/811.1',
    ]) {
      const a = uebersichtsAngaben(eingabe({ erlass: erlassBauen({ quelleUrl: url }) }));
      expect(a.links[0].zeichen, url).toBe('↗');
      expect(a.links[0].label).toBe('Amtliche Fassung');
    }
  });
  it('gerendert: das ⬇-Zeichen geht dem Etikett voran, kein ↗ am PDF-Ziel', () => {
    const h = boxHtml(erlassBauen({ ebene: 'kanton', quelleUrl: sgPdf }));
    const link = /<a [^>]*data-v3-uebersicht-link="quelle"[^>]*>(.*?)<\/a>/.exec(h)?.[1] ?? '';
    expect(link).toContain('⬇');
    expect(link).not.toContain('↗');
    expect(link.replace(/<[^>]+>/g, '')).toBe('⬇ Amtliche Fassung (PDF)');
  });
});

describe('H4-B03 · ALLE PDF-liefernden Register-Quellen tragen «(PDF)»', () => {
  const register = JSON.parse(
    readFileSync(join(process.cwd(), 'public', 'normtext', 'register.json'), 'utf8'),
  ) as { erlasse: { quelleUrl?: string }[] };
  // Gemessen 2.10.2026 (curl -I, Content-Type): jede dieser URLs liefert application/pdf.
  const pdfQuellen = register.erlasse
    .map((e) => e.quelleUrl ?? '')
    .filter((u) => /pdf/i.test(u));
  it('Basis: 15 PDF-Quellen im Register (Zählung, kein Handwert)', () => {
    expect(pdfQuellen.length).toBe(15);
  });
  it('jede trägt «(PDF)»; ⬇ nur beim LexWork-Endpunkt (attachment), sonst ↗', () => {
    for (const url of pdfQuellen) {
      const l = uebersichtsAngaben(eingabe({
        erlass: erlassBauen({ ebene: 'kanton', kanton: 'SG', quelleUrl: url }),
      })).links.find((x) => x.id === 'quelle');
      expect(l?.label, url).toBe('Amtliche Fassung (PDF)');
      expect(l?.zeichen, url).toBe(/\/pdf_file(?:_with_annexes)?$/.test(url) ? '⬇' : '↗');
    }
  });
  it('keine falschen Positive: Seiten, die nur «pdf» im Pfad tragen, bleiben ohne Zusatz', () => {
    for (const url of [
      'https://www.fedlex.admin.ch/eli/cc/probe/de',
      'https://example.invalid/pdfs/uebersicht.html',
      'https://example.invalid/texts_of_law/pdf-recht',
    ]) {
      const l = uebersichtsAngaben(eingabe({ erlass: erlassBauen({ quelleUrl: url }) })).links[0];
      expect(l.label, url).toBe('Amtliche Fassung');
      expect(l.zeichen, url).toBe('↗');
    }
  });
});

describe('H1-D03 · «Aufgehoben» passt in die 5-rem-Etikettspalte', () => {
  it('Etikett ist ein Wort (kein Umbruch in «Aufgehoben / per»)', () => {
    const a = uebersichtsAngaben(eingabe({ erlass: erlassBauen({ aufgehoben: { seit: '2026-03-01' } }) }));
    const z = a.zeilen.find((x) => x.id === 'aufgehoben');
    expect(z?.label).toBe('Aufgehoben');
    expect(z?.wert).toBe('01.03.2026');
  });
});

describe('H1-D04 · Link-Trefferflächen ≥ 24 px (F9) · H1-D05 · Klapp-Pfeil ≥ 3:1', () => {
  const h = boxHtml(
    erlassBauen({ pdfUrl: 'https://example.invalid/x.pdf' }), {},
    { href: '/normtext/bund/PROBE.json', stand: '2026-01-01' },
  );
  it('jeder Link der Box trägt lc-tap-polster (Quelle, PDF, Rohdaten)', () => {
    const anker = [...h.matchAll(/<a [^>]*>/g)].map((m) => m[0]);
    expect(anker).toHaveLength(3);
    for (const a of anker) expect(a, a).toMatch(/class="[^"]*\blc-tap-polster\b/);
  });
  it('das «▸» steht in ink-500 (dunkel 2.88:1 mit ink-400)', () => {
    const pfeil = /<span [^>]*class="([^"]*)"[^>]*>▸<\/span>/.exec(h)?.[1] ?? '';
    expect(pfeil).toContain('text-ink-500');
    expect(pfeil).not.toContain('text-ink-400');
  });
});
