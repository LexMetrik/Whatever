<!-- @posten
dach: QS-EFFIZIENZ
titel: Hook-Prosa nennt retro:17, das abgebaut wird
anlass: Session 20.9.2026, Prozess-Messung
-->

Nach dem Entscheid 20.9.2026 (retro:17 wird abgebaut) zeigen drei Hook-Stellen auf ein Werkzeug, das es nicht mehr geben wird: `.claude/hooks/abschluss-wache.py:94` und `.claude/hooks/struktur-rotieren.py:62/72/349`. Hook-Edits blockt der Klassifizierer — den Diff David vorlegen, sobald der retro:17-Rückbau gelandet ist.

**Nachtrag Bug-Check 20.9.2026:** `abschluss-wache.py:94` nennt `selbstopt:erheben` als Konsument von `messwerte/token-spool.jsonl` — das war schon vor dem Rückbau falsch (der Sammler las den lokalen OTel-Export); der Spool ist ein vorbestehendes Artefakt ohne Leser. Im selben Hook-Diff mit erledigen.
