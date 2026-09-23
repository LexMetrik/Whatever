// scripts/analyse/test-assertion-diff.ts — Inhalts-Diff für Testdateien
// zwischen zwei Git-Refs. AST-basiert (TypeScript Compiler API), Nachfolger
// von test-assertion-diff.sh (Gegenprüfungs-Befund 3.9.2026, Opus-Prüfer):
// die zeichenweise Klammerzählung der .sh-Fassung riss den Statement-Umfang
// auf, sobald ein Regex-Literal eine Klammer enthielt (`/1 a\)/` in
// src/tests/normtext-fedlex.test.ts) — Fehlalarm bis zum nächsten
// describe-Block. Die Compiler-API kennt String-/Regex-Literale als
// EIGENE Knoten, keine Zeichenkette zum Zählen.
//
// Aufruf: npx vite-node scripts/analyse/test-assertion-diff.ts <base-ref> <head-ref> [pfad-praefix]
//   pfad-praefix default: src/tests/
//
// Sammelt für beide Refs aus allen *.ts/*.tsx-Dateien unter dem Präfix drei
// normalisierte MULTIMENGEN (Duplikate zählen — ein Diff auf einer echten
// Menge übersieht «ein Duplikat entfernt, ein anderes bleibt», Beleg:
// `sed -i '' '16d' src/tests/verzugszins.test.ts` liess ein zweites `expect(
// r.status).toBe('ok');` bei Zeile 119 übrig — eine gedopte Menge hätte das
// nicht bemerkt):
//   - describe-Namen  (describe/describe.only/describe.skip, erstes Argument)
//   - it/test-Namen   (it/test/.only/.skip/.each(...), erstes Argument)
//   - expect-Ausdrücke (jede CallExpression, deren Aufrufkette bis zum
//     Identifier `expect` zurückverfolgt werden kann, ganzer normalisierter
//     Ausdruckstext via node.getText())
//
// Exit 0: alle drei Multimengen identisch zwischen base-ref und head-ref.
// Exit 1: mindestens eine Multimenge unterscheidet sich.
// Exit 2: Aufruffehler, ein Ref ist ungültig, ODER einer der beiden Refs
//         liefert unter dem Präfix keine passenden Dateien (Nichtleer-Wache,
//         §6.7 — ein Tor, das bei einem Tippfehler im Präfix oder einem
//         ungültigen Ref still Exit 0 liefert, ist gefährlicher als keines;
//         Beleg: Präfix "src/test/" [ohne -s] oder ein ungültiger Ref gaben
//         der Vorgänger-Fassung Exit 0).
//
// Kein `echo` — jede Ausgabe geht über `process.stdout`/`process.stderr`.
// Seit RL-03 (23.9.2026) auch Bibliothek für fachaenderung-kern.ts;
// `.skip`/`.todo` zählt als eigener Name (⊘), Abschalten = Entfernen.

import { execFileSync } from 'node:child_process';
import ts from 'typescript';

