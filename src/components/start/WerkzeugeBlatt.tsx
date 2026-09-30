import { useMemo, useState } from 'react';
import { STARTSEITE_ZAEHLER as z } from '../../data/startseiteZaehler.generated';
import { KATALOG_KARTEN, istVerfuegbar } from '../../lib/startseiteConfig';
import { OBERKATEGORIEN, type OberkategorieId } from '../../lib/oberkategorien';
import { kartenDerKategorie } from '../../lib/katalogKategorie';
import { kartePasst, LEERER_FILTER } from '../../lib/katalogSuche';
import { KategorieSektion } from '../Katalog';
import { WERKZEUGE_RECHNER_KATEGORIEN, WERKZEUGE_VORLAGEN_GEBIETE, type BlattOrt } from '../../lib/startBlatt';
import { Leerzustand } from '../ui/Leerzustand';
import { RubrikKachel } from '../ui/RubrikKachel';
import { BlattSuchFeld, WahlSpalte } from './BlattBausteine';
import { useSuchFokus } from './suchFokus';

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
//
// W2·19 DK-B (30.9.2026, HN-D5/DK-27): «in Vorbereitung» stand hier als
// Klartext in ink-600, im Katalog (`/rechner`, `KategorieSektion`) als Marke
// `lc-badge-geplant` — ein Status, zwei Formen. Jetzt die eine Marke mit dem
// Kanon-Wortlaut «In Vorbereitung» (Wächter design-konsistenz-chips-marken).
// STAND DER MARKE: hinter dem Namen, im Textfluss (`ml-2 align-middle`, wie
// `VorlagenSprung`/`ZustErgebnisEinleitung`), NICHT als rechte Spalte neben ihm:
// gemessen 30.9.2026 verschmälerte die 103-px-Marke (135 px bei Schrift 1.4) die
// Namensspalte @1024/1.4 von 46 auf 23 px (6 → 12 Zeilen, Überlauf 461 → 977 px)
// und @1280/1.4 von 61 auf 38 px — breiter als der 80-px-Klartext davor. Im
// Fluss bricht sie als Ganzes in die nächste Zeile.

const VORLAGEN_KARTEN = kartenDerKategorie(KATALOG_KARTEN, 'vorlagen');
const rechnerZahl = (id: OberkategorieId) => kartenDerKategorie(KATALOG_KARTEN, id).filter(istVerfuegbar).length;
const gebietKarten = (name: string) => VORLAGEN_KARTEN.filter((k) => k.rechtsgebiet === name);
// Kein eigenes `istVorlage` mehr (S5a, 25.9.2026): `kategorieFuer` legt
// `vorlagen` selbst als `istVorlage` fest (oberkategorien.ts, Typ
// `RechnerKategorieId`) — Liste und Zahl lesen dieselbe Quelle.
const vorlagenZahl = (name: string) => gebietKarten(name).filter(istVerfuegbar).length;

