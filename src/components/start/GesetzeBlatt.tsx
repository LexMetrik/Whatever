import { useEffect, useMemo, useState } from 'react';
import { STARTSEITE_ZAEHLER as z } from '../../data/startseiteZaehler.generated';
import { KANTONE, KANTON_NAMEN } from '../../data/tarif/typen';
import { SYSTEMATIK, type KantonSystematik as KantonSystematikBaum } from '../../lib/normtext/systematik';
import { ladeKantonSystematik, filtern } from '../../lib/normtext/browse';
import { type BrowseErlass } from '../../lib/normtext/browse-typen';
import { erfassungsgrad, STUFE_WORT } from '../../lib/normtext/erfassungsgrad';
import type { BlattOrt } from '../../lib/startBlatt';
import { RubrikKachel } from '../ui/RubrikKachel';
import { BlattSuchFeld, WahlSpalte } from './BlattBausteine';
import { Laedt, StufenSuche, useRegister } from './GesetzeSuche';
import { SchweizKarte } from '../SchweizKarte';
import { InternationalRubriken } from '../normtext/InternationalRubriken';
import { INTERNATIONAL_GRUPPEN } from '../../lib/normtext/international-rubriken';
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
//
// U11 (David 24.9.2026: «bei gesetze soll auf allenen ebenen eine suche möglich
// sien»): auch Wahl, Gebiete und Kantonsliste tragen oben ein Suchfeld
// (`StufenSuche`, GesetzeSuche.tsx) — dort lädt das Register erst beim Fokus
// ins Feld, nicht beim Öffnen der Stufe.

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
  return <International gruppe={ebene === 'international' ? zweite : undefined} />;
}

type Zu = (...pfad: string[]) => () => void;

// ─── Stufe «Wahl»: drei hohe Spalten (START-UEBERARBEITUNG U1, David 24.9.2026)
//
// Anlass: «es braucht etwas unter den vierecken» — die drei kleinen Kacheln
// liessen bei 1024–1440 px rund ein Drittel des Blatts leer. Auswahl David
// (Skizze «Drei hohe Spalten»): jede Kachel wird eine Spalte über die volle
// Blatthöhe, darin die nächste Stufe schon anklickbar.
//
// AUFBAU je Spalte: der Kopf IST die bisherige `RubrikKachel` (Fläche,
// Registerstrich, Zahl aus dem Zähler) und führt auf die Übersichts-Stufe;
// darunter eigene Knöpfe bzw. die Karte — nie ein Knopf im Knopf.
//   · Bund: Kopf → `bund` bleibt (Entscheid Bau): die Übersicht trägt die
//     Kürzel je Gebiet und die Zählhinweis-Zeile, die Spalte nicht — sie ist
//     also kein Doppel. Zeilen → `bund/<nr>`.
//   · Kantone: Karte (dieselbe Erfassungsgrad-Ableitung wie `Kantone`) →
//     `kantone/<kt>`; «Alle 26 Kantone» → `kantone` (Liste).
//   · International: Rubriken → `international/<gruppenId>`, Kopf → alle.
// Zahlen: nur `STARTSEITE_ZAEHLER` (§8). Die International-Rubriken tragen
// keine Zahl — der Zähler führt keine je Rubrik, und eine Zahl aus den
// Rubrik-Keys wäre eine Behauptung über das Register, das hier nicht lädt (§15).
//
// Höhe: `.lc-start-fuellt` (index.css) streckt die Stufe ab `lg` auf die volle
// Blatthöhe; darunter stehen die Spalten untereinander, das Blatt scrollt.

/** Kurzbeschriftung einzelner Rubriken in der schmalen Spalte — reine
 *  Darstellung; die volle Bezeichnung (Quelle unverändert) steht im `title`,
 *  im Pfad und als Überschrift der Stufe. */
const INTL_KURZ: Readonly<Record<string, string>> = {
  rechtshilfe: 'Rechtshilfe & Kindes-/Erwachsenenschutz',
  'eu-verordnungen': 'EU-Verordnungen',
};

const nKanton = (k: string) => z.kantonErlassZahlen[k] ?? 0;
const kantonGrad = (k: string) => {
  const anzahl = nKanton(k);
  if (!anzahl) return null;
  const stufe = erfassungsgrad(k, anzahl).stufe;
  return { stufe, text: `${anzahl} ${anzahl === 1 ? 'Erlass' : 'Erlasse'} · ${STUFE_WORT[stufe]}` };
};

