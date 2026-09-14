// ─── Kommentar-Maskierung für `check:ui-normzitate` (Mechanik) ──────────────
//
// Aus `scripts/check-ui-normzitate.ts` herausgelöst (Steuerungs-Flächendeckel
// `scripts/check-*.ts`, aufraeumen.md §3 — dieselbe Trennlinie wie
// check-verweis-inventar.ts ↔ verweis-inventar-messung.ts): DORT steht, WAS
// geprüft wird und was gilt; HIER steht, WIE der Quelltext dafür vorbereitet
// wird. Ohne Seiteneffekte beim Import.

// ── Kommentare ausblenden (WURZELFIX 14.9.2026, Gegenprüfungs-Befund D) ─────
//
// ANLASS. Das Tor las den ROHEN Quelltext, also auch Kommentare. Ein Kommentar,
// der ÜBER tote Anker schreibt, muss aber genau die Zitate nennen, die nicht
// auflösen — er wurde damit zwangsläufig rot. In PR #856 hat ein Bau-Agent das
// umgangen, indem er die Beispiele in NormChip.tsx als «StGB 91a» statt «Art.
// 91a StGB» schrieb, die Zitierform also verbog, damit der Parser sie nicht
// findet. Das ist die schlechteste aller Lagen: das Tor ist zufrieden, die
// Wahrheit steht in einer Notation, die im Repo sonst nirgends gilt, und der
// nächste Leser hält sie für einen Tippfehler.
//
// FIX AN DER WURZEL, nicht am Symptom: das Tor heisst «UI-Normzitate» und
// schützt AUSGELIEFERTEN Text — die ~1'100 hart kodierten Zitate, die der
// Nutzer liest. Ein Kommentar wird nicht ausgeliefert; er ist Prosa ÜBER den
// Code, und Prosa über eine aufgehobene Bestimmung muss sie nennen dürfen.
// Kommentare werden darum vor dem Parser ausgeblendet (durch Leerzeichen
// ersetzt, nie gelöscht — die Offsets bleiben, damit Zeilennummern in den
// Befunden stimmen).
//
// WAS DAS KOSTET (§8, offen): ein veraltetes Zitat in einem Kommentar fällt
// nicht mehr auf. Das ist ein Doku-Mangel, kein Nutzer-Fehler, und der Preis
// dafür, dass die Gegenrichtung — Notations-Tricks im ausgelieferten Code —
// nicht mehr belohnt wird. Der Zähler unten weist die übersprungene Menge
// AUSDRÜCKLICH aus, damit die Grenze sichtbar bleibt statt still zu wirken.
//
// Der Automat kennt Zeilen-/Blockkommentare und die drei String-Formen; ein
// `//` INNERHALB eines Strings bleibt darum Code (sonst verschwände der Rest
// der Zeile). Regex-Literale werden nicht eigens verfolgt — sie enthalten kein
// unescaptes `//` (das wäre ein leeres Regex und syntaktisch unmöglich).
export function ohneKommentare(text: string): { code: string; kommentarZeichen: number } {
  const out = text.split('');
  let zustand: 'code' | 'zeile' | 'block' | "'" | '"' | '`' = 'code';
  let kommentarZeichen = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i], n = text[i + 1];
    if (zustand === 'code') {
      if (c === '/' && n === '/') { zustand = 'zeile'; }
      else if (c === '/' && n === '*') { zustand = 'block'; }
      else if (c === "'" || c === '"' || c === '`') { zustand = c; }
      else continue;
      if (zustand === 'zeile' || zustand === 'block') { out[i] = ' '; kommentarZeichen += 1; }
      continue;
    }
    if (zustand === 'zeile') {
      if (c === '\n') { zustand = 'code'; continue; }   // Zeilenumbruch behalten
      out[i] = ' '; kommentarZeichen += 1;
      continue;
    }
    if (zustand === 'block') {
      if (c !== '\n') { out[i] = ' '; kommentarZeichen += 1; }
      if (c === '*' && n === '/') { out[i + 1] = ' '; kommentarZeichen += 1; i += 1; zustand = 'code'; }
      continue;
    }
    // In einem String: Escape überspringen, sonst auf das schliessende Zeichen warten.
    if (c === '\\') { i += 1; continue; }
    if (c === zustand) zustand = 'code';
  }
  return { code: out.join(''), kommentarZeichen };
}

