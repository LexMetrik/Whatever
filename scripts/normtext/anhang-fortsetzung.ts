// W2·27-BUND-FERTIG (Nachzug Gegenprüfung #1204, «Beilage» 30.9.2026).
//
// Anhang-<dl>: ein LEERES <dt> + Text-<dd> NACH einem Item ist dessen Fortsetzungszeile
// (VZV-Beilage Kategorie B «… Plätzen ausser dem Führersitz;» + «Fahrzeugkombinationen …»).
// parseDefinitionsListe hängt sie an das Item (wie im Haupttext, VZV art_3) und meldet den
// Text; markeloseNotizen() erfasst dieselbe Zeile als Prosa-Notiz. Damit sie genau EINMAL
// erscheint, wird sie hier aus den Notizen abgezogen (Multimenge je Text). Findet sich ein
// gemeldeter Text nicht unter den Notizen, ist die Disjunktheit gerissen → laut abbrechen
// statt stumm zu doppeln oder zu verlieren (§1).
export function ohneFortsetzungen(notizen: string[], absorbiert: string[]): string[] {
  const rest = [...notizen];
  for (const text of absorbiert) {
    const i = rest.indexOf(text);
    if (i < 0) throw new Error(`Anhang-Fortsetzungszeile nicht unter den Notizen: «${text.slice(0, 80)}»`);
    rest.splice(i, 1);
  }
  return rest;
}
