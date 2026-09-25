import { useMemo, useState } from 'react';
import { STARTSEITE_ZAEHLER as z } from '../../data/startseiteZaehler.generated';
import { KATALOG_KARTEN, istVerfuegbar } from '../../lib/startseiteConfig';
import { OBERKATEGORIEN, type OberkategorieId } from '../../lib/oberkategorien';
import { kartenDerKategorie } from '../../lib/katalogKategorie';
import { kartePasst, LEERER_FILTER } from '../../lib/katalogSuche';
import { KategorieSektion } from '../Katalog';
import { WERKZEUGE_RECHNER_KATEGORIEN, WERKZEUGE_VORLAGEN_GEBIETE, type BlattOrt } from '../../lib/startBlatt';
import { RubrikKachel } from '../ui/RubrikKachel';
import { BlattSuchFeld, WahlSpalte } from './BlattBausteine';

// ─── Startseite · die Stufen der Werkzeuge-Kachel (W2·29-WERKBANK-START S2) ──
//
// Fahrplan §5d S2: «Rechner | Vorlagen → Liste nach Rechtsgebiet aus
// KATALOG_KARTEN (gebaute zuerst, „In Vorbereitung" sichtbar, §8) →
// Werkzeug-Seite.» Zwei Wahlen, je eine Liste; die letzte Stufe ist die
// bestehende Produktseite (ein gewöhnlicher Link). Seit U8 (24.9.2026) führt
// die Wahl zusätzlich direkt in EINE Kategorie bzw. EIN Rechtsgebiet (unten).
//
// WIEDERVERWENDUNG statt Nachbau (§10): dieselbe Gruppierung wie auf den
// bestehenden Rubrikseiten `/rechner` (RechnerUebersicht.tsx) und `/vorlagen`
// (VorlagenUebersicht.tsx) — `OBERKATEGORIEN` + `KategorieSektion` liefern
// Gebaute-zuerst/«In Vorbereitung» und die Rechtsgebiets-Gruppierung bereits
// fertig (Katalog.tsx). Hier stehen nur die Blatt-Anatomie (Wahl, Filterfeld
// aus `BlattBausteine`) und die Aufteilung Rechner/Vorlagen über
// `kategorieFuer`/`kartenDerKategorie` (dieselbe Quelle wie /rechner und
// /vorlagen, und `vorlagen` ≡ `istVorlage` — keine zweite Zuordnung, §5).

const nf = (n: number) => n.toLocaleString('de-CH');

/** Rechner-Kategorien = alle ausser Vorlagen (wie `RechnerUebersicht`) —
 *  eine Quelle mit der Blatt-Adresse (`startBlatt.ts`, U8). */
const RECHNER_KATEGORIEN = WERKZEUGE_RECHNER_KATEGORIEN;
/** Vorlagen: EINE Kategorie, deren Register selbst nach Dokument-Gruppe
 *  gliedert (wie `VorlagenUebersicht`). */
const VORLAGEN_KATEGORIE = OBERKATEGORIEN.find((k) => k.id === 'vorlagen')!;

export function WerkzeugeBlatt({ ort, gehe }: { ort: BlattOrt; gehe: (o: BlattOrt) => void }) {
  const [zweig, zweite] = ort.pfad;
  const zu = (...pfad: string[]) => () => gehe({ rubrik: 'werkzeuge', pfad });
  if (!zweig) return <Wahl zu={zu} />;
  if (zweig === 'rechner') return zweite ? <RechnerKategorie id={zweite} /> : <RechnerListe />;
  return zweite ? <VorlagenGebiet id={zweite} /> : <VorlagenListe />;
}

