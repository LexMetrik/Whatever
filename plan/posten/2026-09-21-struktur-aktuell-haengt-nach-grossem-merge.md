<!-- @posten
dach: QS-EFFIZIENZ
titel: struktur:aktuell hängt nach grossem Merge — reproduzieren + Wurzel
anlass: Notiz 2026-09-18-qs-monitor-rot-daten-befunde.md Z. 283/313, zweimal unreproduziert offen gelassen
-->

**Symptom (Beleg, Notiz `.claude/notizen/2026-09-18-qs-monitor-rot-daten-befunde.md`):**
- Z. 283: „Nebenfund: `npm run struktur:aktuell` hing im Doku-Worktree > 5 min (nach Merge
  von 238 Dateien), musste gekillt werden (Exit 143) — kein Tor, aber Station-E-Werkzeug;
  Folge-Session: reproduzieren, sonst ROADMAP-Zeile QS-EFFIZIENZ."
- Z. 313 (Übergabe 20.9.2026): „struktur:aktuell-Hänger NICHT reproduziert." — zweiter
  unreproduzierter Abschluss.

**Verifiziert 21.9.2026, nicht selbst reproduziert (kein >5-min-Leerlauf in dieser
Doku-Session, Auftrag ist auf Plan-/Bibliothek-Arbeit begrenzt):**
- `npm run struktur:aktuell` ruft `.claude/hooks/struktur-aktuell.py` direkt auf
  (`package.json` Z. 168, kein Umweg über vite-node).
- Das Skript macht genau ZWEI `git`-Aufrufe (`git()`-Helfer, Z. 35–38), **beide mit
  `timeout=15` Sekunden** und in einem `try`/`except Exception: sys.exit(0)` gekapselt
  (Z. 54–66) — ein einzelner hängender `git log`/`git diff` sollte also nach spätestens
  15 s abbrechen, nicht nach 5 Minuten. Der beobachtete Hänger widerspricht damit dem, was
  der Code-Pfad selbst erwarten liesse — **Wurzel liegt vermutlich NICHT im Timeout-Pfad
  des Skripts selbst.**
- Offene Hypothesen für die nächste Reproduktion (ungeprüft, nur Kandidaten): (a) ein
  `.git/index.lock`/`git gc --auto` nach dem 238-Dateien-Merge, das `git log` intern
  blockiert, bevor der Python-`subprocess.run`-Timeout greifen kann (abhängig von der
  genauen Blockier-Stelle im Git-internen Aufruf); (b) Kosten ausserhalb des gemessenen
  Skripts — Shell-/Python-Interpreter-Start in einem frisch gemergten, sehr grossen
  Worktree; (c) ein anderer, an dieser Stelle nicht identifizierter Aufrufer (SessionStart-
  Kette?) statt des CLI-Laufs.

**Nächster Schritt:** in einem Worktree NACH einem echten grossen Merge (≥100 Dateien)
`time npm run struktur:aktuell` fahren, `py-spy dump`/`strace`/Activity-Monitor während des
Hängers ziehen, um die blockierende Stelle zu identifizieren, bevor ein Fix versucht wird
(§0 Ziff. 2: erst reproduzieren, dann fixen) — kein Tor, aber ein Station-E-Werkzeug, das
im Ernstfall die Session blockiert.