function git(args: string[]): string {
  const buf = execFileSync('git', args, {
    maxBuffer: 1024 * 1024 * 128,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return Buffer.from(buf).toString('utf8');
}

function refGueltig(ref: string): boolean {
  try {
    execFileSync('git', ['rev-parse', '--verify', '--quiet', `${ref}^{commit}`], {
      stdio: ['ignore', 'ignore', 'ignore'],
    });
    return true;
  } catch {
    return false;
  }
}

function dateienFuerRef(ref: string, praefix: string): string[] {
  const roh = git(['ls-tree', '-r', '--name-only', ref, '--', praefix]);
  return roh
    .split('\n')
    .map((z) => z.trim())
    .filter((z) => /\.tsx?$/.test(z));
}

function inhaltFuerDatei(ref: string, datei: string): string {
  return git(['show', `${ref}:${datei}`]);
}

function normalisiere(s: string): string {
  return s.replace(/\s+/g, '');
}

export interface Mengen {
  describe: Map<string, number>;
  ittest: Map<string, number>;
  expect: Map<string, number>;
}

function leereMengen(): Mengen {
  return { describe: new Map(), ittest: new Map(), expect: new Map() };
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

/** Basis-Identifier-Name für describe/it/test — auch durch .only/.skip/
 *  .todo/.concurrent und .each(...)(...) hindurch. */
function basisTestAufrufName(node: ts.CallExpression): string | null {
  // describe(...) / it(...) / test(...)
  if (ts.isIdentifier(node.expression)) {
    return node.expression.text;
  }
  // describe.only(...) / it.skip(...) / test.todo(...)
  if (ts.isPropertyAccessExpression(node.expression) && ts.isIdentifier(node.expression.expression)) {
    return node.expression.expression.text;
  }
  // it.each([...])(...) / test.each([...])(...)
  if (ts.isCallExpression(node.expression)) {
    const innerCallee = node.expression.expression;
    if (ts.isPropertyAccessExpression(innerCallee) && ts.isIdentifier(innerCallee.expression)) {
      return innerCallee.expression.text;
    }
  }
  return null;
}

function istTestArt(basisName: string): 'describe' | 'ittest' | null {
  if (basisName === 'describe') return 'describe';
  if (basisName === 'it' || basisName === 'test') return 'ittest';
  return null;
}

function verarbeiteDatei(text: string, dateiname: string, mengen: Mengen): void {
  const scriptKind = dateiname.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const quelle = ts.createSourceFile(dateiname, text, ts.ScriptTarget.Latest, true, scriptKind);

  const besuchen = (node: ts.Node): void => {
    if (ts.isCallExpression(node)) {
      const testName = basisTestAufrufName(node);
      if (testName) {
        const art = istTestArt(testName);
        if (art) {
          const name = ersteStringArg(node);
          const aus = /^(describe|it|test)(\.\w+)*\.(skip|todo)\b/.test(node.expression.getText(quelle)) ? '⊘' : '';
          if (name !== null) zaehleHinein(mengen[art], aus + normalisiere(name));
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

/** Drei Multimengen einer einzelnen Testdatei (Text + Dateiname). */
export function assertionMengen(text: string, dateiname: string): Mengen {
  const mengen = leereMengen();
  verarbeiteDatei(text, dateiname, mengen);
  return mengen;
}

function mengeFuerRef(ref: string, praefix: string): { mengen: Mengen; dateien: string[] } {
  const dateien = dateienFuerRef(ref, praefix);
  const mengen = leereMengen();
  for (const datei of dateien) {
    verarbeiteDatei(inhaltFuerDatei(ref, datei), datei, mengen);
  }
  return { mengen, dateien };
}

function alsSortierteZeilen(map: Map<string, number>): string[] {
  const zeilen: string[] = [];
  for (const [wert, anzahl] of map) {
    for (let i = 0; i < anzahl; i++) zeilen.push(wert);
  }
  zeilen.sort();
  return zeilen;
}

/** Zeilenweiser Diff zweier sortierter Multimengen (je Wert Anzahl-Differenz
 *  als -/+ Zeilen) — kein `diff`-Aufruf nötig, beide Seiten sind bereits
 *  Arrays im Prozess. */
function diffMultimenge(basis: string[], kopf: string[]): string[] {
  const zaehleA = new Map<string, number>();
  for (const z of basis) zaehleA.set(z, (zaehleA.get(z) ?? 0) + 1);
  const zaehleB = new Map<string, number>();
  for (const z of kopf) zaehleB.set(z, (zaehleB.get(z) ?? 0) + 1);

  const alleWerte = [...new Set([...zaehleA.keys(), ...zaehleB.keys()])].sort();
  const ausgabe: string[] = [];
  for (const wert of alleWerte) {
    const a = zaehleA.get(wert) ?? 0;
    const b = zaehleB.get(wert) ?? 0;
    if (a === b) continue;
    if (a > 0) ausgabe.push(`- (${a}×) ${wert}`);
    if (b > 0) ausgabe.push(`+ (${b}×) ${wert}`);
  }
  return ausgabe;
}

function main(): void {
  const [baseRef, headRef, praefixArg] = process.argv.slice(2);
  const praefix = praefixArg ?? 'src/tests/';

  if (!baseRef || !headRef) {
    process.stderr.write(
      'Usage: npx vite-node scripts/analyse/test-assertion-diff.ts <base-ref> <head-ref> [pfad-praefix, default src/tests/]\n');
    process.exit(2);
  }

  for (const ref of [baseRef, headRef]) {
    if (!refGueltig(ref)) {
      process.stderr.write(`test-assertion-diff: Ref "${ref}" ist ungültig (git rev-parse --verify fehlgeschlagen) — Exit 2.\n`);
      process.exit(2);
    }
  }

  let basisDaten: { mengen: Mengen; dateien: string[] };
  let kopfDaten: { mengen: Mengen; dateien: string[] };
  try {
    basisDaten = mengeFuerRef(baseRef, praefix);
    kopfDaten = mengeFuerRef(headRef, praefix);
  } catch (e) {
    process.stderr.write(`test-assertion-diff: Fehler beim Lesen der Refs: ${e instanceof Error ? e.message : String(e)} — Exit 2.\n`);
    process.exit(2);
    return;
  }

  // Nichtleer-Wache (§6.7): ein Präfix-Tippfehler oder ein technisch gültiger,
  // aber falscher Ref darf nie still Exit 0 ergeben.
  if (basisDaten.dateien.length === 0 || kopfDaten.dateien.length === 0) {
    const betroffen = basisDaten.dateien.length === 0 ? baseRef : headRef;
    process.stderr.write(
      `test-assertion-diff: keine Datei(en) unter Präfix "${praefix}" für Ref "${betroffen}" ` +
      `gefunden — Tippfehler im Präfix oder falscher Ref? Abbruch, Exit 2.\n`);
    process.exit(2);
  }

  let status = 0;
  const kategorien: { key: keyof Mengen; titel: string }[] = [
    { key: 'describe', titel: 'describe-Namen' },
    { key: 'ittest', titel: 'it/test-Namen' },
    { key: 'expect', titel: 'expect-Ausdrücke' },
  ];

  for (const { key, titel } of kategorien) {
    const basisZeilen = alsSortierteZeilen(basisDaten.mengen[key]);
    const kopfZeilen = alsSortierteZeilen(kopfDaten.mengen[key]);
    const diff = diffMultimenge(basisZeilen, kopfZeilen);
    if (diff.length > 0) {
      process.stdout.write(`=== ${titel}: UNTERSCHIED (base=${baseRef} head=${headRef}) ===\n`);
      process.stdout.write(diff.join('\n') + '\n');
      status = 1;
    } else {
      process.stdout.write(`=== ${titel}: identisch ===\n`);
    }
  }

  if (status !== 0) {
    process.stderr.write(
      `test-assertion-diff: Inhalts-Diff gefunden — mindestens eine der drei Multimengen ` +
      `unterscheidet sich zwischen ${baseRef} und ${headRef}.\n`);
  }

  process.exit(status);
}

if (process.argv.some((a) => /test-assertion-diff\.ts$/.test(a))) main();
