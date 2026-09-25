<!-- @posten
dach: QS-KORPUS
titel: Kantonale Namensvetter EntG/WAG: enger Wurzel-Fix (SG, Kantonszusatz/Grossschreibung)
anlass: Gegenprüfung #1117 25.9.2026: breite Sperre zurückgebaut (Revert 05198a7de)
-->

Belege: SG B 2023/207 «Art. 15-17 EntG SG» = Enteignungsgesetz SG (sGS 735.1) trug ENTG; SG B 2025/70 «Art. 1 Abs. 1 lit. d Ziff. 2 WAG» = Gesetz über Wahlen und Abstimmungen SG (sGS 125.3) trug WAG (gesetzessammlung.sg.ch/api/de/texts_of_law/{735.1,125.3}, Abruf 25.9.2026). Die in #1117 gebaute Sperre (alle kantonalen Urteile) war zu breit: extrahiereStatutRefs normalisiert «WaG»/«WAG» und «EntG SG» zu WAG/ENTG, normKeyImSnapshot(WaG, kantonal) lieferte null, das eidg. Waldgesetz fiele in jedem kantonalen Urteil weg, während LFo/LEx weiter auflösen. Enger Fix: nur mit Kantonszusatz («EntG SG») bzw. Grossschreibung «WAG» (Bund: «WaG») und nur für SG-Snapshots, mit Test beider Richtungen. Die beiden SG-Urteile sind nicht im Korpus (SG aus #1117 ausgenommen); wirksam erst mit dem SG-Nachzug.
