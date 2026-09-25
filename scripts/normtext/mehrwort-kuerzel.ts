// ─── Amtliche Mehrwort-Kürzel im Fliesstext (check:normkeys, Ursache «Leerzeichen») ─
//
// Der Fliesstext-Extraktor (`GESETZ_CODE`, zitat-extraktion.ts) liest ein Kürzel
// nur OHNE Leerzeichen — bewusst, seine Falsch-Positiv-Abstimmung bleibt
// unberührt (entscheide-mapping.ts, `normalisiereAbk`). Ein amtliches Kürzel mit
// Leerzeichen ist dort strukturell unerreichbar; check:normkeys weist es als
// «Leerzeichen» aus. Diese Stelle macht einzelne, BELEGTE Formen erreichbar,
// indem sie sie VOR der Extraktion zusammenzieht («GebV SchKG» → «GebVSchKG»);
// die normalisierte Form ist dieselbe wie die des Alias-Eintrags (GEBVSCHKG),
// die Zuordnung bleibt also bei der Alias-Ebene (§5), nichts wird hier gemappt.
//
// Eng gehalten: nur Formen dieser Liste, nur mit Identitäts-Grenze auf beiden
// Seiten (nie Substring, §7). Jede Form braucht einen Beleg:
//  · «GebV SchKG» — SR 281.35, «Gebührenverordnung vom 23. September 1996 zum
//    Bundesgesetz über Schuldbetreibung und Konkurs (GebV SchKG)», Fedlex
//    https://www.fedlex.admin.ch/eli/cc/1996/2937_2937_2937/de (SPARQL
//    jolux:titleShort «GebV SchKG», in Kraft, Abruf 25.9.2026). Korpus
//    (Wochenlauf-Probelauf #1129): 123 Snapshots nennen «GebV SchKG», der
//    Extraktor kappte jede Nennung zum mehrdeutigen Token GEBV (ZH «GebV OG» ist
//    ein anderer Erlass) — check:normkeys rot, GEBV 22 Snapshots ≥ Schwelle 20.

/** Belegte amtliche Mehrwort-Kürzel, die der Fliesstext-Pfad als EIN Code liest. */
export const MEHRWORT_KUERZEL: readonly string[] = ['GebV SchKG'];

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const MUSTER = MEHRWORT_KUERZEL.map((k) => ({
  re: new RegExp(`(?<![A-Za-z0-9À-ɏ])${k.split(/\s+/).map(esc).join('\\s+')}(?![A-Za-z0-9À-ɏ])`, 'g'),
  ein: k.replace(/\s+/g, ''),
}));

/** Zieht die belegten Mehrwort-Kürzel zusammen («Art. 48 GebV SchKG» → «Art. 48 GebVSchKG»). Rein (§2). */
export function verbindeMehrwortKuerzel(text: string): string {
  let out = text;
  for (const { re, ein } of MUSTER) out = out.replace(re, ein);
  return out;
}
