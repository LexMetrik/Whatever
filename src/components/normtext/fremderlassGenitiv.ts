// ─── Genitiv-Erlassname hinter einem Zitat (W2·17-UI-BEFUNDE ED10/ED13 Nachzug) ─────
// Aus `NormText.tsx` herausgelöst (§6.6, Schwelle 800 Z.). `restMitIntern`, der §-Pfad und der
// Plural-Pfad fragen EINE Funktion (§5); das Verweis-Inventar-Tor importiert sie direkt, statt
// sie zu transkribieren.
//
// W2·17-UI-BEFUNDE ED10/ED13 Nachzug (Prüfer-Befund PR #1264, 2.10.2026): ein
// GENITIV-ERLASSNAME hinter Nummer + Passus ist nie ein Selbstverweis. «Artikel 2
// Absatz 1 des Kulturgütertransfergesetzes» (ZGB 728), «Artikel 6 … des
// Nachrichtendienstgesetzes» (ZGB 43a), «Artikel 2 Absatz 1 des
// Gaststaatgesetzes» (DSG 2) wurden als Sprung auf ZGB 2 / ZGB 6 / DSG 2
// gelinkt — plausibel-falsch (§1), und seit der Verweis-Liste zusätzlich als
// Chip in Dossier und Blatt. Wurzel: der des/der-Guard oben prüft den ROHEN
// Rest (V-6: dort steht hinter einem Passus oft gewöhnliche Prosa — «Artikel 5
// Absatz 1 der Quellensteuer unterliegen» ist ein echter Selbstverweis), sah
// also nur «Absatz …». Darum trennt hier nicht das Signal «des/der», sondern
// der NAME: nach des/der folgt (nach höchstens zwei Wörtern, «des Schweizerischen
// Strafgesetzbuches») ein Wort, das auf einen Erlass-Typ endet — -gesetz(es),
// -gesetzbuch, -verordnung (jede -ordnung ausser dem blossen «Ordnung»),
// -übereinkommen, -abkommen, -vertrag, -konvention, -reglement, -dekret,
// -konkordat, -statut, -satzung, -beschluss, -richtlinie, -protokoll, -charta,
// -vereinbarung, -kodex («Visakodex») und -verfassung (nur zusammengesetzt,
// «Bundesverfassung»). Zwei Formen ohne Typ-Wort: das DATIERTE Zitat «des BG vom
// 6. Okt. 2000», «der V vom 5. Sept. 1979» (Name bis zu vier Wörter, dann «vom
// <Tag>.» — ein datierter Erlass ist nie dieser Artikel) und «des bisherigen/
// früheren/alten Rechts» (Vorgänger-Fassung einer Übergangsbestimmung).
//
// Nur Wortendungen, keine Namensliste (§5: eine Liste läge beim nächsten Korpus-
// Nachzug still daneben); die belegten bekannten Erlasse löst die Form-B-
// Positivliste VOR dieser Weiche auf (V-7, N2b-Routing), hier landet nur die
// unbelegte Restklasse — und die wird Text (§1, kein Link besser als ein
// falscher). Ein falsch-positiver Treffer degradiert nur Link → Text. Das
// ausdrückliche Selbst-Signal («des vorliegenden Gesetzes», `SELBST_MARKER`)
// steht davor und schlägt diese Weiche; «vorliegende» ist hier ausgenommen,
// damit auch die Schreibfehler-Form («des vorliegende Gesetzes», 2 Stellen im
// Bestand) ihren Selbst-Link behält.
//
// GATTUNGSWORT OHNE ZUSATZ (Nachzug 2, Prüfer-Befund 2.10.2026): ein blosses «des Übereinkommens»,
// «des Abkommens», «der Verordnung» OHNE Namen, Datum, Kürzel oder Attribut meint in einem
// Staatsvertrag bzw. einer Verordnung den Erlass SELBST (FZA 10, LUGUE annex, ISTANBUL, HZUE,
// HBEWUE, GL-III B/3/2: 19 echte Selbstlinks). In einem Erlass ANDERER Gattung meint es einen
// anderen (IPRG 130 «des Übereinkommens genannten …»). Darum entscheidet die Gattung des
// gelesenen Erlasses (`InternRefs.eigeneGattung`, aus dem Register-Titel, `eigeneGattungAusTitel`):
// bare Gattung = Selbstverweis nur, wenn sie der eigenen entspricht. «Protokoll N» zählt NICHT dazu:
// «Artikel 74 … des Protokolls 3» (LUGUE 78) meint die Artikel des Protokolls, nicht des Übereinkommens. Mit Zusatz («des Abkommens vom …», «der Verordnung (EU) …»,
// «des Übereinkommens über …», «der Verordnung 1 vom …») oder zusammengesetzt («des
// Tabakproduktegesetzes») ist es immer fremd. «des Gesetzes» bleibt unberührt: der Guard
// `GESETZES_GENITIV` hat es nach Messung (KKV art_128, V-7d) als nie-Selbstverweis entschieden.
//
export const FREMDERLASS_GENITIV = /^(?:\s*(?:Abs(?:atz|ätze|\.)|Buchstaben?|Bst\.|lit\.|Ziff(?:ern?|\.)|Satz|Sätze|Lemma|Halbsatz|und|oder|bis|sowie|ffg?\.|f\.|Anhang|Anlage|Abschn(?:itt|\.)|in\s+Verbindung\s+mit|Art(?:\.|ikeln?)|(?:erst|zweit|dritt|viert|fünft|letzt)(?:e[rsmn]?)?)(?![\p{L}])|\s+[0-9]+[a-z]*(?![0-9a-z])|\s*[,–—‒−-]\s*[0-9]+[a-z]*(?![0-9a-z])|\s*[,–—‒−-]\s*[a-z]{1,2}(?:bis|ter|quater|quinquies|sexies)?(?![a-zäöüß])|\s*[,–—‒−-](?!\s*(?:[0-9]|[a-z]{1,2}(?![a-zäöüß])))|\s+(?!(?:in|im|am|an|zu|um|ab|so|es|er|ob|wo|da)(?![a-zäöüß]))[a-z]{1,2}(?![a-zäöüß])|\s+[a-z](?:bis|ter|quater|quinquies|sexies)(?![a-zäöüß])|\s+\([a-z0-9]{1,4}\))*\s+(?:des|der)\s+(?!vorliegende)(?:(?<vor>(?:[\p{L}\p{N}-]+\s+){0,2}[\p{L}\p{N}-]*)(?<typ>gesetz(?:es|buch(?:es)?)?|verordnung(?:en)?|abkommen(?:s)?|übereinkommen(?:s)?|vertrag(?:es|s)?|konvention(?:en)?|reglement(?:s)?|dekret(?:e?s)?|konkordat(?:e?s)?|statut(?:en|s)?|satzung(?:en)?|beschluss(?:es)?|richtlinie(?:n)?|protokoll(?:s|e)?|charta|vereinbarung(?:en)?|kodex)(?![\p{L}\p{N}-])|[\p{L}\p{N}-]+(?:(?<!an|zu|unter|neu|rang|ein)ordnung(?:en)?|verfassung)(?![\p{L}\p{N}-])|(?:BG|BB|BRB|RRB|V|VO)\s+(?:vom|über|betreffend|zum|zur)\b|(?:bisherigen|früheren|alten)\s+Rechts\b|(?:[\p{L}\p{N}.-]+\s+){1,4}vom\s+\d{1,2}\.\s)/iu;
// Was hinter einem blossen Gattungswort als ZUSATZ gilt (dann fremd): Datum, Nummer/Jahr, Klammer, Präposition, Genitiv-Attribut.
const ZUSATZ = /^\s+(?:(?:\d+\s+)?vom\s+\d|\d+\s+(?:zum|zur|über|betreffend)\b|\d+\/\d|[(\[]|(?:über|zum|zur|zu|zwischen|von|betreffend|gegen|für|des|der)\b)/iu;
/** Gattungswort des Titels («Abkommen vom …» → «abkommen», «Zivilstandsverordnung» → «verordnung»).
 *  «Verordnung zum/zur …» (Vollzugsverordnung) zählt NICHT: dort meint «der Verordnung» oft die übergeordnete
 *  Bundesverordnung (AR-816.11: «Art. 34 der Verordnung» — den Artikel gibt es im Erlass nicht). */
export function eigeneGattungAusTitel(titel: string | undefined): string | undefined {
  const [erstes = '', zweites = ''] = (titel ?? '').trim().split(/\s+/);
  const w = erstes.replace(/[(),;]+$/, '').toLowerCase();
  const g = /(?:übereinkommen|abkommen|verordnung|vereinbarung|vertrag|konvention|reglement|konkordat|dekret|satzung|richtlinie|statut)$/.exec(w)?.[0];
  return g === 'verordnung' && /^(?:zum|zur|zu)$/i.test(zweites) ? undefined : g;
}
const istEigen = (typ: string, eigen: string | undefined): boolean => {
  const t = typ.toLowerCase();
  return eigen != null && t.startsWith(eigen);
};
/** Zerlegt `rest`: Treffer der Weiche, bares Gattungswort (ohne Zusatz) oder nicht. */
function pruefe(rest: string): { treffer: boolean; bare: string | null } {
  const m = FREMDERLASS_GENITIV.exec(rest);
  if (!m) return { treffer: false, bare: null };
  const typ = m.groups?.typ;
  if (typ == null || m.groups?.vor || ZUSATZ.test(rest.slice(m.index + m[0].length))) return { treffer: true, bare: null };
  return { treffer: true, bare: typ };
}
/** Blosses Gattungswort OHNE Zusatz im gleichartigen Erlass («des Abkommens» im FZA) — ein ausdrückliches Selbst-Signal wie «dieses Gesetzes». */
export function selbstGattungAmZitat(rest: string, eigeneGattung?: string): boolean {
  const { bare } = pruefe(rest);
  return bare != null && istEigen(bare, eigeneGattung);
}
/** Nennt der Text HINTER dem Zitat (`rest`) einen Genitiv-Erlassnamen, der NICHT der gelesene Erlass ist? */
export function fremderErlassGenitiv(rest: string, eigeneGattung?: string): boolean {
  const { treffer, bare } = pruefe(rest);
  return treffer && !(bare != null && istEigen(bare, eigeneGattung));
}
