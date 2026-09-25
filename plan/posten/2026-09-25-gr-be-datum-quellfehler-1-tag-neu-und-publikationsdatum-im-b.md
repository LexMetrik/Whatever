<!-- @posten
dach: QS-KORPUS
titel: GR/BE-Datum: Quellfehler −1 Tag (neu) und Publikationsdatum im Bestand
anlass: Stichproben-Nachzug 25.9.2026, PR #1117 (GR ausgenommen)
-->

Messung 25.9.2026 gegen den PDF-Kopf («Urteil/Entscheid … vom»): GR neu 5/6 korrekt, SBK 26 88 amtlich 21.9.2026, OCL-decision_date 2026-09-20 (−1 Tag, OCL-Rohwert selbst, KEIN Zeitzonenfehler im Adapter — adapter-entscheide.ts übernimmt decision_date als String). GR-BESTAND (abgerufen 2026-06-26) 6/6 falsch, +6 bis +62 Tage (vermutlich Mitteilungs-/Publikationsdatum). BE-BESTAND 5/6 falsch (+23 bis +29 Tage), BE neu 6/6 und ZH 12/12 korrekt. Wurzel-Fix: amtliches Datum aus dem Dokumentkopf gegen OCL abgleichen (Abweichung ⇒ amtlich gewinnt oder Snapshot zurückhalten) + deklarierte Bestandskorrektur GR/BE. GR wurde deshalb aus #1117 genommen.
