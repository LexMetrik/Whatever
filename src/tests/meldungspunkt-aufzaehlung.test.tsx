// «• » vor Meldungen nur ab zwei Einträgen — auch ausserhalb der FehlerBox
// (W2·19 Kleinaufräumen 2, 30.9.2026; Prüfer-Fund aus #1187: Zustellung-
// Fahrplan und PruefBefund trugen den Punkt noch vor einzelnen Meldungen).
// Die FehlerBox selbst prüft `fehlerbox-aufzaehlung.test.tsx`.
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { meldungspunkt } from '../components/vorlagen/meldungspunkt';
import { PruefBefund } from '../components/vorlagen/PruefBefund';
import { ZustErgebnisEinleitung } from '../components/forms/ZustErgebnisEinleitung';
import { ZustErgebnisRechtsmittel } from '../components/forms/ZustErgebnisRechtsmittel';
import type { ZustaendigkeitFormModell } from '../components/forms/useZustaendigkeitForm';

const punkte = (html: string): number => (html.match(/•/g) ?? []).length;

/** Minimales Modell: nur das, was der Fahrplan-Leerzustand liest. */
const modell = (instanz: 'einleitung' | 'rechtsmittel', fehler: string[]) =>
  ({ f: { instanz }, zeige: () => true, fehler, ergebnis: null, r: null, rechtsmittel: null }) as unknown as ZustaendigkeitFormModell;

describe('meldungspunkt', () => {
  it('Grenzen: 0 und 1 ohne Punkt, ab 2 mit', () => {
    expect(meldungspunkt(0)).toBe('');
    expect(meldungspunkt(1)).toBe('');
    expect(meldungspunkt(2)).toBe('• ');
    expect(meldungspunkt(7)).toBe('• ');
  });
});

describe('Zustellung-Fahrplan: Leerzustand', () => {
  it.each(['einleitung', 'rechtsmittel'] as const)('%s: eine Meldung ohne Punkt, zwei mit', (instanz) => {
    const Komp = instanz === 'einleitung' ? ZustErgebnisEinleitung : ZustErgebnisRechtsmittel;
    const eine = renderToStaticMarkup(<Komp z={modell(instanz, ['Streitwert angeben.'])} />);
    expect(eine).toContain('Streitwert angeben.');
    expect(punkte(eine)).toBe(0);
    const zwei = renderToStaticMarkup(<Komp z={modell(instanz, ['Streitwert angeben.', 'Kanton wählen.'])} />);
    expect(punkte(zwei)).toBe(2);
  });

  it.each(['einleitung', 'rechtsmittel'] as const)('%s: Ersatztext ohne Fehlerliste steht ohne Punkt', (instanz) => {
    const Komp = instanz === 'einleitung' ? ZustErgebnisEinleitung : ZustErgebnisRechtsmittel;
    const html = renderToStaticMarkup(<Komp z={modell(instanz, [])} />);
    expect(html).toContain('Bitte die vorherigen Schritte vervollständigen.');
    expect(punkte(html)).toBe(0);
  });
});

describe('PruefBefund: Punkt je Schritt-Liste erst ab zwei Meldungen', () => {
  it('ein Fehler je Schritt: kein Punkt; zwei in einem Schritt: zwei Punkte', () => {
    const einzeln = renderToStaticMarkup(
      <PruefBefund onSpringe={() => {}} befunde={[
        { index: 0, label: 'Parteien', fehler: ['Name fehlt.'] },
        { index: 2, label: 'Betrag', fehler: ['Betrag fehlt.'] },
      ]} />);
    expect(einzeln).toContain('Name fehlt.');
    expect(punkte(einzeln)).toBe(0);
    const doppelt = renderToStaticMarkup(
      <PruefBefund onSpringe={() => {}} befunde={[
        { index: 0, label: 'Parteien', fehler: ['Name fehlt.', 'Adresse fehlt.'] },
        { index: 2, label: 'Betrag', fehler: ['Betrag fehlt.'] },
      ]} />);
    expect(punkte(doppelt)).toBe(2);
  });
});

// Ratsche (W2·19 P12, 30.9.2026): in der Darstellungsschicht steht «•» vor einer
// Meldung NUR über `meldungspunkt()`. Vor P12 trugen acht Stellen (VorlagenSeite,
// Kontakt, VorlageAgGruendung ×3, EreignisFristen, ErgebnisAnzeige, Dokumentmappe)
// den Punkt fest vor jeder Zeile, auch vor einer einzelnen Meldung; FehlerBox
// hielt die Regel noch inline. Zeilen-Kommentare (// und Blockkommentar-Zeilen)
// zählen nicht; `meldungspunkt.ts` selbst ist die eine erlaubte Quelle.
const istKommentarzeile = (zeile: string): boolean => /^\s*(\/\/|\*|\/\*)/.test(zeile);
const handgebauterPunkt = (zeile: string): boolean => zeile.includes('•') && !istKommentarzeile(zeile);

describe('Ratsche: «•» nur über meldungspunkt()', () => {
  const wurzeln = ['components', 'pages'].map((d) => join(process.cwd(), 'src', d));
  const dateien = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
      e.isDirectory() ? dateien(join(dir, e.name)) : /\.tsx?$/.test(e.name) ? [join(dir, e.name)] : []);
  const treffer = (): string[] =>
    wurzeln.flatMap(dateien).flatMap((pfad) => {
      if (pfad.endsWith('meldungspunkt.ts')) return [];
      return readFileSync(pfad, 'utf8').split('\n').flatMap((zeile, i) =>
        handgebauterPunkt(zeile) ? [`${relative(process.cwd(), pfad)}:${i + 1}`] : []);
    });

  it('kein handgebautes «•» in src/components und src/pages', () => {
    expect(treffer()).toEqual([]);
  });

  it('die Sonde erkennt ein handgebautes «•» (Muster-Beweis, §6.7)', () => {
    expect(handgebauterPunkt('  <p className="x">• {f}</p>')).toBe(true);
    expect(handgebauterPunkt("  {fehler.length >= 2 ? '• ' : null}")).toBe(true);
    expect(handgebauterPunkt('//   • Aufzählung im Kommentar')).toBe(false);
  });
});
