import type { StrukturMap } from '../../lib/normtext/browse';

// ═══ W2·17-UI-BEFUNDE (B7) · EINDEUTIGE BEZEICHNUNG EINES ARTIKELS ═══════════
//
// «Art. 3» allein nennt in OR, ZGB und SchKG zwei Artikel: den Hauptartikel und
// den Artikel der Schlusstitel-/Übergangsgruppe (Token `disp_u<N>_art_3`). Wo ein
// Label OHNE den umgebenden Gliederungs-Pfad steht (der «Weiterlesen»-Chip, das
// Panel-Zitat), muss es auch den Übergangsartikel eindeutig benennen — sonst
// verspricht die Angabe einen anderen Artikel als den gemeinten (§8).
//
// Die Bezeichnung der Gruppe kommt aus derselben amtlichen Gliederung, die der
// Leser sonst zeigt (`struktur[token].gliederung`, Ebene 1; z. B. «Schlusstitel:
// Anwendungs- und Einführungsbestimmungen») — keine zweite Pflegestelle (§5).
// Fehlt das Sidecar (lädt nicht / noch nicht), fällt die Form auf die laufende
// Nummer der Gruppe zurück: nutzertauglich und eindeutig, ohne einen Rohschlüssel
// zu zeigen und ohne der Gruppe einen Namen zu geben, den man nicht kennt (§8).
// Haupttext-Artikel bleiben unverändert (Label = Anzeige-Label des Eintrags).

const UEB_TOKEN = /^disp_u(\d+)_/;

/** Token eines Schlusstitel-/Übergangsartikels (`disp_u<N>_art_…`)? */
export function istUebergangsToken(token: string | null): boolean {
  return token !== null && UEB_TOKEN.test(token);
}

/** Amtliche Gruppen-Bezeichnung aus der Gliederung (Ebene 1), oder `null`. */
function gruppenName(token: string, struktur: StrukturMap | null): string | null {
  return struktur?.[token]?.gliederung.find((g) => g.ebene === 1)?.label ?? null;
}

/** Rückfall ohne Sidecar: «Gruppe 2» — die laufende Nummer, kein Rohschlüssel. */
function gruppenRueckfall(nr: string): string {
  return `nachgestellte Bestimmungen, Gruppe ${nr}`;
}

export function eindeutigeBezeichnung(
  token: string,
  label: string,
  struktur: StrukturMap | null,
): string {
  const m = UEB_TOKEN.exec(token);
  if (!m) return label;
  return `${label} (${gruppenName(token, struktur) ?? gruppenRueckfall(m[1])})`;
}

// ─── W2·17-UI-BEFUNDE · AMTLICHES ZITAT IM PANEL ─────────────────────────────
//
// «Art. 3 ZGB» nennt den Hauptartikel — für den Schlusstitel-Artikel
// `disp_u1_art_3` falsch (§8). Das Panel setzt das Zitat aus Label + Kürzel
// zusammen (`normZitat`); die Übergangs-Variante geht darum über das KÜRZEL:
//
//  · ZGB-Schlusstitel (`disp_u1`): «Art. 3 SchlT ZGB». BELEG der amtlichen
//    Zitierweise (§7): die Fedlex-Texte selbst führen sie — GBV «Art. 33b SchlT
//    ZGB», VZG «Art. 20bis SchlT/ZGB» (`public/normtext/bund/{GBV,VZG}.json`);
//    das Bundesgericht zitiert «Art. N SchlT ZGB» (rund 190 Nennungen in
//    `public/rechtsprechung` und `public/normtext/bund`, gemessen 2.10.2026).
//  · jede andere Gruppe: KEINE amtliche Kurzform. Das OR kennt keine; das
//    Bundesgericht behilft sich je Entscheid selbst («ÜBest OR» nur für die
//    Änderung vom 21.6.2019, dort im Urteil definiert; sonst ausgeschrieben:
//    «Art. 3 der Übergangsbestimmungen der Änderung vom 12. Dezember 2014 OR»).
//    Darum hier die ausgeschriebene Gruppe: «Art. 1 OR (Übergangsbestimmungen
//    zur Änderung vom 16. Dezember 2005)» — nie «Art. 1 OR» allein.
//
// Nur wo das Label MEHRDEUTIG ist (derselbe Anzeige-Wert steht an einem anderen
// Artikel des Erlasses); sonst bleibt das Kürzel, wie es ist.

const ZGB_SCHLUSSTITEL = 'disp_u1';

export function zitatKuerzel(
  token: string | null,
  label: string | null,
  kuerzel: string,
  struktur: StrukturMap | null,
  eintraege: readonly { artikel: string; artikelLabel: string }[],
): string {
  const m = token ? UEB_TOKEN.exec(token) : null;
  if (!token || !label || !m) return kuerzel;
  const mehrdeutig = eintraege.some((e) => e.artikel !== token && e.artikelLabel === label);
  if (!mehrdeutig) return kuerzel;
  if (kuerzel === 'ZGB' && token.startsWith(`${ZGB_SCHLUSSTITEL}_`)) return `SchlT ${kuerzel}`;
  return `${kuerzel} (${gruppenName(token, struktur) ?? gruppenRueckfall(m[1])})`;
}