// ─── Stufe «Wahl»: zwei hohe Spalten (START-UEBERARBEITUNG U8, David 24.9.2026)
//
// «mach danach das werkzeuge-blatt gleich wie gesetze»: Vorbild U1 (Gesetze-
// Wahl, `GesetzeBlatt.tsx`). Vorher zwei kleine Kacheln über leerer Fläche.
// Jede Kachel wird eine Spalte über die volle Blatthöhe (`.lc-start-fuellt`,
// index.css, ab `lg`; darunter untereinander), Kopf = die bisherige Kachel
// (Zahl aus dem Zähler) → bisherige Liste; darunter die nächste Stufe als
// eigene Knöpfe — nie ein Knopf im Knopf.
//   · Rechner: die Oberkategorien wie auf /rechner, Zahl = «verfügbar» wie im
//     Kopf der Sektion dort → `rechner/<kategorie>`.
//   · Vorlagen: die Rechtsgebiete des Filters auf /vorlagen, Zahl = verfügbare
//     echte Vorlagen wie dessen Fuss-Zähler (K5) → `vorlagen/<gebiet>`. Ein
//     Gebiet NUR mit geplanten Vorlagen sagt «in Vorbereitung» statt «0» (§8).
// Die Summen sind der Kachel-Zähler (Vitest `start-blatt-adresse`): gezählt,
// nicht behauptet.

const VORLAGEN_KARTEN = kartenDerKategorie(KATALOG_KARTEN, 'vorlagen');
const rechnerZahl = (id: OberkategorieId) => kartenDerKategorie(KATALOG_KARTEN, id).filter(istVerfuegbar).length;
const gebietKarten = (name: string) => VORLAGEN_KARTEN.filter((k) => k.rechtsgebiet === name);
// Kein eigenes `istVorlage` mehr (S5a, 25.9.2026): `kategorieFuer` legt
// `vorlagen` selbst als `istVorlage` fest (oberkategorien.ts, Typ
// `RechnerKategorieId`) — Liste und Zahl lesen dieselbe Quelle.
const vorlagenZahl = (name: string) => gebietKarten(name).filter(istVerfuegbar).length;

