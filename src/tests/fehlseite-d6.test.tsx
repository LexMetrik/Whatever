/**
 * W2·19-DESIGN-KONSISTENZ · B2/BAU-4 — Befund D-6: EINE Fehlseite statt dreier.
 *
 * Bewacht werden die vier Dinge, die still zurückfallen können:
 *   (1) KOPF — die Fehlseite trägt den Kopf der SeitenKopf-Familie (Overline ·
 *       Ablesekante · H1 aus `ui/SeitenTitel`). Zwei der vier Flächen hatten gar
 *       keine H1 und sprangen von der App-Leiste direkt in einen Warn-Kasten.
 *   (2) WEITERWEG-PFLICHT — jede Fehlseite hat mindestens EINEN Weg hinaus
 *       (REGL:122/C1 «nie eine Sackgasse»). Der Typ erzwingt es beim Aufruf;
 *       diese Sonde hält zusätzlich die vier Aufrufstellen fest.
 *   (3) PFEIL «←» — der Rückweg trägt überall denselben Pfeil. Die Sonde liest
 *       die echten Aufrufstellen: «‹» darf in keiner der vier Dateien mehr als
 *       Rücksprung-Link stehen.
 *   (4) KEIN WARN-KASTEN mehr — `lc-notice-warn` ist nach D-7 der Abdeckungs-
 *       lücke vorbehalten, nicht dem Tippfehler in der Adresse.
 *
 * §6.7 (ein Tor muss scheitern können) — jede Sonde einmal ROT gesehen am
 * Ist-Stand VOR dem Bau (31.8.2026, Belege im Bau-Bericht):
 *   · (1)/(4) mit `pages/EntscheidLeser.tsx` und `gesetz-leser/FehlSeite.tsx`
 *     im Vorzustand (`lc-notice lc-notice-warn`, keine H1);
 *   · (2) mit einem `<FehlSeite …/>`-Aufruf ohne `wege` — der bricht schon in
 *     `tsc`, die Sonde hier fängt den zweiten Weg (Aufruf mit leerem Array);
 *   · (3) mit dem Vorzustand «‹ Zur Rechtsprechung» / «‹ Zur Gesetzessammlung».
 *
 * Reine Darstellung (§3).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { PaneProvider } from '../components/layout/PaneKontext';
import { FehlSeite } from '../components/ui/FehlSeite';

const IM_PANE = { imPane: true as const, rolle: 'sekundaer' as const, wurzel: null, overlayWurzel: null };

const ssr = (el: React.ReactElement) => renderToStaticMarkup(<MemoryRouter>{el}</MemoryRouter>);

/** Die vier Flächen, die D-6 zusammengeführt hat. */
const KONSUMENTEN = [
  'src/pages/EntscheidLeser.tsx',
  'src/pages/NotFound.tsx',
  'src/pages/MaterialLeser.tsx',
  'src/pages/gesetz-leser/FehlSeite.tsx',
] as const;

/** Quelltext ohne Kommentare — die Sonden prüfen den ausführbaren Teil. Die
 *  Begründungen am Fundort nennen den Vorzustand wörtlich («hier stand ‹ Zur
 *  Rechtsprechung»); läse die Sonde den Rohtext, zwänge sie dazu, genau diese
 *  datierten Belege zu löschen (§2b: Belege altern nicht). */
