// ─── Amtlicher Gerichtsname und amtliches Aktenzeichen kantonaler Entscheide (U-16, U-24) ──
//
// OCL führt je Quelle EINEN Court-Code (`gr_gerichte`, `ag_gerichte`, `sg_gerichte`) und
// vierstellige GR-Jahre. Die Quelle selbst nennt aber mehrere Gerichte und schreibt anders:
//
//  · GR — seit dem 1.1.2025 gibt es nur noch das «Obergericht des Kantons Graubünden»
//    (Zusammenführung von Kantons- und Verwaltungsgericht; GOG BR 173.000, Bericht der
//    Kommission für Justiz und Sicherheit: «… das Kantons- und das Verwaltungsgericht –
//    und ab 2025 auch das Obergericht», https://www.gr.ch/DE/Medien/Mitteilungen/MMStaka/
//    2023/DokumenteMM/KJS%20Bericht%20und%20Antrag%20Gesamtstellenumfang%20Obergericht%
//    202025-.pdf, abgerufen 11.10.2026). Alle 18 GR-PDF im Bestand tragen als Kopf
//    «Obergericht des Kantons Graubünden» und als «Referenz» das ZWEISTELLIGE Jahr
//    («SBK 26 88», entscheidsuche.gr.ch, abgerufen 11.10.2026).
//  · AG — der Court-Code umfasst Handels-, Versicherungs- und Obergericht; das Gericht steht im
//    PDF-Kopf der decwork.ag.ch-Entscheide (Messung 11.10.2026 an 10 Entscheiden): HOR →
//    «Handelsgericht», VBE → «Versicherungsgericht», SBE/SST/XBE/ZOR/ZSU → «Obergericht».
//  · SG — der Court-Code umfasst Verwaltungs-, Versicherungsgericht und Verwaltungsrekurs-
//    kommission; belegt auf der «Publikationsplattform St.Galler Gerichte»
//    (publikationen.sg.ch, abgerufen 11.10.2026): «Stelle: Verwaltungsgericht» (B),
//    «Stelle: Versicherungsgericht» (BV, UV), «St.Gallen Verwaltungsrekurskommission» (I/1).
//
// Rein und deterministisch (§2). Unbekannte Präfixe liefern `null` — der Aufrufer behält den
// bisherigen Namen, und das Korpus-Tor (src/tests/entscheid-kantonale-gerichte.test.ts) meldet
// jeden nicht belegten Präfix, statt zu raten (§7).

/** Erstes Entscheiddatum, ab dem es in Graubünden nur noch das Obergericht gibt (GOG, 1.1.2025). */
export const GR_OBERGERICHT_AB = '2025-01-01';

/** Aargau: Aktenzeichen-Präfix (vor dem ersten Punkt) → Gericht. Nur belegte Präfixe. */
export const AG_PRAEFIX_GERICHT: Readonly<Record<string, string>> = {
  HOR: 'Handelsgericht AG',
  VBE: 'Versicherungsgericht AG',
  SBE: 'Obergericht AG',
  SST: 'Obergericht AG',
  XBE: 'Obergericht AG',
  ZOR: 'Obergericht AG',
  ZSU: 'Obergericht AG',
};

/** St. Gallen: Aktenzeichen-Präfix («B», «BV», «UV», «I/») → Stelle. Nur belegte Präfixe. */
export const SG_PRAEFIX_GERICHT: Readonly<Record<string, string>> = {
  B: 'Verwaltungsgericht SG',
  BV: 'Versicherungsgericht SG',
  UV: 'Versicherungsgericht SG',
  'I/': 'Verwaltungsrekurskommission SG',
};

/** Präfix eines AG-Aktenzeichens («HOR.2024.19» → «HOR»), sonst null. */
export function agPraefix(nummer: string): string | null {
  return /^([A-Z]{3})\.\d{4}\.\d+/.exec(nummer.trim())?.[1] ?? null;
}

/** Präfix eines SG-Aktenzeichens («B 2024/58, B 2024/59» → «B»; «I/1-2023/157» → «I/»), sonst null. */
export function sgPraefix(nummer: string): string | null {
  const n = nummer.trim();
  if (/^I\/\d/.test(n)) return 'I/';
  return /^([A-Z]{1,2}) \d{4}\//.exec(n)?.[1] ?? null;
}

/**
 * Amtlicher Gerichtsname (Kurzform «<Gericht> <KT>») eines kantonalen Entscheids oder null,
 * wenn der Court-Code nicht mehrdeutig ist bzw. der Präfix nicht belegt ist.
 * GR hängt am Entscheiddatum: ab 1.1.2025 «Obergericht GR». Davor bestanden Kantonsgericht und
 * Verwaltungsgericht nebeneinander (GOG GR, BR 173.000, in Kraft seit 1.1.2025; Übergangsbestimmung:
 * «Arbeitsverträge zwischen dem Kantonsgericht oder dem Verwaltungsgericht … auf das Obergericht»,
 * https://www.gr-lex.gr.ch/api/de/texts_of_law/173.000, abgerufen 11.10.2026). Ein amtlich belegtes
 * Präfix→Gericht gibt es für die Zeit davor nicht ⇒ null, nicht raten (§7).
 */
export function amtlicherGerichtName(gericht: string, nummer: string, datum: string): string | null {
  switch (gericht) {
    case 'gr_gerichte':
      if (!/^\d{4}-\d{2}-\d{2}$/.test(datum)) return null;
      return datum >= GR_OBERGERICHT_AB ? 'Obergericht GR' : null;
    case 'ag_gerichte': {
      const p = agPraefix(nummer);
      return p ? AG_PRAEFIX_GERICHT[p] ?? null : null;
    }
    case 'sg_gerichte': {
      const p = sgPraefix(nummer);
      return p ? SG_PRAEFIX_GERICHT[p] ?? null : null;
    }
    default:
      return null;
  }
}

/**
 * Amtliche Schreibweise des Aktenzeichens. GR schreibt das Jahr zweistellig («Referenz SBK 26 88»),
 * OCL vierstellig («SBK 2026 88»). Andere Gerichte und bereits amtliche Formen bleiben unverändert.
 */
export function amtlichesAktenzeichen(gericht: string, nummer: string): string {
  if (gericht !== 'gr_gerichte') return nummer;
  return nummer.replace(/^([A-Z]+\d?) (?:19|20)(\d{2}) (\d+)$/, '$1 $2 $3');
}

/** Die OCL-Form (GR: vierstelliges Jahr) zum amtlichen Aktenzeichen — für Quell-Abgleich und Suche. */
export function oclAktenzeichen(gericht: string, nummer: string): string {
  if (gericht !== 'gr_gerichte') return nummer;
  return nummer.replace(/^([A-Z]+\d?) (\d{2}) (\d+)$/, '$1 20$2 $3');
}

/**
 * Neue Anzeige-Zitierung nach einer Namens-/Aktenzeichen-Korrektur: ersetzt das Präfix
 * «<alter Name> <alte Nummer>» durch «<neuer Name> <neue Nummer>», alles Weitere («vom TT.MM.JJJJ»)
 * bleibt. Passt das Präfix nicht, kommt die Zitierung unverändert zurück (nie raten).
 */
export function zitierungNachKorrektur(
  zitierung: string, alt: { name: string; nummer: string }, neu: { name: string; nummer: string },
): string {
  const altPraefix = `${alt.name} ${alt.nummer}`;
  return zitierung.startsWith(altPraefix) ? `${neu.name} ${neu.nummer}${zitierung.slice(altPraefix.length)}` : zitierung;
}
