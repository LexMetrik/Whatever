import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ladeEntscheidManifest, filterEntscheide, sortiere, hauptIdentitaet, themaText, istVolltextVerweis } from '../../lib/rechtsprechung/browse';
import type { BrowseEntscheid } from '../../lib/rechtsprechung/register';
import { datumAnzeige } from '../rechtsprechung/format';
import { Leerzustand } from '../ui/Leerzustand';
import { TrefferZeile, TREFFER_ZEILE_RAHMEN } from '../ui/TrefferZeile';
import { BlattLaedt, BlattSuchFeld, TrefferZahl, WeitereKnopf } from './BlattBausteine';
import { useSuchFokus } from './suchFokus';
import { useBlattRuhe } from './blattRuhe';

// ─── Startseite · die Rechtsprechung-Kachel: sofort Suche (W2·29-WERKBANK-START S3-Nachzug)
//
// David 23.9.2026: «rechtsprechung wenn sie aufgeht soll direkt eine suche von
// rechtssprechung ermöglichen». Keine Unterstufen — die Suche IST die Stufe,
// wie bei Materialien (Fahrplan §5d). WIEDERVERWENDUNG statt Nachbau (§10):
// Suchlogik/Filter aus `lib/rechtsprechung/browse.ts` (dieselbe Quelle wie
// `pages/Rechtsprechung.tsx`), Treffer-Zeile aus `ui/TrefferZeile` (dieselbe
// wie Materialien und die Live-Suche der Rubrikseite). Ziel jeder Zeile ist
// die bestehende Detailseite `/rechtsprechung/:key` — kein eigener Leser hier.
//
// §15-ENTSCHEID DAVID 23./24.9.2026 («Beim Öffnen laden», Option a des
// Fahrplan-Nachtrags S3): das Register (`public/rechtsprechung/register.json`,
// 9,46 MB, gzip 757 KiB — das Sechsfache der Materialien-/Normtext-
// Vergleichsgrösse) lädt über DENSELBEN Lader wie `/rechtsprechung`
// (`ladeEntscheidManifest`) erst beim Mounten DIESES Moduls, also erst beim
// Öffnen des Blatts — nie auf «/», nie beim Hover, nie bei der Hydration.
// Aufklappen kostet damit genau so viel wie heute der Klick auf
// `/rechtsprechung`, nicht mehr (e2e-Beleg: «§15-Beleg» unten im Testfile).
// Ein schlankerer Such-Index nur für dieses Blatt bleibt ein eigener,
// späterer Daten-Schritt (Klasse daten, eigene Gegenprüfung) — kein Teil
// dieser Scheibe.
//
// Filter beschränkt auf die drei Facetten aus dem Auftrag (Leitentscheide ·
// Bundesgericht · Kantonal) — die volle Filterleiste (Sachgebiet, Norm,
// Richter, Sortierung, Dichte …) bleibt der Rubrikseite vorbehalten (§10:
// kein Nachbau der ganzen Seite im Blatt).
//
// Fokus-Ausnahme (Spec «Fokus drin»): NICHT hier behandelt, sondern zentral in
// `StartKachelFeld.tsx` (kleine, klar begrenzte Stelle) — dieses Modul rendert
// nur ein gewöhnliches `<input type="search">`.

const PORTION = 20;

type Ebene = 'bund' | 'kanton' | null;

