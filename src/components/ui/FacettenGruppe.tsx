// ─── FacettenGruppe: EINE Facetten-Achse (Runde 2, 31.8.2026) ───────────────
//
// W2·19-DESIGN-KONSISTENZ · Runde 2, Paket C. Die Chip-OPTIK war in Welle B1
// (D-1) bereits vereinheitlicht — beide Achsen tragen seither `.lc-chip` /
// `.lc-chip-selected`. Geblieben war die zweite ANATOMIE: `/rechtsprechung`
// hatte die Achse als lokale `FacettenGruppe` in `EntscheidFilter.tsx`,
// `/suche` baute dieselbe Reihe (Gruppen-Rolle · Overline · Chip mit Zahl ·
// a11y-Name «<Achse>: <Wert> (<n>)») noch einmal von Hand. Beide sind auf
// DIESEN Baustein gezogen, die Kopien sind gelöscht (§5/§10).
//
// Sichtbare Folge auf `/suche`: die Reihe trägt jetzt — wie auf
// `/rechtsprechung` — ihr Achsen-Etikett («INHALTSTYP») vor den Chips. Die
// zugänglichen Namen bleiben Zeichen für Zeichen dieselben (e2e
// `suche-seite.e2e.ts`, `rechtsprechung*.e2e.ts` prüfen sie).
//
// ── D24-NACHZUG (Fixer 1h, 6.9.2026) · TEXT-SCHALTER STATT KASTEN ───────────
// Prüfbefund «Aus D24 (offen)»: D22 hatte die Kasten-Optik (Rahmen + Fläche)
// bereits an der Filterzeile abgeräumt («keine Kästen») — die drei Facetten-
// Achsen auf /rechtsprechung UND /suche trugen sie über `.lc-chip` weiter,
// weil beide denselben Baustein hier konsumieren. Jetzt zieht dieser EINE Ort
// nach: `.fc-schalter` (additiv, `.fc-*`, `src/index.css`) statt `.lc-chip` —
// kein Rahmen, keine Fläche, GEWÄHLT = 2-px-Registerstrich unten + ✓-Präfix
// (Form-Signal statt reiner Farbvergleich, F2/F4 wie zuvor). Die Registerfarbe
// kommt aus der neuen `register`-Prop (Default `'g'`, wie `ui/ListenTabelle` es
// vormacht) — /rechtsprechung übergibt `'r'` (EntscheidFilter.tsx), /suche
// lässt den App-weiten Neutralwert stehen (keine einzelne Domäne).
// UNVERÄNDERT: Zähler in Tabellenziffern (`.num`), a11y-Name
// «<Achse>: <Wert> (<n>)», Reihenfolge (Aufrufer stellt «Alle» voran),
// Filterlogik/URL-Parameter (beim Aufrufer, §3 — reine Anzeige hier).
// NEU: Pfeiltasten bewegen den Fokus INNERHALB der Gruppe (roving Fokus ohne
// Tab-Reihenfolge zu ändern) — `aria-pressed` bleibt der Auswahl-Träger.
//
// Reglement: R15 «Trefferzahl je Facette» (gegen Null-Treffer-Klicks), LM-040/
// F2/F4 (Auswahl ohne Farbvergleich erkennbar), LM-051 (Trenner im Textknoten).
// Reine Anzeige (§3) — Zählen und Filtern bleiben beim Aufrufer.

import { useRef, type KeyboardEvent } from 'react';
import { zahlGruppiert } from '../typografie';

export type FacettenOption = {
  id: string;
  text: string;
  /** Ausgeschriebene a11y-/Tooltip-Bezeichnung, falls `text` eine Abkürzung ist. */
  voll?: string;
  n: number;
  aktiv: boolean;
  waehle: () => void;
};

/** Registerfarbe der Domäne (wie `ui/ListenTabelle`) — trägt den Strich am
 *  gewählten Schalter. Default `'g'`: der App-weite Neutralwert für Flächen
 *  ohne eine einzelne Domäne (z. B. /suche, die alle Register mischt). */
export type FacettenRegister = 'g' | 'r' | 'm' | 'w';

const PFEILE = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']);

