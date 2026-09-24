// scripts/analyse/assertion-mengen.ts — Bibliothek des Assertion-Diffs:
// AST-Multimengen (describe-Namen, it/test-Namen, expect-Ausdrücke,
// each-Tabellenzeilen) einer Testdatei. Genutzt vom CLI
// scripts/analyse/test-assertion-diff.ts (Ref-Vergleich) und von
// scripts/analyse/fachaenderung-kern.ts (R2 des Fachänderungs-Riegels).
// Semantik der vier Multimengen: Kopf von test-assertion-diff.ts.
//
// WARUM eine eigene Datei (Nachzug RL-03, 24.9.2026): der Einstiegs-Guard
// `argv.some(/test-assertion-diff\.ts$/)` war unter vite-node IMMER falsch
// (argv = [node, vite-node-Bin, …Argumente]) — der CLI endete still mit
// Exit 0. Wie bei scripts/dispatch-cli.ts macht die Trennung Bibliothek /
// Einstieg den Guard überflüssig, statt ihn zu reparieren. `.skip`/`.todo`
// (vor oder nach `.each`) zählt als eigener Name (⊘), Abschalten = Entfernen.

import ts from 'typescript';

function normalisiere(s: string): string {
  return s.replace(/\s+/g, '');
}

export interface Mengen {
  describe: Map<string, number>;
  ittest: Map<string, number>;
  expect: Map<string, number>;
  each: Map<string, number>;
}

export function leereMengen(): Mengen {
  return { describe: new Map(), ittest: new Map(), expect: new Map(), each: new Map() };
}

function zaehleHinein(map: Map<string, number>, wert: string): void {
  map.set(wert, (map.get(wert) ?? 0) + 1);
}

/** Läuft die Aufrufkette einer Callee-Expression bis zur Basis herunter
 *  (Call-/PropertyAccess-/ElementAccess-/NonNull-/Klammer-Hüllen abgezogen). */
function basisAusdruck(expr: ts.Expression): ts.Expression {
  let aktuell: ts.Expression = expr;
  for (;;) {
    if (ts.isCallExpression(aktuell)) { aktuell = aktuell.expression; continue; }
    if (ts.isPropertyAccessExpression(aktuell)) { aktuell = aktuell.expression; continue; }
    if (ts.isElementAccessExpression(aktuell)) { aktuell = aktuell.expression; continue; }
    if (ts.isNonNullExpression(aktuell)) { aktuell = aktuell.expression; continue; }
    if (ts.isParenthesizedExpression(aktuell)) { aktuell = aktuell.expression; continue; }
    break;
  }
  return aktuell;
}

/** Erstes Argument eines Aufrufs als Name (String-Literal oder Template-Text). */
function ersteStringArg(node: ts.CallExpression): string | null {
  const arg = node.arguments[0];
  if (!arg) return null;
  if (ts.isStringLiteralLike(arg)) return arg.text;
  if (ts.isNoSubstitutionTemplateLiteral(arg)) return arg.text;
  if (ts.isTemplateExpression(arg)) return arg.getText();
  return null;
}

interface TestKette { basis: string; glieder: string[]; tabelle: ts.Node | null }

/** Aufrufkette eines describe/it/test-Aufrufs bis zum Basis-Identifier — auch
 *  durch .only/.skip/.todo/.concurrent VOR oder NACH .each(…)/.each`…`/.for(…)
 *  hindurch; `tabelle` ist das Tabellen-Argument dieser Kette. */
function testKette(node: ts.CallExpression): TestKette | null {
  const glieder: string[] = [];
  let tabelle: ts.Node | null = null;
  let aktuell: ts.Expression = node.expression;
  for (;;) {
    if (ts.isPropertyAccessExpression(aktuell)) { glieder.unshift(aktuell.name.text); aktuell = aktuell.expression; continue; }
    if (ts.isCallExpression(aktuell)) {
      const c = aktuell.expression;
      if (ts.isPropertyAccessExpression(c) && /^(each|for)$/.test(c.name.text)) tabelle = aktuell.arguments[0] ?? null;
      aktuell = c; continue;
    }
    if (ts.isTaggedTemplateExpression(aktuell)) { tabelle = aktuell.template; aktuell = aktuell.tag; continue; }
    if (ts.isNonNullExpression(aktuell) || ts.isParenthesizedExpression(aktuell)) { aktuell = aktuell.expression; continue; }
    return ts.isIdentifier(aktuell) ? { basis: aktuell.text, glieder, tabelle } : null;
  }
}

