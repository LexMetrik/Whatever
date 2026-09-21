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

## Was der Browser-Pane NICHT messen kann (18.9.2026, W2·5m-LESER-V3)
<!-- @wiedervorlage: 2027-09-18 -->
Im Browser-Pane des Desktop-Clients ist `document.visibilityState` **dauerhaft
`hidden`**, auch bei gefrontetem Tab. Damit laufen dort **keine
`requestAnimationFrame`-Callbacks**. Alles, was an einem rAF-Kranz hängt —
Scroll-Spy, IntersectionObserver-Auswertung, Animationen, Mitscroll-Nudge —
ist im Pane für die Mount-Dauer tot und misst sich als «kaputt», obwohl es
für echte Nutzer läuft (es heilt beim Sichtbarwerden).

**Regel:** Scroll-, Observer- und rAF-Verhalten wird **headless mit Playwright**
gemessen, nie im Browser-Pane; jede solche Messung belegt im Bericht, dass
`document.visibilityState === 'visible'` war. Der Pane bleibt tauglich für
Struktur (Accessibility-Snapshot), Layout, Farbe und Typografie.

**Anlass:** Eine Pane-Messung meldete die Standort-Marke der Gliederung als in
Produktion tot (`[data-toc-aktiv]` = 0 über 28'000 px, auch auf der Live-Seite).
Der echte Defekt lag woanders (verhungerte Entprellung, `inhalt-hooks.tsx`), und
drei der vier daraus abgeleiteten Ursachen-Verdachte waren falsch.

**Zweitens — Stop-and-go ist kein Lesen.** Ein Wächter, der in Schritten mit
Wartezeit scrollt, lässt Trailing-Timer feuern, die beim durchgehenden Lesen nie
feuern: `e2e/leser-gliederung-a33.e2e.ts` (F1 «Highlight folgt») wartet nach
jedem 120-px-Schritt 260 ms und blieb grün, während die Funktion beim echten
Lesen nie ansprang. Wer Scroll-Verhalten prüft, fährt **mindestens eine Strecke
ohne Pause** — sonst misst das Tor die eigene Messpause.

**Drittens — Zustand ist eine Folge, kein Schnappschuss.** Ein Wächter für
Auf/Zu-Zustände, der jeden Prüffall frisch aus `{}` aufbaut, sieht keine
Altlasten, die ein Pfad liegen lässt. Beleg 19.9.2026 (#924):
`gliederung-sichtbarkeit.test.ts` war 12/12 grün, während Tieflink → Auto-Zu →
Zurückscrollen eine reine Artikelliste öffnete (`art@` blieb beim Zuklappen
stehen, 4'580 Fälle), gefunden erst im Code-Zweitblick. Wer Klapp- oder
Markenzustand prüft, spielt **mindestens eine reale Aktionsfolge** mit den echten
Übergangsfunktionen nach (`gliederung-zustandsfolgen.test.ts`) und bindet alle
Schreibstellen an eine Karte (`klappKarte.ts` + Quellsonde).
