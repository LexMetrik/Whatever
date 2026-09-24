import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { STARTSEITE_ZAEHLER as z } from '../../data/startseiteZaehler.generated';
import { KANTONE, KANTON_NAMEN } from '../../data/tarif/typen';
import { SYSTEMATIK, type KantonSystematik as KantonSystematikBaum } from '../../lib/normtext/systematik';
import { ladeBrowseManifest, ladeKantonSystematik, filtern } from '../../lib/normtext/browse';
import { type BrowseErlass } from '../../lib/normtext/browse-typen';
import { erfassungsgrad, STUFE_WORT } from '../../lib/normtext/erfassungsgrad';
import type { BlattOrt } from '../../lib/startBlatt';
import { RubrikKachel } from '../ui/RubrikKachel';
import { BlattSuchFeld } from './BlattBausteine';
import { useBlattRuhe } from './blattRuhe';
import { SchweizKarte } from '../SchweizKarte';
import { InternationalRubriken } from '../normtext/InternationalRubriken';
import { GruppenInhalt } from '../../pages/gesetze-teile/geteilt';
import { KantonSystematik } from '../../pages/gesetze-teile/KantonSystematik';

// ─── Startseite · die Stufen der Gesetze-Kachel (W2·29-WERKBANK-START S1) ────
//
// David 23.9.2026: «bei gesetzen … zwei bund und kantone … wenn kantone dann
// landeskarte. wenn bund, dann nach rechtsgebiet», Tiefe «bis zum Erlass»; das
// internationale Recht als dritte Wahl (Auswahlfrage «Dritte Wahl»). Die letzte
// Stufe ist der bestehende Leser — die Erlass-Zeilen sind gewöhnliche Links.
//
// WIEDERVERWENDUNG statt Nachbau (§10): Erlass-Tabellen, Kantons-Systematik und
// Staatsverträge rendern dieselben Bausteine wie /gesetze; Karte = `SchweizKarte`
// mit derselben Erfassungsgrad-Ableitung. Zahlen nur aus dem Zähler bzw. aus dem
// geladenen Register (§8).
//
// §15: Gebiete, Kantonsliste und Karte kommen aus dem Bündel; das Register
// (`/normtext/register.json`) wird erst geladen, wenn eine Erlassliste gebraucht
// wird, die Kantons-Systematik erst in einem Kanton.

const nf = (n: number) => n.toLocaleString('de-CH');
const kantonName = (k: string) => KANTON_NAMEN[k as keyof typeof KANTON_NAMEN] ?? k;
const gebiet = (nr: string) => SYSTEMATIK.find((k) => k.nr === nr);

export function GesetzeBlatt({ ort, gehe }: { ort: BlattOrt; gehe: (o: BlattOrt) => void }) {
  const [ebene, zweite] = ort.pfad;
  const zu = (...pfad: string[]) => () => gehe({ rubrik: 'gesetze', pfad });
  if (!ebene) return <Wahl zu={zu} />;
  if (ebene === 'bund' && !zweite) return <Gebiete zu={zu} />;
  if (ebene === 'bund' && zweite) return <GebietErlasse nr={zweite} />;
  if (ebene === 'kantone' && !zweite) return <Kantone zu={zu} />;
  if (ebene === 'kantone' && zweite) return <KantonErlasse kt={zweite} />;
  return <International />;
}

type Zu = (...pfad: string[]) => () => void;

function Wahl({ zu }: { zu: Zu }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <RubrikKachel reg="g" onWahl={zu('bund')} titel="Bund" zahl={nf(z.gesetzeBundesrechtVolltext)}
        einheit="Bundeserlasse" nutzen="Nach Rechtsgebiet, dann Erlass." />
      <RubrikKachel reg="g" onWahl={zu('kantone')} titel="Kantone" zahl={nf(z.gesetzeKantonVolltext)}
        einheit="kantonale Erlasse" nutzen="Über die Landeskarte, dann Erlass." />
      <RubrikKachel reg="g" onWahl={zu('international')} titel="International" zahl={nf(z.gesetzeInternationalVolltext)}
        einheit="Staatsverträge" nutzen="Staatsverträge und EU-Recht." />
    </div>
  );
}

function Gebiete({ zu }: { zu: Zu }) {
  return (
    <div className="space-y-3">
      {/* `grid-cols-1`: ohne Spaltenvorgabe wuchs die Spalte @320 auf das längste
          Einzelwort («Zwangsvollstreckungsrecht»), R8 a +8 px (FEINSCHLIFF). */}
      <ul className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
        {z.bundSystematik.map((g) => (
          <li key={g.id} className="border-t border-rule-soft">
            {/* `whitespace-normal`: die Menüzeile ist sonst einzeilig — «Zivilprozess- und
                Zwangsvollstreckungsrecht» lief bei jeder Breite über die Spalte und
                in den Nachbarn (gemessen 24.9.2026, FEINSCHLIFF). */}
            <button type="button" onClick={zu('bund', g.nr)} className="lc-menu-zeile items-baseline whitespace-normal">
              <span aria-hidden className="num w-6 shrink-0 font-sans text-xs text-ink-500">{g.nr}</span>
              <span className="min-w-0 flex-1">
                <span className="block hyphens-auto break-words font-serif text-body-l leading-snug text-ink-900">{g.titel}</span>
                <span className="block truncate font-sans text-xs text-ink-500" title={g.kuerzel.join(' · ')}>{g.kuerzel.join(' · ')}</span>
              </span>
              <span className="num shrink-0 font-sans text-xs text-ink-700">{nf(g.anzahl)}</span>
            </button>
          </li>
        ))}
      </ul>
      <p className="max-w-reading font-sans text-xs leading-relaxed text-ink-500">
        Die Zahl je Zeile ist der bei uns erfasste Volltext ({nf(z.gesetzeBundesrechtVolltext)} Erlasse
        des Bundesrechts), nicht der Umfang der Systematischen Rechtssammlung des Bundes.
      </p>
    </div>
  );
}

