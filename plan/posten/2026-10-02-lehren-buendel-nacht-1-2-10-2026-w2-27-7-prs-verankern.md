<!-- @posten
dach: QS-EFFIZIENZ
titel: Lehren-Bündel Nacht 1./2.10.2026 (W2·27, 7 PRs) verankern
-->

Aus der Session «Bund fertig gross» (1./2.10.2026), nach Formregel Skill lehren (Tor > Dispatch-§0 > Skill > Prosa) zu verankern; Steuerfläche hatte 0,1 KB Luft, darum hier gesammelt statt im Skill:
1. plan:posten aus-notizen ignoriert --dry-run und schreibt Posten-Dateien (Beleg: 4 Dateien angelegt beim Trockenlauf 2.10.2026). Tor/Fix im Werkzeug.
2. Scratchpad (/private/tmp/claude-501/.../scratchpad) war nach Nacht/Neustart leer — Triage, gemeinsame Dispatch-/GP-Aufträge, Spec weg. Steuerdateien für Agenten-Serien nach .claude/notizen/ (persistent) statt Scratchpad (Skill auftrag Ziff. 6 «Spec als Datei-Zeiger»).
3. Korpus-Tests nie per parseInt vergleichen: «1bis» kollabiert zu 1, Test blind (GP #1251 B1). Kandidat für Lint-/Tor-Regel in src/tests normtext-*.
4. curl mit -m/--max-time liefert %{http_code}=200 bei Abbruch mitten im Transfer — Exit-Code immer mitprüfen (GP #1247 F1).
5. Normtext-Läufe in Agenten immer mit --nur=bund/--nur=<KEY>: ein Fixer stempelte 2x alle Kantone neu (verworfen). Dispatch-§0-Satz oder Flag-Pflicht im Generator.
6. Beleg-Skripte gegen Amtsquelle auf Gleichheit, nie Präfix (P7: 281/283 verdeckte 31 verstümmelte Werte) und gegen Fedlex-HTML, nicht gegen den Sidecar.
7. Fedlex-XML ist nicht per se vollständiger als HTML (XML verliert Leerraum aus <b> </b>, HTML Ordinal-Suffixe) — messen (Dossier bibliothek/normtext/randtitel-xml-html-messung-2026-10-01.md).
8. Neue Block-Typen (titel im Artikel) müssen das Fussnoten-Routing (absatzIndex) mitprüfen (P6, BV 197 fn 162).
9. Suchtest-Hook-Timeouts unter Last (load ~30) trafen heute auch prozesskosten-Sweep und ebenenWahl — Liste in Skill landung Ziff. 5 nennt nur drei Dateien.
10. Worktree-Agenten: Hook blockt zusammengesetzte git-Kommandos/Heredocs; blockierter Heredoc schreibt nichts (5 Agenten meldeten es).
11. OAuth-Token lief nachts ab ⇒ Agent bricht mit 401 ab; vor langen Nachtläufen frisch anmelden.
12. Edit-Tool-PreToolUse-Hook-Timeout (3x 2.10.2026) — Ausweg python via Bash.
