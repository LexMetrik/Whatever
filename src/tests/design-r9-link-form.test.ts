/**
 * W2·24-DESIGN-IDENTITAET — R9 «Einheitlichkeit», Fixer R9-1, Fund B-L1.
 *
 * BEFUND (r9-befunde-b.md B-L1, gemessen 6.9.2026): vier Textlink-Rezepte
 * nebeneinander — unterstrichen 106×, gepunktet 6× (`VERWEIS_RUHE`),
 * NUR-BEI-HOVER 2×, und im Rechtsprechungs-Reader eine nachgebaute
 * `border-bottom` statt eines Unterstrichs.
 *
 * BEWACHT WIRD ZWEIERLEI:
 *   B-L1a · die Regel steht EINMAL in `src/index.css` und deckt alle
 *           Fliesstext-Flächen ab (§5/§10, F0.8).
 *   B-L1b · kein Link trägt seinen Strich NUR beim Überfahren. Ein Strich, der
 *           erst bei Hover erscheint, existiert für Tastatur- und
 *           Touch-Bedienung nicht — das ist derselbe Mangel, den axe auf der
 *           Startseite als «link-in-text-block» meldete (R3-F1) und den P3 im
 *           Leser abgeräumt hat (WCAG 1.4.1 «Use of Color»).
 *
 * QUELLTEXT-SONDE, kein Render-Test (gleiche Bauart wie
 * `design-r5-konsistenz.test.ts`): bewacht wird «diese Form kommt in der App
 * nicht mehr vor» — am Quelltext messbar, am DOM einer Seite nicht.
 *
 * NICHT bewacht (bewusst): die gepunktete Verweis-Ruhe im Normtext. Sie TRÄGT
 * einen Strich, nur einen leiseren, und ist der dokumentierte §13-farbfreie
 * Verweis — eine Ausnahme mit Grund, kein viertes Rezept.
 *
 * Reine Darstellung (§3) — keine Rechtslogik berührt.
 */
import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { alleTsx, APP_WURZEL, liesRoh, ohneKommentare, pruefeAusnahmen, rel } from './appDateien';

const CSS = liesRoh(join(APP_WURZEL, 'index.css'));

/**
 * Der Nur-bei-Hover-Strich: dieselbe Klassenzeile führt `no-underline` UND
 * `hover:underline`. An der SACHE, nicht an einer Reihenfolge — beide
 * Schreibweisen fallen auf. Der Ausdruck bleibt innerhalb EINER Klassenzeile
 * (kein `"`/`'`/Backtick dazwischen), damit zwei unabhängige Elemente
 * derselben Datei nicht zufällig zusammengelesen werden.
 */
