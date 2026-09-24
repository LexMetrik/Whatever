// ─── Schnellformen der Startseite: Wahl-Beschriftung zweigeteilt ─────────────
//
// W2·29-WERKBANK-START-UEBERARBEITUNG U2 (24.9.2026). Die Schnellformen stehen
// in einer 20-rem-Spalte (280 px Feldbreite). Ein natives <select> zeigt die
// gewählte Option EINZEILIG; «Unerlaubte Handlung, Personenschaden – 3 / 20
// Jahre (Art. 60 Abs. 1bis OR)» würde dort zu «Unerlaubte Handlung, Pers…»
// gekappt — und welches Regime rechnet, darf nie hinter einer Ellipse stehen
// (§1/§8, dieselbe Regel wie `EinfacheFristForm` bei der Ferien-Wahl).
//
// Darum zerlegt die Schnellform die EINE Beschriftung (§5, aus `…Texte.ts` des
// vollen Rechners) in Name (im <select>) und Detail (umbrechende Zeile unter
// dem Feld). Keine neue Formulierung: beide Teile sind wörtliche Stücke der
// Quelle, zusammen ergeben sie sie wieder. Reine Beschriftung (§3).

/** «Name – Detail» → {name, detail}; ohne Gedankenstrich «Name (Detail)»; sonst nur Name. */
export function teileWahl(label: string): { name: string; detail: string } {
  const strich = label.indexOf(' – ');
  if (strich > 0) return { name: label.slice(0, strich), detail: label.slice(strich + 3) };
  const klammer = label.lastIndexOf(' (');
  if (klammer > 0 && label.endsWith(')')) return { name: label.slice(0, klammer), detail: label.slice(klammer + 2, -1) };
  return { name: label, detail: '' };
}
