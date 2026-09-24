import { BEREICHE, registerVar } from './bereiche';

// ─── Marke (W2·29-MARKE, Entscheid David 24.9.2026: Variante A2 «Registerbuch») ─
//
// Vorher (W2·24-DESIGN-IDENTITAET R2): gestempeltes Quadrat mit §-Glyphe und
// vier kleinen Registerstrichen am Fuss. Neu ist das Siegel ein BUCH: der
// Körper in Tinte, ein heller Buchrücken links, das § darauf, und die vier
// Register stehen als echte Registerreiter rechts aus dem Buch heraus — dasselbe
// Bild wie die offene-Reiter-Leiste darunter (W2·29-MARKE, Variante 1).
// Name und Wortmarke bleiben unverändert (David 24.9.2026: «vergiss das mit der
// namensänderung aber logo und tableiste soll umgebaut werden»).
//
// Geometrie aus dem Designsystem (`project/api/assets/Logos.md`, 48 × 48):
// Buch 6/6/28×36, Rücken 9/6/1.5×36, § bei 22/33 in 28 px, Reiter x=34 8×6.5.
// Radius 0 — ein Buch, keine App-Kachel.
//
// Die Reiter tragen die VIER REGISTERFARBEN (Gesetze · Rechtsprechung ·
// Materialien · Werkzeuge, `./bereiche`) — dieselbe Bedeutung wie der Strich
// über jedem offenen Reiter und die Randmarke der Seitenleiste. Reine
// Darstellung (§3).
//
// KEIN eigener Farbwert: die Reiter lesen `--reg-*`, der Körper `--ink-900`,
// Rücken und Glyphe `--paper` (auf dem Ink-Grund die einzige lesbare Wahl in
// beiden Modi — die Tinte kippt mit dem Thema, das Verhältnis bleibt).

/** Die vier Register in fester Ordnung — Duplikate («Werkzeuge» zweimal, für
 *  Rechner und Vorlagen) fallen weg, es sind vier Reiter, nicht fünf. */
const REGISTER_STRICHE = [...new Set(BEREICHE.map((b) => b.register))];

/** Oberkante der Reiter: 8 · 16.5 · 25 · 33.5 (Höhe 6.5, Abstand 2). */
const REITER_Y = (i: number) => 8 + i * 8.5;

export function LexMetrikSiegel({ size = 32 }: { size?: number }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true">
      <rect x="6" y="6" width="28" height="36" fill="var(--ink-900)" />
      <rect x="9" y="6" width="1.5" height="36" fill="var(--paper)" />
      {/* §-Glyphe in der Bedienschrift (Archivo) — via `style`, damit die
          CSS-Variable auflöst (Präsentationsattribute lösen `var()` nicht
          zuverlässig auf). */}
      <text x="22" y="33" textAnchor="middle"
        style={{ fontFamily: 'var(--font-display), system-ui, sans-serif', fontSize: 28, fontWeight: 600 }}
        fill="var(--paper)">§</text>
      {/* Die vier Register als Reiter, die rechts aus dem Buch stehen. */}
      {REGISTER_STRICHE.map((r, i) => (
        <rect key={r} x="34" y={REITER_Y(i)} width="8" height="6.5" fill={registerVar(r)} />
      ))}
    </svg>
  );
}

export function LexMetrikWortmarke({ className = '' }: { className?: string }) {
  // Zweiton aufgelöst: seit R1 ist `--brass-700` wertgleich mit `--ink-900`
  // (die Messing-Skala ist neutral geworden) — zwei Spans, eine Farbe, also
  // eine Behauptung ohne Wirkung. Der Unterschied trägt jetzt das GEWICHT:
  // «Lex» halbfett, «Metrik» normal, beides Tinte, beides Archivo.
  return (
    <span className={`font-display tracking-[-.01em] text-ink-900 ${className}`}>
      <span className="font-semibold">Lex</span>
      <span className="font-normal">Metrik</span>
    </span>
  );
}
