<!-- @posten
dach: W2·29-WERKBANK-REST
titel: kein-abschnitt: seiteBereit wartet nur auf h1 — Datenseiten (/rechtsprechung, /materialien) evtl. vor dem Laden gemessen; danach doppelte Liste-Dichte im Geometrie-Sweep rückbauen
-->

Befund Bau S0 (25.9.2026): e2e/kein-abschnitt.e2e.ts:66-69 seiteBereit wartet nur auf das h1. Der neue Dichte-Sweep wartet auf die Trefferliste; der alte Geometrie-Sweep misst /rechtsprechung (Default-Dichte Liste) womöglich im Ladezustand. Fix: seiteBereit je Datenseite auf den geladenen Zustand warten lassen, dann /rechtsprechung aus dem Geometrie-Sweep nehmen (Dichte-Sweep deckt es). Zu S3.
