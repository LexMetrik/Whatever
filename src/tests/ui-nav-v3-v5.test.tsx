/**
 * W2·10-UI-NAV · V3 (Regeste-Popover am KantenChip) + V5 (Erwägungs-Navigation
 * im Entscheid-Leser). Reine Darstellungsschicht (§3) — geprüft wird darum am
 * gerenderten Markup und an den reinen Ableitungen, nicht an einem Browser.
 *
 * Die Zusagen, die hier fallen müssen, wenn sie brechen:
 *   (1) V5 — die Rail-Gliederung nutzt DIESELBE Ankerbildung wie Body und
 *       Pin-Cite (`gruppiereErwaegungen`); markenlose Erwägungen erscheinen NICHT
 *       als Sprungziel (§8: kein Ziel anbieten, das es nicht gibt).
 *   (2) V5 — mehrteilige Urteile (Ziffern-Neustart) erzeugen keine doppelten
 *       Anker in der Gliederung (Permalink-Eindeutigkeit).
 *   (3) V5 — «Im Entscheid suchen» zählt case-insensitiv (Substring-Regel der
 *       In-Gesetz-Suche, §5) und trennt Gesamtzahl von anspringbaren Erwägungen.
 *   (4) V3 — die Kanten-Zelle rendert Chip + ⧉ wie bisher; ohne Kurztext
 *       entsteht KEINE Vorschau-Fläche (§8), und im SSR öffnet nie ein Popover.
 */
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { erwaegungsGliederung } from '../lib/rechtsprechung/abschnitte';
import { trefferInErwaegungen, zaehleTreffer } from '../pages/entscheidLeserRegeln';
import { ErwaegungsRail } from '../components/rechtsprechung/ErwaegungsRail';
import { KanteMitVorschau } from '../components/verzahnung/KanteMitVorschau';
import type { EntscheidAbschnitt } from '../lib/rechtsprechung/typen';

const ssr = (el: React.ReactElement) => renderToString(<MemoryRouter>{el}</MemoryRouter>);

function erw(bloecke: { marke: string | null; text: string }[]): EntscheidAbschnitt[] {
  return [
    { typ: 'sachverhalt', bloecke: [{ marke: null, text: 'A. Die Klägerin stützt sich auf Art. 41 OR.' }] },
    { typ: 'erwaegung', bloecke },
  ];
}

const BEISPIEL = erw([
  { marke: 'E. 1', text: 'Eintreten.' },
  { marke: 'E. 2', text: 'Zur Verjährung nach Art. 60 OR.' },
  { marke: 'E. 2.1', text: 'Die relative Frist beginnt mit Kenntnis des Schadens.' },
  { marke: 'E. 2.1.1', text: 'Kenntnis heisst hier tatsächliche Kenntnis.' },
  { marke: null, text: 'Ein markenloser Fliesstext-Block ohne Erwägungs-Nummer.' },
]);

describe('V5 — Erwägungs-Gliederung (Rail)', () => {
  it('liefert die Marken in Dokument-Reihenfolge mit Anker und Tiefe', () => {
    expect(erwaegungsGliederung(BEISPIEL)).toEqual([
      { anker: 'e-1', marke: 'E. 1', tiefe: 0 },
      { anker: 'e-2', marke: 'E. 2', tiefe: 0 },
      { anker: 'e-2-1', marke: 'E. 2.1', tiefe: 1 },
      { anker: 'e-2-1-1', marke: 'E. 2.1.1', tiefe: 2 },
    ]);
  });

  it('bietet markenlose Erwägungen NICHT als Sprungziel an (§8)', () => {
    const nur = erwaegungsGliederung(erw([{ marke: null, text: 'Fliesstext.' }]));
    expect(nur).toEqual([]);
  });

  it('vergibt bei mehrteiligen Urteilen eindeutige Anker (Ziffern-Neustart)', () => {
    const mehrteilig = erw([
      { marke: 'E. 1', text: 'Erstes Verfahren.' },
      { marke: 'E. 2', text: 'Erstes Verfahren, Fortsetzung.' },
      { marke: 'E. 1', text: 'Zweites Verfahren.' },
    ]);
    const anker = erwaegungsGliederung(mehrteilig).map((p) => p.anker);
    expect(anker).toEqual(['e-1', 'e-2', 'e-1-w2']);
    expect(new Set(anker).size).toBe(anker.length);
  });

  it('ohne Erwägungs-Abschnitt gibt es keine Gliederung', () => {
    expect(erwaegungsGliederung([{ typ: 'regeste', bloecke: [{ marke: null, text: 'x' }] }])).toEqual([]);
  });
});

