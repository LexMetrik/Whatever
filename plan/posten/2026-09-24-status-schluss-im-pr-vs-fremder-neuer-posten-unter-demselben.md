<!-- @posten
dach: QS-EFFIZIENZ
titel: Status-Schluss im PR vs. fremder neuer Posten unter demselben Dach — F17 erst im merge_group
anlass: Lehre 24.9.2026 (#1042 Queue-Rauswurf 13:43, ~15 min)
-->

#1042 setzte W2·30-RL-W0 auf done; #1043 hatte auf main inzwischen einen Posten unter W2·30-RL-W0 angelegt ⇒ check:plan (F17) erst im merge_group rot. Wurzel-Fix-Optionen: check:plan im PR-Lauf gegen aktuellen origin/main mergen, oder plan:posten neu warnt/verweigert, wenn das Dach in einem offenen PR auf done gesetzt wird.

**Zweiter Fall derselben Wurzel (24.9.2026 abends, #1058):** check:steuerflaeche — #1058 und #1061 je für sich unter dem Deckel, zusammen +1.4 KB darüber ⇒ erst im merge_group rot, Rauswurf. Gemeinsame Wurzel: Tore mit GLOBALER Summe (check:plan F17, check:steuerflaeche) prüfen im PR-Lauf nur PR+main, nicht PR+main+Queue-Vordermänner. Wurzel-Fix gilt für beide: diese Tore im PR-Lauf zusätzlich gegen die Köpfe der Queue-Einträge rechnen, oder vor dem Einreihen `gh`-Abfrage der Queue und Warnung.
