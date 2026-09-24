<!-- @posten
dach: QS-KORPUS
titel: fedlex-cache.sh schreibt keine Pin-Marker — ein Direktaufruf färbt jedes lokale Gate rot
anlass: Vorfall 24./25.9.2026 23:53–00:27 (Session «Prüf-Befunde einbauen, dann Gesetzestext-Treue»; gemeldet von Session Rechtslogik W2a)
-->

Ein direkter Aufruf `bash scripts/fedlex-cache.sh` (hier durch den Bau-Agenten des Segment-Tors) lädt alle 231 gepinnten Fedlex-HTMLs nach /tmp, schreibt aber keine `/tmp/<name>.html.pin`-Marker — die setzt nur `sicherstelleCaches` in `scripts/normtext-snapshot.ts` (Schleife «Pin-Marker nachziehen»). Folge: `check:p-klassen` und `check:vollstaendigkeit` sehen einen vollständigen, aber pin-ungültigen Cache und werden in JEDEM lokalen Gate auf diesem Rechner rot (alle Sessions teilen /tmp). Behoben am 25.9.2026 00:27 durch Nachziehen der Marker nach der Snapshot-Regel (frisch geschrieben + Inhaltsprüfung); danach beide Tore mit Cache grün. **Wurzel-Fix:** `fedlex-cache.sh` schreibt nach erfolgreicher Anker-Prüfung je Eintrag selbst `eli|konsolidierung|htmlN` in `/tmp/<name>.html.pin` (Format `pinIdentitaet` aus `scripts/normtext/cache-pin-befund.ts`); ein Teilfehler stempelt nur die tatsächlich geladenen Einträge. Risikopfad (`scripts/fedlex-*`) ⇒ Gegenprüfung. Test: Direktaufruf, danach `check:p-klassen` grün mit Cache.