const HOVER_ONLY = /(?:no-underline[^"'`]*hover:underline|hover:underline[^"'`]*no-underline)/g;

/**
 * DREI STELLEN, DIE NOCH STEHEN — und warum sie hier stehen und nicht im Code.
 *
 * KORREKTUR AM BEFUND (§7): `r9-konsolidierung.md` zählte «hover-only 2×».
 * Diese Sonde findet FÜNF Klassenzeilen — der Finder hatte nur `<a>` im
 * Fliesstext gezählt, nicht die Listen- und Krumen-Zeilen. Zwei sind mit B-L1
 * abgeräumt (`ZweiachsigerEinstieg.tsx`, `ErgebnisAnzeige.tsx`), drei liegen
 * ausserhalb der Bauhand R9-1 und tragen darum hier ihren Grund. Die Zahl 2
 * wird nicht «nachgeführt», sie ist falsifiziert (§2b).
 *
 * Jeder Eintrag zitiert einen Satz vom Fundort: verschwindet die Stelle oder
 * ihr Kontext, fällt die Ausnahme (`pruefeAusnahmen`).
 */
const HOVER_ONLY_AUSNAHMEN = [
  {
    datei: 'components/start/EntscheideListe.tsx',
    begruendung: 'hover:text-reg-r hover:underline',
  },
  {
    datei: 'components/layout/OrtsAngabe.tsx',
    begruendung: 'hover:text-brass-700 hover:underline',
  },
] as const;

describe('B-L1a · der Textlink-Strich hat EINE Regel', () => {
  it('index.css führt sie als eine Selektor-Liste über alle Fliesstext-Flächen', () => {
    const i = CSS.indexOf('.lc-leser :where(a[href]),');
    expect(i, 'die eine Regel existiert').toBeGreaterThan(-1);
    const block = CSS.slice(i, CSS.indexOf('}', i));
    expect(block, 'der Gesetzesleser').toContain('.lc-leser :where(a[href])');
    expect(block, 'der Rechtsprechungs-Reader').toContain('.rsp-prose :where(a[href])');
    expect(block, 'die Opt-in-Klasse für den Einzellink ausserhalb einer Fläche')
      .toContain('.lc-link');
    expect(block, 'Strichstärke aus der Vorgabe').toContain('text-decoration-thickness: 1px');
    expect(block, 'Abstand wächst mit der Schriftgrösse').toContain('text-underline-offset: .15em');
  });

  it('der Rechtsprechungs-Reader baut den Strich nicht mehr als Rahmen nach', () => {
    const i = CSS.indexOf('.rsp-prose a {');
    expect(i, '`.rsp-prose a` existiert (Farbe/Hover bleiben dort)').toBeGreaterThan(-1);
    const block = CSS.slice(i, CSS.indexOf('}', i));
    expect(block, 'kein `text-decoration: none`, das die eine Regel aushebelt')
      .not.toContain('text-decoration: none');
    expect(block, 'kein nachgebauter Unterstrich als `border-bottom`')
      .not.toContain('border-bottom');
  });
});

describe('B-L1b · kein Link zeigt seinen Strich erst beim Überfahren', () => {
  it('keine App-Datei führt `no-underline` und `hover:underline` in derselben Klassenzeile', () => {
    const erlaubt = pruefeAusnahmen(HOVER_ONLY_AUSNAHMEN);
    const funde = alleTsx().flatMap((p) => {
      if (erlaubt.has(rel(p))) return [];
      const t = ohneKommentare(liesRoh(p)).match(HOVER_ONLY);
      return t ? t.map(() => rel(p)) : [];
    });
    expect(
      funde,
      'F0.8/WCAG 1.4.1: ein Strich, den es nur bei Hover gibt, existiert für Tastatur und '
      + 'Touch nicht. Entweder der Link ist ein INLINE-Textlink (dann trägt er den Strich '
      + 'dauerhaft, über die eine Regel in index.css), oder er ist ein Navigations-/Listen-/'
      + 'Knopf-Link (dann steht er dauerhaft ohne Strich und sagt das mit `no-underline`).',
    ).toEqual([]);
  });

  it('ROT-BEWEIS: der Ausdruck erkennt beide Stellen, die vor B-L1 im Repo standen', () => {
    const vorher = [
      // components/ZweiachsigerEinstieg.tsx:49
      'className="text-body-s text-brass-700 no-underline hover:underline"',
      // components/ErgebnisAnzeige.tsx:214
      'className="no-underline hover:underline"',
      // umgekehrte Reihenfolge fiele ebenso auf
      'className="hover:underline text-xs no-underline"',
    ].join('\n');
    expect(vorher.match(HOVER_ONLY), 'alle drei Formen müssen auffallen').toHaveLength(3);
    // Negativ-Kontrollen: die migrierten Formen fallen nicht auf.
    expect('className="text-body-s text-brass-700 no-underline hover:text-brass-800"'.match(HOVER_ONLY))
      .toBeNull();
    expect('className="text-body-s text-danger-700 hover:underline"'.match(HOVER_ONLY)).toBeNull();
  });
});
