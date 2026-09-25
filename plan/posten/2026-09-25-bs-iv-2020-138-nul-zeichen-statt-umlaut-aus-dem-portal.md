<!-- @posten
dach: QS-KORPUS
titel: BS IV.2020.138: NUL-Zeichen statt Umlaut aus dem Portal
anlass: PR #1112
-->

Befund Gegenprüfung PR #1112 (25.9.2026): Das BS-Portal liefert für IV.2020.138 (nF30_KEY 74697, aktualisiert 2026-08-04) «Beschwerdef\x00.rerin»; der Parser entfernt das NUL-Zeichen, heraus kommt «Beschwerdef.rerin» (Diff gegen den Bestand vom 19.7.2026: Stelle «Beschwerdef…rerin»: ALT «üh», NEU «.»). Quellentreu, aber verschlechtert. Prüfen, ob das Muster \x00 an Umlaut-Stelle deterministisch rekonstruierbar ist (nur bei eindeutigem Muster, §2); sonst die Stelle im UI ehrlich markieren (§8). Weitere Dokumente mit \x00 im Roh-HTML zählen.
