---
paths:
  - "e2e/**"
  - "src/pages/**"
  - "src/components/**"
---
# Webseiten-Prüfung — eigenes Ansehen/Prüfen der laufenden Webseite
<!-- @wiedervorlage: 2027-02-21 -->

<!-- Anlass: Auftrag David 21.8.2026. Geltung: eigenes Ansehen/Prüfen der
     laufenden Webseite — Browser-Sonden, Screenshots, Sichtprüfungen. Lädt
     pfad-gescoped bei Berührung von e2e/**, src/pages/**, src/components/**
     (wo Sichtprüfungen anfallen). -->

## Webseiten ansehen
<!-- @wiedervorlage: 2027-03-15 -->
- Für Inhalt und Struktur: immer zuerst den Accessibility-Snapshot, nie einen Screenshot.
- Screenshots nur zur visuellen Prüfung von Layout und Rendering.
- Nie fullPage. Stattdessen Viewport-Ausschnitte, bei Bedarf scrollen und mehrere Aufnahmen machen.
- Einzelne Elemente per uid bzw. Locator aufnehmen, nicht die Seite.
- format: png, scale: "device".
