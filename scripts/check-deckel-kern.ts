// scripts/check-deckel-kern.ts — reine Logik von check:deckel (Fläche, Wortzählung,
// Sperrklinke, Nachziehen). Der CLI-Teil steht in check-deckel.ts.
export const DECKEL_DATEI = 'messwerte/deckel.json';
export type Deckel = { grenze_woerter: number; gesetzt: string; flaechen: string[] };

/** Nicht-Produkt-Text: alles, was den Bau steuert oder beschreibt, nicht das Produkt ist. */
export const FLAECHEN = [
  'Wurzel-*.md',
  '.claude/** (alle Dateitypen)',
  'fahrplaene/**',
  'plan/**',
  'docs/**',
  'abnahme/**/*.md',
  'bibliothek/**/*.md ausser register|behoerden|kosten|normen|recherche|muster',
  'nie: *.test.ts(x)',
];
const DRIN = [/^[^/]+\.md$/, /^\.claude\//, /^fahrplaene\//, /^plan\//, /^docs\//,
  /^abnahme\/.*\.md$/, /^bibliothek\/.*\.md$/];
const AUS = [/\.test\.tsx?$/, /^bibliothek\/(register|behoerden|kosten|normen|recherche|muster)\//];

export function istDeckelFlaeche(pfad: string): boolean {
  return !AUS.some((re) => re.test(pfad)) && DRIN.some((re) => re.test(pfad));
}

/** wc -w-Semantik (C-Locale): durch ASCII-Whitespace getrennte Token. */
export function woerter(text: string): number {
  return text.split(/[ \t\n\r\v\f]+/).filter(Boolean).length;
}

/** Ist + 5 %, auf volle 100 Wörter aufgerundet. */
export function nachziehGrenze(ist: number): number {
  return Math.ceil((ist * 105) / 10000) * 100; // ganzzahliger Faktor statt 1.05
}

/** Sperrklinke: die Grenze darf gegenüber der Basis nur sinken. `null` = in Ordnung. */
export function klinkeUrteil(jetzt: Deckel, basis: Deckel | null): string | null {
  if (!basis || jetzt.grenze_woerter <= basis.grenze_woerter) return null;
  return `Grenze angehoben: ${basis.grenze_woerter} (Basis) → ${jetzt.grenze_woerter} Wörter — ` +
    'Anhebung ist ohne Ausnahme ROT. Erst streichen, dann hinzufügen.';
}

/**
 * Neue Grenze für `--nachziehen`: Ist + 5 %, aber nur wenn das die bisherige Grenze
 * senkt. Ohne bisherige Grenze (Erstanlage) wird gesetzt. `null` = nichts zu tun.
 */
export function nachziehen(ist: number, bisher: number | null): number | null {
  const neu = nachziehGrenze(ist);
  return bisher === null || neu < bisher ? neu : null;
}