describe('V5 — «Im Entscheid suchen»', () => {
  it('zählt case-insensitiv und nennt die anspringbaren Erwägungen', () => {
    const t = trefferInErwaegungen(BEISPIEL, 'kenntnis');
    expect(t.map((x) => x.anker)).toEqual(['e-2-1', 'e-2-1-1']);
    // «Kenntnis» steht in E. 2.1 einmal, in E. 2.1.1 zweimal.
    expect(t.map((x) => x.anzahl)).toEqual([1, 2]);
  });

  it('zählt die Gesamtzahl über ALLE Abschnitte, die Liste nur die Erwägungen (§8)', () => {
    // «Art. 41 OR» steht im Sachverhalt — dort gibt es keinen zitierfähigen Anker.
    expect(zaehleTreffer(BEISPIEL, 'Art. 41 OR')).toBe(1);
    expect(trefferInErwaegungen(BEISPIEL, 'Art. 41 OR')).toEqual([]);
  });

  it('leerer Begriff liefert nichts (kein Treffer auf allem)', () => {
    expect(trefferInErwaegungen(BEISPIEL, '   ')).toEqual([]);
    expect(zaehleTreffer(BEISPIEL, '')).toBe(0);
  });
});

describe('V5 — Rail-Markup', () => {
  const gliederung = erwaegungsGliederung(BEISPIEL);

  it('rendert Suchfeld, Erwägungs-Ziele und die Normen-Chips', () => {
    const s = ssr(
      <ErwaegungsRail gliederung={gliederung} treffer={[]} trefferGesamt={0} normen={[{ zitat: 'Art. 60 OR', anker: 'e-2' }]}
        suche="" sucheAktiv={false} onSuche={() => {}} springe={() => {}} />,
    );
    expect(s).toContain('data-erw-rail');
    expect(s).toContain('Im Entscheid suchen');
    expect(s).toContain('href="#e-2-1-1"');
    expect(s).toContain('Art. 60 OR');
    // Der Rail navigiert IM Entscheid — er verlinkt nie in die Gesetzessammlung
    // (das tut das Fuss-Panel; VZUI §0/1d bleibt unangetastet).
    expect(s).not.toContain('/gesetze/');
  });

  it('ohne Gliederung UND ohne Normen entsteht gar keine Fläche', () => {
    const s = ssr(<ErwaegungsRail gliederung={[]} treffer={[]} trefferGesamt={0} normen={[]}
      suche="" sucheAktiv={false} onSuche={() => {}} springe={() => {}} />);
    expect(s).not.toContain('data-erw-rail');
  });

  it('zeigt bei aktiver Suche die Treffer-Zahlen statt des vollen Verzeichnisses', () => {
    const treffer = trefferInErwaegungen(BEISPIEL, 'kenntnis');
    const s = ssr(<ErwaegungsRail gliederung={gliederung} treffer={treffer} trefferGesamt={16} normen={[]}
      suche="kenntnis" sucheAktiv onSuche={() => {}} springe={() => {}} />);
    expect(s).toContain('Treffer in');
    expect(s).toContain('href="#e-2-1"');
    // E. 1 trägt keinen Treffer und steht in der Ergebnisliste darum nicht mehr.
    expect(s).not.toContain('href="#e-1"');
    // §8: 3 anspringbare von 16 Vorkommen — die Differenz wird BENANNT, nicht
    // verschwiegen (sonst läse sich «3 Treffer» als Vollständigkeits-Aussage).
    expect(s).toContain('>3<');
    expect(s).toContain('>16<');
    expect(s).toContain('übrige ausserhalb');
  });
});

describe('V3 — Kanten-Zelle mit Kurztext-Vorschau', () => {
  const ZIEL = '/rechtsprechung/bge_147_III_209?norm=Art.%20257d%20OR';

  it('rendert den Chip unverändert und öffnet im SSR kein Popover', () => {
    const s = ssr(<KanteMitVorschau ziel={ZIEL} zitierung="BGE 147 III 209"
      kurztext="Mietrecht; ausserordentliche Kündigung wegen Zahlungsrückstands." leitentscheid />);
    expect(s).toContain('lc-chip');
    expect(s).toContain('BGE 147 III 209');
    expect(s).toContain(`href="${ZIEL.replace(/&/g, '&amp;')}"`);
    // Der Kasten erscheint erst nach einer Geste — nie im Erst-Markup (§15).
    expect(s).not.toContain('data-regeste-popover');
  });

  it('ohne Kurztext entsteht keine Vorschau-Fläche (§8)', () => {
    const s = ssr(<KanteMitVorschau ziel={ZIEL} zitierung="BGer 4A_1/2020" kurztext={null} />);
    expect(s).toContain('BGer 4A_1/2020');
    expect(s).not.toContain('data-regeste-popover');
    // Ohne Vorschau gibt es nichts aufzuklappen — dann behauptet der Chip auch
    // nichts (Markup byte-identisch zum Bestand vor V3).
    expect(s).not.toContain('aria-expanded');
  });

  it('B2: der geschlossene Chip meldet «zu» und zeigt auf KEINEN Kasten', () => {
    const s = ssr(<KanteMitVorschau ziel={ZIEL} zitierung="BGE 147 III 209"
      kurztext="Mietrecht; ausserordentliche Kündigung." />);
    // Aufklappbar und geschlossen — das WAI-ARIA-Muster für ein Element, das
    // etwas aufklappt.
    expect(s).toContain('aria-expanded="false"');
    // Eine `aria-controls`-Referenz auf einen nicht existierenden Knoten ist ein
    // a11y-Fehler, keine Auskunft — sie erscheint erst mit dem Kasten.
    expect(s).not.toContain('aria-controls');
  });
});
