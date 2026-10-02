/**
 * W2·17-UI-BEFUNDE · Gliederung — Markup- und Verdrahtungs-Wächter (Teil 2 zu
 * `gliederung-befunde-w217.test.ts`). Jeder Fall ist gegen den Stand VOR seinem
 * Fix rot gesehen (§6.7).
 *
 * Testtechnik wie im Repo üblich (Node-Env, `renderToString`); gelesen wird das
 * Markup mit `linkedom`, damit «ist X Kind von Y» eine Frage an den Baum ist und
 * keine Regex-Hoffnung auf Attribut-Reihenfolgen.
 */
import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import type { ReactElement } from 'react';
import { parseHTML } from 'linkedom';
import { baueGliederungsbaum } from '../lib/normtext/browse';
import { ladeNormFixture } from './fixtures/normtext-fixture';
import { kuratiereTocSektionen } from '../pages/gesetz-leser/berechnungen';
import { baueGliederungsModell, type GliederungsModell } from '../pages/gesetz-leser/gliederungsModell';
import { SektionBaumTOC } from '../pages/gesetz-leser/parts/SektionBaumTOC';
import { leisteAufbau } from '../pages/gesetz-leser/v3/leisteAufbau';
import { leistenKlappIds, leistenKnoten, klappZeile } from '../pages/gesetz-leser/klappKarte';
import { pruefeAlleZuSperre } from '../pages/gesetz-leser/sprungAst';
import { baumGanzOffen } from '../pages/gesetz-leser/gliederungsLeiste';
import type { LeserV3Modell } from '../pages/gesetz-leser/v3/leserV3Modell';

function modell(key: string): GliederungsModell {
  const { eintraege, struktur } = ladeNormFixture('bund', key);
  const roh = baueGliederungsbaum(eintraege, struktur);
  return baueGliederungsModell({
    sektionen: kuratiereTocSektionen(roh.sektionen), ohneGliederung: roh.ohneGliederung, eintraege, struktur,
    startSichtbarGo: true,
  });
}

/** Der Baum, ganz aufgeklappt (so sieht man nach «alles auf» jede Zeilenform). */
function baumMarkup(g: GliederungsModell): ReturnType<typeof parseHTML>['document'] {
  const offen = klappZeile({}, leistenKlappIds(g), false);
  const html = renderToString(
    <SektionBaumTOC knoten={g.knoten} aktivPfad={[]} aktivToken={null} offen={offen}
      startOffeneTiefe={g.startOffeneTiefe} onToggle={() => {}} onSprung={() => {}} onSprungArtikel={() => {}} />,
  );
  return parseHTML(`<html><body>${html}</body></html>`).document;
}

describe('B7 — Klapp-Zustand gehört dem Knopf, nicht dem Link', () => {
  it('ZGB: jedes Element mit aria-expanded im Baum ist ein <button> — kein <a>', () => {
    const doc = baumMarkup(modell('ZGB'));
    const mitZustand = [...doc.querySelectorAll('[aria-expanded]')];
    const links = mitZustand.filter((e) => e.tagName === 'A');
    expect(mitZustand.length, 'Leer-Treffer-Schutz: der Baum trägt Klapp-Knöpfe').toBeGreaterThan(50);
    // vorher: jede Zeile mit Kindern trug aria-expanded AUCH am Titel-Link (`a[href="#art-…"]`).
    expect(links.length, `Links mit aria-expanded: ${links.length}`).toBe(0);
    // Und die Pfeil-Knöpfe tragen ihn weiterhin — der Schalter ist da, nur einmal.
    expect(doc.querySelectorAll('button[aria-expanded][aria-label$="auf- und zuklappen"]').length)
      .toBe(mitZustand.length);
  });

  it('die Titel-Links bleiben Links (P8: adressierbar) — Bestandsschutz', () => {
    const doc = baumMarkup(modell('ZGB'));
    expect(doc.querySelectorAll('li > div > a[href^="#art-"]').length).toBeGreaterThan(100);
  });
});

