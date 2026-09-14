// ─── Fedlex · Achse 0: die amtliche Suffix-Reihe der Artikelnummern ──────────
//
// EINE Quelle (§5) für die lateinischen Ordnungs-Suffixe, mit denen der Schweizer
// Gesetzgeber eingeschobene Artikel nummeriert (Art. 29septies AHVG, Art. 179octies
// StGB, Art. 80dduodecies IRSG). Bis hierher stand die Alternation
// «bis|ter|quater|quinquies|sexies» als HANDKOPIE an elf Stellen — und alle elf
// endeten bei `sexies`. Die Folge war kein fehlender, sondern ein FALSCHER Anker:
// ein erzwungener Treffer auf «Art. 29septies» hätte «#art_29septies» ergeben statt
// des Fedlex-Ankers «#art_29_septies» (ROADMAP W2·22-VERWEIS-FEDLEX, Z6 a).
// Darum liegt die Reihe hier, und die Nummern-Grammatik liest sie — statt sie zu
// wiederholen.
//
// BESTAND, gemessen 14.9.2026 über den GANZEN Snapshot-Korpus (public/normtext/**,
// Feld `artikel`): bis 442 · ter 172 · quater 91 · quinquies 47 · sexies 27 ·
// septies 20 · octies 17 · novies 8 · decies 5 · undecies 2 · duodecies 2.
// Höhere Glieder (terdecies …) kennt der Korpus heute NICHT; sie gehören erst in
// die Reihe, wenn eine Snapshot-Messung sie ausweist — eine geratene Erweiterung
// erzeugt Anker für Bestimmungen, die es nicht gibt (§7). «novies» ist die
// Fedlex-Schreibweise (das ebenfalls gebräuchliche «nonies» kommt im Korpus
// 0-mal vor).
export const ART_SUFFIXE = [
  'bis', 'ter', 'quater', 'quinquies', 'sexies',
  'septies', 'octies', 'novies', 'decies', 'undecies', 'duodecies',
] as const;

// Regex-Alternation der Reihe, LÄNGSTE ZUERST. Die Reihenfolge ist nicht Kosmetik:
// in einem ungeankerten Scan nimmt die Engine die erste passende Alternative —
// stünde «decies» vor «duodecies», zerfiele «80dduodecies» in «80dduo» + Rest.
// Deterministisch aus ART_SUFFIXE abgeleitet, damit ein neues Glied nur EINMAL
// eingetragen werden muss (bei gleicher Länge entscheidet die Reihen-Position,
// also stabil).
export const SUFFIX_ALT: string = '(?:'
  + [...ART_SUFFIXE].sort((a, b) => b.length - a.length).join('|')
  + ')';
