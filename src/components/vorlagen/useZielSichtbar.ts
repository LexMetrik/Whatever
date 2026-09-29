import { useEffect, useState } from 'react';

/** Ist das Sprung-ZIEL gerade im Bild? — die eine Stelle, an der die Frage
 *  beantwortet wird (§5/§10).
 *
 *  Bis zum 4.9.2026 stand die Beobachtung nur in `ErgebnisSprung` (ui.tsx); der
 *  zweite schwebende Sprung-Knopf des Hauses («Vorschau ↓» im Vorlagen-Wizard)
 *  hatte gar keine und blieb darum auch dann stehen, wenn sein Ziel längst im
 *  Bild war (LM-084, W2·17-UI-BEFUNDE B10 — gemessen bei 390 px auf
 *  `/vorlagen/nda`: bei identischer Scroll-Tiefe, Ziel y=380, war der Knopf am
 *  Prod-Stand sichtbar und ist es nachher nicht mehr). Statt die Mechanik ein
 *  zweites Mal zu schreiben, ist sie EIN Haken; das Verhalten aus W5
 *  (11.7.2026) bleibt Wort für Wort dasselbe, es gilt nur für beide Bauformen.
 *
 *  Eigene Datei, nicht `ui.tsx`: dort stehen Komponenten, und ein zusätzlicher
 *  Nicht-Komponenten-Export bricht Fast Refresh (eslint
 *  `react-refresh/only-export-components`, Tor `npm run lint`).
 *
 *  W2·31-BILDSCHIRMBREITE-Folgeposten (29.9.2026): Die −45-%-Boden-Marge geht
 *  von einem GESTAPELTEN Ziel aus, das erst nach spürbarem Scrollen brauchbar
 *  im Bild steht. Seit B3 (#1146) steht das Ergebnis auf breiten Rechnern
 *  NEBEN der Eingabe (`.lc-rechner-spalten`, eigene Spalte, deutlich schmaler
 *  als das Fenster) — auf derselben Höhe wie die Eingabe, kein Scrollen nötig.
 *  Gemessen @1920 auf `/rechner/verjaehrung`: Ergebnisplatz-Oberkante 541 px
 *  (Fensterhöhe 900, oberste 55 % = 495 px) — die Marke blieb wegen der 45 px
 *  Differenz sichtbar, obwohl das Ergebnis längst im Bild stand. Ein Ziel gilt
 *  darum als Spalte, wenn es schmaler als 60 % der Fensterbreite ist; dort
 *  genügt eine SINNVOLLE Überschneidung mit dem Fenster («beliebig», Details
 *  unten). Gestapelt (volle Breite) bleibt die bisherige Regel unverändert:
 *  erst die oberen 55 % zählen als «im Bild» («oben»). §3: reine Darstellung
 *  — der Haken weiss nicht, WAS da sichtbar wird, nur WIE es im Bild steht
 *  (Spalte oder Bahn).
 *
 *  Nachbesserung Gegenprüfung PR #1154 (Befund 3, 29.9.2026): «beliebig» zählte
 *  bisher JEDE Überschneidung (`isIntersecting`, ab 1 px) als sichtbar. Bei
 *  niedrigem Fenster steht vom Ergebnisplatz oft nur der oberste Rand im Bild
 *  — faktisch unter dem Falz, die Marke verschwand trotzdem. Gemessen @1920
 *  auf /rechner/verjaehrung (Ergebnisplatz-Höhe 1057 px): 900 px Fenster →
 *  359 px sichtbar (34 %, Marke soll aus bleiben) · 548 px Fenster → 7 px
 *  (0.7 %, Marke soll an bleiben). `MINDEST_SICHTBARKEIT` (20 % der Zielhöhe,
 *  über den nativen `threshold` des IntersectionObserver statt eigener
 *  Pixel-Rechnung) trennt beide Fälle mit deutlichem Abstand.
 *  Nebenbei behoben: die Breitenmessung verglich zuerst Border-Box
 *  (`getBoundingClientRect`, Start- und `resize`-Fall) mit Content-Box
 *  (`ResizeObserver.contentRect`, Grössenänderung des Ziels) — jetzt misst
 *  jeder Zweig `getBoundingClientRect()`. Und: ein `ResizeObserver` auf dem
 *  Ziel feuert nicht, wenn sich nur die FENSTERBREITE ändert, ohne dass sich
 *  die Zielgrösse selbst ändert (z. B. Umschalten Spalte↔Bahn an einer
 *  Container-Schwelle, die das Ziel selbst nicht verschiebt) — ein
 *  `resize`-Listener auf `window` deckt diesen Fall zusätzlich ab. */
const MINDEST_SICHTBARKEIT = 0.2;

export function useZielSichtbar(zielId: string) {
  const [zielSichtbar, setZielSichtbar] = useState(false);
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const el = document.getElementById(zielId);
    if (!el) return;

    const spaltenBreite = () => el.getBoundingClientRect().width < window.innerWidth * 0.6;
    let spalte = spaltenBreite();
    let beliebig = false;
    let oben = false;
    const auswerten = () => setZielSichtbar(spalte ? beliebig : oben);

    // Erkennt den Wechsel Spalte ↔ Bahn (Container-Query-Schwelle, Schriftskala,
    // Fenstergrösse) — reine Breitenmessung, kein Layout-Wissen. Beide Quellen
    // (Ziel wächst/schrumpft selbst, oder nur das Fenster wird schmaler/breiter)
    // messen gleich (`getBoundingClientRect`, Border-Box).
    const neuMessen = () => { spalte = spaltenBreite(); auswerten(); };
    const breiteBeobachter = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(neuMessen);
    breiteBeobachter?.observe(el);
    window.addEventListener('resize', neuMessen);

    // «Beliebig»: ab MINDEST_SICHTBARKEIT der Zielhöhe zählt es als im Bild
    // (Spalten-Fall) — nicht jede Berührung (Herleitung oben).
    const beliebigBeobachter = new IntersectionObserver(([eintrag]) => {
      beliebig = eintrag.intersectionRatio >= MINDEST_SICHTBARKEIT;
      auswerten();
    }, { threshold: [0, MINDEST_SICHTBARKEIT] });
    beliebigBeobachter.observe(el);

    // «Oben»: unverändert die oberen 55 % (−45 % Boden-Marge, Bahn-Fall).
    const obenBeobachter = new IntersectionObserver(
      ([eintrag]) => { oben = eintrag.isIntersecting; auswerten(); },
      { rootMargin: '0px 0px -45% 0px' },
    );
    obenBeobachter.observe(el);

    return () => {
      breiteBeobachter?.disconnect(); beliebigBeobachter.disconnect(); obenBeobachter.disconnect();
      window.removeEventListener('resize', neuMessen);
    };
  }, [zielId]);
  return zielSichtbar;
}
