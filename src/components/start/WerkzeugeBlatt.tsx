import { useMemo, useState } from 'react';
import { STARTSEITE_ZAEHLER as z } from '../../data/startseiteZaehler.generated';
import { KATALOG_KARTEN } from '../../lib/startseiteConfig';
import { OBERKATEGORIEN } from '../../lib/oberkategorien';
import { kartenDerKategorie } from '../../lib/katalogKategorie';
import { kartePasst, LEERER_FILTER } from '../../lib/katalogSuche';
import { KategorieSektion } from '../Katalog';
import type { BlattOrt } from '../../lib/startBlatt';
import { RubrikKachel } from '../ui/RubrikKachel';
import { BlattSuchFeld } from './BlattBausteine';

// ─── Startseite · die Stufen der Werkzeuge-Kachel (W2·29-WERKBANK-START S2) ──
//
// Fahrplan §5d S2: «Rechner | Vorlagen → Liste nach Rechtsgebiet aus
// KATALOG_KARTEN (gebaute zuerst, „In Vorbereitung" sichtbar, §8) →
// Werkzeug-Seite.» Zwei Wahlen, je eine Liste — keine weitere Tiefe (die
// letzte Stufe ist die bestehende Produktseite, ein gewöhnlicher Link).
//
// WIEDERVERWENDUNG statt Nachbau (§10): dieselbe Gruppierung wie auf den
// bestehenden Rubrikseiten `/rechner` (RechnerUebersicht.tsx) und `/vorlagen`
// (VorlagenUebersicht.tsx) — `OBERKATEGORIEN` + `KategorieSektion` liefern
// Gebaute-zuerst/«In Vorbereitung» und die Rechtsgebiets-Gruppierung bereits
// fertig (Katalog.tsx). Hier stehen nur die Blatt-Anatomie (Wahl, Filterfeld
// aus `BlattBausteine`) und die Aufteilung Rechner/Vorlagen per `istVorlage`
// (über `kategorieFuer`/`kartenDerKategorie`, dieselbe Quelle wie /rechner
// und /vorlagen — keine eigene, zweite Zuordnung, §5).

const nf = (n: number) => n.toLocaleString('de-CH');

/** Rechner-Kategorien = alle ausser Vorlagen (wie `RechnerUebersicht`). */
const RECHNER_KATEGORIEN = OBERKATEGORIEN.filter((k) => k.id !== 'vorlagen');
/** Vorlagen: EINE Kategorie, deren Register selbst nach Dokument-Gruppe
 *  gliedert (wie `VorlagenUebersicht`). */
const VORLAGEN_KATEGORIE = OBERKATEGORIEN.find((k) => k.id === 'vorlagen')!;

export function WerkzeugeBlatt({ ort, gehe }: { ort: BlattOrt; gehe: (o: BlattOrt) => void }) {
  const [zweig] = ort.pfad;
  const zu = (z: string) => () => gehe({ rubrik: 'werkzeuge', pfad: [z] });
  if (!zweig) return <Wahl zu={zu} />;
  if (zweig === 'rechner') return <RechnerListe />;
  return <VorlagenListe />;
}

function Wahl({ zu }: { zu: (zweig: string) => () => void }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <RubrikKachel reg="w" onWahl={zu('rechner')} titel="Rechner" zahl={nf(z.rechner)}
        einheit="Rechner" nutzen="Nach Rechtsgebiet, dann Werkzeug." />
      <RubrikKachel reg="w" onWahl={zu('vorlagen')} titel="Vorlagen" zahl={nf(z.vorlagen)}
        einheit="Vorlagen" nutzen="Verträge, Eingaben, Erklärungen." />
    </div>
  );
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
