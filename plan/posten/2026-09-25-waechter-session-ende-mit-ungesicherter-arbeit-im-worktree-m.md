<!-- @posten
dach: QS-EFFIZIENZ
titel: Wächter: Session-Ende mit ungesicherter Arbeit im Worktree melden
anlass: Aufräum-Session 25.9.2026 — zwei Verluste bzw. Beinahe-Verluste an einem Abend
-->

Zweimal am 25.9.2026 endete Arbeit ungesichert: (1) App-Neustart ~19:35 — zwei Unteragenten der Session «Rechtsprechung: offene Arbeiten» arbeiteten auftragsgemäss «nur lokal, kein Push» ohne WIP-Commit; ihr Worktree war danach sauber, die Arbeit weg. (2) Die Session «Weiterbau: Wochenlauf #1113» wurde archiviert, während vier neue Posten-Dateien untracked in ihrem Worktree lagen (gerettet per #1134).

Für Unteragenten ist die Lehre seit #1128 verankert (Dispatch-§0: lokal committen nach jedem Teilschritt). Für ganze Sessions fehlt ein Wächter. Kandidat (Formregel Tor > Prosa): Stop-/SessionEnd-Hook meldet untracked oder uncommittete Dateien im eigenen Worktree (ohne ignorierte Dateien) und nennt sie; `aufraeumen:git` meldet Worktrees mit untracked Nicht-ignored-Dateien als «ungesichert» statt «zu prüfen». Grenze: der Hook kann eine Archivierung durch die App nicht verhindern, nur vorher sichtbar machen.

Steuerfläche beachten: Luft 0,0 KB (plan:next 26.9.2026) — ein Hook-Ausbau braucht vorher Rückbau.
