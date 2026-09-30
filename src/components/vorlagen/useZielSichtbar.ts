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
 *  `resize`-Listener auf `window` deckt diesen Fall zusätzlich ab.
 *
 *  W2·31-BILDSCHIRMBREITE Bündel I (30.9.2026, Posten «Schwelle 20 % unerreichbar»,
 *  Prüfer #1154): die 20-%-Schwelle ist ein ANTEIL der Zielhöhe. Ist das Ziel
 *  höher als fünf Fensterhöhen, kann der Anteil gar nicht mehr 20 % erreichen
 *  (höchstens fensterH / zielH < 20 %) — die Marke bliebe über einem das ganze
 *  Fenster füllenden Ergebnis stehen. Heute real nicht erreicht (grösster
 *  Ergebnisplatz 1596 px, 0 Fälle). Darum zählt zusätzlich die PIXEL-Bedingung
 *  «die Hälfte der Fensterhöhe sichtbar» (`MINDEST_FENSTERANTEIL`):
 *  sichtbar ⇔ Anteil ≥ 20 % ODER sichtbare Höhe ≥ 50 % der Fensterhöhe.
 *  Für jedes Ziel bis 2.5 Fensterhöhen ist die Pixel-Bedingung durch die
 *  Anteils-Bedingung schon eingeschlossen (50 % Fenster ≥ 20 % Ziel ⇔ Ziel
 *  ≤ 2.5 Fenster) — das heutige Verhalten bleibt dort Bit für Bit.
 *
 *  WARUM DIE SCHWELLENLISTE WANDERT: ein IntersectionObserver ruft NUR beim
 *  Überschreiten einer Schwelle zurück. Mit `[0, 0.2]` fiele für ein hohes Ziel
 *  nach dem Betreten (Schwelle 0) kein weiterer Rückruf mehr, die Pixel-
 *  Bedingung würde nie ausgewertet. Die Schwelle, bei der die sichtbare Höhe
 *  genau 50 % der Fensterhöhe erreicht, ist `0.5 · fensterH / zielH` — sie hängt
 *  von Ziel- und Fensterhöhe ab und wird darum bei jeder Neumessung
 *  (`neuMessen`: Ziel wächst/schrumpft, Fenster ändert sich) in die Liste
 *  aufgenommen; bei einer Änderung baut der Haken den Beobachter neu (der
 *  erste Rückruf des neuen Beobachters wertet den Stand sofort aus). */
const MINDEST_SICHTBARKEIT = 0.2;
const MINDEST_FENSTERANTEIL = 0.5;
const RUNDUNGSTOLERANZ_PX = 0.5;

/** «Steht genug vom Ziel im Bild?» — die reine Entscheidung (Anteil ODER Pixel). */
export function zielGenugImBild(anteil: number, sichtbareHoehe: number, fensterHoehe: number): boolean {
  // Halber Pixel Toleranz nur auf der Pixel-Seite: der Rückruf feuert genau AN der
  // Pixel-Schwelle, und `intersectionRect.height` darf dort um Layout-Rundung
  // (1/64 px) darunter liegen — ohne Toleranz bliebe die Marke an genau diesem
  // Punkt stehen, und es käme kein weiterer Rückruf mehr.
  return anteil >= MINDEST_SICHTBARKEIT
    || sichtbareHoehe >= fensterHoehe * MINDEST_FENSTERANTEIL - RUNDUNGSTOLERANZ_PX;
}

/** Schwellenliste des IntersectionObserver: 0, die 20-%-Schwelle und — nur wo
 *  sie unter 20 % liegt (Ziel > 2.5 Fensterhöhen), sonst ist sie durch die
 *  20-%-Schwelle abgedeckt — die Pixel-Schwelle «50 % Fensterhöhe». */
export function zielSchwellen(zielHoehe: number, fensterHoehe: number): number[] {
  const pixelSchwelle = zielHoehe > 0 ? (fensterHoehe * MINDEST_FENSTERANTEIL) / zielHoehe : 1;
  return pixelSchwelle < MINDEST_SICHTBARKEIT
    ? [0, pixelSchwelle, MINDEST_SICHTBARKEIT]
    : [0, MINDEST_SICHTBARKEIT];
}

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

    // «Beliebig»: ab MINDEST_SICHTBARKEIT der Zielhöhe ODER der halben Fensterhöhe
    // zählt es als im Bild (Spalten-Fall) — nicht jede Berührung (Herleitung
    // oben). Die Schwellenliste hängt von Ziel- und Fensterhöhe ab (Pixel-
    // Schwelle), darum wird der Beobachter bei geänderter Liste neu gebaut.
    const beliebigStand: { beobachter: IntersectionObserver | null; schluessel: string } = { beobachter: null, schluessel: '' };
    const baueBeliebigBeobachter = () => {
      const schwellen = zielSchwellen(el.getBoundingClientRect().height, window.innerHeight);
      const schluessel = schwellen.join('|');
      if (beliebigStand.beobachter && schluessel === beliebigStand.schluessel) return;
      beliebigStand.schluessel = schluessel;
      beliebigStand.beobachter?.disconnect();
      const beobachter = new IntersectionObserver(([eintrag]) => {
        const fensterHoehe = eintrag.rootBounds?.height ?? window.innerHeight;
        beliebig = zielGenugImBild(eintrag.intersectionRatio, eintrag.intersectionRect.height, fensterHoehe);
        auswerten();
      }, { threshold: schwellen });
      beobachter.observe(el);
      beliebigStand.beobachter = beobachter;
    };
    baueBeliebigBeobachter();

    // Erkennt den Wechsel Spalte ↔ Bahn (Container-Query-Schwelle, Schriftskala,
    // Fenstergrösse) — reine Breitenmessung, kein Layout-Wissen. Beide Quellen
    // (Ziel wächst/schrumpft selbst, oder nur das Fenster wird schmaler/breiter)
    // messen gleich (`getBoundingClientRect`, Border-Box). Dieselbe Neumessung
    // führt die Pixel-Schwelle des «Beliebig»-Beobachters nach (Zielhöhe).
    const neuMessen = () => { spalte = spaltenBreite(); baueBeliebigBeobachter(); auswerten(); };
    const breiteBeobachter = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(neuMessen);
    breiteBeobachter?.observe(el);
    window.addEventListener('resize', neuMessen);

    // «Oben»: unverändert die oberen 55 % (−45 % Boden-Marge, Bahn-Fall).
    const obenBeobachter = new IntersectionObserver(
      ([eintrag]) => { oben = eintrag.isIntersecting; auswerten(); },
      { rootMargin: '0px 0px -45% 0px' },
    );
    obenBeobachter.observe(el);

    return () => {
      breiteBeobachter?.disconnect(); beliebigStand.beobachter?.disconnect(); obenBeobachter.disconnect();
      window.removeEventListener('resize', neuMessen);
    };
  }, [zielId]);
  return zielSichtbar;
}
