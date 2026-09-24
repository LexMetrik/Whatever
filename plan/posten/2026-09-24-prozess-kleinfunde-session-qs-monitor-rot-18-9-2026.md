<!-- @posten
dach: QS-EFFIZIENZ
titel: Prozess-Kleinfunde Session QS-MONITOR-ROT (18.9.2026)
anlass: Fahrplan-Eintrag fahrplaene/FAHRPLAN-EFFIZIENZ-CHECKLISTE.md §1, migriert 24.9.2026 (Bauplan-Konsolidierung M-28, QS-DOKU-DIAET)
-->

- [ ] **Prozess-Kleinfunde Session QS-MONITOR-ROT (18.9.2026)** — (a) `check:suchindex` läuft in keinem
  Workflow und keiner Tor-Kette (§6.7: Tor, das nie läuft) — einhängen oder streichen; (b) `plan:next`
  meldet eine Notizen-/Übergabe-Datei OHNE `- [ ]`-Zeilen als «abgearbeitet, löschen», obwohl sie offen
  ist (Anzeige liest nur Checkboxen) — Übergabe-Vorlage mit Pflicht-Checkbox oder Sonde auf Inhalt;
  (c) das Write-Werkzeug sperrt `<Haupt-Checkout>/.claude/notizen/` aus Worktree-Sessions — Notizen
  gehen nur per Shell-Heredoc; Skill `bauschritt` Station A Ziff. 4 sagt das nicht; (d) Skill `auftrag`
  Ziff. 6 (g) ist ein ~4500-Zeichen-Absatz — als Liste «Kaskade je Korpus-Art» gliedern; (e) Prüfer-
  Hinweis in den `lex-pruefung`-Auftrag: vite-node-Prüfskripte mit relativen Imports müssen im
  Repo-Wurzelverzeichnis liegen (Scratchpad-Skripte brauchen absolute Imports) und werden danach
  gelöscht; (f) Rot-Beweis mit Vorzustand: Backup per `git show <ref>:<pfad>` in den Scratchpad, nie
  Redirect auf eine getrackte Datei (Auto-Modus blockt).

Migriert 24.9.2026 aus `fahrplaene/FAHRPLAN-EFFIZIENZ-CHECKLISTE.md` (§1, vormals Z. 30–40) — dort steht jetzt ein Zeiger hierher (Bauplan-Konsolidierung M-28, QS-DOKU-DIAET).
