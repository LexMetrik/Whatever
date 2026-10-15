// @vitest-environment node
/**
 * LESER-NAV · Paket C «Layout/A11y» (FEHLERBESTAND Bereich 6) — die Wächter zu den Fixes dieses Pakets,
 * die keinen Browser brauchen. Gemessen wurde im Browser (headless Chromium gegen den Dev-Server,
 * Messbedingungen im PR-Body); hier steht, was sich als Quelltext- oder Render-Aussage festhalten lässt.
 * Jeder Fall nennt am Ende den Handgriff, der ihn rot macht (§6.7).
 *
 *  O-57  PDF-Hinweis «zu langsam»: die Live-Region steht von Anfang an im DOM (leer), der Hinweis
 *        wird erst INS Innere gesetzt und liegt als Überlagerung — kein Block im Fluss, der den Frame
 *        nach 12 s verschiebt.
 *        ROT: den Hinweis wieder als Block VOR den Frame setzen (`hinweisArt === 'zu-langsam' && (<div role="status" …`).
 *  O-43  `details > summary:has(> .ml-auto)::after` nimmt dem Zeichen die zweite Auto-Marge.
 *        ROT: die Regel streichen — Zähler rutscht zur Mitte (Probe 237 px vom Rand).
 *  O-49  Kopf-Griffe tragen auf grobem Zeiger das Komfortmass; «Adresse kopieren» quittiert sichtbar.
 *        ROT: den `@media (pointer: coarse)`-Block bzw. das `{kopiert && …}` in Reiterleiste.tsx streichen.
 *  O-09  «Erlass in Kraft seit» trägt den Vorbehalt als sichtbaren Text, nicht nur als `title`.
 *        ROT: den Satz wieder in ein `title`-Attribut verlegen.
 */
import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { APP_WURZEL, liesRoh, ohneKommentare } from './appDateien';
import { ErlassStandZeile } from '../pages/gesetz-leser/v3/BlattArtikel';

const CSS = ohneKommentare(liesRoh(join(APP_WURZEL, 'index.css')));

describe('O-57 · PDF-Hinweis «zu langsam» ohne Layoutverschiebung', () => {
  const QUELLE = ohneKommentare(liesRoh(join(APP_WURZEL, 'pages/gesetz-leser/inhalt-ansichten.tsx')));
  const region = QUELLE.indexOf('data-pdf-zu-langsam-region');
  const bedingung = QUELLE.indexOf("hinweisArt === 'zu-langsam'");

  it('die Live-Region (role="status") steht unbedingt im DOM, die Bedingung sitzt IN ihr', () => {
    expect(region, 'Live-Region fehlt').toBeGreaterThan(-1);
    expect(bedingung, 'Bedingung «zu-langsam» fehlt').toBeGreaterThan(region);
    const kopf = QUELLE.slice(region - 40, region + 160);
    expect(kopf).toContain('role="status"');
    // Nichts zwischen Region und Bedingung ausser dem Öffnen des Elements: die Bedingung hängt IN der Region.
    expect(QUELLE.slice(region, bedingung)).not.toMatch(/\{\s*hinweisArt\s*===/);
  });

  it('der Hinweis liegt als Überlagerung (absolute), nicht als Block im Fluss', () => {
    expect(QUELLE.slice(region - 120, region + 200)).toMatch(/\babsolute\b/);
    // Die alte Fassung: `role="status"` direkt an der Bedingung, als Block vor dem Frame.
    expect(QUELLE).not.toMatch(/hinweisArt === 'zu-langsam' && \(\s*<div[^>]*role="status"/);
  });

  // Nachzug Gegenprüfung #1384: ohne Schliessknopf darf die Überlagerung keine Klicks nehmen (sie deckte
  // die PDF-Werkzeugleiste). ROT: `pointer-events-auto` wieder an den Hinweis setzen.
  it('die Überlagerung nimmt keine Klicks: Region `pointer-events-none`, nichts darin schaltet sie ein', () => {
    expect(QUELLE.slice(region - 120, region + 200)).toMatch(/\bpointer-events-none\b/);
    expect(QUELLE).not.toMatch(/data-pdf-zu-langsam\s+className="[^"]*pointer-events-auto/);
  });
});

describe('O-43 · details > summary: ein Auto-Rand für Zähler UND Zeichen', () => {
  it('Basisregel behält `margin-left: auto`, die Ausnahme setzt ihn 0, wenn ein Kind `ml-auto` trägt', () => {
    expect(CSS).toMatch(/details > summary::after\s*\{[^}]*margin-left:\s*auto/);
    const m = CSS.match(/details > summary:has\(([^)]*\)?[^{]*)\)::after\s*\{([^}]*)\}/);
    expect(m, 'Ausnahme-Regel fehlt').not.toBeNull();
    expect(m![1]).toContain("[class~='ml-auto']");
    expect(m![2]).toMatch(/margin-left:\s*0\b/);
  });
});

describe('O-49 · Touch-Mass der Kopf-Griffe und sichtbare Kopier-Quittung', () => {
  it('auf `pointer: coarse` trägt der Kopf-Griff `--tap-ziel-komfort` (als Token, nie als Zahl)', () => {
    const m = CSS.match(/@media \(pointer: coarse\)\s*\{\s*\.lc-leiste-griff-fest\s*\{([^}]*)\}/);
    expect(m, '`@media (pointer: coarse)`-Block für `.lc-leiste-griff-fest` fehlt').not.toBeNull();
    expect(m![1]).toMatch(/min-height:\s*var\(--tap-ziel-komfort\)/);
  });

  it('«Adresse kopieren» (Reiter-Menü) zeigt die Quittung sichtbar, nach erfolgreichem Schreiben (`kopiert`)', () => {
    const q = ohneKommentare(liesRoh(join(APP_WURZEL, 'components/layout/Reiterleiste.tsx')));
    expect(q).toMatch(/const \{ kopieren, kopiert \} = useKopieren\(\)/);
    expect(q).toMatch(/\{kopiert && \(\s*<SchwebeMeldung[^>]*daten="data-reiter-kopiert"/);
    expect(q).toContain('Adresse kopiert');
  });
});

describe('O-09 · «Erlass in Kraft seit»: Vorbehalt sichtbar, nicht nur als Tooltip', () => {
  const html = renderToStaticMarkup(<ErlassStandZeile iso="1912-01-01" token="1" />);
  it('der Satz steht im Text (auch ohne Maus lesbar)', () => {
    expect(html.replace(/<!-- -->/g, '')).toContain('Erlass in Kraft seit 01.01.1912.');
    expect(html).toContain('keine Aussage über spätere Änderungen dieses Artikels');
    expect(html).toContain('data-v3-blatt-fassung-erlass-hinweis');
  });
  it('kein `title`-Attribut trägt den Vorbehalt mehr', () => {
    expect(html).not.toMatch(/title="/);
  });
});
