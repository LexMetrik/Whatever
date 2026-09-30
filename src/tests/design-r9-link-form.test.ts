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
 *
 * W2·29-WERKBANK-START-LAYOUT (24.9.2026): die Ausnahme
 * `start/EntscheideListe.tsx` ist mit der Datei gefallen (David «entscheide
 * sollen weg») — genau der vorgesehene Weg, keine Lockerung.
 */
const HOVER_ONLY_AUSNAHMEN = [
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

/**
 * W2·19 DK-A (HN-D3, Go David 24.9.2026 «ja unbedingt») — B-L1c:
 * «Textlink im Fliesstext ohne Strich».
 *
 * BEFUND (Herz-und-Nieren-Prüfung 24.9.2026, DK-03): B-L1b bewachte nur die
 * Schreibweise `no-underline` + `hover:underline` in EINER Klassenzeile. Nicht
 * bewacht war (a) der Link, der per `no-underline` dauerhaft strichlos im Satz
 * steht (3 Bausteine: TagerechnerRueckverweis, ThemenEinstieg,
 * vorlagen/PassendeRechner — und Kopien derselben Form in Fristenrechnern), und
 * (b) der Link mit NUR `hover:underline` und ohne Grundstrich (35 Klassenzeilen
 * in 23 Dateien; darunter Karten-`group-hover`, Knöpfe und Kommentare, die nicht
 * zählen — gemessen 30.9.2026).
 *
 * REGEL (Reglement F0.8 «Links sind unterstrichen»): ein Link, den nur die Farbe
 * ausweist, ist kein Link (WCAG 1.4.1). Ein Link-Element (`<a>`, `<Link>`,
 * `<NavLink>`, `<…Link>` wie `<QuellLink>`) in Messing-Textfarbe (`text-brass-*`)
 * trägt den Grundstrich — `lc-link` (die eine Regel in index.css) oder
 * `underline` —, und ein Link, der den Strich NUR beim Überfahren zeigt
 * (`hover:underline` ohne Grundstrich), ist ein Verstoss. Ohne Strich dürfen
 * stehen: Kasten-/Knopf-/Chip-Formen (`lc-chip`, `lc-btn-*`), Karten
 * (`group-hover:underline` ist eine Karten-Geste, kein Link-Strich) und die
 * unten einzeln begründeten Ausnahmen.
 *
 * GRENZE der Quelltext-Sonde (§6.7, ehrlich): sie liest Klassen, die als
 * Literal am Link-Tag stehen (Zeichenkette, Schablone, Zweig einer Bedingung).
 * Eine Klasse, die über eine Konstante (`className={K}`) ankommt, sieht sie
 * nicht.
 */
const LINK_TAG = /<((?:[A-Za-z]*\.)?(?:a|(?:[A-Z][A-Za-z]*)?Link))(?=[\s/>])/g;

/** Alle Zeichenketten-Literale (", ', `) eines Attribut-Ausdrucks. */
function literale(attr: string): string[] {
  return [...attr.matchAll(/"([^"]*)"|'([^']*)'|`([^`]*)`/g)].map((m) => m[1] ?? m[2] ?? m[3] ?? '');
}

/** Einen JSX-Tag ab `start` bis zu seinem schliessenden `>` (Klammer- und Zeichenketten-bewusst). */
function tagEnde(src: string, start: number): number {
  let tiefe = 0;
  let quote: string | null = null;
  for (let i = start; i < src.length; i++) {
    const c = src[i];
    if (quote) {
      if (c === '\\') i++;
      else if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') quote = c;
    else if (c === '{') tiefe++;
    else if (c === '}') tiefe--;
    else if (c === '>' && tiefe === 0) return i;
  }
  return src.length;
}

/** Die Klassen-Tokens jedes Link-Tags einer Quelle (kommentarfrei). */
function linkKlassen(src: string): { tag: string; klassen: string[] }[] {
  const s = ohneKommentare(src);
  const out: { tag: string; klassen: string[] }[] = [];
  for (const m of s.matchAll(LINK_TAG)) {
    const von = m.index + m[0].length;
    const attrs = s.slice(von, tagEnde(s, von));
    const cn = attrs.match(/className\s*=\s*/);
    if (!cn) continue;
    const klassen = literale(attrs.slice(cn.index! + cn[0].length)).flatMap((l) => l.split(/\s+/).filter(Boolean));
    out.push({ tag: m[1], klassen });
  }
  return out;
}

/** Ein Strich-Verstoss: Messing-Link ohne Grundstrich ODER Nur-bei-Hover-Strich. */
function strichVerstoss(klassen: readonly string[]): 'messing-ohne-strich' | 'nur-hover' | null {
  const hat = (re: RegExp) => klassen.some((k) => re.test(k));
  if (hat(/^(?:underline|lc-link)$/)) return null;
  if (hat(/^(?:lc-chip|lc-btn(?:-[a-z]+)*)$/)) return null; // Kasten-/Knopf-Form trägt die Affordanz
  if (hat(/^hover:underline$/)) return 'nur-hover';
  if (hat(/^text-brass-\d+$/)) return 'messing-ohne-strich';
  return null;
}

/**
 * EINZELN BEGRÜNDETE AUSNAHMEN — je Datei UND exakter Klassen-Zeichenkette, nie
 * pauschal je Datei (eine Datei-Ausnahme verdeckte den nächsten Verstoss in
 * derselben Datei, §6.7). Die Klassen-Zeichenkette muss am Fundort noch stehen
 * (`pruefeAusnahmen` über `begruendung`), sonst fällt die Ausnahme.
 */
const STRICH_AUSNAHMEN = [
  {
    datei: 'components/ui/FehlSeite.tsx',
    begruendung: 'text-body-s font-medium text-brass-700 hover:text-brass-600 no-underline',
    grund: 'Weiterweg-Navigation (<nav aria-label="Weiterweg">, Pfeil ←): Navigation trägt ihre Affordanz aus Landmarke und Form (F0.8).',
  },
  {
    datei: 'components/vorlagen/Dokumentmappe.tsx',
    begruendung: 'inline-flex items-center gap-2 no-underline text-body-s font-medium text-brass-700 hover:text-brass-600',
    grund: 'Zurück-Knopf mit ←-Kasten (w-7 h-7 border): Form trägt die Affordanz, Knopf-Grammatik statt Textlink.',
  },
  {
    datei: 'components/vorlagen/wizard.tsx',
    begruendung: 'inline-flex items-center gap-2 no-underline text-body-s font-medium text-brass-700 hover:text-brass-600',
    grund: 'Zurück-Knopf mit ←-Kasten (w-7 h-7 border): Form trägt die Affordanz, Knopf-Grammatik statt Textlink.',
  },
  {
    datei: 'pages/VorlageKuendigungVermieter.tsx',
    begruendung: 'inline-flex items-center gap-2 no-underline text-body-s font-medium text-brass-700 hover:text-brass-600',
    grund: 'Zurück-Knopf mit ←-Kasten (w-7 h-7 border): Form trägt die Affordanz, Knopf-Grammatik statt Textlink.',
  },
  {
    datei: 'pages/gesetz-leser/inhalt-ansichten.tsx',
    begruendung: 'inline-flex items-center gap-1.5 rounded-md border border-brass-400 px-3 py-2 text-body-s font-medium text-brass-700 no-underline',
    grund: 'Umriss-Knopf der Verweiskarte (border + Padding): Kasten-Form trägt die Affordanz (Kommentar am Fundort: «Container-Grammatik (Umriss-Knopf)»).',
  },
] as const;

/**
 * TABELLENZELLEN: der Kantons-Name in der Vergleichstabelle verlinkt auf die
 * Quelle, trägt aber GAR KEINE Linkfarbe (kein `text-brass-*`) und steht in
 * einer Datenzeile, nicht im Satz. Das ist eine Tabellen-/Listen-Zelle (F0.8:
 * «Listenzeilen … dürfen ohne Strich stehen») — kein Textlink im Satz. Die
 * offene Affordanz-Frage (nur Hover + `title`) ist als Nebenfund gemeldet, nicht
 * Teil dieses Bündels.
 *
 * AKTIONSZEILE IM POPOVER: «Im Gesetz öffnen ›» / «Öffnen ›» — die Aktion neben
 * dem ⧉-Knopf, Affordanz aus dem Pfeil ›; Popover-Fusszeile, kein Satz.
 */
const NUR_HOVER_ERLAUBT = [
  'components/forms/GrundbuchEintragForm.tsx',
  'components/forms/BeurkundungForm.tsx',
  'components/forms/NotariatGrundbuchForm.tsx',
  'components/forms/ProzesskostenForm.tsx',
  'components/NormPopover.tsx',
  'components/verzahnung/RegestePopover.tsx',
] as const;

describe('B-L1c · Textlink im Fliesstext trägt einen Grundstrich (DK-A / HN-D3)', () => {
  function funde(): string[] {
    const erlaubt = pruefeAusnahmen(STRICH_AUSNAHMEN);
    const nurHoverOk = new Set<string>(NUR_HOVER_ERLAUBT);
    return alleTsx().flatMap((p) => {
      const r = rel(p);
      return linkKlassen(liesRoh(p)).flatMap((l) => {
        const art = strichVerstoss(l.klassen);
        if (!art) return [];
        if (art === 'nur-hover' && nurHoverOk.has(r)) return [];
        if (erlaubt.has(r) && STRICH_AUSNAHMEN.some((a) => a.datei === r && l.klassen.join(' ').includes(a.begruendung))) return [];
        return [`${r} <${l.tag}> ${art}: ${l.klassen.join(' ')}`];
      });
    });
  }

  it('kein Messing-Link ohne Grundstrich, kein Link mit Strich nur bei Hover', () => {
    expect(
      funde(),
      'F0.8/WCAG 1.4.1: ein Textlink trägt den Strich dauerhaft — `lc-link` (oder `underline`). '
      + 'Navigation/Listen/Knöpfe/Karten dürfen strichlos stehen, sagen das aber als benannte, '
      + 'begründete Ausnahme (STRICH_AUSNAHMEN), nicht still.',
    ).toEqual([]);
  });

  it('ROT-BEWEIS: die Sonde erkennt die Formen, die vor DK-A im Repo standen', () => {
    const vorher = [
      // TagerechnerRueckverweis.tsx:11 / AllgemeineFristForm.tsx — dauerhaft strichlos im Satz
      '<Link to="/x" className="font-medium text-brass-700 hover:text-brass-600 no-underline whitespace-nowrap">A</Link>',
      // ThemenEinstieg.tsx:26 / PassendeRechner.tsx:27
      '<Link to={l.to} className="text-brass-700 hover:text-brass-600 no-underline">{l.label}</Link>',
      // VorlageVollmacht.tsx:67 — nur Hover
      '<Link to="/v" className="text-brass-700 hover:underline">V</Link>',
      // mehrzeiliges Tag, Klasse in der Folgezeile (KontextPanel.tsx:579-Form)
      '<a href={u}\n  target="_blank" className="text-body-s text-brass-700 hover:underline">x</a>',
      // QuellLink mit überschriebener Klasse (inhalt-ansichten.tsx:206)
      '<QuellLink href={u} className="text-brass-700 hover:underline" />',
    ].map((s) => linkKlassen(s).map((l) => strichVerstoss(l.klassen)));
    expect(vorher.flat(), 'alle fünf Formen müssen auffallen').toEqual([
      'messing-ohne-strich', 'messing-ohne-strich', 'nur-hover', 'nur-hover', 'nur-hover',
    ]);
  });

  it('Negativ-Kontrollen: migrierte Formen, Karten, Knöpfe und Buttons fallen nicht auf', () => {
    const ok = (s: string) => linkKlassen(s).map((l) => strichVerstoss(l.klassen));
    expect(ok('<Link to="/x" className="lc-link text-brass-700 hover:text-brass-800">A</Link>')).toEqual([null]);
    expect(ok('<a href={u} className="text-brass-700 underline hover:text-brass-800">A</a>')).toEqual([null]);
    expect(ok('<Link to="/x" className="lc-chip no-underline hover:text-brass-700">A</Link>')).toEqual([null]);
    expect(ok('<Link to="/x" className="lc-btn-primary no-underline">A</Link>')).toEqual([null]);
    // Karten-Geste: `group-hover:underline` ist kein Link-Strich
    expect(ok('<Link to="/x" className="group no-underline"><span className="group-hover:underline">T</span></Link>')).toEqual([null]);
    // Links ohne Messing-Farbe und ohne Hover-Strich (Listen/Navigation) sind nicht Gegenstand
    expect(ok('<Link to="/x" className="no-underline hover:text-brass-700">A</Link>')).toEqual([null]);
    // `<button>` ist kein Link-Element dieser Sonde
    expect(linkKlassen('<button type="button" className="text-brass-700 hover:underline">x</button>')).toEqual([]);
    // Pfeilfunktion im Attribut (`=>`) darf das Tag-Ende nicht vorzeitig setzen
    expect(ok('<Link to="/x" onClick={() => go()} className="text-brass-700 hover:underline">A</Link>')).toEqual(['nur-hover']);
  });
});
