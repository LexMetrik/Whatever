<!-- @posten
dach: QS-KORPUS
titel: SG/AG-Adapter: Entscheiddatum falsch, Wurzel-Fix + Bestandskorrektur
anlass: Stichproben-Nachzug 25.9.2026, PR #1117
-->

Das OCL-decision_date ist bei sg_gerichte das Datum des nachfolgenden BGer-Urteils bzw. ein Publikationsdatum (B 2025/70: amtlich Entscheiddatum 25.08.2025, OCL 2026-01-06; B 2024/161: amtlich 06.03.2025, OCL 2025-12-22), bei ag_gerichte verschoben (VBE.2024.460: amtlich «Urteil vom 4. April 2025», OCL 2025-04-24; XBE.2025.3: amtlich 6. Mai 2025, OCL 2025-06-06). SG: 9 von 12 (6 Bestand + 6 damals neu) weichen vom Kopf-Datum im Snapshottext ab, davon Bestand 4/6 (BV 2024/21 ohne Datum im Text; Messung 25.9.2026). AG-Bestand 5/6 falsch (Gegenprüfung #1117, 25.9.2026: HOR.2024.19 +10, XBE.2025.10 +61, SST.2024.213 +5, ZSU.2025.181 −2, ZOR.2024.64 +2 Tage). Wurzel-Fix im Adapter (amtliches Datum aus dem Dokumentkopf bzw. «Entscheiddatum:»), danach deklarierte Korrektur des Bestands (§1/§8). SG/AG wurden deshalb aus dem Nachzug #1117 genommen.

Entscheid David 25.9.2026 (Chat): Variante A — Korrektur der Bestandsdaten aus dem amtlichen Urteilskopf; offen im Bauplan, keine Session angesetzt. Summe heute live falsch 20/24 (GR 6, BE 5, SG 4, AG 5).

Ergänzung 25.9.2026 (OCL-Recherche `ocl-datum-herkunft.md`, Repo-Belege, Abruf 25.9.2026): SG läuft NICHT über den sauberen `sg_publikationen.py`-Scraper, sondern über den Court-Code `sg_gerichte` = die entscheidsuche.ch-Ingestion (`entscheidsuche_ingest.py:111`); plausibel, aber nicht sicher belegt, dass entscheidsuche.ch dort das Datum eines nachgelagerten BGer-Verfahrens einträgt (strukturanalog zu OCL-Issue #90, dort für TI/VD belegt). AG: `decree_date` kommt direkt aus dem JSON-Feld der DecWork/LexWork-API (`ag_gerichte.py:24`), die Ursache des Tage-Musters bleibt UNKLAR (kein Codebeleg gefunden). Bestätigt den Wurzel-Fix-Vorschlag oben: Datum aus dem amtlichen PDF-Kopf lesen statt OCL `decision_date`.
