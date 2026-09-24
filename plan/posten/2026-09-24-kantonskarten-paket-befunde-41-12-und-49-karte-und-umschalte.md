<!-- @posten
dach: W2·18-FEHLERBUCH
titel: Kantonskarten-Paket: Befunde 41, 12 und 49 (Karte und Umschalter nach der Wahl, Hover-Rand, Legende)
anlass: Fahrplan-Einträge fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md §4 · fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md §4 · fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md §4, migriert 24.9.2026 (Bauplan-Konsolidierung M-28, QS-DOKU-DIAET)
-->

  - [ ] **Kantonswahl: Karte UND Karte/Liste-Umschalter verschwinden nach der Wahl** — «ZH 3» bricht dabei allein um. **Verifiziert 29.8.2026, bewusst nicht gebaut:** der ganze Detailzustand (Kürzelleiste + der Ort für den Umschalter) liegt in `src/pages/Gesetze.tsx`, `KantonAuswahl.tsx` wird beim Wählen ausgehängt — Datei belegt von PR #565. **Direkt nach #565 anschliessen**, zusammen mit Befund 12. *(Befund 41.)*

### Ebenso im Fahrplan: `fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md` (§4, vormals Z. 228)

  - [ ] **SchweizKarte: aktiver Kanton verliert den Rand beim Hover über Nachbarn** — `gezeigt = hover ?? aktiv`, nur EIN Overlay-Pfad. **Heute folgenlos** (kein Aufrufer übergibt `aktiv`), **scharf sobald Befund 41 gebaut wird**. Notiz am Fundort; Auflösung = zweiter dauerhafter Overlay-Pfad für `aktiv`. Ins **Kantonskarten-Paket F1/F2** mit 41 + 49. *(Befund 12; geprüft 29.8.2026.)*

### Ebenso im Fahrplan: `fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md` (§4, vormals Z. 229)

  - [ ] **Kantonskarte ohne Legende** — Pastellfarben ohne erklärte Bedeutung, Kantonsnamen erst nach Klick sichtbar. *(Cowork-Befund 49, 18.8.2026, unverifiziert — vor Bau reproduzieren.)* **Zusammen mit Befund 12 + 41 im Kantonskarten-Paket bauen** (alle drei sitzen in `SchweizKarte.tsx`/`Gesetze.tsx`; einzeln gebaut kollidieren sie).

**Sichtung 24.9.2026 (Bauplan-Konsolidierung M-28, QS-DOKU-DIAET):** Die drei Einträge verlangen ausdrücklich, zusammen gebaut zu werden (alle in `SchweizKarte.tsx`/`Gesetze.tsx`). Befund 12 (Hover-Rand) ist vermutlich erledigt — `src/components/SchweizKarte.tsx:151-159` führt seit dem Fix 29.8.2026 zwei Ring-Pfade (`markierungen(aktiv, hover)`), und der erledigte Eintrag «Kantonskarte: aktiver Kanton verliert Hervorhebungs-Rand» (✅, `archiv/FAHRPLAN-OFFENE-BEFUNDE-erledigt.md` Nachzug 24.9.2026) nennt ihn «behoben 29.8.2026». Offen bleiben 41 und 49.

Migriert 24.9.2026 aus `fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md` (§4, vormals Z. 226) und `fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md` (§4, vormals Z. 228) und `fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md` (§4, vormals Z. 229) — dort steht jetzt je ein Zeiger hierher (Bauplan-Konsolidierung M-28, QS-DOKU-DIAET).
