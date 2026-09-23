/**
 * W2·19-DESIGN-KONSISTENZ — Bau-Welle B2, Paket C (31.8.2026).
 *
 * Bewacht die drei Kanons, die dieses Paket gesetzt hat:
 *   C-1  Karten-Raster hängen an der eigenen Breite (`pk()`), nicht am Viewport.
 *   C-2/C-6/C-7  EIN Gruppenkopf-Baustein; nackte Zahl statt «(n)» / «· n».
 *   C-3  EINE Karten-Hover-Grammatik (Farbstufe), zentral an `.lc-card`.
 *
 * Es ist eine QUELLTEXT-Sonde, kein Render-Test: bewacht wird die Regel «diese
 * Form kommt in der App genau einmal vor», und die ist am Quelltext messbar,
 * am gerenderten DOM einer einzelnen Seite dagegen nicht.
 *
 * ROT-BEWEIS (§6.7): jeder Fall trägt eine NEGATIV-KONTROLLE — derselbe
 * Ausdruck, angewandt auf den Wortlaut, wie er vor dem Fix im Repo stand. Läuft
 * die Kontrolle grün, prüft der Ausdruck nichts und der Fall ist wertlos.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { APP_WURZEL as WURZEL, alleTsx, rel } from './appDateien';

function lies(pfad: string): string {
  return readFileSync(join(WURZEL, pfad), 'utf8');
}

// ─── C-2/C-6/C-7 · EIN Gruppenkopf ──────────────────────────────────────────

/** Das Gruppenkopf-Rezept: Overline-Überschrift + Haarlinie in EINER Flex-Zeile. */
const GRUPPENKOPF_REZEPT =
  /<h[234][^>]*className="lc-overline[^"]*"[\s\S]{0,400}?<span aria-hidden className="(?:flex-1 h-px|h-px flex-1) bg-line" \/>/;

/** Gruppenkopf in der Sans-Stimme (C-6) — Überschrift direkt über der Haarlinie. */
const SANS_GRUPPENKOPF =
  /<h2 className="font-sans font-(?:semibold|medium)[^"]*"[^>]*>[\s\S]{0,200}?<span aria-hidden className="flex-1 h-px bg-line" \/>/;