describe('B6-D01 — das Zustandswort steht in der Zeile, nicht darunter', () => {
  it('ZGB: «aufgehoben» sitzt INNERHALB des line-clamp-Blocks (wie im Artikel-Index)', () => {
    const doc = baumMarkup(modell('ZGB'));
    const worte = [...doc.querySelectorAll('li > div > :is(a, button)[title] span.text-micro')]
      .filter((e) => /aufgehoben|gegenstandslos/.test(e.textContent ?? ''));
    expect(worte.length, 'Leer-Treffer-Schutz').toBeGreaterThan(10);
    // vorher: das Wort war Geschwister des Blocks (display:flow-root) und fiel auf eine eigene Zeile.
    const draussen = worte.filter((w) => !w.parentElement?.className.includes('line-clamp-2'));
    expect(draussen.length, `Wort ausserhalb des Blocks: ${draussen.length} von ${worte.length}`).toBe(0);
  });

  it('der zugängliche Name nennt das Wort weiterhin (WCAG 2.5.3)', () => {
    const doc = baumMarkup(modell('ZGB'));
    const zeile = [...doc.querySelectorAll('li > div > :is(a, button)[title]')]
      .find((e) => e.getAttribute('aria-label')?.endsWith('— aufgehoben'));
    expect(zeile, 'keine aufgehobene Zeile gefunden').toBeDefined();
  });
});

describe('B6-B01 im Markup — der Name der Kettenzeile beginnt mit dem sichtbaren Blatt', () => {
  it('ZGB: aria-label und title der Zeile «1. Übernahme (IV. Grundstücke)»', () => {
    const doc = baumMarkup(modell('ZGB'));
    const z = [...doc.querySelectorAll('li > div > :is(a, button)[title]')]
      .find((e) => (e.textContent ?? '').startsWith('1. Übernahme'));
    expect(z).toBeDefined();
    expect(z!.getAttribute('aria-label')).toBe('1. Übernahme (IV. Grundstücke)');
    expect(z!.getAttribute('title')).toBe('1. Übernahme (IV. Grundstücke)');
    expect((z!.textContent ?? '').replace(/\s+/g, ' ').trim()).toBe('1. Übernahme (IV. Grundstücke)');
  });
});

