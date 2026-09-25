<!-- @posten
dach: QS-KORPUS
titel: Extraktor-Fix VZV-Beilage «Beschreibung der Führerausweiskategorien» (normtext-treue-deckblatt)
anlass: Gegenprüfung 3 Segment-Tor 25.9.2026, Befund R3-5
-->

VZV (SR 741.51, Stand 1.1.2026): die Beilage steht in HTML (html-3) und AKN-XML (annex_u1/lvl_u1), fehlt in der Projektion — der Extraktor verwirft unnummerierte annex_uN als Deckblatt, sobald nummerierte Anhänge existieren. `check:vollstaendigkeit` ist blind (derselbe Filter). Fix im Extraktor (Abgrenzung CHEMRRV annex_u1 = echtes Deckblatt), VZV neu extrahieren, Ausnahme `OHNE_PROJEKTION_BEKANNT` in `check-segmente.ts` streichen. Klasse daten, Gegenprüfung. GP-Bericht wie R3-2.