/** Typ-/Klammer-Hüllen abziehen (`as const`, `satisfies`, `<T>x`, `x!`). */
function entkleide(e: ts.Expression): ts.Expression {
  while (ts.isParenthesizedExpression(e) || ts.isAsExpression(e) || ts.isSatisfiesExpression(e) ||
    ts.isTypeAssertionExpression(e) || ts.isNonNullExpression(e)) e = e.expression;
  return e;
}

/** Initialisierer aller Variablen-Deklarationen der Datei, je Name (jede Ebene). */
function konstanten(quelle: ts.SourceFile): Map<string, ts.Expression[]> {
  const m = new Map<string, ts.Expression[]>();
  const besuchen = (n: ts.Node): void => {
    if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && n.initializer) {
      m.set(n.name.text, [...(m.get(n.name.text) ?? []), n.initializer]);
    }
    ts.forEachChild(n, besuchen);
  };
  besuchen(quelle);
  return m;
}

/** Normalisierte Datenzeilen einer each-Tabelle. Array-Literal → je Element;
 *  Tagged Template → je nichtleere Textzeile; sonst der Ausdruckstext selbst
 *  plus — über den Basis-Identifier (`FAELLE`, `FAELLE.map(…)`, `...FAELLE`) —
 *  die Zeilen einer gleichnamigen Deklaration derselben Datei. */
function tabellenZeilen(
  t: ts.Node, konst: Map<string, ts.Expression[]>, quelle: ts.SourceFile, besucht = new Set<string>(),
): string[] {
  if (ts.isNoSubstitutionTemplateLiteral(t) || ts.isTemplateExpression(t)) {
    return t.getText(quelle).slice(1, -1).split('\n').map(normalisiere).filter(Boolean);
  }
  const e = entkleide(t as ts.Expression);
  if (ts.isArrayLiteralExpression(e)) {
    return e.elements.flatMap((el) => ts.isSpreadElement(el)
      ? tabellenZeilen(el.expression, konst, quelle, besucht) : [normalisiere(el.getText(quelle))]);
  }
  const zeilen = [normalisiere(e.getText(quelle))];
  const basis = entkleide(basisAusdruck(e));
  if (ts.isIdentifier(basis) && !besucht.has(basis.text)) {
    besucht.add(basis.text);
    for (const init of konst.get(basis.text) ?? []) zeilen.push(...tabellenZeilen(init, konst, quelle, besucht));
  }
  return zeilen;
}

function istTestArt(basisName: string): 'describe' | 'ittest' | null {
  if (basisName === 'describe') return 'describe';
  if (basisName === 'it' || basisName === 'test') return 'ittest';
  return null;
}

export function verarbeiteDatei(text: string, dateiname: string, mengen: Mengen): void {
  const scriptKind = dateiname.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const quelle = ts.createSourceFile(dateiname, text, ts.ScriptTarget.Latest, true, scriptKind);

  const konst = konstanten(quelle);
  const besuchen = (node: ts.Node): void => {
    if (ts.isCallExpression(node)) {
      const kette = testKette(node);
      const art = kette ? istTestArt(kette.basis) : null;
      if (kette && art) {
        const name = ersteStringArg(node);
        const aus = kette.glieder.some((g) => g === 'skip' || g === 'todo') ? '⊘' : '';
        if (name !== null) zaehleHinein(mengen[art], aus + normalisiere(name));
        if (kette.tabelle) {
          for (const z of tabellenZeilen(kette.tabelle, konst, quelle)) {
            zaehleHinein(mengen.each, `${aus}${normalisiere(name ?? '')}:${z}`);
          }
        }
      }
      const basis = basisAusdruck(node);
      if (ts.isIdentifier(basis) && basis.text === 'expect') {
        zaehleHinein(mengen.expect, normalisiere(node.getText(quelle)));
      }
    }
    ts.forEachChild(node, besuchen);
  };
  besuchen(quelle);
}

/** Vier Multimengen einer einzelnen Testdatei (Text + Dateiname). */
export function assertionMengen(text: string, dateiname: string): Mengen {
  const mengen = leereMengen();
  verarbeiteDatei(text, dateiname, mengen);
  return mengen;
}

