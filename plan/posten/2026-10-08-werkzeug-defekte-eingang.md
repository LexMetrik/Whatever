<!-- @posten
dach: QS-TORE-DIAET
titel: Werkzeug- und Tor-Defekte aus dem EINGANG (5.–7.10.2026)
anlass: ROADMAP.md über 15 KB und EINGANG über 30 Zeilen (Regel 3), 8.10.2026 — fünf E3/E3·W-Zeilen ohne Go hierher gebündelt statt gestrichen
-->

Wortlaut der fünf EINGANG-Zeilen (Stand ROADMAP 7.10.2026), unverändert:

1. E3·W · 5.10. · Tore/Hooks: tor-schutz.py Quote-Split (Diff 5260e0118), gate-stopp.py, tor-paritaet (GP #1323), Streich-Runde nie fündiger Tore (Freigabe 22.9.) — QS-CPU, QS-TORE-DIAET
2. E3·W · 5.10. · Rückbau nach Umstieg (flaechenZeile, trendZeile, Rotation, ci.yml:70), Worktrees bleiben liegen, 8.10. CI-Sparplan nachmessen; PLAN_BUCHUNG_TOKEN gegenstandslos (David)
3. E3 · 7.10. · check-merge-schutz.ts:43 nutzt git diff mit Rename-Erkennung: Risiko-Datei, auf Nicht-Risiko-Pfad verschoben, fällt aus dem Tor — Wurzel-Fix --no-renames wie kern.ts — scripts/check-merge-schutz.ts
4. E3 · 7.10. · Daten-Cache-Bruch nach Deploy: Inhalts-Hash je public-Datei im Manifest statt Deploy-SHA-Parameter (#1349 verworfen, entwertet MB-Caches) — vercel.json, src/lib/ladeJson.ts
5. E3 · 7.10. · check:fachaenderung liest den PR-Titel aus dem Ereignis (prTitelAusEreignis): «Re-run» nach Titel-Korrektur bleibt rot, kostete einen CI-Zyklus (#1349) — Titel wie den Body live per API holen (holePrKoerperEcht) — scripts/check-fachaenderung.ts

Stand 8.10.2026 zu Ziff. 2: Worktree `nostalgic-pike-a7edae` samt Zweig `claude/nifty-feynman-86ce82` entfernt (gelandet, sauber); `e0-brandschutz` bleibt (A1-FUNDAMENT läuft). `PLAN_BUCHUNG_TOKEN` steht noch in den GitHub-Secrets (gesetzt 14.8.2026, von keinem Workflow gelesen) — Löschen ist Davids Handgriff.

Vorrang: Ziff. 3 ist eine Lücke im Merge-Schutz für Risiko-Pfade — zuerst.
