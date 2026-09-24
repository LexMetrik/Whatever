// ─── Repeater und Akzent-Oberkante (Design-Konsistenz R2-F) ────────────────
//
// Zwei Befunde, drei Zusicherungen:
//
// F1-9 (Repeater): Wiederholbare Zeilen — Rechtsbegehren, Kinder, Beilagen,
// Sperrereignisse, Gründer:innen — standen in 20 Dateien in drei
// Knopf-Optiken, zwei Beschriftungsgrammatiken und vier Entfernen-Formen
// nebeneinander. Kanon ist neu der `ListenEditor` in
// `src/components/vorlagen/ui.tsx` (§5/§10: EIN Baustein, Kopien gelöscht).
//
// F1-5 (Akzent-Oberkante): Die 3 px starke Oberkante «massgeblich» / «keine
// Sperre» war sechsmal als `border-t-[3px]` von Hand gesetzt. Kanon sind die
// beiden CSS-Klassen `.lc-akzent-w` / `.lc-akzent-danger` (index.css) —
// die Farbe trägt die Bedeutung, und nur dort ist sie theme-fest.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { renderToString } from 'react-dom/server';
import { ListenEditor } from '../components/vorlagen/ui';

/** Alle handgeschriebenen Darstellungs-Dateien unter src/ (ohne Tests: die
 *  zitieren die verbotenen Muster als Beleg — dieselbe Vorsichtsmassnahme wie
 *  in eingabe-bausteine-r2e.test.tsx).
 *
 *  R5-A (5.9.2026) · begruendete Ausnahme von `appDateien.ts`: dieser Sweep
 *  fegt bewusst NUR HANDGESCHRIEBENES — `.generated.tsx?` bleibt draussen (acht
 *  solche Dateien liegen heute unter src/). Der geteilte Baustein kennt diese
 *  Grenze nicht und darf sie auch nicht lernen, weil die uebrigen Waechter
 *  generierten Code sehr wohl pruefen wollen. Zwei verschiedene Fragen, zwei
 *  Sweeps — keine Dublette. */
function darstellungsDateien(wurzel = 'src'): string[] {
  const raus: string[] = [];
  for (const name of readdirSync(wurzel)) {
    const pfad = `${wurzel}/${name}`;
    if (statSync(pfad).isDirectory()) {
      if (name === 'tests') continue;
      raus.push(...darstellungsDateien(pfad));
    } else if (/\.tsx?$/.test(name) && !/\.generated\.tsx?$/.test(name)) {
      raus.push(pfad);
    }
  }
  return raus;
}

// Kommentare fliegen raus, bevor gesucht wird.
const ohneKommentare = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const quellen = darstellungsDateien().map((p) => [p, ohneKommentare(readFileSync(p, 'utf8'))] as const);

