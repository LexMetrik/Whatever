import { type ReactNode } from 'react';
import { GruppenKopf } from '../ui/GruppenKopf';

// ─── KontextGruppe · die EINE Gruppen-Hülle des Kontext-Panels ──────────────
//
// Eigene Datei seit dem §6.6-Split vom 9.8.2026: `KontextPanel.tsx` lief mit
// den S7-Ergänzungen (Artikel-Kontext, seit 1.10.2026 gelöscht) über die
// 800-Zeilen-Schwelle von `check:schlankheit`.
// Der Import-Pfad bleibt über einen Re-Export in `KontextPanel.tsx` erhalten.
//
// Exportiert (V1.3): der EntscheidLeser rendert seine beiden Richtungs-Gruppen
// («Zitierte Normen» / «Zitierte Entscheide») mit DERSELBEN Hülle im Panel —
// eine Anatomie, keine zweite Gruppen-Optik (§5).
export function KontextGruppe({ titel, richtung, anzahl, children, hinweis, punkt }: {
  titel: string;
  /** Beziehungstyp als Text (juris/EUR-Lex-Muster): «Wendet an» u. a.; nie Farbe. */
  richtung?: string;
  /** Zähler hinter dem Titel — PFLICHT für Listen-Gruppen (§1.4: «n erfasste …» ist die
   *  Prüfstand-Angabe und macht eine Kürzung sichtbar). */
  anzahl: number;
  children: ReactNode;
  hinweis?: ReactNode;
  /** Farb-Wörterbuch V2·C-3 (§4b-B): Familien-Punkt vor dem Gruppentitel —
   *  'norm' = brass (Erlasse/Verweise), 'entscheid' = slate (Rechtsprechung),
   *  'material' = sage (Botschaften/Vernehmlassungen/Soft-Law, kein Gesetzesrang).
   *  Redundant zum Gruppentitel (`aria-hidden`, Farbe trägt NIE allein, §13/F2);
   *  sitzt auf `--paper`. Ohne Prop kein Punkt (Werkzeuge/Revisionen neutral). */
  punkt?: 'norm' | 'entscheid' | 'material';
}) {
  const punktKlasse = punkt === 'entscheid' ? 'lc-punkt lc-punkt-entscheid'
    : punkt === 'material' ? 'lc-punkt lc-punkt-material'
    : punkt === 'norm' ? 'lc-punkt' : null;
  return (
    // `data-kontext-rolle="liste"`: Anker der Ladefehler-Sonden (`closest`). Die zweite Rolle
    // `wegweiser` (Artikel-Kontext «Zu Art. X», nur Zeilen ohne Zähler) ist am 1.10.2026 mit
    // ihrer Prop gelöscht (W2·27-BUND-FERTIG, P3) — jede Gruppe ist seither eine Listen-Gruppe.
    <div data-kontext-rolle="liste" className="space-y-2">
      {/* B3-2 (R3-β, 31.8.2026): der Kopf lief über `ui/GruppenKopf` in seiner
          DICHTEN Gestalt — dieselbe Anatomie wie die sechs Panel-Köpfe des
          Lesers V3, die hier bis dahin je einzeln nachgezeichnet war. Der
          Familien-Punkt ist die `marke` des Bausteins, das Richtungs-Label
          gehört in den Titel (es ist Teil dessen, was die Gruppe SAGT, und muss
          mit ihm zusammen gesetzt werden). `text-ink-600` entfällt als
          Utility: es ist die Grundfarbe von `.lc-overline` (index.css:1008),
          wertidentisch. */}
      <GruppenKopf
        dicht
        titel={<>{richtung && <span className="text-brass-700">{richtung} · </span>}{titel}</>}
        zahl={anzahl}
        marke={punktKlasse ? <span className={punktKlasse} aria-hidden /> : undefined}
      />
      {children}
      {/* T2 (Design-Qualitäts-Pass 29.8.2026): der Hinweis-Slot trägt keine
          Halbzeile, sondern zwei bis drei ganze Sätze (Prüfstand-Angabe,
          Methoden-Offenlegung §8) — auf der 11-px-Stufe ungedeckelt gemessen
          92.5 ch/Zeile @1440 (`/gesetze/bund/EMRK`, «Zitierte Entscheide»),
          über der WCAG-Decke SC 1.4.8 (80 ch). `max-w-kleintext` (Herleitung am
          Token in `tailwind.config.js`) + eine Stufe hoch auf `text-xs`
          (Zeilenhöhe 1.2 → 1.4). EIN Slot, alle KontextGruppen (§5). */}
      {hinweis && <p className="max-w-kleintext text-xs text-ink-500">{hinweis}</p>}
    </div>
  );
}
