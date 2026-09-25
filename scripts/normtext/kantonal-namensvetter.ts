// Ausgelagert aus entscheide-mapping.ts (§6.6 check:schlankheit, 25.9.2026) —
// reine Daten + Belegregel; die Wirkung (normKeyImSnapshot, sperrEntfernteNormKeys)
// bleibt in entscheide-mapping.ts. Keine Imports (Zyklus-frei).

/**
 * KANTONALE NAMENSVETTER (QS-KORPUS 25.9.2026, Stichproben-Nachzug eidg./kantonal).
 * Kürzel, die im Bundesrecht UND in kantonalen Erlassen vergeben sind und in
 * KANTONALEN Urteilen den kantonalen Erlass meinen. Anders als ABK_AUSSCHLUSS
 * wirkt die Sperre NUR in Snapshots mit `gerichtstyp === 'kantonal'` — in
 * Bundesgerichts-/eidg. Urteilen lösen EntG/WaG weiter auf (BGE-Bestand: 2× ENTG,
 * 7× WAG, gemessen per jq über register.json 25.9.2026). Folge in kantonalen
 * Urteilen: eine benannte Lücke, wenn ein Kantonsgericht ausnahmsweise das
 * Bundesgesetz zitiert — lieber eine Lücke als eine falsche Bundesrechts-
 * Zuordnung (§1/§8). Aufnahme NUR mit Textbeleg im Korpus + Amtsquelle.
 */
export const KANTONAL_ABK_SPERRE: ReadonlyMap<string, string> = new Map([
  ['ENTG', 'kantonal: «EntG» = kantonales Enteignungsgesetz (z.B. SG sGS 735.1, '
    + 'gesetzessammlung.sg.ch/api/de/texts_of_law/735.1, Abruf 25.9.2026), nicht '
    + 'das eidg. EntG (SR 711). Beleg: kanton/SG/sg_gerichte/B2023_207 «Art. 15-17 '
    + 'EntG SG» trug ENTG.'],
  ['WAG', 'kantonal: «WAG» = Gesetz über Wahlen und Abstimmungen SG (sGS 125.3, '
    + 'gesetzessammlung.sg.ch/api/de/texts_of_law/125.3, Abruf 25.9.2026), nicht '
    + 'das Waldgesetz WaG (SR 921.0). Beleg: kanton/SG/sg_gerichte/B2025_70 «Art. 1 '
    + 'Abs. 1 lit. d Ziff. 2 WAG» (Wahl- und Abstimmungsfreiheit) trug WAG.'],
]);
