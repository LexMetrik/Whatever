// ─── Druck-Fundstellen-Wächter (W2·10-UI-NAV-Z2) ───────────────────────────
//
// Die Print-Regel in `src/index.css` blendet die klebende Topbar über
// `header.lc-glass` aus — statt wie früher über den nackten Tag `header`, der
// AUCH den Erlass-/Entscheid-Kopf traf und damit Titel, SR, Stand-Zeile, ELI
// und das §8-Aufhebungsbanner aus jedem Ausdruck warf.
//
// Diese Kopplung ist unsichtbar und bricht still: Nimmt jemand `lc-glass` aus
// der Topbar oder setzt jemand wieder einen Pauschal-Selektor in den
// Druckblock, merkt es niemand — bis ein Ausdruck entweder die Navigation
// mitschleppt oder erneut ohne Stand-Zeile herauskommt. Beide Enden werden
// darum hier festgehalten (§6.7: der Wächter kann scheitern — er wurde einmal
// rot gezeigt, indem `lc-glass` testweise aus Topbar.tsx entfernt wurde).
//
// Das VERHALTEN im echten Druckmedium prüft `e2e/druck-fundstellen-z2.e2e.ts`
// (page.emulateMedia({ media: 'print' })); dieser Unit-Wächter sichert nur die
// Kopplung, die der e2e-Lauf voraussetzt.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import ts from 'typescript'

const CSS = readFileSync('src/index.css', 'utf8')
const TOPBAR = readFileSync('src/components/layout/Topbar.tsx', 'utf8')

/**
 * Element-Ebene statt Zeichen-Fenster (Fixer 1h, §17-Wurzelfix zum offenen
 * Punkt «Aus Fixer 1e»): die alte Sonde suchte `TOPBAR.match(/<header[\s\S]
 * {0,300}?>/)` — ein Regex-Fenster von 300 Zeichen ab dem ersten `<header`.
 * Trägt das `<header>`-Tag mehr als 300 Zeichen Attribute VOR der Klasse,
 * findet der Regex kein `>` im Fenster und liefert `undefined` — die Sonde
 * verfehlt die Klasse lautlos, ohne je rot zu werden (dieselbe Fehlerklasse
 * wie beim Klammerzählen in `scripts/analyse/test-assertion-diff.ts`, dort
 * bereits auf die TypeScript-Compiler-API umgestellt: String-/JSX-Literale
 * sind EIGENE Knoten, keine Zeichenkette zum Zählen/Fenstern).
 *
 * Der TypeScript-Compiler kennt das JSX-Opening-Element als eigenen Knoten
 * mit einer eigenen Attribut-Liste — die Prüfung sitzt GENAU am `<header>`,
 * unabhängig davon, wie lang seine Attribute sind.
 */
