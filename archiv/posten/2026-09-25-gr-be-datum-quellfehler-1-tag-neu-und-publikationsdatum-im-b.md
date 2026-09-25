<!-- @posten
dach: QS-KORPUS
titel: GR/BE-Datum: Quellfehler −1 Tag (neu) und Publikationsdatum im Bestand
anlass: Stichproben-Nachzug 25.9.2026, PR #1117 (GR ausgenommen)
-->

Messung 25.9.2026 gegen den PDF-Kopf («Urteil/Entscheid … vom»): GR neu 5/6 korrekt, SBK 26 88 amtlich 21.9.2026, OCL-decision_date 2026-09-20 (−1 Tag, OCL-Rohwert selbst, KEIN Zeitzonenfehler im Adapter — adapter-entscheide.ts übernimmt decision_date als String). GR-BESTAND (abgerufen 2026-06-26) 6/6 falsch, +6 bis +62 Tage (vermutlich Mitteilungs-/Publikationsdatum). BE-BESTAND 5/6 falsch (+23 bis +29 Tage), BE neu 6/6 und ZH 12/12 korrekt. Wurzel-Fix: amtliches Datum aus dem Dokumentkopf gegen OCL abgleichen (Abweichung ⇒ amtlich gewinnt oder Snapshot zurückhalten) + deklarierte Bestandskorrektur GR/BE. GR wurde deshalb aus #1117 genommen.

Entscheid David 25.9.2026 (Chat): Variante A — Korrektur der Bestandsdaten aus dem amtlichen Urteilskopf; offen im Bauplan, keine Session angesetzt. Summe heute live falsch 20/24 (GR 6, BE 5, SG 4, AG 5).

Ergänzung 25.9.2026 (OCL-Recherche `ocl-datum-herkunft.md`, Repo-Belege, Abruf 25.9.2026): GR+BE laufen über denselben Tribuna-Parser `base_tribuna.py:490-499` — er nimmt das ERSTE datumsförmige Token der Zeile, ohne zu wissen, aus welcher Spalte (Entscheiddatum/Erfasst/Rechtskraft) es stammt; passt zu +6…+62 (GR) bzw. +23…+29 Tagen (BE-Bestand). Bestätigt den Wurzel-Fix-Vorschlag oben: Datum aus dem amtlichen PDF-Kopf lesen statt OCL `decision_date` zu übernehmen.

**Erledigt 2026-09-25:** QS-KORPUS Kopfdatum: Adapter kantonsEntscheiddatum + --kopfdatum-refresh, 22 Bestandsdaten korrigiert (Branch feat/qs-korpus-entscheiddatum-kopf)