function Wahl({ zu }: { zu: Zu }) {
  // U11: das Suchfeld liegt in voller Breite über den Spalten. `.lc-start-fuellt`
  // bleibt direktes Kind der Stufe (index.css `:has(> .lc-start-fuellt)`) und
  // wird ein Zwei-Zeilen-Raster: Feld `auto`, darunter die Spalten (bzw. die
  // Treffer) auf der Resthöhe — die Spalten füllen weiter bis unten.
  return (
    <StufenSuche bereich="alle" label="Gesetze durchsuchen"
      className="lc-start-fuellt grid grid-cols-1 gap-3 lg:grid-rows-[auto_minmax(0,1fr)]">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1.25fr_1fr] lg:grid-rows-[auto_minmax(0,1fr)] lg:gap-y-0">
        <WahlSpalte reg="g" kopf={<RubrikKachel reg="g" onWahl={zu('bund')} titel="Bund" zahl={nf(z.gesetzeBundesrechtVolltext)} einheit="Bundeserlasse" />}>
          <ul aria-label="Rechtsgebiete des Bundes" className="px-2">
            {z.bundSystematik.map((g) => (
              <li key={g.id} className="border-t border-rule-soft">
                <button type="button" onClick={zu('bund', g.nr)} className="lc-menu-zeile items-baseline whitespace-normal px-2">
                  <span aria-hidden className="num w-5 shrink-0 text-xs text-ink-600">{g.nr}</span>
                  <span className="min-w-0 flex-1 hyphens-auto break-words leading-snug text-ink-900">{g.titel}</span>
                  <span className="num shrink-0 text-xs text-ink-700">{nf(g.anzahl)}</span>
                </button>
              </li>
            ))}
          </ul>
        </WahlSpalte>
        <WahlSpalte reg="g" kopf={<RubrikKachel reg="g" onWahl={zu('kantone')} titel="Kantone" zahl={nf(z.gesetzeKantonVolltext)} einheit="kantonale Erlasse" />}>
          {/* `max-w-xs` untereinander: die Karte in voller Telefonbreite schob
              die International-Spalte unnötig weit nach unten. */}
          <div className="mx-auto max-w-xs px-4 lg:max-w-none">
            {/* `kompakt`: diese Spalte ist die schmale Darstellung (Befund
                U1-Bau) — grössere Trefferfläche für kleine Kantone (U5). */}
            <SchweizKarte className="w-full" kompakt onWaehle={(k) => zu('kantone', k)()} nameFuer={kantonName}
              verfuegbar={(k) => nKanton(k) > 0} gradFuer={kantonGrad} />
          </div>
          <ul aria-label="Kantone als Liste" className="mt-2 px-2">
            <li className="border-t border-rule-soft">
              <button type="button" onClick={zu('kantone')} className="lc-menu-zeile whitespace-normal px-2 text-ink-900">
                <span className="min-w-0 flex-1">Alle 26 Kantone</span>
                <span aria-hidden className="shrink-0 text-ink-600">›</span>
              </button>
            </li>
          </ul>
        </WahlSpalte>
        <WahlSpalte reg="g" kopf={<RubrikKachel reg="g" onWahl={zu('international')} titel="International" zahl={nf(z.gesetzeInternationalVolltext)} einheit="Staatsverträge" />}>
          <ul aria-label="Rubriken des internationalen Rechts" className="px-2">
            {INTERNATIONAL_GRUPPEN.map((g) => (
              <li key={g.id} className="border-t border-rule-soft">
                <button type="button" onClick={zu('international', g.id)} title={INTL_KURZ[g.id] ? g.titel : undefined}
                  className="lc-menu-zeile whitespace-normal px-2">
                  <span className="min-w-0 flex-1 hyphens-auto break-words leading-snug text-ink-900">{INTL_KURZ[g.id] ?? g.titel}</span>
                </button>
              </li>
            ))}
          </ul>
        </WahlSpalte>
      </div>
    </StufenSuche>
  );
}

function Gebiete({ zu }: { zu: Zu }) {
  return (
    <StufenSuche bereich="bund" label="Bundesrecht durchsuchen" schmal className="space-y-3">
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
    </StufenSuche>
  );
}

function Kantone({ zu }: { zu: Zu }) {
  const n = nKanton;
  return (
    <StufenSuche bereich="kantone" label="Kantonales Recht durchsuchen" schmal className="space-y-3">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <SchweizKarte className="w-full" onWaehle={(k) => zu('kantone', k)()} nameFuer={kantonName}
          verfuegbar={(k) => n(k) > 0} gradFuer={kantonGrad} />
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
    </StufenSuche>
  );
}

// `useRegister` und `Laedt`: seit U11 in GesetzeSuche.tsx (eine Quelle für
// Erlass-Stufen und Stufen-Suche).

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

/** `gruppe`: nur diese Rubrik (Stufe `international/<gruppenId>`, U1). */
function International({ gruppe }: { gruppe?: string }) {
  const erlasse = useRegister();
  const [suche, setSuche] = useState('');
  const intl = useMemo(() => (erlasse ? filtern(erlasse.filter(istIntl), suche) : []), [erlasse, suche]);
  // Kurzform im Filterfeld: der volle Titel lief dort in die Auslassung.
  const titel = gruppe ? INTL_KURZ[gruppe] ?? INTERNATIONAL_GRUPPEN.find((g) => g.id === gruppe)?.titel : undefined;
  return (
    <div className="space-y-4">
      <BlattSuchFeld schmal wert={suche} setze={setSuche} label={titel ? `In «${titel}» filtern` : 'Staatsverträge filtern'} />
      <Laedt erlasse={erlasse}>{() => <InternationalRubriken erlasse={intl} gruppe={gruppe} />}</Laedt>
    </div>
  );
}
