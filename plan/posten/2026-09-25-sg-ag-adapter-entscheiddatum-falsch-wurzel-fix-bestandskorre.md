<!-- @posten
dach: QS-KORPUS
titel: SG/AG-Adapter: Entscheiddatum falsch, Wurzel-Fix + Bestandskorrektur
anlass: Stichproben-Nachzug 25.9.2026, PR #1117
-->

Das OCL-decision_date ist bei sg_gerichte das Datum des nachfolgenden BGer-Urteils bzw. ein Publikationsdatum (B 2025/70: amtlich Entscheiddatum 25.08.2025, OCL 2026-01-06; B 2024/161: amtlich 06.03.2025, OCL 2025-12-22), bei ag_gerichte verschoben (VBE.2024.460: amtlich «Urteil vom 4. April 2025», OCL 2025-04-24; XBE.2025.3: amtlich 6. Mai 2025, OCL 2025-06-06). SG: 9 von 12 (6 Bestand + 6 damals neu) weichen vom Kopf-Datum im Snapshottext ab, davon Bestand 4/6 (BV 2024/21 ohne Datum im Text; Messung 25.9.2026). AG-Bestand prüfen (PDF-Kopf «Urteil vom …»). Wurzel-Fix im Adapter (amtliches Datum aus dem Dokumentkopf bzw. «Entscheiddatum:»), danach deklarierte Korrektur des Bestands (§1/§8). SG/AG wurden deshalb aus dem Nachzug #1117 genommen.
