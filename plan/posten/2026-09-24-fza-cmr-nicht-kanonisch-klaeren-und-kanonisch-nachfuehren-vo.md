<!-- @posten
dach: QS-KORPUS
titel: fza/cmr NICHT-KANONISCH klären und kanonisch nachführen (vormals QS-CURRENCY-KANON)
anlass: Befund 2.8.2026, Nachtrag 4.9.2026; Fusion 24.9.2026 (QS-DOKU-DIAET)
-->

**Nachtrag 4.9.2026 (Gegenprüfung PR #658):** `check:fedlex-versionen` rot mit geänderter Menge — `dbg` überholt (Pin 2026-01-01, geltend 2026-09-02), `fmg` + `fdv` nicht-kanonisch; FMG-Snapshot nach Re-Pin regenerieren (liegt unter den 43 von #658).
  Bestandsdefekt auf `main`; erst Ursache klären, dann re-pinnen + regenerieren + §7-Verifikation.
  **Nullprobe zuerst** — `fedlex-cache.sh:368` pinnt `fza` bereits auf html-9, der Befund vom 2.8.
  könnte dafür erledigt sein. **Detail:** [FAHRPLAN-FEDLEX-PORTFOLIO.md](fahrplaene/FAHRPLAN-FEDLEX-PORTFOLIO.md) §17.

Aufgegangen 24.9.2026 aus dem Schritt `QS-CURRENCY-KANON` in `QS-KORPUS`; Wortlaut samt `@meta`: ROADMAP-CHRONIK.md, Fusionen 2026-09-24. Risikopfad ⇒ Gegenprüfung.
