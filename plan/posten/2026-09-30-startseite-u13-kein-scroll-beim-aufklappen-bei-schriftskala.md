<!-- @posten
dach: W2·31-BILDSCHIRMBREITE
titel: Startseite U13 («kein Scroll beim Aufklappen») bei Schriftskala 1.4 an allen vier Blättern verletzt: @1536×864 Blatt-Unterkante 1112 px (vh 864) Gesetze/Rechtsprechung, Materialien/Werkzeuge Seiten-Scroll 248/32 px; Wächter deckt nur Standard-Schrift (Bündel G #1157, vorbestehend).
anlass: Session-Notizen 2026-09-30
-->

Startseite U13 («kein Scroll beim Aufklappen») bei Schriftskala 1.4 an allen vier Blättern verletzt: @1536×864 Blatt-Unterkante 1112 px (vh 864) Gesetze/Rechtsprechung, Materialien/Werkzeuge Seiten-Scroll 248/32 px; Wächter deckt nur Standard-Schrift (Bündel G #1157, vorbestehend).

**Messung W2·31 J (30.9.2026, Ergänzung, Bündel J, Playwright/vite preview, Skala per localStorage `lexmetrik-schriftskala`=1.4):**
Ursache je Blatt @1536×864, Skala 1.4 ohne Seitenleiste: Feldkopf 305 px (Standard 219) + Blatt 806 px (Standard 576) = Unterkante 1112 px. Das Blatt ist an die Kachel-Mindesthöhe `start-kachel-breit` (17.5 rem = 392 px bei 1.4, 2 × 392 + 22) gebunden, die mit rem mitwächst; die Gesetze-Wahl braucht natürlich selbst 743–767 px (Werkzeuge 630–725, Standard 547/464), Fenster-Reserve = 864 − 305 = 559 px. Gesetze/Rechtsprechung: Unterkante 1112 > vh 864 (gleiche Kachelhöhe). Materialien/Werkzeuge: das «Seiten-Scroll 248/32 px» ist der Scroll der Seite VOR dem Klick (Kachel der zweiten Reihe liegt bei 1.4 unter dem Falz, Playwright/Nutzer scrollt), nicht ein Scroll durch das Aufklappen. U13 bei 1.4 ist erst ab Fensterhöhe ≥ 1112 px gehalten (@1920×1200 gemessen, jetzt im Wächter `e2e/startseite-breite.e2e.ts` (3)); darunter nur durch Inhaltsverlust (Spalten kürzen) oder Umbau (Blatt als fensterhohes Blatt mit Innen-Scroll, deckt die untere Kachelreihe nicht mehr) — Design-Entscheid, nicht gebaut. Eine Senkung der rem-Mindesthöhe reichte nicht (Gesetze-Wahl 743 px > 559 px) und risse U13 im Standard (Reserve dort 29 px).
