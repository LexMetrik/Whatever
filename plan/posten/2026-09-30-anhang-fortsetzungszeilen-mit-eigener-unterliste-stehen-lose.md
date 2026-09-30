<!-- @posten
dach: W2·27-BUND-FERTIG
titel: Anhang-Fortsetzungszeilen mit eigener Unterliste stehen lose vor der Liste (48 Zeilen, 21 irreführend: AVO Anh. 1 B8, FIDLEV Anh. 1 2.6.3, AVO Anh. 7 9.2)
anlass: 2. Gegenprüfung PR #1204, 1.10.2026 (vorbestehend, ausser Scope des Nachzugs Beilage)
-->

Anhang-Fortsetzungszeilen mit eigener Unterliste stehen lose vor der Liste (48 Zeilen, 21 irreführend: AVO Anh. 1 B8, FIDLEV Anh. 1 2.6.3, AVO Anh. 7 9.2)

Ausgangslage: Der Nachzug «Beilage» (PR #1204) hängt marke-lose Zeilen im
Anhang-Pfad an das vorangehende Item OHNE Unterliste. Zeilen, die selbst
eine Unterliste tragen (extrahiere-fedlex.ts, Bedingung `subDlIdx < 0`),
und Zeilen direkt hinter einem Item MIT Unterliste (`hostOffen`) bleiben
Prosa-Notizen VOR der Liste. Das ist vorbestehendes Verhalten, bewusst
nicht angefasst (mehrdeutiger Bezug).

Messung (2. Gegenprüfung, Stand Kopf e523b1a88): 48 solcher Zeilen, davon
21 irreführend, weil die Notiz der einzige Einleitungssatz über der Liste
ist (AVO Anh. 1 B8-Definition «Sämtliche Sachschäden … durch:» vor B1;
FIDLEV Anh. 1 Ziff. 2.6.3 «Für den Fall, dass …» vor 2.6.1; AVO Anh. 7
Ziff. 9.2 «Schaltjahre …»; FIDLEV Anh. 2 Ziff. 3.5.2 ×2). Eigene
Gegenzählung der Zeilen mit eigener Unterliste und Vorgänger-Item:
AVO annex_1 (3), annex_7 (1) · FAV annex_4 (2) · FIDLEV annex_1 (5),
annex_2 (3), annex_3 (3), annex_4 (7), annex_5 (6), annex_9 (3) · FZA
annex_II (1), annex_III (6) · HZUE annex_u1 (1) · KKV_FINMA annex_2 (2) ·
VTS annex_7 (3) · VVV annex_4 (1) · VZV annex_3 (1) = 48; Definition des
Vorgängers ändert die Zahl um wenige Zeilen.

Soll: Lesereihenfolge der Quelle erhalten (Einleitungssatz steht bei der
Unterliste, nicht als loser Absatz davor). Erfordert eine Zuordnungsregel
für «Zeile mit Unterliste» (eigener Block zwischen Item-Gruppen oder
Eltern-Item-Erweiterung) — Anhang-Darstellung, Golden-Änderung, Risikopfad
mit Gegenprüfung. Der Haupttext hat dieselbe Schwäche (Zeile nach Item mit
Unterliste hängt am letzten Unter-Item, ungemessen).

- Nach-Verdikt #1204 (1.10.2026): FIDLEV Anh. 2 Ziff. 3.5.2 ×2 gehört nicht zu den «21 irreführend», sondern zu den schlichten, schon vorher losen Zeilen. Der M1-Test in `src/tests/normtext-anhang-fortsetzung.test.ts` schreibt das heutige Verhalten (Zeilen mit eigener Unterliste bleiben lose) fest — bei Umsetzung dieses Postens bewusst als Fachänderung ändern.
