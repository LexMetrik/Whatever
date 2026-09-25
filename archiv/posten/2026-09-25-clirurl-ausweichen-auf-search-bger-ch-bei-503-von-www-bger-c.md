<!-- @posten
dach: QS-KORPUS
titel: clirUrl: Ausweichen auf search.bger.ch bei 503 von www.bger.ch
anlass: Gegenprüfung PR #1099 (BGE-Band-Nachzug 152), 25.9.2026
-->

25.9.2026: `clirUrl` in scripts/normtext/clir-regeste.ts hat www.bger.ch fest eingebaut, ohne Ausweichen auf den amtlichen Spiegel search.bger.ch. Beleg: www.bger.ch lieferte am 25.9.2026 durchgehend 503 (Wartung), der erste Nachzug-Lauf bekam 0/81 clir-Regesten; search.bger.ch lieferte identische Fassungen (18/18 Bauer, 9/9 Prüfer, PR #1099).

**Erledigt 2026-09-25:** Branch fix/rechtsprechung-quellen-robust, Commit 69be6703d (`clirKandidaten`: search.bger.ch zuerst, www.bger.ch als Ausweichen; Summenzeile `[clir] AUSFALL`). Wurzelbefund: Node-fetch scheitert an www.bger.ch mit UNABLE_TO_VERIFY_LEAF_SIGNATURE (Server liefert kein Zwischenzertifikat) — der «503» vom 25.9. war womöglich teils dieser TLS-Fehler.