const lies = (p: string) => readFileSync(p, 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .split('\n').filter((z) => !/^\s*(\/\/|\*)/.test(z)).join('\n');

describe('D-6 — der Baustein rendert den Kanon', () => {
  const basis = ssr(
    <FehlSeite bereich="Rechtsprechung" objekt="Entscheid" name="bge_999_X_9"
      erklaerung="Möglicherweise wurde er noch nicht erfasst."
      wege={[{ to: '/rechtsprechung', label: 'Zur Rechtsprechung' }]} />,
  );

  it('(1) Kopf der SeitenKopf-Familie: Overline, Ablesekante, EINE h1', () => {
    expect(basis).toContain('lc-overline');
    expect(basis).toContain('Rechtsprechung');
    // DEKLARIERTE ANPASSUNG (W2·29-WERKBANK-KATALOGE K1, 23.9.2026, §6.3):
    // die Ablesekante ist seit K1 der 2-px-Strich des Titelblatt-Bands
    // (`.ub-kopf` in `layout/SeitenKopf`); die `scale-rule` darunter entfiel.
    // Geprüft wird dieselbe Aussage — der Kopf kommt aus der Familie — am
    // neuen Träger.
    expect(basis).toContain('ub-kopf');
    expect(basis.match(/<h1\b/g) ?? [], 'genau eine H1').toHaveLength(1);
    // Der Titel wird aus dem Objekt gebaut — derselbe Satzbau auf allen Flächen.
    expect(basis).toContain('Entscheid nicht gefunden');
    // Die H1 kommt aus `ui/SeitenTitel` (A-1): ausserhalb eines Panes die
    // unveränderte Viewport-Kaskade.
    expect(basis).toContain('text-h2 sm:text-h1');
  });

  it('(1b) im Pane misst der Titel die PANE-Breite, nicht das Fenster', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <PaneProvider value={IM_PANE}>
          <FehlSeite bereich="Rechtsprechung" objekt="Entscheid"
            wege={[{ to: '/rechtsprechung', label: 'Zur Rechtsprechung' }]} />
        </PaneProvider>
      </MemoryRouter>,
    );
    expect(html).toContain('@xl/pane:text-h1');
    expect(html, 'die Viewport-Kaskade steht im Pane nicht mehr da').not.toContain('sm:text-h1');
    // Dichtere Variante im Pane: der Aussenabstand folgt der Lage (A-2/BAU-6).
    expect(html).toContain('py-6');
    expect(html).not.toContain('py-16');
  });

  it('(2)/(3) der Weiterweg ist da und trägt den Kanon-Pfeil «←»', () => {
    expect(basis).toContain('href="/rechtsprechung"');
    expect(basis).toContain('← Zur Rechtsprechung');
    expect(basis, '«‹» ist die abgelöste Form').not.toContain('‹');
    // Landmark statt loser Linkliste — der Rückweg ist anspringbar.
    expect(basis).toContain('aria-label="Weiterweg"');
  });

  it('(4) kein Warn-Kasten; die Aussage steht im Lead (§8 unverändert)', () => {
    expect(basis).not.toContain('lc-notice');
    expect(basis).toContain('ist nicht als Entscheid im Bestand.');
    expect(basis).toContain('Möglicherweise wurde er noch nicht erfasst.');
  });

  it('§8: der ANGEFRAGTE Schlüssel wird benannt, nicht allgemein bedauert', () => {
    expect(basis).toContain('bge_999_X_9');
    // Ohne Namen entsteht kein leerer «« »»-Rumpf.
    const ohneName = ssr(
      <FehlSeite bereich="404 · Nicht gefunden" objekt="Seite"
        wege={[{ to: '/', label: 'Katalog' }]} />,
    );
    expect(ohneName).not.toContain('im Bestand');
    expect(ohneName).toContain('Seite nicht gefunden');
  });

  it('POSITIV-SONDE: mehrere Wege stehen alle da (NotFound-Fall)', () => {
    const drei = ssr(
      <FehlSeite bereich="404 · Nicht gefunden" objekt="Seite"
        wege={[{ to: '/', label: 'Katalog' }, { to: '/methodik', label: 'Methodik' }, { to: '/kontakt', label: 'Kontakt' }]} />,
    );
    expect(drei.match(/← /g) ?? []).toHaveLength(3);
  });
});

describe('D-6 — keine zweite Fehlseiten-Anatomie mehr (§5/§10)', () => {
  it('POSITIV-SONDE: alle vier Flächen beziehen den Baustein', () => {
    for (const datei of KONSUMENTEN) {
      expect(readFileSync(datei, 'utf8'), `${datei} importiert FehlSeite nicht`)
        .toMatch(/import \{ FehlSeite(, type FehlWeg)? \} from/);
    }
  });

  it('keine baut Warn-Kasten oder «‹»-Rücksprung noch von Hand nach', () => {
    for (const datei of KONSUMENTEN) {
      const quelle = lies(datei);
      expect(/lc-notice-warn/.test(quelle), `${datei} trägt wieder einen Warn-Kasten`).toBe(false);
      expect(/‹/.test(quelle), `${datei} trägt wieder den abgelösten «‹»-Rücksprung`).toBe(false);
    }
  });

  it('jeder Aufruf trägt ein nicht-leeres `wege` (C1: nie eine Sackgasse)', () => {
    for (const datei of KONSUMENTEN) {
      const quelle = lies(datei);
      for (const aufruf of quelle.match(/<FehlSeite\b[\s\S]*?\/>/g) ?? []) {
        expect(/wege=\{/.test(aufruf), `${datei}: <FehlSeite> ohne wege`).toBe(true);
        expect(/wege=\{\[\s*\]\}/.test(aufruf), `${datei}: <FehlSeite> mit leerem wege`).toBe(false);
      }
    }
  });
});
