import type { ReactNode, RefObject } from 'react';
import { LeserSeitenleiste } from './LeserSeitenleiste';
import { LeserGliederung } from './LeserGliederung';
import { LeserLeisteSheet } from './LeserLeisteSheet';
import { LeserUebersicht } from './LeserUebersicht';
import type { BestimmungsWort } from './erlassAnsicht';
import type { LeserV3Modell } from './leserV3Modell';
import { setzeAlle, alleOffen } from '../klappKarte';

// ═══ DER AUFBAU DER GLIEDERUNGS-LEISTE — Spalte UND Bottom-Sheet ════════════
//
// Ausgelagert aus `LeserRahmenV3.tsx` mit D38 (§6.6). Der Anlass ist die
// 420-Zeilen-Sonde (`src/tests/leser-v3-fundament.test.ts`), der GRUND trägt
// allein: die Leiste steht an ZWEI Orten — als Spur der Lese-Zeile und als
// Bottom-Sheet hinter ☰ — und beide müssen denselben Inhalt zeigen. Solange
// der Aufbau zweimal im Rahmen stand, war «denselben» eine Behauptung; hier ist
// es eine Funktion mit einem Schalter (§5).
//
// §3: reine Anordnung. Nichts wird hier entschieden, was der Rahmen nicht schon
// entschieden hat — OB das Sheet offen ist und WOHIN es portiert, sagt er.
//
// ── D38 (David 7.9.2026) · DIE LEISTE IST WIEDER EINE SACHE ─────────────────
// Bis hierher trug der Aufbau drei Suchzweige: keine Übersicht im Sheet während
// einer Suche (Ä32), «alles auf/zu» nur ohne Suche (Ä32), Überschrift «Treffer»
// statt «Gliederung» (Ä10). Alle drei hatten denselben Anlass — die Trefferliste
// stand am Platz des Baumes. Sie steht dort nicht mehr (`./LeserTrefferSpalte`),
// und damit sind die drei Zweige nicht «vereinfacht», sondern gegenstandslos
// (§17: gestrichen statt bewacht).

/** Die Seitenleiste — `imSheet` steuert allein, ob sie ihre Zone selbst
 *  benennt (Ä10: im Sheet tut es der Sheet-Kopf, sonst stünde «Gliederung»
 *  zweimal übereinander). */
export function leisteAufbau(m: LeserV3Modell, bestimmungsWort: BestimmungsWort, imSheet: boolean): ReactNode {
  return (
    <LeserSeitenleiste
      uebersicht={<LeserUebersicht m={m} bestimmungsWort={bestimmungsWort} />}
      // D28: kein Feld in der Leiste (`./SuchZone`); im Sheet: `sprungFeld` (A2).
      baum={<LeserGliederung m={m} />}
      baumTitel={imSheet ? undefined : 'Gliederung'}
      onAlleAuf={() => m.setTocBaum((o) => setzeAlle(o, m.alleKnotenIds, true))}
      onAlleZu={() => m.setTocBaum((o) => setzeAlle(o, m.alleKnotenIds, false))}
      alleOffen={alleOffen(m.tocBaum, m.alleKnotenIds)}
      onAnfang={m.zumAnfang} />
  );
}

/**
 * Handy/schmales Pane: die GANZE Seitenleiste als Bottom-Sheet hinter ☰
 * (Kap. 4b). Wiederverwendet wird die bestehende Sheet-Anatomie (Dialog-Rolle,
 * Fokusfang, Esc, Portal in die Pane-Overlay-Schicht) — §5, kein zweiter
 * Overlay-Mechanismus. Portal-Vertrag und Pane-Rolle: `./LeserLeisteSheet`.
 */
export function gliederungsSheetAufbau(a: {
  m: LeserV3Modell;
  bestimmungsWort: BestimmungsWort;
  ziel: HTMLElement | null;
  paneRolle: 'primaer' | 'sekundaer';
  sheetRef: RefObject<HTMLDivElement | null>;
  /** A2: DASSELBE Feld zuoberst im Sheet (Fokus-Falle, WCAG 2.4.3) — die
   *  Such-Zone gibt es solange her, es gibt weiterhin genau EINES im DOM. */
  suchFeld: ReactNode;
}): ReactNode {
  return (
    <LeserLeisteSheet ziel={a.ziel} paneRolle={a.paneRolle}
      sheetRef={a.sheetRef} onSchliessen={() => a.m.setTocAuf(false)}
      pfad={a.m.siePfad} aktArtikelLabel={a.m.siePfadArtikel}
      // D38: das Sheet zeigt die GLIEDERUNG, auch während einer Suche — die
      // Treffer liegen über der Lesespalte darunter, nicht hier. «Sie sind
      // hier» gilt darum wieder in jedem Zustand.
      sprungFeld={a.suchFeld} feldZuoberst ortAnzeigen
      titel="Gliederung" baum={leisteAufbau(a.m, a.bestimmungsWort, true)} />
  );
}
