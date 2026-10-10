// WARNHINWEIS (ROADMAP JETZT 3): «Bekannter Fehler – Ergebnis nicht verwenden».
// Sonden: (1) jede Karten-id der Datendatei existiert im Katalog und ist gebaut,
// (2) jede FB-ID steht als offene R-Zeile in plan/FEHLERBESTAND.md Bereich 5 —
// wird sie dort gelöscht oder als erledigt markiert, wird diese Sonde rot und
// verlangt das Entfernen hier (JETZT 4), (3) jede Karten-id ist auf einer Seite
// verdrahtet, (4) Hinweis, PDF-Modell und Vereinigung verschachtelter Rahmen.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ReactElement } from 'react';
import { renderToStaticMarkup, renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { LocaleProvider } from '../components/locale';
import { RechnerKuendigung } from '../pages/RechnerKuendigung';
import { RechnerMietrecht } from '../pages/RechnerMietrecht';
import { RechnerTagerechner } from '../pages/RechnerTagerechner';
import { RechnerVerjaehrung } from '../pages/RechnerVerjaehrung';
import { describe, expect, it } from 'vitest';
import { BEKANNTE_FEHLER, BEKANNTER_FEHLER_TITEL, bekannteFehlerFuer } from '../lib/bekannteFehler';
import { ALLE_KARTEN } from '../lib/startseiteConfig';
import { BekannteFehlerRahmen } from '../components/BekannterFehler';
import { ErgebnisBlock } from '../components/ErgebnisBlock';
import { buildPdfModel, modelText, type PdfDocConfig } from '../lib/pdf/pdfModel';
import { alleQuellen, liesOhneKommentare, rel } from './appDateien';

const FB = readFileSync(join(__dirname, '..', '..', 'plan', 'FEHLERBESTAND.md'), 'utf8');
const BEREICH_5 = FB.slice(FB.indexOf('\n## 5 · '), FB.indexOf('\n## 6 · '));
const WERKZEUGE = Object.keys(BEKANNTE_FEHLER);

describe('WARNHINWEIS · Datendatei', () => {
  it('Bereich 5 wurde gefunden (sonst prüft die FB-Sonde ins Leere, §6.7)', () => {
    expect(BEREICH_5.length).toBeGreaterThan(1000);
    expect(BEREICH_5).toContain('| RV-17 |');
  });

  it('jede Karten-id existiert im Katalog und ist gebaut (nicht «geplant»)', () => {
    const katalog = new Map(ALLE_KARTEN.map((k) => [k.id, k.status]));
    const fehlend = WERKZEUGE.filter((w) => !katalog.has(w));
    const geplant = WERKZEUGE.filter((w) => katalog.get(w) === 'geplant');
    expect(fehlend, 'Karten-id nicht in startseiteConfig').toEqual([]);
    expect(geplant, 'Warnhinweis an einer ungebauten Karte').toEqual([]);
  });

  it('jede FB-ID ist eine offene R-Zeile in FEHLERBESTAND.md Bereich 5', () => {
    const probleme: string[] = [];
    for (const [w, liste] of Object.entries(BEKANNTE_FEHLER)) {
      expect(liste.length, `${w}: leere Liste — Schlüssel löschen`).toBeGreaterThan(0);
      for (const { fb } of liste) {
        // Identitäts-Treffer mit Wortgrenze: die ganze erste Zelle, nicht ein Substring.
        const zeile = BEREICH_5.split('\n').find((z) => z.startsWith(`| ${fb} |`));
        if (!zeile) { probleme.push(`${w}: ${fb} fehlt in Bereich 5`); continue; }
        const zellen = zeile.split('|').map((z) => z.trim());
        // zellen: ['', Nr, Kl., Klartext, Beispiel, offen?, David?, Posten, '']
        if (zellen[2] !== 'R') probleme.push(`${w}: ${fb} ist nicht Klasse R`);
        if (!/^ja\b/.test(zellen[5])) probleme.push(`${w}: ${fb} nicht mehr offen («${zellen[5]}»)`);
      }
    }
    expect(probleme).toEqual([]);
  });

  it('jede Karten-id ist auf einer Seite verdrahtet (BekannteFehlerRahmen)', () => {
    const quellen = alleQuellen()
      .map((p) => ({ p: rel(p), q: liesOhneKommentare(p) }))
      .filter(({ q }) => q.includes('BekannteFehlerRahmen'));
    const unverdrahtet = WERKZEUGE.filter((w) =>
      !quellen.some(({ q }) => q.includes(`werkzeug="${w}"`) || q.includes(`'${w}'`)));
    expect(unverdrahtet).toEqual([]);
  });
});

describe('WARNHINWEIS · Anzeige', () => {
  const block = (werkzeuge: string[]) => {
    let knoten = <ErgebnisBlock><p>Ergebnis</p></ErgebnisBlock>;
    for (const w of [...werkzeuge].reverse()) knoten = <BekannteFehlerRahmen werkzeug={w}>{knoten}</BekannteFehlerRahmen>;
    return renderToStaticMarkup(knoten);
  };

  it('zeigt Titel, Rolle und FB-IDs im Ergebnisblock vor dem Ergebnis', () => {
    const html = block(['notariat-grundbuch']);
    expect(html).toContain(BEKANNTER_FEHLER_TITEL);
    expect(html).toContain('role="status"');
    expect(html).toContain('lc-notice-danger');
    for (const id of ['RV-17', 'RV-19', 'RV-20', 'RV-24', 'RV-25', 'RV-82']) expect(html).toContain(`(${id})`);
    expect(html.indexOf(BEKANNTER_FEHLER_TITEL)).toBeLessThan(html.indexOf('<p>Ergebnis</p>'));
  });

  it('ohne Rahmen und bei Werkzeug ohne Eintrag: kein Hinweis', () => {
    expect(block([])).not.toContain(BEKANNTER_FEHLER_TITEL);
    expect(block(['verjaehrung'])).not.toContain(BEKANNTER_FEHLER_TITEL);
    expect(block([])).not.toContain('data-bekannter-fehler');
  });

  it('verschachtelte Rahmen vereinigen sich ohne Doppel (Tagerechner + eingebetteter ZPO-/SchKG-Rechner)', () => {
    const zpo = block(['tagerechner', 'zpo-fristen']);
    expect(zpo.split('(RV-53)').length - 1).toBe(1);
    expect(zpo).toContain('(RV-52)');
    const schkg = bekannteFehlerFuer(['tagerechner', 'schkg-fristen']).map((f) => f.fb);
    expect(schkg).toEqual(expect.arrayContaining(['RV-49', 'RV-52', 'RV-53', 'RV-63']));
  });
});

describe('WARNHINWEIS · echte Seiten (Vorgabewerte tragen schon ein Ergebnis)', () => {
  const seite = (C: () => ReactElement, pfad: string) => renderToString(
    <LocaleProvider><MemoryRouter initialEntries={[pfad]}><C /></MemoryRouter></LocaleProvider>);

  it('Mietrecht, Tagerechner, Kündigung (B+C) zeigen ihre Fehler; Verjährung (ohne Eintrag) nicht', () => {
    const miete = seite(RechnerMietrecht, '/rechner/mietrecht');
    for (const id of ['RV-06', 'RV-33', 'RV-40']) expect(miete).toContain(`(${id})`);
    const tage = seite(RechnerTagerechner, '/rechner/tagerechner');
    for (const id of ['RV-49', 'RV-52', 'RV-53']) expect(tage).toContain(`(${id})`);
    const kuend = seite(RechnerKuendigung, '/rechner/kuendigung#kuendigung');
    for (const id of ['RV-33', 'RV-44']) expect(kuend).toContain(`(${id})`);
    const verj = seite(RechnerVerjaehrung, '/rechner/verjaehrung');
    expect(verj).toContain('id="lc-ergebnis');
    expect(verj).not.toContain(BEKANNTER_FEHLER_TITEL);
  });
});

describe('WARNHINWEIS · PDF', () => {
  const cfg: PdfDocConfig = {
    title: 'Test', domain: 'test', fileBase: 'Test', inputs: { Betrag: 'CHF 100.00' },
    sections: [{ titel: 'Ergebnis', ergebnis: { status: 'ok', ergebnis: 'CHF 1.00', rechenweg: [], normverweise: [], warnungen: [], annahmen: [] } }],
    disclaimer: 'Keine Rechtsberatung.',
  };
  const jetzt = new Date(2026, 9, 11, 12, 0);

  it('ohne Feld byte-gleich zum bisherigen Modell, mit Feld Hinweisbox direkt unter dem Kopf', () => {
    const ohne = buildPdfModel(cfg, jetzt);
    expect(JSON.stringify(buildPdfModel({ ...cfg, bekannteFehler: undefined }, jetzt))).toBe(JSON.stringify(ohne));
    const mit = buildPdfModel({ ...cfg, bekannteFehler: { titel: BEKANNTER_FEHLER_TITEL, eintraege: ['Grundpfand falsch. (RV-19)'] } }, jetzt);
    expect(mit.blocks[1]).toMatchObject({ art: 'hinweisbox', ton: 'warn' });
    expect(modelText(mit)).toContain('(RV-19)');
    expect(mit.blocks.length).toBe(ohne.blocks.length + 2);
  });
});
