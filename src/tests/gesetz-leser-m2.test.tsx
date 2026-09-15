/**
 * M2 (David 29.6.2026) — Aufhebungs-Zitatzeile «Aufgehoben durch … (AS …)» ist
 * eine Fussnote; die Statuszeile «· aufgehoben» (Artikelzustand) bleibt IMMER
 * sichtbar.
 *
 * W2·5d G2b (Fussnoten-Unifizierung, 4.7.2026): der alte `fussnotenAuf`-React-
 * Schalter entfällt — Fussnoten (inkl. Aufhebungsnotiz) liegen jetzt IMMER im
 * DOM (R9/§8: Ctrl+F/Print/Screenreader), die Prominenz steuert allein der
 * data-fussnoten-CSS-Toggle. Darum: die Aufhebungsnotiz wird nun IMMER gerendert
 * (im `data-fn-apparat`-Block, den «AUS» per CSS dämpft), nicht mehr React-gated.
 */
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { ArtikelLeser, SektionKopf } from '../pages/gesetz-leser/parts';
import type { NormSnapshot } from '../lib/normtext/typen';
import type { BrowseErlass } from '../lib/normtext/browse-typen';
import type { Fussnote } from '../lib/normtext/browse';

const erlass: BrowseErlass = {
  key: 'ZGB', ebene: 'bund', kanton: null, kuerzel: 'ZGB', titel: 'Zivilgesetzbuch', sr: '210',
  rechtsgebiet: 'privat', sprache: 'de', rang: 0, status: 'snapshot',
  datei: 'bund/ZGB.json', artikelAnzahl: 1, stand: '2026-01-01', quelleUrl: 'https://x', fassungsToken: '20260101',
  pdfPfad: null,
};

// Voll aufgehobener Artikel (leerer Körper «…») + amtliche Aufhebungs-Fussnote
// auf Artikelebene (absatz/item null).
//
// RE-BLESS W2·27 (15.9.2026, §6.3 deklariert): die Vorrichtung trägt jetzt
// zusätzlich `aufgehoben: true`. Bis dahin genügte der Platzhalter-Body, um die
// Zeile «· aufgehoben» zu erzeugen; seit der §8-Trennung sagt der Leser das nur
// noch mit amtlichem Vermerk — und genau den beschreibt dieser Fall («amtliche
// Aufhebungs-Fussnote»). Ohne das Feld prüfte er ab sofort den anderen Fall.
const aufgehoben: NormSnapshot = {
  id: 'bund/ZGB/art_349', ebene: 'bund', quelle: 'ZGB', erlass: 'ZGB', artikel: '349', artikelLabel: 'Art. 349',
  bloecke: [{ absatz: null, text: '…' }],
  aufgehoben: true,
  stand: '2026-01-01', quelleUrl: 'https://x', abgerufen: '2026-06-29', fassungsToken: '20260101', sha: 'x',
};
const aufhebung: Fussnote[] = [
  { nr: '1', text: 'Aufgehoben durch Ziff. I des BG vom 1. Jan. 2013 (AS 2012 1234).', links: [] },
];

const render = () =>
  renderToString(
    <ArtikelLeser e={aufgehoben} erlass={erlass} basisPfad="/gesetze/ZGB" fussnoten={aufhebung} />,
  );

describe('M2 — Aufhebungs-Zitatzeile immer im DOM (G2b), Status bleibt', () => {
  it('Status «· aufgehoben» ist IMMER sichtbar', () => {
    expect(render()).toContain('· aufgehoben');
  });

  it('«Aufgehoben durch …» liegt IMMER im DOM (R9 — Ctrl+F/Print/Screenreader)', () => {
    expect(render()).toContain('Aufgehoben durch Ziff. I des BG');
  });

  it('Aufhebungsnotiz sitzt im dämpfbaren data-fn-apparat-Block (CSS-Toggle statt Unmount)', () => {
    expect(render()).toContain('data-fn-apparat');
  });
});

// ── M9: aufgehobene Artikel bündig auf gleicher Ebene ─────────────────────────
const aktiv: NormSnapshot = {
  id: 'bund/ZGB/art_348', ebene: 'bund', quelle: 'ZGB', erlass: 'ZGB', artikel: '348', artikelLabel: 'Art. 348',
  bloecke: [{ absatz: '1', text: 'Der Erblasser kann durch Verfügung etwas anordnen.' }],
  stand: '2026-01-01', quelleUrl: 'https://x', abgerufen: '2026-06-29', fassungsToken: '20260101', sha: 'y',
};

describe('M9 — aufgehobene und aktive Artikel fluchten bündig (gleiche w-4-Leitspalte)', () => {
  const renderArt = (e: NormSnapshot) =>
    renderToString(<ArtikelLeser e={e} erlass={erlass} basisPfad="/gesetze/ZGB" />);
  it('aktiver Artikel: Chevron-Knopf trägt die feste w-4-Leitspalte', () => {
    const out = renderArt(aktiv);
    expect(out).toMatch(/class="[^"]*\binline-flex\b[^"]*\bw-4\b[^"]*justify-center/);
  });
  it('aufgehobener Artikel: Platzhalter trägt dieselbe feste w-4-Leitspalte', () => {
    const out = renderArt(aufgehoben);
    expect(out).toMatch(/class="[^"]*\binline-flex\b[^"]*\bw-4\b/);
    expect(out).not.toContain('▾'); // kein Chevron
  });
});

// ── Redundanz: Einzelartikel-Sektion zeigt das «Art. N»-Badge nicht doppelt ───
// (Auftrag David 30.6.2026: bei genau EINEM Artikel unter der Sektion ist das
// Bereich-Badge redundant zum Artikelkopf darunter — nur eingeklappt zeigen.)
describe('SektionKopf — Einzelartikel-Bereich-Badge', () => {
  const sek = { id: 's1', ebene: 5, label: 'C. Schulden zwischen Ehegatten', kinder: [], artikel: [], randtitel: true };
  const render = (offen: boolean, bereich: string, bereichEinzel: boolean) =>
    renderToString(<SektionKopf s={sek as never} refCb={() => {}} onToggle={() => {}} offen={offen} bereich={bereich} bereichEinzel={bereichEinzel} />);
  it('Einzelartikel + OFFEN → kein redundantes «Art. 250»', () => {
    const out = render(true, 'Art. 250', true);
    expect(out).toContain('C. Schulden zwischen Ehegatten');
    expect(out).not.toContain('Art. 250');
  });
  it('Einzelartikel + EINGEKLAPPT → «Art. 250» bleibt (informativ)', () => {
    const out = render(false, 'Art. 250', true);
    expect(out).toContain('Art. 250');
  });
  it('Spanne (mehrere Artikel) → «Art. 252–359» bleibt immer', () => {
    const out = render(true, 'Art. 252–359', false);
    expect(out).toContain('Art. 252–359');
  });
});