export function FacettenGruppe({ label, gruppenLabel, optionen, register = 'g' }: {
  /** Name der Achse: sichtbares Etikett UND Präfix der Chip-a11y-Namen. */
  label: string;
  /** aria-label der Gruppe, falls es ausführlicher sein soll als `label`. */
  gruppenLabel?: string;
  optionen: FacettenOption[];
  register?: FacettenRegister;
}) {
  const zeile = useRef<HTMLDivElement>(null);

  // Pfeiltasten bewegen den Fokus zwischen den Schaltern DERSELBEN Gruppe —
  // reine Komfort-Navigation (die Buttons bleiben normal in der Tab-Reihenfolge,
  // kein Roving-Tabindex): Tab wechselt weiterhin jeden Schalter einzeln an,
  // Pfeile innerhalb der Gruppe sparen den Umweg über Tab bei vielen Optionen
  // (z. B. Kantonsliste der Gemeinwesen-Achse).
  const aufTaste = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!PFEILE.has(e.key)) return;
    const schalter = Array.from(zeile.current?.querySelectorAll<HTMLButtonElement>('button') ?? []);
    const i = schalter.indexOf(document.activeElement as HTMLButtonElement);
    if (i === -1) return;
    e.preventDefault();
    const vorwaerts = e.key === 'ArrowRight' || e.key === 'ArrowDown';
    schalter[(i + (vorwaerts ? 1 : -1) + schalter.length) % schalter.length]?.focus();
  };

  return (
    <div ref={zeile} role="group" aria-label={gruppenLabel ?? label} data-reg={register}
      onKeyDown={aufTaste}
      className="fc-zeile flex flex-wrap items-baseline gap-x-4 gap-y-1.5">
      {/* LM-185 (W2·17-UI-BEFUNDE/B18): das Achsen-Etikett steht in einer festen
          Spalte, nicht mehr inline in seiner natürlichen Breite. Gemessen
          @1440 auf /rechtsprechung (Preview von origin/main, 5.9.2026):
          «GEMEINWESEN» 87 px, «INSTANZ»/«SPRACHE» je 55 px — die drei Chip-
          Reihen begannen darum bei x=655 bzw. x=623 und lasen sich nicht als
          gleichrangige Gruppen. `sm:w-28` (7 rem = 112 px) trägt das längste
          heute vorkommende Etikett; die Reihen starten auf EINER Linie.
          Unter `sm` nimmt das Etikett die volle Zeile (`w-full`): dort brachen
          die Chips ohnehin unter das Etikett, jetzt tun sie es als Block mit
          einer gemeinsamen linken Kante statt zufällig. Reine Darstellung (§3);
          Text, Reihenfolge und a11y-Namen unverändert. */}
      <span aria-hidden className="lc-overline w-full shrink-0 sm:w-28">{label}</span>
      {optionen.map((o) => (
        <button key={o.id} type="button" aria-pressed={o.aktiv} onClick={o.waehle}
          aria-label={`${label}: ${o.voll ?? o.text} (${o.n})`} title={o.voll}
          className="fc-schalter">
          {/* LM-051: Beschriftung und Zahl brauchen einen Trenner im TEXTKNOTEN,
              nicht nur den optischen Abstand — sonst liest/kopiert man «BS3765».
              Das explizite Leerzeichen steht als eigener Textknoten zwischen den
              beiden Flex-Items. Die aria-labels («Gemeinwesen: BS (3765)»)
              bleiben wie sie sind; sie waren nie das Problem.
              ink-600 (nicht ink-500): 12px-Ziffer auf --well ≥4.5:1 (R4/WCAG
              1.4.3, Werte nicht runden — ink-500 lag bei 4.47:1). Aktiv erbt
              ink-900 (`.fc-schalter[aria-pressed="true"]`, index.css).
              K6 (W2·29, 23.9.2026): der Schalter selbst ruht seither in
              ink-600 — die Zahl erbt seine Tinte, die Sonderklasse entfällt. */}
          {o.text}{' '}<span className="num ml-1">{zahlGruppiert(o.n)}</span>
        </button>
      ))}
    </div>
  );
}
