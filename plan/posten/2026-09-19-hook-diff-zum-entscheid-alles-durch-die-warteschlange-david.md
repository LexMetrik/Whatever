<!-- @posten
dach: QS-BASIS
titel: Hook-Diff zum Entscheid alles durch die Warteschlange — Patch freigegeben
anlass: 19.9.2026; Sessions ändern `.claude/hooks/*.py` nicht selbst
-->

**FREIGABE David 22.9.2026 (Chat, Wortlaut «ja zum patch»)** — Marker `wartet-auf: david` entfernt,
**der Posten ist baubar.** Die Freigabe gilt **genau** für
`plan/posten/anhang/2026-09-19-hook-main-push.patch` und für nichts sonst.

  - [ ] **Patch anwenden:** `git apply plan/posten/anhang/2026-09-19-hook-main-push.patch` — streicht den Schalter `LEXMETRIK_MAIN_PUSH=1` in `.claude/hooks/tor-schutz.py` (ca. Z. 205–224, `LEXMETRIK_MAIN_PUSH` steht dort in Z. 213–223); `src/tests/hooks-wache.test.ts:377` erwartet danach Exit 2 statt «erlaubt». Beides widerspricht heute dem Entscheid «alles durch die Warteschlange» (kein Direkt-Push, kein Bypass).
  - [ ] **NICHT freigegeben und weiterhin offen:** der Nebenverdacht `struktur-rotieren.py --hook` kann seinen Commit-Pfad verlieren, seit die Rotation im Doku-PR läuft (`LEXMETRIK_NO_ROTATE=1`, `1ef2797f4`) — **ungemessen**. Erst messen, dann eigener Entscheid.

**Nachtrag 21.9.2026 (Notizen-Triage):** Der Diff liegt bereits fertig vor, byte-gleich
gesichert unter `plan/posten/anhang/2026-09-19-hook-main-push.patch` (verifiziert vor dem
Sichern: `LEXMETRIK_MAIN_PUSH` steht in `tor-schutz.py` Z. 213–223 und
`src/tests/hooks-wache.test.ts:377` noch unverändert — der Patch ist NICHT angewendet).

**Nicht von der Buchungs-Session angewendet** (sie durfte keinen Code und keine Hooks anfassen;
im Auto-Modus blockt der lokale Klassifizierer Hook-Edits ohnehin).