function Wahl({ zu }: { zu: (...pfad: string[]) => () => void }) {
  return (
    <div className="lc-start-fuellt grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1.35fr] lg:grid-rows-[auto_minmax(0,1fr)] lg:gap-y-0 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,2fr)] lg:@[44rem]/blatt:grid-cols-[minmax(0,0.8fr)_minmax(0,2fr)]">
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
        {/* U8 (24.9.2026): eine Spalte, auch ab `xl` — zwei Unterspalten
            zerrissen @1440 im Verhältnis 1 : 1.35 («Strafpro-zess», «in
            Vorbereitung» gequetscht); das Blatt scrollte stattdessen.
            S5a (W2·29-WERKBANK-REST, 25.9.2026, Posten U13-Nebenfund):
            gemessen @1440×900 lief die Liste 163 px über das Blatt (14 Zeilen,
            546 px), während unter den drei Rechner-Kategorien ~317 px leer
            blieben. Ab `xl` darum Spaltenverhältnis nach Inhalt (0.8 : 2) UND
            zwei Unterspalten, als Zeitungsspalten (`columns`, Lesefolge
            abwärts), Zeile nie geteilt: Überlauf 0 px @1280×800/1440×900/
            1920×1080; fünf Namen brechen am Wortende auf zwei Zeilen, keiner
            mit Trennstrich. Unter `xl` (1024: Überlauf nur 163 → 9 px, aber neun
            Zeilen auf 2–3 Zeilen gequetscht) bleibt die eine Spalte.
            ERGÄNZT W2·31 P17 (1.10.2026): `xl` (Fenster ≥ 1280) ODER das Blatt selbst
            ≥ 44 rem breit (`lg:@[44rem]/blatt:`, Container `.lc-start-blatt-inhalt`
            in `StartKachelFeld`). Grund: mit Seitenleiste 208 bei Fenster 1100
            ist das Blatt 802 px breit (Seite einspaltig), das Fenster aber < 1280 —
            die Liste blieb einspaltig, 163 px Überlauf. `rem` statt px: die
            Blattbreite ohne Seitenleiste deckelt sich bei 41.9 rem (670 px bei
            Schrift 1, 603 bei 0.9, 737 bei 1.1; 739 px = 38.5 rem bei 1.2 am
            Fenster 1279), die Schwelle liegt darüber, wird also OHNE Seitenleiste
            unter `xl` nirgends erreicht, und wandert mit der Schriftskala mit. */}
        <ul aria-label="Vorlagen nach Rechtsgebiet" className="px-2 xl:columns-2 xl:gap-x-2 lg:@[44rem]/blatt:columns-2 lg:@[44rem]/blatt:gap-x-2">
          {WERKZEUGE_VORLAGEN_GEBIETE.map((g) => {
            const n = vorlagenZahl(g.name);
            return (
              <li key={g.id} className="break-inside-avoid border-t border-rule-soft">
                <button type="button" onClick={zu('vorlagen', g.id)} className="lc-menu-zeile items-baseline whitespace-normal px-2">
                  <span className="min-w-0 flex-1 hyphens-auto break-words leading-snug text-ink-900">
                    {g.name}
                    {n === 0 && <span className="lc-badge-geplant ml-2 align-middle">In Vorbereitung</span>}
                  </span>
                  {n > 0 && <span className="num shrink-0 text-xs text-ink-700">{nf(n)}</span>}
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
  const { feldRef, zumFeld } = useSuchFokus();
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
      <BlattSuchFeld schmal wert={suche} setze={setSuche} label="Rechner filtern" feldRef={feldRef} />
      {kategorien.length === 0
        ? <Leerzustand art="filter" ansage text="Kein Rechner gefunden."
            weiterweg={{ text: 'Suche leeren', onKlick: () => { setSuche(''); zumFeld(); } }} />
        : kategorien.map((kat) => (
            <KategorieSektion key={kat.id} kat={kat} karten={kartenDerKategorie(karten, kat.id)} alleOffen={q !== ''} />
          ))}
    </div>
  );
}

function VorlagenListe() {
  const [suche, setSuche] = useState('');
  const { feldRef, zumFeld } = useSuchFokus();
  const q = suche.trim();
  const basis = useMemo(() => kartenDerKategorie(KATALOG_KARTEN, 'vorlagen'), []);
  const karten = useMemo(
    () => (q === '' ? basis : basis.filter((k) => kartePasst(k, { ...LEERER_FILTER, suche: q }))),
    [basis, q],
  );
  return (
    <div className="space-y-4">
      <BlattSuchFeld schmal wert={suche} setze={setSuche} label="Vorlagen filtern" feldRef={feldRef} />
      {/* Gegenprüfung S2 (24.9.2026): `KategorieSektion` bringt für die
          Kategorie «vorlagen» ein EIGENES Rechtsgebiet-Feld mit, das über
          `setSearchParams` ohne den Blatt-Verlaufsstatus schreibt (verliert
          `blattTiefe`/`blattVonZu`, `useBlattOrt.ts`) — Browser-Zurück öffnete
          das Blatt danach erneut, und es entstand ein zweites Filterfeld
          neben dem Blatt-eigenen `Filter` oben. `ohneGebietsFilter`
          unterdrückt es; die Textsuche oben deckt den Anwendungsfall hier ab. */}
      {karten.length === 0
        ? <Leerzustand art="filter" ansage text="Keine Vorlage gefunden."
            weiterweg={{ text: 'Suche leeren', onKlick: () => { setSuche(''); zumFeld(); } }} />
        : <KategorieSektion kat={VORLAGEN_KATEGORIE} karten={karten} ohneKopf alleOffen={q !== ''} ohneGebietsFilter />}
    </div>
  );
}
