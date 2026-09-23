import { createPortal } from 'react-dom';
import type { CSSProperties, ReactNode, RefObject } from 'react';
import { LeserSeitenleiste } from './LeserSeitenleiste';
import { LeserGliederung } from './LeserGliederung';
import { LeserUebersicht } from './LeserUebersicht';
import { GliederungSheet } from '../parts/GliederungSheet';
import type { BestimmungsWort } from './erlassAnsicht';
import type { LeserV3Modell } from './leserV3Modell';
import { setzeAlle, alleOffen } from '../klappKarte';

// ═══ DIE GLIEDERUNGS-LEISTE AN IHREN DREI ORTEN — Spalte · Sheet · Schiene ══
//
// Die Leiste steht als Spur der Lese-Zeile, als Bottom-Sheet hinter ☰ und —
// eingeklappt — als Schiene. Spalte und Sheet zeigen DENSELBEN Inhalt; hier ist
// das eine Funktion mit einem Schalter statt einer Behauptung an zwei Stellen
// (§5, D38-Auslagerung aus `LeserRahmenV3.tsx`, 420-Zeilen-Sonde).
// W2·29 S3 (23.9.2026): `LeserLeisteSheet.tsx` und `LeserGliederungSchiene.tsx`
// sind hier aufgegangen — beide waren reine Hüllen ohne eigene Entscheidung.
//
// §3: reine Anordnung. OB das Sheet offen ist, WOHIN es portiert und OB die
// Schiene steht, entscheidet der Rahmen; diese Datei hat keinen Breiten- und
// keinen `imPane`-Zweig (Fundament-Sonde).

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
 * (Kap. 4b), in der bestehenden Sheet-Anatomie (Dialog-Rolle, Fokusfang, Esc —
 * `parts/GliederungSheet`, §5: kein zweiter Overlay-Mechanismus).
 *
 * H2 · DAS SHEET TRÄGT SEINE PANE-ROLLE (Befund 16.8.2026, Split @1440): per
 * Portal landet es AUSSERHALB von `[data-pane]`; bei zwei offenen Sheets waren
 * zwei identische Suchfelder ununterscheidbar. Die Rolle wandert darum als
 * Attribut mit — aus `istSekundaer`, nicht `imPane` (B1-Falle).
 * Ä5: der BEHÄLTER nennt seine Fläche (`--leser-leiste-flaeche`), der klebende
 * Sockel der Leiste liest sie (`.lc-leiste-sockel`) — sonst malte er `paper`
 * auf das `paper-raised`-Blatt (gemessen 17.8.2026 als Tonkante).
 */
export function gliederungsSheetAufbau(a: {
  m: LeserV3Modell;
  bestimmungsWort: BestimmungsWort;
  /** Overlay-Wurzel des Panes; `null` = Einzelansicht (Sheet im Fluss). */
  ziel: HTMLElement | null;
  paneRolle: 'primaer' | 'sekundaer';
  sheetRef: RefObject<HTMLDivElement | null>;
  /** A2: DASSELBE Feld zuoberst im Sheet (Fokus-Falle, WCAG 2.4.3) — die
   *  Such-Zone gibt es solange her, es gibt weiterhin genau EINES im DOM. */
  suchFeld: ReactNode;
}): ReactNode {
  const sheet = (
    <div data-v3-pane={a.paneRolle} style={{ '--leser-leiste-flaeche': 'var(--paper-raised)' } as CSSProperties}>
      {/* D38: das Sheet zeigt die GLIEDERUNG, auch während einer Suche — die
          Treffer liegen über der Lesespalte. «Sie sind hier» gilt in jedem Zustand. */}
      <GliederungSheet sheetRef={a.sheetRef} inPane={a.ziel != null} onSchliessen={() => a.m.setTocAuf(false)}
        pfad={a.m.siePfad} aktArtikelLabel={a.m.siePfadArtikel}
        sprungFeld={a.suchFeld} baum={leisteAufbau(a.m, a.bestimmungsWort, true)} />
    </div>
  );
  return a.ziel ? createPortal(sheet, a.ziel) : sheet;
}

// ─── Die Schiene links, wenn die Gliederung eingeklappt ist ─────────────────
//
// WARUM SIE DA IST (Befund David 16.8.2026, @1440): ohne sie verschwand beim
// Einklappen das Grid, die Lesespalte sprang 175 px nach links und gewann 31 px
// — ein Sprung ohne Gewinn; der Weg zurück lag als unbeschriftetes ☰ an der
// Gegenseite. Die Schiene hält die Spur und steht DORT, wo die Gliederung war.
// Ä79 (H4-II): solange sie steht, ist sie der EINE Griff — der Rahmen lässt den
// Kopf-☰ weg (`schieneSteht`); unter der Schienen-Schwelle bleibt der Kopf-☰
// der einzige Weg. BEWACHT: `e2e/leser-v3-h4-gliederungswege` (c)/(c2).
// SENKRECHTER ECHTER TEXT statt «Gl.»: `writing-mode` dreht Text, er bleibt
// vorlesbar und durchsuchbar (Design-Grundlage Kap. 6).
export function LeserGliederungSchiene({ onAuf }: { onAuf: () => void }) {
  return (
    <div className="sticky self-start" style={{ top: 'var(--nt-stick)' }}>
      <button type="button" data-v3-gliederung-schiene
        onClick={onAuf}
        aria-expanded={false} title="Gliederung einblenden"
        className="lc-leiste-schiene">
        <span aria-hidden className="text-base leading-none">☰</span>
        <span className="[writing-mode:vertical-rl] [text-orientation:mixed]">Gliederung</span>
      </button>
    </div>
  );
}
