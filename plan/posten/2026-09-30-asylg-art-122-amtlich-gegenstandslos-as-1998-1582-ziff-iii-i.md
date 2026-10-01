<!-- @posten
dach: W2·27-BUND-FERTIG
titel: ASYLG Art. 122 amtlich gegenstandslos («AS 1998 1582 Ziff. III … ist dieser Art. gegenstandslos», Fussnote beginnt mit AS-Zitat) ohne gegenstandslos-Flag im Normtext
anlass: Session-Notizen 2026-09-30
-->

#1183-Regel greift nur am Fussnotenanfang (#1209-Bericht).

**ERLEDIGT 2026-10-01** (Zweig `feat/w227-aufhebung-signal-sammel`, W2·27-BUND-FERTIG): neue Funktion `fussnoteDiesenArtGegenstandslos` (Subjekt «dieser Art.», nur am Artikel-Kopf-Marker); AsylG Art. 122 trägt `gegenstandslos` (DB `artikel.aufgehoben=2`), Wortlaut unverändert (Beleg: Fedlex-HTML AsylG 20260612, Fussnote 478 «AS 1998 1582 Ziff. III. … ist dieser Art. gegenstandslos.»). Hinweis: der Artikel hat noch Wortlaut, ist darum KEINE «Leerstelle» und im Leser nicht «kein Text im Snapshot»; der Artikel-Körper bleibt im Leser «lebt» (`artikelLeerstellenStatus` prüft den Wortlaut); das Feld reicht `gliederungsArtikel.ts` an die Index-Zeile durch — ob/wie die Lesesicht ein Artikel-Wort für «gegenstandslos MIT Wortlaut» zeigt, ist UI-Sache und nicht Teil dieses Posten.