function Wahl({ zu }: { zu: (...pfad: string[]) => () => void }) {
  return (
    <div className="lc-start-fuellt grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1.35fr] lg:grid-rows-[auto_minmax(0,1fr)] lg:gap-y-0">
      <WahlSpalte reg="w" kopf={<RubrikKachel reg="w" onWahl={zu('rechner')} titel="Rechner" zahl={nf(z.rechner)} einheit="Rechner" />}>
        <ul aria-label="Rechner nach Kategorie" className="px-2">
          {RECHNER_KATEGORIEN.map((k) => (
            <li key={k.id} className="border-t border-rule-soft">
              <button type="button" onClick={zu('rechner', k.id)} className="lc-menu-zeile items-baseline whitespace-normal px-2">
                <span className="min-w-0 flex-1">
                  <span className="block leading-snug text-ink-900">{k.titel}</span>
                  <span className="block font-sans text-xs leading-snug text-ink-600">{k.lede}</span>
                </span>
                <span className="num shrink-0 text-xs text-ink-700">{nf(rechnerZahl(k.id))}</span>
              </button>
            </li>
          ))}
        </ul>
      </WahlSpalte>
      <WahlSpalte reg="w" kopf={<RubrikKachel reg="w" onWahl={zu('vorlagen')} titel="Vorlagen" zahl={nf(z.vorlagen)} einheit="Vorlagen" />}>
        {/* Eine Spalte, auch ab `xl`: zwei Unterspalten zerrissen @1440
            («Strafpro-zess», «in Vorbereitung» gequetscht — Screenshot U8-Bau);
            das Blatt scrollt stattdessen. */}
        <ul aria-label="Vorlagen nach Rechtsgebiet" className="px-2">
          {WERKZEUGE_VORLAGEN_GEBIETE.map((g) => {
            const n = vorlagenZahl(g.name);
            return (
              <li key={g.id} className="border-t border-rule-soft">
                <button type="button" onClick={zu('vorlagen', g.id)} className="lc-menu-zeile items-baseline whitespace-normal px-2">
                  <span className="min-w-0 flex-1 hyphens-auto break-words leading-snug text-ink-900">{g.name}</span>
                  {n > 0
                    ? <span className="num shrink-0 text-xs text-ink-700">{nf(n)}</span>
                    : <span className="shrink-0 text-xs text-ink-600">in Vorbereitung</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </WahlSpalte>
    </div>
  );
}

/** Stufe `rechner/<kategorie>`: dieselbe Sektion wie auf /rechner, nur diese. */
function RechnerKategorie({ id }: { id: string }) {
  const kat = RECHNER_KATEGORIEN.find((k) => k.id === id);
  if (!kat) return <RechnerListe />;
  return <KategorieSektion kat={kat} karten={kartenDerKategorie(KATALOG_KARTEN, kat.id)} />;
}

/** Stufe `vorlagen/<gebiet>`: dieselbe Sektion wie auf /vorlagen, auf das
 *  Rechtsgebiet geschnitten — ohne ihr eigenes Gebiets-Feld (Begründung bei
 *  `VorlagenListe`); «In Vorbereitung» bleibt sichtbar (§8). */
function VorlagenGebiet({ id }: { id: string }) {
  const gebiet = WERKZEUGE_VORLAGEN_GEBIETE.find((g) => g.id === id);
  if (!gebiet) return <VorlagenListe />;
  return <KategorieSektion kat={VORLAGEN_KATEGORIE} karten={gebietKarten(gebiet.name)} ohneKopf ohneGebietsFilter />;
}

function RechnerListe() {
  const [suche, setSuche] = useState('');
  const q = suche.trim();
  const karten = useMemo(
    () => (q === '' ? KATALOG_KARTEN : KATALOG_KARTEN.filter((k) => kartePasst(k, { ...LEERER_FILTER, suche: q }))),
    [q],
  );
  const kategorien = useMemo(
    () => (q === '' ? RECHNER_KATEGORIEN : RECHNER_KATEGORIEN.filter((kat) => kartenDerKategorie(karten, kat.id).length > 0)),
    [karten, q],
  );
  return (
    <div className="space-y-4">
      <BlattSuchFeld schmal wert={suche} setze={setSuche} label="Rechner filtern" />
      {kategorien.length === 0
        ? <p className="font-sans text-body-s text-ink-600">Kein Rechner passt auf «{q}».</p>
        : kategorien.map((kat) => (
            <KategorieSektion key={kat.id} kat={kat} karten={kartenDerKategorie(karten, kat.id)} alleOffen={q !== ''} />
          ))}
    </div>
  );
}

function VorlagenListe() {
  const [suche, setSuche] = useState('');
  const q = suche.trim();
  const basis = useMemo(() => kartenDerKategorie(KATALOG_KARTEN, 'vorlagen'), []);
  const karten = useMemo(
    () => (q === '' ? basis : basis.filter((k) => kartePasst(k, { ...LEERER_FILTER, suche: q }))),
    [basis, q],
  );
  return (
    <div className="space-y-4">
      <BlattSuchFeld schmal wert={suche} setze={setSuche} label="Vorlagen filtern" />
      {/* Gegenprüfung S2 (24.9.2026): `KategorieSektion` bringt für die
          Kategorie «vorlagen» ein EIGENES Rechtsgebiet-Feld mit, das über
          `setSearchParams` ohne den Blatt-Verlaufsstatus schreibt (verliert
          `blattTiefe`/`blattVonZu`, `useBlattOrt.ts`) — Browser-Zurück öffnete
          das Blatt danach erneut, und es entstand ein zweites Filterfeld
          neben dem Blatt-eigenen `Filter` oben. `ohneGebietsFilter`
          unterdrückt es; die Textsuche oben deckt den Anwendungsfall hier ab. */}
      {karten.length === 0
        ? <p className="font-sans text-body-s text-ink-600">Keine Vorlage passt auf «{q}».</p>
        : <KategorieSektion kat={VORLAGEN_KATEGORIE} karten={karten} ohneKopf alleOffen={q !== ''} ohneGebietsFilter />}
    </div>
  );
}
