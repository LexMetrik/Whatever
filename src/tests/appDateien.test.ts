/**
 * W2·19 DK-A (Nachbesserung Gegenprüfung 30.9.2026) — Einheitsfälle für
 * `ohneKommentare` (src/tests/appDateien.ts). Alle Design-/Sediment-Sonden
 * lesen den Quelltext durch diese Funktion; ein Fehler dort macht jede Sonde
 * blind für Code (§6.7: die Hilfsfunktion selbst bekommt ihren Beweis).
 */
import { describe, it, expect } from 'vitest';
import { ohneKommentare } from './appDateien';

describe('ohneKommentare', () => {
  it('(a) ein Zeilenkommentar mit Glob `// src/**` verschluckt den Folgecode nicht', () => {
    const src = '// Quelle: src/lib/normtext/**\nconst a = 1;\n/* b */\nconst c = 2;';
    const aus = ohneKommentare(src);
    expect(aus).toContain('const a = 1;');
    expect(aus).toContain('const c = 2;');
    expect(aus).not.toMatch(/Quelle|\/\*|\*\//);
  });

  it('(b) `/*` ⏎ `// x */` ⏎ code — der Code nach dem Blockende bleibt sichtbar', () => {
    // Ein späterer Blockkommentar gehört dazu: der alte Zwei-Durchgänge-Code
    // verlor das Blockende, der offene Anfang lief bis zum NÄCHSTEN Blockende und
    // verschluckte `code` (ohne späteren Block fiel der Fehler nicht auf).
    const src = '/*\n// x */\nconst code = 1;\n/* z */\nconst d = 2;\n';
    const aus = ohneKommentare(src);
    expect(aus).toContain('const code = 1;');
    expect(aus).toContain('const d = 2;');
    expect(aus).not.toMatch(/\bx\b|\bz\b/);
  });

  it('Kontrolle: Zeilen- und Blockkommentare verschwinden, Code bleibt', () => {
    const aus = ohneKommentare('const x = 1; /* k */ const y = 2;\n  // z\nconst w = 3;');
    expect(aus).toContain('const x = 1;');
    expect(aus).toContain('const y = 2;');
    expect(aus).toContain('const w = 3;');
    expect(aus).not.toMatch(/\bk\b|\bz\b/);
  });
});
