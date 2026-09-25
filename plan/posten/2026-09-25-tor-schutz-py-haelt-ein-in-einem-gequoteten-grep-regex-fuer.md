<!-- @posten
dach: QS-EFFIZIENZ
titel: tor-schutz.py hält ein | in einem gequoteten --grep-Regex für eine Pipe
-->

Befund Bau REST S0 (25.9.2026): Playwright --grep "R8 — (D|B)" wurde vom Hook als Pipe geblockt; Umweg --grep "R8 — [DB]". Wurzel-Fix: Hook zerlegt die Kommandozeile mit shlex statt Zeichen-Suche. Hook-Edits blockt der Klassifizierer — fertigen Diff an David geben.
