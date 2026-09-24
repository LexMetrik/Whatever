<!-- @posten
dach: QS-BASIS
titel: W-HN-4 — Pflicht-Prüfung «Browser-Smoke (Ergebnis)» an GitHub Actions binden
anlass: Herz-und-Nieren-Prüfung 24.9.2026, UMSETZUNGSPLAN Abschnitt 8 W-HN-4 (PS-12, bestätigt 24.9.2026 ~23:58)
wartet-auf: david
-->

Handgriff mit Admin-Recht (David): im Branch-Schutz von main den Pflicht-Kontext «Browser-Smoke (Ergebnis)» an die App GitHub Actions (app_id 15368) binden. Heute app_id null — jede schreibberechtigte Stelle könnte den Kontext per Commit-Status als bestanden melden, ohne dass der Browser-Test lief. Die drei übrigen Pflicht-Kontexte sind schon gebunden; der echte Check-Run kommt von github-actions (15368), die Bindung bricht nichts. Empfehlung: binden. Gehört zu HN-14.
