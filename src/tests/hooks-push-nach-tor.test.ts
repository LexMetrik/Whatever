// tor-schutz.py Regel 1b — `git push` nach einem Tor nur hinter `&&`
// (Vorfall #1194, 30.9.2026: `npm run gate …; echo gate=$?; …; git push` pushte
// trotz rotem gate). Läuft den echten Hook per Subprozess, wie hooks-wache.test.ts.
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const HOOK = resolve(__dirname, '../../.claude/hooks/tor-schutz.py');

function exitFuer(command: string): number {
  const p = spawnSync('python3', [HOOK], {
    input: JSON.stringify({ tool_name: 'Bash', tool_input: { command } }),
    encoding: 'utf8',
  });
  return p.status ?? -1;
}

describe('tor-schutz 1b: Push nur per && an ein Tor', () => {
  it('blockt die Vorfall-Kette (Semikolon zwischen gate und Push)', () => {
    expect(exitFuer('npm run gate > .gate/g.log 2>&1; echo gate=$?; git push -u origin feat/x')).toBe(2);
  });

  it('blockt ein anderes Tor, Zeilenende und || als Trenner', () => {
    expect(exitFuer('npx vitest run src/tests/x.test.ts; git push')).toBe(2);
    expect(exitFuer('npm run lint\ngit push origin feat/x')).toBe(2);
    expect(exitFuer('npm run gate || git push')).toBe(2);
  });

  it('blockt, wenn nur ein Teil der Kette per && hängt', () => {
    expect(exitFuer('npm run gate && echo ok; git push')).toBe(2);
  });

  it('lässt die korrekte Kette durch (nur &&)', () => {
    expect(exitFuer('npm run gate > .gate/g.log 2>&1 && git push -u origin feat/x')).toBe(0);
    expect(exitFuer('npm run lint && npx vitest run src/tests/x.test.ts && git push')).toBe(0);
  });

  it('lässt Push ohne vorangehendes Tor und Tor ohne Push durch', () => {
    expect(exitFuer('git push -u origin feat/x')).toBe(0);
    expect(exitFuer('git commit -q -F msg.txt; git push')).toBe(0);
    expect(exitFuer('npm run gate > .gate/g.log 2>&1; echo $?')).toBe(0);
  });

  it('lässt Push VOR dem Tor und reine Texte durch', () => {
    expect(exitFuer('git push; npm run gate > .gate/g.log 2>&1; echo $?')).toBe(0);
    expect(exitFuer('grep -n "npm run gate" CLAUDE.md; git push')).toBe(0);
  });

  // Prüfer-Auflage PR #1200: Heredoc-Körper und Quote-Inhalte sind Text, kein Kommando.
  it('lässt Tor-Namen in Heredoc-Körpern und Anführungszeichen durch (Falsch-Positive)', () => {
    expect(
      exitFuer("git commit -m \"$(cat <<'EOF'\nfix: x\n\nnpm run lint gruen\nEOF\n)\" && git push -u origin feat/x"),
    ).toBe(0);
    expect(exitFuer("git commit -q -F- <<'EOF'\nfix: x\n\nnpm run gate gruen\nEOF\ngit push")).toBe(0);
    expect(exitFuer('gh pr create --body "Tore:\nnpm test gruen\n" ; git push')).toBe(0);
  });

  it('blockt weiter, wenn das Tor NACH dem Heredoc/den Quotes wirklich läuft', () => {
    expect(exitFuer("git commit -q -F- <<'EOF'\nmsg\nEOF\nnpm run gate > g.log 2>&1; git push")).toBe(2);
    expect(exitFuer('git commit -m "npm run gate gruen"; npm run lint; git push')).toBe(2);
  });

  it('erkennt git mit Globaloptionen (-C, -c) vor push', () => {
    expect(exitFuer('npm run gate; git -C /x push')).toBe(2);
    expect(exitFuer('npm run gate; git -c k=v -C "/a b" push origin feat/x')).toBe(2);
    expect(exitFuer('npm run gate && git -C /x push')).toBe(0);
  });
});
