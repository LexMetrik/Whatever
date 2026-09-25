import type { StatusPraedikat } from '../../lib/verzahnung/typen';
import { Begriff } from './Begriff';
import { REZEPT } from './statusRezept';

// ─── StatusBadge — EIN Vokabular, nur für Abweichungen (§1.3) ────────────────
//
// Das Vokabular selbst (REZEPT: Glyph, Label, aria-label, Erklärtext, Ton) lebt
// als Daten in `statusRezept.ts` — EINE Quelle (§5) für Badge, Glyph UND die
// sichtbare Zeichenerklärung (ZeichenLegende, LM-050); Konstanten-Exporte aus
// Komponenten-Dateien verbietet `react-refresh/only-export-components`.
//
// Geschlossene Liste. Der Normalfall (kuratiert erfasst) trägt KEIN Badge — nur
// Abweichungen werden markiert (§0-1a). KEINE Ampel-/Treatment-Farben (R16 zu);
// Messing ist Hervorhebung, kein Rechtsstatus-Urteil. Das `aria-label` je Prädikat
// ist TEXTGLEICH an allen Fundorten (Magic Moment 4) — dieselbe Konstante speist
// Glyph- und Volltext-Variante.
//
// V1 bespielt nur `leitentscheid` und `maschinell`. `masse` (V2) und `nur-verweis`
// (V3) sind Enum-Slots im Typ (typen.ts) — sie tragen HEUTE bewusst KEINE
// Darstellung (kein toter Zweig, §0-1e); die je-1-Variante kommt mit den Daten.

export function StatusBadge({ praedikat, variant = 'voll', interaktiv = false, detail, className = '' }: {
  praedikat: StatusPraedikat;
  /** 'voll' = ausgeschriebenes Badge (Reader-Kopf/Suche); 'glyph' = blanker ★ mit aria-label (Chip-Reihen). */
  variant?: 'voll' | 'glyph' | 'text';
  /** Nur 'voll': Label als touch-/tastaturtauglicher Begriff-Tooltip (Reader-Kopf). */
  interaktiv?: boolean;
  /** Instanz-spezifischer Zusatz (V1c: Revisionsdatum + AS-Fundstelle) — fliesst
   *  quell-belegt (§7) in aria-label UND Tooltip, ohne das feste Vokabular zu ändern. */
  detail?: string;
  className?: string;
}) {
  const r = REZEPT[praedikat];
  if (!r) return null;                       // V2/V3-Slot ohne Darstellung
  const ariaLabel = detail ? `${r.ariaLabel} — ${detail}` : r.ariaLabel;
  const titel = detail ? `${r.erklaerung} (${detail})` : r.erklaerung;

  // Glyph-Variante: blanker ★ (nur wo einer definiert ist), Text trägt das
  // aria-label (role=img → Screenreader liest das Label, nicht die Rohglyphe).
  if (variant === 'glyph') {
    if (!r.glyph) return null;
    return (
      <span role="img" aria-label={ariaLabel} title={titel}
        className={`${r.glyphTon ?? 'text-brass-700'} ${className}`}>
        {r.glyph}
      </span>
    );
  }

  // Text-Variante (W2·29-WERKBANK-REST S1, 25.9.2026): dasselbe Wort, dasselbe
  // aria-label und derselbe Erklärtext wie `voll` — nur OHNE Kasten, als
  // gepunktet unterstrichene Randnotiz (Board «Unter-Rechtsprechung-Register»,
  // Rezept `.lc-marke-text` in index.css). Wortlaut bleibt (Entscheid David
  // 24.9.2026: «maschinell» bleibt). ADDITIV: wer `variant` nicht setzt, sieht
  // weiterhin das Badge — der Gesetzes-Leser (Panels) zieht erst in NACHLAUF nach.
  if (variant === 'text') {
    return (
      <span role="img" aria-label={ariaLabel} title={titel} className={`lc-marke-text ${className}`}>
        {r.label}
      </span>
    );
  }

  // Volltext-Variante: ausgeschriebenes Badge. `interaktiv` macht das Label zu
  // einem Begriff (fokussier- + tap-bedienbarer Erklär-Tooltip, §1.7) — nur wo ein
  // Glossar-Eintrag existiert; sonst trägt `title` die Erklärung.
  // a11y (Review 3.7.): `aria-label` NIE auf einem role-losen Span
  // (axe aria-prohibited-attr) — statisch trägt es der role="img"-Span, im
  // interaktiven Fall der Begriff-Button (accessible name des Auslösers).
  if (interaktiv && r.glossar) {
    return (
      <span className={`lc-badge ${r.ton} ${className}`}>
        {r.glyph && <span aria-hidden className="mr-1">{r.glyph}</span>}
        <Begriff schluessel={r.glossar} ariaLabel={r.ariaLabel}>{r.label}</Begriff>
      </span>
    );
  }
  return (
    <span role="img" className={`lc-badge ${r.ton} ${className}`} aria-label={ariaLabel}
      title={titel}>
      {r.glyph && <span aria-hidden className="mr-1">{r.glyph}</span>}
      {r.label}
    </span>
  );
}
