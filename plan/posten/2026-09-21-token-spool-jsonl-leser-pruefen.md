<!-- @posten
dach: QS-EFFIZIENZ
titel: token-spool.jsonl — Leser/Schreiber nach dem retro:17-Rückbau prüfen
anlass: Rückbau retro:17/Selbstopt (PR #951, 20.9.2026) — Restfrage aus der Notiz offen gelassen
-->

**Frage:** `messwerte/token-spool.jsonl` — hat die Datei nach dem retro:17-Rückbau (PR #951)
überhaupt noch einen Leser?

**Verifiziert 21.9.2026 (repo-weiter Grep, unter 2 Minuten, eindeutig):**
- **Schreiber ist aktiv**, nicht Rest — `.claude/hooks/abschluss-wache.py:114` hängt bei
  JEDEM Session-Ende (`token_ablesen()`, aufgerufen aus `modus_ende()`) eine JSON-Zeile an
  die gitignorierte Datei an (Token-Zähler vom lokalen OTel-Endpunkt `localhost:9464`).
- **Kein Leser gefunden:** `grep -rn "token-spool" --include=*.ts --include=*.py --include=*.yml --include=*.md .`
  (node_modules/archiv ausgeklammert) liefert ausser dem Schreiber selbst nur zwei
  Doku-Erwähnungen (`bibliothek/betrieb/entregulierung-2026-08-07.md:138`, reine Prosa) und
  den bereits offenen Posten unten — kein Skript importiert oder liest die Datei.
- Der Kommentar in `abschluss-wache.py:94` («`selbstopt:erheben` konsumiert sie beim
  nächsten Lauf») war laut Bug-Check vom 20.9.2026 schon VOR dem Rückbau falsch (der
  Sammler las den lokalen OTel-Export direkt, nicht den Spool) — mit dem retro:17-Rückbau
  (`selbstopt:erheben` gelöscht) ist er zusätzlich ein toter Verweis.

**Bereits erfasst, keine doppelte Arbeit:** Dieser exakte Befund steht wortgleich schon im
offenen Posten `plan/posten/2026-09-20-hook-prosa-nennt-retro-17-das-abgebaut-wird.md`
(„Nachtrag Bug-Check 20.9.2026" — dort: „der Spool ist ein vorbestehendes Artefakt ohne
Leser. Im selben Hook-Diff mit erledigen."). Diese Datei hier bestätigt den Befund
unabhängig (21.9.2026) und ergänzt die Schreiber-Bestätigung; der Fix (Schreib-Aufruf
`token_ablesen()` aus `abschluss-wache.py` entfernen ODER die Datei einen echten Zweck
geben) gehört WEITERHIN in den Hook-Diff des anderen Postens, nicht hierher verdoppelt —
Session-Edits an `.claude/hooks/**` sind TABU, der Diff geht an David.
