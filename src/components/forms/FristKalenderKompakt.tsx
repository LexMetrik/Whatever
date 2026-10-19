import { FristenKalender as FristenKalenderBasis } from '../FristenKalender';
import type { Kanton } from '../../types/legal';
import type { FeiertagsKontext } from '../../data/zpoFeiertage';

// ─── Kompakter Fristen-Kalender zum einfachen Fristenrechner (#7) ───────────
//
// ANGLEICHUNG an den Fristenrechner-Kalender (Auftrag David 24.6.2026): Statt
// einer eigenen Einzelmonats-Darstellung nutzt der einfache Fristenrechner
// DIESELBE Kalender-Komponente wie die Voll-Formulare
// (src/components/FristenKalender, §5/§10 — eine Quelle, dieselbe Almanach-
// Optik: Fristband, runde Marker, Mehrmonats-Raster, Legende). Diese Hülle
// bildet nur die regimeneutrale `FristMarkierung` (vom Formular geliefert) auf
// die Basis-Props ab — REINE Darstellung (§3), keine eigene Rechnung.
//
// UMZUG (W2·23-STARTSEITE-V4 §3 #3, 5.9.2026): die Datei lag als
// `components/start/FristenKalender.tsx` neben dem Startseiten-Schnellrechner.
// Der ist mit V4 zurückgebaut (auf «/» steht nur noch die Fristen-ZEILE, kein
// Tab-Kasten mit Kalender) — der Kalender WANDERT darum zum Voll-Rechner
// `/rechner/tagerechner`, wo derselbe `EinfacheFristForm` schon oben steht,
// statt verwaist liegen zu bleiben. Neuer Ort = neuer Name: er gehört zur
// Formular-Familie, nicht mehr zur Startseite.

/** Vom Formular gelieferte Stichtage (regimeneutral). */
export interface FristMarkierung {
  startISO: string;              // Ereignistag (zählt nicht)
  endeISO: string;               // Fristende (massgebend, regime-korrekt)
  fristbeginnISO?: string;       // erster mitzählender Tag (nur «keine Ferien»)
  verschiebeGruende?: string[];  // Verschiebung (nur «keine Ferien»)
  hinweis?: string;              // z.B. «Stillstand (Art. 145 ZPO) berücksichtigt»
  stillstand?: { vonISO: string; bisISO: string }[]; // Gerichtsferien-/Stillstand-Perioden (ISO, inkl.)
  feiertagsKontext?: FeiertagsKontext; // RV-53: Kontext der rechnenden Engine (Kalender markiert danach)
}

export function FristKalenderKompakt({ markierung, kanton }: {
  markierung: FristMarkierung | null;
  kanton: Kanton;
}) {
  if (!markierung) {
    return (
      <p className="text-body-s text-ink-500 py-6 text-center">
        Datum und Frist oben eingeben – der Kalender markiert dann Ereignis und Fristende.
      </p>
    );
  }
  return (
    <div className="space-y-2.5" aria-live="polite">
      <FristenKalenderBasis
        ereignisISO={markierung.startISO}
        aQuoISO={markierung.fristbeginnISO}
        adQuemISO={markierung.endeISO}
        kanton={kanton}
        stillstandAktiv={(markierung.stillstand?.length ?? 0) > 0}
        stillstandPerioden={markierung.stillstand}
        feiertagsKontext={markierung.feiertagsKontext}
        kompakt
      />
      {markierung.hinweis && <p className="text-xs text-ink-500">{markierung.hinweis}</p>}
      {markierung.verschiebeGruende && markierung.verschiebeGruende.length > 0 && (
        <p className="text-xs text-ink-500">Verschoben: {markierung.verschiebeGruende.join(' · ')}</p>
      )}
    </div>
  );
}
