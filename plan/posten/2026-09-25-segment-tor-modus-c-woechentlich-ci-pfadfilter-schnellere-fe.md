<!-- @posten
dach: QS-KORPUS
titel: Segment-Tor: Modus C wöchentlich, CI-Pfadfilter, schnellere Fenster-Hashes
anlass: Session-Notizen 2026-09-25
-->

Drei Nachzüge zum Segment-Tor `check:segmente` (HN-05 PR 1): (1) Modus C wöchentlich im Frische-Arm (`fedlex-frische.yml`) mit eigenem Cache-Abruf — optionaler Teil des Entscheids «Linse 9», nur ohne Wachstum der Steuerfläche; (2) CI-Pfadfilter für den Schritt (Ergebnis hängt nur an `public/normtext/bund/**`, `scripts/normtext/**`, `scripts/fedlex-cache.sh` — verlustfrei laut Gegenprüfung 2); (3) Fenster-Hashes ohne String je Fenster (§15, kein Logikverlust). Messung GP 2 (25.9.2026): Modus B warm 44–47 s / 485 MiB je gate, C 57–59 s / 960 MiB.