/** Die verworfenen Zähler-Schreibweisen an einem Overline-Kopf. */
const ZAEHLER_ALTFORMEN = [
  { name: '«(n)»', re: /className="lc-overline[^"]*"[^<]*<span className="num[^"]*">\(/ },
  { name: '«· n»', re: /className="lc-overline[^"]*"[^<]*<span className="text-ink-500">· / },
];

describe('C-2/C-6/C-7 · Gruppenköpfe laufen über EINEN Baustein', () => {
  // R3-α-WURZEL (31.8.2026, §17/§6.7): hier stand eine Liste von 14 Dateien
  // («migriert»). Sie konnte per Bauart nur bestätigen, was schon migriert war
  // — eine neue Fläche, die das Rezept wieder selbst zeichnet, hätte sie nie
  // gesehen. Der Sweep geht jetzt über ALLE `.tsx` der App; die Liste ist
  // ersatzlos gestrichen, nicht ergänzt. Keine Ausnahme nötig: der Bestand ist
  // vollständig migriert (gemessen 31.8.2026 — beide Ausdrücke, null Treffer).
  const sweep = (re: RegExp) => alleTsx().filter((d) => re.test(readFileSync(d, 'utf8'))).map(rel);

  it('KEINE Fläche der App zeichnet das Rezept noch selbst', () => {
    expect(sweep(GRUPPENKOPF_REZEPT)).toEqual([]);
  });

  it('NEGATIV-KONTROLLE: der Ausdruck findet die Vorher-Form', () => {
    // Wortlaut aus geteilt.tsx vor dem Fix (Stand 31.8.2026, Zeile 49–52).
    const vorher = `
      <div className="flex items-center gap-3">
        <h3 className="lc-overline text-brass-700">{titel}</h3>
        <span aria-hidden className="flex-1 h-px bg-line" />
      </div>`;
    expect(GRUPPENKOPF_REZEPT.test(vorher)).toBe(true);
  });

  it('C-6: kein Sans-H3-Gruppenkopf mehr über einer Haarlinie (App-weit)', () => {
    // Die Overline ist Kanon der Gruppenköpfe (§G-e). Ausgenommen bleiben
    // SEKTIONS-/Seitenköpfe — die trägt der Ausdruck nicht, weil ihnen die
    // Haarlinien-Zeile fehlt bzw. das `id`-Attribut vorangeht
    // (RechtsgebietUebersicht «Gesetze nach Rechtsgebiet», Katalog-Register).
    expect(sweep(SANS_GRUPPENKOPF)).toEqual([]);
  });

  it('NEGATIV-KONTROLLE: der Sans-Ausdruck findet die Vorher-Form', () => {
    // Materialien.tsx vor dem Fix (Stand 31.8.2026, Zeile 143–147).
    const vorher = `
      <div className="flex items-center gap-3">
        <h2 className="font-sans font-semibold text-ink-900 text-h3 tracking-tight">{g.kuerzel}</h2>
        <span aria-hidden className="flex-1 h-px bg-line" />
        <span className="num text-body-s text-ink-500">{g.materialien.length}</span>
      </div>`;
    expect(SANS_GRUPPENKOPF.test(vorher)).toBe(true);
  });

  it('die verworfenen Zähler-Schreibweisen kommen nirgends mehr vor', () => {
    const funde: string[] = [];
    for (const datei of alleTsx()) {
      const inhalt = readFileSync(datei, 'utf8');
      for (const { name, re } of ZAEHLER_ALTFORMEN) {
        if (re.test(inhalt)) funde.push(`${datei.slice(WURZEL.length + 1)} · ${name}`);
      }
    }
    expect(funde).toEqual([]);
  });

  it('NEGATIV-KONTROLLE: die Zähler-Ausdrücke finden die Vorher-Formen', () => {
    // Katalog.tsx (vorher): «Weitere Werkzeuge (7)».
    expect(ZAEHLER_ALTFORMEN[0].re.test(
      `<h3 className="lc-overline">Weitere Werkzeuge <span className="num">({weitere.length})</span></h3>`,
    )).toBe(true);
    // Gesetze.tsx (vorher): «Bund · 12».
    expect(ZAEHLER_ALTFORMEN[1].re.test(
      `<h2 className="lc-overline">Bund <span className="text-ink-500">· {bund.length}</span></h2>`,
    )).toBe(true);
  });

  it('§8-Ausnahme: «n verfügbar» im Katalog-Sektionskopf bleibt stehen', () => {
    // Kein Zähler der Gruppe darunter, sondern eine Aussage über den Umfang
    // einer Sektion, die zusätzlich einen «In Vorbereitung»-Block trägt. Eine
    // nackte Zahl wäre dort falsch, nicht bloss anders geschrieben.
    expect(lies('components/Katalog.tsx')).toContain('verfügbar');
  });
});

// ─── C-3 · EINE Karten-Hover-Grammatik ──────────────────────────────────────

describe('C-3 · Karten-Hover läuft über die Farbstufe, zentral', () => {
  it('index.css trägt die Regel genau einmal, elementgebunden', () => {
    const css = lies('index.css');
    expect(css).toContain(
      ":is(a, button, [role='button']).lc-card:hover { border-color: var(--brass-400); }",
    );
  });

  it('keine Karten-Klassenkette hebt oder beschattet mehr auf Hover', () => {
    const funde: string[] = [];
    for (const datei of alleTsx()) {
      const inhalt = readFileSync(datei, 'utf8');
      // Nur Klassenketten, die eine KARTE/KACHEL zeichnen (lc-card/lc-tile) —
      // Knöpfe und Chips haben eigene, hier nicht betroffene Zustände.
      for (const kette of inhalt.match(/className="[^"]*lc-(?:card|tile)[^"]*"/g) ?? []) {
        if (/hover:(?:shadow|-?translate)/.test(kette)) {
          funde.push(`${datei.slice(WURZEL.length + 1)} · ${kette.slice(0, 90)}`);
        }
      }
    }
    expect(funde).toEqual([]);
  });

  it('NEGATIV-KONTROLLE: der Ausdruck findet die Vorher-Ketten', () => {
    // NewsHeader.tsx bzw. RubrikKacheln.tsx vor dem Fix.
    const lift = `className="group flex lc-card p-3.5 bg-surface no-underline hover:shadow-lg hover:-translate-y-0.5"`;
    const elev = `className="group lc-tile p-5 no-underline hover:border-line-strong hover:shadow-md"`;
    for (const vorher of [lift, elev]) {
      const kette = vorher.match(/className="[^"]*lc-(?:card|tile)[^"]*"/)![0];
      expect(/hover:(?:shadow|-?translate)/.test(kette)).toBe(true);
    }
  });

  it('die Karten führen den Hover nicht mehr als eigene Utility', () => {
    for (const rel of [
      'components/normtext/ErlassKarte.tsx',
      'components/materialien/MaterialKarte.tsx',
      'components/rechtsprechung/EntscheidKarte.tsx',
    ]) {
      const inhalt = lies(rel);
      for (const kette of inhalt.match(/className="[^"]*lc-card[^"]*"/g) ?? []) {
        expect(kette).not.toMatch(/hover:border-brass/);
      }
    }
  });
});

// ─── Stand-Chip · eine Quelle ───────────────────────────────────────────────

describe('Stand-Chip liegt genau einmal', () => {
  it('nur ui/StandChip.tsx definiert ihn', () => {
    const definitionen = alleTsx().filter((d) =>
      /function StandChip\(/.test(readFileSync(d, 'utf8')));
    expect(definitionen.map((d) => d.slice(WURZEL.length + 1)))
      .toEqual(['components/ui/StandChip.tsx']);
  });

  it('und formatiert über die eine Datums-Quelle (B-3), nicht über eine eigene Regex', () => {
    const quelle = lies('components/ui/StandChip.tsx');
    expect(quelle).toContain('<Datum iso={stand}');
    expect(quelle).not.toMatch(/\\d\{4\}/);
  });
});

// ─── C-1 · Karten-Raster an der eigenen Breite ──────────────────────────────

describe('C-1 · das Entscheid-Raster hängt an der Pane-Breite', () => {
  it('Rechtsprechung.tsx wählt das Raster über pk()', () => {
    const inhalt = lies('pages/Rechtsprechung.tsx');
    expect(inhalt).toContain(
      "pk('grid grid-cols-1 gap-3 xl:grid-cols-2', 'grid grid-cols-1 gap-3 @3xl/pane:grid-cols-2')",
    );
  });

  it('keine Karten-Fläche setzt eine nackte Viewport-Spaltenzahl mehr', () => {
    // Vorher: className="grid grid-cols-1 gap-3 xl:grid-cols-2" — ohne pk().
    const inhalt = lies('pages/Rechtsprechung.tsx');
    expect(inhalt).not.toMatch(/className="grid grid-cols-1 gap-3 xl:grid-cols-2"/);
  });
});
