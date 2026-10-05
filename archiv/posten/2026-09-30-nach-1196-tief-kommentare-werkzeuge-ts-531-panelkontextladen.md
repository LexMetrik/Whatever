<!-- @posten
dach: W2·27-BUND-FERTIG
titel: Nach #1196 (tief), Rest: Kommentar werkzeuge.ts:531 (Risikopfad), VerweisKontext ctx kurz null bei Erholt-Bump (Popover flackert), Popover-Erholt nur bei Shard-, nicht Manifest-Ausfall
anlass: Session-Notizen 2026-09-30
-->

Nach #1196 (tief): Rest nach der Teil-Erledigung vom 1.10.2026.

Erledigt 1.10.2026 (Branch chore/w227-kontext-rueckbau):
- Kommentare panelKontextLaden.ts:93-114 und PanelMaterialien.tsx:23 nennen `kontextSoftLawErgebnis` (Namensstand-Absatz, datierte Belege bleiben).
- `KontextPanel variante="seitenleiste"`: toter Zweig gestrichen (kein Produktionsaufrufer; SSR der Lesespalten-Form byte-gleich, 6/6).
- Manifest-Ausfall-Tests reihenfolgeabhängig: Wurzel war der Modul-Cache von `ladeMaterialManifest` (Erfolg blieb stehen); `_leereMaterialManifestCache` im afterEach, Shuffle-Seeds 1–7 grün (vorher 1–5 rot).

Offen:
- Kommentar `src/lib/normtext/werkzeuge.ts:531` («kontextSoftLaw») — RISIKOPFAD (`istRisikoPfad` wahr), darum in diesem Nicht-Risiko-Auftrag nicht angefasst; nur ein Kommentarwort, bei nächster Berührung der Datei mit Gegenprüfung nachziehen (`kontextSoftLawErgebnis`).
- `VerweisKontext` (components/kontext): beim Erholt-Bump (`versuch`) ändert sich der Key, `ctx` ist einen Render lang `null` — das Popover flackert. Behebung ist eine UX-Entscheidung (alter Fehler-Stand bliebe bis zum Ergebnis stehen), nicht klein/sicher genug für den Rückbau-Auftrag.
- Popover-Erholt-Abo wird nur bei `materialienFehler` gesetzt, auch bei reinem Manifest-Ausfall; dort feuert `beiKantenShardErholt` nie (harmlos, nur ein tot angemeldeter Hörer).

Bewertet 1.10.2026 (W2·27-BUND-FERTIG P3, Branch feat/w227-p3-kontext-rueckbau) — NICHT gebaut (Ergänzung, der Stand oben bleibt Beleg). Das Kommentarwort in `werkzeuge.ts:531` gehört Paket P7.
- `VerweisKontext` ctx beim Erholt-/«Erneut laden»-Bump kurz null: Das Popover rendert beim Laden bewusst «nichts» (Dateikopf: Leerzustand = nichts rendern); das Verschwinden bei Wiederholung ist dieselbe Stimme wie beim ersten Laden. Option A so lassen (Empfehlung), Option B alten Stand pro (Erlass, Artikel) bis zum Ergebnis halten — dann zeigt der Knopf zunächst keine Wirkung, nötig wäre ein Ladehinweis. Gestaltungs-, kein Fehlerfall.
- Popover-/Tafel-Erholt-Abo bei reinem Manifest-Ausfall (`useErlaeuterungen`: `ausfall = fertig && stand === null`; Popover: `materialienFehler`): ein tot angemeldeter Hörer, harmlos. Eine Einschränkung auf den Shard-Ausfall (`rest !== null`) würde den Fall «Manifest UND Shard down, Shard erholt sich anderswo» verlieren (dort stösst der Hörer den Manifest-Abruf erneut an) — Verhalten bewusst belassen, Unterscheidung am Ergebnis nicht ablesbar.
