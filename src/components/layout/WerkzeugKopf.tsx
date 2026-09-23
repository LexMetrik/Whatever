import type { ReactNode } from 'react';
import { NormChip } from '../vorlagen/NormChip';
import { SeitenTitel } from '../ui/SeitenTitel';

// ─── WerkzeugKopf: der Kopf der Werkzeuge (W2·29-WERKBANK-VORLAGEN V1) ───────
//
// Anatomie wie `RechnerKopf` (Overline · H1 · Einleitung · Norm-Chips), im
// Kleid der Werkbank-Boards «Unter-Vorlage-Wizard» / «Unter-Rechner»: Overline
// und Titel stehen auf einem TITELBLATT-BAND (`.ub-kopf`, dieselbe Anatomie wie
// `SeitenKopf` und das Leser-Titelblatt). `.wk-kopf` legt das Register fest auf
// «Werkzeuge» (`--reg-w`), unabhängig von Route oder Pane — ein Werkzeug trägt
// nie eine geratene Farbe. Das Board färbt das Band voll mit weisser Schrift;
// das Haus erlaubt als Fläche nur `--reg-w-flaeche` mit Tinte (F0.2).
// Heute nutzen ihn die Vorlagen; die Rechner ziehen in W2·29-WERKBANK-RECHNER
// nach. Reine Darstellung (§3).

/** Ein Norm-Chip des Kopfes — dieselben Angaben, die `NormChip` nimmt. */
interface WerkzeugNorm {
  artikel: string;
  /** Fertiger Link (z. B. lokalisiert); sonst leitet `NormChip` ihn ab. */
  href?: string;
  titel?: string;
}

export function WerkzeugKopf({ overline, titel, titelKlasse, etikett, vorspann, intro, normen, children }: {
  /** Einordnung über dem Titel («Arbeit · Vorlage»). */
  overline: string;
  titel: string;
  /** Zusatzklassen am Titel (z. B. Umbruchregeln für lange Komposita). */
  titelKlasse?: string;
  /** Rechts im Band: das Etikett des Werkzeugs (Formvorschrift der Vorlage). */
  etikett?: ReactNode;
  /** Direkt unter dem Band, vor der Einleitung (Rückweg der Vorlagen). */
  vorspann?: ReactNode;
  intro?: ReactNode;
  normen: readonly WerkzeugNorm[];
  /** Zeilen unter den Chips (passender Rechner, Zurücksetzen, Hinweise). */
  children?: ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="ub-kopf wk-kopf flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div className="min-w-0 space-y-1">
          <p className="lc-overline">{overline}</p>
          <SeitenTitel stimme="serif" className={titelKlasse}>{titel}</SeitenTitel>
        </div>
        {etikett}
      </div>
      {vorspann}
      {intro && <p className="font-serif text-body-l text-ink-600 max-w-reading">{intro}</p>}
      {/* lc-chip-zeile (LM-044/N1): Norm-Chips sind <a> und tragen die
          Link-Unterstreichung als Form-Merkmal. */}
      <div className="lc-chip-zeile flex flex-wrap items-center gap-1.5">
        {normen.map((n) => (
          <NormChip key={n.artikel} artikel={n.artikel} hrefOverride={n.href} title={n.titel} />
        ))}
      </div>
      {children}
    </div>
  );
}
