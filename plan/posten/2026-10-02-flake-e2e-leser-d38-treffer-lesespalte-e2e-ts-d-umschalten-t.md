<!-- @posten
dach: QS-CI-MINUTEN
titel: Flake e2e/leser-d38-treffer-lesespalte.e2e.ts (d) «Umschalten Text↔Treffer»: CLS 0.0043 > 0.001; (f) nahe 30-s-Timeout
anlass: Abschluss Session «Gesetzesleser Funktionen inventarisieren» 2.10.2026 (Station E)
-->

(d) li-Elemente 280×37 → 0×0 — die Liste wird beim Umschalten ausgehängt; der Flacker-Wächter wertet «1 flaky» als rot und blockierte #1275 (Run 37030890002, Rerun nötig). (f) läuft mit 27.7 s nahe am 30-s-Timeout (PR #1270). Wurzel-Fix (§17): Liste beim Umschalten nicht aus dem Layout nehmen oder die Messung auf ein eingabe-fernes Fenster schärfen. Verwandt (bestehend): Posten 2026-09-24-flacker-kandidaten-leser-leser-ruecksprung-r5-r7… (A9 CLS, 1/8 rot auf main). Bei mehreren Läufen Streuung messen (§0 Ziff. 3).
