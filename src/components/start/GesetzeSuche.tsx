import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { KANTONE, KANTON_NAMEN } from '../../data/tarif/typen';
import { ladeBrowseManifest, filtern } from '../../lib/normtext/browse';
import { type BrowseErlass } from '../../lib/normtext/browse-typen';
import { GruppenInhalt } from '../../pages/gesetze-teile/geteilt';
import { BlattSuchFeld, TrefferZahl, WeitereKnopf } from './BlattBausteine';
import { useBlattRuhe } from './blattRuhe';

// ─── Startseite · Gesetze-Blatt: Register und Suche auf allen Stufen ─────────
//
// U11 (W2·29-WERKBANK-START-UEBERARBEITUNG), David 24.9.2026: «bei gesetze soll
// auf allenen ebenen eine suche möglich sien». Vorher filterten nur die
// Erlass-Stufen (`bund/<nr>`, `kantone/<kt>`, `international`); Wahl, Gebiete
// und Kantonsliste hatten kein Feld. `StufenSuche` legt das Feld über die Stufe:
// leer → die Stufe unverändert; sonst an ihrer Stelle die Trefferliste.
//
// EINE Anatomie (§5/§10): Treffer rendern `GruppenInhalt` — dieselben
// Erlass-Zeilen samt Link (`erlassPfad`, amtlicher Aussen-Link bei
// `nur-live-link`) wie `GebietErlasse`. Filterlogik ist `filtern`
// (lib/normtext/browse.ts), unverändert wiederverwendet. Herkunft je Treffer:
// die Zeilen stehen unter einem Kopf «Bund» / «Staatsverträge» / «<Kanton>
// (<Kürzel>)» — eine kantonale Zeile trägt sonst nur die Systematik-Nummer.
//
// §15 · LADEN ERST AUF WUNSCH: das Register (`/normtext/register.json`,
// ~1,5 MB) lädt auf diesen drei Stufen NICHT beim Öffnen, sondern erst beim
// Fokus ins Feld (Vorabruf) bzw. beim ersten Zeichen. Logikverlust: keiner —
// Treffermenge, Reihenfolge und Ziele sind dieselben, nur der Zeitpunkt des
// Abrufs verschiebt sich; bis dahin zeigt `Laedt` «Erlasse werden geladen …».

/** Register bei Bedarf (§15); `null` = lädt (oder noch nicht gewollt), `[]` =
 *  nicht erreichbar. `aktiv = false`: kein Abruf (Suchfeld noch unberührt). */
// eslint-disable-next-line react-refresh/only-export-components -- Hook und Suchbaustein teilen den Register-Zustand; eigene Datei wäre Aufteilung ohne Nutzen
export function useRegister(aktiv = true): BrowseErlass[] | null {
  const [erlasse, setErlasse] = useState<BrowseErlass[] | null>(null);
  const ruhe = useBlattRuhe();
  useEffect(() => {
    if (!ruhe || !aktiv) return; // erst nach der Öffnungsbewegung (blattRuhe.ts)
    let lebt = true;
    ladeBrowseManifest().then((m) => { if (lebt) setErlasse(m?.erlasse ?? []); });
    return () => { lebt = false; };
  }, [ruhe, aktiv]);
  return erlasse;
}

export function Laedt({ erlasse, children }: { erlasse: BrowseErlass[] | null; children: () => ReactNode }) {
  if (erlasse === null) return <p className="font-sans text-body-s text-ink-500" role="status">Erlasse werden geladen …</p>;
  if (erlasse.length === 0) {
    return <p className="font-sans text-body-s text-ink-700" role="alert">Die Gesetzessammlung konnte nicht geladen werden. Bitte die Seite neu laden.</p>;
  }
  return <>{children()}</>;
}

/** Suchbereich einer Stufe: Wahl = alles, Gebiete = Bundesrecht ohne
 *  Staatsverträge, Kantone = alle kantonalen Erlasse. */
export type SuchBereich = 'alle' | 'bund' | 'kantone';

const istIntl = (e: BrowseErlass) => e.rechtsgebiet === 'international';
const IM_BEREICH: Record<SuchBereich, (e: BrowseErlass) => boolean> = {
  alle: () => true,
  bund: (e) => e.ebene === 'bund' && !istIntl(e),
  kantone: (e) => e.ebene === 'kanton',
};

