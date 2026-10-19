// ─── International: nicht-Fedlex-Erlasse (EU-Recht) als «nur-live-link» ──────
//
// Wichtige internationale Erlasse, die für die Schweiz mittelbar relevant sind,
// aber NICHT in Fedlex (SR 0.*) liegen — darum nicht vom Fedlex-Stub-Generator
// (scripts/normtext/bund-stubs-generieren.ts) erzeugbar. Reine «nur-live-link»-
// Einträge: die Karte verlinkt auf den amtlichen Text (hier EUR-Lex), KEIN
// Volltext-Snapshot, kein Extraktions-Risiko (§7/§8). Massgeblich bleibt stets
// die amtliche Quelle.
//
// Reine Daten (§3). Im ERLASS_REGISTER (register.ts) analog zu BUND_STUBS
// gemerged; rechtsgebiet 'international' hält sie aus der regulären Gesetze-
// Übersicht heraus (nur unter «International» sichtbar).

import type { ErlassRegistereintrag } from './register-typen';

// EU-Verordnung als reiner Live-Link-Eintrag (EUR-Lex CELEX). KEIN Volltext —
// EU-Recht liegt nicht in Fedlex; massgeblich ist die amtliche EUR-Lex-Fassung.
// Alle CELEX-URLs am 25.6.2026 gegen EUR-Lex geprüft (erreichbar).
function euVo(key: string, kuerzel: string, titel: string, celex: string, stand: string, rang: number): ErlassRegistereintrag {
  return {
    key, ebene: 'bund', kuerzel, titel, rechtsgebiet: 'international', sprache: 'de', rang,
    status: 'nur-live-link',
    quelleUrl: `https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:${celex}`,
    stand,
  };
}

export const INTERNATIONAL_EXTERN: ErlassRegistereintrag[] = [
  // Datenschutz / Digital (extraterritoriale Wirkung auf Schweizer Unternehmen).
  euVo('DSGVO', 'DSGVO', 'Verordnung (EU) 2016/679 (Datenschutz-Grundverordnung, DSGVO)', '32016R0679', '2016-04-27', 90),
  euVo('DSA', 'DSA', 'Verordnung (EU) 2022/2065 über einen Binnenmarkt für digitale Dienste (Digital Services Act, DSA)', '32022R2065', '2022-10-19', 91),
  euVo('DMA', 'DMA', 'Verordnung (EU) 2022/1925 über bestreitbare und faire Märkte im digitalen Sektor (Digital Markets Act, DMA)', '32022R1925', '2022-09-14', 92),
  euVo('KI_VO', 'KI-VO', 'Verordnung (EU) 2024/1689 zur Festlegung harmonisierter Vorschriften für künstliche Intelligenz (KI-Verordnung / AI Act)', '32024R1689', '2024-06-13', 93),
  euVo('MICA', 'MiCA', 'Verordnung (EU) 2023/1114 über Märkte für Kryptowerte (MiCA)', '32023R1114', '2023-05-31', 94),
  // Internationales Privatrecht (für grenzüberschreitende Sachverhalte mit EU-Bezug).
  euVo('ROM_I', 'Rom I', 'Verordnung (EG) Nr. 593/2008 über das auf vertragliche Schuldverhältnisse anzuwendende Recht (Rom I)', '32008R0593', '2008-06-17', 95),
  euVo('ROM_II', 'Rom II', 'Verordnung (EG) Nr. 864/2007 über das auf ausservertragliche Schuldverhältnisse anzuwendende Recht (Rom II)', '32007R0864', '2007-07-11', 96),
  euVo('BRUESSEL_IA', 'Brüssel Ia', 'Verordnung (EU) Nr. 1215/2012 über die gerichtliche Zuständigkeit und die Anerkennung und Vollstreckung von Entscheidungen in Zivil- und Handelssachen (Brüssel Ia)', '32012R1215', '2012-12-12', 97),
];

// O-02 (FEHLERBESTAND, §8): bei diesen Einträgen ist `stand` das ERLASSDATUM des
// Rechtsakts (EUR-Lex, Datum der Verordnung), keine Nachführung. Die Anzeige
// sagte trotzdem «Stand», wie bei den Fedlex-Stubs (CISG «Stand 22.05.2026» =
// Nachführung). Zwei Bedeutungen unter einem Wort; die Etiketten trennen sie.
const ERLASSDATUM_KEYS: ReadonlySet<string> = new Set(INTERNATIONAL_EXTERN.map((e) => e.key));

/** Etikett vor dem Datum `BrowseErlass.stand`: «Erlassen» für die EU-Einträge,
 *  deren Datum das Erlassdatum ist; sonst «Stand» (Nachführungs-/Fassungsdatum). */
export function standEtikett(e: { key: string; ebene: string }): 'Stand' | 'Erlassen' {
  return e.ebene === 'bund' && ERLASSDATUM_KEYS.has(e.key) ? 'Erlassen' : 'Stand';
}