export function RechtsprechungBlatt() {
  const [alle, setAlle] = useState<BrowseEntscheid[] | null>(null);
  const [fehler, setFehler] = useState(false);
  const [suche, setSuche] = useState('');
  const { feldRef, zumFeld } = useSuchFokus();
  const [nurLeit, setNurLeit] = useState(false);
  const [ebene, setEbene] = useState<Ebene>(null);
  const [portion, setPortion] = useState(PORTION);
  const ruhe = useBlattRuhe();

  useEffect(() => {
    if (!ruhe) return; // erst nach der Öffnungsbewegung (blattRuhe.ts)
    let lebt = true;
    ladeEntscheidManifest().then((m) => {
      if (!lebt) return;
      if (!m) { setFehler(true); return; }
      setAlle(m.entscheide);
    });
    return () => { lebt = false; };
  }, [ruhe]);

  // OHNE Verweis-Einträge (FEINSCHLIFF 24.9.2026, §8): ein Verweis ist das
  // vollständige Urteil zu einem BGE, kein eigener Entscheid — die Rubrikseite
  // zählt ihn nicht mit (`echtAnzahl`) und zeigt ihn in eigener Sektion, die
  // Entscheid-Liste auf «/» lässt ihn weg. Hier standen 1'252 davon als
  // gewöhnliche Treffer (14 gleichlautende Zeilen, «Weitere» zählte sie mit),
  // und ihr Link zeigte auf den Verweis-Schlüssel statt auf das Urteil
  // (`EntscheidZeile`: `verweis.zielKey?ansicht=voll`). Das Urteil selbst ist
  // vom Leitentscheid aus erreichbar.
  const gefiltert = useMemo(() => {
    if (!alle) return [];
    return sortiere(
      filterEntscheide(alle, { q: suche || undefined, nurLeitentscheide: nurLeit || undefined, ebene })
        .filter((e) => !istVolltextVerweis(e)),
      'relevanz',
    );
  }, [alle, suche, nurLeit, ebene]);

  // Neuer Filter/Suchlauf: die Portion beginnt wieder vorn — Muster wie
  // `MaterialienBlatt.tsx`/`pages/Rechtsprechung.tsx::Liste` («adjust state
  // during render» statt `setState` im Effekt, kein Render-Nachlaufen).
  const filterSchluessel = `${suche}|${nurLeit}|${ebene}`;
  const [vorFilterSchluessel, setVorFilterSchluessel] = useState(filterSchluessel);
  if (vorFilterSchluessel !== filterSchluessel) { setVorFilterSchluessel(filterSchluessel); setPortion(PORTION); }

  return (
    <div className="space-y-4">
      <BlattSuchFeld wert={suche} setze={setSuche} label="Rechtsprechung durchsuchen"
        platzhalter="Thema, Aktenzeichen oder BGE-Nummer …" feldRef={feldRef} />
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setNurLeit((v) => !v)} aria-pressed={nurLeit} className="ub-schalter">
          Leitentscheide
        </button>
        <button type="button" onClick={() => setEbene((v) => (v === 'bund' ? null : 'bund'))}
          aria-pressed={ebene === 'bund'} className="ub-schalter">
          Bundesgericht
        </button>
        <button type="button" onClick={() => setEbene((v) => (v === 'kanton' ? null : 'kanton'))}
          aria-pressed={ebene === 'kanton'} className="ub-schalter">
          Kantonal
        </button>
      </div>

      <BlattLaedt laedt={alle === null && !fehler} fehler={fehler} ladetext="Die Sammlung wird abgerufen …"
        fehlertext="Die Rechtsprechungs-Sammlung konnte nicht geladen werden. Bitte die Seite neu laden.">
        {() => (gefiltert.length === 0 ? (
          <Leerzustand art="filter" ansage text="Kein Entscheid gefunden."
            weiterweg={{ text: 'Filter zurücksetzen', onKlick: () => { setSuche(''); setNurLeit(false); setEbene(null); zumFeld(); } }} />
        ) : (
          <div className="space-y-3">
            <TrefferZahl n={gefiltert.length} einzahl="Entscheid" mehrzahl="Entscheide" />
            <div className="divide-y divide-rule-soft border-y border-rule-soft">
              {gefiltert.slice(0, portion).map((e) => (
                <Link key={e.key} to={`/rechtsprechung/${encodeURIComponent(e.key)}`}
                  className={`${TREFFER_ZEILE_RAHMEN} px-1 py-2.5 no-underline lc-hover-flaeche`}>
                  <TrefferZeile
                    titel={themaText(e)}
                    untertitel={`${hauptIdentitaet(e)} · ${e.gerichtName}`}
                    meta={<span>{datumAnzeige(e.datum, e.datumUnbekannt)}</span>}
                  />
                </Link>
              ))}
            </div>
            {gefiltert.length > portion && (
              <WeitereKnopf rest={gefiltert.length - portion} mehr={() => setPortion((p) => p + PORTION)} />
            )}
          </div>
        ))}
      </BlattLaedt>
    </div>
  );
}
