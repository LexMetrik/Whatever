import { VERTRAUENS_SATZ, STATUS_SATZ } from '../../lib/seo';
import { usePaneKlasse } from '../layout/PaneKontext';

// ─── Schluss-Zeile der Startseite (W2·24-R3, vormals Vertrauens-Fuss) ───────
//
// Bündelt die Vertrauens-Aussagen an EINER Stelle (§3): der gescopte
// Anti-KI-/Rechenweg-Satz + der ehrliche Status-Satz (beide SSoT seo.ts) und
// daneben der Pflicht-§8-Hinweis «keine Rechtsberatung».
//
// §8 · DIE DREI TEXTE SIND WÖRTLICH UNVERÄNDERT. Das Referenzbild trägt an
// dieser Stelle eine gekürzte Fassung; Ehrlichkeitstexte werden nie gestrafft —
// gekürzt wurde die FORM (kein `lc-notice`-Kasten mehr, zwei Spalten Feinschrift
// unter einer Kante, wie `.schluss` im Referenzbild), nicht die Aussage.
//
// Die Zeile spannt BEIDE Spalten des Satzspiegels: sie hat keine Marginalie, und
// ein einzelnes Grid-Kind läge sonst in der Marginalienspalte.
export function VertrauensFuss() {
  const pk = usePaneKlasse();
  return (
    <div className={`col-span-full grid gap-x-6 gap-y-3 pt-5 font-sans text-xs leading-relaxed text-ink-500 ${pk(
      'md:grid-cols-2', '@2xl/pane:grid-cols-2',
    )}`}>
      <div className="max-w-kleintext space-y-1.5">
        <p>{VERTRAUENS_SATZ}</p>
        <p>{STATUS_SATZ}</p>
      </div>
      <section aria-label="Rechtlicher Hinweis" className="max-w-kleintext">
        <p>
          Alle Rechner liefern automatisierte Orientierungsberechnungen und keine Rechtsberatung. Massgeblich
          sind Gesetz, GAV, Vertrag und der konkrete Sachverhalt. Für die Wahrung einer Frist im Einzelfall ist
          allein die nutzende Person verantwortlich.
        </p>
      </section>
    </div>
  );
}
