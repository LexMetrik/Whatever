/**
 * W2·17-UI-BEFUNDE · B11-D01…D04 — Nachbar-Pfeile: lange Beschriftung,
 * Trefferfläche und eindeutige Bezeichnung beim Gruppenwechsel.
 *
 * Die Browser-Messung (Breite, Trefferfläche, Lage) steht in
 * `e2e/leser-nachbar-rohdaten.e2e.ts`, Block «Darstellung». Hier die Teile, die
 * ohne Layout prüfbar sind: WANN ein Nachbar qualifiziert wird (rein, aus den
 * Token), WELCHE Bezeichnung er bekommt (aus derselben Quelle wie der
 * «Weiterlesen»-Chip), und dass das Markup die Kürzung trägt statt
 * `white-space: nowrap`.
 *
 * ROT GEFAHREN (§6.7):
 *  · `gruppeWechsel` in `v3/nachbarArtikel.ts` auf `false` gesetzt ⇒ «Art. 1186 →
 *    Art. 1 trägt die Gruppe» wird rot.
 *  · `whitespace-nowrap` wieder in `PFEIL_KLASSEN` (`parts/ArtikelNachbarn.tsx`)
 *    ⇒ «kein nowrap am Pfeil» wird rot.
 */
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { baueNachbarn, nachbarBezeichnung } from '../pages/gesetz-leser/v3/nachbarArtikel';
import { NachbarStrukturKontext } from '../pages/gesetz-leser/v3/nachbarStruktur';
import { ArtikelNachbarn } from '../pages/gesetz-leser/parts/ArtikelNachbarn';
import type { NormSnapshot } from '../lib/normtext/typen';
import type { StrukturMap } from '../lib/normtext/browse';

const eintrag = (artikel: string, artikelLabel: string): NormSnapshot => ({
  id: `bund/OR/${artikel}`, ebene: 'bund', quelle: 'OR', erlass: 'OR',
  artikel, artikelLabel,
  bloecke: [{ absatz: '1', text: `Wortlaut von ${artikelLabel}.` }],
  stand: '2026-01-01', quelleUrl: 'https://x', abgerufen: '2026-10-02',
  fassungsToken: '20260101', sha: artikel,
});

// Der Übergang, wie ihn das OR hat: der letzte Hauptartikel, dann die erste
// Schlussbestimmungs-Gruppe, deren Nummern wieder bei 1 beginnen (Art. 1186 → Art. 1).
const KETTE: [string, string][] = [
  ['1185', 'Art. 1185'], ['1186', 'Art. 1186'],
  ['disp_u2_art_1', 'Art. 1'], ['disp_u2_art_2', 'Art. 2'], ['disp_u3_art_1', 'Art. 1'],
];
const map = baueNachbarn(KETTE.map(([a, l]) => eintrag(a, l)));
const GRUPPE_U2 = 'Schlussbestimmungen der Änderung vom 23. März 1962';
const struktur: StrukturMap = {
  disp_u2_art_1: { gliederung: [{ ebene: 1, label: GRUPPE_U2 }], marginalie: [] },
  disp_u3_art_1: { gliederung: [{ ebene: 1, label: 'Übergangsbestimmungen der Änderung vom 16. Dezember 2005' }], marginalie: [] },
};

describe('B11-D04 · wann ein Nachbar qualifiziert wird (rein, aus den Token)', () => {
  it('Hauptteil → Gruppe und Gruppe → Hauptteil wechseln die Gruppe, Nachbarn in derselben nicht', () => {
    expect(map.get('1186')?.nach?.gruppeWechsel).toBe(true);
    expect(map.get('disp_u2_art_1')?.vor?.gruppeWechsel).toBe(true);
    expect(map.get('1185')?.nach?.gruppeWechsel).toBe(false);
    expect(map.get('disp_u2_art_1')?.nach?.gruppeWechsel).toBe(false);
  });

  it('zwei verschiedene Gruppen hintereinander wechseln ebenfalls (Art. 2 → Art. 1 der nächsten Gruppe)', () => {
    expect(map.get('disp_u2_art_2')?.nach?.gruppeWechsel).toBe(true);
  });
});