function ersterHeaderTraegtKlasse(quelltext: string, klasse: string): boolean {
  const sf = ts.createSourceFile('Topbar.tsx', quelltext, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let treffer: boolean | null = null;
  const besuch = (knoten: ts.Node) => {
    if (treffer !== null) return;
    if (
      (ts.isJsxOpeningElement(knoten) || ts.isJsxSelfClosingElement(knoten))
      && knoten.tagName.getText(sf) === 'header'
    ) {
      const klassAttr = knoten.attributes.properties.find(
        (p): p is ts.JsxAttribute => ts.isJsxAttribute(p) && p.name.getText(sf) === 'className',
      );
      const text = klassAttr?.initializer ? klassAttr.initializer.getText(sf) : '';
      treffer = text.includes(klasse);
      return;
    }
    ts.forEachChild(knoten, besuch);
  };
  besuch(sf);
  if (treffer === null) throw new Error('kein <header>-Element in der Quelldatei gefunden');
  return treffer;
}

/** Der Inhalt des `@media print`-Blocks, Kommentare entfernt. */
function druckBlock(): string {
  const ohneKommentare = CSS.replace(/\/\*[\s\S]*?\*\//g, '')
  const start = ohneKommentare.indexOf('@media print')
  expect(start, 'src/index.css führt einen @media-print-Block').toBeGreaterThan(-1)
  // Klammern zählen statt regex-greedy schneiden (der Block enthält @page und
  // verschachtelte Regeln).
  let tiefe = 0
  let i = ohneKommentare.indexOf('{', start)
  const von = i
  for (; i < ohneKommentare.length; i++) {
    if (ohneKommentare[i] === '{') tiefe++
    else if (ohneKommentare[i] === '}') {
      tiefe--
      if (tiefe === 0) return ohneKommentare.slice(von + 1, i)
    }
  }
  throw new Error('@media-print-Block ist nicht geschlossen')
}

describe('Z2 — Druck der Fundstelle', () => {
  it('blendet die Topbar über ihre Klasse aus, nicht über den Tag `header`', () => {
    const block = druckBlock()
    // Ein nackter `header`-Selektor (Zeilenanfang oder nach Komma) würde den
    // Inhalts-Kopf wieder mitreissen.
    const nackt = [...block.matchAll(/(^|[,{}])\s*header\s*(?=[,{ ])/g)]
    expect(
      nackt.map((m) => m[0].trim()),
      'Druckregel darf keinen Pauschal-Selektor `header` führen (er trifft auch den Erlass-/Entscheid-Kopf)',
    ).toEqual([])
    expect(block, 'die klebende Topbar wird über header.lc-glass ausgeblendet').toContain('header.lc-glass')
  })

  it('Topbar trägt die Klasse, auf die die Druckregel zielt', () => {
    expect(TOPBAR, 'Topbar.tsx muss lc-glass führen, sonst greift die Druckregel ins Leere').toContain('lc-glass')
    // …und zwar am <header> selbst, nicht irgendwo im Baum — auf Element-Ebene
    // (JSX-Attribut-Knoten), nicht über ein 300-Zeichen-Regex-Fenster (s. o.).
    expect(ersterHeaderTraegtKlasse(TOPBAR, 'lc-glass'), '<header> der Topbar trägt lc-glass').toBe(true)
  })

  // ROT-PROBE (§6.7 — die Sonde muss beide Enden erkennen können):
  it('NEGATIV-KONTROLLE: erkennt eine fehlende Klasse noch am selben <header>', () => {
    // `lc-glass` steht VORHER schon in einem erklärenden Kommentar (s. o.) —
    // ein blosses `.replace('lc-glass', …)` träfe den Kommentar, nicht das Tag.
    // Ziel ist die tatsächliche className am <header> selbst.
    const ohneKlasse = TOPBAR.replace('z-dropdown lc-glass', 'z-dropdown irgendwas-anderes')
    expect(ohneKlasse, 'Beleg: die Ersetzung hat wirklich am <header>-Tag gegriffen').not.toContain('<header className="sticky top-0 z-dropdown lc-glass"')
    expect(ersterHeaderTraegtKlasse(ohneKlasse, 'lc-glass')).toBe(false)
  })

  // ROT-PROBE für den WURZEL-FUND: dieselbe Konstellation, die die ALTE
  // 300-Zeichen-Regex-Sonde lautlos verfehlt hätte (langes Attribut-Fenster
  // VOR der Klasse), zeigt hier ROT für die alte Sonde und GRÜN für die neue
  // Element-Sonde — belegt am selben `<header>`-Fall, nicht nur behauptet.
  it('NEGATIV-KONTROLLE: die alte 300-Zeichen-Regex hätte ein langes Attribut-Fenster verfehlt', () => {
    const langesHeader = `<header ${'data-x="y" '.repeat(40)}className="lc-glass">`
    expect(langesHeader.length, 'Beleg: das Tag ist wirklich länger als das alte 300-Zeichen-Fenster').toBeGreaterThan(300 + '<header className="lc-glass">'.length)
    const alteSonde = langesHeader.match(/<header[\s\S]{0,300}?>/)?.[0] ?? ''
    expect(alteSonde, 'ROT-BELEG: die alte Regex-Sonde verfehlt die Klasse im langen Tag').not.toContain('lc-glass')
    expect(ersterHeaderTraegtKlasse(langesHeader, 'lc-glass'), 'die neue Element-Sonde findet die Klasse trotzdem').toBe(true)
  })

  it('druckt absolute Quell-URLs als Text (Fundstelle bleibt auf Papier)', () => {
    const block = druckBlock()
    expect(block, 'externe Links geben ihr href im Ausdruck aus').toMatch(/a\[href\^="http"\]::after/)
    expect(block, 'die URL kommt aus attr(href), nicht aus einer Kopie').toContain('attr(href)')
  })

  // A-2 (S6-W1a, 23.9.2026): das Erlass-Blatt und sein Scrim fallen im Druck.
  // Beide Enden der Kopplung: die Regel nennt die Anker, und das Bauteil trägt
  // sie noch (ein umbenannter Anker liesse die Regel still ins Leere greifen).
  // Rot zu bekommen: die Zeile im Druckblock streichen.
  it('blendet Erlass-Blatt und Scrim im Druck aus (A-2)', () => {
    const block = druckBlock()
    expect(block).toMatch(/\[data-v3-panel-spur\],\s*\[data-v3-panel-scrim\]\s*\{\s*display:\s*none !important;/)
    const zone = readFileSync('src/pages/gesetz-leser/v3/LeserPanelZone.tsx', 'utf8')
    expect(zone).toMatch(/data-v3-panel-spur=/)
    expect(zone).toMatch(/data-v3-panel-scrim\b/)
  })

  it('hebt content-visibility und Scroll-Clipping für den Ausdruck auf', () => {
    const block = druckBlock()
    expect(block, 'content-visibility darf im Druck nichts überspringen').toMatch(/content-visibility:\s*visible/)
    expect(block, 'Scroll-Panes clippen im Druck nicht').toMatch(/overflow:\s*visible/)
  })
})
