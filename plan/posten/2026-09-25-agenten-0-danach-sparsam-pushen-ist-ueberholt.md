<!-- @posten
dach: QS-EFFIZIENZ
titel: Agenten-§0 «Danach SPARSAM pushen» ist überholt
anlass: Session-Notizen 2026-09-25
-->

Die Regel in der §0-Klausel der lex-*-Agenten (Quelle `docs/token-oekonomie/dispatch-template.md:116`, Vorfall 16.8.2026: «jeder Push erzeugt bei Vercel ein Deployment») trägt nicht mehr: `vercel.json` hat `git.deploymentEnabled: false`, und ci.yml läuft nur auf push→main, pull_request und merge_group — ein Push auf einen Feature-Zweig ohne offenen PR kostet weder Deployment noch CI. Heute verhindert die Regel nur Sicherung: am 25.9.2026 verlor ein Bau-Agent rund 30 min Arbeit durch einen Stream-Abbruch (kein Commit, kein Push). Vorschlag: «nach jedem Teilschritt committen und pushen, solange kein PR offen ist», dann `npm run dispatch:agents`. Die Zeile steht direkt neben der §0-Ziff.-6-Ergänzung aus dem RL-Lehren-PR (#1103) — vorher origin/main einziehen.