describe('B11-D04 · welche Bezeichnung der Nachbar bekommt', () => {
  it('Art. 1186 → Art. 1: Label unverändert, die Gruppe als eigener Teil — aus derselben Quelle wie der Weiterlesen-Chip', () => {
    const b = nachbarBezeichnung(map.get('1186')!.nach!, struktur);
    expect(b.gruppe).toBe(GRUPPE_U2);
    expect(b.voll).toBe(`Art. 1 (${GRUPPE_U2})`);
  });

  it('ohne Sidecar bleibt der Nachbar eindeutig (nie stillschweigend «Art. 1»)', () => {
    const b = nachbarBezeichnung(map.get('1186')!.nach!, null);
    expect(b.gruppe, 'ohne Gruppe wäre «Art. 1» wieder mehrdeutig').not.toBeNull();
    expect(b.voll).not.toBe('Art. 1');
  });

  it('innerhalb derselben Gruppe und beim Hauptartikel bleibt es beim Label', () => {
    expect(nachbarBezeichnung(map.get('disp_u2_art_1')!.nach!, struktur)).toEqual({ voll: 'Art. 2', gruppe: null });
    expect(nachbarBezeichnung(map.get('disp_u2_art_1')!.vor!, struktur)).toEqual({ voll: 'Art. 1186', gruppe: null });
  });
});

describe('B11-D01…D04 · das Markup', () => {
  const rendere = (tok: string, s: StrukturMap | null) => renderToString(
    <NachbarStrukturKontext.Provider value={s}><ArtikelNachbarn nachbarn={map.get(tok)!} /></NachbarStrukturKontext.Provider>,
  );

  it('der Nachbar über die Gruppengrenze trägt die Gruppe im Namen, im title und als zweite Zeile', () => {
    const out = rendere('1186', struktur);
    expect(out).toContain(`aria-label="Nächster Artikel: Art. 1 (${GRUPPE_U2})"`);
    expect(out).toContain(`title="Art. 1 (${GRUPPE_U2})"`);
    expect(out).toMatch(new RegExp(`data-nachbar-gruppe[^>]*>${GRUPPE_U2}<`));
    // Das sichtbare Label bleibt «Art. 1» — die Gruppe ist die zweite Zeile, kein Ersatz.
    expect(out).toMatch(/data-nachbar-label[^>]*>Art\. 1</);
  });

  it('innerhalb einer Gruppe keine zweite Zeile und kein title (kurze Beschriftung)', () => {
    const out = rendere('disp_u2_art_1', struktur);
    expect(out).not.toContain('data-nachbar-gruppe');
    expect(out).not.toContain('title=');
  });

  it('B11-D01 · kein `whitespace-nowrap` am Pfeil — die Beschriftung darf schrumpfen und kürzt mit Auslassung', () => {
    const out = rendere('1186', struktur);
    expect(out).not.toContain('whitespace-nowrap');
    expect(out).toContain('min-w-0');
    expect(out).toContain('truncate');
  });

  it('B11-D01 · eine lange Beschriftung trägt den vollen Wortlaut im title', () => {
    const lang = 'Verzeichnis der zentralen und der zuständigen Behörden, welche die ihnen übertragenen Aufgaben wahrnehmen';
    const kette = baueNachbarn([eintrag('48', 'Art. 48'), eintrag('annex_u1', lang)]);
    const out = renderToString(<ArtikelNachbarn nachbarn={kette.get('48')!} />);
    expect(out).toContain(`title="${lang}"`);
    expect(out).toContain(`aria-label="Nächster Artikel: ${lang}"`);
  });

  it('B11-D01 · jede Beschriftung, die die 20ch-Kürzung treffen kann, trägt den title (26 Zeichen)', () => {
    // Prüfbefund #1278: «Vorbehalte und Erklärungen» (26 Z.) wurde gekürzt, hatte aber keinen title (Schwelle 28).
    const mittel = 'Vorbehalte und Erklärungen';
    const kette = baueNachbarn([eintrag('48', 'Art. 48'), eintrag('decl_u1', mittel)]);
    const out = renderToString(<ArtikelNachbarn nachbarn={kette.get('48')!} />);
    expect(out).toContain(`title="${mittel}"`);
  });

  it('B11-D02 · die Trefferfläche wächst per ::after, nicht durch eine grössere sichtbare Fläche', () => {
    const out = rendere('1186', struktur);
    expect(out).toContain('after:absolute');
    expect(out).toContain('after:-inset-y-1.5');
  });

  it('B11-D03 · der Nachfolger sitzt per `ml-auto` rechts, auch wenn der Vorgänger fehlt', () => {
    const erster = renderToString(<ArtikelNachbarn nachbarn={baueNachbarn([eintrag('1', 'Art. 1'), eintrag('2', 'Art. 2')]).get('1')!} />);
    expect(erster).toMatch(/data-nachbar="nach"[^>]*class="[^"]*\bml-auto\b/);
  });
});
