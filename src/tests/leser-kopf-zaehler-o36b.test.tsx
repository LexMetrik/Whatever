/**
 * LESER-NAV · FB O-36 b — EIN ZÄHLMODELL für Zähler-Zeile, Listenkopf und
 * Landkarten-Name (Nachzug der Delta-Prüfung 15.10.2026).
 *
 * BEFUND: der Landkarten-Name zählte die Marken (eine je Trefferzeile) und nannte
 * bei OR «Kündigung» «74 Artikel · 143 Fundstellen», die Zähler-Zeile daneben
 * «69 Artikel · 28 Überschriften · 143 Fundstellen». Dazu: im Bereich «Titel»
 * stand «0 Artikel · 28 Überschriften» (ein Segment mit 0 sagt nichts).
 *
 * ROT ZU BEKOMMEN (§6.7): in `components/leser/TrefferLandkarte.tsx` `artikelAnzahl`
 * und `ueberschriften` aus dem Namen nehmen (= alter Zustand) ⇒ der Gleichlauf-Fall
 * sieht «74 Artikel · 143 Fundstellen»; die Bedingung `anzahl > 0 || …` in
 * `SuchZone.tsx` bzw. `TrefferLeiste.tsx` streichen ⇒ der Null-Fall zeigt «0 Artikel».
 */
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { TrefferLandkarte } from '../components/leser/TrefferLandkarte';
import { landkarteSpur } from '../components/leser/landkarteModell';
import { gesetzLandkarteEinheiten } from '../pages/gesetz-leser/v3/landkarteGesetz';
import { SuchZone } from '../pages/gesetz-leser/v3/SuchZone';
import { TrefferLeiste } from '../pages/gesetz-leser/v3/TrefferLeiste';
import { baueLeserSuchIndex, sucheImErlass, zaehleTreffer } from '../pages/gesetz-leser/leserSuche';
import { ladeNormFixture } from './fixtures/normtext-fixture';

const html = (el: React.ReactElement): string =>
  renderToStaticMarkup(createElement(MemoryRouter, null, el));

/** Sichtbarer Text eines Elements (ohne Tags, Leerraum zusammengezogen). */
const text = (el: React.ReactElement): string =>
  html(el).replace(/<[^>]*>/g, ' ').replace(/&nbsp;|\s+/g, ' ').trim();

const nameVon = (el: React.ReactElement): string => {
  const m = /aria-label="([^"]*)"/.exec(html(el));
  if (!m) throw new Error('kein aria-label im Streifen-Markup');
  return m[1];
};

const zone = (bestimmungen: number, ueberschriften: number, fundstellen: number) =>
  createElement(SuchZone, {
    suchFeld: null, sucheAktiv: true, bestimmungen, ueberschriften, fundstellen,
    bestimmungsWort: 'Artikel', onListe: () => {},
  });
const leiste = (anzahl: number, ueberschriften: number, fundstellen: number) =>
  createElement(TrefferLeiste, {
    anzahl, ueberschriften, fundstellen, bestimmungsWort: 'Artikel', laufend: 0, hatSprung: false,
    bereich: 'alles', setzeBereich: () => {}, onZurueck: () => {}, onVor: () => {},
  });

describe('O-36 b · ein Zählmodell für Zeile, Listenkopf und Landkarten-Name', () => {
  it('OR «Kündigung»: der Name der Landkarte sagt dasselbe wie die Zähler-Zeile', () => {
    const { eintraege, struktur } = ladeNormFixture('bund', 'OR');
    const treffer = sucheImErlass(baueLeserSuchIndex('OR', eintraege, struktur), 'Kündigung');
    const { artikel, koepfe, fundstellen } = zaehleTreffer(treffer);
    // Vorbedingung (§6.7): Marken (= Trefferzeilen) ≠ Artikel mit eigener Fundstelle —
    // nur dann unterscheidet der Fall das alte vom neuen Zählmodell.
    expect(treffer.length, 'Trefferzeilen').toBeGreaterThan(artikel);
    expect(koepfe).toBeGreaterThan(0);
    const spur = landkarteSpur(gesetzLandkarteEinheiten(eintraege, struktur));
    const name = nameVon(createElement(TrefferLandkarte, {
      spur, treffer: treffer.map((t) => ({ id: t.token, anzahl: t.fundstellen })), leseId: null,
      register: 'g', obenVar: '--nt-stick', gesamtFundstellen: fundstellen,
      wortEins: 'Artikel', wortMehr: 'Artikel', artikelAnzahl: artikel, ueberschriften: koepfe,
      onSprung: () => {},
    }));
    const gleich = `${artikel} Artikel · ${koepfe} ${koepfe === 1 ? 'Überschrift' : 'Überschriften'} · ${fundstellen} Fundstellen`;
    expect(name).toBe(`Treffer-Landkarte: ${gleich}`);
    expect(text(zone(artikel, koepfe, fundstellen))).toContain(gleich);
    expect(text(leiste(artikel, koepfe, fundstellen))).toContain(gleich);
  });

  it('ohne Überschriften bleibt der Name, wie er war (Entscheid-Leser, Erlass ohne Kopf-Treffer)', () => {
    const spur = landkarteSpur([
      { id: 'art-1', label: 'Art. 1', umfang: 100, abschnitt: null },
      { id: 'art-2', label: 'Art. 2', umfang: 100, abschnitt: null },
    ]);
    const name = nameVon(createElement(TrefferLandkarte, {
      spur, treffer: [{ id: 'art-1', anzahl: 4 }, { id: 'art-2', anzahl: 2 }], leseId: null,
      register: 'g', obenVar: '--nt-stick', gesamtFundstellen: 6,
      wortEins: 'Artikel', wortMehr: 'Artikel', onSprung: () => {},
    }));
    expect(name).toBe('Treffer-Landkarte: 2 Artikel · 6 Fundstellen');
  });

  it('Bereich «Titel»: 0 Artikel entfällt, wo Überschriften stehen — überall', () => {
    expect(text(zone(0, 28, 41))).toContain('28 Überschriften · 41 Fundstellen');
    expect(text(zone(0, 28, 41))).not.toContain('0 Artikel');
    expect(text(leiste(0, 28, 41))).toContain('28 Überschriften · 41 Fundstellen');
    expect(text(leiste(0, 28, 41))).not.toContain('0 Artikel');
    const spur = landkarteSpur([{ id: 'art-1', label: 'Art. 1', umfang: 100, abschnitt: null }]);
    const name = nameVon(createElement(TrefferLandkarte, {
      spur, treffer: [{ id: 'art-1', anzahl: 41 }], leseId: null, register: 'g', obenVar: '--nt-stick',
      gesamtFundstellen: 41, wortEins: 'Artikel', wortMehr: 'Artikel', artikelAnzahl: 0, ueberschriften: 28,
      onSprung: () => {},
    }));
    expect(name).toBe('Treffer-Landkarte: 28 Überschriften · 41 Fundstellen');
  });

  it('ohne jeden Treffer bleibt «0 Artikel» stehen (dort fehlt nichts, es gibt nichts)', () => {
    expect(text(leiste(0, 0, 0))).toContain('0 Artikel · 0 Fundstellen');
  });
});