describe('R2-F/F1-9 — der Repeater ist EIN Baustein', () => {
  it('ListenEditor ist genau einmal definiert', () => {
    const definitionen = quellen
      .filter(([, q]) => /(export\s+)?function\s+ListenEditor\b/.test(q))
      .map(([p]) => p);
    expect(
      definitionen,
      'ListenEditor gehört genau einmal nach src/components/vorlagen/ui.tsx (§5)',
    ).toEqual(['src/components/vorlagen/ui.tsx']);
  });

  it('kein «+ … hinzufügen» mehr — die Knopf-Beschriftung ist «+ <Element>»', () => {
    const treffer = quellen.flatMap(([p, q]) =>
      [...q.matchAll(/\+\s+[^<>{}"'\n]{1,60}hinzufügen/g)].map((m) => `${p}: ${m[0].trim()}`));
    expect(
      treffer,
      'Das Pluszeichen sagt die Handlung bereits — Kanon ist «+ <Element>» via <ListenEditor element="…">',
    ).toEqual([]);
  });

  it('keine handgebaute Entfernen-Beschriftung «Entfernen» mehr', () => {
    // Der Kanon ist der kleingeschriebene Link im ListenEditor (20:9). Die
    // Sonderfälle mit eigener Bedeutung («Filter entfernen», «Zeile
    // entfernen» als aria-label) tragen den Wortlaut klein und fallen
    // deshalb nicht unter das Muster.
    const treffer = quellen.flatMap(([p, q]) =>
      [...q.matchAll(/>\s*Entfernen\s*</g)].map(() => p));
    expect(
      [...new Set(treffer)],
      'Entfernen-Link kommt aus dem ListenEditor (Wortlaut «entfernen», klein)',
    ).toEqual([]);
  });
});

describe('R2-F/F1-5 — die Akzent-Oberkante kommt aus der CSS-Klasse', () => {
  it('kein handgebautes border-t-[3px] in der Darstellungsschicht', () => {
    const treffer = quellen.filter(([, q]) => q.includes('border-t-[3px]')).map(([p]) => p);
    expect(
      treffer,
      'Kanon: className="lc-akzent-w" (massgeblich) bzw. "lc-akzent-danger" (Sperre) — '
      + 'nur dort hält der Ton im Dunkelmodus (index.css --reg-w/--danger-line)',
    ).toEqual([]);
  });

  // DEKLARIERTE ANPASSUNG (W2·29-WERKBANK-RECHNER R2, 24.9.2026, §6.3): die
  // massgebliche Kachel trägt das Register «Werkzeuge» (`.lc-akzent-w`, Strich
  // `--reg-w` + Fläche) statt `.lc-akzent-brass`/`--brass-line`. Anatomie (3 px
  // Oberkante, eine Klasse je Bedeutung) und Umfang der Assertion unverändert.
  it('beide Akzent-Klassen sind in index.css definiert', () => {
    const css = readFileSync('src/index.css', 'utf8');
    expect(css).toMatch(/\.lc-akzent-w\s*\{\s*border-top:\s*3px solid var\(--reg-w\)/);
    expect(css).toMatch(/\.lc-akzent-danger\s*\{\s*border-top:\s*3px solid var\(--danger-line\)/);
  });
});

describe('R2-F — der ListenEditor rendert die Kanon-Anatomie', () => {
  const dreh = (extra: Partial<Parameters<typeof ListenEditor<string>>[0]> = {}) =>
    renderToString(
      <ListenEditor
        element="Begehren"
        eintraege={['a', 'b']}
        onHinzufuegen={() => {}}
        onEntfernen={() => {}}
        kinder={(e) => <span>{e}</span>}
        {...extra}
      />,
    );

  it('Hinzufügen-Knopf: Kanon-Optik und «+ <Element>» ohne «hinzufügen»', () => {
    const html = dreh();
    expect(html).toContain('class="lc-btn-outline lc-btn-sm"');
    expect(html).toContain('+ Begehren');
    expect(html).not.toContain('hinzufügen');
  });

  it('Eintrag: lc-panel-Behälter, Overline-Kopf, kleiner roter Entfernen-Link', () => {
    const html = dreh();
    expect(html, 'Behälter').toContain('class="lc-panel p-3 space-y-2"');
    expect(html, 'Kopfzeile «<Element> N»').toContain('Begehren 1');
    expect(html, 'Entfernen-Wortlaut klein').toContain('>entfernen<');
    expect(html, 'roter Text-Link, kein Knopf-Kasten').toContain('text-body-s text-danger-700 hover:underline');
    expect(html, 'unterscheidbar für Screenreader').toContain('aria-label="Begehren 2 entfernen"');
  });

  it('`mindestens` hält den letzten Eintrag: kein Entfernen-Link mehr', () => {
    const html = renderToString(
      <ListenEditor element="Begehren" eintraege={['a']} mindestens={1}
        onHinzufuegen={() => {}} onEntfernen={() => {}} kinder={(e) => <span>{e}</span>} />,
    );
    expect(html).not.toContain('entfernen');
  });

  it('`hoechstens` blendet den Hinzufügen-Knopf aus', () => {
    const html = dreh({ hoechstens: 2 });
    expect(html).not.toContain('+ Begehren');
  });

  it('`weitere` gibt derselben Liste einen zweiten Hinzufügen-Knopf', () => {
    const html = dreh({ weitere: [{ element: 'Satzänderung', onHinzufuegen: () => {} }] });
    expect(html).toContain('+ Begehren');
    expect(html).toContain('+ Satzänderung');
  });
});
