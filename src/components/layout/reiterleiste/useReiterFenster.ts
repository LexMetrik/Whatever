import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { ersterUeberlauf, fensterStart } from './ueberlauf';

// ═══ R13-1/R13-2 · DIE LEISTE MISST SICH SELBST ═════════════════════════════
//
// R13-1 (gemessen 7.9.2026, @390, 8 Reiter, aktiv = letzter): `scrollLeft 785`
// statt der nötigen 843, rechte Kante des aktiven Reiters 312 bei `clientWidth
// 253` — «URG» stand als «U» am Rand. URSACHE: der Scroll-Effekt lief, BEVOR
// der «8 offen»-Knopf den Streifen um ~58 px verschmälerte; seine Deps
// (`[aktivSchluessel, sichtbar.length]`) sehen eine Breitenänderung nicht.
//
// WURZEL-FIX (§17): nicht nachscrollen, sondern die Zahl der nebeneinander
// stehenden Reiter aus der GEMESSENEN Streifenbreite ableiten — und die Messung
// an einen `ResizeObserver` hängen, der genau diese 58 px sieht. Passt alles,
// gibt es nichts mehr zu scrollen; der aktive Reiter ist im Fenster (R13-3),
// also im Bild. Der Scroll-Effekt der Leiste bleibt daneben als Netz für den
// Rest (ein einzelner Reiter, der breiter ist als der ganze Streifen).
//
// WORAUF DIE MESSUNG BAUT (FB, Prüfbefund 7.9.2026): dass der Reiterkasten
// seinen Inhalt TRÄGT. `offsetLeft + offsetWidth` ist die Kante des KASTENS;
// solange ein Reiter nicht unter seinen `min-content` schrumpfen kann, ist das
// zugleich die Kante seines Inhalts. R8 gab der Hülle `min-w-0` und nahm ihr
// genau diese Untergrenze — danach passten @390 alle acht Kästen exakt bis 241
// px, während der Streifen `scrollWidth 256` mass und die Beschriftungen auf
// Breite 0 standen. Der Boden wohnt seither in `.rl-reiter` (index.css) — seit
// W2·18 (13.9.2026) als `min-content`, davor als feste Zahl
// `--app-reiter-min-b`; wer ihn durch `min-w-0` ersetzt, macht diese Rechnung
// nicht falsch, sondern BLIND — sie findet dann nie mehr einen Überlauf.
//
// WARUM GEMESSEN STATT GERECHNET: eine Mindestbreite mal Reiterzahl wäre nur
// dann richtig, wenn jeder Reiter beliebig schrumpfen könnte. Er kann es nicht
// — die Geschäftsnummer wird nie gekürzt (F6, `Reiter.tsx`), ihr Kern steht
// `shrink-0`. Die echte Untergrenze eines Reiters ist also sein `min-content`
// und hängt an seinem Inhalt. Nur das Layout selbst kennt sie.
//
// TERMINIERUNG: `zuViel` merkt die kleinste Zahl, die bei DIESER Breite schon
// übergelaufen ist; gewachsen wird nur darunter. Damit kann das Paar
// «schrumpfen → wieder wachsen → schrumpfen» nicht schwingen. Bei jeder
// Breiten- oder Bestandsänderung wird die Schranke gelöscht und von der vollen
// Zahl neu abgestiegen.

export interface Fenster {
  /** Erster sichtbarer Reiter (Index in der Speicherordnung). */
  start: number;
  /** Wie viele Reiter nebeneinander stehen. */
  anzahl: number;
}

