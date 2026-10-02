// ─── Genitiv-Erlassname hinter einem Zitat (W2·17-UI-BEFUNDE ED10/ED13 Nachzug) ─────
// Aus `NormText.tsx` herausgelöst (§6.6, Schwelle 800 Z.). `restMitIntern` und der Plural-/§-Pfad
// fragen damit EINE Weiche (§5). Das Literal steht zeichengleich in der Transkription des
// Verweis-Inventar-Tors (`scripts/verweis-inventar-transkription.ts`, Wächter gegen diese Datei).
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
export const FREMDERLASS_GENITIV = /^(?:\s+(?:Abs(?:atz|ätze|\.)|Buchstaben?|Bst\.|lit\.|Ziff(?:ern?|\.)|Satz|Sätze|Lemma|Halbsatz|und|oder|bis|sowie|ffg?\.|f\.|Anhang|Anlage|Abschn(?:itt|\.)|in\s+Verbindung\s+mit|Art(?:\.|ikeln?)|(?:erst|zweit|dritt|viert|fünft|letzt)(?:e[rsmn]?)?)(?![\p{L}])|\s+[0-9]+[a-z]*(?![0-9a-z])|\s*[,–—‒−-]\s*[0-9]+[a-z]*(?![0-9a-z])|\s*[,–—‒−-](?!\s*[0-9])|\s+(?!(?:in|im|am|an|zu|um|ab|so|es|er|ob|wo|da)(?![a-zäöüß]))[a-z]{1,2}(?![a-zäöüß])|\s+[a-z](?:bis|ter|quater|quinquies|sexies)(?![a-zäöüß])|\s+\([a-z0-9]{1,4}\))*\s+(?:des|der)\s+(?!vorliegende)(?:(?:[\p{L}\p{N}-]+\s+){0,2}(?:[\p{L}\p{N}-]*(?:gesetz(?:es|buch(?:es)?)?|abkommen(?:s)?|übereinkommen(?:s)?|vertrag(?:es|s)?|konvention(?:en)?|reglement(?:s)?|dekret(?:e?s)?|konkordat(?:e?s)?|statut(?:en|s)?|satzung(?:en)?|beschluss(?:es)?|richtlinie(?:n)?|protokoll(?:s|e)?|charta|vereinbarung(?:en)?|kodex)|[\p{L}\p{N}-]+(?:(?<!an|zu|unter|neu|rang|ein)ordnung(?:en)?|verfassung))(?![\p{L}\p{N}-])|(?:bisherigen|früheren|alten)\s+Rechts\b|(?:[\p{L}\p{N}.-]+\s+){1,4}vom\s+\d{1,2}\.\s)/iu;
