<!-- @posten
dach: QS-EFFIZIENZ
titel: Geteilter lokaler Fedlex-Cache färbt fremde Worktrees rot (check:p-klassen, check:vollstaendigkeit)
anlass: Mutter/Tochter-Durchlauf 2, beide Töchter, 21.9.2026
-->

Befund: Solange der Zweig chore/fedlex-frische (#953) in einem Worktree lag, zog der GETEILTE lokale Fedlex-Cache den neuen Pin-Marker (hkue |4 statt |2 auf main). In zwei fremden Worktrees, deren Diff keine Normtext-Datei berührte, wurden dadurch check:p-klassen und check:vollstaendigkeit lokal rot (gate 3/55 rot). Beide Tochter-Sessions grenzten es selbst per Nullprobe ab (~5 min je Session); in CI trat es nicht auf. Wurzel-Fix-Kandidaten: Cache-Schlüssel um den Pin-Marker/Worktree erweitern (scripts/fedlex-cache.sh) ODER die zwei Tore melden «Cache-Pin ≠ Repo-Pin — Cache neu ziehen» statt fachlich rot. Risikopfad-Nähe (scripts/fedlex-*): Gegenprüfung nötig.

**Erledigt 2026-09-24:** gebündelt in plan/posten/2026-09-17-check-lizenzen-in-agent-worktrees-ohne-node-modules-immer-ro.md (Bauplan-Konsolidierung M-17, 24.9.2026)
