/**
 * W2·17-UI-BEFUNDE-N1 (LM-044) — Chip-Grammatik `lc-chip-zeile` auf den Flächen
 * NormChip / Materialien / Filter.
 *
 * Der Befund: Normverweis («ZGB»), Standangabe («Stand 01.02.2022») und die
 * Filter-Metadaten teilten byte-genau dieselbe Anatomie (bare `.lc-chip`) — die
 * Form sagte nichts über die Art. Die in B1 gebaute Container-Klasse
 * `lc-chip-zeile` trennt entlang der ELEMENT-ART: <a> unterstrichen, Aktion
 * gerahmt, <span> flach.
 *
 * Die Tests hier sichern die zwei Dinge, die still kaputtgehen können:
 *   (1) STRUKTUR — die Chip-Reihen tragen die Opt-in-Klasse überhaupt (ohne sie
 *       greift die Grammatik nirgends; das Weglassen sieht im Diff harmlos aus).
 *   (2) GRAMMATIK — die CSS-Regel macht die Aktions-Form an der ROLLE fest
 *       (§23-Entscheid: `src/components/rechtsprechung/NormChip.tsx` MUSS ein
 *       `span role="button"` sein, weil er in einem Karten-<a> liegt), UND sie
 *       lässt den Selected-Zustand in Ruhe. Ohne das `:not(.lc-chip-selected)`
 *       bügelte die Container-Regel (0,2,1) die Auswahl-Fläche (0,1,0) still
 *       weg — der Facetten-Chip verlöre sein Auswahl-Signal, ohne dass ein
 *       Test rot würde. Genau dagegen steht der Regel-Test.
 *
 * Reine Darstellung (§3) — keine Rechtslogik berührt.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { EntscheidKarte } from '../components/rechtsprechung/EntscheidKarte';
import { MaterialKarte } from '../components/materialien/MaterialKarte';
import { MassgebendeGesetze } from '../components/normtext/MassgebendeGesetze';
import type { BrowseEntscheid } from '../lib/rechtsprechung/register';
import type { BrowseMaterial } from '../lib/materialien/typen';

const CSS = readFileSync(new URL('../index.css', import.meta.url), 'utf8');

const entscheid: BrowseEntscheid = {
  key: 'bund/bger/x', gericht: 'bger', gerichtName: 'Bundesgericht', gerichtstyp: 'bundesgericht',
  kanton: 'CH', nummer: '1C_1/2025', bgeReferenz: null, datum: '2025-01-01',
  zitierung: 'BGer 1C_1/2025 vom 1. Januar 2025', leitcharakter: 'routine',
  regesteVorhanden: false, regesteKurz: null, sachgebiet: 'oeffentlich', sprache: 'de',
  normKeys: ['OR', 'ZGB'], bestand: 'snapshot', kuratierung: 'maschinell',
  datei: 'bund/bger/x.json', quelle: 'opencaselaw', quelleUrl: 'https://x',
};

const material: BrowseMaterial = {
  key: 'seco/wegleitung-1', behoerde: 'SECO', behoerdeName: 'Staatssekretariat für Wirtschaft',
  behoerdeKuerzel: 'SECO', doktyp: 'wegleitung', doktypLabel: 'Wegleitung',
  titel: 'Wegleitung zum Arbeitsgesetz', nummer: '710.100', rechtsgebiet: 'privat', sprache: 'de',
  status: 'nur-live-link', quelleUrl: 'https://x', stand: '2022-02-01', rang: 0, normKeys: [],
  hinweis: null,
};

describe('N1 (1) — Struktur: die Chip-Reihen tragen die Opt-in-Klasse', () => {
  it('Entscheid-Karte: Norm-Reihe ist eine lc-chip-zeile mit role="button"-Chips', () => {
    const out = renderToString(
      <MemoryRouter><EntscheidKarte e={entscheid} onNorm={() => {}} /></MemoryRouter>,
    );
    expect(out).toContain('lc-chip-zeile');
    expect(out).toContain('role="button"');
    // §23: bewusst KEIN <button> und KEIN <a> — der Chip liegt in einer Karte,
    // deren Stretch-Link ein <a> ist (Inhaltsmodell).
    expect(out).toContain('<span role="button"');
  });

  it('Material-Karte: Metazeile ist eine lc-chip-zeile, der Stand-Chip bleibt reine Angabe', () => {
    const out = renderToString(
      <MemoryRouter><MaterialKarte m={material} /></MemoryRouter>,
    );
    expect(out).toContain('lc-chip-zeile');
    expect(out).toContain('Stand');
    // Reine Angabe: kein role, kein href AM CHIP → unter der Grammatik flach.
    expect(out).toContain('<span class="lc-chip whitespace-nowrap">');
  });

  it('«Massgebende Gesetze»: Erlass-Chips sind <a> in einer lc-chip-zeile', () => {
    const out = renderToString(
      <MemoryRouter><MassgebendeGesetze modus="vorlage" /></MemoryRouter>,
    );
    expect(out).toContain('lc-chip-zeile');
    expect(out).toMatch(/<a[^>]*class="lc-chip[^"]*"[^>]*href="\/gesetze\//);
  });
});

describe('N1 (2) — Grammatik: die CSS-Regel selbst', () => {
  it('Aktions-Form hängt an der ROLLE, nicht nur am Tag-Namen', () => {
    expect(CSS).toContain('.lc-chip-zeile [role="button"].lc-chip');
  });

  it('Selected-Zustand wird von der Container-Grammatik NICHT überschrieben', () => {
    // Die Flächen-Deklaration darf nur im Ruhezustand greifen. Fällt das
    // :not() weg, gewinnt (0,2,1) gegen .lc-chip-selected (0,1,0) und die
    // brass-100-Auswahlfläche verschwindet — hell wie dunkel.
    const flaechenRegeln = CSS.match(/^ *\.lc-chip-zeile [^\n]*\.lc-chip[^\n{]*,?\n?[^{]*\{[^}]*background:[^}]*\}/gm) ?? [];
    expect(flaechenRegeln.length).toBeGreaterThan(0);
    for (const regel of flaechenRegeln) {
      expect(regel).toContain(':not(.lc-chip-selected)');
    }
  });

  it('der Tick (border-left) bleibt der Zustands-Achse vorbehalten — die Form rahmt nur oben/rechts/unten', () => {
    const grammatik = CSS.slice(CSS.indexOf('.lc-chip-zeile a.lc-chip'), CSS.indexOf('Die scrollbare Instanz-Linie'));
    expect(grammatik).toContain('border-top:');
    expect(grammatik).toContain('border-right:');
    expect(grammatik).toContain('border-bottom:');
    expect(grammatik).not.toMatch(/^\s*border-left:/m);
  });
});
