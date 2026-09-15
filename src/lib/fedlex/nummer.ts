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
// BESTAND, gemessen 14.9.2026 über public/normtext/bund/ (228 Dateien, Feld
// `artikelLabel`, ohne Bereichs-Kopftitel wie «Art. 48bis–48sexies» und ohne
// Anhang-Einträge — Kommando siehe Commit-Body):
// bis 268 · ter 117 · quater 72 · quinquies 39 · sexies 25 · septies 20 ·
// octies 16 · novies 8 · decies 5 · undecies 2 · duodecies 2.
// NACHMESSUNG 15.9.2026 (231 Dateien, gleiche Methode): unverändert, PLUS
// «tredecies 1». Das Glied wurde nicht geraten, sondern sichtbar, als W2·27
// das Label des KKV-Tokens `126_z__2` aus dem amtlichen Heading ableitete
// (`<sup>tredecies</sup>` → «Art. 126ztredecies», Beleg:
// scripts/normtext/doppel-id-label.ts). Damit erfüllt es genau die Bedingung,
// die der Absatz unten stellt — es ist gemessen, nicht angenommen.
// Diese Reihe gilt für die BUND-Grammatik (Fedlex-Anker); die kantonale
// Grammatik (RE_PARAGRAF in KantonNormText.tsx) ist eine separate Reihe mit
// eigenem Bestand. Noch höhere Glieder (quaterdecies …) kennt der Bund-Korpus
// heute NICHT; sie gehören erst in die Reihe, wenn eine Snapshot-Messung sie
// ausweist — eine geratene Erweiterung erzeugt Anker für Bestimmungen, die es
// nicht gibt (§7). «novies» ist die Fedlex-Schreibweise (das im Bund-Korpus
// nicht vorkommende «nonies» ist eine kantonale Schreibweise, belegt in
// SO-614.11 [115nonies, neben 115septies/-octies/-decies/-undecies] — dort
// eine andere Grammatik, siehe oben).
export const ART_SUFFIXE = [
  'bis', 'ter', 'quater', 'quinquies', 'sexies',
  'septies', 'octies', 'novies', 'decies', 'undecies', 'duodecies', 'tredecies',
] as const;

// Regex-Alternation der Reihe, LÄNGSTE ZUERST. Mit dem heutigen Bestand ist
// kein Glied Präfix eines anderen (die Alternation probiert ohnehin alle
// Zweige, ein «decies» vor «duodecies» würde also heute nicht falsch matchen)
// — die Sortierung ist VORSORGE für ein künftiges Glied, das doch ein Präfix
// eines bestehenden wäre (z. B. ein «bis»-Verwandtes vor «bisbis»-artigem).
// Deterministisch aus ART_SUFFIXE abgeleitet, damit ein neues Glied nur EINMAL
// eingetragen werden muss (bei gleicher Länge entscheidet die Reihen-Position,
// also stabil).
export const SUFFIX_ALT: string = '(?:'
  + [...ART_SUFFIXE].sort((a, b) => b.length - a.length).join('|')
  + ')';