export function useReiterFenster(
  streifenRef: RefObject<HTMLDivElement | null>,
  gesamt: number,
  aktivIdx: number,
): Fenster {
  const [anzahl, setAnzahl] = useState(gesamt);
  const [start, setStart] = useState(0);
  const [, setTakt] = useState(0);
  const zuViel = useRef(Number.POSITIVE_INFINITY);
  const breite = useRef(-1);
  const bestand = useRef(gesamt);
  /** Notbremse: wie oft in DIESER Breiten-/Bestands-Epoche schon nachgezogen
   *  wurde. Der Kreis «Knopf ändert Breite → Breite ändert Zahl» ist mit dem
   *  festen Knopf-Platz (`Reiterleiste.tsx`) gebrochen; diese Zählung ist das
   *  Netz darunter — lieber ein Reiter zu wenig im Bild als ein React-Fehler
   *  #185, der die ganze Leiste kostet (GEMESSEN 7.9.2026 @1024). */
  const laeufe = useRef(0);
  /** Letzte Messung (Zahl der gezeigten Reiter → rechte Kante des letzten).
   *  Ändert sich die Kante bei GLEICHER Zahl, sind nicht wir schuld, sondern
   *  der Inhalt: die Beschriftungen kommen aus lazy geladenen Manifesten nach,
   *  und die Lesestellung (D27) wächst dem Reiter erst beim ersten Spy-Lauf zu.
   *  GEMESSEN 7.9.2026 @390: mit den Platzhalter-Namen («Gesetz öffnen», 130 px)
   *  passte nur EIN Reiter; als die echten Namen kamen (URG 74 px), hätten zwei
   *  gepasst — die Schranke `zuViel` stammte aber noch aus der Messung davor und
   *  verbot das Wachsen für immer. Darum: neue Kante = neue Lage = Schranke weg. */
  const letzte = useRef({ anzahl: -1, kante: -1 });

  useEffect(() => {
    const el = streifenRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => setTakt((n) => n + 1));
    ro.observe(el);
    return () => ro.disconnect();
  }, [streifenRef]);

  // ── MESSEN UND NACHZIEHEN, VOR DEM ZEICHNEN ────────────────────────────────
  // `useLayoutEffect` + `setState` ist hier kein Umweg um einen Effekt, sondern
  // der von React vorgesehene Weg für Werte, die erst das LAYOUT kennt: React
  // rendert die Korrektur synchron nach, bevor der Browser malt — es gibt also
  // keinen Frame mit dem falschen Fenster. Ohne Dep-Liste, weil sich die
  // Reiterbreiten auch ohne Zustandsänderung ändern (die Beschriftungen kommen
  // aus lazy geladenen Manifesten nach); jeder Lauf ohne Befund endet nach der
  // Messung, ohne `setState`.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    const el = streifenRef.current;
    if (!el) return;
    const w = el.clientWidth;
    if (w !== breite.current || bestand.current !== gesamt) {
      breite.current = w;
      bestand.current = gesamt;
      zuViel.current = Number.POSITIVE_INFINITY;
      laeufe.current = 0;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- s. Herleitung oben
      if (anzahl !== gesamt) { setAnzahl(gesamt); return; }
    }
    const kinder = Array.from(el.querySelectorAll<HTMLElement>('[data-reiter-schluessel]'));
    const letzterReiter = kinder[kinder.length - 1];
    const kante = letzterReiter ? Math.round(letzterReiter.offsetLeft + letzterReiter.offsetWidth) : -1;
    if (kinder.length === letzte.current.anzahl && kante !== letzte.current.kante) {
      zuViel.current = Number.POSITIVE_INFINITY;
      laeufe.current = 0;
    }
    letzte.current = { anzahl: kinder.length, kante };
    if (kinder.length > 0 && laeufe.current < 24) {
      const ueber = ersterUeberlauf(kinder.map((k) => k.offsetLeft + k.offsetWidth), w);
      if (ueber >= 0) {
        zuViel.current = Math.min(zuViel.current, kinder.length);
        const neu = Math.max(1, Math.min(ueber, kinder.length - 1));
        if (neu !== anzahl) { laeufe.current += 1; setAnzahl(neu); return; }
      } else if (anzahl < gesamt && anzahl + 1 < zuViel.current) {
        laeufe.current += 1;
        setAnzahl(anzahl + 1);
        return;
      }
    }
    const soll = fensterStart(gesamt, aktivIdx, Math.max(1, Math.min(anzahl, gesamt)), start);
    if (soll !== start) setStart(soll);
  });

  // Der ausgegebene Anfang ist schon in DIESEM Render richtig — der Effekt oben
  // zieht ihn nur für den nächsten nach, wenn sich Länge oder Fensterbreite
  // ändern. Sonst zeigte die Leiste einen Frame lang das alte Fenster.
  const anzahlEff = Math.max(1, Math.min(anzahl, gesamt));
  return { start: fensterStart(gesamt, aktivIdx, anzahlEff, start), anzahl: anzahlEff };
}
