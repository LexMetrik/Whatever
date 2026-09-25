<!-- @posten
dach: QS-KORPUS
titel: Konflations-Guard: Falsch-Positiv bei Alt-Zitaten, blind für bandfremde Konflation
anlass: Gegenprüfung PR #1099 (BGE-Band-Nachzug 152), 25.9.2026
-->

25.9.2026: Der Guard im Band-Nachzug (findeFremdeFundstelleImBody, PR #1099) kann bei Zitaten desselben Bandes mit Seitenangabe («BGE 152 I 9 S. 12») falsch-positiv ausschliessen und erkennt eine Konflation mit einem Entscheid aus einem anderen Band nicht. Fix: Mehrfach-Treffer bzw. Kopf-Position verlangen und einen bandunabhängigen Wächter (Regeste-Normen vs. Body) ergänzen.
