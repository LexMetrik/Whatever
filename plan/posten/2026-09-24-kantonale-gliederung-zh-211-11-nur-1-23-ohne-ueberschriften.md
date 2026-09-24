<!-- @posten
dach: W2·13-KANTONE-DATEN
titel: Kantonale Gliederung ZH-211.11 nur «§ 1…§ 23» ohne Überschriften
anlass: Fahrplan-Eintrag fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md §4, migriert 24.9.2026 (Bauplan-Konsolidierung M-28, QS-DOKU-DIAET)
-->

  - [ ] **Kantonale Gliederung ZH-211.11 nur «§ 1…§ 23» ohne Überschriften** — **Verdikt (Datenklärung 21.8.2026, lex-recherche): Extraktions-Lücke, keine Quell-Lücke.** `scripts/normtext/struktur-kanton-run.ts` überspringt bewusst Nicht-LexWork-Quellen (PDF/lexfind/zhlex); die Quelle (zhlex GebV OG) HAT eine Buchstaben-Gliederung («A. Allgemein» …). Systematisch: 38 von 1'231 kantonalen Erlassen ohne Struktur-Sidecar (ZH 3/3, JU 7, VD 7, TI 5, GE 4, NE 4, SZ 4, SG 3, AR 1, BS 0). Wurzel-Fix wäre ein PDF-Struktur-Adapter je Quellsystem — Priorisierungsentscheid, kein Quick-Fix. *(Cowork-Befund 42, 18.8.2026, unverifiziert am UI — vor Bau reproduzieren.)*

*Dach abweichend vom verlinkenden Schritt `W2·18-FEHLERBUCH`: Risikopfad (`scripts/normtext/struktur-kanton-run.ts`, `istRisikoPfad()`); W2·18-Regel «Risikopfad-Funde gehören NICHT hierher, sondern in den passenden Risiko-Dach-Schritt». Kantonale Struktur-Extraktion, darum das Kantons-Datendach.*

Migriert 24.9.2026 aus `fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md` (§4, vormals Z. 232) — dort steht jetzt ein Zeiger hierher (Bauplan-Konsolidierung M-28, QS-DOKU-DIAET).