function Kantone({ zu }: { zu: Zu }) {
  const n = (k: string) => z.kantonErlassZahlen[k] ?? 0;
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <SchweizKarte className="w-full" onWaehle={(k) => zu('kantone', k)()} nameFuer={kantonName}
        verfuegbar={(k) => n(k) > 0}
        gradFuer={(k) => {
          const anzahl = n(k);
          if (!anzahl) return null;
          const stufe = erfassungsgrad(k, anzahl).stufe;
          return { stufe, text: `${anzahl} ${anzahl === 1 ? 'Erlass' : 'Erlasse'} · ${STUFE_WORT[stufe]}` };
        }} />
      <ul aria-label="Kantone" className="grid grid-cols-2 gap-x-4 self-start">
        {KANTONE.map((k) => (
          <li key={k} className="border-t border-rule-soft">
            {/* Kantonsname bricht um statt «Basel-Lan…» (FEINSCHLIFF 24.9.2026). */}
            <button type="button" onClick={zu('kantone', k)} className="lc-menu-zeile whitespace-normal" disabled={!n(k)}>
              <span className="min-w-0 flex-1 break-words leading-snug">{kantonName(k)}</span>
              <span className="num shrink-0 text-xs text-ink-500">{n(k)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Register erst bei Bedarf (§15); `null` = lädt, `[]` = nicht erreichbar. */
function useRegister(): BrowseErlass[] | null {
  const [erlasse, setErlasse] = useState<BrowseErlass[] | null>(null);
  const ruhe = useBlattRuhe();
  useEffect(() => {
    if (!ruhe) return; // erst nach der Öffnungsbewegung (blattRuhe.ts)
    let lebt = true;
    ladeBrowseManifest().then((m) => { if (lebt) setErlasse(m?.erlasse ?? []); });
    return () => { lebt = false; };
  }, [ruhe]);
  return erlasse;
}

function Laedt({ erlasse, children }: { erlasse: BrowseErlass[] | null; children: () => ReactNode }) {
  if (erlasse === null) return <p className="font-sans text-body-s text-ink-500" role="status">Erlasse werden geladen …</p>;
  if (erlasse.length === 0) {
    return <p className="font-sans text-body-s text-ink-700" role="alert">Die Gesetzessammlung konnte nicht geladen werden. Bitte die Seite neu laden.</p>;
  }
  return <>{children()}</>;
}

const istIntl = (e: BrowseErlass) => e.rechtsgebiet === 'international';

function GebietErlasse({ nr }: { nr: string }) {
  const erlasse = useRegister();
  const [suche, setSuche] = useState('');
  const kat = gebiet(nr);
  const gruppen = useMemo(() => {
    if (!erlasse || !kat) return [];
    const bund = filtern(erlasse.filter((e) => e.ebene === 'bund' && !istIntl(e)), suche);
    const proKey = new Map(bund.map((e) => [e.key, e]));
    return kat.gruppen
      .map((g) => ({ id: g.id, titel: g.titel, items: g.keys.map((k) => proKey.get(k)).filter((e): e is BrowseErlass => !!e) }))
      .filter((g) => g.items.length > 0);
  }, [erlasse, kat, suche]);
  if (!kat) return null;
  return (
    <div className="space-y-4">
      <p className="max-w-reading font-sans text-body-s text-ink-600">{kat.lede}</p>
      <BlattSuchFeld schmal wert={suche} setze={setSuche} label={`In «${kat.titel}» filtern`} />
      <Laedt erlasse={erlasse}>
        {() => gruppen.length
          ? gruppen.map((g) => <GruppenInhalt key={g.id} titel={g.titel} items={g.items} />)
          : <p className="font-sans text-body-s text-ink-600">Kein Erlass passt auf «{suche}».</p>}
      </Laedt>
    </div>
  );
}

function KantonErlasse({ kt }: { kt: string }) {
  const erlasse = useRegister();
  const [sys, setSys] = useState<Record<string, KantonSystematikBaum> | null>(null);
  const [suche, setSuche] = useState('');
  useEffect(() => {
    let lebt = true;
    ladeKantonSystematik().then((s) => { if (lebt) setSys(s); });
    return () => { lebt = false; };
  }, []);
  const eig = useMemo(
    () => (erlasse ? filtern(erlasse.filter((e) => e.ebene === 'kanton' && e.kanton === kt), suche) : []),
    [erlasse, kt, suche],
  );
  return (
    <div className="space-y-4">
      <BlattSuchFeld schmal wert={suche} setze={setSuche} label={`In ${kantonName(kt)} filtern`} />
      <Laedt erlasse={erlasse}>
        {() => <KantonSystematik erlasse={eig} sys={sys?.[kt]} sysGeladen={sys !== null} />}
      </Laedt>
    </div>
  );
}

function International() {
  const erlasse = useRegister();
  const [suche, setSuche] = useState('');
  const intl = useMemo(() => (erlasse ? filtern(erlasse.filter(istIntl), suche) : []), [erlasse, suche]);
  return (
    <div className="space-y-4">
      <BlattSuchFeld schmal wert={suche} setze={setSuche} label="Staatsverträge filtern" />
      <Laedt erlasse={erlasse}>{() => <InternationalRubriken erlasse={intl} />}</Laedt>
    </div>
  );
}
