# Gliederungs-Perf-Nachmessung 9.8.2026 (DoD-Beleg W2·19, S1–S7)

**Erstellt:** 9.8.2026 — DoD-Posten «Nachmessen gegen die Dossier-Tabelle» aus
W2·19-GLIEDERUNG.
**Status:** ERSTRECHERCHE

**Anlass:** DoD-Posten «Nachmessen gegen die Dossier-Tabelle» aus W2·19-GLIEDERUNG.
**Gemessener Stand:** main `865d48e8a` (S1–S7 live), frischer /tmp-Worktree, `npm ci` +
Build EXIT 0, vite preview, 20 Playwright-Läufe, 0 Konsolenfehler. **Vorher-Werte:**
[Diagnose 8.8.2026](gliederung-perf-diagnose-2026-08-08.md).

**Messvorschrift-Lehre (§17, hier angewandt):** Eine TBT-Zahl ohne KADENZ ist keine Zahl —
dieselbe Seite misst @4× je nach Scroll-Kadenz 232 ms (Burst) oder 10'196 ms (Lese-Kadenz).
Jede Tabelle nennt darum die Kadenz in der Kopfzeile; künftige Messungen vergleichen nur
gleiche Kadenz gegen gleiche Kadenz.

## Kern-Ergebnis (OR, 60×1200 px, BURST-Kadenz 50 ms, kalt je Lauf, Median aus 3)

| Szenario | Frame med vorher→ist | TBT vorher→ist | Transitionen vorher→ist | Einordnung |
|---|---|---|---|---|
| 1×, Maus im Text | 33.3→**16.7 ms** (30→60 fps) | ~0→13 ms | 142'208→**379** (−99.7 %) | Ziel erreicht |
| 4×, Maus im Text | 115→**17.0 ms** | 8'845–9'003→**232 ms** (−97.4 %) | 142'137→**377** | Ziel erreicht |
| 4×, Maus am Rand (Boden) | 17.2→16.7 ms | 283–297→**227 ms** | 0→0 | Boden unterboten |

Tragender Beweis: Text (232 ms) und Rand (227 ms) liegen @4× innerhalb der Streuung — der
Hover-Aufschlag U1 (vorher 8.6 s) ist **verschwunden**, nicht nur reduziert.

## Struktur-Messpunkte

| Messpunkt | vorher | ist | Einordnung |
|---|---|---|---|
| TOC-DOM-Knoten initial | 11'075 dauerhaft | **166** Baum / 707 ganzes `[data-toc]` | −98.5 % |
| dito nach 60 Leseschritten | 11'075 | 575 / 1'116 | −94.8 % |
| Klick-Latenz Zeile @4× OR | 231 ms | **161 ms** Handler / 177 ms bis Frame | verbessert, **offen** |
| dito BGFA (Kontrolle) | 33 ms | 10/12 ms | verbessert |
| Baum-Zeilen nach langem Lesen | monoton 18→140 | **oszilliert 60–73** (kehrt zurück) | Wachstum weg; Dossier-Ziel ~39 nicht erreicht |
| `[data-toc-aktiv]` gleichzeitig | 6 (§8-Falschaussage) | **genau 1** in allen Läufen | erledigt |

## Zwei ehrliche Restposten

1. **Klick-Pfad ist der verbliebene reale Mangel:** 161 ms @4× und das OR/BGFA-Verhältnis
   stieg von 7.0 auf **14.6** — die Grössenabhängigkeit hängt nicht am Mount (F3 hat das DOM
   um 95 % entlastet), sondern am Klickpfad selbst (flushSync/Sprung-Berechnung).
   Lohnendster nächster Perf-Messpunkt.
2. **Lese-Kadenz @4× (400 ms Pausen, Spy kommt je Schritt durch):** TBT ~10.1–10.7 s über
   ein ~32-s-Fenster (≈120 Long Tasks à ~85 ms), Text und Rand GLEICH teuer — der Rest ist
   der Spy-/Auto-Zuklapp-/Baum-Re-Render-Pfad (U3-Rest), NICHT Hover. @1× unmerklich
   (84–445 ms) — betrifft nur sehr langsame Geräte. Die Burst-Kadenz misst diesen Pfad
   strukturell nicht (Spy kommt während der Salve nie durch).

## Grenzen der Messung

Rohskripte der Ursprungsdiagnose existieren nicht mehr — Kadenz/Viewport/Zähl-Definitionen
rekonstruiert (grösste Unsicherheit; Klick-Latenz-Definition eigenständig, Absolutvergleich
zum Vorher darum weich; OR/BGFA intern identisch gemessen und darum hart). Nicht geprüft:
U2 (`:has()`-Anteil), U5 (Sprung-Sätze — misst a33), F5 visuell, 6×-Drossel.
Messbedingungen: kalt je Lauf (eigener Browser-Context), Server/OS-Cache warm, Load 0.95–1.40,
keine Parallel-Last; Drossel-Wirksamkeit selbst verifiziert (Busy-Loop-Faktor 3.8).

**Pflegebedarf:** Bei künftigen Messungen Kadenz aus der Kopfzeile übernehmen. Offene
Produktfrage an David: ist ~39 sichtbare Zeilen überhaupt das richtige Ziel, oder genügt
«wächst nicht mehr monoton» (ist erfüllt)? **Abnahme-Status:** einfach belegt (20 Läufe,
Streuung ausgewiesen); fachliche Abnahme n/a (Perf-Beleg, kein Rechtsinhalt).