// ═══ Verdrahtung von «alles auf/zu» und «↑ Anfang» ═══════════════════════════
describe('B1 — Verdrahtung der Leisten-Knöpfe (leisteAufbau)', () => {
  function leiste(key: string, tocBaum: Record<string, boolean>, imSheet = false) {
    const g = modell(key);
    const m = {
      gliederung: g, tocBaum, tocToggleGruppe: vi.fn(), setTocAuf: vi.fn(), zumAnfang: vi.fn(),
      setTocBaum: vi.fn(),
    };
    const el = leisteAufbau(m as unknown as LeserV3Modell, null as never, imSheet) as ReactElement<Record<string, unknown>>;
    return { g, m, p: el.props as {
      onAlleAuf: () => void; onAlleZu: () => void; alleOffen: boolean; alleKnopf: boolean; onAnfang: () => void;
    } };
  }

  it('B1-B03: «alles auf» geht über tocToggleGruppe (Spy-Buchhaltung), nicht an der Klapp-Karte vorbei', () => {
    const { g, m, p } = leiste('OR', {});
    p.onAlleAuf();
    expect(m.setTocBaum, 'der Knopf schreibt die Karte nicht mehr selbst').not.toHaveBeenCalled();
    expect(m.tocToggleGruppe).toHaveBeenCalledTimes(1);
    expect(m.tocToggleGruppe).toHaveBeenCalledWith(leistenKlappIds(g), false, false);
  });

  it('B1-B04: «alles zu» (alles offen) übergibt den sichtbaren Zustand «offen» — Ziel: zu, in die Zu-Buchhaltung', () => {
    const g = modell('OR');
    const alleOffen = klappZeile({}, leistenKlappIds(g), false);
    const { m, p } = leiste('OR', alleOffen);
    expect(p.alleOffen).toBe(true);
    p.onAlleZu();
    expect(m.tocToggleGruppe).toHaveBeenCalledWith(leistenKlappIds(g), true, true); // 3. Parameter: Sperre bis Abschnittswechsel
  });

  it('B1-B03/B04: die Beschriftung folgt dem SICHTBAREN — EMRK-Anhang startet offen, der Knopf heisst «alles zu»', () => {
    // vorher (Karten-Prüfung `alleOffen`): leere Karte = «nicht offen» → «alles auf», obwohl
    // alles zu sehen war; der erste Klick änderte nur die Beschriftung.
    const { p } = leiste('EMRK', {});
    expect(p.alleOffen).toBe(true);
    const g = modell('EMRK');
    const ids = leistenKlappIds(g);
    const zu = klappZeile({}, ids, true);
    expect(baumGanzOffen(leistenKnoten(g), zu, g.startOffeneTiefe)).toBe(false);
    expect(baumGanzOffen(leistenKnoten(g), klappZeile(zu, ids, false), g.startOffeneTiefe)).toBe(true);
  });

  it('Beschriftung im B1-Baum: zu → «alles auf»; nach «alles auf» → «alles zu»; nach «alles zu» wieder «alles auf»', () => {
    const g = modell('OR');
    const ids = leistenKlappIds(g);
    expect(leiste('OR', {}).p.alleOffen).toBe(false);
    expect(leiste('OR', klappZeile({}, ids, false)).p.alleOffen).toBe(true);
    expect(leiste('OR', klappZeile(klappZeile({}, ids, false), ids, true)).p.alleOffen).toBe(false);
  });

  it('B1-B01: im B2-Index ohne Anhang (VwVG) gibt es keinen Knopf', () => {
    const { p } = leiste('VWVG', {});
    expect(p.alleKnopf).toBe(false);
  });

  it('B1-B01: im B1-Baum (OR) und im Index mit Anhang-Ast (EMRK) gibt es ihn', () => {
    expect(leiste('OR', {}).p.alleKnopf).toBe(true);
    expect(leiste('EMRK', {}).p.alleKnopf).toBe(true);
  });

  it('B1-B02: «↑ Anfang» schliesst das Sheet — in der Spalte bleibt es beim Scrollen', () => {
    const sheet = leiste('OR', {}, true);
    sheet.p.onAnfang();
    expect(sheet.m.zumAnfang).toHaveBeenCalledTimes(1);
    expect(sheet.m.setTocAuf).toHaveBeenCalledWith(false);
    const spalte = leiste('OR', {}, false);
    spalte.p.onAnfang();
    expect(spalte.m.zumAnfang).toHaveBeenCalledTimes(1);
    expect(spalte.m.setTocAuf).not.toHaveBeenCalled();
  });
});

// ═══ B1-B04 · «alles zu» sperrt den Spy nur bis zum nächsten Abschnittswechsel ═
describe('B1-B04 — «alles zu»-Sperre endet beim Abschnittswechsel (Entscheid 2.10.2026)', () => {
  const sperre = { pfad: ['sek-1', 'sek-2'], ids: ['sek-1', 'sek-2', 'sek-9'] };

  it('gleicher Abschnitt (auch tiefere Stufe wechselt): Sperre bleibt, manuellZu unverändert', () => {
    const zu = new Set(['sek-1', 'sek-2']);
    expect(pruefeAlleZuSperre(sperre, ['sek-1', 'sek-2'], zu)).toBe(sperre);
    expect(pruefeAlleZuSperre(sperre, ['sek-1', 'sek-5'], zu), 'nächster Artikel-Randtitel im selben Titel').toBe(sperre);
    expect([...zu]).toEqual(['sek-1', 'sek-2']);
  });

  it('anderer Abschnitt (oberste Stufe): Sperre fällt, ihre Ids verlassen manuellZu (der Spy folgt wieder)', () => {
    const zu = new Set(['sek-1', 'sek-2', 'sek-9', 'eigen']); // «eigen» = ein Pfeil-Klick, bleibt
    expect(pruefeAlleZuSperre(sperre, ['sek-7', 'sek-8'], zu)).toBeNull();
    expect([...zu]).toEqual(['eigen']);
  });

  it('leerer Pfad (Spy ohne Standort) und fehlende Sperre: nichts passiert', () => {
    const zu = new Set(['a']);
    expect(pruefeAlleZuSperre(sperre, [], zu)).toBe(sperre);
    expect(pruefeAlleZuSperre(null, ['x'], zu)).toBeNull();
    expect([...zu]).toEqual(['a']);
  });
});