/** Portion der Trefferliste — «a» trifft über tausend Erlasse (Register 21.9.:
 *  1'580 Einträge), die nicht auf einmal gerendert werden sollen. */
const PORTION = 30;

/** Herkunfts-Rang: Bund, Staatsverträge, dann die Kantone in amtlicher Folge. */
const KANTON_RANG = new Map<string, number>(KANTONE.map((k, i) => [k, i]));
function herkunft(e: BrowseErlass): { rang: number; titel: string } {
  if (e.ebene !== 'kanton') return istIntl(e) ? { rang: 1, titel: 'Staatsverträge' } : { rang: 0, titel: 'Bund' };
  const k = e.kanton ?? '';
  const name = KANTON_NAMEN[k as keyof typeof KANTON_NAMEN] ?? k;
  return { rang: 2 + (KANTON_RANG.get(k) ?? KANTONE.length), titel: `${name} (${k})` };
}

/** Das Suchfeld über einer Stufe. `className` gehört dem Wrapper (die
 *  Wahl-Stufe braucht ihr Füll-Raster, index.css `.lc-start-fuellt`). */
export function StufenSuche({ bereich, label, schmal, className, children }: {
  bereich: SuchBereich; label: string; schmal?: boolean; className?: string; children: ReactNode;
}) {
  const [suche, setSuche] = useState('');
  const [gewollt, setGewollt] = useState(false);
  const erlasse = useRegister(gewollt);
  const aktiv = suche.trim() !== '';
  return (
    <div className={className}>
      <BlattSuchFeld schmal={schmal} wert={suche} label={label} onFocus={() => setGewollt(true)}
        setze={(s) => { setGewollt(true); setSuche(s); }} />
      {aktiv ? <Laedt erlasse={erlasse}>{() => <Treffer erlasse={erlasse ?? []} bereich={bereich} suche={suche} />}</Laedt> : children}
    </div>
  );
}

function Treffer({ erlasse, bereich, suche }: { erlasse: BrowseErlass[]; bereich: SuchBereich; suche: string }) {
  const [portion, setPortion] = useState(PORTION);
  // Neue Eingabe → wieder bei der ersten Portion (Muster MaterialienBlatt).
  const [vorSuche, setVorSuche] = useState(suche);
  if (vorSuche !== suche) { setVorSuche(suche); setPortion(PORTION); }
  const treffer = useMemo(() => {
    const s = suche.trim().toLowerCase();
    // Reihenfolge (reine Darstellung): nach Herkunft; darin genaue
    // Kürzel-Treffer zuerst («or» → OR vor den vielen «…Verordnung…»),
    // sonst Register-Folge (stabile Sortierung).
    return filtern(erlasse.filter(IM_BEREICH[bereich]), suche)
      .map((e) => ({ e, h: herkunft(e), genau: e.kuerzel.toLowerCase() === s ? 0 : 1 }))
      .sort((a, b) => a.h.rang - b.h.rang || a.genau - b.genau);
  }, [erlasse, bereich, suche]);
  if (treffer.length === 0) {
    return <p className="font-sans text-body-s text-ink-600" role="status">Kein Erlass passt auf «{suche.trim()}».</p>;
  }
  // Gruppen aus der gezeigten Portion — aufeinanderfolgend, da nach Herkunft sortiert.
  const gruppen: { titel: string; items: BrowseErlass[] }[] = [];
  for (const { e, h } of treffer.slice(0, portion)) {
    const letzte = gruppen[gruppen.length - 1];
    if (letzte?.titel === h.titel) letzte.items.push(e);
    else gruppen.push({ titel: h.titel, items: [e] });
  }
  return (
    <div className="space-y-4">
      <TrefferZahl n={treffer.length} einzahl="Erlass" mehrzahl="Erlasse" />
      {gruppen.map((g) => <GruppenInhalt key={g.titel} titel={g.titel} items={g.items} />)}
      {treffer.length > portion && (
        <WeitereKnopf rest={treffer.length - portion} mehr={() => setPortion((p) => p + PORTION)} />
      )}
    </div>
  );
}
