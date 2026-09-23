import { NAVIGATION } from '../../lib/navigation';

// ─── Die fünf Bereiche der Sammlung + ihre Registerfarbe (W2·24 R2) ─────────
//
// EIN Ort für die Frage «welchem Register gehört dieser Pfad?» (§5). Konsumenten:
// die Aktiv-Marke der Seitenleiste (`Sidebar`), der Registerfarben-Strich der
// Arbeitsleiste (`Reiterleiste`), die Register-Striche des Siegels (`Logo`).
// (Bis D17 auch die Bereichs-Reiter des Titelblatts — die gibt es nicht mehr.) Vor R2 färbte jede dieser Stellen mit `brass-*`, also mit der
// GLEICHEN Farbe für alles — die Registerfarbe ist die erste Unterscheidung,
// und sie darf nicht dreimal verschieden hergeleitet werden.
//
// Reine Darstellung (§3), deterministisch (§2): Ableitung aus dem Pfad-Präfix,
// Beschriftung und Ziel aus der Navigations-SSoT `lib/navigation.ts` — kein
// zweitgepflegter Bereichs-Katalog.

/** Die vier Registerfarben aus `index.css` (R1). «Werkzeuge» trägt Rechner UND
 *  Vorlagen — das Referenzbild kennt vier Register, nicht fünf. */
export type Register = 'g' | 'r' | 'm' | 'w';

/** CSS-Variable der Registerfarbe. Tailwind kennt sie als `reg-g|r|m|w`
 *  (tailwind.config.js `colors.reg`); wo eine Inline-Farbe nötig ist (SVG,
 *  `borderBottomColor`), ist DIESE Funktion die Quelle. */
export const registerVar = (r: Register): string => `var(--reg-${r})`;

export interface Bereich {
  /** Beschriftung = der Abschnitts-Titel der Navigations-SSoT. */
  label: string;
  /** Ziel = das Abschnitts-Ziel der Navigations-SSoT. */
  ziel: string;
  /** Pfad-Präfix, unter dem alles zu diesem Bereich gehört. */
  praefix: string;
  register: Register;
}

/** Register je Navigations-Abschnitt. Die Titel stammen aus `NAVIGATION`
 *  (SSoT) — steht dort ein Abschnitt ohne Eintrag hier, fehlt er in den
 *  Bereichs-Reitern, statt still in einer falschen Farbe zu erscheinen. */
const REGISTER_JE_TITEL: Record<string, Register> = {
  Gesetze: 'g',
  Rechtsprechung: 'r',
  Materialien: 'm',
  Rechner: 'w',
  Vorlagen: 'w',
};

/** Die Bereichs-Reiter der Titelblatt-Zeile, in der Ordnung der Navigation. */
export const BEREICHE: Bereich[] = NAVIGATION.flatMap((a) => {
  if (!a.titel || !a.ziel) return [];
  const register = REGISTER_JE_TITEL[a.titel];
  if (!register) return [];
  return [{ label: a.titel, ziel: a.ziel, praefix: a.ziel, register }];
});

// ─── D17 (6.9.2026) · KEIN BEREICHS-REITER IM TITELBLATT MEHR ──────────────
//
// Bis hierher führte die Titelblatt-Zeile die fünf Bereiche plus einen sechsten
// Reiter «Sammlung» als Navigation. David 6.9.2026: «ich mochte die
// seitenleiste. können wir die behalten. und das oben entfernen?» — die
// Bereichs-Navigation lebt seither ausschliesslich in der Seitenleiste. Damit
// sind `START_REITER` (die Aktivmarke für «/») und die beiden RAND-Tabellen
// (`REG_RAND`, `REG_RAND_HOVER`, die Striche jener Reiter) ersatzlos gestrichen
// statt bewacht (§17-Gegengewicht). `BEREICHE` selbst bleibt: die Registerfarbe
// eines Pfades braucht der Seitenleisten-Eintrag, der Reiter der Arbeitsleiste
// und das Siegel (`Logo.tsx`) unverändert.

/** Bereich eines Pfades — oder null (Start, Meta-Seiten, Unbekanntes). */
function bereichVonPfad(pfad: string): Bereich | null {
  const p = pfad.split('?')[0].split('#')[0];
  for (const b of BEREICHE) {
    if (p === b.praefix || p.startsWith(`${b.praefix}/`)) return b;
  }
  return null;
}

/** Registerfarbe eines Pfades — null, wo keine Zuordnung besteht (dann trägt
 *  die Marke die Tinte, nie eine geratene Farbe). */
export function registerVonPfad(pfad: string): Register | null {
  return bereichVonPfad(pfad)?.register ?? null;
}

/** Tailwind-Klasse für die Registerfarben-Fläche (2-px-Marke, nie unter Text). */
export const REG_FLAECHE: Record<Register, string> = {
  g: 'bg-reg-g', r: 'bg-reg-r', m: 'bg-reg-m', w: 'bg-reg-w',
};

// ─── R2-NACHZUG (Befunde F2/F9, 6.9.2026) · die Farbe darf ANFASSBAR sein ────
//
// Bis hierher trug die Registerfarbe nur den AKTIVEN Zustand: der Hover-Strich
// der Bereichs-Reiter war `rule-soft`, die Hover-Marke der Seitenleisten-Blätter
// ebenso, und der aktive Reiter der Arbeitsleiste unterschied sich um vier
// Helligkeitseinheiten (`paper-raised` 255 gegen `paper` 251). David 6.9.2026:
// «nicht trist» — die Registerfarben sollen an Reitern, beim Hover und an den
// Gruppenköpfen SICHTBAR sein. Die vier Tabellen unten sind je EIN Ort dafür
// (§5); Tailwind braucht die Klassennamen literal, darum Tabellen statt
// Zeichenkettenbau.
//
// Kontrast: alle vier Werte sind NICHT-TEXT-Flächen (2-px-Striche, 10-%-Tönung)
// — sie tragen keine Information allein (Position/Beschriftung tun das) und
// unterliegen darum nicht 1.4.3. Der Text darauf bleibt `ink-*` auf Papier.

/** Hover-Marke eines Seitenleisten-Blattes (Gruppe `blatt`). */
export const REG_HOVER_FLAECHE_BLATT: Record<Register, string> = {
  g: 'group-hover/blatt:bg-reg-g', r: 'group-hover/blatt:bg-reg-r',
  m: 'group-hover/blatt:bg-reg-m', w: 'group-hover/blatt:bg-reg-w',
};
// ── Aus Fixer 1i (Prüfbefund 6.9.2026) · RÜCKBAU `REG_HOVER_FLAECHE_REITER`
// Die Tabelle («Hover-Strich eines inaktiven Reiters der Arbeitsleiste») hatte
// nach R11-R1 keinen Konsumenten mehr: seither trägt JEDER Reiter seine
// Registerfarbe dauerhaft (inaktiv auf 60 % Deckkraft, `REG_FLAECHE` +
// `group-hover/reiter:opacity-100` in `Reiterleiste.tsx`) — der Hover hebt die
// Deckkraft, er färbt nicht mehr ein. Vier Tailwind-Klassennamen, die nur noch
// dafür da waren, im Purge zu überleben. §17-Gegengewicht: gestrichen statt
// bewacht.
/** Leichte Tönung der Fläche in der Registerfarbe — der aktive Reiter. */
export const REG_TON: Record<Register, string> = {
  g: 'bg-reg-g/10', r: 'bg-reg-r/10', m: 'bg-reg-m/10', w: 'bg-reg-w/10',
};
